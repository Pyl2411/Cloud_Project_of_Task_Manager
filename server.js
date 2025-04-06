const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const exphbs = require("express-handlebars");
const path = require("path");
const { allowInsecurePrototypeAccess } = require("@handlebars/allow-prototype-access");
const Handlebars = require("handlebars");

const User = require("./src/models/user");
const Task = require("./src/models/task");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Setup Handlebars View Engine
app.engine(
  "hbs",
  exphbs.engine({
    extname: "hbs",
    defaultLayout: false,
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
      eq: function (a, b) {
        return a === b;
      },
    },
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "templates"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));

// Authentication Middleware
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.user).select("-password");

    if (!req.user) return res.redirect("/login");

    next();
  } catch (error) {
    res.redirect("/login");
  }
};

// Home Route
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Register Routes
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
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

// Login Routes
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render("login", { error: "Invalid email or password" });
    }

    const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.cookie("token", token, { httpOnly: true }).redirect("/dashboard");
  } catch (err) {
    res.render("login", { error: err.message });
  }
});

// Logout Route
app.get("/logout", (req, res) => {
  res.clearCookie("token").redirect("/login");
});

// Dashboard Route
app.get("/dashboard", protect, async (req, res) => {
  try {
    let tasks = [];
    let facultyList = [];

    if (req.user.role === "HOD") {
      tasks = await Task.find();
      facultyList = await User.find({ role: "Faculty" });
    } else {
      tasks = await Task.find({ assignedTo: req.user._id });
    }

    res.render("dashboard", { user: req.user, tasks, facultyList });
  } catch (err) {
    res.render("dashboard", { error: err.message });
  }
});

// Task Management Routes
app.post("/tasks", protect, async (req, res) => {
  try {
    if (req.user.role !== "HOD") {
      return res.status(403).json({ error: "Access Denied" });
    }

    const { title, description, assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ error: "Invalid Faculty ID" });
    }

    const task = new Task({
      title,
      description,
      assignedTo: new mongoose.Types.ObjectId(assignedTo),
    });

    await task.save();
    res.redirect("/dashboard");
  } catch (err) {
    res.render("dashboard", { error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
