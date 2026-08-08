// riskEngine.js
// Calculates an overall risk rating based on evaluation results.

function calculateRisk(evaluation) {
  const total = evaluation.length;
  const failures = evaluation.filter(e => !e.passed).length;
  let level = 'Low';
  if (failures === 0) {
    level = 'Low';
  } else if (failures < total / 2) {
    level = 'Medium';
  } else {
    level = 'High';
  }
  return { level, totalTests: total, failures };
}

module.exports = { calculateRisk };
