/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GymScene3D } from './components/GymScene3D';
import {
  BodybuilderPhysiqueVisual,
  CableCrossoverMachineVisual,
  HeavyBarbellTrainingVisual,
  LegPressMachineVisual,
} from './components/ArchitecturalVisuals';
import { NutritionCalculator } from './components/NutritionCalculator';
import { MemberStatusLookup } from './components/MemberStatusLookup';
import { AdminPanelModal } from './components/AdminPanelModal';
import {
  AdminQrConfig,
  getInitialAdminConfig,
  getInitialLoggedInEmail,
  getInitialMembers,
  GymMemberSubscription,
  PLAN_CATALOG,
  PlanId,
  saveAdminConfig,
  saveLoggedInEmail,
  saveMembers,
} from './utils/subscriptionStore';
import { ShieldCheck } from 'lucide-react';
import { soundEngine } from './utils/sound';

type MuscleGroupFilter = 'chest' | 'back' | 'legs' | 'arms';
type SplitType = 'ppl' | 'upper-lower' | 'bro-split';

interface MachineGuideItem {
  id: string;
  muscleGroup: MuscleGroupFilter;
  machineName: string;
  targetMuscles: string;
  setsReps: string;
  restTime: string;
  biomechanicsTip: string;
}

const MACHINE_ENCYCLOPEDIA: MachineGuideItem[] = [
  {
    id: 'm-chest-1',
    muscleGroup: 'chest',
    machineName: 'Iso-Lateral Incline Chest Press Machine',
    targetMuscles: 'Clavicular (Upper) Pectorals · Anterior Deltoids · Triceps',
    setsReps: '4 Sets × 8–12 Reps',
    restTime: '90–120 sec',
    biomechanicsTip:
      'Set the seat so handles align with your upper chest. Keep shoulder blades retracted against the pad and control the 3-second eccentric (lowering) phase for maximum upper-chest fiber recruitment.',
  },
  {
    id: 'm-chest-2',
    muscleGroup: 'chest',
    machineName: 'Dual Adjustable Cable Crossover & Pec Deck',
    targetMuscles: 'Sternal & Inner Pectoral Fibers · Constant Tension Adduction',
    setsReps: '3 Sets × 12–15 Reps',
    restTime: '60–90 sec',
    biomechanicsTip:
      'Unlike dumbbells, cables keep full resistance at peak contraction when hands meet in front of your sternum. Pause for 1 full second at the squeeze.',
  },
  {
    id: 'm-back-1',
    muscleGroup: 'back',
    machineName: 'Wide-Grip Lat Pulldown & Seated Cable Row Tower',
    targetMuscles: 'Latissimus Dorsi (V-Taper Width) · Rhomboids · Middle Traps',
    setsReps: '4 Sets × 10–12 Reps',
    restTime: '90 sec',
    biomechanicsTip:
      'Initiate every pull by depressing your shoulder blades (driving elbows down toward your hips) rather than pulling with your biceps. Use a thumbless hook grip to reduce forearm fatigue.',
  },
  {
    id: 'm-back-2',
    muscleGroup: 'back',
    machineName: 'Chest-Supported T-Bar Row Machine',
    targetMuscles: 'Mid-Back Thickness · Rear Deltoids · Erector Spinae Sparing',
    setsReps: '4 Sets × 8–10 Reps',
    restTime: '120 sec',
    biomechanicsTip:
      'The chest pad removes lower-back momentum, forcing 100% of the load onto your lats and rhomboids. Let your shoulder blades protract slightly at the bottom for a deep lat stretch.',
  },
  {
    id: 'm-legs-1',
    muscleGroup: 'legs',
    machineName: '45° Linear Plate-Loaded Leg Press & Hack Squat',
    targetMuscles: 'Quadriceps (Vastus Lateralis/Medialis) · Gluteus Maximus · Hamstrings',
    setsReps: '4 Sets × 10–15 Reps',
    restTime: '120–150 sec',
    biomechanicsTip:
      'Place feet lower on the platform to maximize knee flexion and quad growth; place feet higher and wider to shift tension to glutes and hamstrings. Never lock out knees at the top.',
  },
  {
    id: 'm-legs-2',
    muscleGroup: 'legs',
    machineName: 'Seated Leg Extension & Prone Lying Leg Curl',
    targetMuscles: 'Rectus Femoris Isolation · Biceps Femoris & Semitendinosus',
    setsReps: '3 Sets × 12–15 Reps',
    restTime: '75 sec',
    biomechanicsTip:
      'Align your knee joint directly with the machine pivot axis. Hold the peak contraction for 1 second on extensions and keep hips pressed firmly into the bench on curls.',
  },
  {
    id: 'm-arms-1',
    muscleGroup: 'arms',
    machineName: 'Seated Lateral Raise & Preacher Curl Bench',
    targetMuscles: 'Lateral Deltoid (3D Shoulder Width) · Biceps Brachii Short/Long Head',
    setsReps: '4 Sets × 12–15 Reps',
    restTime: '60–75 sec',
    biomechanicsTip:
      'Lead with your elbows on lateral raises (stopping at shoulder height to avoid trap takeover). On preacher curls, keep triceps glued to the pad to isolate the lower bicep tendon safely.',
  },
  {
    id: 'm-arms-2',
    muscleGroup: 'arms',
    machineName: 'Cable Rope Tricep Pushdown & Overhead Extension',
    targetMuscles: 'Triceps Lateral, Medial & Long Heads (65% of Arm Mass)',
    setsReps: '4 Sets × 10–15 Reps',
    restTime: '60–75 sec',
    biomechanicsTip:
      'Remember that triceps make up two-thirds of upper arm size. Pair heavy rope pushdowns (lateral head) with overhead cable extensions (stretching the long head) for complete arm thickness.',
  },
];

interface WorkoutSplitBlueprint {
  id: SplitType;
  name: string;
  idealFor: string;
  frequency: string;
  summary: string;
  schedule: { day: string; focus: string; keyExercises: string }[];
}

const WORKOUT_SPLITS: Record<SplitType, WorkoutSplitBlueprint> = {
  ppl: {
    id: 'ppl',
    name: 'Push / Pull / Legs (PPL)',
    idealFor: 'Intermediate to Advanced Muscle Hypertrophy',
    frequency: '6 Days / Week · Hits Every Muscle 2× Weekly',
    summary:
      'The gold-standard scientific bodybuilding split. Grouping pushing muscles (Chest, Shoulders, Triceps), pulling muscles (Back, Rear Delts, Biceps), and Lower Body allows optimal recovery while stimulating muscle protein synthesis twice every 7 days.',
    schedule: [
      {
        day: 'Day 1 · Push A',
        focus: 'Chest, Anterior/Lateral Delts & Triceps',
        keyExercises:
          'Barbell Bench Press (4×8), Iso-Lateral Incline Press (3×10), Cable Fly (3×15), Lateral Raises (4×15), Rope Pushdowns (3×12)',
      },
      {
        day: 'Day 2 · Pull A',
        focus: 'Back Width, Mid-Back Thickness & Biceps',
        keyExercises:
          'Weighted Pull-Ups / Lat Pulldown (4×10), Chest-Supported T-Bar Row (4×8), Face Pulls (3×15), Preacher Curls (3×12), Hammer Curls (3×12)',
      },
      {
        day: 'Day 3 · Legs A',
        focus: 'Quad-Dominant Lower Body & Calves',
        keyExercises:
          'Barbell Back Squat (4×6–8), 45° Linear Leg Press (4×12), Romanian Deadlift (3×10), Leg Extensions (3×15), Standing Calf Raises (4×15)',
      },
      {
        day: 'Day 4–6 · Repeat B',
        focus: 'Hypertrophy Volume Variation & Day 7 Rest',
        keyExercises:
          'Repeat Push / Pull / Legs focusing on 10–15 rep machine and cable variations, followed by complete rest on Sunday.',
      },
    ],
  },
  'upper-lower': {
    id: 'upper-lower',
    name: 'Upper / Lower 4-Day Split',
    idealFor: 'Beginners, Busy Professionals & Strength + Size',
    frequency: '4 Days / Week · 3 Full Recovery Days',
    summary:
      'Maximizes strength progression and central nervous system recovery. Two heavy compound days and two higher-rep hypertrophy days give you maximum muscle growth in just 4 sessions per week.',
    schedule: [
      {
        day: 'Monday · Upper A',
        focus: 'Heavy Compound Upper Body',
        keyExercises:
          'Flat Bench Press (4×6), Barbell Bent-Over Row (4×8), Overhead Shoulder Press (3×8), Lat Pulldown (3×10), Barbell Curl & Skullcrushers (3×10)',
      },
      {
        day: 'Tuesday · Lower A',
        focus: 'Heavy Squat & Quad Focus',
        keyExercises:
          'Barbell Squat (4×6), 45° Leg Press (3×10), Lying Leg Curl (3×12), Seated Calf Raise (4×15), Hanging Leg Raises (3×15)',
      },
      {
        day: 'Thursday · Upper B',
        focus: 'Machine & Cable Hypertrophy Upper',
        keyExercises:
          'Incline Dumbbell Press (4×10), Seated Cable Row (4×12), Cable Crossover (3×15), Cable Lateral Raise (4×15), Arms Superset (3×12)',
      },
      {
        day: 'Friday · Lower B',
        focus: 'Posterior Chain, Glutes & Hamstrings',
        keyExercises:
          'Barbell Deadlift or RDL (4×6–8), Hack Squat (3×10), Leg Extension (3×15), Seated Hamstring Curl (3×12), Plank Core Circuit',
      },
    ],
  },
  'bro-split': {
    id: 'bro-split',
    name: '5-Day Body-Part Specialization',
    idealFor: 'Classic Bodybuilding & Weak-Point Sculpting',
    frequency: '5 Days / Week · Dedicated Muscle Focus Daily',
    summary:
      'Allows you to dedicate an entire 60-minute session to exhausting one major muscle group from every anatomical angle (incline, flat, decline, and stretched isolation).',
    schedule: [
      {
        day: 'Monday · Chest',
        focus: 'Upper, Middle & Lower Pectoral Development',
        keyExercises:
          'Incline Barbell Press, Flat Dumbbell Press, Iso-Lateral Machine Press, High-to-Low Cable Crossover, Dips (16 Total Sets)',
      },
      {
        day: 'Tuesday · Back',
        focus: 'V-Taper Lats, Rhomboids & Lower Back',
        keyExercises:
          'Deadlifts, Wide-Grip Lat Pulldown, T-Bar Row, Single-Arm Dumbbell Row, Straight-Arm Cable Pulldown (16 Total Sets)',
      },
      {
        day: 'Wednesday · Shoulders',
        focus: '3D Anterior, Lateral & Posterior Deltoids + Traps',
        keyExercises:
          'Seated Dumbbell Overhead Press, Machine Lateral Raises, Reverse Pec Deck (Rear Delts), Cable Face Pulls, Barbell Shrugs',
      },
      {
        day: 'Thursday · Legs & Friday · Arms',
        focus: 'Complete Lower Body + Dedicated Biceps/Triceps Pump',
        keyExercises:
          'Thursday: Squats, 45° Leg Press, Extensions, Hamstring Curls, Calves · Friday: 9 Sets Biceps + 9 Sets Triceps + Forearms',
      },
    ],
  },
};

export default function App() {
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroupFilter>('chest');
  const [activeSplit, setActiveSplit] = useState<SplitType>('ppl');

  // Persistent Gym Member Subscriptions & Admin QR Configuration
  const [members, setMembers] = useState<GymMemberSubscription[]>(() => getInitialMembers());
  const [adminConfig, setAdminConfig] = useState<AdminQrConfig>(() => getInitialAdminConfig());
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(() => getInitialLoggedInEmail());
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('6m');

  // Admin Modal
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);

  const loggedInMember = loggedInEmail
    ? members.find((m) => m.email.toLowerCase() === loggedInEmail.toLowerCase()) || null
    : null;

  const pendingApprovalsCount = members.filter(
    (m) => m.status === 'pending_approval' || Boolean(m.pendingExtension)
  ).length;

  const mapTierNameToPlanId = (tierName?: string): PlanId => {
    if (!tierName) return '6m';
    const lower = tierName.toLowerCase();
    if (lower.includes('1 month') || lower.includes('1200')) return '1m';
    if (lower.includes('year') || lower.includes('10000') || lower.includes('12')) return '12m';
    return '6m';
  };

  const handleOpenMembershipModal = (defaultTier?: string) => {
    soundEngine.playMechanicalTick(1.1);
    if (defaultTier) {
      setSelectedPlanId(mapTierNameToPlanId(defaultTier));
    }
    const portalEl = document.getElementById('member-status-lookup');
    portalEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoginSuccess = (email: string) => {
    const normalized = email.trim().toLowerCase();
    setLoggedInEmail(normalized);
    saveLoggedInEmail(normalized);
  };

  const handleRegisterMember = (params: {
    name: string;
    email: string;
    phone: string;
    password: string;
    goal: string;
  }): GymMemberSubscription => {
    const now = new Date().toISOString();
    const newAccount: GymMemberSubscription = {
      id: `MEM-${Math.floor(2115 + Math.random() * 7800)}`,
      name: params.name,
      email: params.email.toLowerCase(),
      phone: params.phone,
      password: params.password,
      goal: params.goal,
      planId: selectedPlanId,
      planName: 'No Active Plan',
      amountInr: 0,
      durationDays: 0,
      paymentMethod: 'upi_qr',
      utrNumber: '—',
      screenshotDataUrl: null,
      status: 'no_plan',
      submittedAt: now,
      approvedAt: null,
      startDate: null,
      endDate: null,
      pendingExtension: null,
      paymentHistory: [],
    };

    setMembers((prev) => {
      const updated = [newAccount, ...prev];
      saveMembers(updated);
      return updated;
    });
    handleLoginSuccess(newAccount.email);
    return newAccount;
  };

  const handleLogout = () => {
    setLoggedInEmail(null);
    saveLoggedInEmail(null);
  };

  const handleSubmitAuthenticatedPayment = (params: {
    planId: PlanId;
    utrNumber: string;
    screenshotDataUrl: string;
  }) => {
    if (!loggedInMember) return;
    const plan = PLAN_CATALOG[params.planId];
    const now = new Date().toISOString();
    const historyEntryId = `PAY-${Math.floor(1000 + Math.random() * 8999)}`;

    setMembers((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== loggedInMember.id) return m;

        // Case A: Member already has an active subscription -> Queue cumulative plan expansion!
        if (m.status === 'active') {
          const extId = `EXT-${Math.floor(100 + Math.random() * 899)}`;
          return {
            ...m,
            pendingExtension: {
              id: extId,
              planId: plan.id,
              planName: plan.name,
              addedDays: plan.durationDays,
              amountInr: plan.totalPriceInr,
              utrNumber: params.utrNumber,
              screenshotDataUrl: params.screenshotDataUrl,
              submittedAt: now,
            },
            paymentHistory: [
              {
                id: historyEntryId,
                type: 'plan_expansion' as const,
                planId: plan.id,
                planName: plan.name,
                addedDays: plan.durationDays,
                amountInr: plan.totalPriceInr,
                utrNumber: params.utrNumber,
                screenshotDataUrl: params.screenshotDataUrl,
                status: 'pending_approval' as const,
                submittedAt: now,
                approvedAt: null,
              },
              ...(m.paymentHistory || []),
            ],
          };
        }

        // Case B: Member has no active plan or is starting fresh -> Queue initial membership approval!
        return {
          ...m,
          planId: plan.id,
          planName: plan.name,
          amountInr: plan.totalPriceInr,
          durationDays: plan.durationDays,
          paymentMethod: 'upi_qr' as const,
          utrNumber: params.utrNumber,
          screenshotDataUrl: params.screenshotDataUrl,
          status: 'pending_approval' as const,
          submittedAt: now,
          paymentHistory: [
            {
              id: historyEntryId,
              type: 'initial_join' as const,
              planId: plan.id,
              planName: plan.name,
              addedDays: plan.durationDays,
              amountInr: plan.totalPriceInr,
              utrNumber: params.utrNumber,
              screenshotDataUrl: params.screenshotDataUrl,
              status: 'pending_approval' as const,
              submittedAt: now,
              approvedAt: null,
            },
            ...(m.paymentHistory || []),
          ],
        };
      });
      saveMembers(updated);
      return updated;
    });
  };

  const handleAddMemberSubmission = (newMember: GymMemberSubscription) => {
    setMembers((prev) => {
      const updated = [newMember, ...prev];
      saveMembers(updated);
      return updated;
    });
  };

  const handleApproveMember = (memberId: string) => {
    const now = new Date();
    const nowIso = now.toISOString();

    setMembers((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== memberId) return m;

        // If approving a Pending Plan Expansion (+Days added to current plan)
        if (m.pendingExtension) {
          const ext = m.pendingExtension;
          const currentEndMs = m.endDate ? new Date(m.endDate).getTime() : now.getTime();
          const baseMs = Math.max(now.getTime(), currentEndMs);
          const nextEnd = new Date(baseMs + ext.addedDays * 24 * 60 * 60 * 1000);

          const updatedHistory = (m.paymentHistory || []).map((h) =>
            h.utrNumber === ext.utrNumber && h.status === 'pending_approval'
              ? { ...h, status: 'approved' as const, approvedAt: nowIso }
              : h
          );

          return {
            ...m,
            status: 'active' as const,
            planId: ext.planId,
            planName: `${m.planName} + ${ext.planName}`,
            amountInr: m.amountInr + ext.amountInr,
            durationDays: m.durationDays + ext.addedDays,
            utrNumber: ext.utrNumber,
            screenshotDataUrl: ext.screenshotDataUrl || m.screenshotDataUrl,
            approvedAt: nowIso,
            startDate: m.startDate || nowIso,
            endDate: nextEnd.toISOString(),
            pendingExtension: null,
            paymentHistory: updatedHistory,
          };
        }

        // Otherwise approving initial membership
        const end = new Date(now.getTime() + m.durationDays * 24 * 60 * 60 * 1000);
        const updatedHistory = (m.paymentHistory || []).map((h) =>
          h.status === 'pending_approval'
            ? { ...h, status: 'approved' as const, approvedAt: nowIso }
            : h
        );

        return {
          ...m,
          status: 'active' as const,
          approvedAt: nowIso,
          startDate: nowIso,
          endDate: end.toISOString(),
          paymentHistory: updatedHistory,
        };
      });
      saveMembers(updated);
      return updated;
    });
  };

  const handleRejectMember = (memberId: string) => {
    setMembers((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== memberId) return m;
        if (m.pendingExtension) {
          const extUtr = m.pendingExtension.utrNumber;
          return {
            ...m,
            pendingExtension: null,
            paymentHistory: (m.paymentHistory || []).map((h) =>
              h.utrNumber === extUtr && h.status === 'pending_approval'
                ? { ...h, status: 'rejected' as const }
                : h
            ),
          };
        }
        return {
          ...m,
          status: 'rejected' as const,
          startDate: null,
          endDate: null,
          paymentHistory: (m.paymentHistory || []).map((h) =>
            h.status === 'pending_approval' ? { ...h, status: 'rejected' as const } : h
          ),
        };
      });
      saveMembers(updated);
      return updated;
    });
  };

  const handleExtendMemberDays = (memberId: string, extraDays: number, extraAmountInr: number) => {
    const now = new Date();
    const nowIso = now.toISOString();
    setMembers((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== memberId) return m;
        const currentEndMs = m.endDate ? new Date(m.endDate).getTime() : now.getTime();
        const baseMs = Math.max(now.getTime(), currentEndMs);
        const nextEnd = new Date(baseMs + extraDays * 24 * 60 * 60 * 1000);
        return {
          ...m,
          status: 'active' as const,
          amountInr: m.amountInr + extraAmountInr,
          durationDays: m.durationDays + extraDays,
          startDate: m.startDate || nowIso,
          endDate: nextEnd.toISOString(),
          paymentHistory: [
            {
              id: `PAY-${Math.floor(1000 + Math.random() * 8999)}`,
              type: 'admin_topup' as const,
              planId: '1m' as const,
              planName: `Admin +${extraDays}d Stack`,
              addedDays: extraDays,
              amountInr: extraAmountInr,
              utrNumber: `ADMIN-TOPUP-${Math.floor(100 + Math.random() * 899)}`,
              screenshotDataUrl: null,
              status: 'approved' as const,
              submittedAt: nowIso,
              approvedAt: nowIso,
            },
            ...(m.paymentHistory || []),
          ],
        };
      });
      saveMembers(updated);
      return updated;
    });
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers((prev) => {
      const updated = prev.filter((m) => m.id !== memberId);
      saveMembers(updated);
      return updated;
    });
  };

  const handleUpdateAdminConfig = (nextConfig: AdminQrConfig) => {
    setAdminConfig(nextConfig);
    saveAdminConfig(nextConfig);
  };

  const filteredMachines = MACHINE_ENCYCLOPEDIA.filter((m) => m.muscleGroup === muscleFilter);
  const currentSplit = WORKOUT_SPLITS[activeSplit];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F4F4F6] flex flex-col">
      {/* Top Bar Contract: Strictly 1 row, 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-8 px-6 lg:px-12 bg-[#09090B]/95 border-b border-white/[0.07]">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#studio-3d"
          className="font-display text-xl font-semibold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          21 Fitness
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-neutral-400">
          <a
            href="#studio-3d"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            3D Gym Floor
          </a>
          <a
            href="#machines"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Machines &amp; Physique
          </a>
          <a
            href="#fitness-guide"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Diet Calculator
          </a>
          <a
            href="#member-status-lookup"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {loggedInMember ? 'My Subscription' : 'Member Email Login'}
          </a>
          <button
            type="button"
            onClick={() => {
              soundEngine.playMechanicalTick(1.1);
              setAdminModalOpen(true);
            }}
            className="text-[#D4AF37] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer font-medium"
          >
            Admin Panel ({pendingApprovalsCount} Pending)
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => handleOpenMembershipModal('6 Months Transformation')}
            className="px-4 py-2 text-xs font-medium text-[#09090B] bg-[#D4AF37] hover:bg-[#e2be46] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {loggedInMember
              ? `${loggedInMember.name.split(' ')[0]} · Expand Plan`
              : 'Login & Join'}
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* 1. Interactive 3D WebGL Gym Floor */}
        <GymScene3D onOpenMembershipModal={handleOpenMembershipModal} />

        {/* Full-Width 4-Column Gym & Pricing Highlights Strip */}
        <section
          aria-label="21 Fitness Key Specifications and Membership Rates"
          className="border-b border-white/[0.07] bg-[#0C0C0F]"
        >
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="font-display text-2xl lg:text-3xl font-semibold text-[#D4AF37] tabular-nums">
                ₹1,200 / mo
              </div>
              <div className="mt-1 text-xs text-neutral-400">
                Monthly Plan · ₹6,000 (6M) · ₹10,000 (1Yr)
              </div>
            </div>
            <div>
              <div className="font-display text-2xl lg:text-3xl font-semibold text-white tabular-nums">
                45+ Machines
              </div>
              <div className="mt-1 text-xs text-neutral-400">
                Biomechanically Calibrated Strength Lineup
              </div>
            </div>
            <div>
              <div className="font-display text-2xl lg:text-3xl font-semibold text-white tabular-nums">
                2.5 – 50 kg
              </div>
              <div className="mt-1 text-xs text-neutral-400">
                Complete Dumbbell, Barbell &amp; Plate Run
              </div>
            </div>
            <div>
              <div className="font-display text-2xl lg:text-3xl font-semibold text-white tabular-nums">
                05:30 – 22:30
              </div>
              <div className="mt-1 text-xs text-neutral-400">
                Certified Bodybuilding &amp; Transformation Coaches
              </div>
            </div>
          </div>
        </section>

        {/* 2. Original Bodybuilder & Commercial Machine Showcase (Asymmetric Bento Grid) */}
        <section id="machines" className="py-24 lg:py-28 border-b border-white/[0.07]">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mb-14">
              <p className="text-xs text-[#D4AF37] font-medium mb-2.5">
                21 Fitness · Original Equipment &amp; Bodybuilding Culture
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Real iron, commercial machines, and proven hypertrophy science.
              </h2>
              <p className="mt-3.5 text-neutral-400 text-sm sm:text-base leading-relaxed">
                Whether your goal is stepping on a bodybuilding stage, adding 8 kg of lean muscle,
                or dropping stubborn body fat, 21 Fitness combines heavy free weights with smooth
                biomechanical isolation machines.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 01: Bodybuilder Physique & Hypertrophy (Span 2) */}
              <article className="lg:col-span-2 border border-white/[0.08] bg-[#111114] rounded-lg flex flex-col justify-between overflow-hidden">
                <BodybuilderPhysiqueVisual />
                <div className="p-7 lg:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 mb-2">
                      <span>01. Muscle Hypertrophy</span>
                      <span aria-hidden="true"> · </span>
                      <span>Mechanical Tension &amp; Progressive Overload</span>
                    </div>
                    <h3 className="font-display text-xl lg:text-2xl font-medium text-white">
                      Bodybuilding &amp; Physique Transformation Floor
                    </h3>
                    <p className="mt-2.5 text-sm text-neutral-400 leading-relaxed max-w-[62ch]">
                      Muscle growth requires three scientific drivers:{' '}
                      <strong className="text-neutral-200 font-medium">mechanical tension</strong>{' '}
                      (lifting progressively heavier loads through a full range of motion),{' '}
                      <strong className="text-neutral-200 font-medium">metabolic stress</strong>{' '}
                      (controlled pump sets), and{' '}
                      <strong className="text-neutral-200 font-medium">
                        sufficient protein recovery
                      </strong>
                      . Our floor coaches track your logbook weekly.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-neutral-300 tabular-nums">
                      Target: 12–20 hard working sets per muscle group / week
                    </span>
                    <a
                      href="#fitness-guide"
                      className="text-[#D4AF37] hover:underline whitespace-nowrap shrink-0"
                    >
                      Calculate Your Macros →
                    </a>
                  </div>
                </div>
              </article>

              {/* Card 02: Original Machine — 45° Linear Leg Press & Hack Squat (Span 1) */}
              <article className="lg:col-span-1 border border-white/[0.08] bg-[#111114] rounded-lg flex flex-col justify-between overflow-hidden">
                <LegPressMachineVisual />
                <div className="p-7 lg:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 mb-2">
                      <span>02. Lower Body Machine</span>
                      <span aria-hidden="true"> · </span>
                      <span>600 kg Rated</span>
                    </div>
                    <h3 className="font-display text-xl lg:text-2xl font-medium text-white">
                      45° Linear Leg Press &amp; Hack Squat
                    </h3>
                    <p className="mt-2.5 text-sm text-neutral-400 leading-relaxed">
                      Built with ultra-smooth linear bearings and an oversized diamond footplate so
                      you can overload your quadriceps, glutes, and hamstrings without lower-back
                      strain.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Optimal: 4 Sets × 10–15 Reps</span>
                    <a
                      href="#studio-3d"
                      className="text-[#D4AF37] hover:underline whitespace-nowrap shrink-0"
                    >
                      View in 3D ↑
                    </a>
                  </div>
                </div>
              </article>

              {/* Card 03: Original Machine — Dual Adjustable Cable Crossover (Span 1) */}
              <article className="lg:col-span-1 border border-white/[0.08] bg-[#111114] rounded-lg flex flex-col justify-between overflow-hidden">
                <CableCrossoverMachineVisual />
                <div className="p-7 lg:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 mb-2">
                      <span>03. Isolation Machine</span>
                      <span aria-hidden="true"> · </span>
                      <span>2×100 kg Stacks</span>
                    </div>
                    <h3 className="font-display text-xl lg:text-2xl font-medium text-white">
                      Dual Cable Crossover &amp; Lat Tower
                    </h3>
                    <p className="mt-2.5 text-sm text-neutral-400 leading-relaxed">
                      Provides continuous resistance from full stretch to peak contraction for chest
                      flyes, lat pulldowns, cable lateral raises, and tricep pushdowns.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-neutral-400">
                    21 height pulley adjustments · 2:1 smooth ratio
                  </div>
                </div>
              </article>

              {/* Card 04: Compound Barbell & Free-Weight Zone (Span 2) */}
              <article className="lg:col-span-2 border border-white/[0.08] bg-[#111114] rounded-lg flex flex-col justify-between overflow-hidden">
                <HeavyBarbellTrainingVisual />
                <div className="p-7 lg:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-neutral-400 mb-2">
                      <span>04. Compound Strength</span>
                      <span aria-hidden="true"> · </span>
                      <span>Squat, Bench &amp; Deadlift Platforms</span>
                    </div>
                    <h3 className="font-display text-xl lg:text-2xl font-medium text-white">
                      Olympic Free-Weight &amp; Power Rack Sanctuary
                    </h3>
                    <p className="mt-2.5 text-sm text-neutral-400 leading-relaxed max-w-[62ch]">
                      Compound multi-joint lifts recruit the highest number of motor units and
                      stimulate natural testosterone and growth hormone response. Train on our
                      80 mm shock-absorbing oak platforms with calibrated 20 kg Olympic bars and
                      heavy-duty safety spotters.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-neutral-300">
                      Rest 2–3 minutes between heavy compound sets for full ATP recovery
                    </span>
                    <a
                      href="#studio-3d"
                      className="text-[#D4AF37] hover:underline whitespace-nowrap shrink-0"
                    >
                      Inspect Rack in 3D ↑
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* 3. Comprehensive Fitness & Nutrition Science Hub */}
        <section
          id="fitness-guide"
          className="py-24 lg:py-28 border-b border-white/[0.07] bg-[#0C0C0F]"
        >
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mb-14">
              <p className="text-xs text-[#D4AF37] font-medium mb-2.5">
                21 Fitness Knowledge Hub · Training &amp; Nutrition Science
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Everything you need to know to build muscle and lose fat.
              </h2>
              <p className="mt-3.5 text-neutral-400 text-sm sm:text-base leading-relaxed">
                Lifting weights is only half the equation. Use our full-featured clinical calorie,
                protein, and meal-plan calculator below alongside our machine biomechanics guide.
              </p>
            </div>

            {/* Part A: Enhanced Clinical Calorie, Protein & Meal Plan Calculator */}
            <NutritionCalculator />

            {/* Part B: Interactive Machine & Muscle Anatomy Guide + Weekly Workout Splits */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left 7 Cols: Machine & Muscle Execution Guide */}
              <div className="lg:col-span-7 border border-white/[0.08] bg-[#111114] rounded-lg p-7 lg:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.07]">
                    <div>
                      <p className="text-xs text-[#D4AF37] mb-1">Machine Biomechanics Guide</p>
                      <h3 className="font-display text-xl sm:text-2xl font-semibold text-white">
                        How to Use 21 Fitness Machines
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 p-1 bg-[#09090B] border border-white/[0.07] rounded-md">
                      {(
                        [
                          { id: 'chest', label: 'Chest' },
                          { id: 'back', label: 'Back' },
                          { id: 'legs', label: 'Legs' },
                          { id: 'arms', label: 'Delts & Arms' },
                        ] as { id: MuscleGroupFilter; label: string }[]
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playMechanicalTick(1.0);
                            setMuscleFilter(tab.id);
                          }}
                          className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            muscleFilter === tab.id
                              ? 'bg-white text-[#09090B] font-medium'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-white/[0.07] mt-2">
                    {filteredMachines.map((item) => (
                      <div key={item.id} className="py-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-display text-lg font-medium text-white">
                            {item.machineName}
                          </h4>
                          <span className="font-mono text-xs text-[#D4AF37] tabular-nums">
                            {item.setsReps} · Rest {item.restTime}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-300 mb-2">
                          Target: {item.targetMuscles}
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          <span className="text-white font-medium">Pro Form Tip: </span>
                          {item.biomechanicsTip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.07] text-xs text-neutral-400">
                  Golden Rule of Progressive Overload: Once you hit the top of your target rep range
                  with clean form, increase the weight by 2.5 kg next session.
                </div>
              </div>

              {/* Right 5 Cols: Proven Weekly Training Splits */}
              <div className="lg:col-span-5 border border-white/[0.08] bg-[#111114] rounded-lg p-7 lg:p-8 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-[#D4AF37] mb-1">Structured Weekly Programming</p>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-white mb-4">
                    Proven Workout Splits
                  </h3>

                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#09090B] border border-white/[0.07] rounded-md mb-5">
                    {(
                      [
                        { id: 'ppl', label: '6-Day PPL' },
                        { id: 'upper-lower', label: '4-Day U/L' },
                        { id: 'bro-split', label: '5-Day Split' },
                      ] as { id: SplitType; label: string }[]
                    ).map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playMechanicalTick(1.05);
                          setActiveSplit(sp.id);
                        }}
                        className={`py-1.5 text-xs rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          activeSplit === sp.id
                            ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-neutral-300 mb-1 font-medium">
                    {currentSplit.name} ·{' '}
                    <span className="text-[#D4AF37]">{currentSplit.frequency}</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-5">
                    {currentSplit.summary}
                  </p>

                  <div className="space-y-3">
                    {currentSplit.schedule.map((row) => (
                      <div
                        key={row.day}
                        className="p-3.5 bg-[#09090B] border border-white/[0.06] rounded-md"
                      >
                        <div className="flex items-center justify-between text-xs font-medium text-white mb-1">
                          <span>{row.day}</span>
                          <span className="text-[#D4AF37]">{row.focus}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          {row.keyExercises}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Membership Plans (₹1,200 / Month, ₹6,000 / 6 Months, ₹10,000 / Year), QR Checkout & Member Status Tracker */}
        <section id="membership" className="py-24 lg:py-28">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
              <div className="max-w-2xl">
                <p className="text-xs text-[#D4AF37] font-medium mb-2.5">
                  21 Fitness Membership Packages · Instant UPI QR Checkout
                </p>
                <h2
                  className="font-display text-3xl sm:text-4xl font-semibold text-white"
                  style={{ textWrap: 'balance' }}
                >
                  Choose your plan, scan the QR code, and upload your payment screenshot.
                </h2>
                <p className="mt-3 text-neutral-400 text-sm sm:text-base">
                  Once you upload your payment screenshot, the 21 Fitness Admin verifies your
                  transfer and activates your subscription countdown immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playMechanicalTick(1.1);
                  setAdminModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#111114] hover:bg-white/10 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-medium rounded-md flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  Owner Admin Panel ({pendingApprovalsCount} Pending Approval
                  {pendingApprovalsCount === 1 ? '' : 's'})
                </span>
              </button>
            </div>

            {/* 3 Membership Cards: ₹1,200 (1 Month), ₹6,000 (6 Months), ₹10,000 (1 Year) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
              {(['1m', '6m', '12m'] as PlanId[]).map((pid) => {
                const tier = PLAN_CATALOG[pid];
                const isSelected = selectedPlanId === pid;

                return (
                  <div
                    key={tier.id}
                    className={`border rounded-lg p-7 lg:p-9 flex flex-col justify-between transition-colors ${
                      tier.highlighted
                        ? 'bg-[#131318] border-[#D4AF37]/60'
                        : 'bg-[#111114] border-white/[0.08]'
                    }`}
                  >
                    <div>
                      <div className="text-xs text-[#D4AF37] font-medium mb-1.5">{tier.kicker}</div>
                      <h3 className="font-display text-2xl font-semibold text-white">
                        {tier.name}
                      </h3>
                      <div className="mt-4 pb-5 border-b border-white/[0.07]">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-3xl lg:text-4xl font-semibold text-white tabular-nums">
                            ₹{tier.totalPriceInr.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-neutral-400">/ {tier.durationLabel}</span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-1 font-mono tabular-nums">
                          {tier.savingsBadge}
                        </div>
                      </div>
                      <p className="mt-5 text-sm text-neutral-400 leading-relaxed">
                        {tier.summary}
                      </p>

                      <ul className="mt-6 space-y-3 text-xs text-neutral-300">
                        {tier.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5">
                            <span className="text-[#D4AF37] mt-0.5">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playMechanicalTick(1.15);
                          setSelectedPlanId(tier.id);
                          const portalEl = document.getElementById('member-status-lookup');
                          portalEl?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full py-2.5 px-4 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          tier.highlighted || isSelected
                            ? 'bg-[#D4AF37] hover:bg-[#e2be46] text-[#09090B]'
                            : 'bg-white/[0.08] hover:bg-white/15 text-white'
                        }`}
                      >
                        {isSelected
                          ? `Selected: ${tier.name} (₹${tier.totalPriceInr.toLocaleString('en-IN')})`
                          : `Select ${tier.name} · ₹${tier.totalPriceInr.toLocaleString('en-IN')}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Single Unified Member Portal: Email Login, Subscription Countdown & QR Checkout */}
            <MemberStatusLookup
              members={members}
              loggedInMember={loggedInMember}
              adminConfig={adminConfig}
              selectedPlanId={selectedPlanId}
              onSelectPlanId={setSelectedPlanId}
              onLoginSuccess={handleLoginSuccess}
              onRegisterMember={handleRegisterMember}
              onLogout={handleLogout}
              onSubmitAuthenticatedPayment={handleSubmitAuthenticatedPayment}
              onOpenAdminPanel={() => setAdminModalOpen(true)}
            />
          </div>
        </section>
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-white/[0.07] bg-[#070709] py-12">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="font-display text-lg font-semibold text-white">21 Fitness</div>
            <p className="text-xs text-neutral-500 mt-1">
              Bodybuilding, Strength &amp; Conditioning Club · Plans from ₹1,200/month
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-400">
            <a href="#studio-3d" className="hover:text-white transition-colors">
              3D Gym Floor
            </a>
            <a href="#machines" className="hover:text-white transition-colors">
              Machines &amp; Physique
            </a>
            <a href="#fitness-guide" className="hover:text-white transition-colors">
              Macro Calculator &amp; Splits
            </a>
            <a href="#member-status-lookup" className="hover:text-white transition-colors">
              Member Portal
            </a>
            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className="text-[#D4AF37] hover:underline cursor-pointer"
            >
              Owner Admin Panel ({pendingApprovalsCount} Pending)
            </button>
            <span className="text-neutral-600">© {new Date().getFullYear()} 21 Fitness.</span>
          </div>
        </div>
      </footer>

      {/* Owner Admin Panel Modal */}
      <AdminPanelModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        members={members}
        onApproveMember={handleApproveMember}
        onRejectMember={handleRejectMember}
        onExtendMemberDays={handleExtendMemberDays}
        onDeleteMember={handleDeleteMember}
        onAddOfflineMember={handleAddMemberSubmission}
        adminConfig={adminConfig}
        onUpdateAdminConfig={handleUpdateAdminConfig}
      />
    </div>
  );
}
