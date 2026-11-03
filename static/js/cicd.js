(function () {
  const $ = (id) => document.getElementById(id);
  function csrf() { const m = document.cookie.match(/(?:^|; )csrftoken=([^;]*)/); return m ? decodeURIComponent(m[1]) : ''; }
  async function post(url, body) {
    const response = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf(), 'Accept': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }
  function renderHistory(items) {
    const host = $('cicd-history'); if (!host) return;
    if (!items.length) { host.innerHTML = '<div class="nexus-card p-4 text-xs text-white/40">No pipeline runs saved for this project yet.</div>'; return; }
    host.innerHTML = items.map(p => `<article class="nexus-card p-4 space-y-2"><div class="flex justify-between gap-3"><div class="text-sm text-white">${escapeHtml(p.name)}</div><span class="text-xs uppercase ${p.status === 'success' ? 'text-emerald-400' : 'text-red-400'}">${escapeHtml(p.status)}</span></div><div class="text-[11px] text-white/45">Branch: ${escapeHtml(p.branch)} · ${escapeHtml(p.duration)} · ${escapeHtml(p.triggered_by)}</div><div class="grid sm:grid-cols-3 gap-2">${(p.stages || []).map(s => `<div class="rounded bg-white/5 p-2 text-xs"><div class="text-white">${escapeHtml(s.name)}</div><div class="${s.status === 'passed' ? 'text-emerald-400' : s.status === 'failed' ? 'text-red-400' : 'text-white/40'}">${escapeHtml(s.status)}</div></div>`).join('')}</div><details class="text-xs text-white/60"><summary class="cursor-pointer">View logs</summary><pre class="terminal-box p-3 mt-2 whitespace-pre-wrap">${escapeHtml((p.logs || []).join('\n'))}</pre></details></article>`).join('');
  }
  function escapeHtml(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  async function loadHistory() { const id = $('cicd-project')?.value; if (!id) return; try { const d = await post('/django-api/api/cicd/history/', { project_id: Number(id) }); renderHistory(d.pipelines || []); } catch (e) { $('cicd-history').textContent = e.message; } }
  async function run() {
    const id = $('cicd-project')?.value; if (!id) { $('pipeline-status').textContent = 'Select a project first.'; return; }
    const btn = $('btn-run-pipeline'); btn.disabled = true; btn.textContent = 'Running…'; $('pipeline-status').textContent = 'Pipeline is running…'; $('pipeline-output').textContent = 'Starting validation…';
    ['pipeline-source','pipeline-checks','pipeline-tests'].forEach(k => $(k).textContent = 'Running');
    try {
      const d = await post('/django-api/api/cicd/run/', { project_id: Number(id) });
      $('pipeline-output').textContent = (d.logs || []).join('\n\n'); $('pipeline-readiness').textContent = d.readiness + ' · No deployment performed';
      const map = {'Source Validation':'pipeline-source','Django System Check':'pipeline-checks','Automated Tests':'pipeline-tests'};
      (d.stages || []).forEach(s => { if (map[s.name]) $(map[s.name]).textContent = s.status.toUpperCase(); });
      $('pipeline-status').textContent = `${d.project.name}: ${d.status.toUpperCase()} · ${d.duration}`;
      await loadHistory();
    } catch (e) { $('pipeline-status').textContent = 'Pipeline request failed'; $('pipeline-output').textContent = e.message; $('pipeline-readiness').textContent = 'Not ready'; }
    finally { btn.disabled = false; btn.textContent = 'Run Pipeline'; }
  }
  document.addEventListener('DOMContentLoaded', () => {
    $('btn-run-pipeline')?.addEventListener('click', run);
    $('cicd-project')?.addEventListener('change', loadHistory);
    $('cicd-refresh-history')?.addEventListener('click', loadHistory);
    $('cicd-copy-workflow')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(window.NEXUS_CICD_WORKFLOW || ''); $('cicd-copy-workflow').textContent = 'Workflow copied'; } catch (_) { $('cicd-copy-workflow').textContent = 'Clipboard unavailable'; } });
    const selected = localStorage.getItem('nexus_active_project_id'); if (selected && $('cicd-project') && [...$('cicd-project').options].some(o => o.value === selected)) $('cicd-project').value = selected;
    if ($('cicd-project')?.value) loadHistory();
  });
})();
