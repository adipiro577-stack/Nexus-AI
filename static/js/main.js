/* NexusAI Platform - Modular Vanilla JavaScript Interactive Controller */

let currentNexusUser = null;
let nexusCsrfToken = '';
const publicViews = new Set(['login', 'signup']);

document.addEventListener('DOMContentLoaded', async () => {
  // Start on the sign-in view so demo content is not briefly presented as authenticated.
  showView('login');
  initSidebarToggle();
  initModals();
  initCommandPalette();
  initCopyButtons();
  initOrderEngineDemo();
  initCharts();
  await initAuth();
  initNavigation();
  initProjectsWorkspace();
  initWorkspaceRequirements();
  initCreateProjectForm();
  initSaveAnalysis();
  initDatabaseDesigner();
  initNotifications();
});

async function getDjangoCsrfToken(forceRefresh = false) {
  if (nexusCsrfToken && !forceRefresh) return nexusCsrfToken;

  const response = await fetch('/django-api/auth/csrf/', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.csrfToken) {
    throw new Error(data.error || 'Unable to initialize secure authentication. Make sure Django is running.');
  }
  nexusCsrfToken = data.csrfToken;
  return nexusCsrfToken;
}

async function djangoAuthRequest(url, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers.set('X-CSRFToken', await getDjangoCsrfToken());
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'same-origin'
  });
}

function setAuthButton(button, busy, busyText, normalText) {
  if (!button) return;
  button.disabled = busy;
  button.classList.toggle('opacity-60', busy);
  button.classList.toggle('cursor-not-allowed', busy);
  button.textContent = busy ? busyText : normalText;
}

function updateUserUI() {
  const loggedInBox = document.getElementById('user-logged-in-box');
  const loggedOutBox = document.getElementById('user-logged-out-box');
  const nameEl = document.getElementById('user-display-name');
  const emailEl = document.getElementById('user-display-email');
  const avatarEl = document.getElementById('user-avatar-badge');

  if (currentNexusUser) {
    loggedInBox?.classList.remove('hidden');
    loggedOutBox?.classList.add('hidden');
    if (nameEl) nameEl.textContent = currentNexusUser.name || 'NexusAI User';
    if (emailEl) emailEl.textContent = currentNexusUser.email || '';
    if (avatarEl) {
      const initials = String(currentNexusUser.name || 'NU')
        .trim().split(/\s+/).map(part => part[0]).join('').substring(0, 2).toUpperCase();
      avatarEl.textContent = initials || 'NU';
    }
  } else {
    loggedInBox?.classList.add('hidden');
    loggedOutBox?.classList.remove('hidden');
    if (nameEl) nameEl.textContent = 'Guest User';
    if (emailEl) emailEl.textContent = 'Not Signed In';
    if (avatarEl) avatarEl.textContent = 'GU';
  }
}

async function restoreDjangoSession() {
  try {
    await getDjangoCsrfToken(true);
    const response = await fetch('/django-api/auth/me/', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    currentNexusUser = response.ok && data.success && data.user ? data.user : null;
  } catch (error) {
    currentNexusUser = null;
    console.error('Could not restore Django session:', error instanceof Error ? error.message : 'unknown error');
  }
  updateUserUI();
  showView(currentNexusUser ? 'dashboard' : 'login');
}

async function initAuth() {
  const loginForm = document.getElementById('auth-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('login-email')?.value?.trim();
      const password = document.getElementById('login-password')?.value;
      const button = document.getElementById('btn-login-submit');
      if (!email || !password) {
        showToast('Fields Required', 'Please enter both email and password.', 'warning');
        return;
      }

      setAuthButton(button, true, 'Signing in...', 'Sign In');
      try {
        const csrfToken = await getDjangoCsrfToken(true);

const response = await fetch('/django-api/auth/login/', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': csrfToken
    },
    body: JSON.stringify({ email, password })
});
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success || !data.user) {
          throw new Error(data.error || `Sign-in failed (HTTP ${response.status}).`);
        }
        currentNexusUser = data.user;
        // Django rotates the CSRF token on login; fetch the new token for subsequent writes.
        nexusCsrfToken = '';
        await getDjangoCsrfToken(true);
        updateUserUI();
        showView('dashboard');
        showToast('Signed In', `Welcome back, ${currentNexusUser.name}.`, 'success');
        await loadDjangoProjects();
      } catch (error) {
        showToast('Sign In Failed', error instanceof Error ? error.message : 'Unable to sign in.', 'error');
      } finally {
        setAuthButton(button, false, '', 'Sign In');
      }
    });
  }

  const signupForm = document.getElementById('auth-signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('signup-name')?.value?.trim();
      const email = document.getElementById('signup-email')?.value?.trim();
      const password = document.getElementById('signup-password')?.value;
      const role = document.getElementById('signup-role')?.value;
      const button = document.getElementById('btn-signup-submit');
      if (!name || !email || !password) {
        showToast('Missing Details', 'Name, email, and password are required.', 'warning');
        return;
      }

      setAuthButton(button, true, 'Creating account...', 'Create Account');
      try {
        const response = await djangoAuthRequest('/django-api/auth/register/', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, role })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success || !data.user) {
          throw new Error(data.error || `Registration failed (HTTP ${response.status}).`);
        }
        currentNexusUser = data.user;
        nexusCsrfToken = '';
        await getDjangoCsrfToken(true);
        updateUserUI();
        showView('dashboard');
        showToast('Account Created', `Welcome to NexusAI, ${currentNexusUser.name}.`, 'success');
        await loadDjangoProjects();
      } catch (error) {
        showToast('Registration Failed', error instanceof Error ? error.message : 'Unable to create the account.', 'error');
      } finally {
        setAuthButton(button, false, '', 'Create Account');
      }
    });
  }

  await restoreDjangoSession();
}

async function handleLogout() {
  try {
    const response = await djangoAuthRequest('/django-api/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.error || `Logout failed (HTTP ${response.status}).`);
    }
    currentNexusUser = null;
    nexusCsrfToken = '';
    await getDjangoCsrfToken(true);
    updateUserUI();
    showView('login');
    showToast('Logged Out', 'Your Django session has been ended.', 'success');
  } catch (error) {
    showToast('Logout Failed', error instanceof Error ? error.message : 'The server could not end your session.', 'error');
  }
}

/* Navigation / View Switcher */
function initNavigation() {
  const navLinks = document.querySelectorAll('[data-view]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const viewName = link.getAttribute('data-view');
      if (viewName) {
        showView(viewName);
        if (viewName === 'database') {
          window.dispatchEvent(new CustomEvent('nexus:database-view-opened'));
        }
      }
    });
  });
}

function showView(viewName) {
  // All workspace views require a verified Django session.
  if (!currentNexusUser && !publicViews.has(viewName)) {
    viewName = 'login';
  }
  // Hide all view pages
  const pages = document.querySelectorAll('.view-page');
  pages.forEach(p => p.classList.add('hidden'));

  // Show target page
  const targetPage = document.getElementById(`view-${viewName}`);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  }

  // Update active states on sidebar
  const navLinks = document.querySelectorAll('[data-view]');
  navLinks.forEach(link => {
    if (link.getAttribute('data-view') === viewName) {
      link.classList.add('bg-[#1A1A1A]', 'text-[#C5A059]', 'border-l-2', 'border-[#C5A059]');
      link.classList.remove('text-white/60');
    } else {
      link.classList.remove('bg-[#1A1A1A]', 'text-[#C5A059]', 'border-l-2', 'border-[#C5A059]');
      link.classList.add('text-white/60');
    }
  });

  if (viewName === 'notifications') loadNotifications();

  // Re-trigger chart render if analytics view opened
  if (viewName === 'analytics' && typeof renderAnalyticsCharts === 'function') {
    renderAnalyticsCharts();
  }
}

/* Sidebar Toggle */
function initSidebarToggle() {
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
    });
  }
}

/* Modals Management */
function initModals() {
  const modalTriggers = document.querySelectorAll('[data-modal-target]');
  modalTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modal-target');
      const modal = document.getElementById(targetId);
      if (modal) modal.classList.remove('hidden');
    });
  });

  const modalCloses = document.querySelectorAll('[data-modal-close]');
  modalCloses.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) modal.classList.add('hidden');
    });
  });
}

/* Command Palette (Ctrl+K or Cmd+K) */
function initCommandPalette() {
  const palette = document.getElementById('command-palette-modal');
  if (!palette) return;

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.classList.toggle('hidden');
    }
    if (e.key === 'Escape' && !palette.classList.contains('hidden')) {
      palette.classList.add('hidden');
    }
  });
}

/* Toast Notification Utility */
function showToast(title, message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const borderCol = type === 'success' ? 'border-[#10B981]' : type === 'warning' ? 'border-[#F59E0B]' : 'border-[#EF4444]';
  const icon = type === 'success' ? 'bi-check-circle-fill text-[#10B981]' : 'bi-exclamation-triangle-fill text-[#F59E0B]';

  toast.className = `flex items-start space-x-3 bg-[#121212] border-l-4 ${borderCol} text-white p-4 rounded-r-lg shadow-2xl border-y border-r border-white/10 max-w-md transition-all duration-300 transform translate-x-full`;
  toast.innerHTML = `
    <i class="bi ${icon} text-lg mt-0.5"></i>
    <div class="flex-1">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-white">${title}</h4>
      <p class="text-xs text-white/70 mt-0.5">${message}</p>
    </div>
    <button onclick="this.parentElement.remove()" class="text-white/40 hover:text-white"><i class="bi bi-x"></i></button>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-x-full'), 10);

  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* Copy to Clipboard Helper */
function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy);
        showToast('Copied to Clipboard', 'Text copied successfully!', 'success');
      }
    });
  });
}

/* Order Book Matching Sandbox Engine Demo */
function initOrderEngineDemo() {
  const form = document.getElementById('order-submit-form');
  const bookContainer = document.getElementById('order-book-ledger');
  if (!form || !bookContainer) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const symbol = document.getElementById('order-symbol').value || 'BTC-USD';
    const side = document.getElementById('order-side').value || 'BUY';
    const price = parseFloat(document.getElementById('order-price').value || '68500.00');
    const qty = parseFloat(document.getElementById('order-qty').value || '0.5');

    const sideColor = side === 'BUY' ? 'text-emerald-400' : 'text-rose-400';
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between py-1.5 px-3 border-b border-white/5 text-xs font-mono animate-fade-in';
    row.innerHTML = `
      <span class="text-white/50">${new Date().toLocaleTimeString()}</span>
      <span class="font-semibold">${symbol}</span>
      <span class="${sideColor} font-bold">${side}</span>
      <span>$${price.toFixed(2)}</span>
      <span>${qty}</span>
      <span class="text-emerald-400"><i class="bi bi-check2"></i> MATCHED</span>
    `;

    bookContainer.prepend(row);
    showToast('Order Executed', `Matched ${qty} ${symbol} @ $${price.toFixed(2)}`, 'success');
  });
}

/* Chart.js Initialization for Analytics View */
function initCharts() {
  // Rendered lazily when Analytics view is shown or canvas exists
  if (document.getElementById('chart-qps') && typeof Chart !== 'undefined') {
    renderAnalyticsCharts();
  }
}

function renderAnalyticsCharts() {
  const qpsCanvas = document.getElementById('chart-qps');
  if (qpsCanvas && !qpsCanvas.chart) {
    qpsCanvas.chart = new Chart(qpsCanvas, {
      type: 'line',
      data: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        datasets: [{
          label: 'QPS (Queries Per Sec)',
          data: [1200, 1800, 3200, 4500, 4100, 5600, 4800],
          borderColor: '#C5A059',
          backgroundColor: 'rgba(197, 160, 89, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } }
        }
      }
    });
  }

  const tokenCanvas = document.getElementById('chart-tokens');
  if (tokenCanvas && !tokenCanvas.chart) {
    tokenCanvas.chart = new Chart(tokenCanvas, {
      type: 'bar',
      data: {
        labels: ['Spec Analyst', 'Architect', 'DB Specialist', 'Code Gen', 'QA Auditor', 'DevOps'],
        datasets: [{
          label: 'Tokens Consumed (k)',
          data: [145, 98, 76, 310, 185, 92],
          backgroundColor: ['#C5A059', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#6366F1']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#888' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } }
        }
      }
    });
  }
}
/* NexusAI Projects - Django API Integration */
function initProjectsWorkspace() {
  loadDjangoProjects();

  // Refresh project data whenever the Projects workspace is opened.
  document.querySelectorAll('[data-view="projects"]').forEach(link => {
    link.addEventListener('click', loadDjangoProjects);
  });
}

/* Open Project Workspace and Load Analysis History */
async function openProjectWorkspace(project) {
  const projectsList = document.getElementById('projects-list-container');
  const workspace = document.getElementById('project-workspace-panel');
  const title = document.getElementById('workspace-project-title');
  const description = document.getElementById('workspace-project-description');
  const projectStatus = document.getElementById('workspace-project-status');
  const category = document.getElementById('workspace-project-category');
  const history = document.getElementById('project-analysis-history');
  const count = document.getElementById('workspace-analysis-count');
  const backButton = document.getElementById('btn-close-project-workspace');

  if (!workspace || !projectsList || !history) return;

  window.nexusCurrentWorkspaceProject = project;
  const activeProjectName = document.getElementById('active-project-name');
  const activeProjectStatus = document.getElementById('active-project-status');
  if (activeProjectName) activeProjectName.textContent = project.name || 'Untitled Project';
  if (activeProjectStatus) activeProjectStatus.textContent = String(project.status || 'active').toUpperCase();
  window.dispatchEvent(new CustomEvent('nexus:workspace-project-opened', { detail: { projectId: project.id } }));
  projectsList.classList.add('hidden');
  workspace.classList.remove('hidden');

  title.textContent = project.name || 'Untitled Project';
  description.textContent = project.description || 'No description available.';
  projectStatus.textContent = `Status: ${project.status || 'Planning'}`;
  category.textContent = `Category: ${project.category || 'General'}`;

  history.replaceChildren();
  loadProjectRequirements(project.id);

  const loading = document.createElement('div');
  loading.className = 'nexus-card p-6 text-sm text-white/60';
  loading.textContent = 'Loading saved analysis history...';
  history.appendChild(loading);

  if (backButton && backButton.dataset.bound !== 'true') {
    backButton.dataset.bound = 'true';

    backButton.addEventListener('click', () => {
      workspace.classList.add('hidden');
      projectsList.classList.remove('hidden');
    });
  }

  try {
    const response = await fetch(
      `/django-api/projects/${encodeURIComponent(project.id)}/analyses/`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store'
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success !== true) {
      throw new Error(data.error || data.detail || 'Unable to load analysis history.');
    }

    const analyses = Array.isArray(data.analyses) ? data.analyses : [];

    count.textContent = `${analyses.length} Analyses`;
    history.replaceChildren();

    if (analyses.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'nexus-card p-6 text-sm text-white/60';
      empty.textContent = 'No saved AI analyses in this project yet.';
      history.appendChild(empty);
      return;
    }

    analyses.forEach(analysis => {
      const card = document.createElement('article');
      card.className = 'nexus-card p-6 space-y-4';

      const heading = document.createElement('h4');
      heading.className = 'font-bold text-white';
      heading.textContent = analysis.title || 'Requirements Analysis';

      const date = document.createElement('p');
      date.className = 'text-xs text-[#C5A059]';
      date.textContent = analysis.created_at
        ? new Date(analysis.created_at).toLocaleString()
        : 'Date unavailable';

      const prompt = document.createElement('p');
      prompt.className = 'text-sm text-white/70';
      prompt.textContent = `Original Prompt: ${analysis.prompt || 'Not available'}`;

      const requirements = Array.isArray(analysis.requirements_snapshot)
        ? analysis.requirements_snapshot : [];

      const thinking = Array.isArray(analysis.thinking_summaries)
        ? analysis.thinking_summaries : [];

      const info = document.createElement('p');
      info.className = 'text-xs text-white/50';
      info.textContent =
        `${requirements.length} generated requirements â€¢ ` +
        `${thinking.length} thinking summaries â€¢ ` +
        `${analysis.provider || 'AI'} â€¢ ${analysis.model || 'Model unavailable'}`;

      const details = document.createElement('details');
      details.className = 'border-t border-white/10 pt-3';

      const summary = document.createElement('summary');
      summary.className = 'cursor-pointer text-xs text-[#C5A059]';
      summary.textContent = 'View Saved Analysis Details';

      const detailBody = document.createElement('div');
      detailBody.className = 'space-y-4 pt-4';

      const promptHeading = document.createElement('h5');
      promptHeading.className = 'text-xs font-bold text-white';
      promptHeading.textContent = 'Original Prompt';

      detailBody.append(promptHeading);

      const fullPrompt = document.createElement('p');
      fullPrompt.className = 'text-sm text-white/70 whitespace-pre-wrap';
      fullPrompt.textContent = analysis.prompt || 'Not available';
      detailBody.append(fullPrompt);

      const reqHeading = document.createElement('h5');
      reqHeading.className = 'text-xs font-bold text-white';
      reqHeading.textContent = 'Generated Requirements';
      detailBody.append(reqHeading);

      requirements.forEach((requirement, index) => {
        const item = document.createElement('div');
        item.className = 'rounded-lg bg-white/5 p-3 space-y-1';

        const reqTitle = document.createElement('p');
        reqTitle.className = 'text-sm font-semibold text-[#C5A059]';
        reqTitle.textContent = `${index + 1}. ${requirement.title || 'Untitled'}`;

        const reqDescription = document.createElement('p');
        reqDescription.className = 'text-xs text-white/70';
        reqDescription.textContent = requirement.description || '';

        item.append(reqTitle, reqDescription);
        detailBody.appendChild(item);
      });

      if (thinking.length > 0) {
        const thinkingHeading = document.createElement('h5');
        thinkingHeading.className = 'text-xs font-bold text-white';
        thinkingHeading.textContent = 'AI Activity Summaries';
        detailBody.appendChild(thinkingHeading);

        thinking.forEach((text, index) => {
          const thought = document.createElement('p');
          thought.className = 'text-xs text-white/60 border-l-2 border-[#C5A059]/40 pl-3';
          thought.textContent = `${index + 1}. ${text}`;
          detailBody.appendChild(thought);
        });
      }

      details.append(summary, detailBody);
      card.append(heading, date, prompt, info, details);
      history.appendChild(card);
    });

  } catch (error) {
    console.error('Failed to load analysis history:', error);
    history.replaceChildren();

    const errorMessage = document.createElement('div');
    errorMessage.className = 'nexus-card p-6 text-sm text-rose-400';
    errorMessage.textContent = error.message || 'Failed to load analysis history.';
    history.appendChild(errorMessage);
  }
}



/* Project Requirements CRUD (Django-backed, project-owner scoped) */
function initWorkspaceRequirements() {
  const form = document.getElementById('workspace-requirement-form');
  const addButton = document.getElementById('btn-add-workspace-requirement');
  const cancelButton = document.getElementById('btn-cancel-workspace-requirement');
  const list = document.getElementById('project-requirements-list');
  if (!form || !addButton || !cancelButton || !list || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const formMessage = document.getElementById('workspace-requirement-form-message');
  const setFormMode = (requirement = null) => {
    form.reset();
    document.getElementById('workspace-requirement-id').value = requirement?.id || '';
    document.getElementById('workspace-requirement-name').value = requirement?.title || '';
    document.getElementById('workspace-requirement-description').value = requirement?.description || '';
    document.getElementById('workspace-requirement-priority').value = requirement?.priority || 'medium';
    document.getElementById('workspace-requirement-type').value = requirement?.req_type || 'functional';
    document.getElementById('workspace-requirement-status').value = requirement?.status || 'extracted';
    document.getElementById('workspace-requirement-complexity').value = requirement?.complexity || 'Medium';
    document.getElementById('workspace-requirement-form-title').textContent = requirement ? 'Edit Requirement' : 'Add Requirement';
    document.getElementById('btn-save-workspace-requirement').textContent = requirement ? 'Update Requirement' : 'Save Requirement';
    formMessage.textContent = '';
    form.classList.remove('hidden');
    document.getElementById('workspace-requirement-name').focus();
  };

  addButton.addEventListener('click', () => setFormMode());
  cancelButton.addEventListener('click', () => form.classList.add('hidden'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const project = window.nexusCurrentWorkspaceProject;
    if (!project?.id) {
      formMessage.textContent = 'Open a project before adding requirements.';
      return;
    }

    const requirementId = document.getElementById('workspace-requirement-id').value;
    const payload = {
      title: document.getElementById('workspace-requirement-name').value.trim(),
      description: document.getElementById('workspace-requirement-description').value.trim(),
      priority: document.getElementById('workspace-requirement-priority').value,
      req_type: document.getElementById('workspace-requirement-type').value,
      status: document.getElementById('workspace-requirement-status').value,
      complexity: document.getElementById('workspace-requirement-complexity').value
    };

    if (!payload.title || !payload.description) {
      formMessage.textContent = 'Title and description are required.';
      return;
    }

    const saveButton = document.getElementById('btn-save-workspace-requirement');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    formMessage.textContent = '';

    try {
      const baseUrl = `/django-api/projects/${encodeURIComponent(project.id)}/requirements/`;
      const response = await djangoAuthRequest(
        requirementId ? `${baseUrl}${encodeURIComponent(requirementId)}/` : baseUrl,
        { method: requirementId ? 'PATCH' : 'POST', body: JSON.stringify(payload) }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        const errors = data.errors ? Object.values(data.errors).flat().join(' ') : '';
        throw new Error(errors || data.detail || 'Unable to save requirement.');
      }
      form.classList.add('hidden');
      showToast('Requirement Saved', data.message || 'Requirement saved successfully.', 'success');
      await loadProjectRequirements(project.id);
    } catch (error) {
      formMessage.textContent = error.message || 'Unable to save requirement.';
      showToast('Save Failed', formMessage.textContent, 'error');
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = requirementId ? 'Update Requirement' : 'Save Requirement';
    }
  });

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-requirement-action="edit"], [data-requirement-action="delete"]');
    if (!button) return;
    const project = window.nexusCurrentWorkspaceProject;
    const requirement = (window.nexusWorkspaceRequirements || []).find(item => String(item.id) === button.dataset.requirementId);
    if (!project?.id || !requirement) return;

    if (button.dataset.requirementAction === 'edit') {
      setFormMode(requirement);
      return;
    }

    if (!window.confirm(`Delete requirement "${requirement.title}"? This cannot be undone.`)) return;
    button.disabled = true;
    try {
      const response = await djangoAuthRequest(
        `/django-api/projects/${encodeURIComponent(project.id)}/requirements/${encodeURIComponent(requirement.id)}/`,
        { method: 'DELETE' }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) throw new Error(data.detail || 'Unable to delete requirement.');
      showToast('Requirement Deleted', 'The requirement was removed from this project.', 'success');
      await loadProjectRequirements(project.id);
    } catch (error) {
      showToast('Delete Failed', error.message || 'Unable to delete requirement.', 'error');
      button.disabled = false;
    }
  });

  list.addEventListener('change', async (event) => {
    const select = event.target.closest('select[data-requirement-field]');
    if (!select) return;
    const project = window.nexusCurrentWorkspaceProject;
    const requirementId = select.dataset.requirementId;
    const field = select.dataset.requirementField;
    if (!project?.id || !requirementId || !['priority', 'status'].includes(field)) return;

    select.disabled = true;
    try {
      const response = await djangoAuthRequest(
        `/django-api/projects/${encodeURIComponent(project.id)}/requirements/${encodeURIComponent(requirementId)}/`,
        { method: 'PATCH', body: JSON.stringify({ [field]: select.value }) }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) throw new Error(data.detail || 'Unable to update requirement.');
      showToast('Requirement Updated', `${field === 'priority' ? 'Priority' : 'Status'} updated.`, 'success');
      await loadProjectRequirements(project.id);
    } catch (error) {
      showToast('Update Failed', error.message || 'Unable to update requirement.', 'error');
      await loadProjectRequirements(project.id);
    } finally {
      select.disabled = false;
    }
  });
}

async function loadProjectRequirements(projectId) {
  const list = document.getElementById('project-requirements-list');
  const count = document.getElementById('workspace-requirement-count');
  if (!list || !count || !projectId) return;
  list.replaceChildren();
  const loading = document.createElement('div');
  loading.className = 'rounded-lg bg-white/5 p-4 text-sm text-white/50';
  loading.textContent = 'Loading project requirements...';
  list.appendChild(loading);

  try {
    const response = await fetch(`/django-api/projects/${encodeURIComponent(projectId)}/requirements/`, {
      headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success !== true) throw new Error(data.detail || 'Unable to load project requirements.');
    const requirements = Array.isArray(data.requirements) ? data.requirements : [];
    window.nexusWorkspaceRequirements = requirements;
    count.textContent = `${requirements.length} Requirements`;
    list.replaceChildren();

    if (!requirements.length) {
      const empty = document.createElement('div');
      empty.className = 'rounded-lg bg-white/5 p-4 text-sm text-white/50';
      empty.textContent = 'No requirements yet. Add one manually or save an AI analysis to import generated requirements.';
      list.appendChild(empty);
      return;
    }

    const makeSelect = (label, field, value, options, requirementId) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'flex flex-col gap-1 text-[10px] text-white/50';
      wrapper.textContent = label;
      const select = document.createElement('select');
      select.className = 'rounded-md bg-[#0D0D0D] border border-white/10 px-2 py-1.5 text-xs text-white';
      select.dataset.requirementField = field;
      select.dataset.requirementId = requirementId;
      options.forEach(([optionValue, optionLabel]) => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionLabel;
        option.selected = optionValue === value;
        select.appendChild(option);
      });
      wrapper.appendChild(select);
      return wrapper;
    };

    requirements.forEach((requirement) => {
      const card = document.createElement('article');
      card.className = 'rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3';
      const top = document.createElement('div');
      top.className = 'flex items-start justify-between gap-3';
      const title = document.createElement('h4');
      title.className = 'text-sm font-semibold text-white';
      title.textContent = requirement.title;
      const badge = document.createElement('span');
      badge.className = 'text-[10px] uppercase rounded-full px-2 py-1 bg-[#C5A059]/10 text-[#C5A059]';
      badge.textContent = requirement.req_type.replace('-', ' ');
      top.append(title, badge);
      const description = document.createElement('p');
      description.className = 'text-xs leading-relaxed text-white/65';
      description.textContent = requirement.description;
      const controls = document.createElement('div');
      controls.className = 'grid grid-cols-2 sm:grid-cols-3 gap-2';
      controls.append(
        makeSelect('Priority', 'priority', requirement.priority, [['high','High'],['medium','Medium'],['low','Low']], requirement.id),
        makeSelect('Status', 'status', requirement.status, [['extracted','Extracted'],['approved','Approved'],['in-progress','In Progress'],['completed','Completed']], requirement.id)
      );
      const complexity = document.createElement('p');
      complexity.className = 'text-[10px] text-white/40';
      complexity.textContent = `Complexity: ${requirement.complexity} â€¢ ID: ${requirement.id}`;
      const actions = document.createElement('div');
      actions.className = 'flex justify-end gap-2 border-t border-white/10 pt-3';
      const edit = document.createElement('button');
      edit.type = 'button'; edit.textContent = 'Edit';
      edit.className = 'rounded-md border border-white/20 px-3 py-1.5 text-xs text-white hover:border-[#C5A059]';
      edit.dataset.requirementAction = 'edit'; edit.dataset.requirementId = requirement.id;
      const remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = 'Delete';
      remove.className = 'rounded-md border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10';
      remove.dataset.requirementAction = 'delete'; remove.dataset.requirementId = requirement.id;
      actions.append(edit, remove);
      card.append(top, description, controls, complexity, actions);
      list.appendChild(card);
    });
  } catch (error) {
    window.nexusWorkspaceRequirements = [];
    count.textContent = 'Unavailable';
    list.replaceChildren();
    const message = document.createElement('div');
    message.className = 'rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300';
    message.textContent = error.message || 'Unable to load requirements.';
    list.appendChild(message);
  }
}

async function loadDjangoProjects() {
  const container = document.getElementById('projects-list-container');
  if (!container) return;

  container.replaceChildren();
  const loading = document.createElement('div');
  loading.className = 'nexus-card p-6 text-sm text-white/60';
  loading.textContent = 'Loading your projects from Django...';
  container.appendChild(loading);

  try {
    const response = await fetch('/django-api/projects/', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('Your session is not authenticated. Sign in again to view your projects.');
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Project API returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}`);
    }

    const payload = await response.json();
    // Support both standard DRF list responses and paginated/enveloped responses.
    const projects = Array.isArray(payload) ? payload
      : Array.isArray(payload.results) ? payload.results
      : Array.isArray(payload.projects) ? payload.projects
      : null;
    if (!projects) throw new Error('Unexpected project API response. Expected a project list.');

    window.nexusProjectsCache = projects;
    container.replaceChildren();

    let toolbar = document.getElementById('nexus-project-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = 'nexus-project-toolbar';
      toolbar.className = 'mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3';
      toolbar.innerHTML = `
        <div class="text-xs text-white/60 font-mono" aria-live="polite">
          <span id="nexus-project-count" class="text-[#C5A059] font-bold text-sm">0</span>
          <span id="nexus-project-count-label"> projects in your workspace</span>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <input id="nexus-project-search" type="search" placeholder="Search your projects..."
            class="rounded-lg bg-[#0D0D0D] border border-white/15 px-3 py-2 text-xs text-white outline-none focus:border-[#C5A059]">
          <select id="nexus-project-status-filter"
            class="rounded-lg bg-[#0D0D0D] border border-white/15 px-3 py-2 text-xs text-white outline-none focus:border-[#C5A059]">
            <option value="all">All statuses</option><option value="planning">Planning</option>
            <option value="active">Active</option><option value="testing">Testing</option><option value="deployed">Deployed</option>
          </select>
          <button id="nexus-project-refresh" type="button"
            class="rounded-lg border border-white/20 px-3 py-2 text-xs text-white hover:border-[#C5A059]">Refresh</button>
        </div>`;
      container.parentElement.insertBefore(toolbar, container);
      document.getElementById('nexus-project-search')?.addEventListener('input', renderNexusProjects);
      document.getElementById('nexus-project-status-filter')?.addEventListener('change', renderNexusProjects);
      document.getElementById('nexus-project-refresh')?.addEventListener('click', loadDjangoProjects);
    }
    const count = document.getElementById('nexus-project-count');
    if (count) count.textContent = String(projects.length);
    renderNexusProjects();
  } catch (error) {
    console.error('Failed to load Django projects:', error);
    container.replaceChildren();
    const message = document.createElement('div');
    message.className = 'nexus-card p-6 text-sm text-rose-400';
    message.textContent = error instanceof Error ? error.message : 'Failed to load projects from Django.';
    container.appendChild(message);
  }
}

function renderNexusProjects() {
  const container = document.getElementById('projects-list-container');
  if (!container) return;
  const projects = Array.isArray(window.nexusProjectsCache) ? window.nexusProjectsCache : [];
  const search = (document.getElementById('nexus-project-search')?.value || '').trim().toLowerCase();
  const statusFilter = document.getElementById('nexus-project-status-filter')?.value || 'all';
  const filtered = projects.filter(project => {
    const searchable = [project.name, project.description, project.category,
      ...(Array.isArray(project.tech_stack) ? project.tech_stack : [])].join(' ').toLowerCase();
    return (!search || searchable.includes(search)) &&
      (statusFilter === 'all' || (project.status || 'planning').toLowerCase() === statusFilter);
  });

  container.replaceChildren();
  const countLabel = document.getElementById('nexus-project-count-label');
  if (countLabel) countLabel.textContent = ` of ${projects.length} projects shown`;
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'nexus-card col-span-full p-8 text-center text-sm text-white/50';
    empty.textContent = projects.length ? 'No projects match your search or status filter.' : 'No projects belong to this account yet. Create your first project to get started.';
    container.appendChild(empty);
    return;
  }

  filtered.forEach(project => {
    const card = document.createElement('article');
    card.className = 'nexus-card p-6 space-y-3 flex flex-col';
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between gap-3';
    const category = document.createElement('span');
    category.className = 'text-[10px] font-mono text-[#C5A059] uppercase';
    category.textContent = project.category || 'PROJECT';
    const status = document.createElement('span');
    status.className = 'text-[10px] font-mono uppercase ' +
      (['active', 'deployed'].includes((project.status || '').toLowerCase()) ? 'text-emerald-400' : 'text-amber-400');
    status.textContent = (project.status || 'planning').toUpperCase();
    header.append(category, status);

    const title = document.createElement('h3');
    title.className = 'text-base font-bold text-white';
    title.textContent = project.name || 'Untitled Project';
    const description = document.createElement('p');
    description.className = 'text-xs text-white/60 flex-1';
    description.textContent = project.description || 'No project description provided.';
    const tech = document.createElement('p');
    tech.className = 'text-[11px] text-white/45';
    tech.textContent = `Tech stack: ${Array.isArray(project.tech_stack) && project.tech_stack.length ? project.tech_stack.join(', ') : 'Not specified'}`;

    const progressWrap = document.createElement('div');
    progressWrap.className = 'space-y-1';
    const progressText = document.createElement('div');
    progressText.className = 'flex justify-between text-[10px] font-mono text-white/50';
    const progressLabel = document.createElement('span'); progressLabel.textContent = 'Project progress';
    const progressValue = document.createElement('span'); progressValue.className = 'text-[#C5A059]';
    const numericProgress = Math.max(0, Math.min(100, Number(project.progress) || 0));
    progressValue.textContent = `${numericProgress}%`;
    progressText.append(progressLabel, progressValue);
    const track = document.createElement('div'); track.className = 'h-1.5 rounded-full bg-white/10 overflow-hidden';
    const fill = document.createElement('div'); fill.className = 'h-full rounded-full bg-[#C5A059]'; fill.style.width = `${numericProgress}%`;
    track.appendChild(fill); progressWrap.append(progressText, track);

    const actions = document.createElement('div');
    actions.className = 'flex flex-wrap justify-end gap-2 pt-3 border-t border-white/10';
    const open = document.createElement('button'); open.type = 'button';
    open.className = 'rounded-lg border border-[#C5A059]/50 px-3 py-1.5 text-xs text-[#C5A059] hover:bg-[#C5A059]/10';
    open.textContent = 'Open Workspace'; open.addEventListener('click', () => openProjectWorkspace(project));
    const edit = document.createElement('button'); edit.type = 'button';
    edit.className = 'rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:border-[#C5A059]';
    edit.textContent = 'Edit'; edit.addEventListener('click', () => openEditProjectModal(project));
    const remove = document.createElement('button'); remove.type = 'button';
    remove.className = 'rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10';
    remove.textContent = 'Delete'; remove.addEventListener('click', () => deleteDjangoProject(project, remove));
    actions.append(open, edit, remove);
    card.append(header, title, description, tech, progressWrap, actions);
    container.appendChild(card);
  });
}

function resetProjectFormForCreate() {
  const form = document.getElementById('create-project-form');
  const title = document.getElementById('project-modal-title');
  const submitButton = document.getElementById('create-project-submit');
  const message = document.getElementById('create-project-message');
  if (!form) return;
  form.reset();
  form.dataset.projectId = '';
  const progressInput = form.elements.namedItem('progress');
  if (progressInput) progressInput.value = '0';
  if (title) title.textContent = 'Create New Project';
  if (submitButton) submitButton.textContent = 'Create Project';
  if (message) message.textContent = '';
}

function openCreateProjectModal() {
  resetProjectFormForCreate();
  document.getElementById('create-project-modal')?.classList.remove('hidden');
}

function openEditProjectModal(project) {
  const form = document.getElementById('create-project-form');
  const modal = document.getElementById('create-project-modal');
  const title = document.getElementById('project-modal-title');
  const submitButton = document.getElementById('create-project-submit');
  const message = document.getElementById('create-project-message');
  if (!form || !modal) return;

  form.dataset.projectId = String(project.id);
  form.elements.namedItem('name').value = project.name || '';
  form.elements.namedItem('description').value = project.description || '';
  form.elements.namedItem('category').value = project.category || '';
  form.elements.namedItem('status').value = project.status || 'planning';
  form.elements.namedItem('progress').value = String(project.progress ?? 0);
  form.elements.namedItem('tech_stack').value = Array.isArray(project.tech_stack)
    ? project.tech_stack.join(', ') : (project.tech_stack || '');
  form.elements.namedItem('repo_url').value = project.repo_url || '';
  if (title) title.textContent = 'Edit Project';
  if (submitButton) submitButton.textContent = 'Save Changes';
  if (message) message.textContent = `Editing project #${project.id}.`;
  modal.classList.remove('hidden');
}

async function deleteDjangoProject(project, button) {
  if (!project || project.id == null) return;
  const confirmed = window.confirm(`Delete project "${project.name || 'Untitled Project'}"? This cannot be undone.`);
  if (!confirmed) return;

  const originalText = button?.textContent || 'Delete';
  if (button) {
    button.disabled = true;
    button.textContent = 'Deleting...';
  }

  try {
    const response = await djangoAuthRequest(
      `/django-api/projects/${encodeURIComponent(project.id)}/`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const detail = data.detail || JSON.stringify(data);
      throw new Error(`HTTP ${response.status}: ${detail}`);
    }

    await loadDjangoProjects();
    if (typeof showToast === 'function') {
      showToast('Project Deleted', `${project.name || 'Project'} was deleted.`, 'success');
    }
  } catch (error) {
    console.error('Delete project failed:', error);
    if (typeof showToast === 'function') {
      showToast('Deletion Failed', error instanceof Error ? error.message : 'Unable to delete project.', 'error');
    } else {
      window.alert(error instanceof Error ? error.message : 'Unable to delete project.');
    }
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

/* Save AI Analysis to Project Workspace */
function initSaveAnalysis() {
  const trigger = document.getElementById('btn-save-analysis');
  const modal = document.getElementById('save-analysis-modal');
  const projectSelect = document.getElementById('analysis-project-select');
  const message = document.getElementById('save-analysis-message');
  const createNewButton = document.getElementById('create-project-for-analysis');

  if (!trigger || !modal || !projectSelect) return;
  if (trigger.dataset.saveWorkspaceBound === 'true') return;

  trigger.dataset.saveWorkspaceBound = 'true';

  // Load existing Django projects
  async function loadProjects() {
    projectSelect.replaceChildren();

    const loadingOption = document.createElement('option');
    loadingOption.textContent = 'Loading projects...';
    projectSelect.appendChild(loadingOption);

    message.textContent = 'Loading your projects...';

    try {
      const response = await fetch('/django-api/projects/', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Unable to load projects. HTTP ${response.status}`);
      }

      const projects = await response.json();

      if (!Array.isArray(projects)) {
        throw new Error('Invalid projects response.');
      }

      projectSelect.replaceChildren();

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select a project...';
      placeholder.disabled = true;
      placeholder.selected = true;
      projectSelect.appendChild(placeholder);

      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
      });

      message.textContent = projects.length
        ? `${projects.length} project(s) available.`
        : 'No projects found. Create a new project to continue.';

    } catch (error) {
      console.error('Project loading failed:', error);
      projectSelect.replaceChildren();

      const option = document.createElement('option');
      option.textContent = 'Failed to load projects';
      projectSelect.appendChild(option);

      message.textContent = error.message;
    }
  }

  // Load projects whenever Save Analysis modal opens
  trigger.addEventListener('click', loadProjects);

  // Open existing Create Project modal
  if (createNewButton) {
    createNewButton.addEventListener('click', () => {
      modal.classList.add('hidden');

      const createModal = document.getElementById('create-project-modal');

      if (createModal) {
        resetProjectFormForCreate();
        createModal.classList.remove('hidden');
      }
    });
  }
    // Save AI Analysis to Django
  const saveAnalysisButton = document.getElementById('confirm-save-analysis');

  if (saveAnalysisButton) {
    saveAnalysisButton.addEventListener('click', async () => {
      const analysis = window.nexusPendingAnalysis;
      const projectId = projectSelect.value;

      if (!projectId) {
        message.textContent = 'Please select a project first.';
        return;
      }

      if (!analysis || !Array.isArray(analysis.requirements)) {
        message.textContent = 'No completed AI analysis found. Please analyze again.';
        return;
      }

      saveAnalysisButton.disabled = true;
      saveAnalysisButton.textContent = 'Saving Analysis...';
      message.textContent = 'Saving analysis to Django...';

      try {
        const response = await djangoAuthRequest(
          `/django-api/projects/${encodeURIComponent(projectId)}/analyses/`,
          {
            method: 'POST',
            body: JSON.stringify({
              prompt: analysis.prompt,
              category: analysis.category,
              provider: analysis.provider,
              model: analysis.model,
              thinking_summaries: analysis.thinkingSummaries || [],
              requirements: analysis.requirements
            })
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success !== true) {
          throw new Error(
            data.error || data.detail || `HTTP ${response.status}`
          );
        }

        const summary = data.import_summary || {};

        message.textContent =
          `Saved! ${summary.created_count || 0} requirements imported. ` +
          `${summary.duplicate_count || 0} duplicates skipped.`;

        modal.classList.add('hidden');

        showToast(
          'Analysis Saved',
          'AI analysis and requirements saved successfully.',
          'success'
        );

      } catch (error) {
        console.error('Save analysis failed:', error);
        message.textContent = error.message || 'Failed to save analysis.';

        showToast('Save Failed', message.textContent, 'error');

      } finally {
        saveAnalysisButton.disabled = false;
        saveAnalysisButton.textContent = 'Save to Selected Project';
      }
    });
  }
}

/* Create and Edit Project form -> Django REST API */
function initCreateProjectForm() {
  const form = document.getElementById('create-project-form');
  const modal = document.getElementById('create-project-modal');
  const message = document.getElementById('create-project-message');
  const submitButton = document.getElementById('create-project-submit');
  if (!form || form.dataset.apiBound === 'true') return;
  form.dataset.apiBound = 'true';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const projectId = form.dataset.projectId || '';
    const editing = Boolean(projectId);
    const name = form.elements.namedItem('name').value.trim();
    const description = form.elements.namedItem('description').value.trim();
    const category = form.elements.namedItem('category').value.trim();
    const status = form.elements.namedItem('status').value;
    const progress = Number(form.elements.namedItem('progress').value);
    const techStackValue = form.elements.namedItem('tech_stack').value;
    const repoUrl = form.elements.namedItem('repo_url').value.trim();

    if (!name || !description || !category) {
      message.textContent = 'Please fill in all required fields.';
      return;
    }
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      message.textContent = 'Progress must be between 0 and 100.';
      return;
    }

    const payload = {
      name, description, category, status, progress,
      tech_stack: techStackValue.split(',').map(item => item.trim()).filter(Boolean),
      repo_url: repoUrl
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = editing ? 'Saving...' : 'Creating...';
    }
    message.textContent = editing ? 'Updating project in Django...' : 'Saving project to Django...';

    try {
      const url = editing
        ? `/django-api/projects/${encodeURIComponent(projectId)}/`
        : '/django-api/projects/';
      const response = await djangoAuthRequest(url, {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload)
      });
      const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = data.detail || JSON.stringify(data);
        throw new Error(`HTTP ${response.status}: ${detail}`);
      }

      message.textContent = editing
        ? `Project "${data.name || name}" updated successfully.`
        : `Project created successfully (ID: ${data.id}).`;
      resetProjectFormForCreate();
      if (modal) modal.classList.add('hidden');
      await loadDjangoProjects();
      if (typeof showToast === 'function') {
        showToast(
          editing ? 'Project Updated' : 'Project Created',
          editing ? `${data.name || name} was updated in Django.` : `${data.name || name} was saved to the Django database.`,
          'success'
        );
      }
    } catch (error) {
      console.error(editing ? 'Update project failed:' : 'Create project failed:', error);
      message.textContent = error instanceof Error ? error.message : 'Unable to save project.';
      if (typeof showToast === 'function') {
        showToast(editing ? 'Update Failed' : 'Creation Failed', message.textContent, 'error');
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = form.dataset.projectId ? 'Save Changes' : 'Create Project';
      }
    }
  });
}


/* Project-aware Database & ORM Designer */
function initDatabaseDesigner() {
  const button = document.getElementById('btn-generate-database-schema');
  const tablesContainer = document.getElementById('database-schema-tables');
  const modelsCode = document.getElementById('database-django-models');
  const status = document.getElementById('database-generation-status');
  const caption = document.getElementById('database-project-caption');
  const providerMeta = document.getElementById('database-provider-meta');
  const copyButton = document.getElementById('btn-copy-database-models');
  if (!button || !tablesContainer || button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';

  function renderDesign(design) {
    tablesContainer.replaceChildren();
    const tables = Array.isArray(design?.tables) ? design.tables : [];
    if (!tables.length) {
      const empty = document.createElement('div');
      empty.className = 'nexus-card p-5 text-sm text-white/50 lg:col-span-2';
      empty.textContent = 'No saved database schema yet. Generate one with AI.';
      tablesContainer.appendChild(empty);
    } else {
      tables.forEach((table) => {
        const card = document.createElement('article');
        card.className = 'nexus-card p-5 space-y-3';
        const heading = document.createElement('div');
        heading.className = 'flex items-center justify-between gap-2';
        const title = document.createElement('h4');
        title.className = 'text-sm font-bold text-[#C5A059] font-mono';
        title.textContent = table.name || 'UnnamedTable';
        const count = document.createElement('span');
        count.className = 'text-[10px] text-white/40';
        count.textContent = `${Array.isArray(table.columns) ? table.columns.length : 0} fields`;
        heading.append(title, count);
        const description = document.createElement('p');
        description.className = 'text-xs text-white/55';
        description.textContent = table.description || '';
        const list = document.createElement('div');
        list.className = 'divide-y divide-white/10';
        (Array.isArray(table.columns) ? table.columns : []).forEach((column) => {
          const row = document.createElement('div');
          row.className = 'py-2 flex flex-wrap items-center justify-between gap-2 text-xs';
          const name = document.createElement('span');
          name.className = 'text-white font-mono';
          name.textContent = `${column.name || 'field'}${column.primary_key ? ' Â· PK' : ''}${column.foreign_key ? ` Â· FK ${column.foreign_key}` : ''}`;
          const type = document.createElement('span');
          type.className = 'text-[#C5A059] font-mono';
          type.textContent = `${column.type || 'CharField'}${column.nullable ? ' Â· nullable' : ''}`;
          row.append(name, type);
          list.appendChild(row);
        });
        card.append(heading, description, list);
        tablesContainer.appendChild(card);
      });
    }
    if (modelsCode) modelsCode.textContent = design?.django_models || '# No Django model code is saved yet.';
    if (providerMeta) providerMeta.textContent = design?.provider ? `${design.provider} Â· ${design.model || 'Model'}` : '';
  }

  async function loadSavedDesign() {
    const project = window.nexusCurrentWorkspaceProject;
    if (!project?.id) {
      if (caption) caption.textContent = 'Open a project workspace first.';
      if (status) status.textContent = 'No active project selected.';
      if (providerMeta) providerMeta.textContent = '';
      renderDesign(null);
      return;
    }
    if (caption) caption.textContent = `${project.name || 'Current project'} Â· ${project.category || 'General'}`;
    if (status) status.textContent = 'Loading saved database design...';
    try {
      const response = await fetch(`/django-api/projects/${encodeURIComponent(project.id)}/database-design/`, {
        headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) throw new Error(data.detail || 'Unable to load the saved database design.');
      renderDesign(data.design);
      if (status) status.textContent = data.design?.tables?.length
        ? `Loaded ${data.design.tables.length} saved tables for ${project.name}.`
        : 'No database schema saved for this project yet.';
    } catch (error) {
      if (status) status.textContent = error.message || 'Unable to load database design.';
    }
  }

  button.addEventListener('click', async () => {
    const project = window.nexusCurrentWorkspaceProject;
    if (!project?.id) {
      if (typeof showToast === 'function') showToast('Project Required', 'Open a project from Project Workspace first.', 'warning');
      if (status) status.textContent = 'Open a project workspace first.';
      return;
    }
    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="bi bi-arrow-repeat animate-spin"></i> Generating Database Schema...';
    if (status) status.textContent = 'Loading project details and saved requirements...';
    try {
      const aiResponse = await fetch('/api/ai/generate-database-schema', {
        method: 'POST',
        headers: typeof getNexusAiCsrfHeaders === 'function'
          ? getNexusAiCsrfHeaders()
          : { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          projectId: project.id,
          databaseType: document.getElementById('database-engine-select')?.value || 'mysql'
        })
      });
      const generated = await aiResponse.json().catch(() => ({}));
      if (!aiResponse.ok || generated.success !== true) throw new Error(generated.error || `AI schema generation failed (HTTP ${aiResponse.status}).`);
      if (status) status.textContent = 'Saving generated schema to the project workspace...';
      const saveResponse = await djangoAuthRequest(`/django-api/projects/${encodeURIComponent(project.id)}/database-design/`, {
        method: 'PUT',
        body: JSON.stringify({
          tables: generated.tables,
          django_models: generated.django_models || '',
          provider: generated.provider,
          model: generated.model
        })
      });
      const saved = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok || saved.success !== true) throw new Error(saved.detail || 'Generated schema could not be saved.');
      renderDesign(saved.design);
      if (status) status.textContent = `Generated and saved ${saved.design.tables.length} tables for ${project.name}.`;
      showToast('Database Schema Generated', `Saved ${saved.design.tables.length} project-specific tables.`, 'success');
    } catch (error) {
      console.error('Project database schema generation error:', error);
      if (status) status.textContent = error.message || 'Database schema generation failed.';
      if (typeof showToast === 'function') showToast('Database Design Failed', error.message || 'Could not generate database schema.', 'error');
    } finally {
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  });

  copyButton?.addEventListener('click', async () => {
    const text = modelsCode?.textContent || '';
    if (!text || text.startsWith('# No Django')) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied', 'Django ORM model code copied to clipboard.', 'success');
    } catch {
      showToast('Copy Failed', 'Clipboard access was not available in this browser.', 'error');
    }
  });

  window.addEventListener('nexus:database-view-opened', loadSavedDesign);
  window.addEventListener('nexus:workspace-project-opened', () => {
    if (!document.getElementById('view-database')?.classList.contains('hidden')) loadSavedDesign();
  });
}


/* NEXUSAI LIVE OVERVIEW - DATABASE-DRIVEN DASHBOARD METRICS */
(function initLiveDashboardOverview() {
  let refreshInFlight = false;

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function renderStatusChart(metrics) {
    const target = document.getElementById('dash-status-chart');
    if (!target) return;
    const total = Number(metrics.projects || 0);
    const rows = [
      ['Planning', Number(metrics.planning_projects || 0), '#94A3B8'],
      ['Active', Number(metrics.active_projects || 0), '#C5A059'],
      ['Testing', Number(metrics.testing_projects || 0), '#38BDF8'],
      ['Deployed', Number(metrics.deployed_projects || 0), '#10B981']
    ];
    target.replaceChildren();
    if (!total) {
      const empty = document.createElement('p');
      empty.className = 'text-xs text-white/40';
      empty.textContent = 'No projects found for this account.';
      target.appendChild(empty);
      return;
    }
    rows.forEach(([label, count, color]) => {
      const wrap = document.createElement('div');
      wrap.className = 'space-y-1';
      const line = document.createElement('div');
      line.className = 'flex justify-between text-xs';
      const name = document.createElement('span');
      name.className = 'text-white/60';
      name.textContent = label;
      const value = document.createElement('span');
      value.className = 'text-white font-mono';
      value.textContent = `${count} (${Math.round(count * 100 / total)}%)`;
      line.append(name, value);
      const track = document.createElement('div');
      track.className = 'h-2 rounded-full bg-white/10 overflow-hidden';
      const bar = document.createElement('div');
      bar.className = 'h-full rounded-full';
      bar.style.width = `${Math.max(0, Math.min(100, count * 100 / total))}%`;
      bar.style.backgroundColor = color;
      track.appendChild(bar);
      wrap.append(line, track);
      target.appendChild(wrap);
    });
  }

  async function refresh() {
    const dashboard = document.getElementById('view-dashboard');
    if (!dashboard || refreshInFlight) return;
    refreshInFlight = true;
    const errorNode = document.getElementById('dash-data-error');
    if (errorNode) errorNode.classList.add('hidden');
    try {
      const response = await fetch('/django-api/dashboard/summary/', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(response.status === 401 || response.status === 403
          ? 'Please sign in again to load your dashboard.'
          : `Dashboard data could not be loaded (HTTP ${response.status}).`);
      }
      const payload = await response.json();
      if (!payload.success || !payload.metrics) throw new Error(payload.detail || 'Dashboard returned invalid data.');
      const m = payload.metrics;
      setText('dash-project-count', m.projects ?? 0);
      setText('dash-project-caption', `${m.active_projects || 0} active · ${m.testing_projects || 0} testing · ${m.deployed_projects || 0} deployed`);
      setText('dash-agent-count', m.agents ?? 0);
      setText('dash-requirement-count', m.requirements ?? 0);
      setText('dash-node-count', m.topology_nodes ?? 0);
      setText('dash-audit-rate', m.security_audit_rate == null ? 'Not audited' : `${m.security_audit_rate}%`);
      setText('dash-audit-caption', `${m.tests_passed || 0} passed · ${m.tests_failed || 0} failed · ${m.tests_total || 0} total tests`);
      setText('dash-average-progress', `${m.average_progress || 0}%`);
      const progress = document.getElementById('dash-progress-bar');
      if (progress) progress.style.width = `${Math.max(0, Math.min(100, Number(m.average_progress || 0)))}%`;
      setText('dash-active-count', m.active_projects ?? 0);
      setText('dash-testing-count', m.testing_projects ?? 0);
      setText('dash-deployed-count', m.deployed_projects ?? 0);
      setText('dash-last-updated', `Updated ${new Date().toLocaleTimeString()}`);
      renderStatusChart(m);
      window.nexusDashboardMetrics = m;
    } catch (error) {
      console.error('Live dashboard refresh failed:', error);
      if (errorNode) {
        errorNode.textContent = error.message || 'Dashboard data unavailable.';
        errorNode.classList.remove('hidden');
      }
      ['dash-project-count','dash-agent-count','dash-requirement-count','dash-node-count'].forEach(id => setText(id, '—'));
      setText('dash-project-caption', 'Unable to load account data');
    } finally {
      refreshInFlight = false;
    }
  }

  document.addEventListener('DOMContentLoaded', refresh);
  window.addEventListener('nexus:dashboard-refresh', refresh);
  window.addEventListener('nexus:workspace-project-opened', refresh);
  document.querySelectorAll('[data-view="dashboard"]').forEach(link => link.addEventListener('click', () => setTimeout(refresh, 80)));
  setTimeout(refresh, 1200);
})();

// NEXUSAI - SINGLE DASHBOARD LIFECYCLE UPDATER
(function () {
async function refreshDashboardLifecycle() {
    const dashboard = document.getElementById('view-dashboard');

    if (!dashboard) return;

    try {
        const response = await fetch('/django-api/dashboard/summary/', {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Dashboard API error: ${response.status}`);
        }

        const payload = await response.json();

        if (!payload.success || !payload.metrics) {
            throw new Error('Invalid dashboard response');
        }

        const m = payload.metrics;
        const pipeline = dashboard.querySelector('.nexus-card-gold');

        if (!pipeline) return;

        const heading = Array.from(pipeline.querySelectorAll('span'))
            .find(el => el.textContent.trim().startsWith('STAGE'));

        const stageGrid = pipeline.querySelector('.grid');

        if (!stageGrid) return;

        const stages = [
            { name: 'Idea', done: Number(m.projects) > 0 },
            { name: 'Specs', done: Number(m.requirements) > 0 },
            { name: 'Architecture', done: Number(m.topology_nodes) > 0 },
            {
                name: 'Database',
                done: Number(m.database_designs) + Number(m.database_tables) > 0
            },
            { name: 'Code', done: Number(m.code_files) > 0 },
            { name: 'Testing', done: Number(m.tests_total) > 0 },
            {
                name: 'Review',
                done: Number(m.tests_total) > 0 &&
                      Number(m.tests_passed) === Number(m.tests_total) &&
                      Number(m.tests_failed) === 0
            },
            { name: 'Docs', done: false }
        ];

        const firstIncomplete = stages.findIndex(stage => !stage.done);

        const nextStage = firstIncomplete === -1
            ? 8
            : firstIncomplete + 1;

        if (heading) {
            heading.textContent = firstIncomplete === -1
                ? 'STAGE 8 / 8 — COMPLETE'
                : `STAGE ${nextStage} / 8 — ${stages[firstIncomplete].name.toUpperCase()}`;
        }

        Array.from(stageGrid.children).slice(0, 8).forEach((cell, index) => {
            const stage = stages[index];

            cell.textContent = `${index + 1}. ${stage.name}`;
            cell.title = stage.done ? 'Completed' : 'Not completed';

            cell.classList.remove(
                'bg-emerald-500/10',
                'border-emerald-500/30',
                'text-emerald-400',
                'bg-[#C5A059]/20',
                'border-[#C5A059]',
                'text-[#C5A059]',
                'font-bold',
                'shadow-md',
                'bg-white/5',
                'border-white/10',
                'text-white/50',
                'font-semibold'
            );

            if (stage.done) {
                cell.classList.add(
                    'bg-emerald-500/10',
                    'border',
                    'border-emerald-500/30',
                    'text-emerald-400',
                    'font-semibold'
                );
            } else if (index === nextStage - 1) {
                cell.classList.add(
                    'bg-[#C5A059]/20',
                    'border',
                    'border-[#C5A059]',
                    'text-[#C5A059]',
                    'font-bold',
                    'shadow-md'
                );
            } else {
                cell.classList.add(
                    'bg-white/5',
                    'border',
                    'border-white/10',
                    'text-white/50'
                );
            }
        });

        console.log('NexusAI lifecycle updated:', {
            nextStage,
            stages
        });

    } catch (error) {
        console.error('Lifecycle update failed:', error);
    }
}
  document.addEventListener('DOMContentLoaded', refreshDashboardLifecycle);
  window.addEventListener('nexus:dashboard-refresh', refreshDashboardLifecycle);
  setTimeout(refreshDashboardLifecycle, 1000);

  // Refresh whenever the dashboard becomes visible.
  document.addEventListener('click', () => {
    setTimeout(refreshDashboardLifecycle, 100);
  });

})
/* =====================================================
   NEXUSAI - DYNAMIC SPRINT TASK BOARD
===================================================== */

function initSprintTaskBoard() {
  const board = document.getElementById('task-board');
  const form = document.getElementById('new-task-form');
  const addButton = document.getElementById('btn-add-task');
  const cancelButton = document.getElementById('btn-cancel-task');
  const statusText = document.getElementById('task-board-status');

  if (!board || !form || !addButton || board.dataset.bound === 'true') return;
  board.dataset.bound = 'true';

  const columns = [
    { key: 'backlog', label: 'BACKLOG', color: 'text-rose-400', style: 'nexus-card' },
    { key: 'in-progress', label: 'IN PROGRESS', color: 'text-[#C5A059]', style: 'nexus-card-gold' },
    { key: 'review', label: 'CODE REVIEW', color: 'text-sky-400', style: 'nexus-card' },
    { key: 'completed', label: 'COMPLETED', color: 'text-emerald-400', style: 'nexus-card' }
  ];

  const csrfHeaders = () => {
    if (typeof getNexusAiCsrfHeaders === 'function') {
      return getNexusAiCsrfHeaders();
    }
    return { 'Content-Type': 'application/json' };
  };

  async function loadTasks() {
    const project = window.nexusCurrentWorkspaceProject;

    if (!project?.id) {
      board.replaceChildren();
      statusText.textContent = 'Open a project workspace first.';
      return;
    }

    statusText.textContent = 'Loading project tasks...';
    board.replaceChildren();

    try {
      const response = await fetch(
        `/django-api/projects/${encodeURIComponent(project.id)}/tasks/`,
        {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load tasks.');
      }

      renderTasks(data.tasks || []);
      window.dispatchEvent(new CustomEvent('nexus:dashboard-refresh'));
      statusText.textContent = `${data.tasks.length} task(s) loaded for ${project.name}.`;
    } catch (error) {
      statusText.textContent = error.message || 'Unable to load tasks.';
    }
  }

  function renderTasks(tasks) {
    board.replaceChildren();

    columns.forEach(column => {
      const columnTasks = tasks.filter(task => task.status === column.key);

      const section = document.createElement('section');
      section.className = 'space-y-3 min-w-0';

      const heading = document.createElement('div');
      heading.className = `${column.color} font-mono text-xs font-bold`;
      heading.textContent = `${column.label} (${columnTasks.length})`;
      section.appendChild(heading);

      columnTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `${column.style} p-4 space-y-3`;

        const title = document.createElement('div');
        title.className = 'text-sm font-semibold text-white';
        title.textContent = task.title;

        const description = document.createElement('p');
        description.className = 'text-xs text-white/50';
        description.textContent = task.description || 'No description';

        const details = document.createElement('div');
        details.className = 'text-[10px] text-white/50 font-mono';
        details.textContent =
          `${String(task.priority).toUpperCase()} · ${task.assigned_agent || 'Unassigned'}`;

        const select = document.createElement('select');
        select.className = 'w-full bg-[#080808] border border-white/10 rounded-lg p-2 text-xs text-white';

        columns.forEach(option => {
          const item = document.createElement('option');
          item.value = option.key;
          item.textContent = option.label;
          item.selected = option.key === task.status;
          select.appendChild(item);
        });

        select.addEventListener('change', () => updateTaskStatus(task.id, select.value));

        card.append(title, description, details, select);
        section.appendChild(card);
      });

      if (!columnTasks.length) {
        const empty = document.createElement('div');
        empty.className = 'text-xs text-white/30 border border-dashed border-white/10 rounded-lg p-4';
        empty.textContent = 'No tasks yet';
        section.appendChild(empty);
      }

      board.appendChild(section);
    });
  }

  async function updateTaskStatus(taskId, status) {
    const project = window.nexusCurrentWorkspaceProject;
    if (!project?.id) return;

    try {
      const response = await fetch(
        `/django-api/projects/${encodeURIComponent(project.id)}/tasks/${taskId}/`,
        {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: {
            ...csrfHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to update task.');
      }

      await loadTasks();
    } catch (error) {
      statusText.textContent = error.message || 'Task update failed.';
    }
  }

  addButton.addEventListener('click', () => form.classList.toggle('hidden'));
  cancelButton?.addEventListener('click', () => {
    form.reset();
    form.classList.add('hidden');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const project = window.nexusCurrentWorkspaceProject;
    if (!project?.id) {
      statusText.textContent = 'Open a project workspace first.';
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(
        `/django-api/projects/${encodeURIComponent(project.id)}/tasks/`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            ...csrfHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to create task.');
      }

      form.reset();
      form.classList.add('hidden');
      await loadTasks();
    } catch (error) {
      statusText.textContent = error.message || 'Task creation failed.';
    } finally {
      submitButton.disabled = false;
    }
  });

  window.addEventListener('nexus:workspace-project-opened', loadTasks);

  document.querySelectorAll('[data-view="tasks"]').forEach(link => {
    link.addEventListener('click', loadTasks);
  });

  loadTasks();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSprintTaskBoard);
} else {
  initSprintTaskBoard();
};
/* NEXUSAI LIVE TASK DASHBOARD */

(function initTaskDashboardSummary() {
  async function refreshTaskSummary() {
    const dashboard = document.getElementById('view-dashboard');
    if (!dashboard) return;

    try {
      const response = await fetch('/django-api/dashboard/summary/', {
        credentials: 'same-origin',
        cache: 'no-store'
      });

      if (!response.ok) throw new Error('Dashboard API failed');

      const data = await response.json();
      if (!data.success) throw new Error('Invalid dashboard response');

      const m = data.metrics;

      let panel = document.getElementById('dashboard-task-summary');

      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'dashboard-task-summary';
        panel.className = 'nexus-card p-5 space-y-4';

        const heading = document.createElement('h3');
        heading.className = 'text-sm font-bold text-white';
        heading.textContent = 'Sprint Task Progress';

        const grid = document.createElement('div');
        grid.id = 'dashboard-task-metrics';
        grid.className = 'grid grid-cols-2 md:grid-cols-5 gap-4';

        const progress = document.createElement('div');
        progress.id = 'dashboard-task-progress';
        progress.className = 'text-xs text-white/60';

        panel.append(heading, grid, progress);
        dashboard.appendChild(panel);
      }

      const grid = document.getElementById('dashboard-task-metrics');
      grid.replaceChildren();

      const items = [
        ['Total Tasks', m.tasks],
        ['Backlog', m.backlog_tasks],
        ['In Progress', m.in_progress_tasks],
        ['Review', m.review_tasks],
        ['Completed', m.completed_tasks]
      ];

      items.forEach(([label, value]) => {
        const card = document.createElement('div');
        card.className = 'bg-white/5 rounded-lg p-3';

        const name = document.createElement('div');
        name.className = 'text-[10px] text-white/50';
        name.textContent = label;

        const number = document.createElement('div');
        number.className = 'text-xl font-bold text-[#C5A059]';
        number.textContent = value;

        card.append(name, number);
        grid.appendChild(card);
      });

      document.getElementById('dashboard-task-progress').textContent =
        `Task completion: ${m.task_completion_rate}%`;

    } catch (error) {
      console.error('Task dashboard summary error:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshTaskSummary);
  } else {
    refreshTaskSummary();
  }

  window.addEventListener('nexus:dashboard-refresh', refreshTaskSummary);
})();
// NexusAI CI/CD Pipeline — project-linked local validation
(function initCicdPipeline() {
  function bindPipeline() {
    const button = document.getElementById('btn-run-pipeline');
    const select = document.getElementById('cicd-project');
    // The Django template page uses cicd.js; this handler is for the static index.html view.
    if (!button || !select || button.dataset.cicdBound === 'true') return;
    button.dataset.cicdBound = 'true';

    const status = document.getElementById('pipeline-status');
    const output = document.getElementById('pipeline-output');
    const tests = document.getElementById('pipeline-tests');
    const checks = document.getElementById('pipeline-checks');
    const readiness = document.getElementById('pipeline-readiness');

    async function loadProjects() {
      select.replaceChildren();
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Loading your projects...';
      select.appendChild(placeholder);
      try {
        const response = await fetch('/django-api/projects/', {
          method: 'GET', credentials: 'same-origin',
          headers: { Accept: 'application/json' }, cache: 'no-store'
        });
        if (!response.ok) throw new Error(`Unable to load projects (HTTP ${response.status}).`);
        const payload = await response.json();
        const projects = Array.isArray(payload) ? payload
          : Array.isArray(payload.results) ? payload.results
          : Array.isArray(payload.projects) ? payload.projects : null;
        if (!projects) throw new Error('Unexpected projects API response.');
        select.replaceChildren();
        const first = document.createElement('option');
        first.value = '';
        first.textContent = projects.length ? 'Choose a project' : 'No projects found';
        select.appendChild(first);
        projects.forEach(project => {
          const option = document.createElement('option');
          option.value = String(project.id);
          option.textContent = project.name || `Project ${project.id}`;
          select.appendChild(option);
        });
        const active = window.nexusCurrentWorkspaceProject?.id;
        const remembered = localStorage.getItem('nexus_active_project_id');
        const preferred = String(active || remembered || '');
        if (preferred && [...select.options].some(option => option.value === preferred)) {
          select.value = preferred;
        }
        if (status) status.textContent = projects.length
          ? 'Select a project and run local validation.' : 'Create a project before running CI/CD.';
      } catch (error) {
        select.replaceChildren();
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Project loading failed';
        select.appendChild(option);
        if (status) status.textContent = error.message;
      }
    }

    select.addEventListener('change', () => {
      if (select.value) localStorage.setItem('nexus_active_project_id', select.value);
    });

    button.addEventListener('click', async () => {
      const projectId = Number(select.value);
      if (!projectId) {
        if (status) status.textContent = 'Select a project first.';
        return;
      }
      const csrfMatch = document.cookie.match(/(?:^|; )csrftoken=([^;]*)/);
      const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : '';
      button.disabled = true;
      button.textContent = 'Running...';
      if (status) status.textContent = 'Pipeline is running...';
      if (output) output.textContent = 'Starting project validation...\n';
      if (tests) tests.textContent = 'Running';
      if (checks) checks.textContent = 'Running';
      if (readiness) readiness.textContent = 'Checking';
      try {
        const response = await fetch('/django-api/cicd/run/', {
          method: 'POST', credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
            'Accept': 'application/json'
          },
          body: JSON.stringify({ project_id: projectId })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Pipeline request failed (HTTP ${response.status}).`);
        const logs = Array.isArray(data.logs) ? data.logs : [];
        if (output) output.textContent = logs.join('\n\n') || 'No pipeline output returned.';
        const stageMap = {};
        (Array.isArray(data.stages) ? data.stages : []).forEach(stage => { stageMap[stage.name] = stage.status; });
        if (checks) checks.textContent = String(stageMap['Django System Check'] || 'unknown').toUpperCase();
        if (tests) tests.textContent = String(stageMap['Automated Tests'] || 'unknown').toUpperCase();
        if (readiness) readiness.textContent = `${data.readiness || 'UNKNOWN'} · No deployment performed`;
        if (status) status.textContent = `${data.project?.name || 'Selected project'}: ${String(data.status || 'unknown').toUpperCase()} · ${data.duration || ''}`;
      } catch (error) {
        if (status) status.textContent = 'Pipeline failed';
        if (output) output.textContent = error.message;
        if (tests) tests.textContent = 'ERROR';
        if (checks) checks.textContent = 'ERROR';
        if (readiness) readiness.textContent = 'NOT READY';
      } finally {
        button.disabled = false;
        button.textContent = 'Run Pipeline';
      }
    });
    loadProjects();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindPipeline);
  else bindPipeline();
})();

/* Account-scoped Notifications Feed */
async function loadNotifications() {
  const list = document.getElementById('notifications-list');
  const summary = document.getElementById('notifications-summary');
  if (!list) return;
  list.innerHTML = '<div class="nexus-card p-5 text-sm text-white/50">Loading notifications...</div>';
  try {
    const response = await fetch('/django-api/notifications/', { credentials: 'same-origin', headers: { Accept: 'application/json' }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.error || `HTTP ${response.status}`);
    const items = Array.isArray(data.notifications) ? data.notifications : [];
    if (summary) summary.textContent = `${data.unread_count || 0} unread · ${items.length} recent notifications`;
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<div class="nexus-card p-8 text-center text-sm text-white/45">No notifications yet. Pipeline results will appear here.</div>';
      return;
    }
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = `nexus-card p-4 flex items-start justify-between gap-4 ${item.read ? 'opacity-70' : 'border-[#C5A059]/40'}`;
      const left = document.createElement('div'); left.className = 'min-w-0';
      const title = document.createElement('div'); title.className = 'text-sm font-semibold text-white'; title.textContent = item.title;
      const message = document.createElement('p'); message.className = 'text-xs text-white/60 mt-1'; message.textContent = item.message;
      const date = document.createElement('p'); date.className = 'text-[10px] text-white/35 mt-2'; date.textContent = new Date(item.created_at).toLocaleString();
      left.append(title, message, date); card.appendChild(left);
      if (!item.read) {
        const button = document.createElement('button'); button.className = 'shrink-0 text-[11px] text-[#C5A059] hover:underline'; button.textContent = 'Mark read';
        button.addEventListener('click', async () => {
          try { const r = await djangoAuthRequest('/django-api/notifications/read/', { method: 'POST', body: JSON.stringify({ id: item.id }) }); if (!r.ok) throw new Error('Unable to update notification'); loadNotifications(); }
          catch (e) { if (summary) summary.textContent = e.message; }
        }); card.appendChild(button);
      } else { const badge = document.createElement('span'); badge.className = 'text-[10px] text-emerald-400 shrink-0'; badge.textContent = 'Read'; card.appendChild(badge); }
      list.appendChild(card);
    });
  } catch (error) {
    list.innerHTML = `<div class="nexus-card p-5 text-sm text-red-300">Unable to load notifications: ${String(error.message || error)}</div>`;
  }
}
function initNotifications() {
  const button = document.getElementById('notifications-mark-all');
  if (button) button.addEventListener('click', async () => {
    button.disabled = true;
    try { const response = await djangoAuthRequest('/django-api/notifications/read-all/', { method: 'POST', body: JSON.stringify({}) }); const data = await response.json().catch(() => ({})); if (!response.ok || !data.success) throw new Error(data.error || 'Unable to mark notifications as read'); await loadNotifications(); }
    catch (error) { const summary = document.getElementById('notifications-summary'); if (summary) summary.textContent = error.message; }
    finally { button.disabled = false; }
  });
}
