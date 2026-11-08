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

app.listen(PORT, () => {
    console.log(`Forge server running at http://localhost:${PORT}`);
});