<?php
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Your authentication logic here
    if ($username === 'admin' && $password === '1234') {
        $_SESSION['username'] = $username;
        //header("Location: welcome.php");
        header("Location: index.php?success=2");
        exit;
    } else {
        header("Location: index.php?error=1"); // Redirect with error flag
        exit;
    }
}
?>




 