const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");

const router = express.Router();

// Assign Task (HOD or Faculty)
router.post("/assign", authMiddleware, async (req, res) => {
  if (req.user.role !== "HOD" && req.user.role !== "Faculty") {
    return res.status(403).json({ message: "Access Denied!" });
  }

  try {
    const { title, description, assignedTo, startDate, deadline } = req.body;

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      startDate: new Date(startDate),
      deadline: new Date(deadline),
    });

    await task.save();

    // Send email notification to assignee
    const assignee = await User.findById(assignedTo);
    if (assignee && assignee.email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: assignee.email,
        subject: 'New Task Assigned',
        text: `Dear ${assignee.username},\n\nYou have been assigned a new task: "${title}".\n\nPlease log in to the dashboard to view details.\n\nThanks.`,
      };

      await transporter.sendMail(mailOptions);
    }

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error assigning task:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard
router.get("/", authMiddleware, async (req, res) => {
  try {
    let tasks = [];
    let facultyList = [];
    let studentList = [];

    if (req.user.role === "HOD") {
      tasks = await Task.find({})
        .populate("assignedTo", "username role")
        .populate("assignedBy", "username role")
        .sort({ createdAt: -1 });
      facultyList = await User.find({ role: "Faculty" }, "username _id");
      studentList = await User.find({ role: "Student" }, "username _id");
    } else if (req.user.role === "Faculty") {
      tasks = await Task.find({
        $or: [
          { assignedTo: req.user._id },
          { assignedBy: req.user._id, "assignedTo.role": "Student" },
        ],
      })
        .populate("assignedTo", "username role")
        .populate("assignedBy", "username role")
        .sort({ createdAt: -1 });
      studentList = await User.find({ role: "Student" }, "username _id");
    } else {
      tasks = await Task.find({ assignedTo: req.user._id })
        .populate("assignedTo", "username role")
        .populate("assignedBy", "username role")
        .sort({ createdAt: -1 });
    }

    res.render("dashboard", {
      user: req.user,
      tasks,
      facultyList,
      studentList,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete Task (HOD only)
router.post("/delete/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "HOD") {
      return res.status(403).json({ message: "Access Denied!" });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error deleting task:", error.message);
    res.redirect("/dashboard");
  }
});

// Mark Task as Completed (Faculty or Student)
router.post("/status/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).send("Task not found");

    if (
      (req.user.role === "Faculty" || req.user.role === "Student") &&
      task.assignedTo.toString() === req.user._id.toString()
    ) {
      task.status = "Completed";
      await task.save();
    }

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error updating task status:", error.message);
    res.redirect("/dashboard");
  }
});

module.exports = router;
