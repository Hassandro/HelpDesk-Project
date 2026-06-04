<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'];
$password = $data['password'];

$query = "SELECT u.ID, u.Name, u.Email, u.IsActive, r.RoleName
          FROM Users u
          JOIN Roles r ON u.RoleID = r.ID
          WHERE u.Email = '$email' AND u.Password = '$password'";

$result = mysqli_query($conn, $query);

if (mysqli_num_rows($result) === 1) {
    $user = mysqli_fetch_assoc($result);

    if (!$user['IsActive']) {
        echo json_encode(["success" => false, "message" => "Your account has been deactivated. Please contact the administrator."]);
        exit();
    }

    // Simple token: base64 encoded user data + secret
    $secret = "helpdesk_secret_key";
    $payload = base64_encode(json_encode([
        "id"   => $user['ID'],
        "name" => $user['Name'],
        "role" => $user['RoleName']
    ]));
    $signature = hash_hmac('sha256', $payload, $secret);
    $token = $payload . '.' . $signature;

    echo json_encode([
        "success" => true,
        "token"   => $token,
        "user"    => [
            "id"   => $user['ID'],
            "name" => $user['Name'],
            "role" => $user['RoleName']
        ]
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid email or password"]);
}
?>