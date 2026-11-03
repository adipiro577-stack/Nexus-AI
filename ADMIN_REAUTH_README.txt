NexusAI Admin Re-authentication Patch

Purpose
- The NexusAI "Open Django Admin" button now opens a dedicated password-confirmation page.
- The user must re-enter the password of their currently signed-in Django staff account. The form uses autocomplete=off to discourage browser password autofill.
- Direct visits to /admin/ are also gated when no recent confirmation exists.
- The re-authentication marker expires after 5 minutes of inactivity (sliding while the admin is active).
- Re-authentication does not log the user out of the main NexusAI application.

Files in this patch
- index.html
- nexus_project/settings.py
- nexusai_app/middleware.py (new)
- nexusai_app/views.py
- nexusai_app/urls.py
- nexusai_app/tests/test_admin_reauth.py (new)
- templates/pages/admin_reauth.html (new)

Apply
1. Make a backup of your current project folder or at least the listed files.
2. Extract this ZIP into F:\Projects\Nexus-AI and allow these files to merge/replace.
3. Do not replace .env, db.sqlite3, .venv, or node_modules. They are not in this patch.
4. Run:
   .\.venv\Scripts\python.exe manage.py check
   .\.venv\Scripts\python.exe manage.py test nexusai_app
   npm.cmd run lint
   npm.cmd run build
5. Restart Django and Express.
6. In NexusAI, open Database & ORM Designer and click Open Django Admin. Enter your password on the NexusAI security-check page.

Security notes
- This checks the password against Django's stored password hash; it never stores or logs the password.
- It preserves the normal NexusAI login session.
- Clicking the NexusAI button always clears the previous admin unlock and asks again.
- A direct /admin/ visit requires fresh confirmation if no recent confirmation exists.
- Admin pages stay unlocked while actively used; after 5 minutes of inactivity, confirmation is required again.
- The normal Django Admin logout still logs out the shared Django account session; use it only when you intend to sign out of NexusAI as well.
- This is a local demo convenience/security layer, not a substitute for HTTPS, secure deployment settings, or strong account passwords in production.
