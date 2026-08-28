# Database Migrations

This directory is reserved for database schema migrations (e.g., using Alembic or Flask-Migrate).

## Usage
When the schema in `backend/database/schema.sql` or `backend/models/db_models.py` changes, generate a migration script here to update production databases without losing data.

```bash
flask db migrate -m "Added new column"
flask db upgrade
```
