<?php
// Central config for ticket-attachment uploads.
// Per the file-upload rules: only screenshots (PNG) and office documents
// (Excel/PowerPoint) are accepted — everything else (PHP, scripts, etc.) is
// rejected outright so it can never reach the upload directory.
return [
    // extension => MIME type recorded for downloads
    'ALLOWED_TYPES' => [
        'png'  => 'image/png',
        'xls'  => 'application/vnd.ms-excel',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt'  => 'application/vnd.ms-powerpoint',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],

    // Max upload size in bytes (5 MB). Change here to raise/lower the limit
    // for every endpoint that uses it.
    'MAX_FILE_SIZE' => 5 * 1024 * 1024,

    // Files are stored under UPLOAD_BASE/tickets/{ticketID}/{storedName} —
    // a "virtual path" recorded in TicketAttachments.StoredName, independent
    // of where the folder physically lives on disk.
    'UPLOAD_BASE' => __DIR__ . '/../uploads/',
];
