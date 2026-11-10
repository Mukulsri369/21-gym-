import React, { useRef, useState } from 'react';
import {
  AdminQrConfig,
  compressImageFileToDataUrl,
  computeProjectedExpansion,
  computeSubscriptionHealth,
  GymMemberSubscription,
  PLAN_CATALOG,
  PlanId,
} from '../utils/subscriptionStore';
import {
  Check,
  X,
  Search,
  Download,
  Plus,
  Settings,
  ShieldCheck,
  Clock,
  Eye,
  Trash2,
  RefreshCw,
  MessageSquare,
  Lock,
  Upload,
} from 'lucide-react';
import { soundEngine } from '../utils/sound';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: GymMemberSubscription[];
  onApproveMember: (memberId: string) => void;
  onRejectMember: (memberId: string) => void;
  onExtendMemberDays: (memberId: string, extraDays: number, extraAmountInr: number) => void;
  onDeleteMember: (memberId: string) => void;
  onAddOfflineMember: (member: GymMemberSubscription) => void;
  adminConfig: AdminQrConfig;
  onUpdateAdminConfig: (nextConfig: AdminQrConfig) => void;
}

type AdminTab = 'pending' | 'all_members' | 'walk_in' | 'qr_settings';
type MemberFilter = 'all' | 'pending_approval' | 'active' | 'expiring_soon' | 'expired';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  members,
  onApproveMember,
  onRejectMember,
  onExtendMemberDays,
  onDeleteMember,
  onAddOfflineMember,
  adminConfig,
  onUpdateAdminConfig,
}) => {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    memberName: string;
    utr: string;
    amount: number;
  } | null>(null);

  // Walk-in / Offline Member Form State
  const [walkInName, setWalkInName] = useState<string>('');
  const [walkInPhone, setWalkInPhone] = useState<string>('');
  const [walkInEmail, setWalkInEmail] = useState<string>('');
  const [walkInPlanId, setWalkInPlanId] = useState<PlanId>('1m');
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState<'cash' | 'upi_qr'>('cash');
  const [walkInUtr, setWalkInUtr] = useState<string>('');
  const [walkInSuccess, setWalkInSuccess] = useState<string>('');

  // QR Settings Form State
  const [upiIdDraft, setUpiIdDraft] = useState<string>(adminConfig.upiId);
  const [payeeNameDraft, setPayeeNameDraft] = useState<string>(adminConfig.payeeName);
  const [qrModeDraft, setQrModeDraft] = useState<'both' | 'dynamic_only' | 'custom_only'>(
    adminConfig.qrMode
  );
  const [customQrDraft, setCustomQrDraft] = useState<string | null>(adminConfig.customQrDataUrl);
  const [pinDraft, setPinDraft] = useState<string>(adminConfig.adminPin);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string>('');
  const customQrInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Include both initial pending_approval members AND active members with a pendingExtension screenshot
  const pendingMembers = members.filter(
    (m) => m.status === 'pending_approval' || Boolean(m.pendingExtension)
  );
  const activeMembers = members.filter((m) => {
    const h = computeSubscriptionHealth(m);
    return h.state === 'active' || h.state === 'expiring_soon';
  });
  const expiringOrExpiredMembers = members.filter((m) => {
    const h = computeSubscriptionHealth(m);
    return h.state === 'expiring_soon' || h.state === 'expired';
  });
  const totalVerifiedRevenueInr = members
    .filter((m) => m.status === 'active')
    .reduce((sum, m) => sum + m.amountInr, 0);

  const handlePinUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === adminConfig.adminPin || pinInput.trim() === '2121') {
      soundEngine.playPlateLock(140);
      setUnlocked(true);
      setPinError('');
    } else {
      setPinError(`Incorrect Admin PIN. (Default owner PIN is ${adminConfig.adminPin})`);
    }
  };

  const handleExportCsv = () => {
    soundEngine.playMechanicalTick(1.15);
    const headers = [
      'Member ID',
      'Name',
      'Email',
      'Phone',
      'Plan',
      'Amount (INR)',
      'Cumulative Days',
      'Payment Method',
      'UTR / Receipt',
      'Status',
      'Days Remaining',
      'Start Date',
      'End Date',
    ];
    const rows = members.map((m) => {
      const h = computeSubscriptionHealth(m);
      return [
        m.id,
        `"${m.name.replace(/"/g, '""')}"`,
        m.email,
        m.phone,
        `"${m.planName}"`,
        m.amountInr,
        m.durationDays,
        m.paymentMethod,
        `"${m.utrNumber}"`,
        h.statusLabel,
        h.daysRemaining !== null ? h.daysRemaining : 'Pending',
        m.startDate ? new Date(m.startDate).toLocaleDateString('en-IN') : 'Pending',
        m.endDate ? new Date(m.endDate).toLocaleDateString('en-IN') : 'Pending',
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `21_Fitness_Members_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (walkInName.trim().length < 2) return;
    const cleanPhone = walkInPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) return;

    const plan = PLAN_CATALOG[walkInPlanId];
    const now = new Date();
    const end = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    const receiptRef =
      walkInUtr.trim() ||
      (walkInPaymentMethod === 'cash'
        ? `CASH-${Math.floor(100 + Math.random() * 899)}`
        : `UPI-${Math.floor(100000 + Math.random() * 899999)}`);

    const newMember: GymMemberSubscription = {
      id: `MEM-${Math.floor(2110 + Math.random() * 7800)}`,
      name: walkInName.trim(),
      phone: cleanPhone,
      email: walkInEmail.trim().toLowerCase() || `${cleanPhone}@21fitness.in`,
      password: 'password123',
      goal: 'Muscle Hypertrophy & Bodybuilding',
      planId: plan.id,
      planName: plan.name,
      amountInr: plan.totalPriceInr,
      durationDays: plan.durationDays,
      paymentMethod: walkInPaymentMethod,
      utrNumber: receiptRef,
      screenshotDataUrl: null,
      status: 'active',
      submittedAt: now.toISOString(),
      approvedAt: now.toISOString(),
      startDate: now.toISOString(),
      endDate: end.toISOString(),
      pendingExtension: null,
      paymentHistory: [
        {
          id: `PAY-${Math.floor(100 + Math.random() * 899)}`,
          type: 'initial_join',
          planId: plan.id,
          planName: plan.name,
          addedDays: plan.durationDays,
          amountInr: plan.totalPriceInr,
          utrNumber: receiptRef,
          screenshotDataUrl: null,
          status: 'approved',
          submittedAt: now.toISOString(),
          approvedAt: now.toISOString(),
        },
      ],
    };

    soundEngine.playPlateLock(140);
    onAddOfflineMember(newMember);
    setWalkInSuccess(
      `Added ${newMember.name} (${newMember.email} · ${newMember.planName}) — Subscription started for ${newMember.durationDays} days!`
    );
    setWalkInName('');
    setWalkInPhone('');
    setWalkInEmail('');
    setWalkInUtr('');
    setTimeout(() => setWalkInSuccess(''), 4000);
  };

  const handleCustomQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file, 600, 0.85);
      setCustomQrDraft(compressed);
      soundEngine.playMechanicalTick(1.1);
    } catch {
      // ignore error
    }
  };

  const handleSaveQrSettings = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playPlateLock(135);
    onUpdateAdminConfig({
      upiId: upiIdDraft.trim() || '21fitness@upi',
      payeeName: payeeNameDraft.trim() || '21 Fitness',
      qrMode: qrModeDraft,
      customQrDataUrl: customQrDraft,
      adminPin: pinDraft.trim() || '2121',
    });
    setSettingsSavedMsg('QR & Admin configuration saved successfully.');
    setTimeout(() => setSettingsSavedMsg(''), 3000);
  };

  const filteredMembers = members.filter((m) => {
    const health = computeSubscriptionHealth(m);
    if (memberFilter === 'pending_approval') {
      if (m.status !== 'pending_approval' && !m.pendingExtension) return false;
    } else if (memberFilter !== 'all' && health.state !== memberFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.utrNumber.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    );
  });

  const formatDate = (iso: string | Date | null) => {
    if (!iso) return '—';
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="21 Fitness Owner Admin Panel"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-[1160px] bg-[#0C0C0F] border border-white/15 rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-[#111114] border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-semibold text-white">
              21 Fitness · Owner Admin &amp; Fee Control Panel
            </span>
            {pendingMembers.length > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                {pendingMembers.length} Pending Screenshot{pendingMembers.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Admin Panel"
            className="text-neutral-400 hover:text-white p-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!unlocked ? (
          /* Owner PIN Lock Screen */
          <div className="p-8 sm:p-14 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-white">
              Owner Verification Required
            </h3>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Enter the 21 Fitness Admin PIN to verify customer payment screenshots, approve plan
              expansions (+days), and manage overdue gym fees.
            </p>

            <form onSubmit={handlePinUnlock} className="w-full mt-6 space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Admin PIN (Default: 2121)"
                className="w-full px-4 py-2.5 text-center font-mono text-base bg-[#09090B] border border-white/15 focus:border-[#D4AF37] focus:outline-none rounded-md text-white tracking-widest"
                autoFocus
              />
              {pinError && <div className="text-xs text-amber-400">{pinError}</div>}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#D4AF37] hover:bg-[#e2be46] text-[#09090B] font-medium text-xs rounded-md transition-colors cursor-pointer"
                >
                  Unlock Admin Panel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPlateLock(140);
                    setUnlocked(true);
                  }}
                  className="py-2.5 px-3.5 bg-white/10 hover:bg-white/15 text-neutral-200 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Quick Demo Unlock (2121)
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Unlocked Full Admin Workspace */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 4-Column KPI Summary Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#111114] border border-white/[0.08] rounded-lg">
                <div className="text-xs text-neutral-400">Pending Screenshot Approvals</div>
                <div className="mt-1 font-display text-2xl font-semibold text-amber-400 tabular-nums">
                  {pendingMembers.length}
                </div>
                <div className="mt-0.5 text-[11px] text-neutral-500">
                  New joins &amp; +Days plan expansions
                </div>
              </div>

              <div className="p-4 bg-[#111114] border border-white/[0.08] rounded-lg">
                <div className="text-xs text-neutral-400">Active Gym Subscriptions</div>
                <div className="mt-1 font-display text-2xl font-semibold text-emerald-400 tabular-nums">
                  {activeMembers.length}
                </div>
                <div className="mt-0.5 text-[11px] text-neutral-500">
                  Currently verified &amp; training
                </div>
              </div>

              <div className="p-4 bg-[#111114] border border-white/[0.08] rounded-lg">
                <div className="text-xs text-neutral-400">Expiring ≤ 7d / Fee Overdue</div>
                <div className="mt-1 font-display text-2xl font-semibold text-rose-400 tabular-nums">
                  {expiringOrExpiredMembers.length}
                </div>
                <div className="mt-0.5 text-[11px] text-neutral-500">
                  Send 1-click WhatsApp reminder
                </div>
              </div>

              <div className="p-4 bg-[#111114] border border-white/[0.08] rounded-lg">
                <div className="text-xs text-neutral-400">Verified Revenue Collected</div>
                <div className="mt-1 font-display text-2xl font-semibold text-[#D4AF37] tabular-nums">
                  ₹{totalVerifiedRevenueInr.toLocaleString('en-IN')}
                </div>
                <div className="mt-0.5 text-[11px] text-neutral-500">
                  Across {members.filter((m) => m.status === 'active').length} approved plans
                </div>
              </div>
            </div>

            {/* Navigation Tabs & CSV Export */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#111114] border border-white/[0.08] rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className={`px-3.5 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'pending'
                      ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Screenshots ({pendingMembers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('all_members')}
                  className={`px-3.5 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'all_members'
                      ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>All Members &amp; Days Left ({members.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('walk_in')}
                  className={`px-3.5 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'walk_in'
                      ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Walk-In / Cash Member</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('qr_settings')}
                  className={`px-3.5 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'qr_settings'
                      ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>QR Code &amp; UPI Settings</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3.5 py-2 bg-[#111114] hover:bg-white/10 border border-white/15 text-xs text-neutral-200 rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Download Member CSV</span>
              </button>
            </div>

            {/* TAB 1: PENDING SCREENSHOT APPROVALS (NEW JOINS & PLAN EXPANSIONS) */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display text-lg font-semibold text-white">
                      Payment Screenshot Verification Queue (New Joins &amp; +Days Plan Expansions)
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Inspect each customer&apos;s uploaded UPI payment screenshot. Approving a
                      Plan Expansion automatically adds the new days directly onto their existing
                      expiry date.
                    </p>
                  </div>
                </div>

                {pendingMembers.length === 0 ? (
                  <div className="p-10 bg-[#111114] border border-white/[0.08] rounded-lg text-center">
                    <div className="text-sm font-medium text-white">
                      All payment screenshots have been verified!
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      When a logged-in customer submits a new membership or plan expansion
                      screenshot, it will appear here for approval.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {pendingMembers.map((member) => {
                      const ext = member.pendingExtension;
                      const isExpansion = Boolean(ext);
                      const shotUrl = ext ? ext.screenshotDataUrl : member.screenshotDataUrl;
                      const displayPlan = ext ? ext.planName : member.planName;
                      const displayAmount = ext ? ext.amountInr : member.amountInr;
                      const displayAddedDays = ext ? ext.addedDays : member.durationDays;
                      const displayUtr = ext ? ext.utrNumber : member.utrNumber;
                      const projection = computeProjectedExpansion(member, displayAddedDays);

                      return (
                        <div
                          key={member.id}
                          className="p-5 bg-[#111114] border border-amber-500/35 rounded-lg flex flex-col justify-between gap-4"
                        >
                          <div className="flex items-start gap-4">
                            {/* Screenshot Thumbnail */}
                            {shotUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxImage({
                                    url: shotUrl,
                                    memberName: member.name,
                                    utr: displayUtr,
                                    amount: displayAmount,
                                  })
                                }
                                className="group relative w-24 h-32 rounded border border-white/15 overflow-hidden shrink-0 bg-black cursor-pointer"
                              >
                                <img
                                  src={shotUrl}
                                  alt={`${member.name} payment screenshot`}
                                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                />
                                <span className="absolute inset-x-0 bottom-0 bg-black/80 text-[10px] text-[#D4AF37] py-1 flex items-center justify-center gap-1">
                                  <Eye className="w-3 h-3" /> Zoom
                                </span>
                              </button>
                            ) : (
                              <div className="w-24 h-32 rounded border border-white/10 bg-[#09090B] flex items-center justify-center text-[11px] text-neutral-500 text-center p-2 shrink-0">
                                Cash / No Image
                              </div>
                            )}

                            {/* Member & Payment Metadata */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[11px] text-amber-400">
                                  {isExpansion
                                    ? `${member.id} · PLAN EXPANSION (+${displayAddedDays}d)`
                                    : `${member.id} · NEW MEMBERSHIP`}
                                </span>
                              </div>
                              <h5 className="font-display text-lg font-semibold text-white truncate mt-0.5">
                                {member.name}
                              </h5>
                              <div className="text-xs text-neutral-300 font-mono truncate">
                                {member.email} · {member.phone}
                              </div>

                              <div className="mt-2.5 p-2.5 bg-[#09090B] border border-white/[0.07] rounded text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-neutral-400">
                                    {isExpansion ? 'Expansion Package:' : 'Plan:'}
                                  </span>
                                  <span className="text-white font-medium">{displayPlan}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-400">Amount Paid:</span>
                                  <span className="text-[#D4AF37] font-mono font-semibold tabular-nums">
                                    ₹{displayAmount.toLocaleString('en-IN')} (+{displayAddedDays}{' '}
                                    Days)
                                  </span>
                                </div>
                                {isExpansion && (
                                  <div className="flex justify-between text-emerald-400">
                                    <span>New Stacked Total:</span>
                                    <span className="font-mono font-semibold tabular-nums">
                                      {projection.currentActiveDaysLeft}d + {displayAddedDays}d ={' '}
                                      {projection.projectedTotalDaysLeft}d
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-neutral-400">UTR / Ref:</span>
                                  <span className="text-neutral-200 font-mono tabular-nums">
                                    {displayUtr}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                soundEngine.playPlateLock(145);
                                onApproveMember(member.id);
                              }}
                              className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-[#09090B] font-medium text-xs rounded-md flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>
                                {isExpansion
                                  ? `Approve & Add +${displayAddedDays}d (Total ${projection.projectedTotalDaysLeft}d)`
                                  : `Approve & Start ${displayAddedDays}d Subscription`}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                soundEngine.playMechanicalTick(0.9);
                                onRejectMember(member.id);
                              }}
                              className="py-2 px-3 bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30 text-xs rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ALL MEMBERS & SUBSCRIPTION TRACKER */}
            {activeTab === 'all_members' && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'all', label: `All (${members.length})` },
                        { id: 'pending_approval', label: 'Pending Approval / Expansion' },
                        { id: 'active', label: 'Active' },
                        { id: 'expiring_soon', label: 'Expiring ≤ 7d' },
                        { id: 'expired', label: 'Expired / Fee Due' },
                      ] as { id: MemberFilter; label: string }[]
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setMemberFilter(f.id)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          memberFilter === f.id
                            ? 'bg-white text-[#09090B] border-white font-medium'
                            : 'bg-[#111114] text-neutral-400 border-white/10 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full md:w-72">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name, email, phone, UTR..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#111114] border border-white/15 focus:border-[#D4AF37] focus:outline-none rounded-md text-white"
                    />
                  </div>
                </div>

                {/* High-Density Member Subscription Table */}
                <div className="border border-white/[0.08] bg-[#111114] rounded-lg overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[920px]">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[11px] text-neutral-400 bg-[#09090B]">
                        <th className="py-3 px-4 font-medium">Member &amp; Email ID</th>
                        <th className="py-3 px-4 font-medium">Plan &amp; Cumulative Fee</th>
                        <th className="py-3 px-4 font-medium">Proof / UTR</th>
                        <th className="py-3 px-4 font-medium">Status &amp; Days Left</th>
                        <th className="py-3 px-4 font-medium">Validity Dates</th>
                        <th className="py-3 px-4 font-medium text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-xs">
                      {filteredMembers.map((m) => {
                        const health = computeSubscriptionHealth(m);
                        const hasPendingExt = Boolean(m.pendingExtension);
                        const badgeClass =
                          health.state === 'active'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                            : health.state === 'pending_approval' || health.state === 'expiring_soon'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                              : 'bg-rose-950/60 text-rose-300 border-rose-500/30';

                        const whatsappMsg = encodeURIComponent(
                          `Hi ${m.name}, greetings from 21 Fitness! Your ${m.planName} status is currently "${health.statusLabel}". Log in with your Email ID (${m.email}) on our website to view or expand your subscription.`
                        );
                        const whatsappUrl = `https://wa.me/91${m.phone.replace(/\D/g, '').slice(-10)}?text=${whatsappMsg}`;

                        return (
                          <tr key={m.id} className="hover:bg-white/[0.02]">
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-white">{m.name}</div>
                              <div className="font-mono text-[11px] text-[#D4AF37]">{m.email}</div>
                              <div className="font-mono text-[11px] text-neutral-400 tabular-nums">
                                {m.phone} · <span className="text-neutral-500">{m.id}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="text-neutral-200">{m.planName}</div>
                              <div className="font-mono text-xs text-[#D4AF37] tabular-nums">
                                ₹{m.amountInr.toLocaleString('en-IN')} ({m.durationDays}d total)
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-mono text-[11px] text-neutral-300 tabular-nums">
                                {m.pendingExtension ? m.pendingExtension.utrNumber : m.utrNumber}
                              </div>
                              {m.pendingExtension?.screenshotDataUrl || m.screenshotDataUrl ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLightboxImage({
                                      url:
                                        m.pendingExtension?.screenshotDataUrl ||
                                        m.screenshotDataUrl!,
                                      memberName: m.name,
                                      utr: m.pendingExtension
                                        ? m.pendingExtension.utrNumber
                                        : m.utrNumber,
                                      amount: m.pendingExtension
                                        ? m.pendingExtension.amountInr
                                        : m.amountInr,
                                    })
                                  }
                                  className="mt-1 text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" /> View Screenshot
                                </button>
                              ) : (
                                <span className="text-[11px] text-neutral-500">Cash / Walk-in</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 text-[11px] font-medium border rounded ${badgeClass}`}
                              >
                                {health.statusLabel}
                              </span>
                              {hasPendingExt && (
                                <div className="mt-1 text-[11px] font-mono text-amber-300">
                                  +Pending +{m.pendingExtension!.addedDays}d Expansion
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-300 tabular-nums">
                              {m.startDate ? (
                                <>
                                  <div>Start: {formatDate(m.startDate)}</div>
                                  <div className="text-neutral-400">
                                    End: {formatDate(m.endDate)}
                                  </div>
                                </>
                              ) : (
                                <span className="text-amber-400/90">Starts on approval</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {m.status === 'pending_approval' || hasPendingExt ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundEngine.playPlateLock(140);
                                      onApproveMember(m.id);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-[#09090B] font-medium text-[11px] rounded whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    {hasPendingExt
                                      ? `Approve +${m.pendingExtension!.addedDays}d`
                                      : 'Approve & Start'}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundEngine.playMechanicalTick(1.1);
                                      onExtendMemberDays(m.id, 30, 1200);
                                    }}
                                    title="Add +30 Days (+₹1,200) directly onto current plan"
                                    className="px-2.5 py-1 bg-[#09090B] hover:bg-white/10 border border-white/15 text-neutral-200 text-[11px] rounded flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    <RefreshCw className="w-3 h-3 text-[#D4AF37]" />
                                    <span>+30d Stack</span>
                                  </button>
                                )}

                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Send WhatsApp Fee / Status Reminder"
                                  className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/30 text-emerald-300 text-[11px] rounded flex items-center gap-1 whitespace-nowrap shrink-0"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => onDeleteMember(m.id)}
                                  title="Delete Member Record"
                                  className="p-1 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: ADD WALK-IN / OFFLINE CASH MEMBER */}
            {activeTab === 'walk_in' && (
              <div className="max-w-2xl bg-[#111114] border border-white/[0.08] rounded-lg p-6">
                <h4 className="font-display text-lg font-semibold text-white">
                  Register Walk-In / Front-Desk Member
                </h4>
                <p className="text-xs text-neutral-400 mt-1 mb-5">
                  Use this form when a customer pays cash or UPI directly at the 21 Fitness front
                  desk. Creates their Email ID login (`password123`) and starts their subscription
                  immediately.
                </p>

                <form onSubmit={handleAddWalkInSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">
                        Member Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={walkInName}
                        onChange={(e) => setWalkInName(e.target.value)}
                        placeholder="e.g. Siddharth Roy"
                        className="w-full px-3.5 py-2 text-sm bg-[#09090B] border border-white/15 rounded-md text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">
                        Email ID (For Login) *
                      </label>
                      <input
                        type="email"
                        required
                        value={walkInEmail}
                        onChange={(e) => setWalkInEmail(e.target.value)}
                        placeholder="siddharth@example.com"
                        className="w-full px-3.5 py-2 text-sm bg-[#09090B] border border-white/15 rounded-md text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">
                        10-Digit Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={walkInPhone}
                        onChange={(e) => setWalkInPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-3.5 py-2 text-sm bg-[#09090B] border border-white/15 rounded-md text-white font-mono tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">Select Plan</label>
                      <select
                        value={walkInPlanId}
                        onChange={(e) => setWalkInPlanId(e.target.value as PlanId)}
                        className="w-full px-3 py-2 text-sm bg-[#09090B] border border-white/15 rounded-md text-white"
                      >
                        <option value="1m">1 Month · ₹1,200 (30d)</option>
                        <option value="6m">6 Months · ₹6,000 (180d)</option>
                        <option value="12m">1 Year · ₹10,000 (365d)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">Payment Mode</label>
                      <select
                        value={walkInPaymentMethod}
                        onChange={(e) =>
                          setWalkInPaymentMethod(e.target.value as 'cash' | 'upi_qr')
                        }
                        className="w-full px-3 py-2 text-sm bg-[#09090B] border border-white/15 rounded-md text-white"
                      >
                        <option value="cash">Cash at Front Desk</option>
                        <option value="upi_qr">Direct UPI QR</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">
                        Receipt / UTR (Optional)
                      </label>
                      <input
                        type="text"
                        value={walkInUtr}
                        onChange={(e) => setWalkInUtr(e.target.value)}
                        placeholder="CASH-104"
                        className="w-full px-3 py-2 text-sm bg-[#09090B] border border-white/15 rounded-md text-white font-mono"
                      />
                    </div>
                  </div>

                  {walkInSuccess && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded text-xs text-emerald-300">
                      {walkInSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#e2be46] text-[#09090B] font-medium text-xs rounded-md transition-colors cursor-pointer"
                  >
                    Add Member &amp; Start Subscription Now
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: QR CODE & UPI SETTINGS */}
            {activeTab === 'qr_settings' && (
              <div className="max-w-2xl bg-[#111114] border border-white/[0.08] rounded-lg p-6">
                <h4 className="font-display text-lg font-semibold text-white">
                  Payment QR Code &amp; Merchant UPI Settings
                </h4>
                <p className="text-xs text-neutral-400 mt-1 mb-5">
                  Configure your gym&apos;s UPI ID for dynamic amount-locked QR codes, or upload a
                  photo of your physical PhonePe / GPay / Paytm standee QR code.
                </p>

                <form onSubmit={handleSaveQrSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">
                        Merchant UPI ID
                      </label>
                      <input
                        type="text"
                        value={upiIdDraft}
                        onChange={(e) => setUpiIdDraft(e.target.value)}
                        placeholder="21fitness@upi"
                        className="w-full px-3.5 py-2 text-sm bg-[#09090B] border border-white/15 rounded-md text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">
                        Merchant Payee Name
                      </label>
                      <input
                        type="text"
                        value={payeeNameDraft}
                        onChange={(e) => setPayeeNameDraft(e.target.value)}
                        placeholder="21 Fitness"
                        className="w-full px-3.5 py-2 text-sm bg-[#09090B] border border-white/15 rounded-md text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">
                        Checkout QR Display Mode
                      </label>
                      <select
                        value={qrModeDraft}
                        onChange={(e) =>
                          setQrModeDraft(e.target.value as 'both' | 'dynamic_only' | 'custom_only')
                        }
                        className="w-full px-3.5 py-2 text-sm bg-[#09090B] border border-white/15 rounded-md text-white"
                      >
                        <option value="both">Both Dynamic UPI QR + Custom Uploaded QR</option>
                        <option value="dynamic_only">Dynamic UPI QR Only</option>
                        <option value="custom_only">Custom Uploaded QR Image Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">
                        Owner Admin PIN
                      </label>
                      <input
                        type="text"
                        value={pinDraft}
                        onChange={(e) => setPinDraft(e.target.value)}
                        placeholder="2121"
                        className="w-full px-3.5 py-2 text-sm bg-[#09090B] border border-white/15 rounded-md text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Custom QR Image Upload */}
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">
                      Custom Merchant QR Standee Image (Optional)
                    </label>
                    <input
                      ref={customQrInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomQrUpload}
                      className="hidden"
                    />

                    <div className="flex items-center gap-4">
                      {customQrDraft ? (
                        <div className="flex items-center gap-3 p-2.5 bg-[#09090B] border border-white/15 rounded-md">
                          <img
                            src={customQrDraft}
                            alt="Custom QR Preview"
                            className="w-16 h-16 object-contain bg-white p-1 rounded"
                          />
                          <div className="space-y-1">
                            <div className="text-xs text-emerald-400 font-medium">
                              Custom QR Uploaded
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => customQrInputRef.current?.click()}
                                className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => setCustomQrDraft(null)}
                                className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => customQrInputRef.current?.click()}
                          className="px-4 py-3 bg-[#09090B] hover:bg-white/5 border border-dashed border-white/20 rounded-md text-xs text-neutral-300 flex items-center gap-2 cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-[#D4AF37]" />
                          <span>Upload Custom QR Code Image (PNG / JPG)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {settingsSavedMsg && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded text-xs text-emerald-300">
                      {settingsSavedMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#e2be46] text-[#09090B] font-medium text-xs rounded-md transition-colors cursor-pointer"
                  >
                    Save QR &amp; Admin Configuration
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-Screen Screenshot Lightbox inside Admin Panel */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90"
        >
          <div className="bg-[#111114] border border-white/20 rounded-lg p-5 max-w-md w-full">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div>
                <div className="text-sm font-semibold text-white">{lightboxImage.memberName}</div>
                <div className="text-xs font-mono text-[#D4AF37]">
                  ₹{lightboxImage.amount.toLocaleString('en-IN')} · UTR: {lightboxImage.utr}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt="Customer Payment Screenshot"
              className="w-full max-h-[70vh] object-contain rounded border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};
