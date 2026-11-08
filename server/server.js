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

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to Forge API!",
        status: "running"
    });
});

app.listen(PORT, () => {
    console.log(`Forge server running at http://localhost:${PORT}`);
});