<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Deletes an uploaded product image file from disk, but only if it lives
// inside our own uploads/products/ folder — never touches anything else.
function delete_uploaded_image(?string $imageUrl): void {
    if (!$imageUrl || strpos($imageUrl, 'uploads/products/') !== 0) return;
    $path = __DIR__ . '/../' . $imageUrl;
    $real = realpath($path);
    $uploadsRoot = realpath(__DIR__ . '/../uploads/products');
    if ($real && $uploadsRoot && strpos($real, $uploadsRoot) === 0 && is_file($real)) {
        @unlink($real);
    }
}

if ($method === 'GET') {
    // GET /api/products.php            -> all visible, in-stock products (public menu)
    // GET /api/products.php?id=5       -> single product
    // GET /api/products.php?category=1 -> products in one category
    // GET /api/products.php?include_out_of_stock=1 -> admin view: everything, incl. hidden/out-of-stock
    $pdo = db();

    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare(
            'SELECT p.*, c.name_en AS category_name_en, c.name_np AS category_name_np
             FROM products p JOIN categories c ON c.id = p.category_id
             WHERE p.id = ?'
        );
        $stmt->execute([$_GET['id']]);
        $product = $stmt->fetch();
        if (!$product) fail('Product not found', 404);
        send($product);
    }

    $sql = 'SELECT p.*, c.name_en AS category_name_en, c.name_np AS category_name_np
            FROM products p JOIN categories c ON c.id = p.category_id
            WHERE 1=1';
    $params = [];

    if (isset($_GET['category'])) {
        $sql .= ' AND p.category_id = ?';
        $params[] = $_GET['category'];
    }
    if (isset($_GET['include_out_of_stock'])) {
        require_admin(); // hidden / out-of-stock items are only relevant to shop management
    } else {
        $sql .= ' AND p.in_stock = 1 AND p.is_visible = 1';
    }
    $sql .= ' ORDER BY c.sort_order, p.is_featured DESC, p.name_en';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    send(['products' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    require_admin();
    // Create a product (admin use)
    $data = json_input();
    foreach (['category_id', 'name_en', 'unit', 'price_per_unit'] as $field) {
        if (empty($data[$field]) && $data[$field] !== 0) fail("Missing field: $field");
    }
    $pdo = db();
    $stmt = $pdo->prepare(
        'INSERT INTO products (category_id, name_en, name_np, description, unit, price_per_unit, image_url, is_halal, in_stock, is_visible, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $data['category_id'],
        $data['name_en'],
        $data['name_np'] ?? null,
        $data['description'] ?? null,
        $data['unit'],
        $data['price_per_unit'],
        $data['image_url'] ?? null,
        $data['is_halal'] ?? 1,
        $data['in_stock'] ?? 1,
        $data['is_visible'] ?? 1,
        $data['is_featured'] ?? 0,
    ]);
    send(['id' => (int)$pdo->lastInsertId()], 201);
}

if ($method === 'PUT') {
    require_admin();
    // Update a product (admin use)
    $data = json_input();
    if (empty($data['id'])) fail('Missing field: id');

    $pdo = db();

    // If the image is being changed/cleared, clean up the old file afterward.
    $oldImage = null;
    if (array_key_exists('image_url', $data)) {
        $existing = $pdo->prepare('SELECT image_url FROM products WHERE id = ?');
        $existing->execute([$data['id']]);
        $row = $existing->fetch();
        $oldImage = $row['image_url'] ?? null;
    }

    $fields = ['category_id', 'name_en', 'name_np', 'description', 'unit', 'price_per_unit', 'image_url', 'is_halal', 'in_stock', 'is_visible', 'is_featured'];
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

    $stmt = $pdo->prepare('UPDATE products SET ' . implode(', ', $set) . ' WHERE id = ?');
    $stmt->execute($params);

    if ($oldImage && $oldImage !== ($data['image_url'] ?? null)) {
        delete_uploaded_image($oldImage);
    }

    send(['updated' => true]);
}

if ($method === 'DELETE') {
    require_admin();
    $id = $_GET['id'] ?? null;
    if (!$id) fail('Missing id');
    $pdo = db();

    $existing = $pdo->prepare('SELECT image_url FROM products WHERE id = ?');
    $existing->execute([$id]);
    $row = $existing->fetch();

    $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
    $stmt->execute([$id]);

    if ($row) delete_uploaded_image($row['image_url']);

    send(['deleted' => true]);
}

fail('Method not allowed', 405);
