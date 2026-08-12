/* NexusAI Platform - Modular Vanilla JavaScript Interactive Controller */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSidebarToggle();
  initModals();
  initCommandPalette();
  initCopyButtons();
  initOrderEngineDemo();
  initCharts();
  initAuth();
  refreshExcelUsersTable();
});

/* Authentication Controller (Excel Persistence) */
function initAuth() {
  updateUserUI();

  // Login Form Handler
  const loginForm = document.getElementById('auth-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('btn-login-submit');

      if (!email || !password) {
        showToast('Fields Required', 'Please enter both email and password.', 'warning');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin"></i> Authenticating with users.xlsx...`;
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success && data.user) {
          localStorage.setItem('nexus_user', JSON.stringify(data.user));
          updateUserUI();
          showToast('Sign In Success', `Welcome back, ${data.user.name}! Credentials verified from users.xlsx.`, 'success');
          showView('dashboard');
          refreshExcelUsersTable();
        } else {
          showToast('Authentication Failed', data.error || 'Invalid credentials in users.xlsx database.', 'error');
        }
      } catch (err) {
        console.error('Login error:', err);
        showToast('Login Error', 'Unable to reach authentication server.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="bi bi-box-arrow-in-right text-base"></i><span>Sign In</span>`;
        }
      }
    });
  }

  // Signup Form Handler
  const signupForm = document.getElementById('auth-signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const role = document.getElementById('signup-role').value;
      const submitBtn = document.getElementById('btn-signup-submit');

      if (!name || !email || !password) {
        showToast('Missing Details', 'Name, email, and password are required.', 'warning');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin"></i> Appending to users.xlsx...`;
      }

      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (data.success && data.user) {
          localStorage.setItem('nexus_user', JSON.stringify(data.user));
          updateUserUI();
          showToast('Registration Complete', `Account created! Stored in users.xlsx Excel sheet.`, 'success');
          showView('dashboard');
          refreshExcelUsersTable();
        } else {
          showToast('Registration Failed', data.error || 'Could not save credentials to Excel file.', 'error');
        }
      } catch (err) {
        console.error('Signup error:', err);
        showToast('Signup Error', 'Failed to save account to users.xlsx.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="bi bi-file-earmark-plus text-base"></i><span>Sign Up & Store in Excel</span>`;
        }
      }
    });
  }
}

/* User Session & UI Helper */
function updateUserUI() {
  const saved = localStorage.getItem('nexus_user');
  let user = null;
  if (saved) {
    try { user = JSON.parse(saved); } catch (e) {}
  }

  if (!user) {
    // Default logged in user if not explicit logout
    user = {
      name: 'Alexandra Vance',
      email: 'lalantaaplog@gmail.com',
      role: 'Principal Architect'
    };
    localStorage.setItem('nexus_user', JSON.stringify(user));
  }

  const nameEl = document.getElementById('user-display-name');
  const emailEl = document.getElementById('user-display-email');
  const avatarEl = document.getElementById('user-avatar-badge');

  if (nameEl) nameEl.innerText = user.name;
  if (emailEl) emailEl.innerText = user.email;
  if (avatarEl) {
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AV';
    avatarEl.innerText = initials;
  }
}

/* Logout Handler */
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {}

  localStorage.removeItem('nexus_user');
  showToast('Logged Out', 'You have been logged out of your session.', 'success');

  // Update UI and switch to login view
  const nameEl = document.getElementById('user-display-name');
  const emailEl = document.getElementById('user-display-email');
  const avatarEl = document.getElementById('user-avatar-badge');

  if (nameEl) nameEl.innerText = 'Guest User';
  if (emailEl) emailEl.innerText = 'Not Signed In';
  if (avatarEl) avatarEl.innerText = '??';

  showView('login');
}

/* Fetch and Display Live Excel Database Records */
async function refreshExcelUsersTable() {
  const tbody = document.getElementById('excel-users-tbody');
  if (!tbody) return;

  try {
    const response = await fetch('/api/auth/excel-users');
    const data = await response.json();

    if (data.success && Array.isArray(data.users)) {
      if (data.users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-white/40 italic">No user records found in users.xlsx spreadsheet.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.users.map((u, idx) => `
        <tr class="hover:bg-white/5 transition-colors">
          <td class="py-3 px-4 text-white/40 font-mono">${idx + 1}</td>
          <td class="py-3 px-4 font-bold text-white flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-[#C5A059]"></span>
            <span>${u.Name}</span>
          </td>
          <td class="py-3 px-4 text-[#C5A059] font-mono">${u.Email}</td>
          <td class="py-3 px-4 text-emerald-400 font-mono">${u.PasswordMasked || '••••••••'}</td>
          <td class="py-3 px-4 font-mono text-white/70">${u.Role || 'Architect'}</td>
          <td class="py-3 px-4 text-white/40 text-[10px] font-mono">${u.SignedUpAt ? new Date(u.SignedUpAt).toLocaleString() : 'N/A'}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to fetch excel users:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-rose-400">Error loading users.xlsx spreadsheet data.</td></tr>`;
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
      }
    });
  });
}

function showView(viewName) {
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
