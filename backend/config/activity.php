<?php
// Writes one row into the ActivityLogs audit trail.
// $ticketID may be null for actions not tied to a ticket.
function logActivity($conn, $userID, $ticketID, $action, $details = null)
{
    $userID   = (int)$userID;
    $ticketID = $ticketID === null ? "NULL" : (int)$ticketID;
    $action   = mysqli_real_escape_string($conn, $action);
    $details  = $details === null ? "NULL" : "'" . mysqli_real_escape_string($conn, $details) . "'";

    $query = "INSERT INTO ActivityLogs (UserID, TicketID, `ACTION`, Details, `TIMESTAMP`)
              VALUES ('$userID', $ticketID, '$action', $details, NOW())";

    mysqli_query($conn, $query);
}
?>
