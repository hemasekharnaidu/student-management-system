const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const path = require("path");

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false
}));

// ================= DATABASE CONNECTION =================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Root123()",
    database: "studentdb"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
    } else {
        console.log("Connected to MySQL database");
    }
});

// ================= ROUTES =================

// Serve Login Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Login
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.query(sql, [username, password], (err, result) => {
        if (err) return res.send("Error");

        if (result.length > 0) {
            req.session.user = username;
            res.redirect("/dashboard");
        } else {
            res.send("Invalid Credentials");
        }
    });
});

// Dashboard (Protected)
app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// ================= STUDENT CRUD APIs =================

// Get All Students
app.get("/students", (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");

    db.query("SELECT * FROM students", (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// Add Student
app.post("/students", (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");

    const { name, email, department, age } = req.body;

    const sql = "INSERT INTO students (name, email, department, age) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email, department, age], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Student Added");
    });
});

// Update Student
app.put("/students/:id", (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");

    const { name, email, department, age } = req.body;
    const { id } = req.params;

    const sql = "UPDATE students SET name=?, email=?, department=?, age=? WHERE id=?";
    db.query(sql, [name, email, department, age, id], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Student Updated");
    });
});

// Delete Student
app.delete("/students/:id", (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");

    const { id } = req.params;

    db.query("DELETE FROM students WHERE id=?", [id], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Student Deleted");
    });
});

// ================= START SERVER =================
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});