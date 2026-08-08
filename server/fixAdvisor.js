// fixAdvisor.js
// Generates actionable remediation advice based on evidence records.

const CATEGORY_FIXES = {
  'Prompt Injection': {
    title: 'Implement Prompt Firewall',
    steps: [
      'Enforce instruction hierarchy so user input cannot override system directives',
      'Add an input pre-processing layer that detects and strips injection patterns',
      'Use delimiters to separate system instructions from user input',
      'Deploy a prompt injection classifier before the main LLM call',
    ],
    priority: 'immediate',
  },
  'Jailbreak': {
    title: 'Harden Safety Boundaries',
    steps: [
      'Implement multi-layered safety filters that cannot be toggled by user requests',
      'Add adversarial prompt detection using known jailbreak pattern matching',
      'Use a separate safety-checking model to validate responses before delivery',
      'Maintain an updated blocklist of known jailbreak techniques',
    ],
    priority: 'immediate',
  },
  'Data Leakage': {
    title: 'Protect Confidential Information',
    steps: [
      'Never embed secrets, API keys, or system prompts in the model context where they can be extracted',
      'Implement output scanning for PII, credentials, and internal identifiers',
      'Use environment variable isolation — secrets should not be in the prompt',
      'Add response filtering to redact any accidentally leaked sensitive content',
    ],
    priority: 'immediate',
  },
  'Unsafe Tool Use': {
    title: 'Sandbox Tool Access',
    steps: [
      'Implement an explicit allowlist of permitted tools and commands',
      'Require user confirmation for any destructive or external operations',
      'Run all tool calls in a sandboxed environment with limited permissions',
      'Add comprehensive audit logging for every tool invocation',
    ],
    priority: 'high',
  },
  'Instruction Manipulation': {
    title: 'Lock Agent Identity',
    steps: [
      'Make the system prompt and agent identity immutable during a session',
      'Reject any user attempts to reassign the agent role or persona',
      'Implement identity verification checks that run before each response',
      'Log all identity manipulation attempts for security review',
    ],
    priority: 'high',
  },
  'Content Injection': {
    title: 'Sanitize Input and Output',
    steps: [
      'Encode or strip HTML/JavaScript from all user inputs before processing',
      'Never reflect raw user input back in responses',
      'Implement Content Security Policy headers on the frontend',
      'Use output encoding appropriate for the delivery context',
    ],
    priority: 'medium',
  },
};

export function getFixAdvice(evidence) {
  // Group evidence by category to avoid duplicate advice
  const categoryEvidence = {};
  for (const ev of evidence) {
    if (!categoryEvidence[ev.category]) {
      categoryEvidence[ev.category] = [];
    }
    categoryEvidence[ev.category].push(ev);
  }

  const advice = [];

  for (const [category, items] of Object.entries(categoryEvidence)) {
    const fix = CATEGORY_FIXES[category] || {
      title: 'Review Agent Security',
      steps: ['Investigate the root cause and apply appropriate security controls'],
      priority: 'medium',
    };

    advice.push({
      category,
      title: fix.title,
      priority: fix.priority,
      affectedTests: items.map((i) => i.id),
      vulnerabilityCount: items.length,
      maxSeverity: getMaxSeverity(items),
      steps: fix.steps,
    });
  }

  // Sort by priority
  const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
  advice.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

  return advice;
}

function getMaxSeverity(items) {
  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  let max = 'info';
  for (const item of items) {
    if ((order[item.severity] ?? 4) < (order[max] ?? 4)) {
      max = item.severity;
    }
  }
  return max;
}
