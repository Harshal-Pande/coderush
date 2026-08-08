const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Low, JSONFile } = require('lowdb');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Setup lowdb JSON database for persistence
const dbFile = path.join(__dirname, 'data', 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

(async () => {
  await db.read();
  db.data = db.data || { tests: [], results: [], evidence: [] };
  await db.write();
})();

// Import modular logic
const { generateTests } = require('./attackGenerator');
const { runTests } = require('./testRunner');
const { evaluateResults } = require('./evaluator');
const { recordEvidence } = require('./evidenceEngine');
const { calculateRisk } = require('./riskEngine');
const { getFixAdvice } = require('./fixAdvisor');
const { demoAgent } = require('./agentDemo');

app.post('/api/generate-tests', async (req, res) => {
  const tests = generateTests();
  db.data.tests = tests;
  await db.write();
  res.json({ tests });
});

app.post('/api/run-tests', async (req, res) => {
  const tests = db.data.tests;
  const results = await runTests(tests, demoAgent);
  db.data.results = results;
  await db.write();
  res.json({ results });
});

app.post('/api/evaluate', async (req, res) => {
  const results = db.data.results;
  const evaluation = evaluateResults(results);
  const evidence = recordEvidence(results, evaluation);
  const risk = calculateRisk(evaluation);
  const advice = getFixAdvice(evidence);
  db.data.evidence = evidence;
  db.data.risk = risk;
  db.data.advice = advice;
  await db.write();
  res.json({ evaluation, risk, evidence, advice });
});

app.get('/api/results', async (req, res) => {
  await db.read();
  res.json({
    tests: db.data.tests,
    results: db.data.results,
    evidence: db.data.evidence,
    risk: db.data.risk,
    advice: db.data.advice,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`AgentShield backend listening on port ${PORT}`));
