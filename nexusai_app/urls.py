from django.urls import path
from . import views

urlpatterns = [
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

    # API Routes
    path('api/ai/analyze-requirements', views.api_analyze_requirements, name='api_analyze_requirements'),
    path('api/ai/generate-architecture', views.api_generate_architecture, name='api_generate_architecture'),
    path('api/ai/review-code', views.api_review_code, name='api_review_code'),
]
