<?php
$host = "127.0.0.1";
$user = "root";
$password = "";
$database = "helpdesk";

$conn = mysqli_connect($host, $user, $password, $database);

if (!$conn) {
    die(json_encode(["error" => "Database connection failed: " . mysqli_connect_error()]));
}
?>