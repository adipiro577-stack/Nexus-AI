/* NexusAI project-scoped SDLC dashboard */
(() => {
  const API = '/django-api/sdlc/overview/';
  const $ = (id) => document.getElementById(id);

  async function loadOverview(projectId) {
    const url = new URL(API, window.location.origin);
    if (projectId) url.searchParams.set('project_id', projectId);
    const response = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || `SDLC request failed (${response.status})`);
    }
    render(data);
  }

  function render(data) {
    const pipeline = document.querySelector('#view-dashboard .nexus-card-gold');
    if (!pipeline) return;

    let selector = $('sdlc-project-select');
    if (!selector) {
      const header = pipeline.querySelector('.flex.items-center.justify-between');
      selector = document.createElement('select');
      selector.id = 'sdlc-project-select';
      selector.className = 'bg-[#1c1c1c] border border-white/20 rounded-md px-3 py-2 text-xs text-white max-w-[220px]';
      selector.setAttribute('aria-label', 'Select project for SDLC overview');
      header?.appendChild(selector);
      selector.addEventListener('change', () => loadOverview(selector.value).catch(showError));
    }

    const previous = selector.value;
    selector.replaceChildren();
    (data.projects || []).forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      selector.appendChild(option);
    });

    if (data.selected_project) {
      selector.value = String(data.selected_project.id);
      if (previous && data.projects.some(p => String(p.id) === previous) &&
          !new URLSearchParams(location.search).has('project_id')) {
        // Keep the currently selected dashboard project when refreshing.
      }
    }

    const heading = $('dashboard-lifecycle-heading');
    const stageGrid = pipeline.querySelector('.grid');
    if (heading) {
      heading.textContent = data.selected_project
        ? (data.all_stages_complete
          ? 'STAGE 8 / 8 — COMPLETE'
          : `STAGE ${data.current_stage} / 8 — ${data.stages[data.current_stage - 1].name.toUpperCase()}`)
        : 'SELECT A PROJECT';
    }

    if (stageGrid) {
      stageGrid.replaceChildren();
      (data.stages || []).forEach(stage => {
        const cell = document.createElement('div');
        cell.className = 'p-2.5 rounded-lg border text-center';
        cell.textContent = `${stage.number}. ${stage.name}`;
        cell.title = `${stage.status.replace('_', ' ')} — ${stage.detail}`;
        if (stage.status === 'completed') {
          cell.classList.add('bg-emerald-500/10', 'border-emerald-500/30', 'text-emerald-400');
        } else if (stage.status === 'in_progress') {
          cell.classList.add('bg-[#C5A059]/20', 'border-[#C5A059]', 'text-[#C5A059]', 'font-bold');
        } else {
          cell.classList.add('bg-white/5', 'border-white/10', 'text-white/50');
        }
        stageGrid.appendChild(cell);
      });
    }

    renderTasks(data.tasks || {});
  }

  function renderTasks(tasks) {
    let panel = $('dashboard-task-summary');
    const dashboard = $('view-dashboard');
    if (!dashboard) return;
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'dashboard-task-summary';
      panel.className = 'nexus-card p-5 space-y-4 mt-6';
      panel.innerHTML = '<h3 class="text-sm font-bold text-white">Sprint Task Progress</h3><div id="dashboard-task-metrics" class="grid grid-cols-2 md:grid-cols-5 gap-3"></div><div id="dashboard-task-progress" class="text-xs text-white/60"></div>';
      const pipeline = dashboard.querySelector('.nexus-card-gold');
      pipeline?.insertAdjacentElement('afterend', panel);
    }
    const grid = $('dashboard-task-metrics');
    if (!grid) return;
    grid.replaceChildren();
    [
      ['Total Tasks', tasks.total], ['Backlog', tasks.backlog],
      ['In Progress', tasks.in_progress], ['Review', tasks.review],
      ['Completed', tasks.completed]
    ].forEach(([label, value]) => {
      const card = document.createElement('div');
      card.className = 'bg-white/5 rounded-lg p-3';
      const name = document.createElement('div');
      name.className = 'text-[10px] text-white/50';
      name.textContent = label;
      const number = document.createElement('div');
      number.className = 'text-xl font-bold text-[#C5A059]';
      number.textContent = Number(value || 0);
      card.append(name, number);
      grid.appendChild(card);
    });
    $('dashboard-task-progress').textContent =
      `Task completion: ${Number(tasks.completion_rate || 0)}%`;
  }

  function showError(error) {
    console.error('NexusAI SDLC dashboard:', error);
    const heading = $('dashboard-lifecycle-heading');
    if (heading) heading.textContent = 'SDLC DATA UNAVAILABLE';
  }

  function refresh() {
    const select = $('sdlc-project-select');
    loadOverview(select?.value || null).catch(showError);
  }

  document.addEventListener('DOMContentLoaded', refresh);
  window.addEventListener('nexus:dashboard-refresh', refresh);
  window.addEventListener('nexus:workspace-project-opened', event => {
    if (event.detail?.projectId) loadOverview(event.detail.projectId).catch(showError);
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-view="dashboard"], [data-target="dashboard"], #nav-dashboard')) {
      setTimeout(refresh, 250);
    }
  });
})();
