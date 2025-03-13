import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5000/api/tasks", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }).then(res => setTasks(res.data)).catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h2>Task Dashboard</h2>
            {tasks.map(task => (
                <div key={task._id}>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <p>Status: {task.status}</p>
                </div>
            ))}
        </div>
    );
};

export default Dashboard;
