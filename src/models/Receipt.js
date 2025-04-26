const mongoose = require("mongoose");
module.exports = mongoose.model("Receipt", new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  filename: String,
  uploadedAt: Date,
}));
