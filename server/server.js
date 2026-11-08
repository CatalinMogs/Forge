const express = require("express");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/api/projects", (req, res) => {
    const projects = db.prepare(
        "SELECT * FROM projects ORDER BY created_at DESC"
    ).all();

    res.json(projects);
});

app.post("/api/projects", (req, res) => {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Project name is required."
        });
    }

    const result = db.prepare(`
        INSERT INTO projects (name, description)
        VALUES (?, ?)
        `).run(name.trim(), description || "");

    const project = db.prepare(
        "SELECT * FROM projects WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json(project);
});

app.get("/api/projects/:id", (req, res) => {
    const project = db.prepare(
        "SELECT * FROM projects WHERE id = ?"
    ).get(req.params.id);

    if (!project) {
        return res.status(404).json({
            error: "Project not found."
        });
    }

    res.json(project);
});

app.put("/api/projects/:id", (req, res) => {
    const { name, description } = req.body;
    const projectId = req.params.id;

    const existingProject = db.prepare(
        "SELECT * FROM projects WHERE id = ?"
    ).get(projectId);

    if (!existingProject) {
        return res.status(404).json({
            error: "Project not found."
        });
    }

    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Project name is required."
        });
    }

    db.prepare(`
        UPDATE projects
        SET name = ?,
            description = ?,
            updated_at = CURRENT_TIMESTAMP,
            version = version + 1
        WHERE id = ?
        `).run(name.trim(), description ?? existingProject.description, projectId);

    const updatedProject = db.prepare(
        "SELECT * FROM projects WHERE id = ?"
    ).get(projectId);

    res.json(updatedProject);
});

app.delete("/api/projects/:id", (req, res) => {
    const projectId = req.params.id;

    const project = db.prepare(
        "SELECT * FROM projects WHERE id = ?"
    ).get(projectId);

    if (!project) {
        return res.status(404).json({
            error: "Project not found."
        });
    }

    db.prepare(
        "DELETE FROM projects WHERE id = ?"
    ).run(projectId);
});

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to Forge API!",
        status: "running"
    });
});

app.get("/api/projects/:projectId/tasks", (req, res) => {
    const tasks = db.prepare(
        "SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC"
    ).all(req.params.projectId);

    res.json(tasks);
});

app.post("/api/projects/:projectId/tasks", (req, res) => {
    const { title, description, priority } = req.body;
    const projectId = req.params.projectId;

    if(!title || !title.trim()) {
        return res.status(400).json({
            error: "Task title is required."
        });
    }

    const project = db.prepare(
        "SELECT * FROM projects WHERE id = ?"
    ).get(projectId);

    if (!project) {
        return res.status(404).json({
            error: "Project not found."
        });
    }

    const result = db.prepare(`
        INSERT INTO tasks (project_id, title, description, priority)
        VALUES (?, ?, ?, ?)
    `).run(
        projectId,
        title.trim(),
        description || "",
        priority || "medium"
    );

    const task = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json(task);
});

app.get("/api/tasks/:id", (req, res) => {
    const task = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(req.params.id);

    if (!task) {
        return res.status(404).json({
            error: "Task not found."
        });
    }

    res.json(task);
});

app.put("/api/tasks/:id", (req, res) => {
    const { title, description, status, priority } = req.body;
    const taskId = req.params.id;

    const existingTask = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(taskId);

    if (!existingTask) {
        return res.status(404).json({
            error: "Task not found."
        });
    }

    if (!title || !title.trim()) {
        return res.status(404).json({
            error: "Task title is required."
        });
    }

    db.prepare(`
        UPDATE tasks
        SET title = ?,
            description = ?,
            status = ?,
            priority = ?,
            updated_at = CURRENT_TIMESTAMP,
            version = version + 1
        WHERE id = ?
        `).run(
            title.trim(),
            description ?? existingTask.descirption,
            status ?? existingTask.status,
            priority ?? existingTask.priority,
            taskId
        );

        const updatedTask = db.prepare(
            "SELECT * FROM tasks WHERE id = ?"
        ).get(taskId);

        res.json(updatedTask);
});

app.delete("/api/tasks/:id", (req, res) => {
    const taskId = req.params.id;

    const task = db.prepare(
        "SELECT * FROM tasks WHERE id = ?"
    ).get(taskId);

    if (!task) {
        return res.status(404).json({
            error: "Task not found."
        });
    }

    db.prepare(
        "DELETE FROM tasks WHERE id = ?"
    ).run(taskId);

    res.json({
        message: "Task deleted successfully."
    });
});

app.listen(PORT, () => {
    console.log(`Forge server running at http://localhost:${PORT}`);
});