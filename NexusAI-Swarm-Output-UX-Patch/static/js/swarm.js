/* NexusAI real Agent Swarm controller + navigable output, copy and PDF export. */
(() => {
  const $ = (id) => document.getElementById(id);
  let latestOutput = '';
  const log = (message, kind = 'info') => {
    const box = $('swarm-terminal-logs');
    if (!box) return;
    const line = document.createElement('div');
    const colors = { info: 'text-white/75', success: 'text-emerald-400', error: 'text-rose-400', warning: 'text-amber-300' };
    line.className = `py-1 font-mono ${colors[kind] || colors.info}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  };
  const setStatus = (role, status) => {
    const el = document.querySelector(`[data-agent-status="${CSS.escape(role)}"]`);
    if (el) el.textContent = status.toUpperCase();
  };
  const splitAgentSections = (text) => {
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    const sections = [];
    let current = { title: 'Swarm Result', body: [] };
    let foundHeading = false;
    for (const line of lines) {
      const match = line.match(/^#\s+(.+?)\s*$/);
      if (match) {
        if (foundHeading || current.body.length) sections.push(current);
        current = { title: match[1].replace(/^\*\*|\*\*$/g, ''), body: [] };
        foundHeading = true;
      } else {
        current.body.push(line);
      }
    }
    if (current.body.length || !sections.length) sections.push(current);
    return sections.filter((section) => section.title || section.body.join('').trim());
  };
  const renderOutput = (text) => {
    latestOutput = String(text || 'No final output returned.');
    const container = $('swarm-final-output');
    const jump = $('swarm-output-jump');
    const count = $('swarm-output-count');
    if (!container) return;
    const sections = splitAgentSections(latestOutput);
    container.replaceChildren();
    if (jump) {
      jump.replaceChildren();
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Jump to agent...';
      jump.appendChild(placeholder);
    }
    sections.forEach((section, index) => {
      const id = `swarm-output-section-${index}`;
      const details = document.createElement('details');
      details.id = id;
      details.className = 'bg-[#080808] border border-white/10 rounded-lg overflow-hidden';
      details.open = index === 0;
      const summary = document.createElement('summary');
      summary.className = 'cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 text-sm text-[#C5A059] font-semibold hover:bg-white/5';
      const title = document.createElement('span');
      title.textContent = section.title || `Section ${index + 1}`;
      const actions = document.createElement('span');
      actions.className = 'text-[10px] text-white/45 font-normal';
      actions.textContent = `${index + 1} / ${sections.length} · Expand`;
      summary.append(title, actions);
      const content = document.createElement('div');
      content.className = 'border-t border-white/10 p-4';
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'mb-3 border border-white/15 hover:border-[#C5A059] rounded-md px-2.5 py-1.5 text-[11px] text-white/75';
      copyButton.textContent = 'Copy this section';
      copyButton.addEventListener('click', async () => {
        const value = `# ${section.title}\n${section.body.join('\n').trim()}`;
        try { await navigator.clipboard.writeText(value); copyButton.textContent = 'Copied!'; }
        catch { copyButton.textContent = 'Copy unavailable'; }
      });
      const pre = document.createElement('pre');
      pre.className = 'whitespace-pre-wrap break-words text-xs leading-6 text-white/80 font-mono overflow-x-auto';
      pre.textContent = section.body.join('\n').trim() || '(No content returned for this section.)';
      content.append(copyButton, pre);
      details.append(summary, content);
      container.appendChild(details);
      if (jump) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = section.title || `Section ${index + 1}`;
        jump.appendChild(option);
      }
    });
    if (count) count.textContent = `${sections.length} sections · Open any agent without scrolling through the full report.`;
  };
  async function loadProjects() {
    const select = $('swarm-project-select');
    if (!select) return;
    try {
      const response = await fetch('/django-api/projects/', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Could not load your projects. Sign in and refresh.');
      const payload = await response.json();
      const projects = Array.isArray(payload) ? payload : (payload.results || []);
      select.innerHTML = '<option value="">Select a project...</option>';
      projects.forEach((project) => {
        const option = document.createElement('option');
        option.value = String(project.id);
        option.textContent = project.name;
        select.appendChild(option);
      });
      if (!projects.length) log('No projects found. Create a project in Project Workspace first.', 'warning');
    } catch (error) {
      log(error.message || 'Unable to load projects.', 'error');
    }
  }
  async function executeSwarm(button) {
    const projectId = $('swarm-project-select')?.value;
    const extraInstructions = $('swarm-extra-instructions')?.value.trim() || '';
    if (!projectId) { log('Select a project before starting the swarm.', 'warning'); return; }
    if (button.dataset.running === 'true') return;
    button.dataset.running = 'true';
    button.disabled = true;
    const original = button.textContent;
    button.textContent = 'Running agents...';
    renderOutput('Swarm is running. Final outputs will appear here.');
    $('swarm-terminal-logs').innerHTML = '';
    document.querySelectorAll('[data-agent-status]').forEach((el) => { el.textContent = 'IDLE'; });
    log('Starting authenticated agent workflow...');
    try {
      const response = await fetch('/api/ai/agent-swarm/stream', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...getNexusAiCsrfHeaders() },
        body: JSON.stringify({ projectId: Number(projectId), extraInstructions })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Swarm request failed (HTTP ${response.status}).`);
      }
      if (!response.body) throw new Error('Streaming is not supported by this browser.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() || '';
        for (const frame of frames) {
          const eventLine = frame.split('\n').find((line) => line.startsWith('event:'));
          const dataLine = frame.split('\n').find((line) => line.startsWith('data:'));
          if (!dataLine) continue;
          const eventName = eventLine ? eventLine.slice(6).trim() : 'message';
          let data = {};
          try { data = JSON.parse(dataLine.slice(5).trim()); } catch { continue; }
          if (eventName === 'log') log(data.message || 'Agent update');
          if (eventName === 'agent') {
            setStatus(data.role, data.status || 'running');
            log(`${data.role}: ${data.message || data.status}`, data.status === 'completed' ? 'success' : 'info');
          }
          if (eventName === 'result') renderOutput(data.output || 'No final output returned.');
          if (eventName === 'error') log(data.error || 'Agent execution failed.', 'error');
          if (eventName === 'done') log(data.success ? 'All agent tasks finished.' : 'Swarm finished with errors.', data.success ? 'success' : 'warning');
        }
      }
    } catch (error) {
      log(error.message || 'Swarm execution failed.', 'error');
      renderOutput(error.message || 'Swarm execution failed.');
    } finally {
      button.disabled = false;
      button.dataset.running = 'false';
      button.textContent = original || 'Execute Agent Swarm';
    }
  }
  const downloadPdf = () => {
    if (!latestOutput || latestOutput === 'No execution yet.') { log('There is no swarm output to export.', 'warning'); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) { log('Allow pop-ups to export the PDF.', 'warning'); return; }
    const doc = printWindow.document;
    doc.title = 'NexusAI - Agent Swarm Report';
    const style = doc.createElement('style');
    style.textContent = `body{font-family:Arial,sans-serif;color:#171717;margin:28px;line-height:1.5}h1{font-size:20px;border-bottom:2px solid #b18a3a;padding-bottom:10px}h2{font-size:15px;color:#8a6825;margin:22px 0 8px;page-break-after:avoid}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:10px/1.5 Consolas,monospace;margin:0 0 18px}section{page-break-inside:avoid}small{color:#666}@page{size:A4;margin:16mm}`;
    doc.head.appendChild(style);
    const heading = doc.createElement('h1');
    heading.textContent = 'NexusAI — Agent Swarm Report';
    const meta = doc.createElement('small');
    meta.textContent = `Generated: ${new Date().toLocaleString()}`;
    doc.body.append(heading, meta);
    splitAgentSections(latestOutput).forEach((section) => {
      const wrapper = doc.createElement('section');
      const h2 = doc.createElement('h2'); h2.textContent = section.title;
      const pre = doc.createElement('pre'); pre.textContent = section.body.join('\n').trim();
      wrapper.append(h2, pre); doc.body.appendChild(wrapper);
    });
    const note = doc.createElement('p'); note.textContent = 'Use the browser print dialog and choose “Save as PDF”.';
    note.style.cssText = 'font-size:10px;color:#666;margin-top:24px'; doc.body.appendChild(note);
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };
  document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    const buttons = ['btn-trigger-swarm', 'btn-trigger-swarm-agents'].map($).filter(Boolean);
    buttons.forEach((button) => button.addEventListener('click', () => executeSwarm(button)));
    $('swarm-output-jump')?.addEventListener('change', (event) => {
      const target = event.target.value ? $(event.target.value) : null;
      if (target) { target.open = true; target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    $('swarm-copy-all')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      try { await navigator.clipboard.writeText(latestOutput); button.textContent = 'Copied!'; }
      catch { button.textContent = 'Copy unavailable'; }
      setTimeout(() => { button.textContent = 'Copy all'; }, 1800);
    });
    $('swarm-download-pdf')?.addEventListener('click', downloadPdf);
  });
})();
