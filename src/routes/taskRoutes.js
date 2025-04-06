const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

// Assign Task (HOD)
router.post("/assign", authMiddleware, async (req, res) => {
  if (req.user.role !== "HOD") return res.status(403).json({ message: "Access Denied!" });

  try {
    const { title, description, assignedTo } = req.body;
    const task = new Task({ title, description, assignedTo });
    await task.save();
    res.redirect("/dashboard");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Tasks (Faculty)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id });
    res.render("dashboard", { tasks, isHOD: req.user.role === "HOD" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
