const mongoose = require("mongoose");
module.exports = mongoose.model("User", new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, enum: ["HOD", "Faculty", "Student"] },
}));
