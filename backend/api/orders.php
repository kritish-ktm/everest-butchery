<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = db();

function generate_order_number(PDO $pdo): string {
    $today = date('Ymd');
    $stmt = $pdo->prepare("SELECT COUNT(*) c FROM orders WHERE order_number LIKE ?");
    $stmt->execute(["EB-$today-%"]);
    $count = (int)$stmt->fetch()['c'] + 1;
    return sprintf('EB-%s-%04d', $today, $count);
}

function generate_dashain_order_number(PDO $pdo, string $customerName): string {
    $letters = preg_replace('/[^A-Za-z0-9]/', '', $customerName) ?: 'CUS';
    $customerCode = strtoupper(substr($letters, 0, 3));

    do {
        $uniqueId = strtoupper(bin2hex(random_bytes(3)));
        $orderNumber = "DASH-$customerCode-$uniqueId";
        $stmt = $pdo->prepare('SELECT id FROM orders WHERE order_number = ? LIMIT 1');
        $stmt->execute([$orderNumber]);
    } while ($stmt->fetch());

    return $orderNumber;
}

if ($method === 'GET') {
    // GET /api/orders.php            -> list orders (admin/POS), newest first
    // GET /api/orders.php?id=12      -> one order with its items
    // GET /api/orders.php?status=pending
    // Order data includes customer names/phones/addresses - admin only.
    require_admin();

    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare('SELECT o.*, c.full_name, c.phone, c.email, c.address, c.postal_code, c.city
                                FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
                                WHERE o.id = ?');
        $stmt->execute([$_GET['id']]);
        $order = $stmt->fetch();
        if (!$order) fail('Order not found', 404);

        $items = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ?');
        $items->execute([$_GET['id']]);
        $order['items'] = $items->fetchAll();
        send($order);
    }

    $sql = 'SELECT o.*, c.full_name, c.phone FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE 1=1';
    $params = [];
    if (isset($_GET['status'])) {
        $sql .= ' AND o.status = ?';
        $params[] = $_GET['status'];
    }
    if (isset($_GET['source'])) {
        $sql .= ' AND o.source = ?';
        $params[] = $_GET['source'];
    }
    $sql .= ' ORDER BY o.created_at DESC LIMIT 200';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    send(['orders' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    // Create an order (used by both the customer checkout flow and the POS till).
    // Expected JSON body:
    // {
    //   "source": "online" | "pos",
    //   "fulfillment": "pickup" | "delivery",
    //   "payment_method": "cash" | "card" | "mobilepay" | "online",
    //   "customer": { "full_name", "phone", "email", "address", "postal_code", "city" },
    //   "items": [ { "product_id": 1, "quantity": 1.5 }, ... ],
    //   "requested_time": "2026-08-23 17:00:00",
    //   "notes": "..."
    // }
    $data = json_input();

    if (empty($data['items']) || !is_array($data['items'])) fail('Order must include at least one item');

    $customer = is_array($data['customer'] ?? null) ? $data['customer'] : [];
    if (!empty($data['google_credential'])) {
        $googleIdentity = google_identity_from_token((string)$data['google_credential']);
        if (!$googleIdentity) fail('Google identity could not be validated', 401);
        if (!empty($googleIdentity['name'])) $customer['full_name'] = $googleIdentity['name'];
        $customer['email'] = $googleIdentity['email'];
    }

    if (empty($customer['full_name']) || empty($customer['phone'])) {
        fail('Customer name and phone are required');
    }

    try {
        $pdo->beginTransaction();

        // Find or create the customer by phone number.
        $cust = $pdo->prepare('SELECT id FROM customers WHERE phone = ? LIMIT 1');
        $cust->execute([$data['customer']['phone']]);
        $existing = $cust->fetch();

        if ($existing) {
            $customerId = $existing['id'];
        } else {
            $insertCust = $pdo->prepare(
                'INSERT INTO customers (full_name, phone, email, address, postal_code, city) VALUES (?, ?, ?, ?, ?, ?)'
            );
            $insertCust->execute([
                $customer['full_name'],
                $customer['phone'],
                $customer['email'] ?? null,
                $customer['address'] ?? null,
                $customer['postal_code'] ?? null,
                $customer['city'] ?? null,
            ]);
            $customerId = $pdo->lastInsertId();
        }

        // Price the line items server-side from the current product prices (never trust client prices).
        $subtotal = 0;
        $lineItems = [];
        $productStmt = $pdo->prepare('SELECT * FROM products WHERE id = ? FOR UPDATE');
        $reserveStock = $pdo->prepare('UPDATE products SET stock_quantity = stock_quantity - ?, in_stock = (stock_quantity > 0) WHERE id = ?');

        foreach ($data['items'] as $item) {
            if (empty($item['product_id']) || empty($item['quantity'])) fail('Each item needs product_id and quantity');
            $productStmt->execute([$item['product_id']]);
            $product = $productStmt->fetch();
            if (!$product) fail('Product not found: ' . $item['product_id']);
            if (!$product['in_stock']) fail($product['name_en'] . ' is currently out of stock');

            $qty = (float)$item['quantity'];
            $step = $product['unit'] === 'kg' ? 0.25 : 1;
            if (!is_finite($qty) || $qty <= 0 || $qty > 1000 || abs($qty / $step - round($qty / $step)) > 0.000001) throw new RuntimeException('Invalid quantity for ' . $product['name_en']);
            $tracked = $product['stock_quantity'] !== null;
            if ($tracked) {
                if ((float)$product['stock_quantity'] < $qty) throw new RuntimeException('Insufficient stock for ' . $product['name_en'] . '. Please update your cart.');
                $reserveStock->execute([$qty, $product['id']]);
            }
            $lineTotal = round($qty * (float)$product['price_per_unit'], 2);
            $subtotal += $lineTotal;

            $lineItems[] = [
                'product_id' => $product['id'],
                'product_name' => $product['name_en'],
                'quantity' => $qty,
                'unit' => $product['unit'],
                'unit_price' => $product['price_per_unit'],
                'line_total' => $lineTotal,
                'stock_reserved' => $tracked ? $qty : 0,
            ];
        }

        $fulfillment = $data['fulfillment'] ?? 'pickup';
        $deliveryFee = ($fulfillment === 'delivery') ? 39.00 : 0.00; // flat fee; adjust as needed
        $total = round($subtotal + $deliveryFee, 2);
        $isDashain = strtolower((string)($data['campaign'] ?? '')) === 'dashain';
        $orderNumber = $isDashain
            ? generate_dashain_order_number($pdo, (string)$data['customer']['full_name'])
            : generate_order_number($pdo);

        $insertOrder = $pdo->prepare(
            'INSERT INTO orders (order_number, source, customer_id, fulfillment, status, payment_method, payment_status, subtotal, delivery_fee, total, requested_time, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $source = $data['source'] ?? 'online';
        $insertOrder->execute([
            $orderNumber,
            $source,
            $customerId,
            $fulfillment,
            $source === 'pos' ? 'completed' : 'pending',
            $data['payment_method'] ?? null,
            $source === 'pos' ? 'paid' : 'unpaid',
            $subtotal,
            $deliveryFee,
            $total,
            $data['requested_time'] ?? null,
            $data['notes'] ?? null,
        ]);
        $orderId = $pdo->lastInsertId();

        $insertItem = $pdo->prepare(
            'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit, unit_price, line_total, stock_reserved)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($lineItems as $li) {
            $insertItem->execute([
                $orderId, $li['product_id'], $li['product_name'], $li['quantity'], $li['unit'], $li['unit_price'], $li['line_total'], $li['stock_reserved'],
            ]);
        }

        $pdo->commit();
        send([
            'id' => (int)$orderId,
            'order_number' => $orderNumber,
            'subtotal' => $subtotal,
            'delivery_fee' => $deliveryFee,
            'total' => $total,
        ], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        fail('Could not create order: ' . $e->getMessage(), 500);
    }
}

if ($method === 'PUT') {
    require_admin();
    // Update order status (admin/POS) - { "id": 12, "status": "confirmed" }
    $data = json_input();
    if (empty($data['id'])) fail('Missing field: id');

    $fields = ['status', 'payment_status', 'payment_method', 'notes'];
    $set = [];
    $params = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $data)) {
            $set[] = "$f = ?";
            $params[] = $data[$f];
        }
    }
    if (!$set) fail('No fields to update');
    $params[] = $data['id'];

    try {
        $pdo->beginTransaction();
        $orderStmt = $pdo->prepare('SELECT status FROM orders WHERE id = ? FOR UPDATE');
        $orderStmt->execute([$data['id']]);
        $order = $orderStmt->fetch();
        if (!$order) throw new RuntimeException('Order not found');
        $nextStatus = $data['status'] ?? $order['status'];
        if (($order['status'] === 'cancelled') !== ($nextStatus === 'cancelled')) {
            $itemsStmt = $pdo->prepare('SELECT product_id, SUM(stock_reserved) quantity FROM order_items WHERE order_id = ? AND stock_reserved > 0 GROUP BY product_id ORDER BY product_id');
            $itemsStmt->execute([$data['id']]);
            $stockStmt = $pdo->prepare('SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE');
            foreach ($itemsStmt->fetchAll() as $item) {
                $stockStmt->execute([$item['product_id']]);
                $product = $stockStmt->fetch();
                if ($product['stock_quantity'] === null) continue;
                if ($nextStatus === 'cancelled') {
                    $adjust = $pdo->prepare('UPDATE products SET in_stock = (in_stock OR stock_quantity = 0), stock_quantity = stock_quantity + ? WHERE id = ?');
                    $adjust->execute([$item['quantity'], $item['product_id']]);
                } else {
                    if ((float)$product['stock_quantity'] < (float)$item['quantity']) throw new RuntimeException('Insufficient stock to reopen this order');
                    $adjust = $pdo->prepare('UPDATE products SET stock_quantity = stock_quantity - ?, in_stock = (in_stock AND stock_quantity > 0) WHERE id = ?');
                    $adjust->execute([$item['quantity'], $item['product_id']]);
                }
            }
        }
        $stmt = $pdo->prepare('UPDATE orders SET ' . implode(', ', $set) . ' WHERE id = ?');
        $stmt->execute($params);
        $pdo->commit();
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        fail('Could not update order: ' . $e->getMessage(), 409);
    }
    send(['updated' => true]);
}

fail('Method not allowed', 405);
