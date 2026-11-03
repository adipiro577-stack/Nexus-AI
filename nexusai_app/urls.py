from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import settings_api, quality_api, views, auth_api, analysis_api, requirements_api, architecture_api, database_api, code_files_api, dashboard_api, testing_api, tasks_api, cicd_api, sdlc_api, telemetry_api
from .api_views import ProjectViewSet, project_workspace_summary
from .health import health_check

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')

urlpatterns = [
    path('api/projects/summary/', project_workspace_summary, name='project_workspace_summary'),
    path('api/dashboard/summary/', dashboard_api.dashboard_summary, name='dashboard_summary'),
    path('api/projects/<int:project_id>/quality/', quality_api.project_quality, name='project_quality'),
    path('api/sdlc/overview/', sdlc_api.sdlc_overview, name='sdlc_overview'),
    path('api/telemetry/overview/', telemetry_api.telemetry_overview, name='telemetry_overview'),

    path('admin-access/', views.admin_reauth_view, name='admin_reauth'),
    path('api/health/', health_check, name='health_check'),
    path('api/settings/', settings_api.user_settings, name='user_settings_api'),
    path('api/auth/csrf/', auth_api.csrf_token, name='api_auth_csrf'),
    path('api/auth/me/', auth_api.current_user, name='api_auth_me'),
    path('api/auth/register/', auth_api.register, name='api_auth_register'),
    path('api/auth/login/', auth_api.login_user, name='api_auth_login'),
    path('api/auth/logout/', auth_api.logout_user, name='api_auth_logout'),
    path('', views.dashboard_view, name='dashboard'),
    path('projects/', views.projects_view, name='projects'),
    path('requirements/', views.requirements_view, name='requirements'),
    path('architecture/', views.architecture_view, name='architecture'),
    path('database/', views.database_view, name='database'),
    path('agents/', views.agents_view, name='agents'),
    path('code/', views.code_studio_view, name='code'),
    path('quality/', views.quality_docs_view, name='quality'),
    path('tasks/', views.tasks_view, name='tasks'),
    path('analytics/', views.analytics_view, name='analytics'),
    path('cicd/', views.cicd_view, name='cicd'),
    path('notifications/', views.notifications_view, name='notifications'),
    path('settings/', views.settings_view, name='settings'),
    path('showcase/', views.showcase_view, name='showcase'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),

    # API Routes
    path(
    'api/projects/<int:project_id>/tests/run/',
    testing_api.run_project_tests,
    name='run_project_tests'
    ),
    path(
    'api/projects/<int:project_id>/tasks/',
    tasks_api.project_tasks,
    name='project_tasks'
    ),
    path(
    'api/projects/<int:project_id>/tasks/<int:task_id>/',
    tasks_api.update_task,
    name='update_task'
    ),
    path(
    'api/cicd/run/',
    cicd_api.run_pipeline,
    name='run_cicd_pipeline'
    ),
    path('api/cicd/history/', cicd_api.pipeline_history, name='cicd_pipeline_history'),
    path('api/ai/analyze-requirements', views.api_analyze_requirements, name='api_analyze_requirements'),
    path('api/ai/generate-architecture', views.api_generate_architecture, name='api_generate_architecture'),
    path('api/ai/review-code', views.api_review_code, name='api_review_code'),
    path('api/projects/<int:project_id>/code-files/', code_files_api.project_code_files, name='project_code_files'),
    path('api/projects/<int:project_id>/code-files/<int:file_id>/', code_files_api.project_code_file_detail, name='project_code_file_detail'),    # Project Analysis History APIs
    path(
        'api/projects/<int:project_id>/analyses/',
        analysis_api.project_analysis_list_create,
        name='project_analysis_list_create'
    ),
    path(
        'api/projects/<int:project_id>/analyses/<int:analysis_id>/',
        analysis_api.project_analysis_detail,
        name='project_analysis_detail'
    ),
    path(
        'api/projects/<int:project_id>/requirements/',
        requirements_api.project_requirement_list_create,
        name='project_requirement_list_create'
    ),
    path(
        'api/projects/<int:project_id>/requirements/<int:requirement_id>/',
        requirements_api.project_requirement_detail,
        name='project_requirement_detail'
    ),
    path(
        'api/projects/<int:project_id>/architecture/',
        architecture_api.project_architecture,
        name='project_architecture'
    ),
    path(
        'api/projects/<int:project_id>/database-design/',
        database_api.project_database_design,
        name='project_database_design'
    ),
    path('api/', include(router.urls)),
]

