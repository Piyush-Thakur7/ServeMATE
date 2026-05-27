/* ---- USER PROFILES DATA ---- */
const USER_PROFILES = {};

/* ---- NGO PROFILES DATA ---- */
const NGO_PROFILES = {};

function openUserProfile(id) {
  const u = USER_PROFILES[id];
  if (!u) return;
  document.getElementById('upm-avatar').textContent = u.initials;
  document.getElementById('upm-avatar').style.background = u.gradient;
  document.getElementById('upm-name').textContent = u.name;
  document.getElementById('upm-sub').textContent = '📍 ' + u.city + '   |   Member since ' + u.since + '   |   ⭐ ' + u.level;
  document.getElementById('upm-stats').innerHTML = u.stats.map(s =>
    `<div class="pm-stat"><div class="n">${s.n}</div><div class="l">${s.l}</div></div>`
  ).join('');
  document.getElementById('upm-badges').innerHTML = u.badges.map(b =>
    `<span class="badge badge-blue" style="font-size:.78rem;">${b}</span>`
  ).join('');
  document.getElementById('upm-history').innerHTML = u.history.map(h =>
    `<div class="pm-hist-item"><span class="pm-hist-icon">${h.icon}</span><div class="pm-hist-body"><div style="font-weight:600;">${h.title}</div><div style="font-size:.75rem;color:var(--text3);">${h.date}</div></div><span class="pm-hist-amt">${h.amt}</span></div>`
  ).join('');
  openModal('user-profile-modal');
}

function openNGOProfile(id) {
  const n = NGO_PROFILES[id];
  if (!n) return;
  document.getElementById('npm-icon').textContent = n.icon;
  document.getElementById('npm-name').textContent = n.name + ' ✓';
  document.getElementById('npm-location').textContent = n.location;
  document.getElementById('npm-rating').innerHTML = `<span style="color:var(--orange);font-size:.85rem;">${n.rating}</span>`;
  document.getElementById('npm-stats').innerHTML = n.stats.map(s =>
    `<div class="pm-stat"><div class="n">${s.n}</div><div class="l">${s.l}</div></div>`
  ).join('');
  document.getElementById('npm-motive').textContent = n.motive;
  document.getElementById('npm-badges').innerHTML = n.badges.map(b =>
    `<span class="badge badge-green" style="font-size:.78rem;">${b}</span>`
  ).join('');
  document.getElementById('npm-vol-count').textContent = n.volunteers.length;
  document.getElementById('npm-volunteers').innerHTML = n.volunteers.map(v =>
    `<div class="volunteer-chip"><div class="vc-avatar">${v.initials}</div>${v.name}</div>`
  ).join('');
  document.getElementById('npm-videos').innerHTML = n.videos.map(v =>
    `<div class="video-proof-card">
      <div class="vpc-thumb" onclick="showToast('▶ Playing: ${v.title}')">▶️</div>
      <div class="vpc-body">
        <div class="vpc-title">${v.icon} ${v.title}</div>
        <div class="vpc-meta">📅 ${v.date} &nbsp;|&nbsp; ⏱ ${v.duration} &nbsp;|&nbsp; <span class="badge badge-green" style="font-size:.7rem;">✅ Verified</span></div>
      </div>
    </div>`
  ).join('');
  openModal('ngo-profile-modal');
}

// Close profile modals on overlay click
document.getElementById('user-profile-modal').addEventListener('click', function(e){ if(e.target===this) closeModal('user-profile-modal'); });
document.getElementById('ngo-profile-modal').addEventListener('click', function(e){ if(e.target===this) closeModal('ngo-profile-modal'); });


// ===== MOBILE MENU =====
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('hamburger');
  const isOpen = menu.classList.contains('open');
  if (isOpen) { closeMobileMenu(); }
  else { menu.classList.add('open'); btn.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.body.style.overflow = '';
}
function mobileNav(page) {
  closeMobileMenu();
  showPage(page);
}
// Close mobile menu on page resize if wide
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeMobileMenu();
});
