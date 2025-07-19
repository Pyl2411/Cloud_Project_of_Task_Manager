# 🎯 Role-Based Academic Task Management System

A web-based task management system for academic use, built using **Node.js**, **Express.js**, **Bootstrap**, and **Handlebars**. The application supports role-based login and dynamic dashboards for HODs, Faculty, and Students.

---

## 🚀 Features by Role

### 👨‍🏫 HOD (Head of Department)
- Register & login as HOD
- View all faculty members
- Assign tasks to faculty with:
  - Task title & description
  - Start date & deadline
- Track task completion status

### 👩‍🏫 Faculty
- Register & login as Faculty
- View tasks assigned by HOD
- Update task status
- Assign tasks to students
- View student submissions

### 👨‍🎓 Student
- Register & login as Student
- View tasks assigned by faculty
- Upload documents (fee receipt, assignment files, etc.)
- Check task status and feedback

---

## 🔐 Authentication & Authorization

- Role-based user registration (Student, Faculty, HOD)
- Secure login system using Express sessions or JWT
- Dashboard views rendered based on user role

---

## 🛠️ Tech Stack

| Layer        | Technology             |
|--------------|------------------------|
| 🖥 Frontend   | HTML, Bootstrap 5, Handlebars |
| 🧠 Backend    | Node.js, Express.js    |
| 💾 Database   | MongoDB or MySQL (your choice) |
| 🔐 Auth       | Express Sessions / Passport.js |



