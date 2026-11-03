NexusAI merged recovery package

This package is based on NexusAI_Latest_Backup(4).zip and the latest supplied patch uploads.
It includes the supplied SQLite database, cumulative module frontend/backend files, the repaired architecture API, quality/security project-load fix, telemetry endpoint/UI integration, and migration 0007_delete_architecturedesign.py.

Extract into F:\Projects\Nexus-AI and allow file replacement only after making a separate copy of db.sqlite3. Do not run flush or reset the database.

After extraction:
1. .\.venv\Scripts\python.exe manage.py check
2. .\.venv\Scripts\python.exe manage.py migrate
3. Start Django and Node servers.

Note: This package is merged from the provided source ZIPs. A complete end-to-end runtime test against the user's Windows environment is not possible here. Verify the Django check and module flows after extraction.
