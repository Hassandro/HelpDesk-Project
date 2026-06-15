<?php
require_once __DIR__ . '/mailer.php';

// Creates an in-app notification for $userID (optionally tied to a ticket)
// and attempts to email it immediately. If the email attempt fails (e.g. no
// SMTP configured yet), EmailSent stays 0 so tools/send_notification_emails.php
// can retry it later once mail is wired up.
function notifyUser($conn, $userID, $type, $message, $ticketID = null)
{
    $userID    = (int)$userID;
    $typeEsc   = mysqli_real_escape_string($conn, $type);
    $msgEsc    = mysqli_real_escape_string($conn, $message);
    $ticketSQL = $ticketID === null ? "NULL" : (int)$ticketID;

    $query = "INSERT INTO notifications (UserID, TicketID, Type, Message, IsRead, EmailSent, CreatedAt)
              VALUES ('$userID', $ticketSQL, '$typeEsc', '$msgEsc', 0, 0, NOW())";
    if (!mysqli_query($conn, $query)) return;

    $notificationID = mysqli_insert_id($conn);
    $res  = mysqli_query($conn, "SELECT Email FROM Users WHERE ID = '$userID'");
    $user = mysqli_fetch_assoc($res);
    if ($user && $user['Email'] && sendNotificationEmail($user['Email'], 'HelpDesk notification', $message)) {
        mysqli_query($conn, "UPDATE notifications SET EmailSent = 1 WHERE ID = '$notificationID'");
    }
}
?>
