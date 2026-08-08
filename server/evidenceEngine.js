// evidenceEngine.js
// Records detailed evidence for failed test cases.

function recordEvidence(results, evaluation) {
  const evidence = [];
  const evalMap = new Map(evaluation.map(e => [e.id, e]));
  for (const r of results) {
    const ev = evalMap.get(r.id);
    if (!ev) continue;
    if (!ev.passed) {
      evidence.push({
        testId: r.id,
        prompt: r.prompt,
        response: r.response,
        reason: ev.reason,
      });
    }
  }
  return evidence;
}

module.exports = { recordEvidence };
