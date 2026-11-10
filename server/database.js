const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
    path.join(__dirname, "forge.db")
);

db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        version INTEGER DEFAULT 1
        );
    `);

db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        version INTEGER DEFAULT 1,
        
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
        );
    `);

db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        version INTEGER DEFAULT 1,
        
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
        );
    `);

db.exec(`
    CREATE TABLE IF NOT EXISTS processed_operations (
    operation_id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    local_entity_id INTEGER NOT NULL,
    server_entity_id INTEGER,
    operation_type TEXT NOT NULL,
    processed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

const projectColumns = db.prepare(
    "PRAGMA table_info(projects)"
).all();

if (!projectColumns.some(column => column.name === "description")) {
    db.exec("ALTER TABLE projects ADD COLUMN description TEXT DEFAULT ''");
}

const columns = db.prepare(
    "PRAGMA table_info(processed_operations)"
).all();

if (columns.some(column => column.name === "operration_id")) {
    db.exec(`
        ALTER TABLE processed_operations
        RENAME COLUMN operration_id TO operation_id
    `);

    console.log("Fixed operation_id column!");
}

const hasProcessedOperation = db.prepare(`
    SELECT operation_id
    FROM processed_operations
    WHERE operation_id = ?
`);

console.log("Forge database connected!");

console.log("Database tables initialized!");

db.hasProcessedOperation = (operationId) => {
    return Boolean(hasProcessedOperation.get(operationId));
};

module.exports = db;