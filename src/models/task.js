const mongoose = require("mongoose");
module.exports = mongoose.model("Task", new mongoose.Schema({
  title: String,
  description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startDate: Date,
  deadline: Date,
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
}));
