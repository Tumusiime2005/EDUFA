export interface NextOfKinData {
  fullName: string;
  relationship: string;
  phone: string;
  gender: 'male' | 'female';
  nin: string;
}

export interface LevelCompletionProof {
  levelCompleted: string; // e.g. UCE (O-Level), UACE (A-Level), Diploma, Degree
  previousSchoolName: string; // Name of previous school / secondary institution
  previousSchoolStudentId: string; // Student ID of previous school for conformity
  completionYear: string;
  indexOrRegNumber: string;
  filename: string;
  isScanned: boolean;
  scanTimestamp?: string;
  fileData?: string;
  scannedImagePreview?: string;
  extractedDetails?: {
    schoolNameDetected?: string;
    studentIdDetected?: string;
    indexNumberDetected?: string;
    officialStampConfirmed?: boolean;
    ocrConfidence?: number;
    conformityStatus?: 'verified_match' | 'partial_match' | 'flagged';
  };
}

export interface PersonalData {
  dateOfBirth: string;
  passportPhotoUrl?: string;
  nextOfKin: NextOfKinData;
}

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
  personalData?: PersonalData;
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
  levelCompletionProof?: LevelCompletionProof;
}

/**
 * Validates Next of Kin NIN according to Uganda National Identification guidelines in the background.
 * Exact 14 characters, uppercase alphanumeric, CF for female, CM for male.
 * Emits generic message without exposing internal rule hint.
 */
export function validateNextOfKinNIN(gender: 'male' | 'female', nin: string): { valid: boolean; error?: string } {
  const cleanNin = (nin || '').trim();
  if (cleanNin.length !== 14 || !/^[A-Z0-9]{14}$/.test(cleanNin)) {
    return { valid: false, error: 'Invalid National Identification Number (NIN). Please verify the next of kin identification number.' };
  }
  if (gender === 'female' && !cleanNin.startsWith('CF')) {
    return { valid: false, error: 'Invalid National Identification Number (NIN). Please verify the next of kin identification number.' };
  }
  if (gender === 'male' && !cleanNin.startsWith('CM')) {
    return { valid: false, error: 'Invalid National Identification Number (NIN). Please verify the next of kin identification number.' };
  }
  return { valid: true };
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

  // 1.1 Income Level (Max 14 pts) - Calibrated for Ugandan Shillings (UGX)
  const income = financial.householdIncomeAnnual;
  const currency = financial.currency || 'UGX';
  const isUgxScale = income > 100000 || currency === 'UGX';

  const acuteDistressLimit = isUgxScale ? 3000000 : 2500;
  const lowLimit = isUgxScale ? 8000000 : 6000;
  const moderateLimit = isUgxScale ? 18000000 : 12000;
  const upperModerateLimit = isUgxScale ? 35000000 : 22000;

  if (income <= acuteDistressLimit) {
    needPts += 14;
    positiveDrivers.push(`+14 pts: Acute subsistence household income (${currency} ${income.toLocaleString()}/yr) below basic living wage`);
    needDetails.push(`Acute subsistence income tier: +14 pts`);
  } else if (income <= lowLimit) {
    needPts += 10;
    positiveDrivers.push(`+10 pts: Low household income (${currency} ${income.toLocaleString()}/yr) within priority bursary criteria`);
    needDetails.push(`Low-income tier: +10 pts`);
  } else if (income <= moderateLimit) {
    needPts += 6.5;
    needDetails.push(`Moderate income tier (${currency} ${income.toLocaleString()}/yr): +6.5 pts`);
  } else if (income <= upperModerateLimit) {
    needPts += 3.5;
    needDetails.push(`Upper-moderate income tier: +3.5 pts`);
  } else {
    needPts += 1;
    needDetails.push(`High relative income tier: +1 pt`);
  }

  // Verification Check
  if (!financial.documentsVerified) {
    needPts = Math.max(0, needPts - 5);
    riskFlags.push(`-5 pts: Financial documentation pending full institutional verification`);
    needDetails.push(`Unverified documentation deduction: -5 pts`);
  } else {
    positiveDrivers.push(`+1 pt: Verified income statements and tax/bank filings`);
    needPts += 1;
    needDetails.push(`Verified documentation verification: +1 pt`);
  }

  // 1.2 Family Circumstances (Max 8 pts)
  if (financial.householdStructure === 'child_headed' || financial.householdStructure === 'orphan') {
    needPts += 4;
    positiveDrivers.push(`+4 pts: Child-headed household / orphaned applicant facing acute systemic barriers`);
    needDetails.push(`Child-headed/orphan status: +4 pts`);
  } else if (financial.householdStructure === 'single_parent') {
    needPts += 2.5;
    positiveDrivers.push(`+2.5 pts: Single-parent household with sole breadwinner burden`);
    needDetails.push(`Single-parent family structure: +2.5 pts`);
  } else if (financial.householdStructure === 'dual_parent_low_earning') {
    needPts += 1;
    needDetails.push(`Dual-parent low-earning household: +1 pt`);
  }

  // Dependents count
  if (financial.dependentsCount >= 5) {
    needPts += 3;
    positiveDrivers.push(`+3 pts: High dependency ratio (${financial.dependentsCount} dependents supported by household)`);
    needDetails.push(`5+ dependents: +3 pts`);
  } else if (financial.dependentsCount >= 3) {
    needPts += 2;
    needDetails.push(`3-4 dependents: +2 pts`);
  } else if (financial.dependentsCount >= 1) {
    needPts += 1;
    needDetails.push(`1-2 dependents: +1 pt`);
  }

  // Siblings in higher ed
  if (financial.siblingsInHigherEducation >= 2) {
    needPts += 2;
    positiveDrivers.push(`+2 pts: Concurrent tertiary education strain (${financial.siblingsInHigherEducation} siblings currently in university)`);
    needDetails.push(`Multiple siblings in university: +2 pts`);
  } else if (financial.siblingsInHigherEducation === 1) {
    needPts += 1;
    needDetails.push(`1 sibling in university: +1 pt`);
  }

  // 1.3 Geographic / Social Disadvantage (Max 3 pts)
  if (financial.geographicBackground === 'deep_rural') {
    needPts += 3;
    positiveDrivers.push(`+3 pts: Deep rural origin with constrained access to secondary education resources`);
    needDetails.push(`Deep rural background: +3 pts`);
  } else if (financial.geographicBackground === 'peri_urban' || financial.geographicBackground === 'marginalized_district') {
    needPts += 1.5;
    positiveDrivers.push(`+1.5 pts: Underrepresented district / marginalized peri-urban community`);
    needDetails.push(`Marginalized / peri-urban district: +1.5 pts`);
  } else {
    needDetails.push(`Urban background: standard baseline`);
  }

  const finalNeedScore = Math.min(35, Math.max(0, Math.round(needPts * 10) / 10));

  // ==========================================
  // Pillar 2: Academic Performance & Potential (25% Weight)
  // ==========================================
  let academicPts = 0;

  // 2.1 Baseline Threshold & GPA (Max 9.5 pts)
  const normalizedGpa = (academic.gpa / academic.gpaScale) * 100; // 0 - 100 scale
  if (!academic.baselineThresholdMet || normalizedGpa < 60) {
    riskFlags.push(`-5 pts: Academic threshold alert — cumulative standing (${academic.gpa}/${academic.gpaScale}) below target cutoff`);
    academicPts += 1;
    academicDetails.push(`Below standard cutoff: +1 pt`);
  } else if (normalizedGpa >= 90) {
    academicPts += 9.5;
    positiveDrivers.push(`+9.5 pts: Academic distinction (GPA ${academic.gpa}/${academic.gpaScale} - top percentile standing)`);
    academicDetails.push(`Academic distinction (≥90%): +9.5 pts`);
  } else if (normalizedGpa >= 80) {
    academicPts += 7;
    positiveDrivers.push(`+7 pts: Strong academic performance (GPA ${academic.gpa}/${academic.gpaScale})`);
    academicDetails.push(`Strong academic standing (80-89%): +7 pts`);
  } else if (normalizedGpa >= 70) {
    academicPts += 5;
    academicDetails.push(`Solid academic performance (70-79%): +5 pts`);
  } else {
    academicPts += 3.5;
    academicDetails.push(`Baseline academic threshold met (60-69%): +3.5 pts`);
  }

  // 2.2 Academic Trajectory (Max 4.5 pts)
  if (academic.academicTrajectory === 'improving') {
    academicPts += 4.5;
    positiveDrivers.push(`+4.5 pts: Upward academic trajectory over successive terms`);
    academicDetails.push(`Upward academic trajectory: +4.5 pts`);
  } else if (academic.academicTrajectory === 'consistently_high') {
    academicPts += 4;
    positiveDrivers.push(`+4 pts: Consistently high trajectory across terms`);
    academicDetails.push(`Consistently high performance: +4 pts`);
  } else if (academic.academicTrajectory === 'stable_moderate') {
    academicPts += 2.5;
    academicDetails.push(`Stable moderate trajectory: +2.5 pts`);
  } else if (academic.academicTrajectory === 'declining') {
    academicPts += 0;
    riskFlags.push(`-3 pts: Academic trajectory dip detected in recent academic cycle`);
    academicDetails.push(`Declining academic trajectory: 0 pts`);
  }

  // 2.3 Field of Study Alignment (Max 4.5 pts)
  if (academic.fieldOfStudyCategory === 'stem' || academic.fieldOfStudyCategory === 'healthcare') {
    academicPts += 4.5;
    positiveDrivers.push(`+4.5 pts: Priority discipline (${academic.fieldOfStudyCategory.toUpperCase()})`);
    academicDetails.push(`Priority STEM / Healthcare discipline: +4.5 pts`);
  } else if (academic.fieldOfStudyCategory === 'education') {
    academicPts += 3.5;
    positiveDrivers.push(`+3.5 pts: Essential social sector alignment (Education)`);
    academicDetails.push(`Education sector alignment: +3.5 pts`);
  } else {
    academicPts += 2;
    academicDetails.push(`General academic program: +2 pts`);
  }

  // 2.4 Prior Level Completion Proof & Previous School Student ID Conformity Check (Max 1 pt)
  if (academic.levelCompletionProof) {
    const proof = academic.levelCompletionProof;
    if (proof.isScanned && proof.previousSchoolStudentId && proof.previousSchoolStudentId.trim().length >= 3) {
      academicPts += 1;
      positiveDrivers.push(`+1 pt: Prior school student ID (${proof.previousSchoolStudentId.toUpperCase()}) optical scan verified`);
      academicDetails.push(`Previous school student ID conformity verified: +1 pt`);
    } else if (!proof.isScanned) {
      academicPts = Math.max(0, academicPts - 2);
      riskFlags.push(`-2 pts: Prior level completion certificate unscanned`);
      academicDetails.push(`Unscanned prior level document: -2 pts`);
    }
  }

  const finalAcademicScore = Math.min(25, Math.max(0, Math.round(academicPts * 10) / 10));

  // ==========================================
  // Pillar 3: Institutional Alignment & Value Fit (20% Weight)
  // ==========================================
  let alignmentPts = 0;

  // 3.1 Donor Mandate & Demographic Fit (Max 5.5 pts)
  if (alignment.donorMandateCompliance) {
    alignmentPts += 3.5;
    positiveDrivers.push(`+3.5 pts: Targeted donor criteria match`);
    alignmentDetails.push(`Donor mandate match: +3.5 pts`);
  }
  if (alignment.firstGenerationScholar) {
    alignmentPts += 2;
    positiveDrivers.push(`+2 pts: First-generation university scholar`);
    alignmentDetails.push(`First-generation scholar: +2 pts`);
  }

  // 3.2 Character & Community Leadership (Max 5 pts)
  if (alignment.communityServiceHours >= 60) {
    alignmentPts += 3.5;
    positiveDrivers.push(`+3.5 pts: Exceptional community stewardship (${alignment.communityServiceHours} hrs)`);
    alignmentDetails.push(`60+ community service hours: +3.5 pts`);
  } else if (alignment.communityServiceHours >= 20) {
    alignmentPts += 2;
    alignmentDetails.push(`20-59 community service hours: +2 pts`);
  } else if (alignment.communityServiceHours > 0) {
    alignmentPts += 1;
    alignmentDetails.push(`Under 20 community service hours: +1 pt`);
  } else {
    alignmentDetails.push(`Zero recorded community service: 0 pts`);
  }

  if (alignment.leadershipExperience && alignment.leadershipExperience.trim().length > 15) {
    alignmentPts += 1.5;
    alignmentDetails.push(`Documented leadership roles: +1.5 pts`);
  }

  // 3.3 Commitment to Give Back (Max 3.5 pts)
  if (alignment.workBackAgreementAccepted) {
    alignmentPts += 2;
    positiveDrivers.push(`+2 pts: Signed formal work-back agreement`);
    alignmentDetails.push(`Work-back agreement accepted: +2 pts`);
  }
  if (alignment.commitmentToGiveBack && alignment.commitmentToGiveBack.trim().length > 30) {
    alignmentPts += 1.5;
    alignmentDetails.push(`Post-graduation community uplift commitment: +1.5 pts`);
  }

  const finalAlignmentScore = Math.min(20, Math.max(0, Math.round(alignmentPts * 10) / 10));

  // ==========================================
  // Pillar 4: Sustainability & Operational Scope (20% Weight)
  // ==========================================
  let sustainabilityPts = 0;

  // 4.1 Scope of Funding Feasibility (Max 5 pts)
  if (funding.fundingScopeType === 'comprehensive') {
    if (finalNeedScore >= 24) {
      sustainabilityPts += 5;
      positiveDrivers.push(`+5 pts: Comprehensive funding matched to critical living and tuition need`);
      sustainabilityDetails.push(`Comprehensive package justified by need profile: +5 pts`);
    } else {
      sustainabilityPts += 3.5;
      sustainabilityDetails.push(`Comprehensive package requested: +3.5 pts`);
    }
  } else if (funding.fundingScopeType === 'partial_tuition_living') {
    sustainabilityPts += 4.5;
    positiveDrivers.push(`+4.5 pts: Blended co-funding scope with partial family contribution`);
    sustainabilityDetails.push(`Blended co-funding scope: +4.5 pts`);
  } else {
    sustainabilityPts += 4;
    sustainabilityDetails.push(`Tuition-focused package: +4 pts`);
  }

  // 4.2 Multi-year Performance Accountability (Max 4.5 pts)
  if (funding.durationYears > 1 && funding.renewalPerformanceTargetGpa >= 2.8) {
    sustainabilityPts += 4.5;
    positiveDrivers.push(`+4.5 pts: Multi-year renewal covenant anchored to GPA ${funding.renewalPerformanceTargetGpa}`);
    sustainabilityDetails.push(`Multi-year performance covenant: +4.5 pts`);
  } else {
    sustainabilityPts += 2.5;
    sustainabilityDetails.push(`Standard funding duration scope: +2.5 pts`);
  }

  // 4.3 Integrated Support Structure Engagement (Max 4 pts)
  let supportPts = 1;
  if (funding.requiresMentorship) {
    supportPts += 1.5;
    sustainabilityDetails.push(`Mentorship participation covenant: +1.5 pts`);
  }
  if (funding.requiresAcademicTutoring) {
    supportPts += 1;
    sustainabilityDetails.push(`Academic tutoring readiness support: +1 pt`);
  }
  if (funding.requiresCounseling) {
    supportPts += 0.5;
    sustainabilityDetails.push(`Holistic student counseling readiness: +0.5 pts`);
  }
  sustainabilityPts += supportPts;

  const finalSustainabilityScore = Math.min(20, Math.max(0, Math.round(sustainabilityPts * 10) / 10));

  // ==========================================
  // Composite Calculation (0 - 100)
  // Calibrated so Tier 1 is reserved for truly exceptional acute-need candidates
  // ==========================================
  const composite = Math.min(100, Math.max(0, Math.round((finalNeedScore + finalAcademicScore + finalAlignmentScore + finalSustainabilityScore) * 10) / 10));

  let equityTier: ScoreExplanation['equityTier'] = 'Tier 4 - Discretionary / Low Need';
  if (composite >= 86.0) {
    equityTier = 'Tier 1 - Critical High Need';
  } else if (composite >= 70.0) {
    equityTier = 'Tier 2 - High Merit & Need';
  } else if (composite >= 55.0) {
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
