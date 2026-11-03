
import os
import sys
import subprocess
import tempfile
import xml.etree.ElementTree as ET

from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from .models import Project, TestCase


TEST_SUITE_NAME = "NexusAI Django Backend"


@login_required
@require_POST
def run_project_tests(request, project_id):
    project = get_object_or_404(
        Project,
        id=project_id,
        owner=request.user
    )

    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            report_path = os.path.join(temp_dir, "pytest-report.xml")

            command = [
                sys.executable,
                "-m",
                "pytest",
                "nexusai_app",
                "-q",
                f"--junitxml={report_path}",
            ]

            result = subprocess.run(
                command,
                cwd=settings.BASE_DIR,
                capture_output=True,
                text=True,
                timeout=90,
                shell=False
            )

            if not os.path.exists(report_path):
                return JsonResponse({
                    "success": False,
                    "message": "Pytest did not generate a test report.",
                    "output": (result.stdout + "\n" + result.stderr)[-8000:]
                }, status=500)

            root = ET.parse(report_path).getroot()

            test_results = []

            for test in root.iter("testcase"):
                if test.find("skipped") is not None:
                    continue

                failed = (
                    test.find("failure") is not None
                    or test.find("error") is not None
                )

                test_results.append(
                    TestCase(
                        project=project,
                        name=f"{test.get('classname', '')}::{test.get('name', 'Unnamed test')}"[:255],
                        suite=TEST_SUITE_NAME,
                        duration=f"{float(test.get('time', 0)):.2f}s",
                        status="failed" if failed else "passed",
                        coverage="N/A",
                    )
                )

            TestCase.objects.filter(
                project=project,
                suite=TEST_SUITE_NAME
            ).delete()

            TestCase.objects.bulk_create(test_results)

            passed = sum(1 for item in test_results if item.status == "passed")
            failed = sum(1 for item in test_results if item.status == "failed")

            return JsonResponse({
                "success": result.returncode == 0,
                "suite": TEST_SUITE_NAME,
                "total": len(test_results),
                "passed": passed,
                "failed": failed,
                "output": (result.stdout + "\n" + result.stderr)[-8000:],
            })

    except subprocess.TimeoutExpired:
        return JsonResponse({
            "success": False,
            "message": "Test execution exceeded the 90-second time limit."
        }, status=504)

    except Exception as error:
        return JsonResponse({
            "success": False,
            "message": str(error)
        }, status=500)
