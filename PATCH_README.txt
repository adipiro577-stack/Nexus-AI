NexusAI Login Account Details Patch

Files: nexusai_app/views.py and templates/pages/database.html

Apply by extracting into the project root and replacing those two files.
No migrations, database writes, account changes, password exposure, or database reset.
Staff/superusers see all registered accounts; regular users see only their own account details.
Restart Django and refresh /database/.
