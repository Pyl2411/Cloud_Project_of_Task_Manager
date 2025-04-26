const multer = require("multer");
const path = require("path");
const Receipt = require("./models/Receipt"); // adjust path if needed
const User = require("./models/User");       // needed for populating receipt uploads

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique file name
  },
});
const upload = multer({ storage: storage });

// Upload route (students only)
app.post("/upload-receipt", upload.single("receipt"), async (req, res) => {
  try {
    const studentId = req.user._id;
    const newReceipt = new Receipt({
      student: studentId,
      filename: req.file.filename,
    });

    await newReceipt.save();
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).send("Something went wrong.");
  }
});
