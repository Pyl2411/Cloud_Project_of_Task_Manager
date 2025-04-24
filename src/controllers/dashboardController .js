const Task = require("../models/Task");
const User = require("../models/User");

app.get("/dashboard", async (req, res) => {
  const user = req.user;

  let tasks = [];
  let facultyList = [];
  let studentList = [];

  if (user.role === "HOD") {
    tasks = await Task.find().populate("assignedTo assignedBy");
    facultyList = await User.find({ role: "Faculty" });
    studentList = await User.find({ role: "Student" });
  } else if (user.role === "Faculty") {
    tasks = await Task.find({
      $or: [
        { assignedTo: user._id },
        { assignedBy: user._id, "assignedTo.role": "Student" }
      ]
    }).populate("assignedTo assignedBy");
    studentList = await User.find({ role: "Student" });

    // Task Progress
    const totalTasks = tasks.filter(t => t.assignedTo._id.toString() === user._id.toString()).length;
    const completedTasks = tasks.filter(t => t.assignedTo._id.toString() === user._id.toString() && t.status === "Done").length;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return res.render("dashboard", {
      user,
      tasks,
      studentList,
      totalTasks,
      completedTasks,
      progressPercentage
    });
  } else if (user.role === "Student") {
    tasks = await Task.find({ assignedTo: user._id }).populate("assignedTo assignedBy");
  }

  res.render("dashboard", {
    user,
    tasks,
    facultyList,
    studentList
  });
});
