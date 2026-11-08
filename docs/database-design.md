# Forge Database Design

## 1. Projects

Stores information about user projects.

- id: Unique project identifier.
- name: Project name.
- description: Project description.
- created_at: Creation timestamp.
- updated_at: Last modification timestamp.

## 2. Tasks

Stores tasks belonging to projects.

- id: Unique task identifier.
- project_id: ID of the associated project.
- title: Task title.
- description: Task description.
- status: Current task status.
- priority: Task priority.
- created_at: Creation timestamp.
- updated_at: Last modification timestamp.

## 3. Notes

Stores notes belonging to projects.

- id: Unique note identifier.
- project_id: ID of the associated project.
- title: Note title.
- content: Note content.
- created_at: Creation timestamp.
- updated_at: Last modification timestamp.

## Relationships

- One project can contain multiple tasks.
- One project can contain multiple notes.
- Every task belongs to one project.
- Every note belongs to one project.

## Versioning

Every record will also have a version number.

Version numbers will help detect conflicting modifications during synchronization.