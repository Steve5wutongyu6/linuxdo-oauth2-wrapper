<?php
$force_strtolower = null;
$force_minlevel = null;
$whitelist_minlevel_username = array();

header('Content-Type: application/json; charset=utf-8');
$targetUrl = "https://connect.linux.do/api/user";
$authHeader = '';

if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
}

if (empty($authHeader)) {
    http_response_code(400);
    echo json_encode(['error' => 'Where is your AUTHORIZATION']);
    exit();
}

$requestHeaders = [
    'Accept: application/json',
    'User-Agent: OAuth-Wrapper-Script/1.0',
    'Authorization: ' . $authHeader
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_HTTPHEADER, $requestHeaders);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    if ($response) {
        echo $response;
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to connect to target API']);
    }
    exit();
}

$data = json_decode($response, true);

if (json_last_error() === JSON_ERROR_NONE) {

    if (isset($_GET["force_strtolower"])) {
        $do_strtolower = true;
    }

    if (isset($force_strtolower)) {
        $do_strtolower = true;
    }

    if (isset($do_strtolower)) {
        if (isset($data['username'])) {
            $data['username'] = strtolower($data['username']);
        }
    }

    if (isset($_GET["force_minlevel"]) && is_numeric($_GET["force_minlevel"])) {
        $min_level = $_GET["force_minlevel"];
    }

    if (isset($force_minlevel) && is_numeric($force_minlevel)) {
        $min_level = $force_minlevel;
    }

    if (isset($min_level)) {
        if (!in_array($data['username'], $whitelist_minlevel_username)) {
            if (isset($data['trust_level']) && is_numeric($data['trust_level'])) {
                if ($data['trust_level'] < $min_level) {
                    http_response_code(403);
                    echo json_encode(['error' => 'User Trust Level does not meet the requirements']);
                    exit();
                }
            }
        }
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid JSON response from target API']);
    exit();
}