(() => {
  const $ = (id) => document.getElementById(id);
  const api = (path) => `/django-api${path}`;
  const state = { loaded: false };

  async function loadProjects() {
    const select = $("quality-project-select");
    if (!select || state.loaded) return;
    try {
      const response = await fetch(api("/projects/"), { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Could not load projects.");
      const payload = await response.json();
      const projects = Array.isArray(payload) ? payload : (payload.results || payload.projects || []);
      select.innerHTML = '<option value="">Select project</option>' + projects.map(p =>
        `<option value="${Number(p.id)}">${escapeHtml(p.name || `Project ${p.id}`)}</option>`).join("");
      const active = window.nexusCurrentWorkspaceProject?.id;
      if (active && projects.some(p => Number(p.id) === Number(active))) select.value = String(active);
      state.loaded = true;
      if (select.value) await loadReport();
    } catch (error) { setStatus(error.message, true); }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  function setStatus(message, error = false) {
    const el = $("quality-status");
    if (el) { el.textContent = message; el.className = `text-xs ${error ? "text-rose-400" : "text-white/50"}`; }
  }
  async function loadReport() {
    const id = $("quality-project-select")?.value;
    if (!id) { setStatus("Select a project first."); return; }
    setStatus("Scanning saved code files and loading test history...");
    try {
      const response = await fetch(api(`/projects/${id}/quality/`), { credentials: "same-origin", headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to load quality report.");
      $("quality-files").textContent = data.files_scanned;
      ["critical","high","medium","low"].forEach(k => $( `quality-${k}`).textContent = data.counts[k[0].toUpperCase()+k.slice(1)] ?? 0);
      $("quality-findings-count").textContent = `${data.findings.length} findings`;
      $("quality-findings").innerHTML = data.findings.length ? data.findings.map(f =>
        `<div class="rounded-lg border border-white/10 bg-white/[.03] p-3"><div class="flex flex-wrap justify-between gap-2"><strong class="text-xs text-white">${escapeHtml(f.title)}</strong><span class="text-[10px] uppercase ${f.severity==="High"?"text-orange-400":f.severity==="Medium"?"text-amber-300":"text-white/50"}">${escapeHtml(f.severity)}</span></div><div class="text-[11px] text-white/50 mt-1">${escapeHtml(f.file)} · line ${f.line}</div><p class="text-xs text-white/70 mt-2">${escapeHtml(f.recommendation)}</p></div>`).join("") :
        '<p class="text-xs text-emerald-400">No findings from the configured static rules in saved project files.</p>';
      $("quality-test-summary").textContent = `${data.test_summary.passed} passed · ${data.test_summary.failed} failed · ${data.test_summary.total} recorded`;
      $("quality-test-results").innerHTML = data.tests.length ? data.tests.map(t =>
        `<div class="flex flex-wrap justify-between gap-2 rounded-lg bg-white/5 p-3 text-xs"><span class="text-white">${escapeHtml(t.name)}</span><span class="${t.status==="passed"?"text-emerald-400":t.status==="failed"?"text-rose-400":"text-amber-300"}">${escapeHtml(t.status)} · ${escapeHtml(t.duration)}</span></div>`).join("") :
        '<p class="text-xs text-white/40">No test records for this project yet.</p>';
      setStatus(`Report loaded for ${data.project.name}. ${data.files_scanned} saved code file(s) scanned.`);
    } catch (error) { setStatus(error.message, true); }
  }
  async function runTests() {
    const id = $("quality-project-select")?.value;
    if (!id) return setStatus("Select a project before running tests.", true);
    const button = $("quality-tests-btn"); button.disabled = true; button.textContent = "Running tests...";
    try {
      const response = await fetch(api(`/projects/${id}/tests/run/`), {
        method: "POST", credentials: "same-origin",
        headers: { "X-CSRFToken": getCookie("csrftoken"), "Accept": "application/json" }
      });
      const data = await response.json();
      if (!response.ok && !data.output) throw new Error(data.message || "Test execution failed.");
      $("quality-test-output").classList.remove("hidden");
      $("quality-test-output").textContent = data.output || data.message || "Test run completed.";
      setStatus(`Test run finished: ${data.passed ?? 0} passed, ${data.failed ?? 0} failed.`, !data.success);
      await loadReport();
    } catch (error) { setStatus(error.message, true); }
    finally { button.disabled = false; button.textContent = "Run Backend Tests"; }
  }
  function getCookie(name) {
    const entry = document.cookie.split("; ").find(row => row.startsWith(name + "="));
    return entry ? decodeURIComponent(entry.split("=")[1]) : "";
  }
  document.addEventListener("DOMContentLoaded", () => {
    $("quality-project-select")?.addEventListener("change", loadReport);
    $("quality-scan-btn")?.addEventListener("click", loadReport);
    $("quality-tests-btn")?.addEventListener("click", runTests);
    document.querySelectorAll('[data-view="quality"]').forEach(el => el.addEventListener("click", () => { state.loaded = false; loadProjects(); }));
    window.addEventListener("nexus:workspace-project-opened", e => {
      if ($("quality-project-select")) { state.loaded = false; loadProjects().then(() => { if (e.detail?.projectId) $("quality-project-select").value = String(e.detail.projectId); }); }
    });
  });
})();
