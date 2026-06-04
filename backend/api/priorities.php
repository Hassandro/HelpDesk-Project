<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

$result = mysqli_query($conn, "SELECT ID, PriorityName FROM Priorities ORDER BY ID");
$priorities = [];
while ($row = mysqli_fetch_assoc($result)) {
    $priorities[] = $row;
}
echo json_encode(["success" => true, "priorities" => $priorities]);
?>
