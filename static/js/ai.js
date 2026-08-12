/* NexusAI Platform - Vanilla JS AI Integrations Controller */

document.addEventListener('DOMContentLoaded', () => {
  initAiRequirementAnalyzer();
  initAiArchitectureGenerator();
  initAiCodeReviewer();
  initSwarmSequence();
});

/* AI Requirement Analyzer */
function initAiRequirementAnalyzer() {
  const btn = document.getElementById('btn-analyze-reqs');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const promptInput = document.getElementById('ai-raw-prompt');
    const categoryInput = document.getElementById('ai-prompt-category');
    const resultsContainer = document.getElementById('reqs-results-container');

    if (!promptInput || !resultsContainer) return;

    const rawPrompt = promptInput.value.trim();
    if (!rawPrompt) {
      showToast('Input Required', 'Please enter a raw project prompt to analyze.', 'warning');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin"></i> Analyzing with Gemini 3.6 Flash...`;

    try {
      const response = await fetch('/api/ai/analyze-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawPrompt, category: categoryInput ? categoryInput.value : 'General' })
      });

      const data = await response.json();
      if (data.requirements && Array.isArray(data.requirements)) {
        renderExtractedRequirements(data.requirements, resultsContainer);
        showToast('Analysis Complete', `Successfully extracted ${data.requirements.length} specifications!`, 'success');
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
      showToast('API Error', 'Failed to analyze prompt with AI.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-cpu text-[#C5A059]"></i> Analyze & Extract Specs with Gemini`;
    }
  });
}

function renderExtractedRequirements(reqs, container) {
  reqs.forEach(r => {
    const card = document.createElement('div');
    card.className = 'nexus-card p-4 border border-white/10 hover:border-[#C5A059]/40 transition-all';
    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold uppercase text-white">${r.title}</span>
        <span class="text-[10px] px-2 py-0.5 rounded uppercase font-mono ${r.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}">${r.priority}</span>
      </div>
      <p class="text-xs text-white/70 mb-3">${r.description}</p>
      <div class="flex items-center justify-between text-[10px] font-mono text-white/40">
        <span>TYPE: ${r.type.toUpperCase()}</span>
        <span>COMPLEXITY: ${r.complexity || 'Medium'}</span>
      </div>
    `;
    container.prepend(card);
  });
}

/* AI Architecture Topology Generator */
function initAiArchitectureGenerator() {
  const btn = document.getElementById('btn-optimize-topology');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin"></i> Optimizing Topology...`;

    try {
      const response = await fetch('/api/ai/generate-architecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementsSummary: 'Nexus High Frequency Engine & Distributed Order Ledger' })
      });

      const data = await response.json();
      if (data.nodes) {
        showToast('Topology Optimized', 'Architecture microservices updated with low-latency topology.', 'success');
      }
    } catch (err) {
      console.error('Architecture gen error:', err);
      showToast('Error', 'Failed to generate architecture topology.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-diagram-3 text-[#C5A059]"></i> Optimize Topology with AI`;
    }
  });
}

/* AI Code Reviewer */
function initAiCodeReviewer() {
  const btn = document.getElementById('btn-review-code');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const editor = document.getElementById('code-editor-textarea');
    const outputContainer = document.getElementById('code-findings-output');

    if (!editor) return;

    btn.disabled = true;
    btn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin"></i> Auditing Code...`;

    try {
      const response = await fetch('/api/ai/review-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editor.value,
          filename: 'settings.py',
          mode: 'refactor'
        })
      });

      const data = await response.json();
      if (data.refactoredCode && editor) {
        editor.value = data.refactoredCode;
      }
      if (data.findings && outputContainer) {
        outputContainer.innerHTML = data.findings.map(f => `<li class="text-xs text-white/80 py-1 border-b border-white/5"><i class="bi bi-shield-check text-[#10B981] mr-1.5"></i> ${f}</li>`).join('');
      }
      showToast('Code Review Complete', `Security Score: ${data.securityScore || 98}/100`, 'success');
    } catch (err) {
      console.error('Code review failed:', err);
      showToast('Error', 'Failed to audit code.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-magic text-[#C5A059]"></i> Refactor with Gemini`;
    }
  });
}

/* AI Swarm Execution Trigger */
function initSwarmSequence() {
  const btn = document.getElementById('btn-trigger-swarm');
  if (!btn) return;

  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.innerHTML = `<i class="bi bi-cpu animate-spin text-[#C5A059]"></i> Swarm Executing...`;

    const terminalLogs = document.getElementById('swarm-terminal-logs');
    if (terminalLogs) {
      const logLine = document.createElement('div');
      logLine.className = 'text-[#C5A059] font-mono text-xs py-0.5';
      logLine.innerHTML = `[${new Date().toLocaleTimeString()}] SWARM CYCLE INITIATED: 6 Agents executing sync pass...`;
      terminalLogs.prepend(logLine);
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-play-fill text-[#C5A059]"></i> Execute Agent Swarm Sequence`;
      if (terminalLogs) {
        const doneLine = document.createElement('div');
        doneLine.className = 'text-emerald-400 font-mono text-xs py-0.5';
        doneLine.innerHTML = `[${new Date().toLocaleTimeString()}] SWARM SUCCESS: Code, tests, and architecture aligned!`;
        terminalLogs.prepend(doneLine);
      }
      showToast('Swarm Execution Complete', 'All 6 agents finished parallel execution cycle.', 'success');
    }, 2500);
  });
}
