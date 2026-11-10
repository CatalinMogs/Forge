const express = require("express");
const db = require("./database");

const app = express();
const PORT = 3000;

const cors = require("cors");

app.use(cors({
    origin: "http://127.0.0.1:5500"
}));

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

app.post("/api/sync", (req, res) => {
    const { operations } = req.body;

    if (!Array.isArray(operations)) {
        return res.status(400).json({
            error: "Operations must be an array."
        });
    }

    const results = operations.map(operation => {
        try {
            if (
                !operation.id ||
                !operation.entityType ||
                !operation.entityId ||
                !operation.operationType ||
                !operation.payload
            ) {
                throw new Error("Invalid operation data.");
            }

            const existing = db.prepare(`
                SELECT server_entity_id
                FROM processed_operations
                WHERE operation_id = ?
            `).get(operation.id);

            if (existing) {
                return {
                    operationId: operation.id,
                    status: "already_processed",
                    serverEntityId: existing.server_entity_id
                };
            }

            if (
                operation.entityType !== "project" ||
                operation.operationType !== "create"
            ) {
                throw new Error("Unsupported operation.");
            }

            const { name, description } = operation.payload;

            if (!name || !name.trim()) {
                throw new Error("Project name is required.");
            }

            const processOperation = db.transaction(() => {
                const result = db.prepare(`
                    INSERT INTO projects (name, description)
                    VALUES (?, ?)
                `).run(name.trim(), description || "");

                const serverEntityId = result.lastInsertRowid;

                db.prepare(`
                    INSERT INTO processed_operations (
                        operation_id,
                        entity_type,
                        local_entity_id,
                        server_entity_id,
                        operation_type
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `).run(
                        operation.id,
                        operation.entityType,
                        operation.entityId,
                        serverEntityId,
                        operation.operationType
                    );

                    return serverEntityId;
            });

            const serverEntityId = processOperation();

            return {
                operationId: operation.id,
                status: "success",
                serverEntityId: serverEntityId
            };

        } catch (error) {
            console.error("Sync error:", error.message);

            return {
                operationId: operation.id,
                status: "failed",
                error: error.message
            };
        }
    });

    res.json({
        message: "Synchronization completed.",
        results
    });
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

app.get("/api/projects/:projectId/notes", (req, res) => {
    const notes = db.prepare(
        "SELECT * FROM notes WHERE project_id = ? ORDER BY created_at DESC"
    ).all(req.params.projectId);

    res.json(notes);
});

app.post("/api/projects/:projectId/notes", (req, res) => {
    const { title, content } = req.body;
    const projectId = req.params.projectId;

    if (!title || !title.trim()) {
        return res.status(400).json({
            error: "Note title is required."
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
        INSERT INTO notes (project_id, title, content)
        VALUES (?, ?, ?)
    `).run(projectId, title.trim(), content || "");

    const note = db.prepare(
        "SELECT * FROM notes WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json(note);
});

app.get("/api/notes/:id", (req, res) => {
    const note = db.prepare(
        "SELECT * FROM notes WHERE id = ?"
    ).get(req.params.id);

    if (!note) {
        return res.status(404).json({
            error: "Note not found."
        });
    }

    res.json(note);
});

app.put("/api/notes/:id", (req, res) => {
    const { title, content } = req.body;
    const noteId = req.params.id;

    const existingNote = db.prepare(
        "SELECT * FROM notes WHERE id = ?"
    ).get(noteId);

    if(!existingNote) {
        return res.status(404).json({
            error: "Note not found."
        });
    }

    if (!title || !title.trim()) {
        return res.status(400).json({
            error: "Note title is required."
        });
    }

    db.prepare(`
        UPDATE notes
        SET title = ?,
            content = ?,
            updated_at = CURRENT_TIMESTAMP,
            version = version + 1
        WHERE id = ?
    `).run(
        title.trim(),
        content ?? existingNote.content,
        noteId
    );

    const updatedNote = db.prepare(
        "SELECT * FROM notes WHERE id = ?"
    ).get(noteId);

    res.json(updatedNote);
});

app.delete("/api/notes/:id", (req, res) => {
    const noteId = req.params.id;

    const note = db.prepare(
        "SELECT * FROM notes WHERE id = ?"
    ).get(noteId);

    if (!note) {
        return res.status(404).json({
            error: "Note not found."
        });
    }

    db.prepare(
        "DELETE FROM notes WHERE id = ?"
    ).run(noteId);
});

app.listen(PORT, () => {
    console.log(`Forge server running at http://localhost:${PORT}`);
});