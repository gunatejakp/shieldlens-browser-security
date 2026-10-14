/**
 * ShieldLens — Unified Security Risk Engine
 * Aggregates signals from HoverGuard, FileGuard, and Download Guard into explainable risk assessments.
 */

import { RISK_LEVELS } from '../shared/constants.js';

/**
 * Calculates a unified security risk score and explanation.
 * @param {object} params 
 * @param {object} [params.urlAnalysis] — Output from url-analyzer
 * @param {object} [params.redirectAnalysis] — Output from redirect-analyzer
 * @param {object} [params.fileAnalysis] — Output from file-analyzer
 * @param {object} [params.intentAnalysis] — Output from intent-analyzer
 * @returns {object} Comprehensive Risk Assessment
 */
export function calculateRisk(params = {}) {
  const { urlAnalysis, redirectAnalysis, fileAnalysis, intentAnalysis } = params;

  let totalScore = 0;
  const reasons = [];
  let confidenceSum = 0;
  let confidenceCount = 0;

  // 1. Incorporate URL Analysis Signals
  if (urlAnalysis && urlAnalysis.signals) {
    confidenceCount++;
    confidenceSum += urlAnalysis.isValid ? 0.95 : 0.5;

    for (const signal of urlAnalysis.signals) {
      totalScore += signal.points;
      reasons.push(`${signal.name}: ${signal.detail}`);
    }
  }

  // 2. Incorporate Redirect Analysis Signals
  if (redirectAnalysis) {
    confidenceCount++;
    confidenceSum += redirectAnalysis.isVerified ? 0.9 : 0.6;

    if (redirectAnalysis.redirectCount >= 3) {
      totalScore += 25;
      reasons.push(`Multiple Redirects: ${redirectAnalysis.redirectCount} redirects detected before destination`);
    } else if (redirectAnalysis.redirectCount > 0) {
      totalScore += 10;
      reasons.push(`Redirect Path: ${redirectAnalysis.redirectCount} redirect(s) detected`);
    }

    if (redirectAnalysis.domainChanged) {
      totalScore += 20;
      reasons.push(`Domain Transition: Redirect changes domain from ${redirectAnalysis.initialDomain} to ${redirectAnalysis.finalDomain}`);
    }

    if (!redirectAnalysis.isVerified) {
      totalScore += 10;
      reasons.push(`Unverified Redirect: ${redirectAnalysis.note}`);
    }
  }

  // 3. Incorporate FileGuard File Mismatch Signals
  if (fileAnalysis) {
    confidenceCount++;
    confidenceSum += fileAnalysis.isMismatch ? 0.9 : 0.7;

    if (fileAnalysis.isMismatch) {
      totalScore += fileAnalysis.riskPoints;
      reasons.push(`File Mismatch: ${fileAnalysis.reason}`);
    }

    if (fileAnalysis.actualCategory && fileAnalysis.actualCategory.isHighRisk) {
      totalScore += 25;
      reasons.push(`High-Risk Format: File is an Executable/Scriptable format (${fileAnalysis.actualCategory.name})`);
    }
  }

  // 4. Incorporate Background Download Guard Intent Signals
  if (intentAnalysis) {
    confidenceCount++;
    confidenceSum += 0.85;

    if (intentAnalysis.isUnexpected || intentAnalysis.isAutomatic) {
      totalScore += intentAnalysis.riskPoints;
      reasons.push(`Download Intent: ${intentAnalysis.reason}`);
    }
  }

  // Cap score between 0 and 100
  const finalScore = Math.min(Math.max(totalScore, 0), 100);

  // Determine Risk Level
  let riskLevel = RISK_LEVELS.LOW;
  if (finalScore >= RISK_LEVELS.HIGH.minScore) {
    riskLevel = RISK_LEVELS.HIGH;
  } else if (finalScore >= RISK_LEVELS.MEDIUM.minScore) {
    riskLevel = RISK_LEVELS.MEDIUM;
  }

  // Calculate overall confidence score
  const overallConfidence = confidenceCount > 0
    ? Math.round((confidenceSum / confidenceCount) * 100) / 100
    : 0.8;

  // Determine recommended action
  let recommendedAction = 'Proceed safely';
  if (riskLevel.key === 'HIGH') {
    recommendedAction = 'Stop / Avoid proceeding without verifying source trust';
  } else if (riskLevel.key === 'MEDIUM') {
    recommendedAction = 'Proceed with caution and double-check link destination';
  }

  return {
    score: finalScore,
    level: riskLevel,
    reasons: reasons.length > 0 ? reasons : ['No elevated security risk indicators detected'],
    confidence: overallConfidence,
    recommendedAction,
    timestamp: Date.now()
  };
}
