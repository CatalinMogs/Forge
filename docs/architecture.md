# Forge Architecture

## Overview

Forge is an offline-first project management application.

It allows users to manage projects, tasks and notes, even without an internet connection.

## Frontend

The frontend users:

- HTML for structure.
- CSS for styling.
- JavaScript for application logic.
- IndexedDB for local data storage.

## Backend

The backend uses:

- Node.js as the runtime.
- Express for the REST API.
- SQLite for persistent server-side storage.

## Synchronization

The synchronization engine connects the local database with the server.

It uses an operation log to track changes and version numbers to detect conflicts.

## Main Components

1. Client interface.
2. Local database.
3. Operation log.
4. REST API.
5. Server database.
6. Synchronization engine.

## Main Goal

Forge aims to provide reliable project management with offline support and safe data synchronization.