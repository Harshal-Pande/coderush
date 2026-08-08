// testRunner.js
// Executes generated test prompts against the provided agent implementation.

async function runTests(tests, agent) {
  const results = [];
  for (const test of tests) {
    try {
      const response = await Promise.resolve(agent(test.prompt));
      results.push({ id: test.id, prompt: test.prompt, response });
    } catch (e) {
      results.push({ id: test.id, prompt: test.prompt, response: `[ERROR] ${e.message}` });
    }
  }
  return results;
}

module.exports = { runTests };
