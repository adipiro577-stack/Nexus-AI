# NexusAI

NexusAI is a web-based AI-assisted software engineering workspace. The current active interface is the root `index.html` page with vanilla JavaScript in `static/js/`; the React files under `src/` are an earlier UI prototype and are not the root page currently served by Express/Vite.

## Current stack
- Active frontend: HTML, Tailwind CSS, vanilla JavaScript, Vite
- App/API server: Node.js, Express, TypeScript (`server.ts`)
- Application backend: Django 5.x, Django REST Framework
- Database: SQLite for local development
- AI requirement analysis: Google Gemini or NVIDIA NIM, selected with `AI_PROVIDER`

## Main working demo flow
1. Django session login / registration.
2. Create and manage user-owned projects.
3. Analyze a project description using the selected AI provider.
4. Receive activity and structured requirement results in the browser.
5. Save an immutable analysis snapshot to a project.
6. Review analysis history and imported requirements in the project workspace.
7. Add, edit, delete, and update requirement priority/status. These changes persist in Django/SQLite.

## Setup on Windows
Open PowerShell in `F:\Projects\Nexus-AI`.

### 1. Environment
- Create `.env` using `.env.example` as a reference.
- Keep all API keys in `.env`; do not commit or share it.
- Set `AI_PROVIDER=gemini` for the college demo, or `AI_PROVIDER=nvidia` to use NVIDIA NIM.

### 2. Start Django (Terminal 1)
```powershell
cd F:\Projects\Nexus-AI
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

### 3. Start Express/Vite (Terminal 2)
```powershell
cd F:\Projects\Nexus-AI
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

## Verification
```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py test nexusai_app
npm.cmd run lint
npm.cmd run build
```

## Security and data safety
- Do not include `.env`, `db.sqlite3`, user workbooks, or API keys in shared source archives.
- Back up `db.sqlite3` before applying changes or migrations.
- Project and requirement APIs check the signed-in Django user and scope records to projects owned by that user.

## Demo scope and limitations
See `COLLEGE_DEMO_CHECKLIST.md`. Core project, AI requirement-analysis, analysis-history, and requirements-management flows are implemented for the local college demo. Full multi-agent orchestration, end-to-end CI/CD execution, and live infrastructure telemetry are not complete production features; related screens may contain prototype or illustrative UI.
