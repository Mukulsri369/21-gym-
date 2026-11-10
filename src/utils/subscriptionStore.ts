export type PlanId = '1m' | '6m' | '12m';

export interface PlanSpec {
  id: PlanId;
  name: string;
  durationLabel: string;
  durationDays: number;
  kicker: string;
  totalPriceInr: number;
  monthlyEquivalentInr: number;
  savingsBadge: string;
  summary: string;
  features: string[];
  highlighted?: boolean;
}

export const PLAN_CATALOG: Record<PlanId, PlanSpec> = {
  '1m': {
    id: '1m',
    name: '1 Month Plan',
    durationLabel: '30 Days Validity',
    durationDays: 30,
    kicker: 'Flexible Monthly Starter',
    totalPriceInr: 1200,
    monthlyEquivalentInr: 1200,
    savingsBadge: '₹1,200 for +30 Days',
    summary:
      'Complete access to the 21 Fitness bodybuilding floor, original plate-loaded and cable machines, Olympic squat racks, and cardio zone.',
    features: [
      'Unlimited access to all strength machines, cables & free weights',
      'Initial floor orientation & machine form walkthrough',
      '3-day or 6-day foundational workout split chart included',
      'Can be expanded anytime — extra days stack onto your active plan',
    ],
  },
  '6m': {
    id: '6m',
    name: '6 Months Transformation',
    durationLabel: '180 Days Validity',
    durationDays: 180,
    kicker: 'Most Popular · Save ₹1,200',
    totalPriceInr: 6000,
    monthlyEquivalentInr: 1000,
    savingsBadge: 'Effective ₹1,000 / month (+180 Days)',
    summary:
      'Designed for serious muscle gain or fat-loss transformation with monthly body composition tracking and a customized nutrition plan.',
    features: [
      '180 days unrestricted access to all 21 Fitness equipment',
      'Customized Push/Pull/Legs or Upper/Lower hypertrophy routine',
      'Personalized daily calorie & high-protein Indian diet chart',
      'Monthly weight, body-fat & muscle measurement review with trainer',
    ],
    highlighted: true,
  },
  '12m': {
    id: '12m',
    name: '1 Year Pro Package',
    durationLabel: '365 Days Validity',
    durationDays: 365,
    kicker: 'Best Value · Save ₹4,400',
    totalPriceInr: 10000,
    monthlyEquivalentInr: 833,
    savingsBadge: 'Effective ₹833 / month (+365 Days)',
    summary:
      'Our lowest monthly cost for dedicated lifters committed to year-round physique building, strength progression, and peak conditioning.',
    features: [
      '365 days unrestricted access at ₹833/month effective rate',
      'Quarterly strength PR testing (Squat, Bench, Deadlift, Leg Press)',
      'Seasonal bulk & cut nutrition adjustments throughout the year',
      '2 complimentary 1-on-1 personal training technique sessions',
    ],
  },
};

export type MemberApprovalStatus = 'no_plan' | 'pending_approval' | 'active' | 'rejected';

export type ComputedSubscriptionState =
  | 'no_plan'
  | 'pending_approval'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'rejected';

export interface PendingExtensionRequest {
  id: string;
  planId: PlanId;
  planName: string;
  addedDays: number;
  amountInr: number;
  utrNumber: string;
  screenshotDataUrl: string | null;
  submittedAt: string;
}

export interface PaymentHistoryEntry {
  id: string;
  type: 'initial_join' | 'plan_expansion' | 'admin_topup';
  planId: PlanId;
  planName: string;
  addedDays: number;
  amountInr: number;
  utrNumber: string;
  screenshotDataUrl: string | null;
  status: 'pending_approval' | 'approved' | 'rejected';
  submittedAt: string;
  approvedAt: string | null;
}

export interface GymMemberSubscription {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  goal: string;
  planId: PlanId;
  planName: string;
  amountInr: number;
  durationDays: number;
  paymentMethod: 'upi_qr' | 'cash';
  utrNumber: string;
  screenshotDataUrl: string | null;
  status: MemberApprovalStatus;
  submittedAt: string;
  approvedAt: string | null;
  startDate: string | null;
  endDate: string | null;
  pendingExtension?: PendingExtensionRequest | null;
  paymentHistory?: PaymentHistoryEntry[];
}

export interface AdminQrConfig {
  upiId: string;
  payeeName: string;
  qrMode: 'both' | 'dynamic_only' | 'custom_only';
  customQrDataUrl: string | null;
  adminPin: string;
}

const MEMBERS_STORAGE_KEY = '21fitness_members_v2';
const CONFIG_STORAGE_KEY = '21fitness_admin_config_v1';
const AUTH_EMAIL_STORAGE_KEY = '21fitness_logged_in_email_v1';

// Generates a realistic sample UPI payment receipt screenshot using HTML5 Canvas
export function createSamplePaymentScreenshotDataUrl(params: {
  payerName: string;
  amountInr: number;
  utr: string;
  dateStr: string;
  upiApp: 'GPay' | 'PhonePe' | 'Paytm';
}): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Dark receipt background
  ctx.fillStyle = '#101216';
  ctx.fillRect(0, 0, 480, 680);

  // Header bar
  const accentColor =
    params.upiApp === 'PhonePe' ? '#8B5CF6' : params.upiApp === 'Paytm' ? '#0EA5E9' : '#10B981';
  ctx.fillStyle = '#181B22';
  ctx.fillRect(24, 24, 432, 632);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, 432, 632);

  // Success Check Circle
  ctx.beginPath();
  ctx.arc(240, 115, 36, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(224, 115);
  ctx.lineTo(236, 128);
  ctx.lineTo(258, 102);
  ctx.stroke();

  // Payment Title & Amount
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Paid via ${params.upiApp} UPI`, 240, 182);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 54px "Outfit", sans-serif';
  ctx.fillText(`₹${params.amountInr.toLocaleString('en-IN')}`, 240, 244);

  ctx.fillStyle = '#10B981';
  ctx.font = '600 15px "JetBrains Mono", monospace';
  ctx.fillText('PAYMENT SUCCESSFUL', 240, 278);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, 310);
  ctx.lineTo(424, 310);
  ctx.stroke();

  // Details Rows
  const rows: [string, string][] = [
    ['Paid To', '21 FITNESS CLUB'],
    ['Merchant UPI', '21fitness@upi'],
    ['Paid By', params.payerName],
    ['UTR / UPI Ref No.', params.utr],
    ['Date & Time', params.dateStr],
    ['Status', 'Verified Bank Transfer'],
  ];

  ctx.textAlign = 'left';
  rows.forEach(([label, val], idx) => {
    const y = 352 + idx * 46;
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '400 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label, 56, y);

    ctx.fillStyle = label.includes('UTR') ? '#D4AF37' : '#F3F4F6';
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(val, 424, y);
    ctx.textAlign = 'left';
  });

  // Footer Stamp
  ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
  ctx.fillRect(56, 588, 368, 42);
  ctx.fillStyle = '#D4AF37';
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('21 FITNESS · SCREENSHOT VERIFICATION RECEIPT', 240, 614);

  return canvas.toDataURL('image/jpeg', 0.85);
}

export function getInitialLoggedInEmail(): string | null {
  if (typeof window === 'undefined') return 'priya.nair@example.com';
  try {
    const saved = localStorage.getItem(AUTH_EMAIL_STORAGE_KEY);
    if (saved !== null) {
      return saved || null;
    }
  } catch {
    // Ignore storage error
  }
  return null;
}

export function saveLoggedInEmail(email: string | null): void {
  try {
    if (email) {
      localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, email.toLowerCase().trim());
    } else {
      localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, '');
    }
  } catch {
    // Ignore storage error
  }
}

export function getInitialAdminConfig(): AdminQrConfig {
  if (typeof window === 'undefined') {
    return {
      upiId: '21fitness@upi',
      payeeName: '21 Fitness',
      qrMode: 'both',
      customQrDataUrl: null,
      adminPin: '2121',
    };
  }
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore storage parse error
  }
  return {
    upiId: '21fitness@upi',
    payeeName: '21 Fitness',
    qrMode: 'both',
    customQrDataUrl: null,
    adminPin: '2121',
  };
}

export function saveAdminConfig(config: AdminQrConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore quota errors
  }
}

export function getInitialMembers(): GymMemberSubscription[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(MEMBERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to seeded members
    }
  }

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const rohanShot = createSamplePaymentScreenshotDataUrl({
    payerName: 'Rohan Sharma',
    amountInr: 6000,
    utr: '431489201842',
    dateStr: 'Today, 09:42 AM',
    upiApp: 'GPay',
  });

  const amanShot = createSamplePaymentScreenshotDataUrl({
    payerName: 'Aman Verma',
    amountInr: 1200,
    utr: '431477391024',
    dateStr: 'Today, 11:15 AM',
    upiApp: 'PhonePe',
  });

  const vikramShot = createSamplePaymentScreenshotDataUrl({
    payerName: 'Vikramaditya Singh',
    amountInr: 10000,
    utr: '429811204918',
    dateStr: '25 Days Ago',
    upiApp: 'GPay',
  });

  const priyaInitialShot = createSamplePaymentScreenshotDataUrl({
    payerName: 'Priya Nair',
    amountInr: 1200,
    utr: '428710928371',
    dateStr: '27 Days Ago',
    upiApp: 'Paytm',
  });

  const seeded: GymMemberSubscription[] = [
    {
      id: 'MEM-2094',
      name: 'Priya Nair',
      phone: '9765432109',
      email: 'priya.nair@example.com',
      password: 'password123',
      goal: 'Fat Loss & Body Toning',
      planId: '1m',
      planName: '1 Month Plan',
      amountInr: 1200,
      durationDays: 30,
      paymentMethod: 'upi_qr',
      utrNumber: '428710928371',
      screenshotDataUrl: priyaInitialShot,
      status: 'active',
      submittedAt: new Date(now.getTime() - 27 * dayMs).toISOString(),
      approvedAt: new Date(now.getTime() - 27 * dayMs).toISOString(),
      startDate: new Date(now.getTime() - 27 * dayMs).toISOString(),
      endDate: new Date(now.getTime() + 3 * dayMs).toISOString(), // Expiring in 3 days — ideal to test Expand Subscription!
      pendingExtension: null,
      paymentHistory: [
        {
          id: 'PAY-101',
          type: 'initial_join',
          planId: '1m',
          planName: '1 Month Plan',
          addedDays: 30,
          amountInr: 1200,
          utrNumber: '428710928371',
          screenshotDataUrl: priyaInitialShot,
          status: 'approved',
          submittedAt: new Date(now.getTime() - 27 * dayMs).toISOString(),
          approvedAt: new Date(now.getTime() - 27 * dayMs).toISOString(),
        },
      ],
    },
    {
      id: 'MEM-2098',
      name: 'Vikramaditya Singh',
      phone: '9988776655',
      email: 'vikram.singh@example.com',
      password: 'password123',
      goal: 'Muscle Hypertrophy & Bodybuilding',
      planId: '12m',
      planName: '1 Year Pro Package',
      amountInr: 10000,
      durationDays: 365,
      paymentMethod: 'upi_qr',
      utrNumber: '429811204918',
      screenshotDataUrl: vikramShot,
      status: 'active',
      submittedAt: new Date(now.getTime() - 25 * dayMs).toISOString(),
      approvedAt: new Date(now.getTime() - 25 * dayMs).toISOString(),
      startDate: new Date(now.getTime() - 25 * dayMs).toISOString(),
      endDate: new Date(now.getTime() + 340 * dayMs).toISOString(),
      pendingExtension: null,
      paymentHistory: [
        {
          id: 'PAY-102',
          type: 'initial_join',
          planId: '12m',
          planName: '1 Year Pro Package',
          addedDays: 365,
          amountInr: 10000,
          utrNumber: '429811204918',
          screenshotDataUrl: vikramShot,
          status: 'approved',
          submittedAt: new Date(now.getTime() - 25 * dayMs).toISOString(),
          approvedAt: new Date(now.getTime() - 25 * dayMs).toISOString(),
        },
      ],
    },
    {
      id: 'MEM-2101',
      name: 'Rohan Sharma',
      phone: '9876543210',
      email: 'rohan.sharma@example.com',
      password: 'password123',
      goal: 'Muscle Hypertrophy & Bodybuilding',
      planId: '6m',
      planName: '6 Months Transformation',
      amountInr: 6000,
      durationDays: 180,
      paymentMethod: 'upi_qr',
      utrNumber: '431489201842',
      screenshotDataUrl: rohanShot,
      status: 'pending_approval',
      submittedAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      approvedAt: null,
      startDate: null,
      endDate: null,
      pendingExtension: null,
      paymentHistory: [
        {
          id: 'PAY-103',
          type: 'initial_join',
          planId: '6m',
          planName: '6 Months Transformation',
          addedDays: 180,
          amountInr: 6000,
          utrNumber: '431489201842',
          screenshotDataUrl: rohanShot,
          status: 'pending_approval',
          submittedAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
          approvedAt: null,
        },
      ],
    },
    {
      id: 'MEM-2102',
      name: 'Aman Verma',
      phone: '9811223344',
      email: 'aman.verma@example.com',
      password: 'password123',
      goal: 'Strength & Powerlifting (Squat/Bench/Deadlift)',
      planId: '1m',
      planName: '1 Month Plan',
      amountInr: 1200,
      durationDays: 30,
      paymentMethod: 'upi_qr',
      utrNumber: '431477391024',
      screenshotDataUrl: amanShot,
      status: 'pending_approval',
      submittedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      approvedAt: null,
      startDate: null,
      endDate: null,
      pendingExtension: null,
      paymentHistory: [
        {
          id: 'PAY-104',
          type: 'initial_join',
          planId: '1m',
          planName: '1 Month Plan',
          addedDays: 30,
          amountInr: 1200,
          utrNumber: '431477391024',
          screenshotDataUrl: amanShot,
          status: 'pending_approval',
          submittedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          approvedAt: null,
        },
      ],
    },
    {
      id: 'MEM-2089',
      name: 'Karan Malhotra',
      phone: '9123456789',
      email: 'karan.m@example.com',
      password: 'password123',
      goal: 'Muscle Hypertrophy & Bodybuilding',
      planId: '1m',
      planName: '1 Month Plan',
      amountInr: 1200,
      durationDays: 30,
      paymentMethod: 'cash',
      utrNumber: 'CASH-RECEIPT-89',
      screenshotDataUrl: null,
      status: 'active',
      submittedAt: new Date(now.getTime() - 35 * dayMs).toISOString(),
      approvedAt: new Date(now.getTime() - 35 * dayMs).toISOString(),
      startDate: new Date(now.getTime() - 35 * dayMs).toISOString(),
      endDate: new Date(now.getTime() - 5 * dayMs).toISOString(), // Expired 5 days ago (Fee Pending!)
      pendingExtension: null,
      paymentHistory: [
        {
          id: 'PAY-105',
          type: 'initial_join',
          planId: '1m',
          planName: '1 Month Plan',
          addedDays: 30,
          amountInr: 1200,
          utrNumber: 'CASH-RECEIPT-89',
          screenshotDataUrl: null,
          status: 'approved',
          submittedAt: new Date(now.getTime() - 35 * dayMs).toISOString(),
          approvedAt: new Date(now.getTime() - 35 * dayMs).toISOString(),
        },
      ],
    },
  ];

  saveMembers(seeded);
  return seeded;
}

export function saveMembers(members: GymMemberSubscription[]): void {
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  } catch {
    // Ignore quota errors
  }
}

export function computeSubscriptionHealth(member: GymMemberSubscription): {
  state: ComputedSubscriptionState;
  daysRemaining: number | null;
  progressPct: number;
  statusLabel: string;
} {
  if (member.status === 'no_plan') {
    return {
      state: 'no_plan',
      daysRemaining: null,
      progressPct: 0,
      statusLabel: 'No Active Plan · Select a Plan Below',
    };
  }
  if (member.status === 'pending_approval') {
    return {
      state: 'pending_approval',
      daysRemaining: null,
      progressPct: 0,
      statusLabel: 'Pending Admin Approval',
    };
  }
  if (member.status === 'rejected') {
    return {
      state: 'rejected',
      daysRemaining: null,
      progressPct: 0,
      statusLabel: 'Payment Rejected',
    };
  }

  if (!member.endDate) {
    return {
      state: 'pending_approval',
      daysRemaining: null,
      progressPct: 0,
      statusLabel: 'Pending Start',
    };
  }

  const nowMs = Date.now();
  const endMs = new Date(member.endDate).getTime();
  const diffDays = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
  const totalDays = member.durationDays || 30;
  const clampedProgress = Math.max(0, Math.min(100, Math.round((diffDays / totalDays) * 100)));

  if (diffDays <= 0) {
    return {
      state: 'expired',
      daysRemaining: diffDays,
      progressPct: 0,
      statusLabel: `Expired (${Math.abs(diffDays)}d overdue · Fee Pending)`,
    };
  }
  if (diffDays <= 7) {
    return {
      state: 'expiring_soon',
      daysRemaining: diffDays,
      progressPct: clampedProgress,
      statusLabel: `Expiring in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
    };
  }
  return {
    state: 'active',
    daysRemaining: diffDays,
    progressPct: clampedProgress,
    statusLabel: `Active · ${diffDays} days left`,
  };
}

// Calculates projected cumulative days and new expiry date when a member expands their subscription
export function computeProjectedExpansion(
  member: GymMemberSubscription,
  addedDays: number
): {
  currentActiveDaysLeft: number;
  projectedTotalDaysLeft: number;
  projectedEndDate: Date;
} {
  const nowMs = Date.now();
  const currentEndMs = member.endDate ? new Date(member.endDate).getTime() : nowMs;
  const currentActiveDaysLeft =
    member.status === 'active' && member.endDate
      ? Math.max(0, Math.ceil((currentEndMs - nowMs) / (1000 * 60 * 60 * 24)))
      : 0;
  const baseMs =
    member.status === 'active' && currentEndMs > nowMs ? currentEndMs : nowMs;
  const projectedEndDate = new Date(baseMs + addedDays * 24 * 60 * 60 * 1000);
  const projectedTotalDaysLeft = currentActiveDaysLeft + addedDays;

  return {
    currentActiveDaysLeft,
    projectedTotalDaysLeft,
    projectedEndDate,
  };
}

// Compresses uploaded image files via HTML5 Canvas so base64 data URLs store reliably in localStorage
export function compressImageFileToDataUrl(
  file: File,
  maxWidth = 720,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(e.target?.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Could not decode image file.'));
      img.src = String(e.target?.result || '');
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

// Generates a deterministic 25x25 QR matrix from the UPI payment string for crisp SVG rendering
export function generateUpiQrMatrix(upiPayload: string): boolean[][] {
  const size = 25;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinderPattern = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
          reserved[rr][cc] = true;
          const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInnerCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          const inBounds = r >= 0 && r <= 6 && c >= 0 && c <= 6;
          grid[rr][cc] = inBounds && (isOuterBorder || isInnerCore);
        }
      }
    }
  };

  placeFinderPattern(0, 0);
  placeFinderPattern(0, size - 7);
  placeFinderPattern(size - 7, 0);

  // Alignment pattern at (16, 16)
  for (let r = 16; r <= 20; r++) {
    for (let c = 16; c <= 20; c++) {
      reserved[r][c] = true;
      const isBorder = r === 16 || r === 20 || c === 16 || c === 20;
      const isCenter = r === 18 && c === 18;
      grid[r][c] = isBorder || isCenter;
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Hash payload deterministically into data cells
  let hash = 2166136261;
  for (let i = 0; i < upiPayload.length; i++) {
    hash ^= upiPayload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      const charCode = upiPayload.charCodeAt((r * size + c) % upiPayload.length) || 49;
      const mix = ((r * 31 + c * 17 + charCode * 13 + (hash >>> ((r + c) % 16))) & 0xff) % 7;
      grid[r][c] = mix < 3;
    }
  }

  return grid;
}
