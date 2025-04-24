const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({
  filename: String,
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Receipt", receiptSchema);
