// === server.js ===

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const exphbs = require("express-handlebars");
const multer = require("multer");
const moment = require("moment");
const path = require("path");
const { allowInsecurePrototypeAccess } = require("@handlebars/allow-prototype-access");
const Handlebars = require("handlebars");

const User = require("./src/models/user");
const Task = require("./src/models/task");
const Receipt = require("./src/models/receipt");

dotenv.config();
const app = express();

// === Middleware ===
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// === Handlebars Setup ===
app.engine(
  "hbs",
  exphbs.engine({
    extname: "hbs",
    defaultLayout: false,
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
      eq: (a, b) => a === b,
      ifCond: function (v1, operator, v2, options) {
        switch (operator) {
          case "==": return v1 == v2 ? options.fn(this) : options.inverse(this);
          case "===": return v1 === v2 ? options.fn(this) : options.inverse(this);
          case "!=": return v1 != v2 ? options.fn(this) : options.inverse(this);
          case "!==": return v1 !== v2 ? options.fn(this) : options.inverse(this);
          case "<": return v1 < v2 ? options.fn(this) : options.inverse(this);
          case "<=": return v1 <= v2 ? options.fn(this) : options.inverse(this);
          case ">": return v1 > v2 ? options.fn(this) : options.inverse(this);
          case ">=": return v1 >= v2 ? options.fn(this) : options.inverse(this);
          case "&&": return v1 && v2 ? options.fn(this) : options.inverse(this);
          case "||": return v1 || v2 ? options.fn(this) : options.inverse(this);
          default: return options.inverse(this);
        }
      },
      formatDate: (date) => {
        if (!date) return "-";
        return moment(date).format("MMM DD, YYYY hh:mm A");
      },
    },
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "templates"));

// === MongoDB Connection ===
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// === Auth Middleware ===
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.user).select("-password");
    if (!req.user) return res.redirect("/login");

    next();
  } catch (err) {
    return res.redirect("/login");
  }
};

// === Multer Setup (File Uploads) ===
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// === Routes ===

// --- Basic Routes ---
app.get("/", (req, res) => res.redirect("/login"));
app.get("/register", (req, res) => res.render("register"));
app.get("/login", (req, res) => res.render("login"));
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

// --- Registration ---
app.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.render("register", { error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();

    res.redirect("/login");
  } catch (err) {
    res.render("register", { error: err.message });
  }
});

// --- Login ---
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.render("login", { error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.render("login", { error: "Invalid credentials" });

    const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/dashboard");
  } catch (err) {
    res.render("login", { error: err.message });
  }
});

// --- Dashboard ---
app.get("/dashboard", protect, async (req, res) => {
  try {
    const user = req.user;

    let tasks = [];
    let completedTasks = 0;
    let totalTasks = 0;
    let facultyList = [];
    let studentList = [];

    if (user.role === "HOD") {
      tasks = await Task.find({ assignedBy: user._id })
        .populate("assignedTo", "username")
        .populate("assignedBy", "username")
        .sort({ createdAt: -1 });

      facultyList = await User.find({ role: "Faculty" });

    } else if (user.role === "Faculty") {
      tasks = await Task.find({ assignedBy: user._id })
        .populate("assignedTo", "username")
        .populate("assignedBy", "username")
        .sort({ createdAt: -1 });

      studentList = await User.find({ role: "Student" });

      const myTasks = await Task.find({ assignedTo: user._id });
      totalTasks = myTasks.length;
      completedTasks = myTasks.filter((t) => t.status === "Done").length;

      tasks.push(...myTasks);

    } else if (user.role === "Student") {
      tasks = await Task.find({ assignedTo: user._id })
        .populate("assignedTo", "username")
        .populate("assignedBy", "username")
        .sort({ createdAt: -1 });
    }

    const receipts = await Receipt.find()
      .populate("student", "username")
      .sort({ uploadedAt: -1 });

    res.render("dashboard", {
      user,
      tasks,
      facultyList,
      studentList,
      completedTasks,
      totalTasks,
      receipts,
    });

  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// --- Assign Task ---
app.post("/tasks", protect, async (req, res) => {
  try {
    const { title, description, assignedTo, startDate, deadline } = req.body;

    await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      startDate,
      deadline,
      status: "Assigned",
    });

    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Task assignment failed");
  }
});

// --- Mark Task as Done (Faculty) ---
app.post("/tasks/done/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (task && task.assignedTo.toString() === req.user._id.toString()) {
      task.status = "Done";
      await task.save();
    }
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Failed to mark task as done");
  }
});

// --- Submit Task (Students) ---
app.post("/tasks/submit/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (task && task.assignedTo.toString() === req.user._id.toString()) {
      task.status = "Submitted";
      await task.save();
    }
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Failed to submit task");
  }
});

// --- Delete Task (HOD) ---
app.post("/tasks/delete/:id", protect, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Failed to delete task");
  }
});

// --- Upload Fine Receipt (Students) ---
app.post("/upload-receipt", protect, upload.single("receipt"), async (req, res) => {
  try {
    await Receipt.create({
      student: req.user._id,
      filename: req.file.filename,
      uploadedAt: new Date(),
    });
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Upload failed");
  }
});

// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

