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
        created_at TEXT DEFAULT CURRNET_TIMESTAMP,
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

const projectColumns = db.prepare(
    "PRAGMA table_info(projects)"
).all();

if (!projectColumns.some(column => column.name === "description")) {
    db.exec("ALTER TABLE projects ADD COLUMN description TEXT DEFAULT ''");
}

console.log("Forge database connected!");

console.log("Database tables initialized!");

module.exports = db;