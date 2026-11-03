/* NexusAI Platform - Vanilla JS AI Integrations Controller */

function getNexusAiCsrfHeaders() {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  const headers = { 'Content-Type': 'application/json' };
  if (match) headers['X-CSRFToken'] = decodeURIComponent(match[1]);
  return headers;
}

document.addEventListener('DOMContentLoaded', () => {
  initAiRequirementAnalyzer();
  initAiArchitectureGenerator();
  initAiCodeReviewer();
});


/* AI Requirement Analyzer */

// Safely add activity messages without inserting model-generated HTML.
function appendAiActivityItem(container, label, message) {
  const item = document.createElement('div');
  item.className = 'border-b border-white/10 pb-3 last:border-0 last:pb-0';

  const heading = document.createElement('div');
  heading.className = 'text-[10px] font-bold tracking-wider text-[#C5A059] mb-1';
  heading.textContent = label;

  const description = document.createElement('p');
  description.className = 'text-xs text-white/75 whitespace-pre-wrap leading-relaxed';
  description.textContent = message;

  item.append(heading, description);
  container.appendChild(item);
  container.scrollTop = container.scrollHeight;
}

function initAiRequirementAnalyzer() {
  const btn = document.getElementById('btn-analyze-reqs');
  const promptInput = document.getElementById('ai-raw-prompt');
  const categoryInput = document.getElementById('ai-prompt-category');
  const resultsContainer = document.getElementById('reqs-results-container');

  const activityPanel = document.getElementById('ai-activity-panel');
  const activityToggle = document.getElementById('ai-activity-toggle');
  const activityBody = document.getElementById('ai-activity-body');
  const activityChevron = document.getElementById('ai-activity-chevron');
  const activityTitle = document.getElementById('ai-activity-title');
  const activityList = document.getElementById('ai-activity-list');
  const activityStatus = document.getElementById('ai-activity-status');

  if (!btn || !promptInput || !resultsContainer) return;

  // Expand/collapse the activity panel.
  if (activityToggle && activityBody && !activityToggle.dataset.bound) {
    activityToggle.dataset.bound = 'true';

    activityToggle.addEventListener('click', () => {
      const isExpanded = !activityBody.classList.contains('hidden');

      activityBody.classList.toggle('hidden', isExpanded);
      activityToggle.setAttribute('aria-expanded', String(!isExpanded));

      if (activityChevron) {
        activityChevron.classList.toggle('bi-chevron-up', !isExpanded);
        activityChevron.classList.toggle('bi-chevron-down', isExpanded);
      }
    });
  }

  btn.addEventListener('click', async () => {
    const rawPrompt = promptInput.value.trim();

    if (!rawPrompt) {
      showToast(
        'Input Required',
        'Please enter a project description to analyze.',
        'warning'
      );
      return;
    }

    const originalButtonHtml = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML =
      '<i class="bi bi-arrow-repeat animate-spin"></i> AI is analyzing...';

    if (activityPanel) activityPanel.classList.remove('hidden');
    if (activityList) activityList.replaceChildren();

    if (activityBody) activityBody.classList.remove('hidden');

    if (activityToggle) {
      activityToggle.setAttribute('aria-expanded', 'true');
    }

    if (activityChevron) {
      activityChevron.classList.add('bi-chevron-up');
      activityChevron.classList.remove('bi-chevron-down');
    }

    if (activityTitle) {
      activityTitle.textContent = 'Connecting to AI provider...';
    }

    if (activityStatus) {
      activityStatus.textContent = 'Waiting for AI activity...';
    }

    let completed = false;
    let receivedRequirements = false;
    let activeProvider = 'Google Gemini';
    let activeModel = 'gemini-3.8-flash';
    const pendingThinkingSummaries = [];
    let pendingGeneratedRequirements = [];

    try {
      const response = await fetch('/api/ai/analyze-requirements/stream', {
        method: 'POST',
        headers: getNexusAiCsrfHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
          rawPrompt,
          category: categoryInput ? categoryInput.value : 'General'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.error || `Request failed with HTTP ${response.status}.`
        );
      }

      if (
        !response.headers.get('content-type')?.includes('text/event-stream') ||
        !response.body
      ) {
        throw new Error('The server did not return a valid streaming response.');
      }

      const processSseBlock = (block) => {
        let eventName = 'message';
        const dataLines = [];

        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart());
          }
        }

        if (!dataLines.length) return;

        const dataText = dataLines.join('\n');
        if (dataText === '[DONE]') return;

        const payload = JSON.parse(dataText);

        if (eventName === 'meta') {
          activeProvider = String(payload.provider || activeProvider);
          activeModel = String(payload.model || activeModel);
          if (activityTitle) activityTitle.textContent = `${activeProvider} is working...`;
        }

        else if (eventName === 'activity') {
          const message = String(payload.message || `${activeProvider} is working.`);

          if (activityTitle) {
            activityTitle.textContent = `${activeProvider} is working...`;
          }

          if (activityStatus) {
            activityStatus.textContent = message;
          }

          if (activityList) {
            appendAiActivityItem(activityList, 'ACTIVITY', message);
          }
        }

        else if (eventName === 'thinking') {
          const summary = payload.text;

          if (typeof summary === 'string' && summary.trim()) {
            pendingThinkingSummaries.push(summary.trim());
            if (activityTitle) {
              activityTitle.textContent = `${activeProvider} is thinking...`;
            }

            if (activityStatus) {
              activityStatus.textContent = `Receiving ${activeProvider} activity summary...`;
            }

            if (activityList) {
              appendAiActivityItem(
                activityList,
                `${activeProvider.toUpperCase()} THINKING`,
                summary
              );
            }
          }
        }

        else if (eventName === 'result') {
          if (!Array.isArray(payload.requirements)) {
            throw new Error(`${activeProvider} returned an invalid requirements result.`);
          }
          pendingGeneratedRequirements = payload.requirements.map(
          requirement => ({ ...requirement })
          );

          renderExtractedRequirements(
            payload.requirements,
            resultsContainer
          );

          receivedRequirements = true;

          if (activityList) {
            appendAiActivityItem(
              activityList,
              'RESULT READY',
              `${payload.requirements.length} requirements generated successfully.`
            );
          }
        }

        else if (eventName === 'complete') {
          completed = payload.success === true;

          if (completed) {
            if (activityTitle) {
              activityTitle.textContent = 'Analysis complete';
            }

            if (activityStatus) {
              activityStatus.textContent =
                `Completed successfully • ${payload.count} requirements`;
            }

            if (activityList) {
              appendAiActivityItem(
                activityList,
                'COMPLETED',
                `${activeProvider} finished analyzing the project requirements.`
              );
            }
          }
        }

        else if (eventName === 'error') {
          throw new Error(
            payload.message || 'AI streaming analysis failed.'
          );
        }
      };

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          buffer += decoder.decode(
            value || new Uint8Array(),
            { stream: !done }
          );

          let boundary;

          while ((boundary = /\r?\n\r?\n/.exec(buffer)) !== null) {
            const block = buffer.slice(0, boundary.index);
            buffer = buffer.slice(boundary.index + boundary[0].length);

            if (block.trim()) {
              processSseBlock(block);
            }
          }

          if (done) break;
        }

        if (buffer.trim()) {
          processSseBlock(buffer);
        }
      } finally {
        reader.releaseLock();
      }

      if (!completed || !receivedRequirements) {
        throw new Error(`${activeProvider} stream ended before the analysis completed.`);
      }
      // Store completed provider metadata and analysis for Project Workspace
      window.nexusPendingAnalysis = {
    prompt: rawPrompt,
    category: categoryInput ? categoryInput.value : 'General',
    provider: activeProvider,
    model: activeModel,
    thinkingSummaries: [...pendingThinkingSummaries],
    requirements: pendingGeneratedRequirements.map(
        requirement => ({ ...requirement })
    )
      };

      // Show Save button after successful analysis
      const saveButton = document.getElementById('btn-save-analysis');

      if (saveButton) {
      saveButton.classList.remove('hidden');
      }

      window.dispatchEvent(
      new CustomEvent('nexus:analysis-ready', {
        detail: window.nexusPendingAnalysis
      })
      );

      showToast(
        'Analysis Complete',
        `${activeProvider} successfully generated your project requirements.`,
        'success'
      );

    } catch (error) {
      console.error('AI streaming analysis failed:', error);

      if (activityTitle) {
        activityTitle.textContent = 'Analysis failed';
      }

      if (activityStatus) {
        activityStatus.textContent = error.message || 'Unknown error';
      }

      if (activityList) {
        appendAiActivityItem(
          activityList,
          'ERROR',
          error.message || 'AI analysis failed.'
        );
      }

      showToast(
        'AI Analysis Failed',
        error.message || 'Could not complete AI analysis.',
        'error'
      );

    } finally {
      btn.disabled = false;
      btn.innerHTML = originalButtonHtml;
    }
  });
}

/* Safely render generated requirements */
function renderExtractedRequirements(reqs, container) {
  container.replaceChildren();

  reqs.forEach((r) => {
    const card = document.createElement('div');
    card.className =
      'nexus-card p-4 border border-white/10 hover:border-[#C5A059]/40 transition-all';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-2';

    const title = document.createElement('span');
    title.className = 'text-xs font-semibold uppercase text-white';
    title.textContent = String(r.title || 'Untitled requirement');

    const priority = document.createElement('span');
    priority.className =
      'text-[10px] px-2 py-0.5 rounded uppercase font-mono';

    const priorityValue = ['high', 'medium', 'low'].includes(r.priority)
      ? r.priority
      : 'medium';

    priority.classList.add(
      ...(priorityValue === 'high'
        ? ['bg-rose-500/10', 'text-rose-400', 'border', 'border-rose-500/30']
        : ['bg-amber-500/10', 'text-amber-400', 'border', 'border-amber-500/30'])
    );

    priority.textContent = priorityValue;

    header.append(title, priority);

    const description = document.createElement('p');
    description.className = 'text-xs text-white/70 mb-3';
    description.textContent = String(r.description || '');

    const metadata = document.createElement('div');
    metadata.className =
      'flex items-center justify-between text-[10px] font-mono text-white/40';

    const type = document.createElement('span');
    type.textContent =
      `TYPE: ${String(r.type || 'functional').toUpperCase()}`;

    const complexity = document.createElement('span');
    complexity.textContent =
      `COMPLEXITY: ${String(r.complexity || 'Medium')}`;

    metadata.append(type, complexity);
    card.append(header, description, metadata);
    container.appendChild(card);
  });
}

/* Project-aware AI Architecture Topology Generator */
function initAiArchitectureGenerator() {
  const button = document.getElementById('btn-optimize-topology');
  const svg = document.getElementById('architecture-topology-svg');
  const status = document.getElementById('architecture-generation-status');
  const caption = document.getElementById('architecture-project-caption');
  const providerMeta = document.getElementById('architecture-provider-meta');
  if (!button || !svg || button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';

  const colors = {
    gateway: '#C5A059',
    service: '#3B82F6',
    database: '#10B981',
    cache: '#A78BFA',
    queue: '#F97316',
    ai: '#22D3EE',
    auth: '#F472B6'
  };
  const svgNS = 'http://www.w3.org/2000/svg';

  function svgElement(tag, attributes = {}, text = '') {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text) element.textContent = text;
    return element;
  }

  function renderTopology(graph) {
    const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
    const connections = Array.isArray(graph?.connections) ? graph.connections : [];
    svg.replaceChildren();
    if (!nodes.length) {
      svg.appendChild(svgElement('text', {
        x: 500, y: 285, fill: '#888888', 'font-size': 18, 'text-anchor': 'middle'
      }, 'No saved architecture yet. Generate one with AI.'));
      return;
    }

    const rows = Math.ceil(nodes.length / 3);
    const viewHeight = Math.max(500, 120 + rows * 165);
    svg.setAttribute('viewBox', `0 0 1000 ${viewHeight}`);
    svg.setAttribute('height', String(Math.max(520, viewHeight)));

    const byId = new Map(nodes.map(node => [String(node.id), node]));

    // Draw connectors first so nodes stay visually above the lines.
    connections.forEach(connection => {
      const from = byId.get(String(connection.from));
      const to = byId.get(String(connection.to));
      if (!from || !to) return;
      const line = svgElement('line', {
        x1: from.x, y1: from.y, x2: to.x, y2: to.y,
        stroke: '#8D7446', 'stroke-width': 2, 'stroke-opacity': 0.85
      });
      svg.appendChild(line);
      const midX = (Number(from.x) + Number(to.x)) / 2;
      const midY = (Number(from.y) + Number(to.y)) / 2 - 8;
      const label = [connection.label, connection.protocol].filter(Boolean).join(' · ');
      if (label) {
        svg.appendChild(svgElement('text', {
          x: midX, y: midY, fill: '#AFA18A', 'font-size': 10,
          'text-anchor': 'middle', 'paint-order': 'stroke', stroke: '#0B0B0B', 'stroke-width': 4
        }, label.slice(0, 64)));
      }
    });

    nodes.forEach(node => {
      const x = Number(node.x);
      const y = Number(node.y);
      const stroke = colors[node.type] || colors.service;
      const group = svgElement('g');
      group.appendChild(svgElement('rect', {
        x: x - 94, y: y - 38, width: 188, height: 76, rx: 12,
        fill: '#151515', stroke, 'stroke-width': 2
      }));
      group.appendChild(svgElement('text', {
        x, y: y - 5, fill: '#FFFFFF', 'font-size': 13,
        'font-weight': '700', 'text-anchor': 'middle'
      }, String(node.label || 'Service').slice(0, 28)));
      group.appendChild(svgElement('text', {
        x, y: y + 17, fill: '#B9B9B9', 'font-size': 10,
        'text-anchor': 'middle'
      }, String(node.sublabel || node.type || '').slice(0, 34)));
      svg.appendChild(group);
    });
  }

  async function loadSavedTopology() {
    const project = window.nexusCurrentWorkspaceProject;
    if (!project?.id) {
      if (caption) caption.textContent = 'Open a project workspace first.';
      if (status) status.textContent = 'No active project selected.';
      if (providerMeta) providerMeta.textContent = '';
      renderTopology({ nodes: [], connections: [] });
      return;
    }
    if (caption) caption.textContent = `${project.name || 'Current project'} · ${project.category || 'General'}`;
    try {
      const response = await fetch(
        `/django-api/projects/${encodeURIComponent(project.id)}/architecture/`,
        { headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        throw new Error(data.detail || 'Could not load saved architecture.');
      }
      renderTopology(data);
      if (status) {
        status.textContent = data.nodes?.length
          ? `Loaded ${data.nodes.length} saved components and ${data.connections.length} connections.`
          : 'No architecture saved for this project. Generate one with AI.';
      }
    } catch (error) {
      if (status) status.textContent = error.message || 'Could not load saved architecture.';
    }
  }

  button.addEventListener('click', async () => {
    const project = window.nexusCurrentWorkspaceProject;
    if (!project?.id) {
      showToast('Project Required', 'Open a project from Project Workspace before generating architecture.', 'warning');
      if (status) status.textContent = 'Open a project workspace first.';
      return;
    }

    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="bi bi-arrow-repeat animate-spin"></i> Generating Architecture...';
    if (status) status.textContent = 'Loading project details and saved requirements...';
    if (providerMeta) providerMeta.textContent = '';

    try {
      const response = await fetch('/api/ai/generate-architecture', {
        method: 'POST',
        headers: getNexusAiCsrfHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({ projectId: project.id })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true || !Array.isArray(data.nodes) || !Array.isArray(data.connections)) {
        throw new Error(data.error || 'Failed to generate project architecture.');
      }

      if (status) status.textContent = 'Saving architecture to this project workspace...';
      const saveResponse = await djangoAuthRequest(
        `/django-api/projects/${encodeURIComponent(project.id)}/architecture/`,
        { method: 'PUT', body: JSON.stringify({ nodes: data.nodes, connections: data.connections }) }
      );
      const saved = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok || saved.success !== true) {
        throw new Error(saved.detail || 'Architecture was generated but could not be saved.');
      }

      renderTopology(saved);
      if (status) status.textContent = `Generated and saved ${saved.nodes.length} components with ${saved.connections.length} connections for ${project.name}.`;
      if (providerMeta) providerMeta.textContent = `${data.provider || 'AI'} · ${data.model || 'Model'}`;
      showToast('Architecture Generated', `Saved ${saved.nodes.length} project-specific components.`, 'success');
    } catch (error) {
      console.error('Project architecture generation error:', error);
      if (status) status.textContent = error.message || 'Failed to generate architecture.';
      showToast('Architecture Failed', error.message || 'Failed to generate architecture topology.', 'error');
    } finally {
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  });

  document.querySelectorAll('[data-view="architecture"]').forEach(link => {
    link.addEventListener('click', () => {
      loadSavedTopology();
    });
  });
  window.addEventListener('nexus:workspace-project-opened', loadSavedTopology);
}


/* AI Code Studio — Generate / Analyze / Fix */
function initAiCodeReviewer() {
  const editor = document.getElementById('code-editor-textarea');
  const output = document.getElementById('code-findings-output');
  const promptInput = document.getElementById('code-studio-prompt');
  const reviewBtn = document.getElementById('btn-review-code');
  const generateBtn = document.getElementById('btn-generate-code');
  const fixBtn = document.getElementById('btn-fix-code');
  if (!editor) return;
  const filenameInput = document.getElementById('code-filename');
  const savedFilesSelect = document.getElementById('code-saved-files');
  const saveButton = document.getElementById('btn-save-code');
  const refreshFilesButton = document.getElementById('btn-refresh-code-files');
  const loadButton = document.getElementById('btn-load-code');
  const saveStatus = document.getElementById('code-save-status');
  let savedCodeFiles = [];
  const projectStatus = document.getElementById('code-studio-project-status');
  const updateCodeStudioProject = () => { const project = window.nexusCurrentWorkspaceProject; if (projectStatus) projectStatus.textContent = project?.id ? `Working in: ${project.name || project.title || `Project #${project.id}`}` : 'Select a project in Project Workspace first'; };
  updateCodeStudioProject();
  window.addEventListener('nexus:workspace-project-opened', updateCodeStudioProject);

  const getCodeFilesUrl = () => {
    const project = window.nexusCurrentWorkspaceProject;
    if (!project?.id) throw new Error('Open a project from Project Workspace first.');
    return `/django-api/projects/${encodeURIComponent(project.id)}/code-files/`;
  };

  const getCurrentFilename = () => {
    const name = (filenameInput?.value || 'settings.py').trim();
    if (!name || name.length > 255 || /[\\\\/]/.test(name) || name === '.' || name === '..') {
      throw new Error('Enter a valid file name, for example settings.py.');
    }
    return name;
  };

  async function saveCurrentCodeFile(showMessage = true) {
    try {
      const url = getCodeFilesUrl();
      const name = getCurrentFilename();
      const response = await fetch(url, {
        method: 'POST',
        headers: getNexusAiCsrfHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
          name,
          path: name,
          language: name.split('.').pop() || 'text',
          content: editor.value
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.detail || data.error || `Save failed (HTTP ${response.status}).`);
      }
      if (saveStatus) saveStatus.textContent = `Saved ${name} to the selected project.`;
      if (showMessage) showToast('Code Saved', `${name} was saved to this project.`, 'success');
      await refreshSavedCodeFiles(false);
      return true;
    } catch (error) {
      if (saveStatus) saveStatus.textContent = error.message || 'Could not save code.';
      if (showMessage) showToast('Save Failed', error.message || 'Could not save this file.', 'error');
      return false;
    }
  }

  async function refreshSavedCodeFiles(showMessage = true) {
    try {
      const response = await fetch(getCodeFilesUrl(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.error || `Could not load files (HTTP ${response.status}).`);
      savedCodeFiles = Array.isArray(data) ? data : (data.files || data.results || data.data || []);
      if (!Array.isArray(savedCodeFiles)) savedCodeFiles = [];
      if (savedFilesSelect) {
        const previous = savedFilesSelect.value;
        savedFilesSelect.replaceChildren();
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = savedCodeFiles.length ? 'Select a saved file' : 'No saved files';
        savedFilesSelect.appendChild(placeholder);
        savedCodeFiles.forEach((file, index) => {
          const option = document.createElement('option');
          option.value = String(file.id ?? index);
          option.textContent = String(file.name || file.path || `File ${index + 1}`);
          savedFilesSelect.appendChild(option);
        });
        if (savedCodeFiles.some((file, index) => String(file.id ?? index) === previous)) {
          savedFilesSelect.value = previous;
        }
      }
      if (saveStatus) saveStatus.textContent = `${savedCodeFiles.length} saved file(s) in this project.`;
      if (showMessage) showToast('Files Refreshed', `${savedCodeFiles.length} saved file(s) found.`, 'success');
      return savedCodeFiles;
    } catch (error) {
      if (saveStatus) saveStatus.textContent = error.message || 'Could not load saved files.';
      if (showMessage) showToast('Load Failed', error.message || 'Could not load saved files.', 'error');
      return [];
    }
  }

  async function loadSelectedCodeFile() {
    try {
      if (!savedFilesSelect?.value) throw new Error('Select a saved file first.');
      const index = savedCodeFiles.findIndex((file, i) => String(file.id ?? i) === savedFilesSelect.value);
      const file = savedCodeFiles[index];
      if (!file) throw new Error('Saved file not found. Click Refresh and try again.');
      let content = file.content;
      if (typeof content !== 'string' && file.id != null) {
        const response = await fetch(`${getCodeFilesUrl()}${encodeURIComponent(file.id)}/`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store'
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || data.error || 'Could not load the selected file.');
        const loadedFile = data.file || data.data || data;
        content = loadedFile.content;
      }
      if (typeof content !== 'string') throw new Error('The saved file did not include its code content.');
      if (!window.confirm(`Load ${file.name || file.path || 'this file'} into the editor? Unsaved editor content will be replaced.`)) return;
      editor.value = content;
      if (filenameInput) filenameInput.value = file.name || file.path || 'settings.py';
      if (saveStatus) saveStatus.textContent = `Loaded ${filenameInput?.value || 'saved file'}.`;
      showToast('File Loaded', 'Saved code is now in the editor.', 'success');
    } catch (error) {
      showToast('Load Failed', error.message || 'Could not load this file.', 'error');
    }
  }

  if (saveButton && !saveButton.dataset.bound) {
    saveButton.dataset.bound = '1';
    saveButton.addEventListener('click', () => saveCurrentCodeFile(true));
  }
  if (refreshFilesButton && !refreshFilesButton.dataset.bound) {
    refreshFilesButton.dataset.bound = '1';
    refreshFilesButton.addEventListener('click', () => refreshSavedCodeFiles(true));
  }
  if (loadButton && !loadButton.dataset.bound) {
    loadButton.dataset.bound = '1';
    loadButton.addEventListener('click', loadSelectedCodeFile);
  }

  window.addEventListener('nexus:workspace-project-opened', () => refreshSavedCodeFiles(false));
  if (window.nexusCurrentWorkspaceProject?.id) refreshSavedCodeFiles(false);

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const renderMarkdown = (text) => {
    let safe = escapeHtml(text || '');
    safe = safe.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="bg-black/60 border border-white/10 rounded-lg p-3 overflow-x-auto my-3"><code>${code.trim()}</code></pre>`);
    safe = safe.replace(/^### (.+)$/gm, '<h3 class="text-white font-bold text-sm mt-3">$1</h3>');
    safe = safe.replace(/^## (.+)$/gm, '<h2 class="text-white font-bold text-base mt-4">$1</h2>');
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/`([^`]+)`/g, '<code class="text-emerald-300">$1</code>');
    safe = safe.replace(/^\s*[-*] (.+)$/gm, '<div class="ml-3 my-1">• $1</div>');
    return safe.replace(/\n/g, '<br>');
  };

  const runCodeAssistant = async (mode, button) => {
    const prompt = promptInput?.value?.trim() || '';
    const project = window.nexusCurrentWorkspaceProject;
    if (!project?.id) { showToast('Select a project', 'Open a project from Project Workspace before using Code Studio.', 'warning'); return; }
    if (mode === 'generate' && !prompt) {
      showToast('Prompt required', 'Describe the code you want to generate.', 'error');
      promptInput?.focus();
      return;
    }
    if (mode !== 'generate' && !editor.value.trim()) {
      showToast('Code required', 'Paste code before continuing.', 'error');
      return;
    }
    const originalLabel = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="bi bi-arrow-repeat animate-spin"></i> Working...';
    if (output) output.textContent = 'AI is processing your request...';
    try {
      const response = await fetch('/api/ai/code-assistant', {
        method: 'POST',
        headers: getNexusAiCsrfHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({ mode, prompt, code: editor.value, filename: getCurrentFilename(), language: document.getElementById('code-studio-language')?.value || 'Python', projectId: project.id, projectName: project.name || project.title || 'Selected project' })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'AI request failed.');
      const result = data.result || '';
      if (mode === 'fix' || mode === 'generate') {
        const match = result.match(/```(?:[a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)```/);
        if (match && window.confirm(`Replace the editor contents with the AI ${mode === 'fix' ? 'corrected' : 'generated'} code?`)) {
          editor.value = match[1].trim();
            await saveCurrentCodeFile(false);
        }
      }
      if (output) {
        const provider = document.createElement('li');
        provider.className = 'text-xs text-[#C5A059] py-2';
        provider.textContent = `Provider: ${data.provider} · Model: ${data.model}`;
        const resultItem = document.createElement('li');
        resultItem.className = 'text-xs text-white/80 py-2 leading-6';
        resultItem.innerHTML = renderMarkdown(result);
        output.replaceChildren(provider, resultItem);
      }
      showToast('Code Studio Complete', `${mode} completed using ${data.provider}.`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'All configured providers failed.';
      if (output) output.textContent = message;
      showToast('Code Studio Error', message, 'error');
    } finally {
      button.disabled = false;
      button.innerHTML = originalLabel;
    }
  };

  [[reviewBtn, 'analyze'], [generateBtn, 'generate'], [fixBtn, 'fix']].forEach(([button, mode]) => {
    if (button && !button.dataset.bound) {
      button.dataset.bound = '1';
      button.addEventListener('click', () => runCodeAssistant(mode, button));
    }
  });
  
  // Run NexusAI Django backend tests
  const runTestsButton = document.getElementById('btn-run-backend-tests');

  if (runTestsButton && runTestsButton.dataset.bound !== 'true') {
    runTestsButton.dataset.bound = 'true';

    runTestsButton.addEventListener('click', async () => {
      const project = window.nexusCurrentWorkspaceProject;
      const status = document.getElementById('backend-test-status');
      const output = document.getElementById('backend-test-output');

      if (!project?.id) {
        status.textContent = 'Please open a project first.';
        return;
      }

      runTestsButton.disabled = true;
      runTestsButton.textContent = 'Running tests...';
      status.textContent = 'Executing backend test suite...';
      output.classList.remove('hidden');
      output.textContent = 'Please wait...';

      try {
        const response = await fetch(
          `/django-api/projects/${encodeURIComponent(project.id)}/tests/run/`,
          {
            method: 'POST',
            credentials: 'same-origin',
            headers: getNexusAiCsrfHeaders()
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Test execution failed.');
        }

        document.getElementById('backend-tests-total').textContent = data.total;
        document.getElementById('backend-tests-passed').textContent = data.passed;
        document.getElementById('backend-tests-failed').textContent = data.failed;

        status.textContent = data.success
          ? 'Test execution completed.'
          : 'Tests completed with failures.';

        output.textContent = data.output || data.message || 'No output available.';

        window.dispatchEvent(new CustomEvent('nexus:dashboard-refresh'));

      } catch (error) {
        status.textContent = 'Unable to run tests.';
        output.textContent = error.message;
      } finally {
        runTestsButton.disabled = false;
        runTestsButton.innerHTML = '<i class="bi bi-play-fill mr-1"></i> Run Backend Tests';
      }
    });
  }

}
/* Agent Swarm is initialized by /static/js/swarm.js. */


