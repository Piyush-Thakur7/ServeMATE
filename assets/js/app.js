let currentPage = 'home';
  let currentDonateAmount = 50;

  function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-'+id).classList.add('active');
    currentPage = id;
    window.scrollTo(0,0);
  }

  function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.querySelector('.theme-toggle').textContent = isDark ? '🌙' : '☀️';
  }

  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  function openAuthModal() { openModal('auth-modal'); }
  function openProofModal() { openModal('proof-modal'); return false; }
  function openNGORegModal() { openModal('ngo-modal'); }

  function openDonateModal(cause) {
    document.getElementById('donate-step1').style.display = '';
    document.getElementById('donate-step2').style.display = 'none';
    if (cause) document.getElementById('donate-cause').value = cause;
    updateImpact();
    openModal('donate-modal');
  }

  function switchAuthTab(tab, btn) {
    document.querySelectorAll('#auth-modal .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('auth-login').style.display = tab === 'login' ? '' : 'none';
    document.getElementById('auth-register').style.display = tab === 'register' ? '' : 'none';
  }

  function loginAction() {
    closeModal('auth-modal');
    showPage('dashboard');
    showToast('✅ Logged in successfully! Welcome back, Piyush.');
  }

  function selectAmount(amt, btn) {
    currentDonateAmount = amt;
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('custom-amount').value = '';
    updateImpact();
  }

  function updateImpact() {
    const custom = document.getElementById('custom-amount').value;
    const amt = custom ? parseInt(custom) : currentDonateAmount;
    const selected = document.getElementById('donate-cause').selectedOptions[0];
    const causeLabel = selected && selected.value ? selected.textContent : 'an approved NGO cause';
    const msg = selected && selected.value
      ? `Rs ${amt} will support <strong>${causeLabel}</strong>. Final proof appears after NGO work is verified by admin.`
      : 'Select an approved NGO cause to see its real impact details.';
    document.getElementById('impact-preview').innerHTML = `<p>${msg}</p>`;
  }

  function showDonateSuccess() {
    const custom = document.getElementById('custom-amount').value;
    const amt = custom ? parseInt(custom) : currentDonateAmount;
    document.getElementById('success-amount').textContent = '₹' + amt;
    document.getElementById('donate-step1').style.display = 'none';
    document.getElementById('donate-step2').style.display = '';
  }

  function showDashTab(tab) {
    ['overview','history','badges','gamification'].forEach(t => {
      const el = document.getElementById('dtab-'+t);
      if (el) el.style.display = t === tab ? '' : 'none';
      const btn = document.getElementById('stab-'+t);
      if (btn) btn.classList.toggle('active', t === tab);
    });
  }

  function switchLB(type, btn) {
    document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('lb-donors').style.display = type === 'donors' ? '' : 'none';
    document.getElementById('lb-ngos').style.display = type === 'ngos' ? '' : 'none';
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.transform = 'translateY(0)'; t.style.opacity = '1';
    setTimeout(() => { t.style.transform = 'translateY(100px)'; t.style.opacity = '0'; }, 3500);
  }

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  });

  // Animate progress bars on load
  window.addEventListener('load', () => {
    setTimeout(() => { document.querySelectorAll('.progress-fill').forEach(el => { const w = el.style.width; el.style.width = '0'; setTimeout(() => el.style.width = w, 100); }); }, 300);
  });
