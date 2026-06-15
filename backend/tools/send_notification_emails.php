<?php
// One-off / cron-able retry for any notification whose immediate send
// attempt (in config/notify.php) failed — e.g. because SMTP wasn't
// configured yet. Run from the project root:
//   C:/xampp/php/php.exe backend/tools/send_notification_emails.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/mailer.php';

$query = "SELECT n.ID, n.Message, u.Email
          FROM notifications n
          JOIN Users u ON n.UserID = u.ID
          WHERE n.EmailSent = 0 AND u.Email IS NOT NULL AND u.Email <> ''";
$result = mysqli_query($conn, $query);

$sent  = 0;
$total = 0;
while ($row = mysqli_fetch_assoc($result)) {
    $total++;
    if (sendNotificationEmail($row['Email'], 'HelpDesk notification', $row['Message'])) {
        mysqli_query($conn, "UPDATE notifications SET EmailSent = 1 WHERE ID = '{$row['ID']}'");
        $sent++;
    }
}

echo "Sent $sent of $total queued notification email(s).\n";
?>
