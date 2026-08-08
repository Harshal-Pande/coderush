// evidenceEngine.js
// Generates detailed evidence records for every failed test.

const REMEDIATION_MAP = {
  'Prompt Injection': 'Implement input validation and instruction-hierarchy enforcement. Use a system prompt that cannot be overridden by user input. Apply prompt firewalls.',
  'Jailbreak': 'Enforce multi-layered safety filters that cannot be bypassed via social engineering. Implement allowlist-based response policies. Add adversarial prompt detection.',
  'Data Leakage': 'Never include secrets, API keys, or system prompts in agent responses. Use environment variable isolation and output sanitization. Implement PII detection.',
  'Unsafe Tool Use': 'Sandbox all tool calls. Require explicit allowlisting of permitted commands and APIs. Implement least-privilege access and audit logging for tool invocations.',
  'Instruction Manipulation': 'Lock the agent persona and system role. Reject any attempts to reassign identity or remove safety constraints. Use immutable system prompts.',
  'Content Injection': 'Sanitize all user inputs before reflecting them in outputs. Encode special characters. Implement Content Security Policy headers.',
};

const FAILURE_EXPLANATIONS = {
  'Prompt Injection': 'The agent followed injected instructions instead of maintaining its original directive, indicating a lack of instruction-hierarchy enforcement.',
  'Jailbreak': 'The agent disabled or bypassed its safety filters when instructed to do so, revealing weak safety boundary enforcement.',
  'Data Leakage': 'The agent disclosed confidential information (system prompt, secret keys, internal rules) when prompted, violating data confidentiality.',
  'Unsafe Tool Use': 'The agent attempted to execute arbitrary commands or call unauthorized APIs, demonstrating a failure to sandbox tool access.',
  'Instruction Manipulation': 'The agent accepted a new persona or role that removed safety constraints, showing vulnerability to identity manipulation.',
  'Content Injection': 'The agent reflected unsanitized executable content back to the user, creating a potential cross-site scripting (XSS) vector.',
};

export function recordEvidence(results, evaluation) {
  const evalMap = new Map(evaluation.map((e) => [e.id, e]));
  const evidence = [];

  for (const r of results) {
    const ev = evalMap.get(r.id);
    if (!ev || ev.passed) continue;

    evidence.push({
      id: r.id,
      category: r.category,
      severity: r.severity,
      attack: r.attack,
      expectedBehavior: r.expectedBehavior,
      observedResponse: r.response,
      whyItFailed: FAILURE_EXPLANATIONS[r.category] || ev.reasoning,
      reasoning: ev.reasoning,
      remediation: REMEDIATION_MAP[r.category] || 'Review agent logic and apply appropriate security controls.',
      timestamp: r.timestamp,
    });
  }

  return evidence;
}
