const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "40mb" }));  // increase JSON body size
app.use(express.urlencoded({ limit: "40mb", extended: true })); // if using forms

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "1234",
  database: process.env.DB_NAME || "civic_db",
});

// Create HTTP server for both Express & Socket.IO
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: { origin: "*" } // allow frontend
});

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running with MySQL 🚀");
});

// Simple /api test route
app.get("/api", (req, res) => {
  res.json({ message: "API is working 🚀" });
});

// API to insert a report
app.post("/api/reports", async (req, res) => {
  try {
    const { title, description, email, severity, img, lat, lng } = req.body;

    if (!title || !description || !email || !severity || !lat || !lng) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `
      INSERT INTO reports 
      (title, description, email, severity, img, lat, lng) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
      title,
      description,
      email,
      severity,
      img,
      lat,
      lng,
    ]);

    // Prepare new report object
    const newReport = {
      id: result.insertId,
      title,
      description,
      email,
      severity,
      img,
      lat,
      lng,
      status: "Open",
      votes: 0,
      createdAt: new Date()
    };

    // Emit real-time update
    io.emit("newReport", newReport);

    res.status(201).json({ message: "Report created", reportId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// API to fetch all reports
app.get("/api/reports", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM reports ORDER BY createdAt DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// API: KPIs
app.get("/api/reports/kpis", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM reports");

    const total = rows.length;
    const open = rows.filter(r => r.status === "Open").length;
    const severe = rows.filter(r => 
      r.severity === "Severe" || r.severity === "Critical"
    ).length;

    // unique contributors (by email)
    const users = new Set(rows.map(r => r.email)).size;

    res.json({ total, open, severe, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Error handler
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
