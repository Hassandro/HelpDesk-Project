<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/activity.php';
require_once __DIR__ . '/../config/notify.php';

$method      = $_SERVER['REQUEST_METHOD'];
$UPLOAD_CFG  = require __DIR__ . '/../config/uploads.php';
$UPLOAD_DIR  = $UPLOAD_CFG['UPLOAD_BASE'];
$MAX_BYTES   = $UPLOAD_CFG['MAX_FILE_SIZE'];
$ALLOWED     = $UPLOAD_CFG['ALLOWED_TYPES']; // extension => MIME type

// DOWNLOAD a single file, or LIST a ticket's attachments
if ($method === 'GET') {
    // ?download=ID streams the file
    if (isset($_GET['download'])) {
        $id  = (int)$_GET['download'];
        $res = mysqli_query($conn, "SELECT FileName, StoredName, FileType FROM TicketAttachments WHERE ID = '$id'");
        $a   = mysqli_fetch_assoc($res);
        if (!$a || !$a['StoredName'] || !file_exists($UPLOAD_DIR . $a['StoredName'])) {
            http_response_code(404);
            header("Content-Type: application/json");
            echo json_encode(["success" => false, "message" => "File not found"]);
            exit();
        }
        header("Content-Type: " . ($a['FileType'] ?: 'application/octet-stream'));
        header('Content-Disposition: attachment; filename="' . basename($a['FileName']) . '"');
        header("Content-Length: " . filesize($UPLOAD_DIR . $a['StoredName']));
        readfile($UPLOAD_DIR . $a['StoredName']);
        exit();
    }

    // ?ticketID=N lists metadata
    header("Content-Type: application/json");
    $ticketID = (int)($_GET['ticketID'] ?? 0);
    $query = "SELECT a.ID, a.FileName, a.FileType, a.FileSize, a.UploadedAt, u.Name AS UploaderName
              FROM TicketAttachments a
              LEFT JOIN Users u ON a.UploadedBy = u.ID
              WHERE a.TicketID = '$ticketID'
              ORDER BY a.UploadedAt ASC, a.ID ASC";
    $result = mysqli_query($conn, $query);
    $files  = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $files[] = $row;
    }
    echo json_encode(["success" => true, "attachments" => $files]);
    exit();
}

// UPLOAD (multipart/form-data)
if ($method === 'POST') {
    header("Content-Type: application/json");

    $ticketID = (int)($_POST['ticketID'] ?? 0);
    $userID   = (int)($_POST['userID'] ?? 0);

    if (!$ticketID || !isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(["success" => false, "message" => "No file received"]);
        exit();
    }

    $file = $_FILES['file'];
    if ($file['size'] > $MAX_BYTES) {
        $mb = round($MAX_BYTES / (1024 * 1024), 1);
        echo json_encode(["success" => false, "message" => "File exceeds the {$mb} MB limit"]);
        exit();
    }

    $original = basename($file['name']);
    $ext      = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    if (!array_key_exists($ext, $ALLOWED)) {
        echo json_encode(["success" => false, "message" => "File type not allowed. Only PNG, Excel, and PowerPoint files are accepted."]);
        exit();
    }

    // Virtual path: each ticket gets its own subfolder under UPLOAD_BASE.
    $relDir = "tickets/$ticketID";
    $fullDir = $UPLOAD_DIR . $relDir;
    if (!is_dir($fullDir)) {
        mkdir($fullDir, 0755, true);
    }

    $storedName = 'att_' . uniqid('', true) . '.' . $ext;
    $relPath    = "$relDir/$storedName";
    if (!move_uploaded_file($file['tmp_name'], $UPLOAD_DIR . $relPath)) {
        echo json_encode(["success" => false, "message" => "Failed to store file"]);
        exit();
    }

    $fnEsc   = mysqli_real_escape_string($conn, $original);
    $snEsc   = mysqli_real_escape_string($conn, $relPath);
    $typeEsc = mysqli_real_escape_string($conn, $ALLOWED[$ext]);
    $size    = (int)$file['size'];

    $query = "INSERT INTO TicketAttachments (TicketID, FileName, StoredName, FileType, FileSize, UploadedBy)
              VALUES ('$ticketID', '$fnEsc', '$snEsc', '$typeEsc', '$size', '$userID')";

    if (mysqli_query($conn, $query)) {
        logActivity($conn, $userID, $ticketID, 'attachment', "Uploaded $original");

        // Notify the other people on this ticket (creator + assigned agent).
        $tRes = mysqli_query($conn, "SELECT Title, CreatedBy, AssignedTo FROM Tickets WHERE ID = '$ticketID'");
        $t    = mysqli_fetch_assoc($tRes);
        if ($t) {
            $recipients = array_unique(array_filter([(int)$t['CreatedBy'], (int)$t['AssignedTo']]));
            foreach ($recipients as $rid) {
                if ($rid === $userID) continue;
                notifyUser($conn, $rid, 'attachment', "New attachment \"$original\" on ticket #$ticketID: {$t['Title']}", $ticketID);
            }
        }

        echo json_encode(["success" => true, "message" => "File uploaded"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to record attachment"]);
    }
}
?>
