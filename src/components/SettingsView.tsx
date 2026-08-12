import React, { useState } from 'react';
import { SystemSettingsConfig, TeamMember } from '../types';
import { Settings, Download, Users, Sliders, ShieldCheck, Database, Check, Copy, Sparkles, Terminal } from 'lucide-react';

interface SettingsViewProps {
  settings: SystemSettingsConfig;
  team: TeamMember[];
  onUpdateSettings: (newSettings: SystemSettingsConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, team, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'django' | 'team'>('django');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const djangoProjectFiles = {
    'settings.py': `import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'nexusai-production-secret-key')
DEBUG = False
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'nexus_core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'nexus_project.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'nexusai_db'),
        'USER': os.environ.get('DB_USER', 'nexus_admin'),
        'PASSWORD': os.environ.get('DB_PASS', 'secure_pass'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': '5432',
    }
}
`,
    'urls.py': `from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('nexus_core.urls')),
]
`,
    'views.py': `from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from .models import Project, Requirement
from .forms import ProjectForm

def dashboard_view(request):
    projects = Project.objects.all().order_by('-updated_at')
    return render(request, 'nexus_core/dashboard.html', {'projects': projects})

def project_detail(request, pk):
    project = get_object_or_404(Project, pk=pk)
    requirements = project.requirements.all()
    return render(request, 'nexus_core/project_detail.html', {
        'project': project,
        'requirements': requirements
    })
`,
    'models.py': `from django.db import models
import uuid

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='planning')
    progress = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
`,
    'base.html': `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <title>{% block title %}NexusAI Platform{% endblock %}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0D0D0D] text-[#E5E5E5]">
  <nav class="border-b border-white/10 p-4 bg-[#0A0A0A]">
    <span class="font-serif font-bold text-white">NEXUS<span class="text-[#C5A059]">AI</span></span>
  </nav>
  <main class="p-8">
    {% block content %}{% endblock %}
  </main>
</body>
</html>`
  };

  const handleCopyFile = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121212] p-6 rounded-sm border border-white/10">
        <div>
          <div className="flex items-center space-x-2 text-[#C5A059] text-xs font-mono tracking-widest uppercase mb-1">
            <Settings className="w-4 h-4" />
            <span>SYSTEM CONFIGURATION & DJANGO EXPORTER</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">Platform Settings & Project Export</h1>
          <p className="text-xs text-white/50 mt-1">Export full-stack Django backend code templates, configure AI swarm parameters, and manage team permissions.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-1 bg-[#0A0A0A] p-1 rounded-sm border border-white/10">
          <button
            onClick={() => setActiveTab('django')}
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded-xs transition-all ${
              activeTab === 'django' ? 'bg-[#C5A059] text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            DJANGO EXPORT
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded-xs transition-all ${
              activeTab === 'ai' ? 'bg-[#C5A059] text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            AI SWARM CONFIG
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded-xs transition-all ${
              activeTab === 'team' ? 'bg-[#C5A059] text-black font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            TEAM ROLES
          </button>
        </div>
      </div>

      {/* Tab 1: Full-Stack Django Exporter */}
      {activeTab === 'django' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-white/10 rounded-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-[#C5A059]" />
                  <h3 className="text-lg font-mono font-bold text-white uppercase">Django 5.0 Full-Stack Architecture Exporter</h3>
                </div>
                <p className="text-xs text-white/50 mt-1">Reusable Django templates (base.html, views.py, models.py, urls.py) preconfigured with PostgreSQL ORM.</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xs uppercase">
                  READY FOR PRODUCTION
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {Object.entries(djangoProjectFiles).map(([filename, content]) => (
                <div key={filename} className="bg-[#0A0A0A] border border-white/10 rounded-sm p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-mono text-xs font-bold text-[#C5A059]">{filename}</span>
                    <button
                      onClick={() => handleCopyFile(filename, content)}
                      className="flex items-center space-x-1 px-2.5 py-1 text-[10px] font-mono bg-white/5 hover:bg-white/10 text-white rounded-xs border border-white/10"
                    >
                      {copiedFile === filename ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFile === filename ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>

                  <pre className="text-[11px] font-mono text-emerald-300/80 max-h-48 overflow-y-auto leading-relaxed whitespace-pre p-2 bg-[#080808] rounded-xs border border-white/5">
                    {content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Swarm Config */}
      {activeTab === 'ai' && (
        <div className="bg-[#121212] border border-white/10 rounded-sm p-6 space-y-6 max-w-2xl">
          <h3 className="text-lg font-serif font-bold text-white border-b border-white/10 pb-3">AI Engine & Model Parameters</h3>
          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-white/60 mb-1 uppercase">AI MODEL ENGINE</label>
              <input
                type="text"
                disabled
                value="Gemini 3.6 Flash (Primary AI Engine)"
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-sm p-3 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 mb-1 uppercase">TEMPERATURE ({settings.temperature})</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => onUpdateSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1 uppercase">MAX TOKENS</label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => onUpdateSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                  className="w-full bg-[#0D0D0D] border border-white/10 rounded-sm p-2 text-white"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableCeleryWorker}
                  onChange={(e) => onUpdateSettings({ ...settings, enableCeleryWorker: e.target.checked })}
                  className="accent-[#C5A059]"
                />
                <span className="text-white">Enable Celery Async Swarm Queue</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableRedisCache}
                  onChange={(e) => onUpdateSettings({ ...settings, enableRedisCache: e.target.checked })}
                  className="accent-[#C5A059]"
                />
                <span className="text-white">Enable Redis RESP Memory Cache</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Team Roles */}
      {activeTab === 'team' && (
        <div className="bg-[#121212] border border-white/10 rounded-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-lg font-serif font-bold text-white">Team Members & Access Control</h3>
            <span className="text-xs font-mono text-[#C5A059]">4 ACTIVE MEMBERS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {team.map(member => (
              <div key={member.id} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-sm flex items-center space-x-4">
                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full border border-[#C5A059]" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">{member.name}</h4>
                    <span className="text-[10px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-xs">
                      {member.role}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
