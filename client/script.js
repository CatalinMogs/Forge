const request = indexedDB.open("ForgeDB", 3);

request.onupgradeneeded = (e) => {
    const db = e.target.result;

    if (!db.objectStoreNames.contains("projects")) {
        db.createObjectStore("projects", {
            keyPath: "id",
            autoIncrement: true
        });
    }

    if (db.objectStoreNames.contains("tasks")) {
        db.deleteObjectStore("tasks");
    }

    db.createObjectStore("tasks", {
        keyPath: "id",
        autoIncrement: true
    });

    if (!db.objectStoreNames.contains("notes")) {
        db.createObjectStore("notes", {
            keyPath: "id",
            autoIncrement: true
        });
    }

    if (!db.objectStoreNames.contains("operations")) {
        db.createObjectStore("operations", {
            keyPath: "id"
        });
    }

    console.log("Forge database upgraded!");
};

let db;

request.onsuccess = (e) => {
    db = e.target.result;

    console.log("Forge local database connected!");
};

request.onerror = (e) => {
    console.error("Database error:", e.target.error);
};

function addProject(name, description) {
    const transaction = db.transaction("projects", "readwrite");
    const store = transaction.objectStore("projects");

    store.add({
        name: name,
        description: description,
        createdAt: new Date().toISOString()
    });

    transaction.oncomplete = () => {
        console.log("Project saved locally!");
    };

    transaction.onerror = () => {
        console.error("Could not save project.");
    };
}

function getProjects() {
    const transaction = db.transaction("projects", "readonly");
    const store = transaction.objectStore("projects");

    const request = store.getAll();

    request.onsuccess = () => {
        console.log("Local projects:", request.result);
    };

    request.onerror = () => {
        console.error("Could not retrieve projects.");
    };
}

function updateProject(id, name, description) {
    const transaction = db.transaction("projects", "readwrite");
    const store = transaction.objectStore("projects");

    const request = store.get(id);

    request.onsuccess = () => {
        const project = request.result;

        if (!project) {
            console.log("Project not found.");
            return;
        }

        project.name = name;
        project.description = description;
        project.updatedAt = new Date().toISOString();

        store.put(project);
    };

    transaction.oncomplete = () => {
        console.log("Project updated locally!");
    };

    transaction.onerror = () => {
        console.error("Could not update project.");
    };
}

function deleteProject(id) {
    const transaction = db.transaction("projects", "readwrite");
    const store = transaction.objectStore("projects");

    store.delete(id);

    transaction.oncomplete = () => {
        console.log("Project deleted locally!");
    };

    transaction.onerror = () => {
        console.error("Could not delete projects.");
    };
}

function addTask(projectId, title, description, priority) {
    const transaction = db.transaction(
        ["tasks", "operations"],
        "readwrite"
    );

    const taskStore = transaction.objectStore("tasks");
    const operationStore = transaction.objectStore("operations");

    const task = {
        projectId: projectId,
        title: title,
        description: description,
        priority: priority || "medium",
        status: "todo",
        createdAt: new Date().toISOString()
    };

    const taskRequest = taskStore.add(task);

    taskRequest.onsuccess = () => {
        const taskId = taskRequest.result;

        const operation = {
            id: crypto.randomUUID(),
            entityType: "task",
            entityId: taskId,
            operationType: "create",
            payload: task,
            baseVersion: 0,
            status: "pending",
            createdAt: new Date().toISOString()
        };

        operationStore.add(operation);
    };

    transaction.oncomplete = () => {
        console.log("Task saved locally!");
        console.log("Task added to synchronization queue!");
    };

    transaction.onerror = () => {
        console.error("Could not save task and operation.");
    };
}

function getTasks() {
    const transaction = db.transaction("tasks", "readonly");
    const store = transaction.objectStore("tasks");

    const request = store.getAll();

    request.onsuccess = () => {
        console.log("Local tasks:", request.result);
    };

    request.onerror = () => {
        console.error("Could not retrieve tasks.");
    };
}

function updateTask(id, title, description, status, priority) {
    const transaction = db.transaction("tasks", "readwrite");
    const store = transaction.objectStore("tasks");

    const request = store.get(id);

    request.onsuccess = () => {
        const task = request.result;

        if (!task) {
            console.log("Task not found.");
            return;
        }

        task.title = title;
        task.description = description;
        task.status = status;
        task.priority = priority;
        task.updatedAt = new Date().toISOString();

        store.put(task);
    };

    transaction.oncomplete = () => {
        console.log("Task updated locally!");
    };

    transaction.onerror = () => {
        console.error("Could not update task.");
    };
}

function deleteTask(id) {
    const transaction = db.transaction("tasks", "readwrite");
    const store = transaction.objectStore("tasks");

    store.delete(id);

    transaction.oncomplete = () => {
        console.log("Task deleted locally!");
    };

    transaction.onerror = () => {
        console.error("Could not delete task.");
    };
}

function addNote(projectId, title, content) {
    const transaction = db.transaction("notes", "readwrite");
    const store = transaction.objectStore("notes");

    store.add({
        projectId: projectId,
        title: title,
        content: content,
        createdAt: new Date().toISOString()
    });

    transaction.oncomplete = () => {
        console.log("Note saved locally!");
    };

    transaction.onerror = () => {
        console.error("Could not save note.");
    };
}

function getNotes() {
    const transaction = db.transaction("notes", "readonly");
    const store = transaction.objectStore("notes");

    const request = store.getAll();

    request.onsuccess = () => {
        console.log("Local notes:", request.result);
    };

    request.onerror = () => {
        console.error("Could not retrieve notes.");
    };
}

function updateNote(id, title, content) {
    const transaction = db.transaction("notes", "readwrite");
    const store = transaction.objectStore("notes");

    const request = store.get(id);

    request.onsuccess = () => {
        const note = request.result;

        if (!note) {
            console.log("Note not found.");
            return;
        }

        note.title = title;
        note.content = content;
        note.updatedAt = new Date().toISOString();

        store.put(note);
    };

    transaction.oncomplete = () => {
        console.log("Note updated locally!");
    };

    transaction.onerror = () => {
        console.error("Could not update note.");
    };
}

function deleteNote(id) {
    const transaction = db.transaction("notes", "readwrite");
    const store = transaction.objectStore("notes");

    store.delete(id);

    transaction.oncomplete = () => {
        console.log("Note deleted locally!");
    };

    transaction.onerror = () => {
        console.error("Could not delete note.");
    };
}

function addOperation(entityType, entityId, operationType, payload, baseVersion) {
    const transaction = db.transaction("operations", "readwrite");
    const store = transaction.objectStore("operations");

    const operation = {
        id: crypto.randomUUID(),
        entityType: entityType,
        entityId: entityId,
        operationType: operationType,
        payload: payload,
        baseVersion: baseVersion,
        status: "pending",
        createdAt: new Date().toISOString()
    };

    store.add(operation);

    transaction.oncomplete = () => {
        console.log("Operation added to sync log!", operation);
    };

    transaction.onerror = () => {
        console.error("Could not save operation.");
    };
}

function getPendingOperations() {
    const transaction = db.transaction("operations", "readonly");
    const store = transaction.objectStore("operations");

    const request = store.getAll();

    request.onsuccess = () => {
        const pending = request.result.filter(
            operation => operation.status === "pending"
        );

        console.log("Pending operations:", pending);
    };

    request.onerror = () => {
        console.error("Could not retrieve operations.");
    };
}