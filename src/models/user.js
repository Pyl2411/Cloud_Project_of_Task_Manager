const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["HOD", "Faculty", "Student"], required: true },
});

module.exports = mongoose.model("User", userSchema);
