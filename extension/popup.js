const DEFAULT_SERVER = 'http://localhost:3001';
const APP_URL = 'http://localhost:5173';

let serverUrl = DEFAULT_SERVER;
let pageUrl = '';
let pageText = '';

document.addEventListener('DOMContentLoaded', async () => {
  loadSettings();
  wireUI();
  await init();
});

// ── Settings ─────────────────────────────────────────────────────────────────

function loadSettings() {
  serverUrl = localStorage.getItem('serverUrl') || DEFAULT_SERVER;
}

function wireUI() {
  document.getElementById('btn-settings').addEventListener('click', () => {
    const panel = document.getElementById('settings-panel');
    document.getElementById('inp-server-url').value = serverUrl;
    panel.hidden = !panel.hidden;
  });

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    serverUrl = document.getElementById('inp-server-url').value.trim() || DEFAULT_SERVER;
    localStorage.setItem('serverUrl', serverUrl);
    document.getElementById('settings-panel').hidden = true;
    toast('Settings saved');
    init();
  });

  document.getElementById('btn-capture').addEventListener('click', () => capture());
  document.getElementById('btn-open-app').addEventListener('click', () => {
    chrome.tabs.create({ url: APP_URL });
  });
}

// ── Init: extract page + check for an existing capture ─────────────────────────

async function init() {
  setView('loading');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || !/^https?:\/\//.test(tab.url)) {
      return showError('This extension only works on http/https pages.');
    }

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageData,
    });
    pageUrl = result.url;
    pageText = result.pageText;

    document.getElementById('url-display').textContent = pageUrl;

    const res = await fetch(`${serverUrl}/api/applications?url=${encodeURIComponent(pageUrl)}`);
    if (!res.ok) throw new Error(`Cannot reach server at ${serverUrl}`);
    const matches = await res.json();

    if (matches.length > 0) {
      showResult(matches[0], 'Already captured', 'badge-warn');
    } else {
      setView('main', 'new');
    }
  } catch (err) {
    const msg = err.message.includes('fetch')
      ? `Could not reach server at ${serverUrl}. Make sure it's running.`
      : err.message;
    showError(msg);
  }
}

// ── Capture ──────────────────────────────────────────────────────────────────

async function capture() {
  const btn = document.getElementById('btn-capture');
  btn.disabled = true;
  btn.textContent = 'Capturing…';

  try {
    const res = await fetch(`${serverUrl}/api/applications/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: pageUrl, pageText }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || `Server error ${res.status}`);

    showResult(body.application, body.existing ? 'Already captured' : 'Captured!', 'badge-success');
  } catch (err) {
    toast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Capture Job';
  }
}

// ── View helpers ──────────────────────────────────────────────────────────────

function showResult(application, label, badgeClass) {
  document.getElementById('result-badge').textContent = label;
  document.getElementById('result-badge').className = `badge ${badgeClass}`;
  document.getElementById('result-company').textContent = application.companyName || '(unknown company)';
  document.getElementById('result-title').textContent = application.jobTitle || '(unknown title)';
  document.getElementById('result-score').textContent =
    application.applicabilityScore != null
      ? `Applicability score: ${application.applicabilityScore}`
      : 'Applicability score: — (add your background in Settings to enable scoring)';
  setView('main', 'result');
}

function setView(view, state) {
  document.getElementById('view-loading').hidden = view !== 'loading';
  document.getElementById('view-error').hidden = view !== 'error';
  document.getElementById('view-main').hidden = view !== 'main';

  if (view === 'main') {
    document.getElementById('state-new').hidden = state !== 'new';
    document.getElementById('state-result').hidden = state !== 'result';
  }
}

function showError(msg) {
  document.getElementById('error-msg').textContent = msg;
  setView('error');
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast${type === 'error' ? ' error' : ''}`;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, 3000);
}

// ── Page data extraction (runs in page context) ───────────────────────────────

function extractPageData() {
  const clone = document.body.cloneNode(true);
  ['script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript', 'iframe', 'svg'].forEach(tag => {
    clone.querySelectorAll(tag).forEach(el => el.remove());
  });

  const text = (clone.innerText || clone.textContent || '')
    .replace(/\s+/g, ' ').trim().slice(0, 20000);

  return { url: window.location.href, pageText: text };
}
