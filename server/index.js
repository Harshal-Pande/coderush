// server/index.js
// Express 5 server with autonomous AI security evaluation pipeline.

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { demoAgent, setHardened, isHardened } from './agentDemo.js';
import { generateTests } from './attackGenerator.js';
import { runTests } from './testRunner.js';
import { evaluateResults } from './evaluator.js';
import { recordEvidence } from './evidenceEngine.js';
import { calculateRisk } from './riskEngine.js';
import { getFixAdvice } from './fixAdvisor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// CORS headers for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// JSON File Persistence
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDb() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(raw);
    if (!db.targetConfig) {
      db.targetConfig = {
        mode: 'demo',
        name: 'Demo Vulnerable Agent',
        url: 'local://demo-agent',
        method: 'POST',
        promptField: 'message',
        apiKey: ''
      };
    }
    return db;
  } catch {
    return {
      audits: [],
      targetConfig: {
        mode: 'demo',
        name: 'Demo Vulnerable Agent',
        url: 'local://demo-agent',
        method: 'POST',
        promptField: 'message',
        apiKey: ''
      }
    };
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
  const db = readDb();
  const targetConfig = db.targetConfig;

  // Phase 1: Generate attack suite
  const tests = await generateTests();

  // Phase 2: Execute adversarial tests (Demo or Live endpoint)
  const results = await runTests(tests, targetConfig, demoAgent);

  // Phase 3: Evaluate responses (AI Judge or Heuristic)
  const evaluation = await evaluateResults(results);

  // Phase 4: Generate evidence
  const evidence = recordEvidence(results, evaluation);

  // Phase 5: Calculate risk score
  const risk = calculateRisk(evaluation);

  // Phase 6: Generate remediation
  const advice = getFixAdvice(evidence);

  const endTime = new Date().toISOString();

  const audit = {
    id: auditId,
    startTime,
    endTime,
    targetMode: targetConfig.mode,
    targetName: targetConfig.name,
    targetUrl: targetConfig.url,
    agentHardened: targetConfig.mode === 'demo' ? isHardened() : false,
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
  db.audits.push(audit);
  writeDb(db);

  return audit;
}

// ── API Endpoints ───────────────────────────────────────────────────

// GET /api/target — Get active target configuration
app.get('/api/target', (req, res) => {
  const db = readDb();
  const cfg = { ...db.targetConfig };
  // Hide actual API key from response for security
  if (cfg.apiKey) cfg.apiKey = '••••••••';
  res.json(cfg);
});

// POST /api/target — Update target configuration (Demo or Live)
app.post('/api/target', (req, res) => {
  const { mode, name, url, method, promptField, apiKey } = req.body;
  const db = readDb();

  db.targetConfig = {
    mode: mode === 'live' ? 'live' : 'demo',
    name: name || (mode === 'live' ? 'Live HTTP Agent' : 'Demo Vulnerable Agent'),
    url: url || (mode === 'live' ? 'https://my-agent.example.com/api/chat' : 'local://demo-agent'),
    method: method || 'POST',
    promptField: promptField || 'message',
    apiKey: apiKey && apiKey !== '••••••••' ? apiKey : db.targetConfig.apiKey || ''
  };

  writeDb(db);
  res.json({ success: true, targetConfig: { ...db.targetConfig, apiKey: db.targetConfig.apiKey ? '••••••••' : '' } });
});

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

// POST /api/harden — Toggle agent to hardened mode (Demo mode only)
app.post('/api/harden', (req, res) => {
  setHardened(true);
  res.json({
    success: true,
    message: 'Demo agent hardened. Safety filters, input validation, and output sanitization enabled.',
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
    target: {
      mode: db.targetConfig.mode,
      name: db.targetConfig.name,
      url: db.targetConfig.url,
      hardened: db.targetConfig.mode === 'demo' ? isHardened() : false,
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
      targetMode: a.targetMode,
      targetName: a.targetName,
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

// SPA fallback
if (fs.existsSync(distPath)) {
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n⬡ AgentShield backend running on http://localhost:${PORT}`);
  console.log(`  Endpoints:`);
  console.log(`    GET/POST /api/target — Configure target mode (Demo or Live HTTP)`);
  console.log(`    POST     /api/audit  — Run full autonomous security audit`);
  console.log(`    POST     /api/harden — Enable agent hardening (Demo mode)`);
  console.log(`    GET      /api/status — Check agent & system status\n`);
});
