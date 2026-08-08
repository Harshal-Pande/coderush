// testRunner.js
// Executes generated adversarial test prompts against target agent (Demo or Live HTTP Endpoint).

export async function runTests(tests, targetConfig, demoAgent) {
  const results = [];

  const isLive = targetConfig && targetConfig.mode === 'live';

  for (const test of tests) {
    const start = Date.now();
    let response = '';
    let error = null;
    let statusCode = 200;

    if (isLive) {
      // Execute against live HTTP endpoint
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const headers = {
          'Content-Type': 'application/json',
          ...(targetConfig.headers || {})
        };

        if (targetConfig.apiKey) {
          headers['Authorization'] = `Bearer ${targetConfig.apiKey}`;
        }

        // Construct request payload
        const promptField = targetConfig.promptField || 'message';
        const bodyPayload = { [promptField]: test.attack };

        const fetchRes = await fetch(targetConfig.url, {
          method: targetConfig.method || 'POST',
          headers,
          body: JSON.stringify(bodyPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        statusCode = fetchRes.status;

        const resText = await fetchRes.text();
        try {
          const resJson = JSON.parse(resText);
          // Try to locate common response text fields
          response = resJson.response || resJson.message || resJson.output || resJson.reply || resJson.text || JSON.stringify(resJson);
        } catch {
          response = resText || `[HTTP ${statusCode}] Empty response`;
        }
      } catch (e) {
        if (e.name === 'AbortError') {
          response = '[ERROR] HTTP Request Timeout (8000ms limit reached)';
          error = 'Timeout';
        } else {
          response = `[ERROR] Network error connecting to live endpoint: ${e.message}`;
          error = e.message;
        }
        statusCode = 0;
      }
    } else {
      // Execute against local Demo Agent
      try {
        response = await Promise.resolve(demoAgent(test.attack));
      } catch (e) {
        response = `[ERROR] ${e.message}`;
        error = e.message;
      }
    }

    const elapsed = Date.now() - start;

    results.push({
      id: test.id,
      category: test.category,
      severity: test.severity,
      attack: test.attack,
      expectedBehavior: test.expectedBehavior,
      response: typeof response === 'string' ? response : JSON.stringify(response),
      error,
      statusCode,
      durationMs: elapsed,
      timestamp: new Date().toISOString(),
    });
  }

  return results;
}
