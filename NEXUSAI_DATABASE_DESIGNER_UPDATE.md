# NexusAI Project Database & ORM Designer update

## What changed
- The Database & ORM Designer is now project-aware. Open a project workspace, then open Database & ORM Designer.
- Generate Database Schema with AI uses the selected project's description, category, technology stack and saved requirements.
- Gemini is tried first when `AI_PROVIDER=gemini`; NVIDIA is automatically tried if Gemini fails. The reverse applies when `AI_PROVIDER=nvidia`.
- Generated tables, columns, provider/model metadata and reviewable Django model code are saved to the selected project and reloaded when the view is opened again.
- The generated Python code is displayed as a proposal only. It is not executed and does not alter the live Django models or database tables.
- Project database designs are private to their project owner.

## Apply on Windows
1. Extract this source ZIP over `F:\Projects\Nexus-AI` and replace matching source files.
2. Do not replace `.env`, `db.sqlite3`, `.venv`, or `node_modules`.
3. Run:

```powershell
cd F:\Projects\Nexus-AI
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py test nexusai_app
npm.cmd run lint
npm.cmd run build
```

4. Restart Django and Express. Open Project Workspace, open the desired project, then select Database & ORM Designer.
5. Click Generate Database Schema with AI. Confirm the tables and Django model code appear. Navigate away and return to verify persistence.

## API
- `GET /api/projects/<project_id>/database-design/`
- `PUT /api/projects/<project_id>/database-design/`
- `POST /api/ai/generate-database-schema`

The Django GET/PUT API is session-authenticated and project-owner-scoped. The Express AI endpoint verifies the Django session and fetches project/requirement data using that session.
