export interface FinancialData {
  householdIncomeAnnual: number;
  currency: string;
  dependentsCount: number;
  siblingsInHigherEducation: number;
  householdStructure: 'child_headed' | 'orphan' | 'single_parent' | 'dual_parent_low_earning' | 'dual_parent_moderate';
  geographicBackground: 'deep_rural' | 'peri_urban' | 'marginalized_district' | 'urban';
  documentsVerified: boolean;
  documentsList: Array<{
    id: string;
    type: string;
    filename: string;
    status: 'verified' | 'pending' | 'flagged';
    url?: string;
  }>;
}

export interface AcademicData {
  currentInstitution: string;
  degreeProgram: string;
  currentYear: string;
  gpa: number; // e.g. 3.8 on 4.0 scale or 78 on 100 scale
  gpaScale: number; // 4.0 or 100
  baselineThresholdMet: boolean; // Minimum academic cutoff (e.g. >= 2.5 or >= 60%)
  academicTrajectory: 'improving' | 'consistently_high' | 'stable_moderate' | 'declining';
  fieldOfStudyCategory: 'stem' | 'healthcare' | 'education' | 'commerce' | 'humanities' | 'law';
  isCriticalSkillShortage: boolean;
  matricOrEntrancePercentile: number; // e.g. 85th percentile
}

export interface AlignmentData {
  donorMandateCompliance: boolean;
  targetedDemographicMatch: boolean;
  firstGenerationScholar: boolean;
  communityServiceHours: number;
  leadershipExperience: string;
  commitmentToGiveBack: string;
  workBackAgreementAccepted: boolean;
}

export interface FundingScopeData {
  fundingScopeType: 'comprehensive' | 'partial_tuition_living' | 'tuition_only';
  componentsRequested: {
    tuition: boolean;
    housing: boolean;
    booksAllowance: boolean;
    livingStipend: boolean;
    transport: boolean;
  };
  estimatedAnnualAmount: number;
  durationYears: number;
  renewalPerformanceTargetGpa: number;
  requiresMentorship: boolean;
  requiresAcademicTutoring: boolean;
  requiresCounseling: boolean;
}

export interface ScoreExplanation {
  positiveScoreDrivers: string[];
  riskAnomalyFlags: string[];
  rationaleSummary: string;
  equityTier: 'Tier 1 - Critical High Need' | 'Tier 2 - High Merit & Need' | 'Tier 3 - Moderate Support' | 'Tier 4 - Discretionary / Low Need';
  pillarBreakdown: {
    financialNeed: {
      score: number;
      maxScore: number;
      percentage: number;
      details: string[];
    };
    academicPerformance: {
      score: number;
      maxScore: number;
      percentage: number;
      details: string[];
    };
    institutionalAlignment: {
      score: number;
      maxScore: number;
      percentage: number;
      details: string[];
    };
    sustainabilityScope: {
      score: number;
      maxScore: number;
      percentage: number;
      details: string[];
    };
  };
}

export interface CalculatedFairnessScore {
  needScore: number;          // Max 35
  academicScore: number;      // Max 25
  alignmentScore: number;     // Max 20
  sustainabilityScore: number;// Max 20
  compositeScore: number;     // 0 - 100
  explanation: ScoreExplanation;
}

/**
 * Objective, Transparent Multi-Pillar Fairness Scorer
 */
export function calculateFairnessScore(
  financial: FinancialData,
  academic: AcademicData,
  alignment: AlignmentData,
  funding: FundingScopeData
): CalculatedFairnessScore {
  const positiveDrivers: string[] = [];
  const riskFlags: string[] = [];
  const needDetails: string[] = [];
  const academicDetails: string[] = [];
  const alignmentDetails: string[] = [];
  const sustainabilityDetails: string[] = [];

  // ==========================================
  // Pillar 1: Financial & Personal Need (35% Weight)
  // ==========================================
  let needPts = 0;

  // 1.1 Income Level (Max 18 pts)
  const income = financial.householdIncomeAnnual;
  if (income <= 4000) {
    needPts += 18;
    positiveDrivers.push(`+18 pts: Extreme low household income ($${income.toLocaleString()}/yr) below national poverty line`);
    needDetails.push(`Ultra-low income tier: +18 pts`);
  } else if (income <= 8500) {
    needPts += 14;
    positiveDrivers.push(`+14 pts: Low household income ($${income.toLocaleString()}/yr) within priority bursary threshold`);
    needDetails.push(`Low-income tier: +14 pts`);
  } else if (income <= 16000) {
    needPts += 9;
    needDetails.push(`Moderate income tier ($${income.toLocaleString()}/yr): +9 pts`);
  } else if (income <= 25000) {
    needPts += 4;
    needDetails.push(`Upper-moderate income tier: +4 pts`);
  } else {
    needPts += 1;
    needDetails.push(`High relative income tier: +1 pt`);
  }

  // Verification Check
  if (!financial.documentsVerified) {
    needPts = Math.max(0, needPts - 6);
    riskFlags.push(`-6 pts: Financial documentation pending full institutional verification`);
    needDetails.push(`Unverified documentation deduction: -6 pts`);
  } else {
    positiveDrivers.push(`+2 pts: Fully verified income statements and tax/bank filings`);
    needPts += 2;
    needDetails.push(`Verified documentation bonus: +2 pts`);
  }

  // 1.2 Family Circumstances (Max 10 pts)
  if (financial.householdStructure === 'child_headed' || financial.householdStructure === 'orphan') {
    needPts += 6;
    positiveDrivers.push(`+6 pts: Child-headed household / orphaned applicant facing acute systemic barriers`);
    needDetails.push(`Child-headed/orphan status: +6 pts`);
  } else if (financial.householdStructure === 'single_parent') {
    needPts += 4;
    positiveDrivers.push(`+4 pts: Single-parent household with sole breadwinner burden`);
    needDetails.push(`Single-parent family structure: +4 pts`);
  } else if (financial.householdStructure === 'dual_parent_low_earning') {
    needPts += 2;
    needDetails.push(`Dual-parent low-earning household: +2 pts`);
  }

  // Dependents count
  if (financial.dependentsCount >= 5) {
    needPts += 4;
    positiveDrivers.push(`+4 pts: High dependency ratio (${financial.dependentsCount} dependents supported by household)`);
    needDetails.push(`5+ dependents: +4 pts`);
  } else if (financial.dependentsCount >= 3) {
    needPts += 2.5;
    needDetails.push(`3-4 dependents: +2.5 pts`);
  } else if (financial.dependentsCount >= 1) {
    needPts += 1;
    needDetails.push(`1-2 dependents: +1 pt`);
  }

  // Siblings in higher ed
  if (financial.siblingsInHigherEducation >= 2) {
    needPts += 3;
    positiveDrivers.push(`+3 pts: Concurrent tertiary education strain (${financial.siblingsInHigherEducation} siblings currently in university)`);
    needDetails.push(`Multiple siblings in university: +3 pts`);
  } else if (financial.siblingsInHigherEducation === 1) {
    needPts += 1.5;
    needDetails.push(`1 sibling in university: +1.5 pts`);
  }

  // 1.3 Geographic / Social Disadvantage (Max 5 pts)
  if (financial.geographicBackground === 'deep_rural') {
    needPts += 4;
    positiveDrivers.push(`+4 pts: Deep rural origin with constrained access to secondary education resources`);
    needDetails.push(`Deep rural background: +4 pts`);
  } else if (financial.geographicBackground === 'peri_urban' || financial.geographicBackground === 'marginalized_district') {
    needPts += 2.5;
    positiveDrivers.push(`+2.5 pts: Underrepresented district / marginalized peri-urban community`);
    needDetails.push(`Marginalized / peri-urban district: +2.5 pts`);
  } else {
    needDetails.push(`Urban background: standard baseline`);
  }

  const finalNeedScore = Math.min(35, Math.max(0, Math.round(needPts * 10) / 10));

  // ==========================================
  // Pillar 2: Academic Performance & Potential (25% Weight)
  // ==========================================
  let academicPts = 0;

  // 2.1 Baseline Threshold & GPA (Max 12 pts)
  const normalizedGpa = (academic.gpa / academic.gpaScale) * 100; // 0 - 100 scale
  if (!academic.baselineThresholdMet || normalizedGpa < 60) {
    riskFlags.push(`-5 pts: Academic threshold alert — cumulative standing (${academic.gpa}/${academic.gpaScale}) below target cutoff`);
    academicPts += 2;
    academicDetails.push(`Below standard cutoff: +2 pts`);
  } else if (normalizedGpa >= 88) {
    academicPts += 12;
    positiveDrivers.push(`+12 pts: Academic distinction (GPA ${academic.gpa}/${academic.gpaScale} - top 5th percentile standing)`);
    academicDetails.push(`Academic distinction (>88%): +12 pts`);
  } else if (normalizedGpa >= 78) {
    academicPts += 9.5;
    positiveDrivers.push(`+9.5 pts: Strong academic performance (GPA ${academic.gpa}/${academic.gpaScale})`);
    academicDetails.push(`Strong academic standing (78-87%): +9.5 pts`);
  } else if (normalizedGpa >= 68) {
    academicPts += 7;
    academicDetails.push(`Solid academic performance (68-77%): +7 pts`);
  } else {
    academicPts += 5;
    academicDetails.push(`Baseline academic threshold met: +5 pts`);
  }

  // 2.2 Academic Trajectory (Max 7 pts)
  if (academic.academicTrajectory === 'improving') {
    academicPts += 7;
    positiveDrivers.push(`+7 pts: Resilience indicator — upward academic trajectory over successive terms`);
    academicDetails.push(`Upward academic trajectory: +7 pts`);
  } else if (academic.academicTrajectory === 'consistently_high') {
    academicPts += 6;
    positiveDrivers.push(`+6 pts: Consistently high trajectory across all semesters`);
    academicDetails.push(`Consistently high performance: +6 pts`);
  } else if (academic.academicTrajectory === 'stable_moderate') {
    academicPts += 4;
    academicDetails.push(`Stable moderate trajectory: +4 pts`);
  } else if (academic.academicTrajectory === 'declining') {
    academicPts += 1;
    riskFlags.push(`-3 pts: Academic trajectory dip detected in recent academic cycle`);
    academicDetails.push(`Declining academic trajectory: -3 pts penalty applied`);
  }

  // 2.3 Field of Study Alignment (Max 6 pts)
  if (academic.fieldOfStudyCategory === 'stem' || academic.fieldOfStudyCategory === 'healthcare') {
    academicPts += 6;
    positiveDrivers.push(`+6 pts: High-priority critical skill shortage discipline (${academic.fieldOfStudyCategory.toUpperCase()})`);
    academicDetails.push(`Priority STEM / Healthcare discipline: +6 pts`);
  } else if (academic.fieldOfStudyCategory === 'education') {
    academicPts += 5;
    positiveDrivers.push(`+5 pts: Essential social sector alignment (Education & Pedagogy)`);
    academicDetails.push(`Education sector alignment: +5 pts`);
  } else {
    academicPts += 3.5;
    academicDetails.push(`General academic program: +3.5 pts`);
  }

  const finalAcademicScore = Math.min(25, Math.max(0, Math.round(academicPts * 10) / 10));

  // ==========================================
  // Pillar 3: Institutional Alignment & Value Fit (20% Weight)
  // ==========================================
  let alignmentPts = 0;

  // 3.1 Donor Mandate & Demographic Fit (Max 8 pts)
  if (alignment.donorMandateCompliance) {
    alignmentPts += 5;
    positiveDrivers.push(`+5 pts: Strict compliance with donor targeted bursary endowment mandate`);
    alignmentDetails.push(`Donor mandate match: +5 pts`);
  }
  if (alignment.firstGenerationScholar) {
    alignmentPts += 3;
    positiveDrivers.push(`+3 pts: First-generation university attendee in direct lineage`);
    alignmentDetails.push(`First-generation scholar: +3 pts`);
  }

  // 3.2 Character & Community Leadership (Max 7 pts)
  if (alignment.communityServiceHours >= 60) {
    alignmentPts += 5;
    positiveDrivers.push(`+5 pts: Exceptional community stewardship (${alignment.communityServiceHours} verified service hours)`);
    alignmentDetails.push(`60+ community service hours: +5 pts`);
  } else if (alignment.communityServiceHours >= 20) {
    alignmentPts += 3;
    alignmentDetails.push(`20-59 community service hours: +3 pts`);
  } else if (alignment.communityServiceHours > 0) {
    alignmentPts += 1.5;
    alignmentDetails.push(`Under 20 community service hours: +1.5 pts`);
  } else {
    riskFlags.push(`Notice: 0 verified community service hours logged`);
    alignmentDetails.push(`Zero recorded community service: 0 pts`);
  }

  if (alignment.leadershipExperience && alignment.leadershipExperience.trim().length > 15) {
    alignmentPts += 2;
    alignmentDetails.push(`Documented leadership roles & initiative: +2 pts`);
  }

  // 3.3 Commitment to Give Back (Max 5 pts)
  if (alignment.workBackAgreementAccepted) {
    alignmentPts += 3;
    positiveDrivers.push(`+3 pts: Signed formal work-back agreement for community post-service`);
    alignmentDetails.push(`Work-back agreement accepted: +3 pts`);
  }
  if (alignment.commitmentToGiveBack && alignment.commitmentToGiveBack.trim().length > 30) {
    alignmentPts += 2;
    alignmentDetails.push(`Articulated post-graduation community uplift plan: +2 pts`);
  }

  const finalAlignmentScore = Math.min(20, Math.max(0, Math.round(alignmentPts * 10) / 10));

  // ==========================================
  // Pillar 4: Sustainability & Operational Scope (20% Weight)
  // ==========================================
  let sustainabilityPts = 0;

  // 4.1 Scope of Funding Feasibility (Max 7 pts)
  if (funding.fundingScopeType === 'comprehensive') {
    // If comprehensive and high need, fully justified
    if (finalNeedScore >= 24) {
      sustainabilityPts += 7;
      positiveDrivers.push(`+7 pts: Comprehensive funding model matched to verified critical living & tuition need`);
      sustainabilityDetails.push(`Comprehensive package fully justified by need profile: +7 pts`);
    } else {
      sustainabilityPts += 5;
      sustainabilityDetails.push(`Comprehensive package requested: +5 pts`);
    }
  } else if (funding.fundingScopeType === 'partial_tuition_living') {
    sustainabilityPts += 6.5;
    positiveDrivers.push(`+6.5 pts: Cost-efficient blended funding scope with partial family co-funding`);
    sustainabilityDetails.push(`Blended co-funding scope: +6.5 pts`);
  } else {
    sustainabilityPts += 6;
    sustainabilityDetails.push(`Tuition-only focused package: +6 pts`);
  }

  // 4.2 Multi-year Performance Accountability (Max 6 pts)
  if (funding.durationYears > 1 && funding.renewalPerformanceTargetGpa >= 2.8) {
    sustainabilityPts += 6;
    positiveDrivers.push(`+6 pts: Structured multi-year renewal framework anchored to GPA ${funding.renewalPerformanceTargetGpa} performance targets`);
    sustainabilityDetails.push(`Multi-year performance covenant: +6 pts`);
  } else {
    sustainabilityPts += 4;
    sustainabilityDetails.push(`Standard funding duration scope: +4 pts`);
  }

  // 4.3 Integrated Support Structure Engagement (Max 7 pts)
  let supportPts = 2; // base
  if (funding.requiresMentorship) {
    supportPts += 2;
    positiveDrivers.push(`+2 pts: Active commitment to donor executive mentorship pairing`);
    sustainabilityDetails.push(`Mentorship participation covenant: +2 pts`);
  }
  if (funding.requiresAcademicTutoring) {
    supportPts += 1.5;
    sustainabilityDetails.push(`Academic tutoring readiness support: +1.5 pts`);
  }
  if (funding.requiresCounseling) {
    supportPts += 1.5;
    sustainabilityDetails.push(`Holistic student counseling readiness: +1.5 pts`);
  }
  sustainabilityPts += supportPts;

  const finalSustainabilityScore = Math.min(20, Math.max(0, Math.round(sustainabilityPts * 10) / 10));

  // ==========================================
  // Composite Calculation (0 - 100)
  // ==========================================
  const composite = Math.min(100, Math.max(0, Math.round((finalNeedScore + finalAcademicScore + finalAlignmentScore + finalSustainabilityScore) * 10) / 10));

  let equityTier: ScoreExplanation['equityTier'] = 'Tier 4 - Discretionary / Low Need';
  if (composite >= 80) {
    equityTier = 'Tier 1 - Critical High Need';
  } else if (composite >= 65) {
    equityTier = 'Tier 2 - High Merit & Need';
  } else if (composite >= 50) {
    equityTier = 'Tier 3 - Moderate Support';
  }

  // Rationale Narrative
  const rationaleSummary = `Applicant exhibits a composite fairness score of ${composite.toFixed(1)}/100, positioning them within ${equityTier}. ` +
    `The evaluation reflects a strong financial and personal need quotient (${finalNeedScore.toFixed(1)}/35.0), verified with ${financial.documentsVerified ? 'authenticated financial records' : 'pending documentation'} ` +
    `and household circumstance factors. Academic trajectory sits at ${finalAcademicScore.toFixed(1)}/25.0 in the ${academic.fieldOfStudyCategory.toUpperCase()} domain with a trajectory status of "${academic.academicTrajectory.replace('_', ' ')}". ` +
    `Institutional alignment contributes ${finalAlignmentScore.toFixed(1)}/20.0 with ${alignment.donorMandateCompliance ? 'full donor criteria alignment' : 'standard alignment'} and ${alignment.communityServiceHours} logged community hours. ` +
    `Operational sustainability stands at ${finalSustainabilityScore.toFixed(1)}/20.0 under a ${funding.fundingScopeType} funding framework. ` +
    (riskFlags.length > 0 ? `The committee should note flagged considerations: ${riskFlags.join('; ')}.` : 'No critical anomaly flags were triggered during automated fairness screening.');

  return {
    needScore: finalNeedScore,
    academicScore: finalAcademicScore,
    alignmentScore: finalAlignmentScore,
    sustainabilityScore: finalSustainabilityScore,
    compositeScore: composite,
    explanation: {
      positiveScoreDrivers: positiveDrivers,
      riskAnomalyFlags: riskFlags,
      rationaleSummary,
      equityTier,
      pillarBreakdown: {
        financialNeed: {
          score: finalNeedScore,
          maxScore: 35,
          percentage: Math.round((finalNeedScore / 35) * 100),
          details: needDetails,
        },
        academicPerformance: {
          score: finalAcademicScore,
          maxScore: 25,
          percentage: Math.round((finalAcademicScore / 25) * 100),
          details: academicDetails,
        },
        institutionalAlignment: {
          score: finalAlignmentScore,
          maxScore: 20,
          percentage: Math.round((finalAlignmentScore / 20) * 100),
          details: alignmentDetails,
        },
        sustainabilityScope: {
          score: finalSustainabilityScore,
          maxScore: 20,
          percentage: Math.round((finalSustainabilityScore / 20) * 100),
          details: sustainabilityDetails,
        },
      },
    },
  };
}
