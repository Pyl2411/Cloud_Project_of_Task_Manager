// === server.js ===
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const exphbs = require("express-handlebars");
const path = require("path");
const moment = require("moment");
const { allowInsecurePrototypeAccess } = require("@handlebars/allow-prototype-access");
const Handlebars = require("handlebars");

const User = require("./src/models/user");
const Task = require("./src/models/task");

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Handlebars setup
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
        return new Date(date).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      },
    },
  })
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "templates"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

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

app.get("/", (req, res) => res.redirect("/login"));
app.get("/register", (req, res) => res.render("register"));
app.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.render("register", { error: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    await new User({ username, email, password: hashedPassword, role }).save();
    res.redirect("/login");
  } catch (err) {
    res.render("register", { error: err.message });
  }
});

app.get("/login", (req, res) => res.render("login"));
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render("login", { error: "Invalid credentials" });
    }
    const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true }).redirect("/dashboard");
  } catch (err) {
    res.render("login", { error: err.message });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token").redirect("/login");
});

app.get("/dashboard", protect, async (req, res) => {
  try {
    let tasks = [];
    let facultyList = [];
    if (req.user.role === "HOD") {
      tasks = await Task.find()
        .populate("assignedTo", "username")
        .populate("assignedBy", "username")
        .sort({ createdAt: -1 });
      facultyList = await User.find({ role: "Faculty" });
    } else {
      tasks = await Task.find({ assignedTo: req.user._id })
        .populate("assignedTo", "username")
        .populate("assignedBy", "username")
        .sort({ createdAt: -1 });
    }
    res.render("dashboard", { user: req.user, tasks, facultyList });
  } catch (err) {
    res.render("dashboard", { error: err.message });
  }
});

app.post("/tasks", protect, async (req, res) => {
  try {
    if (req.user.role !== "HOD") return res.status(403).json({ error: "Forbidden" });
    const { title, description, assignedTo, startDate, deadline } = req.body;
    await new Task({ title, description, assignedTo, assignedBy: req.user._id, startDate, deadline }).save();
    res.redirect("/dashboard");
  } catch (err) {
    res.render("dashboard", { error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


