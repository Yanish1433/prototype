import React from 'react';
import { Calendar, MapPin, Trash2, X } from 'lucide-react';
import {
  PASS_TIER_MAP,
  formatNpr,
  type BookingRecord,
  type LightingMode,
} from '../types/space';

interface BookingsDrawerProps {
  bookings: BookingRecord[];
  lightingMode: LightingMode;
  onClose: () => void;
  onFocusChair: (chairId: string) => void;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export const BookingsDrawer: React.FC<BookingsDrawerProps> = ({
  bookings,
  lightingMode,
  onClose,
  onFocusChair,
  onCancelBooking,
}) => {
  const isDay = lightingMode === 'day';
  const isEvening = lightingMode === 'evening';

  const panelClass = isDay
    ? 'bg-[#faf8f4] border-stone-300 text-stone-900'
    : isEvening
      ? 'bg-[#1f181b] border-amber-500/30 text-amber-50'
      : 'bg-[#0e121b] border-slate-700 text-stone-100';

  const cardClass = isDay
    ? 'bg-stone-100 border-stone-200'
    : isEvening
      ? 'bg-black/30 border-amber-500/20'
      : 'bg-slate-900 border-slate-800';

  const mutedText = isDay
    ? 'text-stone-500'
    : isEvening
      ? 'text-amber-200/70'
      : 'text-slate-400';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[82vh] ${panelClass}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-current/10">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Active Reservations
            </h2>
            <p className={`text-xs ${mutedText}`}>
              {bookings.length} {bookings.length === 1 ? 'reservation' : 'reservations'} active across reading chairs &amp; Innovation Hub
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bookings list"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-current/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto studio-scroll p-4 space-y-3">
          {bookings.length === 0 ? (
            <div className={`text-center py-10 text-sm ${mutedText}`}>
              No active desk bookings yet. Walk into the Quiet Study Studio and click any
              chair to reserve your spot.
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className={`rounded-xl border p-3.5 flex flex-col gap-2.5 ${cardClass}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-sm">
                        {b.chairLabel}
                      </span>
                      <span className="font-mono-tabular text-[11px] font-semibold text-amber-500">
                        {b.referenceCode}
                      </span>
                    </div>
                    <div className={`text-xs mt-0.5 ${mutedText}`}>
                      {b.guestName} · {b.guestEmail}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-tabular text-sm font-bold">
                      {formatNpr(b.totalPrice)}
                    </div>
                    <div className={`text-[11px] ${mutedText}`}>
                      {PASS_TIER_MAP[b.plan]?.shortLabel ?? b.plan} · {b.durationUnits}{' '}
                      {b.durationUnits === 1
                        ? PASS_TIER_MAP[b.plan]?.unitLabel ?? 'unit'
                        : PASS_TIER_MAP[b.plan]?.unitPlural ?? 'units'}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t border-current/10 text-xs ${mutedText}`}>
                  <div className="flex items-center gap-1.5 font-mono-tabular">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {b.startDate} · {b.startTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onFocusChair(b.chairId)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 font-medium transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Inspect Seat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onCancelBooking(b.id)}
                      aria-label={`Cancel ${b.chairLabel}`}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
