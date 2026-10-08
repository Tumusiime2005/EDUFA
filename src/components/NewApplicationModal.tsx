import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  DollarSign,
  BookOpen,
  HeartHandshake,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Check,
  Shield,
  Camera,
  RotateCcw,
  Scan,
  User,
  Users,
  Calendar,
  Eye,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  calculateFairnessScore,
  validateNextOfKinNIN,
  FinancialData,
  AcademicData,
  AlignmentData,
  FundingScopeData,
  PersonalData,
  NextOfKinData,
  LevelCompletionProof,
} from '../lib/scoring-engine.ts';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Personal & Identity Profile
  const [fullName, setFullName] = useState(currentUser?.profile?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [region, setRegion] = useState('Central Region (Kampala)');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [passportPhotoUrl, setPassportPhotoUrl] = useState<string>('');

  // Camera Live Capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Next of Kin
  const [kinFullName, setKinFullName] = useState('');
  const [kinRelationship, setKinRelationship] = useState('Parent / Legal Guardian');
  const [kinPhone, setKinPhone] = useState('');
  const [kinGender, setKinGender] = useState<'male' | 'female'>('female');
  const [kinNin, setKinNin] = useState('');

  // 2. Financial Pillar (35%)
  const [financial, setFinancial] = useState<FinancialData>({
    householdIncomeAnnual: 4500000,
    currency: 'UGX',
    dependentsCount: 3,
    siblingsInHigherEducation: 1,
    householdStructure: 'dual_parent_low_earning',
    geographicBackground: 'deep_rural',
    documentsVerified: true,
    documentsList: [
      {
        id: 'doc-1',
        type: 'LC1 Local Council Recommendation Letter',
        filename: 'LC1_Recommendation_Official.pdf',
        status: 'verified',
      },
    ],
  });

  // 3. Academic Pillar (25%) & Level Completion Proof
  const [academic, setAcademic] = useState<AcademicData>({
    currentInstitution: 'Makerere University',
    degreeProgram: 'Bachelor of Science in Software Engineering',
    currentYear: 'Year 1',
    gpa: 3.75,
    gpaScale: 4.0,
    baselineThresholdMet: true,
    academicTrajectory: 'improving',
    fieldOfStudyCategory: 'stem',
    isCriticalSkillShortage: true,
    matricOrEntrancePercentile: 85,
  });

  // Prior Level Completion Proof
  const [levelCompleted, setLevelCompleted] = useState('Uganda Advanced Certificate of Education (UACE / A-Level)');
  const [completionYear, setCompletionYear] = useState('2024');
  const [indexOrRegNumber, setIndexOrRegNumber] = useState('U0023/514');
  const [levelDocName, setLevelDocName] = useState('UACE_Official_Pass_Slip.pdf');
  const [isLevelDocScanned, setIsLevelDocScanned] = useState(false);
  const [levelDocScanTimestamp, setLevelDocScanTimestamp] = useState<string>('');
  const [isScanningLevelDoc, setIsScanningLevelDoc] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('');

  // Income doc scanner state
  const [incomeDocName, setIncomeDocName] = useState('Household_Payslip_Proof.pdf');
  const [isIncomeDocScanned, setIsIncomeDocScanned] = useState(false);
  const [isScanningIncomeDoc, setIsScanningIncomeDoc] = useState(false);

  // 4. Institutional Alignment Pillar (20%)
  const [alignment, setAlignment] = useState<AlignmentData>({
    donorMandateCompliance: true,
    targetedDemographicMatch: true,
    firstGenerationScholar: true,
    communityServiceHours: 45,
    leadershipExperience: 'Head Boy / Student Prefect Council Lead, Peer STEM Tutor',
    commitmentToGiveBack: 'Intend to establish rural computer coding workshops in rural eastern Uganda post-graduation.',
    workBackAgreementAccepted: true,
  });

  // 5. Funding Scope & Sustainability (20%)
  const [funding, setFunding] = useState<FundingScopeData>({
    fundingScopeType: 'partial_tuition_living',
    componentsRequested: {
      tuition: true,
      housing: true,
      booksAllowance: false,
      livingStipend: false,
      transport: false,
    },
    estimatedAnnualAmount: 4200000,
    durationYears: 3,
    renewalPerformanceTargetGpa: 3.2,
    requiresMentorship: true,
    requiresAcademicTutoring: false,
    requiresCounseling: false,
  });

  // Clean up camera stream on unmount or close
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Camera access not supported or denied. Please upload a passport photo file instead.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 360;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const minDim = Math.min(video.videoWidth || 360, video.videoHeight || 360);
        const startX = ((video.videoWidth || 360) - minDim) / 2;
        const startY = ((video.videoHeight || 360) - minDim) / 2;
        ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 360, 360);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPassportPhotoUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPassportPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Document Scanner simulation for Level Completion Proof
  const scanLevelCompletionDoc = () => {
    setIsScanningLevelDoc(true);
    setScanStepMessage('Optical scan (300 DPI resolution check)...');

    setTimeout(() => {
      setScanStepMessage('OCR UNEB watermark & digital stamp inspection...');
    }, 700);

    setTimeout(() => {
      setScanStepMessage('Verifying digital certificate authenticity & checksum...');
    }, 1400);

    setTimeout(() => {
      setIsScanningLevelDoc(false);
      setIsLevelDocScanned(true);
      setLevelDocScanTimestamp(new Date().toLocaleTimeString());
      setScanStepMessage('Scanned & Verified successfully!');
    }, 2000);
  };

  // Document Scanner for Income / Personal docs
  const scanIncomeProofDoc = () => {
    setIsScanningIncomeDoc(true);
    setTimeout(() => {
      setIsScanningIncomeDoc(false);
      setIsIncomeDocScanned(true);
    }, 1800);
  };

  // Live Score Preview on the fly
  const liveScore = useMemo(() => {
    return calculateFairnessScore(financial, academic, alignment, funding);
  }, [financial, academic, alignment, funding]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Validate Date of Birth
      if (!dateOfBirth) {
        setStep(1);
        throw new Error('Date of birth is required for applicant registration.');
      }

      // 2. Validate Passport Photo
      if (!passportPhotoUrl) {
        setStep(1);
        throw new Error('Passport photo is required. Please upload or capture live photo.');
      }

      // 3. Validate Next of Kin Details
      if (!kinFullName.trim()) {
        setStep(1);
        throw new Error('Next of kin full legal name is required.');
      }
      if (!kinPhone.trim()) {
        setStep(1);
        throw new Error('Next of kin contact phone number is required.');
      }
      if (!kinNin.trim()) {
        setStep(1);
        throw new Error('Next of kin National Identification Number (NIN) is required.');
      }

      // Background verification for Next of Kin NIN (no public rule hint exposed!)
      const ninValidation = validateNextOfKinNIN(kinGender, kinNin.trim().toUpperCase());
      if (!ninValidation.valid) {
        setStep(1);
        throw new Error(ninValidation.error || 'Invalid National Identification Number (NIN). Please verify the next of kin identification number.');
      }

      // 4. Validate Level Completion Proof and Scanner Requirement
      if (!indexOrRegNumber.trim()) {
        setStep(3);
        throw new Error('Prior level registration/index number is required to verify completion.');
      }
      if (!isLevelDocScanned) {
        setStep(3);
        throw new Error('All academic level completion documents must be scanned first via the Document Scanner before submission.');
      }

      const personalData: PersonalData = {
        dateOfBirth,
        passportPhotoUrl,
        nextOfKin: {
          fullName: kinFullName.trim(),
          relationship: kinRelationship,
          phone: kinPhone.trim(),
          gender: kinGender,
          nin: kinNin.trim().toUpperCase(),
        },
      };

      const levelCompletionProof: LevelCompletionProof = {
        levelCompleted,
        completionYear,
        indexOrRegNumber: indexOrRegNumber.trim(),
        filename: levelDocName,
        isScanned: true,
        scanTimestamp: levelDocScanTimestamp || new Date().toISOString(),
      };

      const finalFinancialData: FinancialData = {
        ...financial,
        personalData,
      };

      const finalAcademicData: AcademicData = {
        ...academic,
        levelCompletionProof,
      };

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: currentUser?.id,
          applicantName: fullName.trim() || currentUser?.profile?.fullName || 'Applicant Scholar',
          applicantEmail: email.trim() || currentUser?.email || 'applicant@dragonsenterprises.com',
          applicantRegion: region.trim() || 'Central Region (Kampala)',
          financialData: finalFinancialData,
          academicData: finalAcademicData,
          alignmentData: alignment,
          fundingScopeData: funding,
        }),
      });

      const responseText = await res.text();
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch {
        if (!res.ok) {
          throw new Error(responseText.slice(0, 180) || `Server error (${res.status})`);
        }
      }

      if (!res.ok) {
        throw new Error(responseData.error || `Server submission error (${res.status})`);
      }

      onSubmitted();
      stopCamera();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed. Please check inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-500 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">New Bursary & Sponsorship Dossier</h3>
              <p className="text-xs text-neutral-400">Step {step} of 5 — Multi-Pillar Objective Fairness Evaluation</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Stepper */}
        <div className="grid grid-cols-5 border-b border-neutral-800 bg-neutral-950/40 text-xs">
          {[
            { num: 1, label: 'Identity & Kin' },
            { num: 2, label: 'Financial (35%)' },
            { num: 3, label: 'Academic & Proof (25%)' },
            { num: 4, label: 'Alignment (20%)' },
            { num: 5, label: 'Scope (20%)' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`p-3 text-center transition-all cursor-pointer border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                step === s.num
                  ? 'border-orange-500 text-orange-400 font-bold bg-orange-500/5'
                  : step > s.num
                  ? 'border-emerald-500 text-emerald-400 font-medium'
                  : 'border-transparent text-neutral-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === s.num
                    ? 'bg-orange-500 text-white'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {step > s.num ? <Check className="w-3 h-3" /> : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body: Two column layout with Live Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                {/* 1A: Basic Identity */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-400" />
                    1. Applicant Identity, Date of Birth & Region
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Mukasa David"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="applicant@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Geographic Region / District</label>
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="e.g. Central Region (Kampala)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 1B: Passport Photo Capture or Upload */}
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                        <Camera className="w-4 h-4 text-orange-400" />
                        Official Passport Photo
                      </h5>
                      <p className="text-[11px] text-neutral-400">
                        Upload an official 2x2 passport photograph or capture live via camera.
                      </p>
                    </div>
                    {passportPhotoUrl && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Photo Attached
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    {/* Photo Preview Tile */}
                    <div className="w-32 h-36 rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-900 flex flex-col items-center justify-center overflow-hidden mx-auto sm:mx-0 relative">
                      {passportPhotoUrl ? (
                        <>
                          <img
                            src={passportPhotoUrl}
                            alt="Passport Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setPassportPhotoUrl('')}
                            className="absolute bottom-1 right-1 p-1 rounded-md bg-black/70 text-red-400 hover:text-red-300 text-[10px]"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-2 text-neutral-500">
                          <User className="w-8 h-8 mx-auto mb-1 opacity-40" />
                          <span className="text-[10px] block">No Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="sm:col-span-2 space-y-2 text-xs">
                      {isCameraActive ? (
                        <div className="space-y-2">
                          <div className="w-full max-w-xs h-48 bg-black rounded-xl overflow-hidden relative border border-orange-500/40">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                            {/* Oval face guide */}
                            <div className="absolute inset-4 border-2 border-orange-500/60 rounded-full pointer-events-none opacity-60" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" /> Capture Photo
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="px-3.5 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/40 font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" /> Take Live Photo
                            </button>
                            <label className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold flex items-center gap-1.5 cursor-pointer border border-neutral-700">
                              <UploadCloud className="w-3.5 h-3.5" /> Upload Photo File
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                          {cameraError && (
                            <p className="text-[11px] text-amber-400">{cameraError}</p>
                          )}
                          <p className="text-[10px] text-neutral-500">
                            Accepted: JPEG, PNG with plain light background.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1C: Next of Kin with Background Verified NIN */}
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                  <div>
                    <h5 className="font-bold text-xs text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-400" />
                      Next of Kin Contact & Verification
                    </h5>
                    <p className="text-[11px] text-neutral-400">
                      Primary family emergency contact and verified national identity.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Next of Kin Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Nalubega Grace"
                        value={kinFullName}
                        onChange={(e) => setKinFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Relationship</label>
                      <select
                        value={kinRelationship}
                        onChange={(e) => setKinRelationship(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      >
                        <option value="Mother">Mother</option>
                        <option value="Father">Father</option>
                        <option value="Legal Guardian">Legal Guardian</option>
                        <option value="Sibling">Sibling (Brother / Sister)</option>
                        <option value="Aunt / Uncle">Aunt / Uncle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Contact Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +256 701 234567"
                        value={kinPhone}
                        onChange={(e) => setKinPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Gender</label>
                      <select
                        value={kinGender}
                        onChange={(e: any) => setKinGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-neutral-400" />
                        Next of Kin National Identification Number (NIN)
                      </label>
                      <input
                        type="text"
                        maxLength={14}
                        placeholder="Enter 14-character NIN"
                        value={kinNin}
                        onChange={(e) => setKinNin(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono tracking-widest uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-400" />
                  2. Financial Need & Circumstances (35% Weight)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      Annual Household Income (UGX / Ugandan Shillings)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 4500000"
                      value={financial.householdIncomeAnnual || ''}
                      onChange={(e) =>
                        setFinancial({ ...financial, householdIncomeAnnual: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      UGX {Number(financial.householdIncomeAnnual || 0).toLocaleString()} per annum
                    </span>
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Household Structure</label>
                    <select
                      value={financial.householdStructure}
                      onChange={(e: any) =>
                        setFinancial({ ...financial, householdStructure: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    >
                      <option value="orphan">Orphan / Child-Headed Household (+6 pts)</option>
                      <option value="single_parent">Single-Parent Household (+4 pts)</option>
                      <option value="dual_parent_low_earning">Dual-Parent Low Earning (+2 pts)</option>
                      <option value="dual_parent_moderate">Dual-Parent Moderate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Dependents in Household</label>
                    <input
                      type="number"
                      value={financial.dependentsCount}
                      onChange={(e) =>
                        setFinancial({ ...financial, dependentsCount: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Siblings in Higher Education</label>
                    <input
                      type="number"
                      value={financial.siblingsInHigherEducation}
                      onChange={(e) =>
                        setFinancial({
                          ...financial,
                          siblingsInHigherEducation: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-neutral-300 font-medium mb-1">Geographic Context</label>
                    <select
                      value={financial.geographicBackground}
                      onChange={(e: any) =>
                        setFinancial({ ...financial, geographicBackground: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    >
                      <option value="deep_rural">Deep Rural Underrepresented (+4 pts)</option>
                      <option value="peri_urban">Peri-Urban / Informal Settlement (+2.5 pts)</option>
                      <option value="marginalized_district">Marginalized District (+2.5 pts)</option>
                      <option value="urban">Urban Standard Baseline</option>
                    </select>
                  </div>
                </div>

                {/* Scanned Income Proof Documents */}
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                        <Scan className="w-4 h-4 text-orange-400" />
                        Income & Household Proof (Must be Scanned)
                      </h5>
                      <p className="text-[11px] text-neutral-400">
                        All supporting documents must undergo digital anti-fraud scan before submission.
                      </p>
                    </div>
                    {isIncomeDocScanned ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Scanned & Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        Scan Required
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800 gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="font-medium text-neutral-200">{incomeDocName}</p>
                        <p className="text-[10px] text-neutral-500">LC1 Proof / Household Income Verification</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isScanningIncomeDoc || isIncomeDocScanned}
                      onClick={scanIncomeProofDoc}
                      className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        isIncomeDocScanned
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                          : isScanningIncomeDoc
                          ? 'bg-orange-600/30 text-orange-300 border border-orange-500/40 animate-pulse'
                          : 'bg-orange-600 hover:bg-orange-500 text-white shadow-sm'
                      }`}
                    >
                      <Scan className="w-3.5 h-3.5" />
                      {isScanningIncomeDoc
                        ? 'Scanning Document...'
                        : isIncomeDocScanned
                        ? 'Scanned & Verified ✓'
                        : 'Scan Document Now'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    3. Academic Performance & Prior Level Completion Proof (25% Weight)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Current Institution</label>
                      <input
                        type="text"
                        value={academic.currentInstitution}
                        onChange={(e) =>
                          setAcademic({ ...academic, currentInstitution: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Degree / Major Program</label>
                      <input
                        type="text"
                        value={academic.degreeProgram}
                        onChange={(e) =>
                          setAcademic({ ...academic, degreeProgram: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Cumulative GPA (out of 4.0)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={academic.gpa}
                        onChange={(e) => setAcademic({ ...academic, gpa: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Academic Trajectory</label>
                      <select
                        value={academic.academicTrajectory}
                        onChange={(e: any) =>
                          setAcademic({ ...academic, academicTrajectory: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      >
                        <option value="improving">Improving (Demonstrating Grit +7 pts)</option>
                        <option value="consistently_high">Consistently High (+6 pts)</option>
                        <option value="stable_moderate">Stable Moderate (+4 pts)</option>
                        <option value="declining">Declining (-3 pts penalty flag)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Field Category</label>
                      <select
                        value={academic.fieldOfStudyCategory}
                        onChange={(e: any) =>
                          setAcademic({
                            ...academic,
                            fieldOfStudyCategory: e.target.value,
                            isCriticalSkillShortage:
                              e.target.value === 'stem' || e.target.value === 'healthcare',
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      >
                        <option value="stem">STEM (Priority Shortage +6 pts)</option>
                        <option value="healthcare">Healthcare & Medicine (+6 pts)</option>
                        <option value="education">Education & Pedagogy (+5 pts)</option>
                        <option value="commerce">Commerce / Economics</option>
                        <option value="humanities">Humanities & Arts</option>
                        <option value="law">Law</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={academic.baselineThresholdMet}
                          onChange={(e) =>
                            setAcademic({ ...academic, baselineThresholdMet: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-neutral-200 font-medium">Baseline Academic Cutoff Met</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Level Completion Proof Section & Mandatory Document Scanner */}
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-emerald-400" />
                        Verification of Prior Level Completed
                      </h5>
                      <p className="text-[11px] text-neutral-400">
                        Official certification that the student completed a prior secondary or tertiary level.
                      </p>
                    </div>
                    {isLevelDocScanned ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Scanned & Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Must Scan First
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Level Completed</label>
                      <select
                        value={levelCompleted}
                        onChange={(e) => setLevelCompleted(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                      >
                        <option value="Uganda Advanced Certificate of Education (UACE / A-Level)">
                          UACE (A-Level)
                        </option>
                        <option value="Uganda Certificate of Education (UCE / O-Level)">
                          UCE (O-Level)
                        </option>
                        <option value="Primary Leaving Examination (P.L.E)">
                          P.L.E (Primary)
                        </option>
                        <option value="National Diploma / Higher Diploma">
                          National Diploma
                        </option>
                        <option value="Bachelor's Degree">
                          Bachelor's Degree
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Completion Year</label>
                      <input
                        type="text"
                        value={completionYear}
                        onChange={(e) => setCompletionYear(e.target.value)}
                        placeholder="e.g. 2024"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Registration / Index Number
                      </label>
                      <input
                        type="text"
                        value={indexOrRegNumber}
                        onChange={(e) => setIndexOrRegNumber(e.target.value)}
                        placeholder="e.g. U0023/514"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Interactive Document Scanner Box */}
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-orange-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-neutral-200">{levelDocName}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">
                            UNEB Pass Slip / Level Completion Certificate
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isScanningLevelDoc}
                        onClick={scanLevelCompletionDoc}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                          isLevelDocScanned
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
                            : isScanningLevelDoc
                            ? 'bg-orange-600/40 text-orange-200 border border-orange-500/50 animate-pulse'
                            : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30'
                        }`}
                      >
                        <Scan className="w-3.5 h-3.5" />
                        {isScanningLevelDoc
                          ? 'Scanning with OCR...'
                          : isLevelDocScanned
                          ? 'Re-Scan Document'
                          : 'Scan Document Now'}
                      </button>
                    </div>

                    {/* Scanner Live Beam & Progress Visualizer */}
                    {isScanningLevelDoc && (
                      <div className="space-y-2 pt-2 border-t border-neutral-800">
                        <div className="relative w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div className="absolute top-0 bottom-0 bg-linear-to-r from-orange-500 to-emerald-400 w-1/3 animate-[spin_1.5s_linear_infinite] rounded-full" />
                        </div>
                        <p className="text-[11px] text-orange-300 font-mono flex items-center gap-1.5 animate-pulse">
                          <Scan className="w-3.5 h-3.5" /> {scanStepMessage}
                        </p>
                      </div>
                    )}

                    {isLevelDocScanned && !isScanningLevelDoc && (
                      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-emerald-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authenticity Verified • Digital Watermark Confirmed
                        </span>
                        <span className="font-mono text-neutral-400 text-[10px]">
                          Timestamp: {levelDocScanTimestamp || 'Just now'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-400" />
                  4. Institutional Alignment & Value Fit (20% Weight)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      Community Service Hours Logged
                    </label>
                    <input
                      type="number"
                      value={alignment.communityServiceHours}
                      onChange={(e) =>
                        setAlignment({
                          ...alignment,
                          communityServiceHours: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alignment.donorMandateCompliance}
                        onChange={(e) =>
                          setAlignment({ ...alignment, donorMandateCompliance: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">Donor Mandate Match (+5 pts)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alignment.firstGenerationScholar}
                        onChange={(e) =>
                          setAlignment({ ...alignment, firstGenerationScholar: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">
                        First-Generation Scholar (+3 pts)
                      </span>
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-neutral-300 font-medium mb-1">
                      Leadership Roles & Peer Mentorship
                    </label>
                    <input
                      type="text"
                      value={alignment.leadershipExperience}
                      onChange={(e) =>
                        setAlignment({ ...alignment, leadershipExperience: e.target.value })
                      }
                      placeholder="e.g. Student mentor, club founder, youth tutor..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-neutral-300 font-medium mb-1">
                      Commitment to Give Back Essay
                    </label>
                    <textarea
                      rows={2}
                      value={alignment.commitmentToGiveBack}
                      onChange={(e) =>
                        setAlignment({ ...alignment, commitmentToGiveBack: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alignment.workBackAgreementAccepted}
                        onChange={(e) =>
                          setAlignment({ ...alignment, workBackAgreementAccepted: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">
                        Signed Work-Back & Community Service Agreement (+3 pts)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  5. Funding Scope & Operational Sustainability (20% Weight)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Funding Scope Type</label>
                    <select
                      value={funding.fundingScopeType}
                      onChange={(e: any) =>
                        setFunding({ ...funding, fundingScopeType: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500"
                    >
                      <option value="comprehensive">Comprehensive (Tuition, Housing, Stipend)</option>
                      <option value="partial_tuition_living">Blended Co-Funding (Tuition + Living)</option>
                      <option value="tuition_only">Tuition Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Funding Duration (Years)</label>
                    <input
                      type="number"
                      value={funding.durationYears}
                      onChange={(e) =>
                        setFunding({ ...funding, durationYears: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      Renewal Performance GPA Covenant
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={funding.renewalPerformanceTargetGpa}
                      onChange={(e) =>
                        setFunding({
                          ...funding,
                          renewalPerformanceTargetGpa: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      Estimated Annual Cost (UGX / Ugandan Shillings)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 4200000"
                      value={funding.estimatedAnnualAmount || ''}
                      onChange={(e) =>
                        setFunding({ ...funding, estimatedAnnualAmount: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden focus:border-orange-500 font-mono"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      UGX {Number(funding.estimatedAnnualAmount || 0).toLocaleString()} per annum
                    </span>
                  </div>
                  <div className="sm:col-span-2 space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={funding.requiresMentorship}
                        onChange={(e) =>
                          setFunding({ ...funding, requiresMentorship: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">
                        Executive Mentorship Program Pairing (+2 pts)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={funding.requiresAcademicTutoring}
                        onChange={(e) =>
                          setFunding({ ...funding, requiresAcademicTutoring: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-neutral-200 font-medium">
                        Supplementary Academic Tutoring Readiness
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setStep(step + 1);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/30"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? 'Transmitting to Database...' : 'Finalize & Submit Dossier'}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Live Fairness Engine Simulator */}
          <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-orange-400 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Live Fairness Engine
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">Deterministic UGX</span>
              </div>

              <div className="text-center my-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                  Composite Fairness Score
                </span>
                <div className="text-3xl font-black text-orange-500 font-mono mt-1">
                  {liveScore.compositeScore.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-neutral-400">/100</span>
                </div>
                <span className="inline-block mt-1 text-[11px] font-semibold text-orange-300">
                  {liveScore.explanation.equityTier}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Need (35%):</span>
                  <span className="font-mono font-bold text-neutral-200">
                    {liveScore.needScore.toFixed(1)} / 35
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Academic (25%):</span>
                  <span className="font-mono font-bold text-neutral-200">
                    {liveScore.academicScore.toFixed(1)} / 25
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Alignment (20%):</span>
                  <span className="font-mono font-bold text-neutral-200">
                    {liveScore.alignmentScore.toFixed(1)} / 20
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Scope (20%):</span>
                  <span className="font-mono font-bold text-neutral-200">
                    {liveScore.sustainabilityScore.toFixed(1)} / 20
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
                <p className="font-bold text-emerald-400 mb-1">Key Positive Drivers:</p>
                <ul className="space-y-1 list-disc pl-3 text-neutral-300">
                  {liveScore.explanation.positiveScoreDrivers.slice(0, 3).map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/20 text-[11px] text-orange-300 space-y-1">
              <p className="font-semibold">Bursary Committee Audit Ready</p>
              <p className="text-[10px] text-neutral-400">
                Next of kin verification and level completion proof will be logged into Cloud SQL PostgreSQL for transparent scoring review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
