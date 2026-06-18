/* ============================================================
   STATE & CONSTANTS
   ============================================================ */
const API = (window.location.origin && (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') || window.location.origin.includes('192.168.')))
  ? window.location.origin
  : 'https://servemate.onrender.com';
const RAZORPAY_KEY = 'rzp_test_Smq8h0IFgOhCyb';

let authToken = localStorage.getItem('servemate_token') || '';
let ngoToken  = localStorage.getItem('servemate_ngo_token') || '';
let currentUser = null;
let currentNgo  = null;

let selectedCause = null;
let selectedAmount = 0;
let selectedCommunityId = null; // Associated community for donation

let causesData = [];
let communitiesData = [];
let ngosData = [];

/* ============================================================
   ROUTING MATRIX
   ============================================================ */
const routes = {
  '/': 'view-home',
  '/about': 'view-about',
  '/causes': 'view-causes',
  '/communities': 'view-communities',
  '/ngos': 'view-ngos',
  '/impact': 'view-impact',
  '/leaderboard': 'view-leaderboard',
  '/dashboard': 'view-dashboard',
  '/community-dashboard': 'view-community-dashboard',
  '/ngo-dashboard': 'view-ngo-dashboard',
  '/contact': 'view-contact',
  '/login': 'view-login',
  '/register': 'view-register',
  '/privacy': 'view-privacy',
  '/terms': 'view-terms',
  '/refund': 'view-refund',
  '/forgot-password': 'view-forgot-password'
};

function navigate(path, pushState = true) {
  let viewId = routes[path] || 'view-home';

  // Close mobile drawer if open
  const drawer = document.getElementById('mobileMenuDrawer');
  const btn = document.getElementById('mobileMenuToggle');
  if (drawer && drawer.classList.contains('active')) {
    drawer.classList.add('hidden');
    drawer.classList.remove('active');
    if (btn) btn.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Push browser history
  if (pushState) {
    history.pushState({ path }, '', path);
  }

  // Toggle visible sections
  document.querySelectorAll('.view-container').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update navbar links active styling
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
    else a.classList.remove('active');
  });

  // Load page-specific data
  triggerViewLoad(path);
}

// Global click interceptor for SPA links
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('/')) {
    e.preventDefault();
    const path = link.getAttribute('href');
    navigate(path);
  }
});

// Browser back/forward navigation
window.addEventListener('popstate', (e) => {
  const path = window.location.pathname;
  navigate(path, false);
});

// View Load Trigger Router
async function triggerViewLoad(path) {
  // Sync Nav visibility state
  updateNav();

  if (path === '/') {
    await fetchStats();
    await loadMockupData();
  } else if (path === '/causes') {
    await fetchCauses();
  } else if (path === '/communities') {
    await fetchCommunities();
  } else if (path === '/ngos') {
    await fetchNgos();
  } else if (path === '/impact') {
    await fetchTransparency();
  } else if (path === '/leaderboard') {
    await fetchLeaderboards();
  } else if (path === '/dashboard') {
    await loadUserDashboard();
  } else if (path === '/community-dashboard') {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) await loadCommunityDashboard(id);
    else navigate('/communities');
  } else if (path === '/ngo-dashboard') {
    await loadNgoDashboard();
  } else if (path === '/login' || path === '/register' || path === '/forgot-password') {
    if (authToken) navigate('/dashboard');
    else if (ngoToken) navigate('/ngo-dashboard');
  }
  
  // Re-run scroll animations
  initReveal();
}

/* ============================================================
   CORE API REQUEST WRAPPER
   ============================================================ */
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  else if (ngoToken) headers['Authorization'] = `Bearer ${ngoToken}`;
  const res = await fetch(API + path, { ...opts, headers });
  return res;
}

/* ============================================================
   TOAST SYSTEM
   ============================================================ */
function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span> ${message}`;
  const container = document.getElementById('toastContainer');
  if (container) {
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

/* ============================================================
   AUTHENTICATION LOGIC
   ============================================================ */
function updateNav() {
  const el = document.getElementById('navActions');
  const mobEl = document.getElementById('mobileDrawerActions');
  if (!el) return;

  let html = '';
  if (authToken && currentUser) {
    const lvl = currentUser.level || 1;
    const name = currentUser.name?.split(' ')[0] || 'User';
    html = `
      <span class="user-greeting">Hi, ${name}</span>
      <span class="level-badge" style="margin-left:6px;">⭐ Lv.${lvl}</span>
      <a href="/dashboard" class="btn btn-ghost" style="padding:8px 16px;font-size:0.85rem">Dashboard</a>
      <button class="btn btn-ghost" style="padding:8px 16px;font-size:0.85rem" onclick="logout()">Logout</button>
    `;
  } else if (ngoToken && currentNgo) {
    const name = currentNgo.name?.split(' ')[0] || 'NGO';
    html = `
      <span class="user-greeting">${name} Partner</span>
      <a href="/ngo-dashboard" class="btn btn-ghost" style="padding:8px 16px;font-size:0.85rem">Dashboard</a>
      <button class="btn btn-ghost" style="padding:8px 16px;font-size:0.85rem" onclick="logout()">Logout</button>
    `;
  } else {
    html = `
      <a href="/login" class="btn btn-ghost" style="padding:8px 18px;font-size:0.9rem">Login</a>
      <a href="/register" class="btn btn-primary" style="padding:8px 18px;font-size:0.9rem">Register</a>
    `;
  }

  el.innerHTML = html;
  if (mobEl) {
    mobEl.innerHTML = html;
  }
}

async function handleLogin(e, role) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('[type="email"]').value;
  const password = form.querySelector('[type="password"]').value;
  const errorEl = form.querySelector('.error-message');
  
  if (errorEl) errorEl.style.display = 'none';

  const path = role === 'ngo' ? '/api/auth/ngo/login' : '/api/auth/login';

  try {
    const res = await api(path, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Login failed');

    if (role === 'ngo') {
      ngoToken = data.token;
      currentNgo = data.ngo || data;
      localStorage.setItem('servemate_ngo_token', ngoToken);
      showToast(`Welcome back, ${currentNgo.name}! 🏢`);
      navigate('/ngo-dashboard');
    } else {
      authToken = data.token;
      currentUser = data.user || data;
      localStorage.setItem('servemate_token', authToken);
      showToast(`Welcome back, ${currentUser.name}! 🚀`);
      navigate('/dashboard');
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    } else {
      showToast(err.message, 'error');
    }
  }
}

async function handleRegister(e, role) {
  e.preventDefault();
  const form = e.target;
  const errorEl = form.querySelector('.error-message');
  if (errorEl) errorEl.style.display = 'none';

  try {
    if (role === 'ngo') {
      const payload = {
        name: form.querySelector('#rNgoName').value,
        email: form.querySelector('#rNgoEmail').value,
        password: form.querySelector('#rNgoPass').value,
        regNumber: form.querySelector('#rNgoReg').value,
        taxStatus: form.querySelector('#rNgoTax').value,
        areaOfWork: form.querySelector('#rNgoArea').value,
        location: form.querySelector('#rNgoLoc').value,
        description: form.querySelector('#rNgoDesc').value,
        otp: form.querySelector('#rNgoOtp').value
      };

      const res = await api('/api/auth/ngo/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'NGO registration failed');
      
      showToast('NGO verification application submitted successfully! 🏢', 'success');
      form.reset();
      navigate('/login');
    } else {
      const payload = {
        name: form.querySelector('#rUserName').value,
        email: form.querySelector('#rUserEmail').value,
        password: form.querySelector('#rUserPass').value,
        otp: form.querySelector('#rUserOtp').value
      };

      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'User registration failed');

      authToken = data.token;
      currentUser = data.user || data;
      localStorage.setItem('servemate_token', authToken);
      showToast(`Welcome to ServeMate, ${currentUser.name}! 🚀`);
      navigate('/dashboard');
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    } else {
      showToast(err.message, 'error');
    }
  }
}

async function sendRegistrationOtp(role) {
  const emailInput = role === 'ngo' ? document.getElementById('rNgoEmail') : document.getElementById('rUserEmail');
  const sendButton = role === 'ngo' ? document.getElementById('btnSendNgoOtp') : document.getElementById('btnSendUserOtp');
  const otpInput = role === 'ngo' ? document.getElementById('rNgoOtp') : document.getElementById('rUserOtp');
  const registerButton = role === 'ngo' ? document.getElementById('btnRegisterNgo') : document.getElementById('btnRegisterUser');

  if (!emailInput || !emailInput.value) {
    showToast('Please enter an email address first', 'error');
    return;
  }

  const email = emailInput.value.trim();

  // Simple email regex check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  sendButton.disabled = true;
  const originalText = sendButton.textContent;
  sendButton.textContent = 'Sending...';

  try {
    const res = await api('/api/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to send verification code');

    if (data.simulated) {
      showToast(`Verification code sent! (Simulated OTP: ${data.otp})`, 'success');
    } else {
      showToast('Verification code sent to your email!', 'success');
    }

    if (otpInput) otpInput.disabled = false;
    if (registerButton) registerButton.disabled = false;

    // Start countdown for resend
    let secondsLeft = 60;
    const interval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(interval);
        sendButton.disabled = false;
        sendButton.textContent = 'Send OTP';
      } else {
        sendButton.textContent = `Resend (${secondsLeft}s)`;
      }
    }, 1000);

  } catch (err) {
    showToast(err.message, 'error');
    sendButton.disabled = false;
    sendButton.textContent = originalText;
  }
}

async function sendForgotPasswordOtp() {
  const emailInput = document.getElementById('fpEmail');
  const sendButton = document.getElementById('btnSendFpOtp');
  const otpInput = document.getElementById('fpOtp');
  const newPassInput = document.getElementById('fpNewPass');
  const resetButton = document.getElementById('btnResetPassword');

  if (!emailInput || !emailInput.value) {
    showToast('Please enter your registered email address first', 'error');
    return;
  }

  const email = emailInput.value.trim();

  // Simple email regex check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  sendButton.disabled = true;
  const originalText = sendButton.textContent;
  sendButton.textContent = 'Sending...';

  try {
    const res = await api('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to send reset code');

    if (data.simulated) {
      showToast(`Reset code sent! (Simulated OTP: ${data.otp})`, 'success');
    } else {
      showToast('Reset code sent to your email!', 'success');
    }

    if (otpInput) otpInput.disabled = false;
    if (newPassInput) newPassInput.disabled = false;
    if (resetButton) resetButton.disabled = false;

    // Start countdown for resend
    let secondsLeft = 60;
    const interval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(interval);
        sendButton.disabled = false;
        sendButton.textContent = 'Send OTP';
      } else {
        sendButton.textContent = `Resend (${secondsLeft}s)`;
      }
    }, 1000);

  } catch (err) {
    showToast(err.message, 'error');
    sendButton.disabled = false;
    sendButton.textContent = originalText;
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const form = e.target;
  const errorEl = form.querySelector('.error-message');
  if (errorEl) errorEl.style.display = 'none';

  try {
    const payload = {
      email: form.querySelector('#fpEmail').value,
      otp: form.querySelector('#fpOtp').value,
      newPassword: form.querySelector('#fpNewPass').value
    };

    const res = await api('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Reset password failed');

    showToast('Password reset successful! Please log in.', 'success');
    form.reset();
    navigate('/login');
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    } else {
      showToast(err.message, 'error');
    }
  }
}

function logout() {
  authToken = '';
  ngoToken = '';
  currentUser = null;
  currentNgo = null;
  localStorage.removeItem('servemate_token');
  localStorage.removeItem('servemate_ngo_token');
  showToast('Logged out successfully.', 'info');
  navigate('/');
}

async function restoreSession() {
  if (authToken) {
    try {
      const res = await api('/api/auth/me');
      if (res.ok) currentUser = await res.json();
      else {
        authToken = '';
        localStorage.removeItem('servemate_token');
      }
    } catch {
      authToken = '';
    }
  } else if (ngoToken) {
    try {
      const res = await api('/api/ngo/me');
      if (res.ok) {
        const data = await res.json();
        currentNgo = data.ngo;
      } else {
        ngoToken = '';
        localStorage.removeItem('servemate_ngo_token');
      }
    } catch {
      ngoToken = '';
    }
  }
  updateNav();
}

/* ============================================================
   STATS & INTERACTIVE MOCKUP
   ============================================================ */
async function fetchStats() {
  try {
    const res = await api('/api/stats');
    if (!res.ok) return;
    const d = await res.json();
    
    const elements = {
      statDonated: '₹' + (d.totalDonated || 0).toLocaleString('en-IN'),
      statTasks: d.verifiedTasks || 0,
      statNgos: d.verifiedNGOs || 0
    };
    
    Object.keys(elements).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = elements[id];
    });
  } catch (e) {
    console.warn('Stats fetch failed', e);
  }
}

async function loadMockupData() {
  try {
    const res = await api('/api/stats');
    if (!res.ok) return;
    const d = await res.json();
    
    const vDonated = document.getElementById('mockupDonated');
    const vNGOs = document.getElementById('mockupNGOs');
    const vDeliveries = document.getElementById('mockupDeliveries');
    
    if (vDonated) vDonated.textContent = '₹' + (d.totalDonated || 0).toLocaleString('en-IN');
    if (vNGOs) vNGOs.textContent = d.verifiedNGOs || 0;
    if (vDeliveries) vDeliveries.textContent = d.verifiedTasks || 0;
  } catch (err) {}
}

/* ============================================================
   CAUSES PAGE RENDER & ACTION
   ============================================================ */
const causeEmojis = {
  education: '📚', healthcare: '🏥', food: '🍲', environment: '🌳',
  'animal-welfare': '🐾', 'disaster-relief': '🚨', 'women-empowerment': '👩', children: '👶', default: '💝'
};
const causeTags = {
  education: 'tag-teal', healthcare: 'tag-orange', food: 'tag-orange', environment: 'tag-green',
  'animal-welfare': 'tag-blue', 'disaster-relief': 'tag-teal', 'women-empowerment': 'tag-purple', children: 'tag-purple', default: 'tag-blue'
};
const causeImages = {
  education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80',
  healthcare: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80',
  food: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80',
  environment: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
  'animal-welfare': 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&auto=format&fit=crop&q=80',
  'disaster-relief': 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80',
  'women-empowerment': 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=600&auto=format&fit=crop&q=80',
  children: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80'
};

async function fetchCauses() {
  try {
    const res = await api('/api/causes');
    if (!res.ok) throw new Error('Causes fetch failed');
    causesData = await res.json();
    renderCauses('all');
  } catch (err) {
    console.error(err);
  }
}

function renderCauses(filter) {
  const container = document.getElementById('causesContainer');
  if (!container) return;

  const filtered = filter === 'all' ? causesData : causesData.filter(c => c.category === filter);

  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><span class="empty-icon">📭</span><p>No verified causes found for this category.</p></div>';
    return;
  }

  container.innerHTML = filtered.map((c, i) => {
    const emoji = causeEmojis[c.category] || causeEmojis.default;
    const tagClass = causeTags[c.category] || causeTags.default;
    const raised = c.raised || 0;
    const goal = c.goal || 50000;
    const pct = Math.min((raised / goal) * 100, 100).toFixed(1);
    const image = c.image || causeImages[c.category] || causeImages.default;
    const ngoName = c.assignedNgo?.name || 'Assigned Verified NGO';
    const contributors = c.contributors || 0;
    
    return `
      <div class="glass cause-card reveal" style="transition-delay: ${i * 0.05}s">
        <div class="cause-image-wrap">
          <img src="${image}" alt="${esc(c.title)}" />
          <div class="cause-gradient-overlay"></div>
          <span class="cause-emoji-badge">${emoji}</span>
        </div>
        <div class="cause-body">
          <div class="cause-meta-row">
            <h3 class="cause-title">${esc(c.title)}</h3>
            <span class="tag ${tagClass}">${esc(c.category)}</span>
          </div>
          <p class="cause-desc">${esc(c.description)}</p>
          <div style="font-size: 0.78rem; color: var(--text3); margin-bottom: 12px; font-weight: 600;">🏢 NGO: ${esc(ngoName)}</div>
          
          <div class="progress-wrap">
            <div class="progress-label">
              <span>₹${raised.toLocaleString('en-IN')} raised</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${pct}%"></div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem; color: var(--text2); margin-bottom: 12px; border-top: 1px solid var(--border); padding-top: 12px;">
            <div>👥 <strong>${contributors.toLocaleString('en-IN')}</strong> donors</div>
            <div style="text-align: right;">🎯 Goal: <strong>₹${goal.toLocaleString('en-IN')}</strong></div>
          </div>

          <div style="font-size: 0.78rem; color: var(--green); background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 8px 12px; margin-bottom: 16px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <span>📈</span>
            <span>${esc(c.impactPerRupee)}</span>
          </div>

          <div class="xp-badge" style="margin-bottom: 16px;">⚡ +${c.xp || 50} XP per Donation</div>

          <div class="cause-actions" style="margin-top: auto; display: flex; flex-direction: column; gap: 8px;">
            <button class="btn btn-donate" style="width: 100%; border-radius: var(--radius-sm); margin: 0; padding: 12px;" onclick="openDonationModal('${c._id}')">Donate</button>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button class="btn btn-outline" style="font-size: 0.78rem; padding: 10px 8px; border-radius: var(--radius-sm); justify-content: center;" onclick="navigate('/impact')">View Impact</button>
              <button class="btn btn-outline" style="font-size: 0.78rem; padding: 10px 8px; border-radius: var(--radius-sm); justify-content: center;" onclick="openNgoProfileModal('${c.assignedNgo?._id || c.assignedNgo}')">View NGO</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  initReveal();
}

function filterCauses(category, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCauses(category);
}

/* ============================================================
   COMMUNITIES PAGE RENDER & ACTIONS
   ============================================================ */
async function fetchCommunities() {
  try {
    const res = await api('/api/communities');
    if (!res.ok) throw new Error('Communities fetch failed');
    communitiesData = await res.json();
    renderCommunities();
  } catch (err) {
    console.error(err);
  }
}

function renderCommunities() {
  const container = document.getElementById('communitiesContainer');
  if (!container) return;

  let html = `
    <div class="create-community-box" onclick="openModal('createCommunityModal')">
      <span class="create-community-icon">➕</span>
      <h3>Create Community</h3>
      <p>Mobilize your friends or club into action</p>
    </div>
  `;

  if (communitiesData.length > 0) {
    html += communitiesData.map((c, i) => {
      const logo = c.logo || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150&auto=format&fit=crop&q=80';
      return `
        <div class="glass ngo-card reveal" style="transition-delay: ${i * 0.05}s">
          <div class="ngo-card-header">
            <div class="ngo-logo-circle" style="background: url('${logo}') center/cover no-repeat;"></div>
            <div class="ngo-info-col">
              <h3>${esc(c.name)}</h3>
              <div class="location">Category: ${esc(c.category)}</div>
            </div>
          </div>
          <p style="font-size: 0.85rem; color: var(--text2); line-height: 1.5; height: 4.5em; overflow: hidden;">${esc(c.description)}</p>
          <div class="ngo-stats-row">
            <div class="ngo-stat-col">
              <div class="ngo-stat-value">${c.members?.length || 0}</div>
              <div class="ngo-stat-label">Members</div>
            </div>
            <div class="ngo-stat-col">
              <div class="ngo-stat-value">₹${(c.totalRaised || 0).toLocaleString('en-IN')}</div>
              <div class="ngo-stat-label">Raised</div>
            </div>
            <div class="ngo-stat-col">
              <div class="ngo-stat-value">${c.impactScore || 0}</div>
              <div class="ngo-stat-label">Impact</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="/community-dashboard?id=${c._id}" class="btn btn-outline btn-full">View Group</a>
            <button class="btn btn-primary" onclick="joinCommunity('${c._id}')">Join</button>
          </div>
        </div>
      `;
    }).join('');
  }

  container.innerHTML = html;
  initReveal();
}

async function joinCommunity(communityId) {
  if (!authToken) {
    showToast('Please login first to join communities 🙏', 'info');
    navigate('/login');
    return;
  }
  try {
    const res = await api('/api/communities/join', {
      method: 'POST',
      body: JSON.stringify({ communityId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join');
    showToast('Successfully joined community! 🤝', 'success');
    await fetchCommunities();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function joinCommunityByCode(e) {
  e.preventDefault();
  if (!authToken) {
    showToast('Please login first to join communities 🙏', 'info');
    navigate('/login');
    return;
  }
  const code = document.getElementById('communityCodeInput').value;
  try {
    const res = await api('/api/communities/join', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join');
    showToast('Successfully joined community! 🤝', 'success');
    document.getElementById('communityCodeInput').value = '';
    await fetchCommunities();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function createCommunity(e) {
  e.preventDefault();
  if (!authToken) {
    showToast('Please login first to create communities 🙏', 'info');
    navigate('/login');
    return;
  }
  const payload = {
    name: document.getElementById('cName').value,
    description: document.getElementById('cDesc').value,
    category: document.getElementById('cCategory').value,
    logo: document.getElementById('cLogo').value
  };

  try {
    const res = await api('/api/communities', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create community');

    showToast('Community created successfully! 🚀', 'success');
    closeModal('createCommunityModal');
    e.target.reset();
    await fetchCommunities();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function searchCommunities(query) {
  try {
    const res = await api(`/api/communities?search=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    communitiesData = await res.json();
    renderCommunities();
  } catch (err) {
    console.error(err);
  }
}

/* ============================================================
   COMMUNITY DASHBOARD PAGE
   ============================================================ */
async function loadCommunityDashboard(communityId) {
  try {
    const res = await api(`/api/communities/${communityId}`);
    if (!res.ok) throw new Error('Failed to load community dashboard');
    const data = await res.json();
    const c = data.community;

    document.getElementById('cdLogo').style.backgroundImage = `url('${c.logo || "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150&auto=format&fit=crop&q=80"}')`;
    document.getElementById('cdName').textContent = c.name;
    document.getElementById('cdDesc').textContent = c.description;
    document.getElementById('cdCode').textContent = c.code;
    document.getElementById('cdCreator').textContent = c.creator?.name || 'Anonymous';
    document.getElementById('cdMemberCount').textContent = c.members?.length || 0;
    document.getElementById('cdRaised').textContent = '₹' + (c.totalRaised || 0).toLocaleString('en-IN');
    document.getElementById('cdRank').textContent = '#' + (data.rank || '-');
    document.getElementById('cdImpact').textContent = c.impactScore || 0;

    // Attribute active community to donation
    document.getElementById('cdDonateBtn').onclick = () => {
      selectedCommunityId = c._id;
      // Auto open causes page
      navigate('/causes');
      showToast(`Donating as part of community: ${c.name} 🤝`, 'info');
    };

    // Roster Members
    const membersEl = document.getElementById('cdMembersList');
    if (membersEl) {
      if (c.members?.length > 0) {
        membersEl.innerHTML = c.members.map(m => `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
            <div style="width:34px;height:34px;border-radius:50%;background:var(--surface);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">${initials(m.name)}</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:0.85rem;">${esc(m.name)}</div>
              <div style="font-size:0.72rem;color:var(--text3);">${esc(m.title || 'Supporter')} · Lvl ${m.level || 1}</div>
            </div>
            <div style="font-family:'Space Grotesk',sans-serif;font-size:0.85rem;font-weight:600;">${m.xp || 0} XP</div>
          </div>
        `).join('');
      } else {
        membersEl.innerHTML = '<div style="font-size:0.85rem;color:var(--text3);text-align:center;">No members yet.</div>';
      }
    }

    // Supported NGOs
    const ngosEl = document.getElementById('cdNgosList');
    if (ngosEl) {
      if (c.supportedNgos?.length > 0) {
        ngosEl.innerHTML = c.supportedNgos.map(n => `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0;">
            <div style="width:34px;height:34px;border-radius:6px;background:var(--surface);display:flex;align-items:center;justify-content:center;font-size:0.85rem;">🏢</div>
            <div>
              <div style="font-weight:600;font-size:0.85rem;">${esc(n.name)}</div>
              <div style="font-size:0.72rem;color:var(--text3);">${esc(n.areaOfWork || 'Verified NGO')} · ${esc(n.location)}</div>
            </div>
          </div>
        `).join('');
      } else {
        ngosEl.innerHTML = '<div style="font-size:0.85rem;color:var(--text3);text-align:center;">No supported NGOs yet. Donated funds will route here.</div>';
      }
    }

    // Recent Activity
    const activityEl = document.getElementById('cdActivityList');
    if (activityEl) {
      if (data.activity?.length > 0) {
        activityEl.innerHTML = data.activity.map(a => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
            <div>
              <div style="font-weight:600;font-size:0.85rem;">${esc(a.user?.name || 'Anonymous')}</div>
              <div style="font-size:0.75rem;color:var(--text3);">${a.cause?.icon || '📂'} ${esc(a.cause?.title)}</div>
            </div>
            <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:var(--green);font-size:0.85rem;">+₹${(a.amount||0).toLocaleString('en-IN')}</div>
          </div>
        `).join('');
      } else {
        activityEl.innerHTML = '<div style="font-size:0.85rem;color:var(--text3);text-align:center;">No recent transactions.</div>';
      }
    }

    // Verification videos
    const videosEl = document.getElementById('cdVideosGrid');
    if (videosEl) {
      if (data.verificationVideos?.length > 0) {
        videosEl.innerHTML = data.verificationVideos.map(v => `
          <div class="glass proof-card">
            <div class="proof-card-header">
              <span class="verified-badge">✓ Verified Impact</span>
              <div class="proof-amount grad-text">₹${v.amount.toLocaleString('en-IN')}</div>
            </div>
            <div class="proof-cause">🏢 NGO: ${esc(v.ngo?.name)}</div>
            <p class="proof-desc" style="font-size:0.8rem;margin:8px 0;">${esc(v.proofNote || 'Impact proof validated by administrator.')}</p>
            <a href="${esc(v.proofVideo)}" target="_blank" class="btn btn-outline btn-sm" style="font-size:0.75rem;padding:6px 12px;justify-content:center;">▶ Watch Proof Video</a>
          </div>
        `).join('');
      } else {
        videosEl.innerHTML = '<div class="empty-panel" style="grid-column: 1/-1;"><span class="empty-icon" style="font-size:1.5rem">📦</span><p style="font-size:0.8rem">No verified delivery proof videos uploaded for this community yet.</p></div>';
      }
    }

  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ============================================================
   NGO DIRECTORY
   ============================================================ */
async function fetchNgos() {
  try {
    const res = await api('/api/ngos');
    if (!res.ok) throw new Error('NGO fetch failed');
    ngosData = await res.json();
    renderNgos();
  } catch (err) {
    console.error(err);
  }
}

function renderNgos() {
  const container = document.getElementById('ngosContainer');
  if (!container) return;

  if (!ngosData.length) {
    container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><span class="empty-icon">🏢</span><p>No verified NGO partners are currently active.</p></div>';
    return;
  }

  container.innerHTML = ngosData.map((ngo, i) => {
    const logo = ngo.logo || 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=150&auto=format&fit=crop&q=80';
    const trustScore = ngo.rating ? Math.round(ngo.rating * 20) : 95; // Fake rating mapping to trust score
    
    return `
      <div class="glass ngo-card reveal" style="transition-delay: ${i * 0.05}s">
        <span class="ngo-trust-badge">⭐ Trust: ${trustScore}%</span>
        <div class="ngo-card-header">
          <div class="ngo-logo-circle" style="background: url('${logo}') center/cover no-repeat;"></div>
          <div class="ngo-info-col">
            <h3>${esc(ngo.name)} <span class="verified-badge" style="font-size:0.65rem;padding:1px 6px;">✓ Verified</span></h3>
            <div class="location">📍 ${esc(ngo.location || 'India')}</div>
          </div>
        </div>
        <p style="font-size: 0.85rem; color: var(--text2); line-height: 1.5; height: 3em; overflow: hidden; margin-bottom:12px;">${esc(ngo.about || ngo.description || 'Verified organization support')}</p>
        <div style="font-size:0.8rem; color:var(--text3); font-weight:600;">Area: ${esc(ngo.areaOfWork)}</div>
        <div class="ngo-stats-row" style="margin: 12px 0;">
          <div class="ngo-stat-col">
            <div class="ngo-stat-value">${ngo.impactScore || 0}</div>
            <div class="ngo-stat-label">Impact Score</div>
          </div>
          <div class="ngo-stat-col">
            <div class="ngo-stat-value">${ngo.tasksCompleted || 0}</div>
            <div class="ngo-stat-label">Tasks Done</div>
          </div>
          <div class="ngo-stat-col">
            <div class="ngo-stat-value">${ngo.volunteerCount || 0}</div>
            <div class="ngo-stat-label">Volunteers</div>
          </div>
        </div>
        <button class="btn btn-outline btn-full" onclick="openNgoProfileModal('${ngo._id}')">View NGO Profile</button>
      </div>
    `;
  }).join('');
  initReveal();
}

async function openNgoProfileModal(id) {
  try {
    const res = await api(`/api/ngos/${id}`);
    if (!res.ok) throw new Error('Failed to load NGO profile');
    const data = await res.json();
    const ngo = data.ngo;
    
    document.getElementById('npmIcon').textContent = initials(ngo.name);
    document.getElementById('npmName').innerHTML = `${esc(ngo.name)} <span class="verified-badge">✓ Verified Partner</span>`;
    document.getElementById('npmLoc').textContent = ngo.location || 'India';
    document.getElementById('npmMotive').textContent = ngo.about || ngo.description || 'Verified community support.';
    document.getElementById('npmArea').textContent = ngo.areaOfWork;
    document.getElementById('npmReg').textContent = ngo.regNumber;
    document.getElementById('npmTax').textContent = ngo.taxStatus;
    
    const countEl = document.getElementById('npmVolCount');
    if (countEl) countEl.textContent = ngo.volunteerCount || 0;

    // Apply button for volunteer request
    const applyBtn = document.getElementById('npmVolApplyBtn');
    if (applyBtn) {
      applyBtn.onclick = async () => {
        if (!authToken) {
          showToast('Please login first to volunteer 🙏', 'info');
          navigate('/login');
          closeModal('ngoProfileModal');
          return;
        }
        const phone = prompt("Enter your contact number to apply:");
        if (!phone) return;
        try {
          const vRes = await api(`/api/ngos/${ngo._id}/volunteers`, {
            method: 'POST',
            body: JSON.stringify({ phone })
          });
          const vData = await vRes.json();
          if (!vRes.ok) throw new Error(vData.error || 'Request failed');
          showToast('Volunteer request submitted successfully! 🤝', 'success');
        } catch (vErr) {
          showToast(vErr.message, 'error');
        }
      };
    }

    // Supported Communities list
    const commsEl = document.getElementById('npmCommunities');
    if (commsEl) {
      // Find communities supporting this NGO
      const cRes = await api('/api/communities');
      const allComms = cRes.ok ? await cRes.json() : [];
      const supporting = allComms.filter(c => c.supportedNgos?.some(sId => String(sId) === String(ngo._id)));
      if (supporting.length > 0) {
        commsEl.innerHTML = supporting.map(c => `<span class="badge-pill">${esc(c.name)}</span>`).join('');
      } else {
        commsEl.innerHTML = '<div style="font-size:0.8rem;color:var(--text3);">No attributed communities yet.</div>';
      }
    }

    // Gallery list
    const galleryEl = document.getElementById('npmGallery');
    if (galleryEl) {
      galleryEl.innerHTML = `<img src="${ngo.logo || 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=300&auto=format&fit=crop&q=80'}" style="width:100%;height:140px;object-fit:cover;border-radius:10px;" />`;
    }

    // NGO verification videos list
    const videosEl = document.getElementById('npmVideos');
    if (videosEl) {
      if (data.recentWork?.length > 0) {
        videosEl.innerHTML = data.recentWork.map(v => `
          <div class="glass proof-card" style="padding:16px;margin-bottom:12px;">
            <div style="font-weight:600;font-size:0.85rem;margin-bottom:4px;">${esc(v.description || 'Verified work update')}</div>
            <div style="font-size:0.75rem;color:var(--text3);margin-bottom:8px;">Amount utilized: ₹${v.amount?.toLocaleString('en-IN')}</div>
            ${v.proofVideo ? `<a href="${esc(v.proofVideo)}" target="_blank" style="font-size:0.75rem;color:var(--blue);font-weight:700;text-decoration:none;">▶ Watch Video Proof</a>` : ''}
          </div>
        `).join('');
      } else {
        videosEl.innerHTML = '<div style="font-size:0.8rem;color:var(--text3);text-align:center;">No recent verification videos.</div>';
      }
    }

    openModal('ngoProfileModal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ============================================================
   IMPACT CENTER PAGE
   ============================================================ */
async function fetchTransparency() {
  const container = document.getElementById('impactContainer');
  if (!container) return;

  try {
    const res = await api('/api/transparency');
    if (!res.ok) throw new Error('Impact fetch failed');
    const data = await res.json();
    const logs = Array.isArray(data) ? data : (data.logs || []);

    if (!logs.length) {
      container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><span class="empty-icon">🌱</span><p>No verified deliveries recorded yet.</p></div>';
      return;
    }

    container.innerHTML = logs.map((log, i) => {
      const date = log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-IN') : 'Verified';
      const ngoName = log.ngo?.name || 'Verified NGO';
      const causeTitle = log.cause?.title || 'Cause';
      const amount = log.amount || 0;
      
      // Attempt to extract YouTube video ID to render iframe or premium thumbnail
      let videoId = '';
      if (log.proofVideo) {
        const match = log.proofVideo.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (match && match[1]) videoId = match[1];
      }
      
      const videoHtml = videoId
        ? `
          <div class="proof-video-wrap">
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        `
        : log.proofVideo 
          ? `<a href="${esc(log.proofVideo)}" target="_blank" class="btn btn-outline btn-full" style="margin: 12px 0;">▶ Watch proof video link</a>` 
          : '<div style="font-size:0.8rem;color:var(--text3);margin:12px 0;">Proof verification pending</div>';

      return `
        <div class="glass proof-card reveal" style="transition-delay: ${i * 0.05}s">
          <div class="proof-card-header">
            <div class="proof-ngo">
              <div class="proof-ngo-name">${esc(ngoName)}</div>
              <span class="verified-badge">✓ Verified</span>
            </div>
            <div class="proof-amount grad-text">₹${amount.toLocaleString('en-IN')}</div>
          </div>
          <div class="proof-cause">📂 Cause: ${esc(causeTitle)}</div>
          <div style="font-size:0.75rem;color:var(--text3);">📍 Location: ${esc(log.location || 'Verified delivery location')}</div>
          <p class="proof-desc" style="margin-top:10px;">${esc(log.description)}</p>
          ${videoHtml}
          <div style="font-size:0.72rem;color:var(--text3);text-align:right;">Verified on: ${date}</div>
        </div>
      `;
    }).join('');
    initReveal();
  } catch (err) {
    console.error(err);
  }
}

/* ============================================================
   LEADERBOARD PAGE
   ============================================================ */
let lbTab = 'communities';

async function fetchLeaderboards() {
  await renderLeaderboardTab();
}

function switchLeaderboardTab(tab, btn) {
  lbTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLeaderboardTab();
}

async function renderLeaderboardTab() {
  const container = document.getElementById('leaderboardListContainer');
  if (!container) return;

  container.innerHTML = '<div class="empty-state"><span class="empty-icon">⏳</span><p>Loading leaderboard rankings…</p></div>';

  try {
    const path = lbTab === 'communities' ? '/api/leaderboard/communities' : '/api/leaderboard/donors';
    const res = await api(path);
    if (!res.ok) throw new Error('Failed to fetch leaderboard data');
    const data = await res.json();

    if (!data.length) {
      container.innerHTML = '<div class="empty-state"><span class="empty-icon">📊</span><p>No community activities recorded yet.</p></div>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const colors = [
      'linear-gradient(135deg,#2563EB,#7C3AED)',
      'linear-gradient(135deg,#10B981,#06B6D4)',
      'linear-gradient(135deg,#F97316,#EF4444)',
      'linear-gradient(135deg,#F59E0B,#F97316)',
      'linear-gradient(135deg,#8B5CF6,#EC4899)'
    ];

    container.innerHTML = `
      <div class="leaderboard-list">
        ${data.map((item, i) => {
          const rank = i + 1;
          const medal = medals[i] || `#${rank}`;
          const grad = colors[i % colors.length];
          const initial = initials(item.name);
          const detailUrl = lbTab === 'communities' ? `/community-dashboard?id=${item._id}` : '/dashboard';

          if (lbTab === 'communities') {
            return `
              <div class="glass leader-card reveal ${rank <= 3 ? 'rank-' + rank : ''}" style="transition-delay: ${i * 0.04}s">
                <div class="leader-rank">${medal}</div>
                <div class="leader-avatar-circle" style="background:${grad}">${initial}</div>
                <div class="leader-details">
                  <div class="leader-name-row">
                    <a href="${detailUrl}" style="font-weight:700;" class="leader-name">${esc(item.name)}</a>
                    <span class="tag tag-blue" style="font-size:0.65rem;padding:2px 8px;">${esc(item.category)}</span>
                  </div>
                  <div class="leader-sub">${item.members?.length || 0} members · supported NGOs</div>
                </div>
                <div style="text-align:right;">
                  <div class="leader-score grad-text">₹${(item.totalRaised || 0).toLocaleString('en-IN')}</div>
                  <div style="font-size:0.75rem;color:var(--text3);">Score: ${item.impactScore || 0}</div>
                </div>
              </div>
            `;
          } else {
            const level = item.level || 1;
            const title = item.title || 'Supporter';
            const donated = item.totalDonated || 0;
            return `
              <div class="glass leader-card reveal ${rank <= 3 ? 'rank-' + rank : ''}" style="transition-delay: ${i * 0.04}s">
                <div class="leader-rank">${medal}</div>
                <div class="leader-avatar-circle" style="background:${grad}">${initial}</div>
                <div class="leader-details">
                  <div class="leader-name-row">
                    <span class="leader-name">${esc(item.name)}</span>
                    <span class="level-badge" style="font-size:0.65rem;padding:2px 8px;">⭐ Lv.${level}</span>
                  </div>
                  <div class="leader-sub">${esc(title)} · ${item.donationCount || 0} donations</div>
                </div>
                <div style="text-align:right;">
                  <div class="leader-score grad-text">₹${donated.toLocaleString('en-IN')}</div>
                  <div style="font-size:0.75rem;color:var(--text3);">${item.xp || 0} XP</div>
                </div>
              </div>
            `;
          }
        }).join('')}
      </div>
    `;
    initReveal();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">❌</span><p>${err.message}</p></div>`;
  }
}

/* ============================================================
   USER DASHBOARD PAGE
   ============================================================ */
let activeDashboardTab = 'overview';

function switchDashboardTab(tab, btn) {
  activeDashboardTab = tab;
  document.querySelectorAll('.dashboard-menu-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  // Show active sub-panel
  document.querySelectorAll('.dashboard-sub-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById(`dpanel-${tab}`).classList.remove('hidden');

  if (tab === 'badges') {
    renderUserBadges();
  } else if (tab === 'gamification') {
    renderGamificationProgression();
  } else if (tab === 'ai-advisor') {
    loadAiRecommendations();
  }
}

async function loadUserDashboard() {
  if (!authToken) {
    showToast('Please login first to access the User Dashboard 🙏', 'info');
    navigate('/login');
    return;
  }

  try {
    const res = await api('/api/dashboard');
    if (!res.ok) throw new Error('Failed to load dashboard data');
    const data = await res.json();
    currentUser = data.user;

    // Sidebar Avatar Block
    const initial = initials(currentUser.name);
    document.getElementById('dbAvatar').textContent = initial;
    document.getElementById('dbName').textContent = currentUser.name;
    document.getElementById('dbEmail').textContent = currentUser.email;
    document.getElementById('dbLevelPill').textContent = `Level ${currentUser.level || 1} - ${currentUser.title || 'Supporter'}`;

    // Overview Stats
    document.getElementById('dbStatDonated').textContent = '₹' + (currentUser.totalDonated || 0).toLocaleString('en-IN');
    document.getElementById('dbStatXP').textContent = (currentUser.xp || 0).toLocaleString('en-IN') + ' XP';
    document.getElementById('dbStatCount').textContent = currentUser.donationCount || 0;

    // Overview progress bar
    const prog = data.progression || {};
    const nextLevel = (currentUser.level || 1) + 1;
    const progressPct = prog.progress || 0;
    
    document.getElementById('dbLevelLabel').textContent = `Lvl ${currentUser.level || 1} ➔ Lvl ${nextLevel}`;
    document.getElementById('dbXPProgressText').textContent = `${(currentUser.xp || 0).toLocaleString('en-IN')} / ${(prog.nextLevelXp || 1000).toLocaleString('en-IN')} XP`;
    document.getElementById('dbXPProgressBar').style.width = `${progressPct}%`;
    document.getElementById('dbXPRemainingText').textContent = `${(prog.xpRemaining || 0).toLocaleString('en-IN')} XP remaining to level up`;

    // Attributed Communities Roster
    const commsEl = document.getElementById('dbCommunitiesJoined');
    if (commsEl) {
      if (currentUser.communities?.length > 0) {
        // Fetch community details to show names
        const cRes = await api('/api/communities');
        const allComms = cRes.ok ? await cRes.json() : [];
        const joined = allComms.filter(c => currentUser.communities.includes(c._id));
        
        commsEl.innerHTML = joined.map(c => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:10px;background:var(--surface);border:1px solid var(--border);margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:34px;height:34px;border-radius:6px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:0.9rem;">🤝</div>
              <div>
                <a href="/community-dashboard?id=${c._id}" style="font-weight:700;font-size:0.88rem;text-decoration:none;">${esc(c.name)}</a>
                <div style="font-size:0.72rem;color:var(--text3);">${c.members?.length || 0} members · code: ${c.code}</div>
              </div>
            </div>
            <div style="font-family:'Space Grotesk',sans-serif;font-size:0.85rem;font-weight:700;">₹${(c.totalRaised||0).toLocaleString('en-IN')}</div>
          </div>
        `).join('');
      } else {
        commsEl.innerHTML = '<div class="empty-panel"><p style="font-size:0.82rem;">You haven\'t joined any communities yet. Join or create a group to start community contributions.</p></div>';
      }
    }

    // Donation History Table
    const tbody = document.getElementById('dbHistoryTableBody');
    if (tbody) {
      const donations = data.recentDonations || [];
      if (donations.length > 0) {
        tbody.innerHTML = donations.map(d => {
          const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : '-';
          const statusClass = d.status === 'verified' ? 'tag-green' : d.status === 'completed' ? 'tag-blue' : 'tag-orange';
          const proofBtn = d.proofVideo 
            ? `<a href="${esc(d.proofVideo)}" target="_blank" class="btn btn-outline" style="padding:4px 10px;font-size:0.75rem;border-radius:4px;">Watch Proof</a>` 
            : `<span style="color:var(--text3);font-size:0.75rem;">Awaiting proof</span>`;
            
          return `
            <tr>
              <td style="font-weight:600;">${d.cause?.icon || '📂'} ${esc(d.cause?.title)}</td>
              <td style="font-family:'Space Grotesk',sans-serif;font-weight:700;">₹${(d.amount||0).toLocaleString('en-IN')}</td>
              <td style="color:var(--text3);font-size:0.82rem;">${date}</td>
              <td style="font-size:0.85rem;">${esc(d.ngo?.name || 'Pending assignment')}</td>
              <td style="font-size:0.82rem;color:var(--text3);">${esc(d.ngo?.location || 'India')}</td>
              <td>${proofBtn}</td>
              <td><span class="tag ${statusClass}" style="padding:2px 8px;font-size:0.7rem;">${esc(d.status)}</span></td>
            </tr>
          `;
        }).join('');
      } else {
        tbody.innerHTML = `<tr><td colspan="7" style="padding:28px 14px;"><div class="empty-panel"><p style="font-size:0.85rem;text-align:center;">No donation history yet. Supporting a cause will unlock logs.</p></div></td></tr>`;
      }
    }

    // Load Overview activity feeds
    const actFeed = document.getElementById('dbOverviewActivity');
    if (actFeed) {
      const donations = data.recentDonations || [];
      if (donations.length > 0) {
        actFeed.innerHTML = donations.slice(0, 3).map(d => `
          <div style="display:flex;align-items:center;gap:12px;font-size:0.85rem;padding:8px 0;border-bottom:1px solid var(--border);">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(37,99,235,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${d.cause?.icon || '📂'}</div>
            <div style="flex:1;">
              <div style="font-weight:700;">Contributed to ${esc(d.cause?.title)}</div>
              <div style="font-size:0.75rem;color:var(--text3);">${d.ngo?.name || 'NGO'} · ${d.status}</div>
            </div>
            <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:var(--green);">+₹${(d.amount||0).toLocaleString('en-IN')}</div>
          </div>
        `).join('');
      } else {
        actFeed.innerHTML = '<div style="font-size:0.8rem;color:var(--text3);text-align:center;">No recent actions.</div>';
      }
    }

  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderUserBadges() {
  const container = document.getElementById('dbBadgesGrid');
  if (!container) return;
  const badges = currentUser.badges || [];
  if (badges.length > 0) {
    container.innerHTML = badges.map(b => `
      <div class="badge-item earned" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;min-width:110px;">
        <div class="b-icon" style="font-size:2rem;margin-bottom:8px;">🏆</div>
        <div class="b-name" style="font-weight:700;font-size:0.8rem;">${esc(b)}</div>
        <div style="font-size:0.65rem;color:var(--text3);margin-top:2px;">Verified Earned</div>
      </div>
    `).join('');
  } else {
    container.innerHTML = '<div class="empty-panel" style="grid-column: 1/-1;"><p style="font-size:0.85rem;text-align:center;">No badges earned yet. Unlock badges through consistent contributions.</p></div>';
  }
}

function renderGamificationProgression() {
  const container = document.getElementById('dbLevelPath');
  if (!container) return;
  
  // Levels path mapping
  const ranks = [
    { minLevel: 1, maxLevel: 4, title: "Contributor", icon: "🌱" },
    { minLevel: 5, maxLevel: 9, title: "Supporter", icon: "⚡" },
    { minLevel: 10, maxLevel: 19, title: "Community Builder", icon: "🤝" },
    { minLevel: 20, maxLevel: 34, title: "Impact Leader", icon: "🔥" },
    { minLevel: 35, maxLevel: Infinity, title: "Change Champion", icon: "👑" }
  ];

  const currentLevel = currentUser.level || 1;

  container.innerHTML = ranks.map(r => {
    const isDone = currentLevel > r.maxLevel;
    const isCurrent = currentLevel >= r.minLevel && currentLevel <= r.maxLevel;
    const activeClass = isDone ? 'done' : isCurrent ? 'current' : '';
    
    return `
      <div class="level-node ${activeClass}" style="display:flex;align-items:center;gap:16px;padding:16px 20px;background:${isCurrent ? 'var(--surface2)' : 'var(--surface)'};border:1px solid ${isCurrent ? 'var(--blue)' : 'var(--border)'};border-radius:12px;margin-bottom:12px;opacity:${isDone||isCurrent ? 1 : 0.6};">
        <div style="font-size:1.8rem;">${r.icon}</div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:0.95rem;">${r.title}</div>
          <div style="font-size:0.75rem;color:var(--text3);">Levels ${r.minLevel}${Number.isFinite(r.maxLevel) ? '-' + r.maxLevel : '+'}</div>
        </div>
        <div>
          ${isDone ? '<span style="color:var(--green);font-weight:700;">✓ Achieved</span>' : isCurrent ? '<span style="color:var(--blue);font-weight:700;">🔥 Current Rarity</span>' : '<span style="color:var(--text3);">Locked</span>'}
        </div>
      </div>
    `;
  }).join('');
}

// AI Advisor Recommendation Box
async function loadAiRecommendations() {
  const reasonBox = document.getElementById('aiRecReason');
  const causeCard = document.getElementById('aiRecCauseCard');
  if (!reasonBox || !causeCard) return;

  reasonBox.textContent = '⏳ Analyzing your preferences to generate matching causes…';
  causeCard.innerHTML = '';

  try {
    const res = await api('/api/ai/recommendations');
    if (!res.ok) throw new Error('AI recommendations failed');
    const data = await res.json();
    const c = data.recommendation;

    reasonBox.textContent = `🤖 Recommendation: "${data.reason}"`;

    if (c) {
      const emoji = causeEmojis[c.category] || causeEmojis.default;
      const tagClass = causeTags[c.category] || causeTags.default;
      const raised = c.raised || 0;
      const goal = c.goal || 50000;
      const pct = Math.min((raised / goal) * 100, 100).toFixed(1);
      
      causeCard.innerHTML = `
        <div class="glass cause-card" style="margin-top:16px;border-color:var(--blue);box-shadow:var(--blue-glow);">
          <div class="cause-body" style="padding: 20px;">
            <div class="cause-meta-row">
              <h3 class="cause-title" style="font-size:1.05rem;">${emoji} ${esc(c.title)}</h3>
              <span class="tag ${tagClass}" style="font-size:0.65rem;padding:2px 8px;">${esc(c.category)}</span>
            </div>
            <p class="cause-desc" style="font-size:0.82rem;line-height:1.5;margin-bottom:12px;">${esc(c.description)}</p>
            <div class="progress-wrap" style="margin-bottom:12px;">
              <div class="progress-label" style="font-size:0.72rem;">
                <span>₹${raised.toLocaleString('en-IN')} raised</span>
                <span>${pct}%</span>
              </div>
              <div class="progress-track" style="height:4px;"><div class="progress-fill" style="width:${pct}%"></div></div>
            </div>
            <button class="btn btn-primary btn-sm btn-full" style="font-size:0.8rem;padding:8px;" onclick="openDonationModal('${c._id}')">Select Cause</button>
          </div>
        </div>
      `;
    }
  } catch (err) {
    reasonBox.textContent = 'Failed to load AI recommendations.';
  }
}

// AI Monthly Summary Report Generator
async function generateAiMonthlySummary() {
  const box = document.getElementById('aiSummaryReportText');
  const btn = document.getElementById('aiSummaryReportBtn');
  if (!box || !btn) return;

  btn.disabled = true;
  btn.textContent = '🤖 Compiling Report...';
  box.innerHTML = '⏳ Loading public ledger records to draft impact summary reports…';

  try {
    const res = await api('/api/ai/impact-summary');
    if (!res.ok) throw new Error('AI summary failed');
    const data = await res.json();
    
    // Replace formatting markup with bullet points
    let formatted = data.summary.replace(/\n/g, '<br/>');
    box.innerHTML = `<div style="font-size:0.9rem;line-height:1.6;color:var(--text2);">${formatted}</div>`;
  } catch (err) {
    box.textContent = 'Failed to generate monthly impact summary report.';
  } finally {
    btn.disabled = false;
    btn.textContent = '🤖 Generate Summary Report';
  }
}

async function editProfile(e) {
  e.preventDefault();
  const avatar = document.getElementById('pAvatarUrlInput').value.trim();
  const bio = document.getElementById('pBioInput').value.trim();
  const btn = e.target.querySelector('button');
  
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    const res = await api('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ avatar, bio })
    });
    if (!res.ok) throw new Error('Profile update failed');
    showToast('Profile bio updated successfully!', 'success');
    closeModal('editProfileModal');
    await loadUserDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
}

function openEditProfileModal() {
  if (!currentUser) return;
  document.getElementById('pAvatarUrlInput').value = currentUser.avatar || '';
  document.getElementById('pBioInput').value = currentUser.bio || '';
  openModal('editProfileModal');
}

/* ============================================================
   NGO DASHBOARD & VOLUNTEER ACTIONS
   ============================================================ */
async function loadNgoDashboard() {
  if (!ngoToken) {
    showToast('Please login first as an NGO partner 🙏', 'info');
    navigate('/login');
    return;
  }

  try {
    const res = await api('/api/ngo/me');
    if (!res.ok) throw new Error('Failed to load NGO dashboard');
    const data = await res.json();
    currentNgo = data.ngo;

    const initial = initials(currentNgo.name);
    document.getElementById('ndAvatar').textContent = initial;
    document.getElementById('ndName').textContent = currentNgo.name;
    document.getElementById('ndEmail').textContent = currentNgo.email;
    document.getElementById('ndRegInfo').textContent = `Reg: ${currentNgo.regNumber} | Tax: ${currentNgo.taxStatus}`;

    // Stats
    document.getElementById('ndStatReceived').textContent = '₹' + (currentNgo.totalReceived || 0).toLocaleString('en-IN');
    document.getElementById('ndStatCompleted').textContent = currentNgo.tasksCompleted || 0;
    document.getElementById('ndStatRating').textContent = (currentNgo.rating || 0).toFixed(1);
    document.getElementById('ndStatVolunteers').textContent = currentNgo.volunteerCount || 0;

    // Approved Work Updates / History
    const historyEl = document.getElementById('ndHistoryList');
    if (historyEl) {
      const updates = currentNgo.updates || [];
      if (updates.length > 0) {
        historyEl.innerHTML = updates.map(u => `
          <div class="donation-item" style="border-left:2px solid var(--green);padding-left:12px;margin-bottom:10px;">
            <div>
              <div style="font-weight:700;font-size:0.9rem;">${esc(u.title)}</div>
              <div style="font-size:0.75rem;color:var(--text3);margin-top:2px;">${esc(u.note)}</div>
              ${u.proofUrl ? `<div style="margin-top:4px;"><a href="${esc(u.proofUrl)}" target="_blank" style="font-size:0.75rem;color:var(--green);text-decoration:none;font-weight:700;">🔗 View Proof Video</a></div>` : ''}
            </div>
          </div>
        `).join('');
      } else {
        historyEl.innerHTML = '<div style="font-size:0.8rem;color:var(--text3);text-align:center;padding:16px;">No work updates uploaded.</div>';
      }
    }

    // Volunteers roster
    const volEl = document.getElementById('ndVolunteersList');
    if (volEl) {
      const vols = currentNgo.volunteers || [];
      if (vols.length > 0) {
        volEl.innerHTML = vols.map(v => {
          const actionBtn = v.status === 'requested'
            ? `
              <div class="action-buttons-wrap">
                <button class="btn btn-primary btn-sm" style="padding:4px 10px;font-size:0.72rem;background:var(--green);" onclick="reviewVolunteer('${v.user}','approved')">Approve</button>
                <button class="btn btn-danger btn-sm" style="padding:4px 10px;font-size:0.72rem;" onclick="reviewVolunteer('${v.user}','rejected')">Reject</button>
              </div>
            `
            : `<span class="tag ${v.status === 'approved' ? 'tag-green' : 'tag-orange'}" style="font-size:0.7rem;padding:2px 8px;">${esc(v.status)}</span>`;

          return `
            <div class="volunteer-row">
              <div class="volunteer-name-col">
                <div class="volunteer-title">${esc(v.name)}</div>
                <div class="volunteer-email">Email: ${esc(v.email)} | Phone: ${esc(v.phone || '-')}</div>
              </div>
              ${actionBtn}
            </div>
          `;
        }).join('');
      } else {
        volEl.innerHTML = '<div style="font-size:0.8rem;color:var(--text3);text-align:center;padding:16px;">No registered volunteers found.</div>';
      }
    }

    // Populate profile edit fields
    document.getElementById('ndEditLoc').value = currentNgo.location || '';
    document.getElementById('ndEditLogo').value = currentNgo.logo || '';
    document.getElementById('ndEditMotive').value = currentNgo.about || '';

  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function reviewVolunteer(userId, status) {
  try {
    const res = await api(`/api/admin/ngos/volunteers/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Verification review failed');
    showToast(`Volunteer request: ${status}!`, 'success');
    await loadNgoDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitNgoTask(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('ndTaskTitle').value.trim(),
    description: document.getElementById('ndTaskDesc').value.trim(),
    proofUrl: document.getElementById('ndTaskProofUrl').value.trim()
  };

  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Submitting…';

  try {
    const res = await api('/api/ngo/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit update');

    showToast('Verification work update submitted! 🚀', 'success');
    e.target.reset();
    await loadNgoDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Work Update';
  }
}

async function updateNgoProfile(e) {
  e.preventDefault();
  const payload = {
    location: document.getElementById('ndEditLoc').value.trim(),
    logoUrl: document.getElementById('ndEditLogo').value.trim(),
    motive: document.getElementById('ndEditMotive').value.trim()
  };

  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    const res = await api('/api/ngo/me', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('NGO profile update failed');
    showToast('NGO profile details saved!', 'success');
    await loadNgoDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save NGO Changes';
  }
}

/* ============================================================
   DONATION FLOW HANDLERS
   ============================================================ */
function openDonationModal(causeId) {
  if (!authToken) {
    showToast('Please login first to support cause micro-donations 🙏', 'info');
    navigate('/login');
    return;
  }
  selectedCause = causesData.find(c => c._id === causeId) || null;
  selectedAmount = 0;

  document.getElementById('donationCauseName').textContent = selectedCause ? `🌟 ${selectedCause.title}` : 'Selected Cause';
  document.getElementById('customAmount').value = '';
  document.getElementById('donationAmountDisplay').innerHTML = '<span class="grad-text">₹0</span>';
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
  
  openModal('donationModal');
}

function selectPreset(amt, btn) {
  selectedAmount = amt;
  document.getElementById('customAmount').value = '';
  document.getElementById('donationAmountDisplay').innerHTML = `<span class="grad-text">₹${amt.toLocaleString('en-IN')}</span>`;
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function onCustomAmount(val) {
  selectedAmount = parseFloat(val) || 0;
  document.getElementById('donationAmountDisplay').innerHTML = selectedAmount > 0
    ? `<span class="grad-text">₹${selectedAmount.toLocaleString('en-IN')}</span>`
    : '<span class="grad-text">₹0</span>';
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
}

async function proceedToPay() {
  if (selectedAmount < 10) { showToast('Minimum donation is ₹10', 'error'); return; }
  if (!selectedCause)       { showToast('Please select a cause first', 'error'); return; }

  const btn = document.getElementById('proceedPayBtn');
  btn.textContent = '⏳ Creating order…'; btn.disabled = true;

  try {
    const res = await api('/api/payments/order', {
      method: 'POST',
      body: JSON.stringify({ causeId: selectedCause._id, amount: selectedAmount })
    });
    const order = await res.json();
    if (!res.ok) throw new Error(order.message || 'Order creation failed');

    closeModal('donationModal');
    openRazorpay(order);
  } catch(e) {
    showToast(e.message || 'Failed to create order', 'error');
  } finally {
    btn.textContent = '💳 Proceed to Pay'; btn.disabled = false;
  }
}

function openRazorpay(order) {
  const options = {
    key: order.keyId || RAZORPAY_KEY,
    amount: order.amount * 100,
    currency: order.currency || 'INR',
    name: 'ServeMATE',
    description: `Donation for ${selectedCause?.title || 'Cause'}`,
    order_id: order.orderId,
    theme: { color: '#2563EB' },
    handler: async function(response) {
      await verifyPayment(response);
    },
    modal: {
      ondismiss: () => showToast('Payment cancelled.', 'info')
    }
  };
  const rp = new Razorpay(options);
  rp.open();
}

async function verifyPayment(response) {
  try {
    const res = await api('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id:   response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature:  response.razorpay_signature,
        causeId: selectedCause?._id,
        amount:  selectedAmount,
        communityId: selectedCommunityId || null
      })
    });
    const data = await res.json();
    showSuccessModal(data);
    launchConfetti();
    playSound('xp');
    
    // Clear attributing community
    selectedCommunityId = null;
    
    // Reload state data
    await fetchStats();
  } catch(e) {
    showToast('Payment verified but could not confirm. Please contact support.', 'error');
  }
}

function showSuccessModal(data) {
  const xpEl      = document.getElementById('successXP');
  const levelEl   = document.getElementById('successLevelInfo');
  const badgesEl  = document.getElementById('successBadges');
  const subEl     = document.getElementById('successSubText');
  const causeEl   = document.getElementById('successCauseMsg');

  const xpEarned = data.donation?.xpEarned || data.xpEarned || selectedAmount || 0;
  const level    = data.user?.level || data.newLevel || data.level || '?';
  const title    = data.user?.title || '';
  const badges   = data.user?.badges || data.badges || [];
  const prog     = data.user?.progression;
  const amount   = data.donation?.amount || selectedAmount || 0;

  subEl.textContent = `₹${amount.toLocaleString('en-IN')} donated successfully. You're now Level ${level}${title ? ' — ' + title : ''}! 🌟`;
  xpEl.innerHTML    = xpEarned > 0 ? `<span class="grad-text">+${xpEarned.toLocaleString('en-IN')} XP Earned!</span>` : '';

  if (prog) {
    const remaining = prog.xpRemaining || 0;
    levelEl.innerHTML = remaining > 0
      ? `📊 ${remaining.toLocaleString('en-IN')} XP more to reach Level ${level + 1}`
      : '';
  } else {
    levelEl.innerHTML = '';
  }

  // Cause-specific thank you messages
  const causeCategory = selectedCause?.category || '';
  const causeTitle = selectedCause?.title || 'this cause';
  const causeMessages = {
    'food':       `🍛 Your ₹${amount} donation to "${causeTitle}" will help provide nutritious meals to people in need. Every meal counts — you are fighting hunger one plate at a time!`,
    'environment':`🌳 Your ₹${amount} donation to "${causeTitle}" will help plant and nurture trees for a greener future. Together we are healing the planet, one tree at a time!`,
    'disaster-relief': `🎒 Your ₹${amount} donation to "${causeTitle}" will supply essential items to families who need them most. Clean water, hygiene kits, and daily necessities — your impact is real!`,
    'education':  `📚 Your ₹${amount} donation to "${causeTitle}" will help provide education and learning resources to underserved children. Knowledge is the greatest gift!`,
    'healthcare': `💊 Your ₹${amount} donation to "${causeTitle}" will support healthcare access for those who cannot afford it. You are saving lives with your generosity!`,
  };
  const msg = causeMessages[causeCategory] || `💝 Your ₹${amount} donation to "${causeTitle}" will create real, verified impact. Thank you for being a changemaker!`;
  causeEl.innerHTML = msg;

  badgesEl.innerHTML = badges.map(b => `<span class="badge-pill">${b}</span>`).join('');
  openModal('successModal');
}

/* ============================================================
   CONTACT MESSAGE SUBMIT
   ============================================================ */
async function submitContact(e) {
  e.preventDefault();
  const btn = document.getElementById('contactSubmit');
  btn.textContent = '⏳ Sending…'; btn.disabled = true;
  try {
    const res = await api('/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name:    document.getElementById('contactName').value,
        email:   document.getElementById('contactEmail').value,
        message: document.getElementById('contactMsg').value
      })
    });
    if (!res.ok) throw new Error('Failed');
    document.getElementById('contactSuccess').style.display = 'block';
    document.getElementById('contactForm').reset();
    showToast('Message sent successfully! 📨');
  } catch(err) {
    showToast('Failed to send. Please try again.', 'error');
  } finally {
    btn.textContent = '✉️ Send Message'; btn.disabled = false;
  }
}

/* ============================================================
   HELPERS & UTILS
   ============================================================ */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function initials(name) {
  return String(name || 'SM')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || 'SM';
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('hidden');
    document.body.style.overflow = '';
  }
}
function handleOverlayClick(e, id) {
  if (e.target.classList.contains('modal-overlay')) closeModal(id);
}

// FAQ Accordion toggles
function toggleFaq(el) {
  const card = el.closest('.faq-card');
  const body = card.querySelector('.faq-body');
  const arrow = card.querySelector('.faq-arrow');
  const isOpen = !body.classList.contains('hidden');

  if (isOpen) {
    body.classList.add('hidden');
    arrow.textContent = '▼';
  } else {
    body.classList.remove('hidden');
    arrow.textContent = '▲';
  }
}

// AI Advisor Advisor budget planter suggestions
async function generateAdvisorPlan(event) {
  event.preventDefault();
  const budget = document.getElementById('aiBudget').value;
  const cause = document.getElementById('aiCause').value;
  const goal = document.getElementById('aiGoal').value;
  const submitBtn = document.getElementById('aiAdvisorSubmit');
  const loadingDiv = document.getElementById('aiAdvisorLoading');
  const resultDiv = document.getElementById('aiAdvisorResult');
  const planTextEl = document.getElementById('aiAdvisorPlanText');
  
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Preparing Plan...';
  loadingDiv.classList.remove('hidden');
  resultDiv.classList.add('hidden');
  
  try {
    const res = await api('/api/ai/advisor', {
      method: 'POST',
      body: JSON.stringify({ amount: budget, category: cause, goal })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate impact plan');
    
    planTextEl.textContent = data.plan;
    resultDiv.classList.remove('hidden');
    playSound('xp');
  } catch(err) {
    showToast(err.message || 'Error communicating with AI Advisor', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '🤖 Generate Impact Plan';
    loadingDiv.classList.add('hidden');
  }
}

/* ============================================================
   CONFETTI & AUDIO SYNTHESIS
   ============================================================ */
function launchConfetti() {
  const colors = ['#2563EB','#7C3AED','#10B981','#F59E0B','#F97316','#EF4444','#06B6D4'];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left: ${Math.random() * 100}vw;
      top: -20px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 10}px;
      height: ${6 + Math.random() * 10}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${2 + Math.random() * 2.5}s;
      animation-delay: ${Math.random() * 0.8}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }
}

function playSound(type) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    
    if (type === 'xp') {
      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 1046.50];
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        osc.start(now + idx * 0.08);
        osc.stop(now + 0.35 + idx * 0.08);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {
    console.warn('Audio synthesis disabled', e);
  }
}

document.addEventListener('click', e => {
  if (e.target.closest('.btn, .tab-btn, .nav-links a, .nav-logo, .btn-donate, .dashboard-menu-btn')) {
    playSound('click');
  }
});

/* ============================================================
   LIGHT/DARK THEME TOGGLE
   ============================================================ */
function applyInitialTheme() {
  const savedTheme = localStorage.getItem('servemate_theme') || 'dark';
  const body = document.body;
  const icon = document.getElementById('themeIcon');
  
  if (savedTheme === 'light') {
    body.classList.add('light-mode');
    if (icon) {
      icon.textContent = '☀️';
      icon.style.transform = 'rotate(360deg)';
    }
  } else {
    body.classList.remove('light-mode');
    if (icon) {
      icon.textContent = '🌙';
      icon.style.transform = 'rotate(0deg)';
    }
  }
}

function toggleTheme() {
  const body = document.body;
  const icon = document.getElementById('themeIcon');
  
  body.classList.toggle('light-mode');
  const isLight = body.classList.contains('light-mode');
  
  localStorage.setItem('servemate_theme', isLight ? 'light' : 'dark');
  
  if (icon) {
    icon.style.transform = 'scale(0.3) rotate(180deg)';
    setTimeout(() => {
      icon.textContent = isLight ? '☀️' : '🌙';
      icon.style.transform = isLight ? 'scale(1) rotate(360deg)' : 'scale(1) rotate(0deg)';
    }, 150);
  }
}

/* ============================================================
   REVEAL TIMINGS & ESC KEYBOARD
   ============================================================ */
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['donationModal','successModal','createCommunityModal','ngoProfileModal','editProfileModal','mobileMenuDrawer'].forEach(id => closeModal(id));
    const btn = document.getElementById('mobileMenuToggle');
    if (btn) btn.classList.remove('open');
    const drawer = document.getElementById('mobileMenuDrawer');
    if (drawer) drawer.classList.remove('active');
  }
});

function toggleMobileMenu() {
  const drawer = document.getElementById('mobileMenuDrawer');
  const btn = document.getElementById('mobileMenuToggle');
  if (drawer) {
    const isOpening = drawer.classList.contains('hidden');
    if (isOpening) {
      drawer.classList.remove('hidden');
      drawer.classList.add('active');
      if (btn) btn.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      drawer.classList.add('hidden');
      drawer.classList.remove('active');
      if (btn) btn.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
}

/* ============================================================
   INIT ON LOAD
   ============================================================ */
async function init() {
  applyInitialTheme();
  initReveal();
  
  // Add scroll listener for sticky header
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run immediately on load
  }
  
  // Restore logged-in state
  await restoreSession();
  
  // Set up SPA client navigation
  const path = window.location.pathname;
  navigate(path, false);
}

document.addEventListener('DOMContentLoaded', init);
window.navigate = navigate;
window.filterCauses = filterCauses;
window.openDonationModal = openDonationModal;
window.selectPreset = selectPreset;
window.onCustomAmount = onCustomAmount;
window.proceedToPay = proceedToPay;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.sendRegistrationOtp = sendRegistrationOtp;
window.sendForgotPasswordOtp = sendForgotPasswordOtp;
window.handleForgotPassword = handleForgotPassword;
window.openEditProfileModal = openEditProfileModal;
window.editProfile = editProfile;
window.toggleTheme = toggleTheme;
window.generateAiMonthlySummary = generateAiMonthlySummary;
window.generateAdvisorPlan = generateAdvisorPlan;
window.submitContact = submitContact;
window.toggleFaq = toggleFaq;
window.createCommunity = createCommunity;
window.joinCommunityByCode = joinCommunityByCode;
window.submitNgoTask = submitNgoTask;
window.updateNgoProfile = updateNgoProfile;
window.switchLeaderboardTab = switchLeaderboardTab;
window.switchDashboardTab = switchDashboardTab;
window.searchCommunities = searchCommunities;
window.openNgoProfileModal = openNgoProfileModal;
window.closeModal = closeModal;
window.handleOverlayClick = handleOverlayClick;
window.toggleMobileMenu = toggleMobileMenu;

