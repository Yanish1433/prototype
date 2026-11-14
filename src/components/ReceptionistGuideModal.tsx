import React, { useMemo } from 'react';
import {
  Armchair,
  Compass,
  LampDesk,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  PASS_TIERS,
  formatNpr,
  type BookingRecord,
  type LightingMode,
  type StudyChairMetadata,
} from '../types/space';

interface ReceptionistGuideModalProps {
  lightingMode: LightingMode;
  chairCatalog: Record<string, StudyChairMetadata>;
  bookings: BookingRecord[];
  onClose: () => void;
  onWalkToSpot: (x: number, z: number, lookX?: number, lookZ?: number) => void;
  onPickChairToBook: (chair: StudyChairMetadata) => void;
}

interface RecommendationCard {
  id: string;
  tag: string;
  title: string;
  reason: string;
  chair: StudyChairMetadata | null;
  Icon: React.FC<{ className?: string }>;
}

export const ReceptionistGuideModal: React.FC<ReceptionistGuideModalProps> = ({
  lightingMode,
  chairCatalog,
  bookings,
  onClose,
  onWalkToSpot,
  onPickChairToBook,
}) => {
  const isDay = lightingMode === 'day';
  const isEvening = lightingMode === 'evening';

  const bookedSet = useMemo(
    () => new Set(bookings.map((b) => b.chairId)),
    [bookings]
  );

  const recommendations = useMemo<RecommendationCard[]>(() => {
    const all = Object.values(chairCatalog);
    const findFirstOpen = (prefixList: string[]) =>
      all.find(
        (c) =>
          c.targetKind === 'chair' &&
          !bookedSet.has(c.id) &&
          prefixList.some((p) => c.id.startsWith(p))
      ) || null;

    const quietBest = findFirstOpen(['Q3', 'Q6', 'Q1', 'Q2', 'Q4', 'Q5']);
    const marbleBest = findFirstOpen(['M', 'S', 'W']);
    const loungeBest = findFirstOpen(['CA', 'LA', 'OA', 'RA']);
    const pantryBest = findFirstOpen(['P']);
    const hubRoom = chairCatalog['INNOVATION-HUB-ROOM'] || null;

    return [
      {
        id: 'quiet',
        tag: 'Deep Silence · Most Popular',
        title: quietBest ? quietBest.label : 'Quiet Study Desks',
        reason: quietBest
          ? `${quietBest.positionLabel} — acoustic walnut carrel, personal brass dome lamp & power dock (${formatNpr(quietBest.rates.hourly)}/hr · ${formatNpr(quietBest.rates.daily)}/day · ${formatNpr(quietBest.rates['monthly-dedicated'])}/mo pod).`
          : 'All 6 Quiet Study Desks are currently booked. Try a Reading Hall desk below!',
        chair: quietBest,
        Icon: LampDesk,
      },
      {
        id: 'reading',
        tag: 'Bright & Spacious',
        title: marbleBest ? marbleBest.label : 'Main Reading Hall Tables',
        reason: marbleBest
          ? `${marbleBest.positionLabel} — wide marble or walnut shared desk beneath brass chandeliers (${formatNpr(marbleBest.rates.hourly)}/hr walk-in or ${formatNpr(marbleBest.rates['monthly-unlimited'])}/mo unlimited).`
          : 'All table chairs are currently reserved.',
        chair: marbleBest,
        Icon: Sparkles,
      },
      {
        id: 'lounge',
        tag: 'Relaxed Reading',
        title: loungeBest ? loungeBest.label : 'Lounge Armchairs',
        reason: loungeBest
          ? `${loungeBest.positionLabel} — plush single armchair with warm floor-lamp glow (${formatNpr(loungeBest.rates.hourly)}/hr · ${formatNpr(loungeBest.rates.weekly)}/week). Note: sofas & benches are open shared seating.`
          : 'All individual lounge armchairs are currently occupied.',
        chair: loungeBest,
        Icon: Armchair,
      },
      {
        id: 'hub',
        tag: 'Full Suite Only · 12 Seats',
        title: 'Innovation Hub Boardroom',
        reason: bookedSet.has('INNOVATION-HUB-ROOM')
          ? 'Currently reserved — individual chairs inside Innovation Hub cannot be booked separately.'
          : `Reserve the entire 12-seat glass-whiteboard suite (${hubRoom ? formatNpr(hubRoom.rates.hourly) : 'NPR 1,200'}/hr · ${hubRoom ? formatNpr(hubRoom.rates.daily) : 'NPR 6,000'}/day). Individual conference chairs are never sold one-by-one.`,
        chair: hubRoom,
        Icon: Users,
      },
      {
        id: 'pantry',
        tag: 'Coffee & Quick Work',
        title: pantryBest ? pantryBest.label : 'Pantry Dining Seats',
        reason: pantryBest
          ? `Steps from the espresso machine and sunny north window (${formatNpr(pantryBest.rates.hourly)}/hr · ${formatNpr(pantryBest.rates.daily)}/day).`
          : 'Both Pantry dining seats are currently booked.',
        chair: pantryBest,
        Icon: Compass,
      },
    ];
  }, [chairCatalog, bookedSet]);

  const panelClass = isDay
    ? 'bg-[#faf8f4] border-stone-300 text-stone-900'
    : isEvening
      ? 'bg-[#1f181b] border-amber-500/30 text-amber-50'
      : 'bg-[#0e121b] border-slate-700 text-stone-100';

  const cardClass = isDay
    ? 'bg-stone-100/90 border-stone-200'
    : isEvening
      ? 'bg-black/30 border-amber-500/20'
      : 'bg-slate-900 border-slate-800';

  const mutedText = isDay
    ? 'text-stone-600'
    : isEvening
      ? 'text-amber-200/75'
      : 'text-slate-400';

  const primaryBtnClass = isDay
    ? 'bg-stone-900 hover:bg-stone-800 text-white'
    : 'bg-amber-500 hover:bg-amber-400 text-stone-950';

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/55 p-2 sm:p-4">
      <div
        role="dialog"
        aria-label="Maya Receptionist Concierge Guide"
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[86dvh] ${panelClass}`}
      >
        {/* Header with Receptionist Identity */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-current/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-display font-bold text-amber-500 shrink-0">
              M
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-semibold tracking-tight">
                Maya · Receptionist Guide
              </h2>
              <p className={`text-xs ${mutedText}`}>
                “Welcome to Atelier Study! Tell me your mood and I’ll guide you right to an open seat.”
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receptionist guide"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-current/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recommendations List + Nepal Pass Rate Card */}
        <div className="flex-1 overflow-y-auto studio-scroll p-4 space-y-2.5">
          {recommendations.map((rec) => {
            const Icon = rec.Icon;
            const isRoomBooked =
              rec.chair?.id === 'INNOVATION-HUB-ROOM' &&
              bookedSet.has('INNOVATION-HUB-ROOM');
            return (
              <div
                key={rec.id}
                className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardClass}`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-500">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{rec.tag}</span>
                  </div>
                  <h3 className="font-display text-sm font-semibold">
                    {rec.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${mutedText}`}>
                    {rec.reason}
                  </p>
                </div>

                {rec.chair && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onWalkToSpot(
                          rec.chair!.cameraViewPosition[0],
                          rec.chair!.cameraViewPosition[2],
                          rec.chair!.cameraLookTarget[0],
                          rec.chair!.cameraLookTarget[2]
                        );
                        onClose();
                      }}
                      className="px-3 py-2 rounded-lg border border-current/20 hover:bg-current/10 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors"
                    >
                      Walk Here
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onPickChairToBook(rec.chair!);
                        onClose();
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${primaryBtnClass}`}
                    >
                      {isRoomBooked ? 'View Status' : 'Book Now'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Standard Seat Pass Tiers (Nepal NPR) */}
          <div className={`rounded-xl border p-3.5 space-y-2 ${cardClass}`}>
            <div className="text-[11px] font-semibold text-amber-500">
              Nepal Study Passes · Standard Desk Rates
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PASS_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className="rounded-lg border border-current/10 px-2.5 py-2 text-[11px] space-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2 font-semibold">
                    <span className="truncate">{tier.name}</span>
                    <span className="font-mono-tabular text-amber-500 shrink-0">
                      {formatNpr(tier.defaultPriceNpr)}/{tier.unitLabel}
                    </span>
                  </div>
                  <div className={`${mutedText} leading-snug`}>{tier.accessAndSeatType}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
