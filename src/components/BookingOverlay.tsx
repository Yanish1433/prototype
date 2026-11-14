import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Info,
  LampDesk,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  PASS_TIERS,
  PASS_TIER_MAP,
  formatNpr,
  type BookableTargetKind,
  type BookingPlan,
  type BookingRecord,
  type LightingMode,
  type StudyChairMetadata,
} from '../types/space';

interface BookingOverlayProps {
  chair: StudyChairMetadata;
  existingBooking: BookingRecord | undefined;
  lightingMode: LightingMode;
  onClose: () => void;
  onSubmitBooking: (payload: {
    chairId: string;
    chairLabel: string;
    roomName: string;
    targetKind: BookableTargetKind;
    plan: BookingPlan;
    startDate: string;
    startTime: string;
    durationUnits: number;
    guestName: string;
    guestEmail: string;
    preferences: string[];
    totalPrice: number;
  }) => Promise<void>;
  onCancelBooking: (bookingId: string) => Promise<void>;
}


export const BookingOverlay: React.FC<BookingOverlayProps> = ({
  chair,
  existingBooking,
  lightingMode,
  onClose,
  onSubmitBooking,
  onCancelBooking,
}) => {
  const isRoomBooking = chair.targetKind === 'room';
  const addonOptions = isRoomBooking
    ? ['Whiteboard Kit', 'HDMI & 4K Display', 'Coffee Service']
    : ['Warm Desk Lamp', 'Power & USB-C Dock', 'Silent Focus Zone'];

  const [plan, setPlan] = useState<BookingPlan>('hourly');
  const [startDate, setStartDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('09:00');
  const [durationUnits, setDurationUnits] = useState<number>(3);
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [preferences, setPreferences] = useState<string[]>([addonOptions[0]]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  // Reset form state smoothly when switching between different clicked chairs
  useEffect(() => {
    setConfirmedRef(null);
    setErrorMsg(null);
    setImgFailed(false);
    setPreferences([
      chair.targetKind === 'room' ? 'Whiteboard Kit' : 'Warm Desk Lamp',
    ]);
  }, [chair.id, chair.targetKind]);

  const activeTier = PASS_TIER_MAP[plan] ?? PASS_TIERS[0];
  const unitRate = chair.rates?.[plan] ?? activeTier.defaultPriceNpr;

  const totalPrice = useMemo(
    () => unitRate * Math.max(1, durationUnits),
    [unitRate, durationUnits]
  );

  const isDay = lightingMode === 'day';
  const isEvening = lightingMode === 'evening';

  const panelClass = isDay
    ? 'bg-[#faf8f4] border-stone-300 text-stone-900'
    : isEvening
      ? 'bg-[#1f181b] border-amber-500/30 text-amber-50'
      : 'bg-[#0e121b] border-slate-700 text-stone-100';

  const subSurfaceClass = isDay
    ? 'bg-stone-100 border-stone-200'
    : isEvening
      ? 'bg-black/30 border-amber-500/20'
      : 'bg-slate-900/90 border-slate-800';

  const inputClass = isDay
    ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-stone-800'
    : isEvening
      ? 'bg-stone-900/90 border-amber-500/30 text-amber-50 placeholder:text-amber-200/40 focus:border-amber-400'
      : 'bg-slate-900 border-slate-700 text-stone-100 placeholder:text-slate-500 focus:border-amber-400';

  const accentBtnClass = isDay
    ? 'bg-stone-900 hover:bg-stone-800 text-white'
    : isEvening
      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
      : 'bg-amber-400 hover:bg-amber-300 text-stone-950';

  const mutedText = isDay
    ? 'text-stone-500'
    : isEvening
      ? 'text-amber-200/75'
      : 'text-slate-400';

  const togglePreference = (pref: string) => {
    setPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handlePlanChange = (nextPlan: BookingPlan) => {
    setPlan(nextPlan);
    setDurationUnits(nextPlan === 'hourly' ? 3 : 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!guestName.trim() || !guestEmail.trim()) {
      setErrorMsg('Please enter your full name and email to confirm.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmitBooking({
        chairId: chair.id,
        chairLabel: chair.label,
        roomName: chair.roomName,
        targetKind: chair.targetKind,
        plan,
        startDate,
        startTime,
        durationUnits,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        preferences,
        totalPrice,
      });
      setConfirmedRef(`${chair.id}-${Date.now().toString().slice(-4)}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside
      aria-label={`Book ${chair.label}`}
      className="fixed inset-x-2 bottom-2 top-auto sm:inset-auto sm:top-20 sm:right-5 sm:bottom-24 z-30 w-auto sm:w-[400px] max-h-[82dvh] sm:max-h-none flex flex-col"
    >
      <div
        className={`flex flex-col h-full rounded-2xl border shadow-2xl overflow-hidden transition-colors duration-300 ${panelClass}`}
      >
        {/* Room Preview Visual Header */}
        <div className="relative h-24 sm:h-36 shrink-0 overflow-hidden bg-stone-800">
          {!imgFailed ? (
            <img
              src={chair.previewImage}
              alt={`${chair.roomName} architectural preview`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-800 to-amber-950 flex items-center justify-center">
              <LampDesk className="w-8 h-8 text-amber-200/70" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/15" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking overlay"
            className="absolute top-2.5 right-2.5 w-9 h-9 rounded-lg bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="text-[11px] font-medium text-amber-200/90">
              {chair.roomName} ·{' '}
              {existingBooking
                ? 'Reserved'
                : isRoomBooking
                  ? 'Full-Room Booking'
                  : 'Chair Pulled Out'}
            </div>
            <h2 className="font-display text-lg font-semibold tracking-tight leading-snug">
              {chair.label}
            </h2>
            <p className="text-xs text-stone-200/85 truncate">{chair.positionLabel}</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto studio-scroll p-4 space-y-3.5">
          {isRoomBooking && (
            <div
              className={`rounded-xl border p-3 flex items-start gap-2.5 text-xs ${subSurfaceClass}`}
            >
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className={mutedText}>
                Individual Innovation Hub chairs cannot be sold separately. This
                reservation books the entire 12-seat conference room.
              </p>
            </div>
          )}

          {existingBooking ? (
            <div className={`rounded-xl border p-4 space-y-3 ${subSurfaceClass}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-amber-500">
                    Active Reservation
                  </div>
                  <div className="font-display text-base font-semibold mt-0.5">
                    {existingBooking.guestName}
                  </div>
                  <div className={`text-xs ${mutedText}`}>
                    {existingBooking.guestEmail}
                  </div>
                </div>
                <span className="font-mono-tabular text-xs font-semibold px-2 py-1 rounded bg-amber-500/15 text-amber-500">
                  {existingBooking.referenceCode}
                </span>
              </div>

              <div className={`text-xs space-y-1 pt-2 border-t border-current/10 ${mutedText}`}>
                <div className="flex justify-between gap-2">
                  <span>Pass</span>
                  <span className="font-medium text-right text-current">
                    {PASS_TIER_MAP[existingBooking.plan]?.name ?? existingBooking.plan} (
                    {existingBooking.durationUnits}{' '}
                    {existingBooking.durationUnits === 1
                      ? PASS_TIER_MAP[existingBooking.plan]?.unitLabel ?? 'unit'
                      : PASS_TIER_MAP[existingBooking.plan]?.unitPlural ?? 'units'}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Start</span>
                  <span className="font-mono-tabular text-current">
                    {existingBooking.startDate} · {existingBooking.startTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid</span>
                  <span className="font-mono-tabular font-semibold text-current">
                    {formatNpr(existingBooking.totalPrice)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  await onCancelBooking(existingBooking.id);
                  setSubmitting(false);
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-500/40 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isRoomBooking ? 'Release Room Reservation' : 'Release Seat Reservation'}
                </span>
              </button>
            </div>
          ) : confirmedRef ? (
            <div className={`rounded-xl border p-5 text-center space-y-3 ${subSurfaceClass}`}>
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div>
                <h3 className="font-display text-base font-semibold">
                  {isRoomBooking ? 'Innovation Hub Reserved' : 'Seat Reserved'}
                </h3>
                <p className={`text-xs mt-1 ${mutedText}`}>
                  {chair.label} in {chair.roomName} is confirmed for you.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${accentBtnClass}`}
              >
                Return to 3D Walkthrough
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold">Pass Tier (Nepal NPR)</span>
                  <span className={`text-xs font-mono-tabular ${mutedText}`}>
                    {formatNpr(unitRate)} / {activeTier.unitLabel}
                  </span>
                </div>
                <div className={`grid grid-cols-2 gap-1.5 p-1.5 rounded-xl border ${subSurfaceClass}`}>
                  {PASS_TIERS.map((tier) => {
                    const active = plan === tier.id;
                    const tierPrice = chair.rates?.[tier.id] ?? tier.defaultPriceNpr;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => handlePlanChange(tier.id)}
                        className={`py-2 px-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                          active ? accentBtnClass : `${mutedText} hover:text-current hover:bg-current/5`
                        }`}
                      >
                        <div className="text-[11px] font-semibold leading-tight truncate">
                          {tier.shortLabel}
                        </div>
                        <div className="text-[10px] font-mono-tabular opacity-85 mt-0.5">
                          {formatNpr(tierPrice)}/{tier.unitLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Pass Details: Access & Seat Type + Best For */}
                <div className={`mt-2 rounded-xl border p-2.5 space-y-1 text-[11px] ${subSurfaceClass}`}>
                  <div className="font-semibold leading-snug">{activeTier.name}</div>
                  <div className={mutedText}>
                    <span className="font-semibold text-current">Access: </span>
                    {activeTier.accessAndSeatType}
                  </div>
                  <div className={mutedText}>
                    <span className="font-semibold text-current">Best for: </span>
                    {activeTier.bestFor}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="block">
                  <span className={`block text-[11px] font-medium mb-1 ${mutedText}`}>
                    Start Date
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-2.5 py-2 rounded-lg border text-xs font-mono-tabular outline-none ${inputClass}`}
                    required
                  />
                </label>

                {plan === 'hourly' ? (
                  <label className="block">
                    <span className={`block text-[11px] font-medium mb-1 ${mutedText}`}>
                      Check-in Time
                    </span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={`w-full px-2.5 py-2 rounded-lg border text-xs font-mono-tabular outline-none ${inputClass}`}
                      required
                    />
                  </label>
                ) : (
                  <label className="block">
                    <span className={`block text-[11px] font-medium mb-1 capitalize ${mutedText}`}>
                      Duration ({activeTier.unitPlural})
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={plan === 'daily' ? 14 : plan === 'weekly' ? 8 : 12}
                      value={durationUnits}
                      onChange={(e) =>
                        setDurationUnits(Math.max(1, Number(e.target.value) || 1))
                      }
                      className={`w-full px-2.5 py-2 rounded-lg border text-xs font-mono-tabular outline-none ${inputClass}`}
                      required
                    />
                  </label>
                )}
              </div>

              {plan === 'hourly' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-medium flex items-center gap-1 ${mutedText}`}>
                      <Clock className="w-3 h-3" />
                      Hours Reserved
                    </span>
                    <span className="text-xs font-mono-tabular font-semibold">
                      {durationUnits} {durationUnits === 1 ? 'hour' : 'hours'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={durationUnits}
                    onChange={(e) => setDurationUnits(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              <div>
                <span className={`block text-[11px] font-medium mb-1.5 ${mutedText}`}>
                  {isRoomBooking ? 'Suite Setup Preferences' : 'Seat Preferences'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {addonOptions.map((pref) => {
                    const selected = preferences.includes(pref);
                    return (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => togglePreference(pref)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                          selected ? accentBtnClass : `${subSurfaceClass} ${mutedText}`
                        }`}
                      >
                        {pref}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Full name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${inputClass}`}
                  required
                />
                <input
                  type="email"
                  placeholder="Email for booking pass"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${inputClass}`}
                  required
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-red-500 font-medium">{errorMsg}</div>
              )}

              <div className={`rounded-xl border p-3 flex items-center justify-between ${subSurfaceClass}`}>
                <div>
                  <div className={`text-[11px] ${mutedText}`}>Total Due</div>
                  <div className="font-mono-tabular text-lg font-bold">
                    {formatNpr(totalPrice)}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-60 ${accentBtnClass}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Reserving...' : 'Confirm Booking'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </aside>
  );
};
