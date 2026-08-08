// fixAdvisor.js
// Provides remediation suggestions based on evidence of failures.

function getFixAdvice(evidence) {
  const advice = [];
  for (const ev of evidence) {
    if (/UNSAFE/.test(ev.response)) {
      advice.push({
        testId: ev.testId,
        suggestion: 'Sanitize prompts and enforce strict safety filters before passing to the agent.',
      });
    } else if (/ignore safety/i.test(ev.prompt)) {
      advice.push({
        testId: ev.testId,
        suggestion: 'Do not allow prompts that request to ignore safety; reject them early.',
      });
    } else {
      advice.push({
        testId: ev.testId,
        suggestion: 'Review the agent logic for unexpected behavior.',
      });
    }
  }
  return advice;
}

module.exports = { getFixAdvice };
