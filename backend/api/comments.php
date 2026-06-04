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

$method = $_SERVER['REQUEST_METHOD'];
$data   = json_decode(file_get_contents("php://input"), true);

// GET COMMENTS FOR A TICKET
if ($method === 'GET') {
    $ticketID = $_GET['ticketID'];
    $query    = "SELECT tc.ID, tc.CommentText, tc.CreatedAt, u.Name AS AuthorName
                 FROM TicketComments tc
                 JOIN Users u ON tc.UserID = u.ID
                 WHERE tc.TicketID = '$ticketID'
                 ORDER BY tc.CreatedAt ASC";

    $result   = mysqli_query($conn, $query);
    $comments = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $comments[] = $row;
    }
    echo json_encode(["success" => true, "comments" => $comments]);
}

// ADD COMMENT
if ($method === 'POST') {
    $ticketID   = $data['ticketID'];
    $userID     = $data['userID'];
    $commentText = $data['commentText'];

    $query = "INSERT INTO TicketComments (TicketID, UserID, CommentText)
              VALUES ('$ticketID', '$userID', '$commentText')";

    if (mysqli_query($conn, $query)) {
        echo json_encode(["success" => true, "message" => "Comment added"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to add comment"]);
    }
}
?>