<?php

header("Content-Type: application/json");

// ---- CONFIG ----
$API_KEY = "xai-Ww8Q0HEesMGrY9pWSdMMVDlAQNIGMmGddqt7jqhDajbFQNuZFiYr3VslumaqBg1S8Ot9VrKQBp7nHuOx";
// Incoming JSON
$input = file_get_contents("php://input");

// Setup cURL request
$ch = curl_init("https://api.x.ai/v1/chat/completions");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $API_KEY,
    "Content-Type: application/json",
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["error" => curl_error($ch)]);
    exit;
}

curl_close($ch);

echo $response;
