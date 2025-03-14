const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected successfully via Mongoose!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));

// Import Models
const Task = require(path.join(__dirname, "models", "task"));
const User = require(path.join(__dirname, "models", "user"));

// Middleware for Authentication
const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.user).select("-password");
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// 🔹 User Registration
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 User Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token, message: "Login successful!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Create Task (Authenticated User)
app.post("/tasks", protect, async (req, res) => {
  try {
    const { title, description } = req.body;
    const task = new Task({ title, description, user: req.user._id });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Get All Tasks (Authenticated User)
app.get("/tasks", protect, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Update Task
app.put("/tasks/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { status, progress },
      { new: true }
    );

    if (!task) return res.status(404).json({ error: "Task not found!" });

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Delete Task
app.delete("/tasks/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ _id: id, user: req.user._id });

    if (!task) return res.status(404).json({ error: "Task not found!" });

    res.status(200).json({ message: "Task deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Server Start
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
