/**
 * RIABORE CATHOLIC CHURCH — LIVE MASS PLATFORM ENGINE
 * Handles: chat, prayer requests, reactions, viewer counter,
 *          mass stage tracker, stream join/logout, notifications,
 *          simulated community activity, keyboard shortcuts
 */

'use strict';

/* ─── State ─────────────────────────────────────────── */
const State = {
  user: null,          // { name, isGuest, avatar }
  viewers: 248,
  reactions: { '🙏': 47, '❤️': 31, '✝️': 22, '🕊️': 18, '🎵': 9 },
  reactionKeys: { '🙏': 'count-pray', '❤️': 'count-heart', '✝️': 'count-cross', '🕊️': 'count-dove', '🎵': 'count-music' },
  massStages: [
    'Introductory Rites',
    'Penitential Act',
    'Liturgy of the Word',
    'Liturgy of the Eucharist',
    'Communion Rite',
    'Concluding Rites'
  ],
  currentStage: 2,     // 0-indexed; stage 2 = Liturgy of the Word
  chatMessages: [],
  prayers: [],
  notifications: [],
  chatEnabled: false,
  streamStarted: false,
  notifCount: 0
};

/* ─── Seed data ──────────────────────────────────────── */
const SEED_MESSAGES = [
  { name: 'Mary W.',    text: 'Praise God! Joining from Nairobi 🙏',       time: '08:52' },
  { name: 'James O.',   text: 'Good morning everyone, God bless!',          time: '08:54' },
  { name: 'Grace M.',   text: 'Amen. So grateful for this platform ✝️',     time: '08:56' },
  { name: 'Fr. Peter',  text: 'Welcome all who are joining online today!',  time: '08:58', special: true },
  { name: 'Ruth K.',    text: 'Watching from the UK. Asante sana 🕊️',      time: '09:00' },
  { name: 'Paul N.',    text: 'Let us pray with one heart ❤️',              time: '09:01' },
  { name: 'Alice T.',   text: 'My family is watching together from Mombasa', time: '09:02' },
];

const SEED_PRAYERS = [
  { name: 'Anonymous',  type: 'healing',      text: 'Please pray for my mother who is in hospital.' },
  { name: 'David M.',   type: 'thanksgiving', text: 'Thanksgiving for safe delivery of our baby girl!' },
  { name: 'Florence',   type: 'family',       text: 'For healing in our family relationships.' },
];

const SIM_NAMES = [
  'Peter K.', 'Ann W.', 'John M.', 'Rose O.', 'Francis T.',
  'Beatrice N.', 'Michael A.', 'Teresa L.', 'Joseph G.', 'Cecilia R.',
  'Emmanuel S.', 'Veronica H.', 'Patrick D.', 'Agnes B.', 'Simon O.'
];

const SIM_MESSAGES = [
  'Praying along from home 🙏', 'Amen! Amen!', 'God bless Father and all parishioners',
  'Joining from Kisumu ✝️', 'Beautiful homily today ❤️', 'The Lord is good!',
  'Watching with my children', 'Praise be to God 🕊️', 'Thank you Lord!',
  'So uplifting. Asante ❤️', 'Blessings to all 🎵', 'Amen from Eldoret!',
  'This platform is such a blessing', 'Praying for everyone here 🙏',
  'Gloria in Excelsis Deo! ✝️'
];

/* ─── Utilities ──────────────────────────────────────── */
function el(id) { return document.getElementById(id); }

function now() {
  return new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ─── Toast / Notification system ───────────────────── */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { info: 'fa-info-circle', success: 'fa-check-circle', warning: 'fa-exclamation-circle', prayer: 'fa-hands-praying' };
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

function addNotification(msg) {
  State.notifCount++;
  const badge = el('notifBadge');
  if (badge) {
    badge.textContent = State.notifCount;
    badge.style.display = 'inline-flex';
  }
}

/* ─── Stream ─────────────────────────────────────────── */
function startStream() {
  el('videoOverlay').style.display = 'none';
  State.streamStarted = true;
  showToast('You have joined the Live Mass. God bless you! 🙏', 'success');
  updateViewerCount(State.viewers + randomBetween(1, 5));
}

/* ─── User / Auth ────────────────────────────────────── */
function joinCommunity() {
  const input = el('usernameInput');
  const name = (input ? input.value.trim() : '') || 'Parishioner';
  if (name.length < 2) {
    showToast('Please enter your name (at least 2 characters).', 'warning');
    input.focus();
    return;
  }
  setUser(name, false);
}

function joinAsGuest() {
  const guestNum = randomBetween(100, 999);
  setUser(`Guest${guestNum}`, true);
}

function setUser(name, isGuest) {
  State.user = { name, isGuest, avatar: initials(name) };
  el('loginPanel').style.display = 'none';
  el('userPanel').style.display = 'block';
  el('userAvatar').textContent = State.user.avatar;
  el('userDisplayName').textContent = State.user.name;

  // Enable chat
  const chatInput = el('chatInput');
  const sendBtn   = el('sendBtn');
  chatInput.disabled = false;
  sendBtn.disabled   = false;
  chatInput.placeholder = 'Say something...';
  State.chatEnabled = true;

  showToast(`Welcome, ${name}! You can now chat and submit prayer requests.`, 'success');
  addChatMessage(name, `${isGuest ? '👋' : '✝️'} ${name} has joined the Mass.`, now(), false, true);
  updateViewerCount(State.viewers + 1);
}

function logout() {
  if (State.user) {
    addChatMessage(State.user.name, `${State.user.name} has left the Mass. God bless! 🙏`, now(), false, true);
  }
  State.user = null;
  State.chatEnabled = false;
  el('loginPanel').style.display = 'block';
  el('userPanel').style.display  = 'none';
  el('chatInput').disabled  = true;
  el('sendBtn').disabled    = true;
  el('chatInput').placeholder = 'Type a message...';
  if (el('usernameInput')) el('usernameInput').value = '';
  showToast('You have left the community chat. Thank you for joining! 🙏', 'info');
}

/* ─── Chat ───────────────────────────────────────────── */
function addChatMessage(name, text, time, isSelf = false, isSystem = false) {
  const container = el('chatMessages');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = 'chat-msg' + (isSelf ? ' self' : '') + (isSystem ? ' system-msg' : '');

  if (isSystem) {
    msg.innerHTML = `<div class="system-msg-text">${text}</div>`;
  } else {
    msg.innerHTML = `
      <div class="chat-msg-avatar">${initials(name)}</div>
      <div class="chat-msg-body">
        <div class="msg-name">${escapeHtml(name)} <span class="msg-time">${time}</span></div>
        <div class="msg-text">${escapeHtml(text)}</div>
      </div>`;
  }

  container.appendChild(msg);
  // Smooth scroll to bottom
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });

  // Keep max 80 messages for performance
  State.chatMessages.push({ name, text, time });
  const msgs = container.querySelectorAll('.chat-msg');
  if (msgs.length > 80) msgs[0].remove();
}

function sendMessage() {
  if (!State.chatEnabled || !State.user) {
    showToast('Please join to send messages.', 'warning');
    return;
  }
  const input = el('chatInput');
  const text = input.value.trim();
  if (!text) return;
  if (text.length > 200) {
    showToast('Message is too long (max 200 characters).', 'warning');
    return;
  }
  addChatMessage(State.user.name, text, now(), true);
  input.value = '';
  input.focus();
}

// Allow Enter key to send
function initChatKeyboard() {
  const input = el('chatInput');
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  // Username input Enter to join
  const uInput = el('usernameInput');
  if (uInput) {
    uInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') joinCommunity();
    });
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ─── Prayer Requests ────────────────────────────────── */
function submitPrayer() {
  const name  = (el('prayerName')?.value.trim()) || 'Anonymous';
  const text  = el('prayerText')?.value.trim();
  const type  = el('prayerType')?.value || 'general';

  if (!text || text.length < 5) {
    showToast('Please enter your prayer intention.', 'warning');
    el('prayerText')?.focus();
    return;
  }

  State.prayers.push({ name, text, type });
  renderPrayer({ name, text, type }, true);

  // Reset form
  if (el('prayerName')) el('prayerName').value = '';
  if (el('prayerText')) el('prayerText').value = '';
  if (el('prayerType')) el('prayerType').value = 'general';

  showToast('Your prayer request has been submitted. 🙏 May the Lord hear your intention.', 'prayer', 5000);
  addChatMessage('🙏 Prayer', `A prayer intention has been submitted for ${name}`, now(), false, true);
  addNotification('New prayer request submitted');
}

function renderPrayer(prayer, isNew = false) {
  const list = el('prayerList');
  if (!list) return;
  const typeLabels = {
    healing: '💊 Healing', family: '👨‍👩‍👧 Family', work: '💼 Work',
    thanksgiving: '🙌 Thanksgiving', deceased: '🕊 Deceased', general: '✝️ General'
  };
  const item = document.createElement('div');
  item.className = 'prayer-item' + (isNew ? ' prayer-item-new' : '');
  item.innerHTML = `
    <div class="prayer-meta">
      <span class="prayer-who">${escapeHtml(prayer.name)}</span>
      <span class="prayer-type-tag">${typeLabels[prayer.type] || '✝️ General'}</span>
    </div>
    <div class="prayer-content">"${escapeHtml(prayer.text)}"</div>`;
  list.prepend(item);
  setTimeout(() => item.classList.remove('prayer-item-new'), 1500);
}

/* ─── Reactions ──────────────────────────────────────── */
function react(emoji) {
  const keyMap = { '🙏': 'pray', '❤️': 'heart', '✝️': 'cross', '🕊️': 'dove', '🎵': 'music' };
  const key = keyMap[emoji];
  if (!key) return;
  State.reactions[emoji] = (State.reactions[emoji] || 0) + 1;
  const countEl = el(`count-${key}`);
  if (countEl) {
    countEl.textContent = State.reactions[emoji];
    // Bounce animation
    countEl.parentElement.classList.add('reacted');
    setTimeout(() => countEl.parentElement.classList.remove('reacted'), 600);
  }
  floatEmoji(emoji);
}

function floatEmoji(emoji) {
  const feed = el('reactionFeed');
  if (!feed) return;
  const span = document.createElement('span');
  span.className = 'float-emoji';
  span.textContent = emoji;
  span.style.left = randomBetween(0, 80) + '%';
  feed.appendChild(span);
  setTimeout(() => span.remove(), 2000);
}

/* ─── Viewer Counter ─────────────────────────────────── */
function updateViewerCount(newCount) {
  State.viewers = Math.max(1, newCount);
  const v = el('viewerCount');
  const o = el('onlineUsers');
  if (v) v.textContent = State.viewers.toLocaleString();
  if (o) o.textContent = State.viewers.toLocaleString();
}

function simulateViewers() {
  setInterval(() => {
    const delta = randomBetween(-3, 7);
    updateViewerCount(State.viewers + delta);
  }, 8000);
}

/* ─── Mass Stage Tracker ─────────────────────────────── */
function renderMassStages() {
  const container = document.querySelector('.order-steps');
  if (!container) return;
  container.innerHTML = '';
  State.massStages.forEach((stage, i) => {
    const div = document.createElement('div');
    let cls = 'order-step';
    if (i < State.currentStage)  cls += ' completed';
    if (i === State.currentStage) cls += ' active';
    div.className = cls;
    div.innerHTML = `<span class="step-num">${i + 1}</span> ${stage}`;
    div.title = `Click to view details for: ${stage}`;
    div.style.cursor = 'pointer';
    div.addEventListener('click', () => showStageInfo(stage, i));
    container.appendChild(div);
  });
}

function showStageInfo(stage, index) {
  const info = {
    0: 'The Mass begins as the priest and ministers process to the altar. We make the Sign of the Cross together.',
    1: 'We acknowledge our sins and ask for God\'s mercy. "Lord, have mercy. Christ, have mercy."',
    2: 'We listen to God\'s Word through the First Reading, Psalm, Second Reading, and the Holy Gospel.',
    3: 'The bread and wine are offered and consecrated. The Eucharistic Prayer is the heart of the Mass.',
    4: 'We prepare to receive Holy Communion and pray the Our Father together as one family.',
    5: 'The priest blesses us and we are sent forth: "Go in peace, glorifying the Lord by your life."'
  };
  showToast(`<strong>${stage}</strong>: ${info[index] || ''}`, 'info', 5500);
}

function advanceMassStage() {
  if (State.currentStage < State.massStages.length - 1) {
    State.currentStage++;
    renderMassStages();
    const stageName = State.massStages[State.currentStage];
    const massPart = el('massPart');
    if (massPart) massPart.textContent = stageName;
    addChatMessage('⛪ Mass Update', `Now: ${stageName}`, now(), false, true);
    showToast(`Mass has progressed to: <strong>${stageName}</strong>`, 'info', 4000);
    addNotification(`Mass now at: ${stageName}`);
  }
}

/* ─── Simulate Community Activity ───────────────────── */
function simulateChatActivity() {
  const intervals = [12000, 18000, 22000, 28000, 35000, 42000];
  intervals.forEach((delay, i) => {
    setTimeout(() => {
      const name = randomFrom(SIM_NAMES);
      const text = randomFrom(SIM_MESSAGES);
      addChatMessage(name, text, now());
    }, delay + randomBetween(0, 5000));
  });
  // Recurring after all seed messages sent
  setInterval(() => {
    if (Math.random() > 0.4) {
      addChatMessage(randomFrom(SIM_NAMES), randomFrom(SIM_MESSAGES), now());
    }
  }, randomBetween(20000, 40000));
}

function simulatePrayerActivity() {
  setTimeout(() => {
    renderPrayer({ name: 'Mary N.', type: 'healing', text: 'Please pray for my brother recovering from surgery.' });
    addChatMessage('🙏 Prayer', 'A healing prayer intention has been submitted.', now(), false, true);
  }, 25000);
  setTimeout(() => {
    renderPrayer({ name: 'Thomas K.', type: 'thanksgiving', text: 'Thanksgiving for my daughter\'s university admission.' });
    addChatMessage('🙏 Prayer', 'A thanksgiving intention has been submitted.', now(), false, true);
  }, 55000);
}

function simulateReactionActivity() {
  const emojis = ['🙏', '❤️', '✝️', '🕊️', '🎵'];
  setInterval(() => {
    const emoji = randomFrom(emojis);
    State.reactions[emoji] = (State.reactions[emoji] || 0) + randomBetween(1, 3);
    const keyMap = { '🙏': 'pray', '❤️': 'heart', '✝️': 'cross', '🕊️': 'dove', '🎵': 'music' };
    const countEl = el(`count-${keyMap[emoji]}`);
    if (countEl) countEl.textContent = State.reactions[emoji];
    if (Math.random() > 0.5) floatEmoji(emoji);
  }, randomBetween(6000, 14000));
}

/* ─── Mass Stage Auto-Advance ────────────────────────── */
function startMassStageTimer() {
  // Advance stage every ~12 minutes simulated (use 3 min for demo = 180000ms)
  // For demo we use a much shorter interval — 4 minutes
  const stageInterval = 4 * 60 * 1000;
  setTimeout(() => {
    advanceMassStage(); // Stage 3
    setTimeout(() => {
      advanceMassStage(); // Stage 4
      setTimeout(() => {
        advanceMassStage(); // Stage 5
      }, stageInterval);
    }, stageInterval);
  }, stageInterval);
}

/* ─── Keyboard Shortcuts ─────────────────────────────── */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't fire shortcuts when typing in inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    switch (e.key.toLowerCase()) {
      case 'j':
        // J = jump to stream / dismiss overlay
        startStream();
        showToast('Stream joined! Press J to toggle.', 'info', 2000);
        break;
      case 'c':
        // C = focus chat
        const chatInput = el('chatInput');
        if (chatInput && !chatInput.disabled) {
          chatInput.focus();
          showToast('Chat focused. Press Esc to return.', 'info', 1800);
        }
        break;
      case 'p':
        // P = scroll to prayer panel
        el('prayer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('Scrolled to prayer requests.', 'info', 1800);
        break;
      case '1': case '2': case '3': case '4': case '5':
        // 1-5 = react with emoji
        const emojiMap = { '1': '🙏', '2': '❤️', '3': '✝️', '4': '🕊️', '5': '🎵' };
        react(emojiMap[e.key]);
        break;
    }
  });
}

/* ─── Keyboard shortcut hints tooltip ───────────────── */
function renderShortcutHints() {
  const wrapper = document.querySelector('.viewer-actions');
  if (!wrapper) return;
  const hint = document.createElement('span');
  hint.className = 'shortcut-hint';
  hint.innerHTML = `<i class="fas fa-keyboard"></i> <span>J: Join &nbsp; C: Chat &nbsp; P: Prayer &nbsp; 1-5: React</span>`;
  wrapper.after(hint);
}

/* ─── Stream Quality Selector ────────────────────────── */
function renderQualitySelector() {
  const bar = document.querySelector('.viewer-bar');
  if (!bar) return;
  const sel = document.createElement('div');
  sel.className = 'quality-selector';
  sel.innerHTML = `
    <label for="qualitySelect"><i class="fas fa-signal"></i></label>
    <select id="qualitySelect" title="Stream quality">
      <option value="auto" selected>Auto</option>
      <option value="1080p">1080p HD</option>
      <option value="720p">720p</option>
      <option value="480p">480p</option>
      <option value="360p">360p (Low data)</option>
    </select>`;
  bar.querySelector('.viewer-actions').prepend(sel);
  el('qualitySelect').addEventListener('change', (e) => {
    showToast(`Stream quality set to <strong>${e.target.value}</strong>.`, 'info', 2500);
  });
}

/* ─── Render initial reactions counts ───────────────── */
function renderInitialReactions() {
  const keyMap = { '🙏': 'pray', '❤️': 'heart', '✝️': 'cross', '🕊️': 'dove', '🎵': 'music' };
  Object.entries(State.reactions).forEach(([emoji, count]) => {
    const key = keyMap[emoji];
    if (key) {
      const el2 = el(`count-${key}`);
      if (el2) el2.textContent = count;
    }
  });
}

/* ─── Reading toggle enhancement ────────────────────── */
function initReadingToggles() {
  document.querySelectorAll('.btn-read').forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
      if (!targetId) return;
      const panel = el(targetId);
      if (!panel) return;
      const isOpen = panel.style.display !== 'none';
      panel.style.display = isOpen ? 'none' : 'block';
      this.querySelector('i').className = isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
      this.childNodes[0].textContent = isOpen ? 'Read Full ' : 'Collapse ';
    });
  });
}

/* ─── Live status bar clock ──────────────────────────── */
function startLiveClock() {
  function tick() {
    const timeEl = document.querySelector('.live-title');
    if (timeEl) {
      const t = new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
      const subtitle = document.querySelector('.live-sub');
      if (subtitle) {
        subtitle.textContent = `Riabore Catholic Church — Local time: ${t}`;
      }
    }
  }
  tick();
  setInterval(tick, 60000);
}

/* ─── Scroll-to-prayer from hash ─────────────────────── */
function handleHashNav() {
  if (window.location.hash === '#prayer') {
    setTimeout(() => {
      el('prayer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  }
}

/* ─── Init ───────────────────────────────────────────── */
function init() {
  // Render mass stages (clickable)
  renderMassStages();

  // Render initial reaction counts
  renderInitialReactions();

  // Seed chat with pre-existing messages
  SEED_MESSAGES.forEach(m => addChatMessage(m.name, m.text, m.time, false, !!m.special));

  // Seed prayers
  SEED_PRAYERS.forEach(p => renderPrayer(p));

  // Keyboard
  initChatKeyboard();
  initKeyboardShortcuts();
  renderShortcutHints();

  // Reading toggles
  initReadingToggles();

  // Quality selector
  renderQualitySelector();

  // Live clock
  startLiveClock();

  // Simulations
  simulateChatActivity();
  simulatePrayerActivity();
  simulateReactionActivity();
  simulateViewers();
  startMassStageTimer();

  // Hash nav
  handleHashNav();

  // Welcome toast after short delay
  setTimeout(() => {
    showToast('Welcome to Riabore Catholic Church Live Mass 🙏 Please join or continue as Guest to participate.', 'info', 5000);
  }, 1200);
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose globals needed by inline onclick handlers in HTML
window.startStream    = startStream;
window.joinCommunity  = joinCommunity;
window.joinAsGuest    = joinAsGuest;
window.logout         = logout;
window.sendMessage    = sendMessage;
window.react          = react;
window.submitPrayer   = submitPrayer;
window.toggleReading  = function(id) {
  const panel = el(id);
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
};
window.shareMass = function() {
  const shareData = {
    title: 'Riabore Catholic Church — Live Mass',
    text: 'Join the live Sunday Mass at Riabore Catholic Church!',
    url: window.location.href
  };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      showToast('Link copied to clipboard! Share it with others. 🙏', 'success');
    }).catch(() => {
      showToast('Share link: ' + window.location.href, 'info', 6000);
    });
  }
};
window.goFullscreen = function() {
  const frame = el('liveStream');
  const wrapper = document.querySelector('.video-wrapper');
  const target = frame || wrapper;
  if (target?.requestFullscreen)           target.requestFullscreen();
  else if (target?.webkitRequestFullscreen) target.webkitRequestFullscreen();
};
