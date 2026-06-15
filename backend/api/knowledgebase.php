<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/activity.php';

$method = $_SERVER['REQUEST_METHOD'];
$data   = json_decode(file_get_contents("php://input"), true);

// GET / SEARCH published articles (available to every role for self-service)
if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $where  = '';
    if ($search !== '') {
        $esc   = mysqli_real_escape_string($conn, $search);
        $where = "WHERE kb.Title LIKE '%$esc%' OR kb.Problem LIKE '%$esc%'
                        OR kb.Solution LIKE '%$esc%' OR c.CategoryName LIKE '%$esc%'";
    }

    $query = "SELECT kb.ID, kb.TicketID, kb.Title, kb.Problem, kb.Solution, kb.PublishedAt,
                     c.CategoryName, u.Name AS PublishedByName
              FROM KnowledgeBase kb
              LEFT JOIN Categories c ON kb.CategoryID = c.ID
              LEFT JOIN Users u      ON kb.PublishedBy = u.ID
              $where
              ORDER BY kb.PublishedAt DESC";
    $result = mysqli_query($conn, $query);
    $articles = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $articles[] = $row;
    }
    echo json_encode(["success" => true, "articles" => $articles]);
    exit();
}

// POST publishes a closed ticket as a KB article (manager/admin action)
if ($method === 'POST') {
    $ticketID = (int)($data['ticketID'] ?? 0);
    $title    = mysqli_real_escape_string($conn, $data['title'] ?? '');
    $solution = mysqli_real_escape_string($conn, $data['solution'] ?? '');
    $userID   = (int)($data['userID'] ?? 0);

    $tRes = mysqli_query($conn, "SELECT Description, CategoryID, StatusID, Title FROM Tickets WHERE ID = '$ticketID'");
    $t    = mysqli_fetch_assoc($tRes);
    if (!$t) {
        echo json_encode(["success" => false, "message" => "Ticket not found"]);
        exit();
    }
    if ((int)$t['StatusID'] !== 4) {
        echo json_encode(["success" => false, "message" => "Only closed tickets can be published to the knowledge base"]);
        exit();
    }

    $problem    = mysqli_real_escape_string($conn, $t['Description']);
    $categoryID = (int)$t['CategoryID'];
    if ($title === '') $title = mysqli_real_escape_string($conn, $t['Title']);

    $query = "INSERT INTO KnowledgeBase (TicketID, Title, Problem, Solution, CategoryID, PublishedBy)
              VALUES ('$ticketID', '$title', '$problem', '$solution', '$categoryID', '$userID')
              ON DUPLICATE KEY UPDATE Title = VALUES(Title), Solution = VALUES(Solution), PublishedAt = NOW()";

    if (mysqli_query($conn, $query)) {
        logActivity($conn, $userID, $ticketID, 'kb_published', "Published as knowledge base article: \"$title\"");
        echo json_encode(["success" => true, "message" => "Published to knowledge base"]);
    } else {
        echo json_encode(["success" => false, "message" => mysqli_error($conn)]);
    }
    exit();
}

// DELETE removes a ticket's KB article (manager/admin action)
if ($method === 'DELETE') {
    $ticketID = (int)($data['ticketID'] ?? 0);
    if (mysqli_query($conn, "DELETE FROM KnowledgeBase WHERE TicketID = '$ticketID'")) {
        echo json_encode(["success" => true, "message" => "Removed from knowledge base"]);
    } else {
        echo json_encode(["success" => false, "message" => mysqli_error($conn)]);
    }
    exit();
}
?>
