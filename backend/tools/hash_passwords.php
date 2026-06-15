<?php
// One-off: bcrypt-hash any plaintext passwords still in the Users table.
// Idempotent — already-hashed rows are skipped. Run from the CLI:
//   C:\xampp\php\php.exe backend\tools\hash_passwords.php
require_once __DIR__ . '/../config/db.php';

$result  = mysqli_query($conn, "SELECT ID, Password FROM Users");
$updated = 0;

while ($row = mysqli_fetch_assoc($result)) {
    $info = password_get_info($row['Password']);
    if ($info['algo']) {
        continue; // already a known hash
    }
    $hash = password_hash($row['Password'], PASSWORD_DEFAULT);
    $id   = (int)$row['ID'];
    $esc  = mysqli_real_escape_string($conn, $hash);
    mysqli_query($conn, "UPDATE Users SET Password = '$esc' WHERE ID = $id");
    $updated++;
}

echo "Hashed $updated password(s).\n";
?>
