<?php
/**
 * Everest Butchery - Dashain Langur Burja Points Challenge
 *
 * This is a non-wagering loyalty/engagement game.
 * Points have no cash value and cannot be exchanged for money.
 */

require_once __DIR__ . '/config.php';

const RESET_AT = '2026-10-26 00:00:00';
const STARTING_POINTS = 100;
const ROLL_COOLDOWN_SECONDS = 2;

$symbols = ['jhanda', 'burja', 'itta', 'pan', 'hukum', 'chidi'];
$rewards = [0, 5, 10, 20, 35, 50, 100];

function game_setup(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS dashain_game_players (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            player_key CHAR(64) NOT NULL,
            full_name VARCHAR(120) NOT NULL,
            phone VARCHAR(40) NULL,
            points INT NOT NULL DEFAULT 100,
            rounds_played INT NOT NULL DEFAULT 0,
            best_win INT NOT NULL DEFAULT 0,
            last_played DATETIME NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_dashain_player_key (player_key),
            KEY idx_dashain_points (points),
            KEY idx_dashain_updated (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Reset the campaign once the Dashain game period has ended.
    if (new DateTimeImmutable('now') >= new DateTimeImmutable(RESET_AT)) {
        $pdo->exec('TRUNCATE TABLE dashain_game_players');
    }
}

function clean_player_key($value): string
{
    $value = strtolower(trim((string)$value));

    if (!preg_match('/^[a-f0-9]{64}$/', $value)) {
        fail('Invalid player key.', 400);
    }

    return $value;
}

function clean_name($value): string
{
    $name = trim((string)$value);
    $name = preg_replace('/\s+/', ' ', $name);

    if ($name === '' || mb_strlen($name) > 120) {
        fail('Please enter a valid name.', 400);
    }

    return $name;
}

function clean_phone($value): ?string
{
    $phone = trim((string)$value);

    if ($phone === '') {
        return null;
    }

    if (mb_strlen($phone) > 40) {
        fail('Phone number is too long.', 400);
    }

    return $phone;
}

function leaderboard(PDO $pdo): array
{
    $stmt = $pdo->query("
        SELECT
            player_key,
            full_name,
            points,
            rounds_played,
            best_win
        FROM dashain_game_players
        ORDER BY points DESC, best_win DESC, rounds_played ASC, id ASC
        LIMIT 10
    ");

    return $stmt->fetchAll();
}

function player_row(PDO $pdo, string $playerKey): ?array
{
    $stmt = $pdo->prepare("
        SELECT
            id,
            player_key,
            full_name,
            phone,
            points,
            rounds_played,
            best_win,
            last_played,
            created_at,
            updated_at
        FROM dashain_game_players
        WHERE player_key = ?
        LIMIT 1
    ");

    $stmt->execute([$playerKey]);
    $player = $stmt->fetch();

    return $player ?: null;
}

function public_player(array $player): array
{
    return [
        'player_key' => $player['player_key'],
        'full_name' => $player['full_name'],
        'points' => (int)$player['points'],
        'rounds_played' => (int)$player['rounds_played'],
        'best_win' => (int)$player['best_win'],
        'last_played' => $player['last_played'],
    ];
}

try {
    $pdo = db();
    game_setup($pdo);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $playerKey = isset($_GET['player_key'])
            ? clean_player_key($_GET['player_key'])
            : null;

        $player = $playerKey ? player_row($pdo, $playerKey) : null;

        send([
            'ok' => true,
            'player' => $player ? public_player($player) : null,
            'leaderboard' => leaderboard($pdo),
            'starting_points' => STARTING_POINTS,
            'reset_at' => RESET_AT,
            'rewards' => $rewards,
        ]);
    }

    if ($method !== 'POST') {
        fail('Method not allowed.', 405);
    }

    $input = json_input();
    $action = trim((string)($input['action'] ?? ''));

    if ($action === 'register') {
        $playerKey = clean_player_key($input['player_key'] ?? '');
        $fullName = clean_name($input['full_name'] ?? '');
        $phone = clean_phone($input['phone'] ?? '');

        $existing = player_row($pdo, $playerKey);

        if ($existing) {
            send([
                'ok' => true,
                'player' => public_player($existing),
                'leaderboard' => leaderboard($pdo),
                'message' => 'Player already registered.',
            ]);
        }

        $stmt = $pdo->prepare("
            INSERT INTO dashain_game_players
                (player_key, full_name, phone, points)
            VALUES
                (?, ?, ?, ?)
        ");

        $stmt->execute([
            $playerKey,
            $fullName,
            $phone,
            STARTING_POINTS,
        ]);

        $player = player_row($pdo, $playerKey);

        send([
            'ok' => true,
            'player' => public_player($player),
            'leaderboard' => leaderboard($pdo),
            'message' => 'Player registered successfully.',
        ]);
    }

    if ($action === 'roll') {
        $playerKey = clean_player_key($input['player_key'] ?? '');
        $selectedSymbol = strtolower(trim((string)($input['symbol'] ?? '')));

        if (!in_array($selectedSymbol, $symbols, true)) {
            fail('Invalid Langur Burja symbol.', 400);
        }

        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare("
                SELECT *
                FROM dashain_game_players
                WHERE player_key = ?
                LIMIT 1
                FOR UPDATE
            ");
            $stmt->execute([$playerKey]);
            $player = $stmt->fetch();

            if (!$player) {
                $pdo->rollBack();
                fail('Please register before playing.', 400);
            }

            if (!empty($player['last_played'])) {
                $lastPlayed = new DateTimeImmutable($player['last_played']);
                $now = new DateTimeImmutable('now');
                $elapsed = $now->getTimestamp() - $lastPlayed->getTimestamp();

                if ($elapsed < ROLL_COOLDOWN_SECONDS) {
                    $remaining = ROLL_COOLDOWN_SECONDS - $elapsed;
                    $pdo->rollBack();

                    send([
                        'error' => 'Please wait before rolling again.',
                        'cooldown_seconds' => $remaining,
                    ], 429);
                }
            }

            // Six independent dice. Each die produces one of the six symbols.
            $dice = [];
            for ($i = 0; $i < 6; $i++) {
                $dice[] = random_int(0, 5);
            }

            $selectedIndex = array_search($selectedSymbol, $symbols, true);
            $matches = 0;

            foreach ($dice as $dieValue) {
                if ($dieValue === $selectedIndex) {
                    $matches++;
                }
            }

            $earned = $rewards[$matches];

            $newPoints = (int)$player['points'] + $earned;
            $newRounds = (int)$player['rounds_played'] + 1;
            $newBest = max((int)$player['best_win'], $earned);

            $update = $pdo->prepare("
                UPDATE dashain_game_players
                SET
                    points = ?,
                    rounds_played = ?,
                    best_win = ?,
                    last_played = NOW()
                WHERE id = ?
            ");

            $update->execute([
                $newPoints,
                $newRounds,
                $newBest,
                $player['id'],
            ]);

            $pdo->commit();

            $updatedPlayer = player_row($pdo, $playerKey);

            send([
                'ok' => true,
                'player' => public_player($updatedPlayer),
                'dice' => $dice,
                'matches' => $matches,
                'earned' => $earned,
                'selected_symbol' => $selectedSymbol,
                'leaderboard' => leaderboard($pdo),
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $e;
        }
    }

    fail('Unknown action.', 400);
} catch (Throwable $e) {
    error_log('Langur Burja API error: ' . $e->getMessage());

    if ($e instanceof PDOException) {
        fail('Database error. Please check your MySQL configuration.', 500);
    }

    fail('Something went wrong while processing the game.', 500);
}
