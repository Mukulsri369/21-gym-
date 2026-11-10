import React, { useRef, useState } from 'react';
import {
  AdminQrConfig,
  compressImageFileToDataUrl,
  computeProjectedExpansion,
  computeSubscriptionHealth,
  createSamplePaymentScreenshotDataUrl,
  generateUpiQrMatrix,
  GymMemberSubscription,
  PLAN_CATALOG,
  PlanId,
} from '../utils/subscriptionStore';
import {
  ShieldCheck,
  Clock,
  X,
  Eye,
  LogOut,
  Lock,
  UserPlus,
  LogIn,
  Check,
  Copy,
  Upload,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { soundEngine } from '../utils/sound';

interface MemberPortalProps {
  members: GymMemberSubscription[];
  loggedInMember: GymMemberSubscription | null;
  adminConfig: AdminQrConfig;
  selectedPlanId: PlanId;
  onSelectPlanId: (planId: PlanId) => void;
  onLoginSuccess: (email: string) => void;
  onRegisterMember: (params: {
    name: string;
    email: string;
    phone: string;
    password: string;
    goal: string;
  }) => GymMemberSubscription;
  onLogout: () => void;
  onSubmitAuthenticatedPayment: (params: {
    planId: PlanId;
    utrNumber: string;
    screenshotDataUrl: string;
  }) => void;
  onOpenAdminPanel?: () => void;
}

export const MemberStatusLookup: React.FC<MemberPortalProps> = ({
  members,
  loggedInMember,
  adminConfig,
  selectedPlanId,
  onSelectPlanId,
  onLoginSuccess,
  onRegisterMember,
  onLogout,
  onSubmitAuthenticatedPayment,
  onOpenAdminPanel,
}) => {
  const plan = PLAN_CATALOG[selectedPlanId];

  // Auth state (single unified login/register form)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState<string>('priya.nair@example.com');
  const [passwordInput, setPasswordInput] = useState<string>('password123');
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regGoal, setRegGoal] = useState<string>('Muscle Hypertrophy & Bodybuilding');
  const [authError, setAuthError] = useState<string>('');

  // QR Checkout & Screenshot state
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [activeQrView, setActiveQrView] = useState<'dynamic' | 'custom'>(
    adminConfig.qrMode === 'custom_only' && adminConfig.customQrDataUrl ? 'custom' : 'dynamic'
  );
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string>('');
  const [optimisticToast, setOptimisticToast] = useState<string>('');
  const [zoomScreenshot, setZoomScreenshot] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const demoAccounts = [
    { email: 'priya.nair@example.com', name: 'Priya', tag: '3d left' },
    { email: 'vikram.singh@example.com', name: 'Vikram', tag: '340d left' },
    { email: 'rohan.sharma@example.com', name: 'Rohan', tag: 'Pending' },
    { email: 'karan.m@example.com', name: 'Karan', tag: 'Expired' },
  ];

  const formatDate = (iso: string | Date | null) => {
    if (!iso) return '—';
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setAuthError('Please enter a valid Email ID.');
      return;
    }
    const found = members.find((m) => m.email.toLowerCase() === cleanEmail);
    if (!found) {
      setAuthError('Account not found. Switch to "Create Account" to register.');
      return;
    }
    if (found.password && passwordInput && found.password !== passwordInput) {
      setAuthError('Incorrect password. (Demo password: password123)');
      return;
    }
    soundEngine.playPlateLock(140);
    onLoginSuccess(found.email);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (regName.trim().length < 2) {
      setAuthError('Please enter your full name.');
      return;
    }
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setAuthError('Please enter a valid Email ID.');
      return;
    }
    const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (passwordInput.trim().length < 4) {
      setAuthError('Password must be at least 4 characters.');
      return;
    }

    const existing = members.find((m) => m.email.toLowerCase() === cleanEmail);
    if (existing) {
      soundEngine.playPlateLock(140);
      onLoginSuccess(existing.email);
      return;
    }

    soundEngine.playPlateLock(140);
    const created = onRegisterMember({
      name: regName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: passwordInput.trim(),
      goal: regGoal,
    });
    onLoginSuccess(created.email);
  };

  const handleDemoQuickLogin = (demoEmail: string) => {
    soundEngine.playMechanicalTick(1.1);
    setEmailInput(demoEmail);
    setPasswordInput('password123');
    setAuthError('');
    setOptimisticToast('');
    onLoginSuccess(demoEmail);
  };

  const handleCopyUpi = () => {
    soundEngine.playMechanicalTick(1.1);
    navigator.clipboard?.writeText(adminConfig.upiId).catch(() => {});
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCheckoutError('');
    try {
      const compressed = await compressImageFileToDataUrl(file, 720, 0.82);
      setScreenshotDataUrl(compressed);
      setScreenshotFileName(file.name);
      if (!utrNumber) {
        setUtrNumber(String(Math.floor(430000000000 + Math.random() * 9999999999)));
      }
      soundEngine.playMechanicalTick(1.2);
    } catch {
      setCheckoutError('Could not process image. Please upload a PNG or JPG screenshot.');
    }
  };

  const handleGenerateSampleScreenshot = () => {
    soundEngine.playMechanicalTick(1.15);
    const sampleUtr =
      utrNumber.trim() || String(Math.floor(431000000000 + Math.random() * 899999999));
    setUtrNumber(sampleUtr);
    const dataUrl = createSamplePaymentScreenshotDataUrl({
      payerName: loggedInMember?.name || 'Gym Member',
      amountInr: plan.totalPriceInr,
      utr: sampleUtr,
      dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      upiApp: 'GPay',
    });
    setScreenshotDataUrl(dataUrl);
    setScreenshotFileName(`GPay_${plan.totalPriceInr}INR.jpg`);
    setCheckoutError('');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInMember) return;
    setCheckoutError('');

    if (!screenshotDataUrl) {
      setCheckoutError(
        'Please attach your payment screenshot (or click "Use Sample Receipt" to test).'
      );
      return;
    }

    const finalUtr =
      utrNumber.trim() || `UPI-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    soundEngine.playPlateLock(140);
    onSubmitAuthenticatedPayment({
      planId: plan.id,
      utrNumber: finalUtr,
      screenshotDataUrl,
    });

    setOptimisticToast(
      loggedInMember.status === 'active'
        ? `Expansion request (+${plan.durationDays} days · ₹${plan.totalPriceInr.toLocaleString('en-IN')}) submitted! Approve in Admin Panel to stack days immediately.`
        : `Payment screenshot (₹${plan.totalPriceInr.toLocaleString('en-IN')}) submitted! Approve in Admin Panel to start your ${plan.durationDays}-day countdown.`
    );
    setScreenshotDataUrl(null);
    setScreenshotFileName('');
    setUtrNumber('');
  };

  // VIEW 1: LOGGED OUT -> SINGLE MINIMALIST EMAIL LOGIN / SIGN-UP CARD
  if (!loggedInMember) {
    return (
      <div
        id="member-status-lookup"
        className="border border-white/[0.08] bg-[#111114] rounded-lg p-7 sm:p-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left 5 Cols: Selected Plan Context & 1-Click Demo Accounts */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] font-medium mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Member Portal &amp; Checkout</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white">
                Sign in with your Email ID to continue.
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Log in once to view your remaining subscription days, pay via UPI QR code, or add
                extra days to your current plan.
              </p>
            </div>

            {/* Selected Plan Pill */}
            <div className="p-4 bg-[#09090B] border border-[#D4AF37]/30 rounded-md flex items-center justify-between">
              <div>
                <div className="text-[11px] text-neutral-400">Selected Plan for Checkout</div>
                <div className="font-display text-base font-semibold text-white mt-0.5">
                  {plan.name} (+{plan.durationDays} Days)
                </div>
              </div>
              <div className="font-display text-xl font-semibold text-[#D4AF37] tabular-nums">
                ₹{plan.totalPriceInr.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Quick Demo Account Pills */}
            <div className="pt-2">
              <div className="text-[11px] text-neutral-400 mb-2">
                Instant 1-click demo accounts:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleDemoQuickLogin(acc.email)}
                    className="px-2.5 py-1.5 text-xs rounded border border-white/10 bg-[#09090B] hover:border-[#D4AF37] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="font-medium text-white">{acc.name}</span>{' '}
                    <span className="text-[11px] text-[#D4AF37] font-mono">({acc.tag})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Minimalist Login / Register Form */}
          <div className="lg:col-span-7 bg-[#09090B] border border-white/10 rounded-lg p-6 sm:p-8">
            <div className="flex items-center gap-1.5 p-1 bg-[#111114] border border-white/[0.08] rounded-md mb-6 w-fit">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`px-4 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`px-4 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Email ID</label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#111114] border border-white/15 focus:border-[#D4AF37] focus:outline-none rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#111114] border border-white/15 focus:border-[#D4AF37] focus:outline-none rounded-md text-white"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="text-xs text-amber-300 bg-amber-950/50 border border-amber-500/30 px-3.5 py-2 rounded">
                    {authError}
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 pt-2">
                  <span className="text-xs text-neutral-500">
                    Demo password: <span className="font-mono text-neutral-300">password123</span>
                  </span>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#e2be46] text-[#09090B] font-medium text-xs rounded-md transition-colors cursor-pointer"
                  >
                    Sign In &amp; Open Portal →
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Aryan Kapoor"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#111114] border border-white/15 focus:border-[#D4AF37] focus:outline-none rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Email ID</label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="aryan@example.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#111114] border border-white/15 focus:border-[#D4AF37] focus:outline-none rounded-md text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">
                      10-Digit Mobile
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#111114] border border-white/15 focus:border-[#D4AF37] focus:outline-none rounded-md text-white font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Create password"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#111114] border border-white/15 focus:border-[#D4AF37] focus:outline-none rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Fitness Goal</label>
                    <select
                      value={regGoal}
                      onChange={(e) => setRegGoal(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-[#111114] border border-white/15 focus:border-[#D4AF37] focus:outline-none rounded-md text-white"
                    >
                      <option value="Muscle Hypertrophy & Bodybuilding">Bodybuilding</option>
                      <option value="Fat Loss & Body Toning">Fat Loss</option>
                      <option value="Strength & Powerlifting (Squat/Bench/Deadlift)">
                        Strength
                      </option>
                    </select>
                  </div>
                </div>

                {authError && (
                  <div className="text-xs text-amber-300 bg-amber-950/50 border border-amber-500/30 px-3.5 py-2 rounded">
                    {authError}
                  </div>
                )}

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#e2be46] text-[#09090B] font-medium text-xs rounded-md transition-colors cursor-pointer"
                  >
                    Create Account &amp; Continue →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: LOGGED IN -> UNIFIED MEMBER DASHBOARD + QR CHECKOUT / PLAN EXPANSION
  const health = computeSubscriptionHealth(loggedInMember);
  const isExpandingActivePlan = loggedInMember.status === 'active';
  const projection = computeProjectedExpansion(loggedInMember, plan.durationDays);
  const projectedExpiryStr = formatDate(projection.projectedEndDate);

  const upiUri = `upi://pay?pa=${encodeURIComponent(adminConfig.upiId)}&pn=${encodeURIComponent(
    adminConfig.payeeName
  )}&am=${plan.totalPriceInr}&cu=INR&tn=${encodeURIComponent(`21Fitness ${plan.name}`)}`;
  const qrMatrix = generateUpiQrMatrix(upiUri);

  const showBothSwitch =
    adminConfig.qrMode === 'both' && Boolean(adminConfig.customQrDataUrl);
  const displayCustomQr =
    Boolean(adminConfig.customQrDataUrl) &&
    (adminConfig.qrMode === 'custom_only' || activeQrView === 'custom');

  const badgeStyle =
    health.state === 'active'
      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
      : health.state === 'pending_approval' || health.state === 'expiring_soon'
        ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
        : health.state === 'no_plan'
          ? 'bg-white/10 text-neutral-300 border-white/15'
          : 'bg-rose-950/60 text-rose-300 border-rose-500/30';

  const progressColor =
    health.state === 'active'
      ? 'bg-emerald-500'
      : health.state === 'expiring_soon'
        ? 'bg-amber-400'
        : health.state === 'pending_approval'
          ? 'bg-[#D4AF37]'
          : 'bg-rose-500';

  const historyList = loggedInMember.paymentHistory || [];

  return (
    <div
      id="member-status-lookup"
      className="border border-white/[0.1] bg-[#111114] rounded-lg p-6 sm:p-9 space-y-7"
    >
      {/* 1. Compact Member Bar + Demo Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-white">
                {loggedInMember.name}
              </h3>
              <span className={`px-2.5 py-0.5 text-[11px] font-medium border rounded ${badgeStyle}`}>
                {health.statusLabel}
              </span>
            </div>
            <div className="text-xs font-mono text-neutral-400 mt-0.5">
              {loggedInMember.email} · {loggedInMember.phone}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#09090B] border border-white/10 p-1 rounded-md">
            <span className="text-[11px] text-neutral-500 px-2">Demo:</span>
            {demoAccounts.map((d) => {
              const isCurrent = loggedInMember.email.toLowerCase() === d.email.toLowerCase();
              return (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => handleDemoQuickLogin(d.email)}
                  className={`px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {d.name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMechanicalTick(0.95);
              onLogout();
            }}
            className="px-3 py-1.5 bg-[#09090B] hover:bg-white/10 border border-white/15 text-xs text-neutral-300 rounded-md flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. Live Subscription Progress Strip */}
      <div className="p-5 bg-[#09090B] border border-white/[0.08] rounded-lg grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5">
          <div className="text-xs text-neutral-400">Current Active Plan</div>
          <div className="font-display text-lg font-semibold text-white mt-0.5">
            {loggedInMember.planName}
          </div>
          <div className="text-xs text-neutral-400 mt-0.5 font-mono tabular-nums">
            Start: {formatDate(loggedInMember.startDate)} · Expiry:{' '}
            <span className="text-white">{formatDate(loggedInMember.endDate)}</span>
          </div>
        </div>

        <div className="lg:col-span-7">
          {health.state === 'pending_approval' ? (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-950/30 border border-amber-500/30 rounded-md">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  Payment screenshot submitted ({loggedInMember.durationDays} days) — awaiting Admin
                  approval.
                </span>
              </div>
              {onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={onOpenAdminPanel}
                  className="px-3 py-1 bg-[#D4AF37] text-[#09090B] text-xs font-medium rounded cursor-pointer"
                >
                  Approve in Admin →
                </button>
              )}
            </div>
          ) : health.state === 'no_plan' ? (
            <div className="text-xs text-neutral-400">
              No active plan yet. Scan the UPI QR code below and upload your screenshot to activate
              your membership.
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-neutral-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Remaining Gym Days</span>
                </span>
                <span className="font-mono font-semibold text-white tabular-nums">
                  {health.daysRemaining !== null && health.daysRemaining > 0
                    ? `${health.daysRemaining} / ${loggedInMember.durationDays} Days Left`
                    : `${Math.abs(health.daysRemaining || 0)} Days Overdue`}
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all duration-300`}
                  style={{ width: `${health.progressPct}%` }}
                />
              </div>
            </div>
          )}

          {loggedInMember.pendingExtension && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-950/30 border border-amber-500/35 rounded text-xs">
              <span className="text-amber-300">
                Pending Expansion: <strong>+{loggedInMember.pendingExtension.addedDays} Days</strong>{' '}
                ({loggedInMember.pendingExtension.planName}) awaiting Admin approval
              </span>
              {onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={onOpenAdminPanel}
                  className="px-2.5 py-1 bg-[#D4AF37] text-[#09090B] font-medium rounded cursor-pointer"
                >
                  Approve &amp; Add Days →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optimistic Submission Feedback Banner */}
      {optimisticToast && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-200">
          <span>{optimisticToast}</span>
          {onOpenAdminPanel && (
            <button
              type="button"
              onClick={onOpenAdminPanel}
              className="px-3 py-1.5 bg-[#D4AF37] text-[#09090B] font-medium rounded cursor-pointer"
            >
              Open Admin Panel to Approve →
            </button>
          )}
        </div>
      )}

      {/* 3. Unified QR Payment & Plan Expansion Form */}
      <form
        id="application-concierge"
        onSubmit={handlePaymentSubmit}
        className="p-6 bg-[#09090B] border border-white/10 rounded-lg space-y-5"
        noValidate
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div>
            <h4 className="font-display text-lg font-semibold text-white">
              {isExpandingActivePlan
                ? `Expand Current Subscription (+${plan.durationDays} Days Added)`
                : `Activate ${plan.name} (+${plan.durationDays} Days)`}
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isExpandingActivePlan ? (
                <>
                  Cumulative Preview:{' '}
                  <span className="font-mono text-white">
                    {projection.currentActiveDaysLeft}d current + {plan.durationDays}d ={' '}
                    <strong className="text-emerald-400">
                      {projection.projectedTotalDaysLeft} Total Days
                    </strong>{' '}
                    (New Expiry: {projectedExpiryStr})
                  </span>
                </>
              ) : (
                <>
                  Scan the QR code to pay{' '}
                  <strong className="text-white">
                    ₹{plan.totalPriceInr.toLocaleString('en-IN')}
                  </strong>{' '}
                  and upload your screenshot.
                </>
              )}
            </p>
          </div>

          {/* Compact Plan Duration Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#111114] border border-white/10 rounded-md self-start sm:self-auto">
            {(['1m', '6m', '12m'] as PlanId[]).map((pid) => {
              const p = PLAN_CATALOG[pid];
              const active = selectedPlanId === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => {
                    soundEngine.playMechanicalTick(1.05);
                    onSelectPlanId(pid);
                  }}
                  className={`px-3 py-1.5 text-xs rounded transition-colors font-mono cursor-pointer ${
                    active
                      ? 'bg-[#D4AF37] text-[#09090B] font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  +{p.durationDays}d · ₹{p.totalPriceInr.toLocaleString('en-IN')}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left 5 Cols: Scannable UPI QR */}
          <div className="md:col-span-5 flex flex-col items-center text-center bg-[#111114] border border-white/[0.08] rounded-lg p-4">
            {showBothSwitch && (
              <div className="flex items-center gap-1 p-1 bg-[#09090B] border border-white/10 rounded mb-3">
                <button
                  type="button"
                  onClick={() => setActiveQrView('dynamic')}
                  className={`px-2 py-0.5 text-[11px] rounded cursor-pointer ${
                    activeQrView === 'dynamic'
                      ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                      : 'text-neutral-400'
                  }`}
                >
                  Dynamic QR
                </button>
                <button
                  type="button"
                  onClick={() => setActiveQrView('custom')}
                  className={`px-2 py-0.5 text-[11px] rounded cursor-pointer ${
                    activeQrView === 'custom'
                      ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                      : 'text-neutral-400'
                  }`}
                >
                  Custom QR
                </button>
              </div>
            )}

            <div className="bg-white p-2.5 rounded-md">
              {displayCustomQr && adminConfig.customQrDataUrl ? (
                <img
                  src={adminConfig.customQrDataUrl}
                  alt="21 Fitness Payment QR"
                  className="w-36 h-36 object-contain"
                />
              ) : (
                <svg
                  viewBox="0 0 27 27"
                  className="w-36 h-36"
                  shapeRendering="crispEdges"
                  aria-label={`UPI QR Code for ₹${plan.totalPriceInr}`}
                >
                  <rect width="27" height="27" fill="#FFFFFF" />
                  {qrMatrix.map((row, rIdx) =>
                    row.map((cell, cIdx) =>
                      cell ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx + 1}
                          y={rIdx + 1}
                          width={1}
                          height={1}
                          fill="#09090B"
                        />
                      ) : null
                    )
                  )}
                </svg>
              )}
            </div>

            <div className="mt-2.5 font-display text-base font-semibold text-white tabular-nums">
              Pay ₹{plan.totalPriceInr.toLocaleString('en-IN')}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 bg-[#09090B] border border-white/10 px-2.5 py-1 rounded text-xs font-mono text-neutral-300">
              <span>{adminConfig.upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="text-[#D4AF37] hover:text-white cursor-pointer"
              >
                {copiedUpi ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Right 7 Cols: Upload Screenshot & Submit */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-neutral-300 font-medium">
                  Payment Screenshot *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSampleScreenshot}
                  className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Use Sample Receipt (Instant Test)</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {screenshotDataUrl ? (
                <div className="p-3 bg-[#111114] border border-[#D4AF37]/50 rounded-md flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={screenshotDataUrl}
                      alt="Receipt preview"
                      className="w-10 h-12 object-cover rounded border border-white/15 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-emerald-400 truncate">
                        Screenshot Attached
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate font-mono">
                        {screenshotFileName}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-xs bg-[#09090B] border border-white/10 rounded text-neutral-300 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-5 px-4 border border-dashed border-white/20 hover:border-[#D4AF37] bg-[#111114] rounded-md flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-medium text-white">
                    Upload GPay / PhonePe / Paytm Screenshot
                  </span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  UTR / Ref Number (Optional)
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 431489201842"
                  className="w-full px-3 py-2 text-xs bg-[#111114] border border-white/10 focus:border-[#D4AF37] focus:outline-none rounded-md text-white font-mono tabular-nums"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#D4AF37] hover:bg-[#e2be46] text-[#09090B] font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>
                  {isExpandingActivePlan
                    ? `Add +${plan.durationDays} Days (₹${plan.totalPriceInr.toLocaleString('en-IN')})`
                    : `Submit Payment (₹${plan.totalPriceInr.toLocaleString('en-IN')})`}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {checkoutError && <div className="text-xs text-amber-300">{checkoutError}</div>}
          </div>
        </div>
      </form>

      {/* 4. Compact Payment History Table */}
      {historyList.length > 0 && (
        <div className="pt-2">
          <div className="text-xs font-medium text-neutral-400 mb-2.5">
            Payment &amp; Expansion History
          </div>
          <div className="border border-white/[0.07] bg-[#09090B] rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-white/[0.07] text-[11px] text-neutral-400">
                  <th className="py-2 px-4 font-medium">Plan &amp; Type</th>
                  <th className="py-2 px-4 font-medium">Days</th>
                  <th className="py-2 px-4 font-medium">Amount</th>
                  <th className="py-2 px-4 font-medium">Status</th>
                  <th className="py-2 px-4 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {historyList.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-4 text-white">
                      {item.planName}{' '}
                      <span className="text-neutral-500">
                        ({item.type === 'plan_expansion' ? 'Expansion' : 'Join'})
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-emerald-400 tabular-nums">
                      +{item.addedDays}d
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#D4AF37] tabular-nums">
                      ₹{item.amountInr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4">
                      {item.status === 'approved' ? (
                        <span className="text-emerald-400">Approved &amp; Added</span>
                      ) : item.status === 'pending_approval' ? (
                        <span className="text-amber-300">Pending Admin</span>
                      ) : (
                        <span className="text-rose-400">Rejected</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {item.screenshotDataUrl ? (
                        <button
                          type="button"
                          onClick={() => setZoomScreenshot(item.screenshotDataUrl)}
                          className="text-[#D4AF37] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      ) : (
                        <span className="text-neutral-500">Cash</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lightbox for Payment Screenshot Inspection */}
      {zoomScreenshot && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative bg-[#111114] border border-white/15 rounded-lg p-4 max-w-md w-full">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <span className="text-xs font-medium text-white">Payment Screenshot</span>
              <button
                type="button"
                onClick={() => setZoomScreenshot(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={zoomScreenshot}
              alt="Payment Screenshot"
              className="w-full max-h-[70vh] object-contain rounded border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};
