<?php
require_once __DIR__ . '/config.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    fail('Method not allowed', 405);
}

$pdo = db();
$today = new DateTimeImmutable('today');
$from = $_GET['from'] ?? $today->modify('-6 days')->format('Y-m-d');
$to = $_GET['to'] ?? $today->format('Y-m-d');

$fromDate = DateTimeImmutable::createFromFormat('!Y-m-d', $from);
$toDate = DateTimeImmutable::createFromFormat('!Y-m-d', $to);
if (!$fromDate || !$toDate || $fromDate > $toDate) {
    fail('Use a valid date range with from before to');
}

$fromValue = $fromDate->format('Y-m-d');
$toValue = $toDate->format('Y-m-d');

$summary = $pdo->prepare(
    "SELECT
        COUNT(*) AS orders,
        COALESCE(SUM(o.total), 0) AS sales,
        COALESCE(AVG(o.total), 0) AS average_order
     FROM orders o
     WHERE o.created_at >= ?
       AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
       AND o.status <> 'cancelled'"
);
$summary->execute([$fromValue, $toValue]);
$summaryRow = $summary->fetch() ?: [];

$items = $pdo->prepare(
    "SELECT COALESCE(SUM(oi.quantity), 0) AS items_sold
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.created_at >= ?
       AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
       AND o.status <> 'cancelled'"
);
$items->execute([$fromValue, $toValue]);
$itemsRow = $items->fetch() ?: [];

$daily = $pdo->prepare(
    "SELECT
        DATE(o.created_at) AS day,
        COUNT(DISTINCT o.id) AS orders,
        COALESCE(SUM(o.total), 0) AS sales
     FROM orders o
     WHERE o.created_at >= ?
       AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
       AND o.status <> 'cancelled'
     GROUP BY DATE(o.created_at)
     ORDER BY day"
);
$daily->execute([$fromValue, $toValue]);
$rows = $daily->fetchAll();

$customers = $pdo->prepare(
    "SELECT
        c.id,
        c.full_name,
        c.phone,
        COUNT(o.id) AS orders,
        COALESCE(SUM(o.total), 0) AS sales
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE o.created_at >= ?
       AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
       AND o.status <> 'cancelled'
     GROUP BY c.id, c.full_name, c.phone
     ORDER BY sales DESC, orders DESC
     LIMIT 6"
);
$customers->execute([$fromValue, $toValue]);
$customerRows = $customers->fetchAll();

$products = $pdo->prepare(
    "SELECT
        oi.product_name,
        COALESCE(SUM(oi.quantity), 0) AS quantity,
        COALESCE(SUM(oi.line_total), 0) AS sales
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.created_at >= ?
       AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
       AND o.status <> 'cancelled'
     GROUP BY oi.product_name
     ORDER BY sales DESC, quantity DESC
     LIMIT 6"
);
$products->execute([$fromValue, $toValue]);
$productRows = $products->fetchAll();

function grouped_counts(PDO $pdo, string $column, string $fromValue, string $toValue): array {
    $allowed = ['fulfillment', 'payment_method', 'status', 'source'];
    if (!in_array($column, $allowed, true)) return [];

    $stmt = $pdo->prepare(
        "SELECT COALESCE($column, 'unknown') AS report_key, COUNT(*) AS count
         FROM orders
         WHERE created_at >= ?
           AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
           AND status <> 'cancelled'
         GROUP BY COALESCE($column, 'unknown')
         ORDER BY count DESC, report_key"
    );
    $stmt->execute([$fromValue, $toValue]);
    return array_map(fn($row) => [
        'key' => $row['report_key'],
        'count' => (int)$row['count'],
    ], $stmt->fetchAll());
}

$seriesByDay = [];
foreach ($rows as $row) {
    $seriesByDay[$row['day']] = [
        'date' => $row['day'],
        'label' => date('D, M j', strtotime($row['day'])),
        'orders' => (int)$row['orders'],
        'sales' => round((float)$row['sales'], 2),
    ];
}

$series = [];
for ($date = $fromDate; $date <= $toDate; $date = $date->modify('+1 day')) {
    $key = $date->format('Y-m-d');
    $series[] = $seriesByDay[$key] ?? [
        'date' => $key,
        'label' => $date->format('D, M j'),
        'orders' => 0,
        'sales' => 0,
    ];
}

send([
    'range' => ['from' => $fromValue, 'to' => $toValue],
    'summary' => [
        'orders' => (int)($summaryRow['orders'] ?? 0),
        'sales' => round((float)($summaryRow['sales'] ?? 0), 2),
        'average_order' => round((float)($summaryRow['average_order'] ?? 0), 2),
        'items_sold' => round((float)($itemsRow['items_sold'] ?? 0), 3),
    ],
    'series' => $series,
    'reports' => [
        'top_customers' => array_map(fn($row) => [
            'id' => (int)$row['id'],
            'full_name' => $row['full_name'],
            'phone' => $row['phone'],
            'orders' => (int)$row['orders'],
            'sales' => round((float)$row['sales'], 2),
        ], $customerRows),
        'top_products' => array_map(fn($row) => [
            'product_name' => $row['product_name'],
            'quantity' => round((float)$row['quantity'], 3),
            'sales' => round((float)$row['sales'], 2),
        ], $productRows),
        'fulfillment' => grouped_counts($pdo, 'fulfillment', $fromValue, $toValue),
        'payment_methods' => grouped_counts($pdo, 'payment_method', $fromValue, $toValue),
        'statuses' => grouped_counts($pdo, 'status', $fromValue, $toValue),
        'sources' => grouped_counts($pdo, 'source', $fromValue, $toValue),
    ],
]);
