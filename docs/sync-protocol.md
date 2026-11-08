# Forge Synchronization Protocol

## 1. Overview

Forge uses an offline-first synchronization system.

Users can create, edit and delete projects, tasks and notes without na internet connection. Changes are stored locally and synchronized with the server when connectivity returns.

## 2. Operation Log

Every local modification creates an operation.

An operation represents one specific change made to a record.

Operations are stored locally until the server successfully processes them.

## 3. Operation Structure

Each operation contains:

- `id`: Unique operation identifier.
- `entity-type`: Type of record being modified.
- `entity-id`: Identifier of the modified record.
- `operation_type`: Create, update or delete.
- `payload`: Data associated with the operation.
- `base_version`: Record version on which the change was based.
- `created_at`: Time the operation was created.
- `status`: Pending, synced or conflict.

## 4. Synchronization Process

1. The user modifies a record.
2. Forge updates its local database.
3. Forge creates an operation in the local operation log.
4. The operation remains pending while offline.
5. When connectivity returns, Forge sends pending operations to the server.
6. The server validates each operation.
7. Accepted operations are saved to the server database.
8. The client marks successfully processed operations as synchronized.

## 5. Conflict Detection

Each record has a version number.

When an operation reaches the server, its `base_version` is compared with the current server version.

If they differ, the server detects a potential conflict rather than blindly overwriting existing data.

## 6. Reliability

The synchronization system must handle:

- Interrupted network connection.
- Duplicate operation submissions.
- Failed synchronization attempts.
- Conflicting modifications.
- Application restarts with pending operations.

The system must avoid losing changes or applying the same operation multiple times.

## 7. Design Goal

The goal is to provide reliable offline-first functionality while maintaining data consistency between local storage and the server.