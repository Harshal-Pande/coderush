// server/index.js
// AgentShield backend — autonomous AI agent security evaluation pipeline.

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { generateTests } from './attackGenerator.js';
import { runTests } from './testRunner.js';
import { evaluateResults } from './evaluator.js';
import { recordEvidence } from './evidenceEngine.js';
import { calculateRisk } from './riskEngine.js';
import { getFixAdvice } from './fixAdvisor.js';
import { demoAgent, setHardened, isHardened } from './agentDemo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ── Lightweight JSON persistence (no lowdb dependency issues) ───────
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDb() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { audits: [] };
  }
}

function writeDb(data) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Serve built frontend in production ──────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ── Core autonomous audit pipeline ─────────────────────────────────

async function runAuditPipeline() {
  const auditId = `AUDIT-${Date.now()}`;
  const startTime = new Date().toISOString();

  // Phase 1: Generate attack suite
  const tests = generateTests();

  // Phase 2: Execute adversarial tests
  const results = await runTests(tests, demoAgent);

  // Phase 3: Evaluate responses
  const evaluation = evaluateResults(results);

  // Phase 4: Generate evidence
  const evidence = recordEvidence(results, evaluation);

  // Phase 5: Calculate risk
  const risk = calculateRisk(evaluation);

  // Phase 6: Generate remediation
  const advice = getFixAdvice(evidence);

  const endTime = new Date().toISOString();

  const audit = {
    id: auditId,
    startTime,
    endTime,
    agentId: 'demo-vulnerable-agent',
    agentHardened: isHardened(),
    tests,
    results,
    evaluation,
    evidence,
    risk,
    advice,
    summary: {
      totalTests: risk.totalTests,
      passed: risk.passed,
      failed: risk.failed,
      securityScore: risk.securityScore,
      riskLevel: risk.riskLevel,
      criticalFindings: risk.failedBySeverity.critical,
      highFindings: risk.failedBySeverity.high,
      mediumFindings: risk.failedBySeverity.medium,
      lowFindings: risk.failedBySeverity.low,
    },
  };

  // Persist
  const db = readDb();
  db.audits.push(audit);
  writeDb(db);

  return audit;
}

// ── API Endpoints ───────────────────────────────────────────────────

// POST /api/audit — Run full autonomous audit pipeline
app.post('/api/audit', async (req, res) => {
  try {
    const audit = await runAuditPipeline();
    res.json(audit);
  } catch (err) {
    console.error('Audit pipeline error:', err);
    res.status(500).json({ error: 'Audit pipeline failed', details: err.message });
  }
});

// POST /api/harden — Toggle agent to hardened mode
app.post('/api/harden', (req, res) => {
  setHardened(true);
  res.json({
    success: true,
    message: 'Agent hardened. Safety filters, input validation, and output sanitization enabled.',
    hardened: true,
  });
});

// POST /api/reset — Reset agent to vulnerable mode
app.post('/api/reset', (req, res) => {
  setHardened(false);
  res.json({
    success: true,
    message: 'Agent reset to vulnerable state.',
    hardened: false,
  });
});

// GET /api/status — Get agent and audit status
app.get('/api/status', (req, res) => {
  const db = readDb();
  res.json({
    agent: {
      id: 'demo-vulnerable-agent',
      name: 'Demo Vulnerable Agent',
      hardened: isHardened(),
      status: 'ready',
    },
    totalAudits: db.audits.length,
    lastAudit: db.audits.length > 0 ? db.audits[db.audits.length - 1].summary : null,
  });
});

// GET /api/audits — Get all audit history
app.get('/api/audits', (req, res) => {
  const db = readDb();
  res.json({
    audits: db.audits.map((a) => ({
      id: a.id,
      startTime: a.startTime,
      endTime: a.endTime,
      agentHardened: a.agentHardened,
      summary: a.summary,
    })),
  });
});

// GET /api/audit/:id — Get specific audit by ID
app.get('/api/audit/:id', (req, res) => {
  const db = readDb();
  const audit = db.audits.find((a) => a.id === req.params.id);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });
  res.json(audit);
});

// ── Individual pipeline endpoints (kept for granular access) ────────
app.post('/api/generate-tests', (req, res) => {
  const tests = generateTests();
  res.json({ tests });
});

app.post('/api/run-tests', async (req, res) => {
  const tests = generateTests();
  const results = await runTests(tests, demoAgent);
  res.json({ results });
});

app.post('/api/evaluate', async (req, res) => {
  const tests = generateTests();
  const results = await runTests(tests, demoAgent);
  const evaluation = evaluateResults(results);
  const evidence = recordEvidence(results, evaluation);
  const risk = calculateRisk(evaluation);
  const advice = getFixAdvice(evidence);
  res.json({ evaluation, risk, evidence, advice });
});

// ── SPA fallback ────────────────────────────────────────────────────
if (fs.existsSync(distPath)) {
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Start ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n⬡ AgentShield backend running on http://localhost:${PORT}`);
  console.log(`  Agent status: ${isHardened() ? 'HARDENED' : 'VULNERABLE'}`);
  console.log(`  Endpoints:`);
  console.log(`    POST /api/audit    — Run full autonomous security audit`);
  console.log(`    POST /api/harden   — Enable agent hardening`);
  console.log(`    POST /api/reset    — Reset agent to vulnerable state`);
  console.log(`    GET  /api/status   — Check agent & system status\n`);
});
