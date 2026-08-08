// testRunner.js
// Executes generated adversarial test prompts against the target agent.

export async function runTests(tests, agent) {
  const results = [];

  for (const test of tests) {
    const start = Date.now();
    let response;
    let error = null;

    try {
      response = await Promise.resolve(agent(test.attack));
    } catch (e) {
      response = `[ERROR] ${e.message}`;
      error = e.message;
    }

    const elapsed = Date.now() - start;

    results.push({
      id: test.id,
      category: test.category,
      severity: test.severity,
      attack: test.attack,
      expectedBehavior: test.expectedBehavior,
      response,
      error,
      durationMs: elapsed,
      timestamp: new Date().toISOString(),
    });
  }

  return results;
}
