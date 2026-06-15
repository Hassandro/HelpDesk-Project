<?php
// Thin wrapper around mail delivery so notification emails can be switched
// from PHP's mail() to SMTP/PHPMailer later without touching call sites.
// Returns true only if the message was handed off successfully.
function sendNotificationEmail($toEmail, $subject, $body)
{
    if (!$toEmail) return false;
    $headers = "Content-Type: text/plain; charset=UTF-8\r\nFrom: helpdesk@localhost\r\n";
    return @mail($toEmail, $subject, $body, $headers);
}
?>
