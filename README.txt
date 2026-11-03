NexusAI System Settings repair patch

Extract into F:\Projects\Nexus-AI preserving folders and replace files.
Files: index.html, nexusai_app/urls.py, nexusai_app/settings_api.py
No migration required. Uses existing SystemSetting model with per-user namespaced keys. Does not include or modify db.sqlite3 or .env.
Restart Django and Node.js, then Ctrl+F5. Open System Settings, save preferences, refresh to verify.
