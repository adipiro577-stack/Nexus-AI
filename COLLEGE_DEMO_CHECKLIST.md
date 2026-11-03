# NexusAI — College Demo Checklist (2 November 2026)

## Main demo path (show this first)
1. Start Django and Express/Vite in separate terminals.
2. Sign in with a Django-managed account.
3. Create a project from Project Workspace.
4. Open AI Requirement Analyzer and enter a short project brief.
5. Run the analyzer with `AI_PROVIDER=gemini` (the planned primary demo provider).
6. Show provider/model activity and the generated structured requirements.
7. Save the analysis to the project workspace.
8. Open the project and show the saved analysis history and original prompt.
9. In Project Requirements, add a requirement, edit it, change priority/status, and delete a test requirement.
10. Refresh the page and confirm that the remaining requirements and analysis history persist.

## Provider switching
- Gemini: set `AI_PROVIDER=gemini` in `.env`, then restart the Express server.
- NVIDIA: set `AI_PROVIDER=nvidia`, then restart the Express server.
- Keep API keys only in `.env`. Never paste keys into screenshots, chat, source code, or slide decks.
- If Gemini returns HTTP 429 during the demo, switch to NVIDIA and clearly state which provider is active. Do not label an NVIDIA result as Gemini.

## Verified project capabilities in this demo build
- Django session authentication and project ownership filtering.
- Project CRUD via Django REST Framework.
- AI requirement extraction using the selected Gemini or NVIDIA provider.
- Server-Sent Event activity/result delivery to the current frontend.
- Save AI analysis snapshots and list/reopen analysis history.
- Import generated requirements into the selected project with exact-title duplicate handling.
- Project requirement create, list, edit, priority/status update, and delete via owner-scoped Django APIs.

## Important limitations to describe honestly
- Full multi-agent orchestration is not implemented; the agent roles are architectural modules/prototype UI.
- CI/CD execution and live infrastructure telemetry are not end-to-end connected.
- Some dashboard charts and non-core module screens are illustrative/demo data.
- Gemini thought summaries are only shown when Gemini actually returns readable summary events. A thought signature is not a readable summary and must not be presented as one.
- This is a local college-demo build, not a production deployment. Do not present it as production-ready or HIPAA-compliant.

## Final pre-demo checklist
- [ ] `python manage.py check` passes.
- [ ] `python manage.py test nexusai_app` passes.
- [ ] `npm.cmd run lint` passes on the Windows machine.
- [ ] `npm.cmd run build` passes on the Windows machine.
- [ ] Both local servers start without errors.
- [ ] Test Gemini once with a short prompt.
- [ ] Test one save → workspace → refresh persistence flow.
- [ ] Test one add/edit/status/delete requirement flow.
- [ ] Confirm `.env` is not included in the submitted ZIP, screenshots, or Git repository.
- [ ] Keep an offline backup of the local SQLite database before the demo.

## Project-specific Architecture Topology
- Open a project workspace before opening Architecture Topology.
- Click **Generate Architecture with AI**.
- Confirm the architecture uses the active project's saved requirements.
- Confirm provider/model metadata is displayed.
- Navigate away and return; confirm the saved diagram reloads from Django.
- Confirm the diagram is scoped to the signed-in project owner.

## Project Database & ORM Designer
- Open the selected project, then click **Database & ORM Designer**.
- Click **Generate Database Schema with AI** and confirm the model uses the active project's saved requirements.
- Confirm provider/model metadata is shown and that the schema is saved to the project.
- Navigate away, return, and confirm the schema and Django model code reload.
- Explain clearly that generated model code is a reviewable proposal; NexusAI does not execute generated code or modify the application's live Django models automatically.
