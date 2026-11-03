import re
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET
from .models import Project, CodeFile, TestCase

RULES = [
    ("hardcoded-secret", "High", re.compile(r"(?i)(api[_-]?key|secret|password|token)\s*=\s*['\"][^'\"]{8,}['\"]"),
     "Possible hardcoded credential", "Move credentials to environment variables and rotate exposed secrets."),
    ("dynamic-eval", "High", re.compile(r"\beval\s*\("),
     "Dynamic eval() execution", "Avoid eval(); parse and validate input using safe, explicit logic."),
    ("shell-true", "High", re.compile(r"subprocess\.(run|Popen|call)\s*\([\s\S]{0,300}?shell\s*=\s*True"),
     "Subprocess uses shell=True", "Pass an argument list and keep shell=False to reduce command-injection risk."),
    ("dynamic-exec", "Medium", re.compile(r"\bexec\s*\("),
     "Dynamic exec() execution", "Avoid executing dynamically constructed code; use explicit functions or a restricted parser."),
    ("debug-enabled", "Medium", re.compile(r"(?m)^\s*DEBUG\s*=\s*True\s*$"),
     "Django DEBUG is enabled", "Set DEBUG=False outside local development and configure ALLOWED_HOSTS."),
    ("weak-hash", "Medium", re.compile(r"(?i)(md5|sha1)\s*\("),
     "Weak hashing algorithm detected", "Use a modern password-hashing mechanism; for Django passwords use its built-in hashers."),
    ("sql-format", "Medium", re.compile(r"(?i)(execute|raw)\s*\(\s*['\"].*%s.*%"),
     "Potential SQL string formatting", "Use parameterized queries or Django ORM query parameters."),
]

@login_required
@require_GET
def project_quality(request, project_id):
    project = get_object_or_404(Project, id=project_id, owner=request.user)
    code_files = list(CodeFile.objects.filter(project=project).only("id", "name", "path", "language", "content"))
    findings = []
    for file in code_files:
        content = file.content or ""
        for rule_id, severity, pattern, title, recommendation in RULES:
            for match in pattern.finditer(content):
                line = content.count("\n", 0, match.start()) + 1
                findings.append({
                    "id": f"{file.id}-{rule_id}-{line}",
                    "rule": rule_id,
                    "severity": severity,
                    "title": title,
                    "file": file.path or file.name,
                    "line": line,
                    "recommendation": recommendation,
                    "status": "Open",
                })
    counts = {level: sum(1 for item in findings if item["severity"] == level)
              for level in ("Critical", "High", "Medium", "Low")}
    tests = list(TestCase.objects.filter(project=project).order_by("-id").values(
        "id", "name", "suite", "duration", "status", "coverage"
    )[:100])
    return JsonResponse({
        "success": True,
        "project": {"id": project.id, "name": project.name},
        "files_scanned": len(code_files),
        "findings": findings,
        "counts": counts,
        "tests": tests,
        "test_summary": {
            "total": len(tests),
            "passed": sum(1 for item in tests if item["status"] == "passed"),
            "failed": sum(1 for item in tests if item["status"] == "failed"),
        },
        "scan_type": "rule-based-static-analysis",
    })
