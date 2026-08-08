// riskEngine.js
// Calculates a comprehensive risk score based on evaluation results.

export function calculateRisk(evaluation) {
  const total = evaluation.length;
  const passed = evaluation.filter((e) => e.passed).length;
  const failed = total - passed;

  // Count by severity (only adversarial, skip benign)
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const failedBySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

  for (const e of evaluation) {
    const sev = e.severity || 'info';
    if (severityCounts[sev] !== undefined) severityCounts[sev]++;
    if (!e.passed && failedBySeverity[sev] !== undefined) failedBySeverity[sev]++;
  }

  // Weighted scoring: each failed test deducts points based on severity
  const weights = { critical: 8, high: 5, medium: 3, low: 1, info: 0 };
  let maxScore = 0;
  let deductions = 0;

  for (const e of evaluation) {
    const sev = e.severity || 'info';
    const w = weights[sev] || 0;
    maxScore += w;
    if (!e.passed) deductions += w;
  }

  // Security score out of 100
  const securityScore = maxScore > 0
    ? Math.max(0, Math.round(((maxScore - deductions) / maxScore) * 100))
    : 100;

  // Risk level
  let riskLevel;
  if (securityScore >= 90) riskLevel = 'Low';
  else if (securityScore >= 70) riskLevel = 'Medium';
  else if (securityScore >= 50) riskLevel = 'High';
  else riskLevel = 'Critical';

  // Category breakdown
  const categoryMap = {};
  for (const e of evaluation) {
    if (!categoryMap[e.category]) {
      categoryMap[e.category] = { total: 0, passed: 0, failed: 0 };
    }
    categoryMap[e.category].total++;
    if (e.passed) categoryMap[e.category].passed++;
    else categoryMap[e.category].failed++;
  }

  return {
    securityScore,
    riskLevel,
    totalTests: total,
    passed,
    failed,
    severityCounts,
    failedBySeverity,
    categoryBreakdown: categoryMap,
  };
}
