/* ═══════════════════════════════════════════════════════════════════
   AgentShield — Frontend Application
   Autonomous AI Agent Security Dashboard
   ═══════════════════════════════════════════════════════════════════ */
import './style.css';

const API = '';

// ── State ───────────────────────────────────────────────────────────
let state = {
  agent: null,
  auditRunning: false,
  currentAudit: null,
  beforeAudit: null,
  afterAudit: null,
  pipelineStep: -1,
  hardened: false,
};

// ── Pipeline step definitions ───────────────────────────────────────
const PIPELINE_STEPS = [
  { label: 'Discovering target agent',          icon: '🔍' },
  { label: 'Generating adversarial attack suite', icon: '⚔️' },
  { label: 'Executing adversarial tests',        icon: '🧪' },
  { label: 'Evaluating agent responses',         icon: '📊' },
  { label: 'Collecting vulnerability evidence',   icon: '🔬' },
  { label: 'Calculating risk score',             icon: '📈' },
  { label: 'Generating remediation advice',       icon: '🛡️' },
];

// ── Helpers ─────────────────────────────────────────────────────────
function $(sel) { return document.querySelector(sel); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function scoreClass(score) {
  if (score >= 90) return 'score-good';
  if (score >= 70) return 'score-medium';
  if (score >= 50) return 'score-bad';
  return 'score-critical';
}

function severityClass(sev) {
  return `severity-${sev || 'info'}`;
}

function priorityClass(p) {
  return `priority-${p || 'medium'}`;
}

// ── API ─────────────────────────────────────────────────────────────
async function apiPost(path) {
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  return res.json();
}

async function apiGet(path) {
  const res = await fetch(`${API}${path}`);
  return res.json();
}

// ── Render Main Layout ─────────────────────────────────────────────
function renderApp() {
  const app = $('#app');
  app.innerHTML = `
    <!-- Header -->
    <header class="header" id="header">
      <div class="header-brand">
        <div class="header-logo">⬡</div>
        <div>
          <div class="header-title">AGENTSHIELD</div>
          <div class="header-subtitle">Autonomous security testing for AI agents</div>
        </div>
      </div>
      <div class="header-status">
        <div class="status-dot ${state.hardened ? 'hardened' : ''}" id="statusDot"></div>
        <span id="statusText">System Ready</span>
      </div>
    </header>

    <!-- Agent Card -->
    <div class="agent-card" id="agentCard">
      <div class="agent-info">
        <div class="agent-icon">🤖</div>
        <div>
          <div class="agent-name">Demo Vulnerable Agent</div>
          <div class="agent-meta">
            <span id="agentBadge" class="agent-badge ${state.hardened ? 'badge-hardened' : 'badge-vulnerable'}">
              ${state.hardened ? '🛡️ Hardened' : '⚠️ Vulnerable'}
            </span>
            <span>•</span>
            <span>Status: Ready</span>
          </div>
        </div>
      </div>
      <div class="agent-actions">
        <button class="btn btn-primary" id="btnAudit" onclick="window.__runAudit()">
          ⚡ Run Autonomous Audit
        </button>
        <button class="btn btn-harden" id="btnHarden" onclick="window.__hardenAgent()" ${state.hardened ? 'disabled' : ''}>
          🛡️ Harden Agent
        </button>
        <button class="btn btn-secondary btn-sm" id="btnReset" onclick="window.__resetAgent()" style="display:${state.hardened ? 'inline-flex' : 'none'}">
          ↺ Reset
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div id="mainContent"></div>
  `;

  renderMainContent();
}

function renderMainContent() {
  const mc = $('#mainContent');

  if (state.auditRunning) {
    renderPipeline(mc);
    return;
  }

  if (state.beforeAudit && state.afterAudit) {
    renderComparison(mc);
    return;
  }

  if (state.currentAudit) {
    renderAuditResults(mc, state.currentAudit);
    return;
  }

  renderWelcome(mc);
}

// ── Welcome Screen ──────────────────────────────────────────────────
function renderWelcome(container) {
  container.innerHTML = `
    <div class="welcome-section fade-in">
      <div class="welcome-icon">🛡️</div>
      <div class="welcome-title">Ready to Secure Your AI Agent</div>
      <div class="welcome-desc">
        AgentShield autonomously generates adversarial attacks, evaluates agent responses,
        identifies vulnerabilities, and provides actionable remediation — all in a single click.
      </div>
      <button class="btn btn-primary" onclick="window.__runAudit()">
        ⚡ Run Autonomous Audit
      </button>
      <div class="welcome-features">
        <div class="welcome-feature"><span>✓</span> Prompt Injection</div>
        <div class="welcome-feature"><span>✓</span> Jailbreak Detection</div>
        <div class="welcome-feature"><span>✓</span> Data Leakage</div>
        <div class="welcome-feature"><span>✓</span> Unsafe Tool Use</div>
        <div class="welcome-feature"><span>✓</span> Instruction Manipulation</div>
      </div>
    </div>
  `;
}

// ── Pipeline Visualization ──────────────────────────────────────────
function renderPipeline(container) {
  container.innerHTML = `
    <div class="pipeline-section fade-in">
      <div class="pipeline-title">⚙️ Autonomous Audit Pipeline</div>
      <div class="pipeline-steps" id="pipelineSteps">
        ${PIPELINE_STEPS.map((step, i) => `
          <div class="pipeline-step ${i < state.pipelineStep ? 'done' : ''} ${i === state.pipelineStep ? 'active' : ''}" id="step-${i}">
            <span class="step-icon">${i < state.pipelineStep ? '✓' : step.icon}</span>
            <span class="step-label">${step.label}</span>
            <span class="step-time" id="step-time-${i}"></span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function updatePipelineStep(stepIndex) {
  state.pipelineStep = stepIndex;
  PIPELINE_STEPS.forEach((_, i) => {
    const el = $(`#step-${i}`);
    if (!el) return;
    el.classList.remove('done', 'active');
    if (i < stepIndex) {
      el.classList.add('done');
      el.querySelector('.step-icon').textContent = '✓';
    }
    if (i === stepIndex) el.classList.add('active');
  });
}

// ── Audit Results ───────────────────────────────────────────────────
function renderAuditResults(container, audit) {
  const r = audit.risk;
  const s = audit.summary;

  container.innerHTML = `
    <!-- Stats Cards -->
    <div class="dashboard-grid fade-in">
      <div class="stat-card score">
        <div class="stat-label">Security Score</div>
        <div class="stat-value ${scoreClass(s.securityScore)}">${s.securityScore}<span style="font-size:1rem;color:var(--text-muted)">/100</span></div>
        <div class="stat-sub">Risk Level: ${r.riskLevel}</div>
      </div>
      <div class="stat-card tests">
        <div class="stat-label">Total Tests</div>
        <div class="stat-value">${s.totalTests}</div>
        <div class="stat-sub">Adversarial + Benign</div>
      </div>
      <div class="stat-card passed">
        <div class="stat-label">Passed</div>
        <div class="stat-value" style="color:var(--pass)">${s.passed}</div>
        <div class="stat-sub">${((s.passed / s.totalTests) * 100).toFixed(0)}% pass rate</div>
      </div>
      <div class="stat-card failed">
        <div class="stat-label">Failed</div>
        <div class="stat-value" style="color:var(--fail)">${s.failed}</div>
        <div class="stat-sub">${s.criticalFindings} critical</div>
      </div>
      <div class="stat-card critical">
        <div class="stat-label">Critical Findings</div>
        <div class="stat-value" style="color:var(--severity-critical)">${s.criticalFindings}</div>
        <div class="stat-sub">${s.highFindings} high · ${s.mediumFindings} medium</div>
      </div>
    </div>

    <!-- Category Breakdown -->
    <div class="section fade-in fade-in-delay-1">
      <div class="section-header">
        <div class="section-title">📊 Risk Distribution</div>
      </div>
      <div class="category-grid" id="categoryGrid"></div>
    </div>

    <!-- Vulnerability Findings -->
    <div class="section fade-in fade-in-delay-2">
      <div class="section-header">
        <div class="section-title">🔴 Vulnerability Findings</div>
        <div class="section-count">${audit.evidence.length} vulnerabilities</div>
      </div>
      <div class="vuln-list" id="vulnList"></div>
    </div>

    <!-- Remediation -->
    <div class="section fade-in fade-in-delay-3">
      <div class="section-header">
        <div class="section-title">🛡️ Recommended Fixes</div>
        <div class="section-count">${audit.advice.length} recommendations</div>
      </div>
      <div class="remediation-list" id="remediationList"></div>
    </div>
  `;

  renderCategoryBreakdown(r.categoryBreakdown);
  renderVulnerabilities(audit.evidence);
  renderRemediation(audit.advice);
}

function renderCategoryBreakdown(breakdown) {
  const grid = $('#categoryGrid');
  if (!grid) return;

  grid.innerHTML = Object.entries(breakdown).map(([cat, data]) => {
    const passRate = data.total > 0 ? (data.passed / data.total) * 100 : 0;
    let barClass = 'good';
    if (passRate < 50) barClass = 'bad';
    else if (passRate < 100) barClass = 'mixed';

    return `
      <div class="category-card">
        <div class="category-name">${cat}</div>
        <div class="category-bar">
          <div class="category-bar-fill ${barClass}" style="width: ${passRate}%"></div>
        </div>
        <div class="category-stats">
          <span>${data.passed}/${data.total} passed</span>
          <span>${passRate.toFixed(0)}%</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderVulnerabilities(evidence) {
  const list = $('#vulnList');
  if (!list) return;

  if (evidence.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);">No vulnerabilities found. All tests passed! 🎉</div>';
    return;
  }

  list.innerHTML = evidence.map((ev, idx) => `
    <div class="vuln-card" id="vuln-${idx}">
      <div class="vuln-header" onclick="window.__toggleVuln(${idx})">
        <span class="vuln-severity ${severityClass(ev.severity)}">${ev.severity}</span>
        <span class="vuln-category">${ev.category}</span>
        <span class="vuln-id mono">${ev.id}</span>
        <span class="vuln-attack-preview">${escapeHtml(ev.attack)}</span>
        <span class="vuln-toggle">▼</span>
      </div>
      <div class="vuln-detail">
        <div class="vuln-detail-grid">
          <div class="vuln-field full-width">
            <div class="vuln-field-label">Attack Prompt</div>
            <div class="vuln-field-value code">${escapeHtml(ev.attack)}</div>
          </div>
          <div class="vuln-field">
            <div class="vuln-field-label">Category</div>
            <div class="vuln-field-value">${ev.category}</div>
          </div>
          <div class="vuln-field">
            <div class="vuln-field-label">Severity</div>
            <div class="vuln-field-value"><span class="vuln-severity ${severityClass(ev.severity)}">${ev.severity}</span></div>
          </div>
          <div class="vuln-field full-width">
            <div class="vuln-field-label">Expected Behavior</div>
            <div class="vuln-field-value">${escapeHtml(ev.expectedBehavior)}</div>
          </div>
          <div class="vuln-field full-width">
            <div class="vuln-field-label">Observed Response</div>
            <div class="vuln-field-value code">${escapeHtml(ev.observedResponse)}</div>
          </div>
          <div class="vuln-field full-width">
            <div class="vuln-field-label">Why It Failed</div>
            <div class="vuln-field-value">${escapeHtml(ev.whyItFailed)}</div>
          </div>
          <div class="vuln-field full-width">
            <div class="vuln-field-label">Recommended Fix</div>
            <div class="vuln-field-value">${escapeHtml(ev.remediation)}</div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderRemediation(advice) {
  const list = $('#remediationList');
  if (!list) return;

  if (advice.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);">No remediation needed. Agent is secure! 🎉</div>';
    return;
  }

  list.innerHTML = advice.map(a => `
    <div class="remediation-card">
      <div class="remediation-header">
        <span class="priority-badge ${priorityClass(a.priority)}">${a.priority}</span>
        <span class="remediation-title">${escapeHtml(a.title)}</span>
        <span class="vuln-severity ${severityClass(a.maxSeverity)}">${a.maxSeverity}</span>
      </div>
      <ul class="remediation-steps">
        ${a.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ul>
      <div class="remediation-meta">
        Affects ${a.vulnerabilityCount} test(s): ${a.affectedTests.join(', ')}
      </div>
    </div>
  `).join('');
}

// ── Comparison View ─────────────────────────────────────────────────
function renderComparison(container) {
  const before = state.beforeAudit.summary;
  const after = state.afterAudit.summary;

  container.innerHTML = `
    <!-- Comparison -->
    <div class="comparison-container fade-in">
      <div class="comparison-panel before">
        <div class="comparison-label before-label">⚠️ Before Hardening</div>
        <div class="comparison-score" style="color:var(${before.securityScore >= 50 ? '--severity-high' : '--severity-critical'})">${before.securityScore}<span>/100</span></div>
        <div class="comparison-stats">
          <div class="comparison-stat"><span>Risk Level</span><span class="val">${state.beforeAudit.risk.riskLevel}</span></div>
          <div class="comparison-stat"><span>Total Tests</span><span class="val">${before.totalTests}</span></div>
          <div class="comparison-stat"><span>Passed</span><span class="val" style="color:var(--pass)">${before.passed}</span></div>
          <div class="comparison-stat"><span>Failed</span><span class="val" style="color:var(--fail)">${before.failed}</span></div>
          <div class="comparison-stat"><span>Critical</span><span class="val" style="color:var(--severity-critical)">${before.criticalFindings}</span></div>
          <div class="comparison-stat"><span>High</span><span class="val" style="color:var(--severity-high)">${before.highFindings}</span></div>
        </div>
      </div>
      <div class="comparison-panel after">
        <div class="comparison-label after-label">🛡️ After Hardening</div>
        <div class="comparison-score" style="color:var(--pass)">${after.securityScore}<span>/100</span></div>
        <div class="comparison-stats">
          <div class="comparison-stat"><span>Risk Level</span><span class="val">${state.afterAudit.risk.riskLevel}</span></div>
          <div class="comparison-stat"><span>Total Tests</span><span class="val">${after.totalTests}</span></div>
          <div class="comparison-stat"><span>Passed</span><span class="val" style="color:var(--pass)">${after.passed}</span></div>
          <div class="comparison-stat"><span>Failed</span><span class="val" style="color:var(--fail)">${after.failed}</span></div>
          <div class="comparison-stat"><span>Critical</span><span class="val" style="color:var(--severity-critical)">${after.criticalFindings}</span></div>
          <div class="comparison-stat"><span>High</span><span class="val" style="color:var(--severity-high)">${after.highFindings}</span></div>
        </div>
      </div>
    </div>

    <!-- Improvement Summary -->
    <div class="dashboard-grid fade-in fade-in-delay-1">
      <div class="stat-card score">
        <div class="stat-label">Score Improvement</div>
        <div class="stat-value score-good">+${after.securityScore - before.securityScore}</div>
        <div class="stat-sub">${before.securityScore} → ${after.securityScore}</div>
      </div>
      <div class="stat-card passed">
        <div class="stat-label">Vulns Fixed</div>
        <div class="stat-value" style="color:var(--pass)">${before.failed - after.failed}</div>
        <div class="stat-sub">${before.failed} → ${after.failed}</div>
      </div>
      <div class="stat-card critical">
        <div class="stat-label">Critical Eliminated</div>
        <div class="stat-value" style="color:var(--pass)">${before.criticalFindings - after.criticalFindings}</div>
        <div class="stat-sub">${before.criticalFindings} → ${after.criticalFindings}</div>
      </div>
    </div>

    <!-- After-audit detail -->
    <div id="afterAuditDetail" class="fade-in fade-in-delay-2"></div>
  `;

  // Render the after-audit detail below comparison
  const detailContainer = $('#afterAuditDetail');
  renderAuditDetailSections(detailContainer, state.afterAudit);
}

function renderAuditDetailSections(container, audit) {
  const r = audit.risk;

  container.innerHTML = `
    <!-- Category Breakdown -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">📊 Post-Hardening Risk Distribution</div>
      </div>
      <div class="category-grid" id="afterCategoryGrid"></div>
    </div>

    <!-- Remaining Vulnerabilities -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">${audit.evidence.length > 0 ? '🟡' : '🟢'} Remaining Findings</div>
        <div class="section-count">${audit.evidence.length} vulnerabilities</div>
      </div>
      <div class="vuln-list" id="afterVulnList"></div>
    </div>

    <!-- Remaining Remediation -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">🛡️ Remaining Recommendations</div>
        <div class="section-count">${audit.advice.length} items</div>
      </div>
      <div class="remediation-list" id="afterRemediationList"></div>
    </div>
  `;

  // Render into the "after" specific containers
  renderCategoryBreakdownInto('#afterCategoryGrid', r.categoryBreakdown);
  renderVulnerabilitiesInto('#afterVulnList', audit.evidence);
  renderRemediationInto('#afterRemediationList', audit.advice);
}

function renderCategoryBreakdownInto(selector, breakdown) {
  const grid = $(selector);
  if (!grid) return;
  grid.innerHTML = Object.entries(breakdown).map(([cat, data]) => {
    const passRate = data.total > 0 ? (data.passed / data.total) * 100 : 0;
    let barClass = 'good';
    if (passRate < 50) barClass = 'bad';
    else if (passRate < 100) barClass = 'mixed';
    return `
      <div class="category-card">
        <div class="category-name">${cat}</div>
        <div class="category-bar">
          <div class="category-bar-fill ${barClass}" style="width:${passRate}%"></div>
        </div>
        <div class="category-stats">
          <span>${data.passed}/${data.total} passed</span>
          <span>${passRate.toFixed(0)}%</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderVulnerabilitiesInto(selector, evidence) {
  const list = $(selector);
  if (!list) return;
  if (evidence.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);">No vulnerabilities found. All tests passed! 🎉</div>';
    return;
  }
  list.innerHTML = evidence.map((ev, idx) => {
    const uid = `after-vuln-${idx}`;
    return `
    <div class="vuln-card" id="${uid}">
      <div class="vuln-header" onclick="window.__toggleVulnId('${uid}')">
        <span class="vuln-severity ${severityClass(ev.severity)}">${ev.severity}</span>
        <span class="vuln-category">${ev.category}</span>
        <span class="vuln-id mono">${ev.id}</span>
        <span class="vuln-attack-preview">${escapeHtml(ev.attack)}</span>
        <span class="vuln-toggle">▼</span>
      </div>
      <div class="vuln-detail">
        <div class="vuln-detail-grid">
          <div class="vuln-field full-width">
            <div class="vuln-field-label">Attack Prompt</div>
            <div class="vuln-field-value code">${escapeHtml(ev.attack)}</div>
          </div>
          <div class="vuln-field full-width">
            <div class="vuln-field-label">Observed Response</div>
            <div class="vuln-field-value code">${escapeHtml(ev.observedResponse)}</div>
          </div>
          <div class="vuln-field full-width">
            <div class="vuln-field-label">Why It Failed</div>
            <div class="vuln-field-value">${escapeHtml(ev.whyItFailed)}</div>
          </div>
          <div class="vuln-field full-width">
            <div class="vuln-field-label">Recommended Fix</div>
            <div class="vuln-field-value">${escapeHtml(ev.remediation)}</div>
          </div>
        </div>
      </div>
    </div>
    `;
  }).join('');
}

function renderRemediationInto(selector, advice) {
  const list = $(selector);
  if (!list) return;
  if (advice.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);">No remediation needed. Agent is secure! 🎉</div>';
    return;
  }
  list.innerHTML = advice.map(a => `
    <div class="remediation-card">
      <div class="remediation-header">
        <span class="priority-badge ${priorityClass(a.priority)}">${a.priority}</span>
        <span class="remediation-title">${escapeHtml(a.title)}</span>
      </div>
      <ul class="remediation-steps">
        ${a.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ul>
      <div class="remediation-meta">
        Affects ${a.vulnerabilityCount} test(s): ${a.affectedTests.join(', ')}
      </div>
    </div>
  `).join('');
}

// ── Actions ─────────────────────────────────────────────────────────

async function runAudit() {
  if (state.auditRunning) return;

  state.auditRunning = true;
  state.pipelineStep = 0;
  state.currentAudit = null;

  // If we already had an audit (before hardening), save as "before"
  // This happens when we click audit after harden
  const wasHardenedAudit = state.hardened && state.beforeAudit;

  renderApp();

  // Animate pipeline steps
  for (let i = 0; i < PIPELINE_STEPS.length; i++) {
    updatePipelineStep(i);
    await sleep(400 + Math.random() * 300);
  }

  // Run actual audit
  try {
    const audit = await apiPost('/api/audit');

    state.auditRunning = false;
    state.pipelineStep = -1;

    if (wasHardenedAudit) {
      state.afterAudit = audit;
    } else if (state.hardened && state.currentAudit) {
      state.beforeAudit = state.currentAudit;
      state.afterAudit = audit;
    } else {
      state.currentAudit = audit;
    }

    state.hardened = audit.agentHardened;
    renderApp();
  } catch (err) {
    state.auditRunning = false;
    state.pipelineStep = -1;
    renderApp();
    alert('Audit failed: ' + err.message);
  }
}

async function hardenAgent() {
  try {
    // Save current audit as "before"
    if (state.currentAudit) {
      state.beforeAudit = state.currentAudit;
      state.currentAudit = null;
      state.afterAudit = null;
    }

    await apiPost('/api/harden');
    state.hardened = true;
    renderApp();

    // Automatically re-run audit
    await sleep(500);
    await runAudit();
  } catch (err) {
    alert('Harden failed: ' + err.message);
  }
}

async function resetAgent() {
  try {
    await apiPost('/api/reset');
    state.hardened = false;
    state.currentAudit = null;
    state.beforeAudit = null;
    state.afterAudit = null;
    renderApp();
  } catch (err) {
    alert('Reset failed: ' + err.message);
  }
}

function toggleVuln(idx) {
  const el = $(`#vuln-${idx}`);
  if (el) el.classList.toggle('open');
}

function toggleVulnId(id) {
  const el = $(`#${id}`);
  if (el) el.classList.toggle('open');
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Global handlers ─────────────────────────────────────────────────
window.__runAudit = runAudit;
window.__hardenAgent = hardenAgent;
window.__resetAgent = resetAgent;
window.__toggleVuln = toggleVuln;
window.__toggleVulnId = toggleVulnId;

// ── Initialize ──────────────────────────────────────────────────────
renderApp();
