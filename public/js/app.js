// public/js/app.js

// Example API call to fetch tasks
fetch("http://localhost:5001/tasks", {
    method: "GET",
    headers: {
      "Authorization": "Bearer <your_jwt_token>"
    }
  })
  .then(response => response.json())
  .then(data => {
    const taskList = document.getElementById('task-list');
    data.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.textContent = task.title;
      taskList.appendChild(taskElement);
    });
  })
  .catch(error => console.error("Error fetching tasks:", error));
  