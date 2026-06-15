<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PATCH, DELETE");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET ALL USERS or FILTER BY ROLE
if ($method === 'GET') {
    $role = $_GET['role'] ?? null;

    if ($role) {
        $query = "SELECT u.ID, u.Name, u.Email, u.IsActive, r.RoleName
                  FROM Users u
                  JOIN Roles r ON u.RoleID = r.ID
                  WHERE r.RoleName = '$role' AND u.IsActive = 1";
    } else {
        $query = "SELECT u.ID, u.Name, u.Email, u.IsActive, r.RoleName
                  FROM Users u
                  JOIN Roles r ON u.RoleID = r.ID
                  ORDER BY r.RoleName, u.Name";
    }

    $result = mysqli_query($conn, $query);
    if (!$result) {
        echo json_encode(["success" => false, "message" => mysqli_error($conn)]);
        exit();
    }
    $users = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $users[] = $row;
    }
    echo json_encode(["success" => true, "users" => $users]);
}

// CREATE USER (admin only)
if ($method === 'POST') {
    $data     = json_decode(file_get_contents("php://input"), true);
    $name     = mysqli_real_escape_string($conn, $data['name']);
    $email    = mysqli_real_escape_string($conn, $data['email']);
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    $roleID   = (int)$data['roleID'];

    $query = "INSERT INTO Users (Name, Email, Password, RoleID, IsActive)
              VALUES ('$name', '$email', '$password', '$roleID', 1)";

    if (mysqli_query($conn, $query)) {
        echo json_encode(["success" => true, "message" => "User created successfully"]);
    } else {
        $err = mysqli_error($conn);
        $message = strpos($err, 'Duplicate') !== false ? "Email already exists" : $err;
        echo json_encode(["success" => false, "message" => $message]);
    }
}

// TOGGLE ACTIVATE / DEACTIVATE USER
if ($method === 'PATCH') {
    $data     = json_decode(file_get_contents("php://input"), true);
    $userID   = $data['userID'];
    $isActive = $data['isActive'] ? 1 : 0;

    $query = "UPDATE Users SET IsActive = $isActive WHERE ID = '$userID'";

    if (mysqli_query($conn, $query)) {
        $status = $isActive ? "activated" : "deactivated";
        echo json_encode(["success" => true, "message" => "User $status"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update user"]);
    }
}

// DELETE USER (admin only)
if ($method === 'DELETE') {
    $data   = json_decode(file_get_contents("php://input"), true);
    $userID = $data['userID'];

    $query = "DELETE FROM Users WHERE ID = '$userID'";

    if (mysqli_query($conn, $query)) {
        echo json_encode(["success" => true, "message" => "User deleted"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete user"]);
    }
}
?>
