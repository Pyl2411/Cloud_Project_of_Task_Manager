const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Create Task
router.post("/create", authMiddleware, async (req, res) => {
    try {
        const { title, description, status, assignedTo } = req.body;
        const newTask = new Task({ title, description, status, assignedTo });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch All Tasks
router.get("/", authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
