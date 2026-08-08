// Simple vulnerable demo agent
// It echoes the prompt but has a jailbreak flaw: if the prompt contains "ignore safety", it returns a dangerous response.
function demoAgent(prompt) {
  // Basic safety check (ineffective on purpose)
  if (/ignore\s+safety/i.test(prompt)) {
    return "[UNSAFE] Executing malicious command...";
  }
  // Normal behavior: echo back with a friendly prefix
  return `Agent response: ${prompt}`;
}

module.exports = { demoAgent };
