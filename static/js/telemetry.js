(() => {
  const rootId = 'view-analytics';
  let charts = {};
  let loading = false;

  const api = async (url) => {
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data.message || `Analytics request failed (${response.status})`);
    return data;
  };

  const el = (id) => document.getElementById(id);
  const chart = (id, type, labels, datasets, stacked = false) => {
    const canvas = el(id);
    if (!canvas || typeof Chart === 'undefined') return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(canvas, {
      type,
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#d1d5db' } } },
        scales: type === 'doughnut' ? {} : {
          x: { stacked, ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,.06)' } },
          y: { stacked, beginAtZero: true, ticks: { precision: 0, color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,.06)' } }
        }
      }
    });
  };

  const setText = (id, value) => { if (el(id)) el(id).textContent = value; };

  async function load() {
    if (loading) return;
    const root = el(rootId);
    if (!root) return;
    loading = true;
    setText('telemetry-status', 'Refreshing live database analytics…');
    try {
      const projectId = el('telemetry-project-filter')?.value || '';
      const data = await api(`/django-api/telemetry/overview/${projectId ? `?project_id=${encodeURIComponent(projectId)}` : ''}`);
      const m = data.metrics;
      const filter = el('telemetry-project-filter');
      if (filter && filter.dataset.loaded !== 'true') {
        filter.innerHTML = '<option value="">All my projects</option>' +
          data.projects.map(p => `<option value="${p.id}">${String(p.name).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</option>`).join('');
        filter.dataset.loaded = 'true';
        if (projectId) filter.value = projectId;
      }

      const cards = {
        'telemetry-projects': m.projects,
        'telemetry-requirements': m.requirements,
        'telemetry-tasks': m.tasks,
        'telemetry-artifacts': m.code_files + m.architecture_nodes + m.database_tables,
        'telemetry-ai-analyses': m.ai_analyses
      };
      Object.entries(cards).forEach(([id, value]) => setText(id, value));

      chart('telemetry-task-chart', 'doughnut',
        ['Backlog', 'In Progress', 'Review', 'Completed'],
        [{ label: 'Tasks', data: [m.task_status.backlog, m.task_status['in-progress'], m.task_status.review, m.task_status.completed] }]);
      chart('telemetry-project-chart', 'bar',
        ['Planning', 'Active', 'Testing', 'Deployed'],
        [{ label: 'Projects', data: ['planning','active','testing','deployed'].map(k => m.project_status[k]) }]);
      chart('telemetry-activity-chart', 'line', data.timeline.labels,
        [
          { label: 'Projects created', data: data.timeline.projects_created, tension: .3 },
          { label: 'Tasks created', data: data.timeline.tasks_created, tension: .3 }
        ]);
      chart('telemetry-assets-chart', 'bar',
        ['Requirements', 'Architecture nodes', 'Connections', 'DB tables', 'Code files', 'Tests'],
        [{ label: 'Saved records', data: [m.requirements, m.architecture_nodes, m.architecture_connections, m.database_tables, m.code_files, m.tests] }]);

      setText('telemetry-generated', `Updated ${new Date(data.generated_at).toLocaleString()}`);
      setText('telemetry-status', 'Live data loaded from your Django database.');
      const note = el('telemetry-limitations');
      if (note) note.textContent = data.limitations.join(' ');
    } catch (error) {
      setText('telemetry-status', error.message || 'Could not load analytics.');
    } finally {
      loading = false;
    }
  }

  function bind() {
    const root = el(rootId);
    if (!root || root.dataset.telemetryBound === 'true') return;
    root.dataset.telemetryBound = 'true';
    el('telemetry-project-filter')?.addEventListener('change', load);
    el('telemetry-refresh')?.addEventListener('click', load);
    document.querySelectorAll('[data-view="analytics"]').forEach(node => node.addEventListener('click', () => setTimeout(load, 80)));
    window.addEventListener('nexus:workspace-project-opened', load);
    if (typeof window.showView === 'function') {
      const previous = window.showView;
      window.showView = function(view, ...args) {
        const result = previous.call(this, view, ...args);
        if (view === 'analytics') setTimeout(load, 80);
        return result;
      };
    }
    load();
    setInterval(() => { if (!document.hidden && !root.classList.contains('hidden')) load(); }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
