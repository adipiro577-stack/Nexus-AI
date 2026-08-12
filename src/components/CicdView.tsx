import React, { useState } from 'react';
import { CiCdPipeline } from '../types';
import { Workflow, Play, CheckCircle2, Clock, GitBranch, Terminal, Copy, Check, ShieldCheck } from 'lucide-react';

interface CicdViewProps {
  pipelines: CiCdPipeline[];
}

export const CicdView: React.FC<CicdViewProps> = ({ pipelines }) => {
  const [selectedPipe, setSelectedPipe] = useState<CiCdPipeline>(pipelines[0]);
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const githubActionsYaml = `name: NexusAI CI/CD Workflow Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python 3.12
      uses: actions/setup-python@v5
      with:
        python-version: "3.12"

    - name: Install Dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt

    - name: Run Django Security & Unit Tests
      run: |
        python manage.py test --verbosity=2

    - name: Build Frontend Assets & Vite
      run: |
        npm ci
        npm run build

    - name: Deploy to Cloud Run / Docker Container
      if: github.ref == 'refs/heads/main'
      run: |
        echo "Deploying NexusAI Django WSGI backend to production..."
`;

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(githubActionsYaml);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const handleTriggerPipeline = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121212] p-6 rounded-sm border border-white/10">
        <div>
          <div className="flex items-center space-x-2 text-[#C5A059] text-xs font-mono tracking-widest uppercase mb-1">
            <Workflow className="w-4 h-4" />
            <span>CONTINUOUS INTEGRATION & DEPLOYMENT</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">CI/CD Pipeline Engine</h1>
          <p className="text-xs text-white/50 mt-1">Automated build verification, Django unit test execution, security scanning, and GitHub Actions workflow generator.</p>
        </div>

        <button
          onClick={handleTriggerPipeline}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-mono tracking-wider uppercase bg-[#C5A059] hover:bg-[#d9b36a] text-black font-semibold rounded-sm transition-all shadow-sm"
        >
          <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'RUNNING PIPELINE...' : 'TRIGGER PIPELINE'}</span>
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline List Sidebar */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-white/50 tracking-wider uppercase">WORKFLOW PIPELINES ({pipelines.length})</div>
          <div className="space-y-2">
            {pipelines.map(pipe => (
              <div
                key={pipe.id}
                onClick={() => setSelectedPipe(pipe)}
                className={`p-4 rounded-sm border cursor-pointer transition-all ${
                  selectedPipe.id === pipe.id ? 'bg-[#181818] border-[#C5A059]' : 'bg-[#121212] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-white">{pipe.name}</span>
                  <span className="px-2 py-0.5 text-[9px] font-mono bg-emerald-500/20 text-emerald-300 rounded-xs uppercase">
                    {pipe.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4 mt-2 text-[10px] font-mono text-white/40">
                  <span className="flex items-center space-x-1">
                    <GitBranch className="w-3 h-3 text-[#C5A059]" />
                    <span>{pipe.branch}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{pipe.duration}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Pipeline Detail & GitHub Actions YAML */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121212] border border-white/10 rounded-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-mono font-bold text-white">{selectedPipe.name}</h2>
                <div className="flex items-center space-x-3 text-xs font-mono text-white/50 mt-1">
                  <span>Branch: <span className="text-[#C5A059]">{selectedPipe.branch}</span></span>
                  <span>Commit: <span className="text-white">{selectedPipe.commitHash}</span></span>
                  <span>Last Run: <span>{selectedPipe.lastRun}</span></span>
                </div>
              </div>
            </div>

            {/* Steps Execution Pipeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono text-white/50 tracking-wider uppercase">BUILD STEPS</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedPipe.steps.map((step, idx) => (
                  <div key={idx} className="bg-[#0A0A0A] border border-white/5 p-3 rounded-sm flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-mono text-white">
                      <Terminal className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>{step.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{step.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GitHub Actions YAML Code */}
          <div className="bg-[#121212] border border-white/10 rounded-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 text-xs font-mono text-[#C5A059] uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>GENERATE .GITHUB/WORKFLOWS/MAIN.YAML</span>
              </div>

              <button
                onClick={handleCopyYaml}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono bg-white/5 hover:bg-white/10 text-white rounded-sm border border-white/10 transition-all"
              >
                {copiedYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>COPY YAML</span>
              </button>
            </div>

            <div className="bg-[#0A0A0A] p-4 rounded-sm border border-white/5 max-h-64 overflow-y-auto font-mono text-xs text-blue-300/90 leading-relaxed whitespace-pre">
              {githubActionsYaml}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
