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

if ($method === 'GET') {
    // GET /api/orders.php            -> list orders (admin/POS), newest first
    // GET /api/orders.php?id=12      -> one order with its items
    // GET /api/orders.php?status=pending
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
    if (empty($data['customer']['full_name']) || empty($data['customer']['phone'])) {
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
                $data['customer']['full_name'],
                $data['customer']['phone'],
                $data['customer']['email'] ?? null,
                $data['customer']['address'] ?? null,
                $data['customer']['postal_code'] ?? null,
                $data['customer']['city'] ?? null,
            ]);
            $customerId = $pdo->lastInsertId();
        }

        // Price the line items server-side from the current product prices (never trust client prices).
        $subtotal = 0;
        $lineItems = [];
        $productStmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');

        foreach ($data['items'] as $item) {
            if (empty($item['product_id']) || empty($item['quantity'])) fail('Each item needs product_id and quantity');
            $productStmt->execute([$item['product_id']]);
            $product = $productStmt->fetch();
            if (!$product) fail('Product not found: ' . $item['product_id']);
            if (!$product['in_stock']) fail($product['name_en'] . ' is currently out of stock');

            $qty = (float)$item['quantity'];
            $lineTotal = round($qty * (float)$product['price_per_unit'], 2);
            $subtotal += $lineTotal;

            $lineItems[] = [
                'product_id' => $product['id'],
                'product_name' => $product['name_en'],
                'quantity' => $qty,
                'unit' => $product['unit'],
                'unit_price' => $product['price_per_unit'],
                'line_total' => $lineTotal,
            ];
        }

        $fulfillment = $data['fulfillment'] ?? 'pickup';
        $deliveryFee = ($fulfillment === 'delivery') ? 39.00 : 0.00; // flat fee; adjust as needed
        $total = round($subtotal + $deliveryFee, 2);
        $orderNumber = generate_order_number($pdo);

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
            'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit, unit_price, line_total)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($lineItems as $li) {
            $insertItem->execute([
                $orderId, $li['product_id'], $li['product_name'], $li['quantity'], $li['unit'], $li['unit_price'], $li['line_total'],
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
    // Update order status (admin/POS) — { "id": 12, "status": "confirmed" }
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

    $stmt = $pdo->prepare('UPDATE orders SET ' . implode(', ', $set) . ' WHERE id = ?');
    $stmt->execute($params);
    send(['updated' => true]);
}

fail('Method not allowed', 405);
