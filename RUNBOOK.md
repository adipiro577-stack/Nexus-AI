# NexusAI Local Development Runbook

## 1. Prerequisites
- Windows PowerShell
- Python 3.13+ with virtual environment support
- Node.js 18+ & npm 9+
- Docker (optional)
- Ollama running locally on `http://127.0.0.1:11434` **only** when using AI features

## 2. Environment
1. Open PowerShell at the project root (`F:\Projects\Nexus-AI`).
2. Activate the virtual environment:  
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```
3. Install Python requirements (if not already present):  
   ```powershell
   pip install django djangorestframework
   ```

## 3. Start Services
### 3.1 Django API
```powershell
python manage.py migrate     # Applies pending migrations (idempotent)
python manage.py runserver   # Starts on http://127.0.0.1:8000
```

### 3.2 Express/Vite Frontend
```powershell
npm install                # Install node modules (once)
npm run dev                # Starts on http://127.0.0.1:3000
```

### 3.3 Ollama (AI features only)
```powershell
ollama serve               # Ensure daemon is running
Test-NetConnection -ComputerName 127.0.0.1 -Port 11434   # Verify
```

## 4. Environment Variables
- Copy `.env.example` to `.env` and fill in values.  
- **.Never commit** `.env` – it is listed in `.gitignore`.  
- Important variables:  
  - `DJANGO_SECRET_KEY` – set to a secure random value for production.  
  - `DJANGO_DEBUG` – `True` for local development, `False` for staging.  
  - `DJANGO_ALLOWED_HOSTS` – e.g., `localhost,127.0.0.1`.  
  - `GEMINI_API_KEY` – Gemini provider key.
  - `AI_PROVIDER` – `gemini` (primary demo provider) or `nvidia` (temporary alternative).
  - `NVIDIA_API_KEY`, `NVIDIA_BASE_URL`, `NVIDIA_MODEL` – NVIDIA NIM provider settings.
  - `OLLAMA_API_KEY` / `OLLAMA_MODEL` – optional legacy Ollama integration.

## 5. Common Issues
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Port 8000/3000 already in use | Another instance running | Kill the process or change the port |
| `ImportError: No module named 'django'` | Venv not activated or Django not installed | Activate venv, run `pip install django` |
| CORS errors | `ALLOWED_HOSTS` does not include front‑end origin | Add `127.0.0.1` to `DJANGO_ALLOWED_HOSTS` |
| Ollama 503/502 errors | Ollama not running or unreachable | Start `ollama serve` and verify with `Test-NetConnection` |
| Database schema errors | Missing migrations | Run `python manage.py makemigrations` then `python manage.py migrate` |

## 6. Requirement management APIs
- `GET /api/projects/<project_id>/requirements/` – list project requirements.
- `POST /api/projects/<project_id>/requirements/` – create a requirement.
- `PATCH /api/projects/<project_id>/requirements/<requirement_id>/` – edit a requirement or update priority/status.
- `DELETE /api/projects/<project_id>/requirements/<requirement_id>/` – delete a requirement.
- All endpoints require a signed-in Django session and verify project ownership.

## 7. Lint & sanity checks
```powershell
npm run lint          # TypeScript lint – should output nothing
python manage.py check    # Django system check – should output "System check identified no issues"
```

## 8. Stopping
- Press `Ctrl+C` in each server window.  
- Close Ollama UI or run `ollama stop`.

---  
*Keep this file updated with any changes to startup scripts or required environment variables.*
## Project-specific AI Architecture Topology

1. Start Django and Express using the commands above.
2. Sign in, open **Project Workspace**, and open the project to use.
3. Select **Architecture Topology** from the sidebar.
4. Click **Generate Architecture with AI**. The backend loads the selected project's description, category, technology stack, and saved requirements from Django.
5. The active `AI_PROVIDER` setting selects Gemini or NVIDIA. The generated topology is rendered in the canvas and saved to the project's Django records.
6. Navigate away and return to Architecture Topology to confirm the saved diagram reloads.

The topology API is owner-scoped. A user cannot load or replace another user's project architecture.

## 9. Project Database & ORM Designer
- Open a project from **Project Workspace** before opening **Database & ORM Designer**.
- Click **Generate Database Schema with AI**. The Express endpoint loads the selected project's details and saved requirements using the signed-in Django session.
- Generation uses the configured `AI_PROVIDER` first and automatically tries the alternate Gemini/NVIDIA provider if the preferred provider fails.
- The generated tables, field metadata, provider/model information, and Django model code are saved to the selected project through the owner-scoped Django database-design API.
- Navigate away and return to confirm that the saved schema reloads. The generated Django code is a proposal for review; it is displayed but never executed or applied as a migration automatically.
- API: `GET /api/projects/<project_id>/database-design/` and `PUT /api/projects/<project_id>/database-design/`. Both require a signed-in Django session and enforce project ownership.
- Apply the new database model migration on an existing local database with `python manage.py migrate`.
