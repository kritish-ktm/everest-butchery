<?php
/**
 * Database connection + shared API setup.
 * Edit DB_* constants to match your XAMPP MySQL setup (defaults below
 * match a fresh XAMPP install: user "root", empty password).
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'everest_butchery');
define('DB_USER', 'root');
define('DB_PASS', '');

// Allow the Vite dev server (default port 5173) to call this API during development.
// In production, set this to your real site origin instead of "*".
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed', 'detail' => $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function send(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function fail(string $message, int $code = 400): void {
    send(['error' => $message], $code);
}

/**
 * Reads the "Authorization: Bearer <token>" header, if present.
 */
function bearer_token(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? null;
    if (!$header && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    }
    if (!$header || stripos($header, 'Bearer ') !== 0) return null;
    return trim(substr($header, 7));
}

/**
 * Looks up the admin user for the current request's token.
 * Returns the user row, or null if there's no valid, unexpired token.
 */
function current_admin(): ?array {
    $token = bearer_token();
    if (!$token) return null;

    $stmt = db()->prepare(
        'SELECT u.id, u.full_name, u.email, u.role
         FROM admin_tokens t JOIN users u ON u.id = t.user_id
         WHERE t.token = ? AND t.expires_at > NOW()'
    );
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    return $user ?: null;
}

/**
 * Call at the top of any endpoint (or branch) that should only be
 * reachable by a logged-in admin. Halts the request with 401 otherwise.
 */
function require_admin(): array {
    $user = current_admin();
    if (!$user) fail('Admin login required', 401);
    return $user;
}
