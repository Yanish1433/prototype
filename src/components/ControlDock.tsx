import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Compass,
  Home,
  Map as MapIcon,
  MessageSquareHeart,
  Moon,
  RotateCcw,
  RotateCw,
  Sun,
  Sunset,
} from 'lucide-react';
import type {
  CameraPresetId,
  LightingMode,
  MovementInputState,
} from '../types/space';

interface ControlDockProps {
  lightingMode: LightingMode;
  activePreset: CameraPresetId;
  currentRoom: string;
  bookingCount: number;
  isCollapsed: boolean;
  isMapOpen: boolean;
  isGuideOpen: boolean;
  hiddenOnMobile?: boolean;
  movementInputRef: React.MutableRefObject<MovementInputState>;
  onLightingChange: (mode: LightingMode) => void;
  onSelectPreset: (preset: CameraPresetId) => void;
  onOpenBookings: () => void;
  onToggleMap: () => void;
  onToggleGuide: () => void;
  onToggleCollapse: () => void;
  onReturnHome?: () => void;
}

const PRESETS: { id: CameraPresetId; label: string }[] = [
  { id: 'entrance', label: 'Entrance' },
  { id: 'reception', label: 'Reception' },
  { id: 'quiet-studio', label: 'Quiet Studio' },
  { id: 'reading-hall', label: 'Reading Hall' },
  { id: 'innovation-hub', label: 'Innovation Hub' },
  { id: 'overview', label: 'Overview 3D' },
];

const LIGHTING_OPTIONS: {
  id: LightingMode;
  label: string;
  mobileLabel: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'day', label: 'Day', mobileLabel: 'Day', Icon: Sun },
  { id: 'evening', label: 'Evening', mobileLabel: 'Eve', Icon: Sunset },
  { id: 'night', label: 'Night', mobileLabel: 'Night', Icon: Moon },
];

export const ControlDock: React.FC<ControlDockProps> = ({
  lightingMode,
  activePreset,
  currentRoom,
  bookingCount,
  isCollapsed,
  isMapOpen,
  isGuideOpen,
  hiddenOnMobile = false,
  movementInputRef,
  onLightingChange,
  onSelectPreset,
  onOpenBookings,
  onToggleMap,
  onToggleGuide,
  onToggleCollapse,
  onReturnHome,
}) => {
  const isDay = lightingMode === 'day';
  const isEvening = lightingMode === 'evening';

  const surfaceClass = isDay
    ? 'bg-[#faf8f4]/95 border-stone-300/90 text-stone-900 shadow-lg'
    : isEvening
      ? 'bg-[#211a1d]/95 border-amber-500/25 text-amber-50 shadow-2xl'
      : 'bg-[#0f131c]/95 border-slate-700/80 text-stone-100 shadow-2xl';

  const mutedTextClass = isDay
    ? 'text-stone-500'
    : isEvening
      ? 'text-amber-200/70'
      : 'text-slate-400';

  const segmentBgClass = isDay
    ? 'bg-stone-200/80'
    : isEvening
      ? 'bg-black/35'
      : 'bg-slate-900/90';

  const activeBtnClass = isDay
    ? 'bg-stone-900 text-stone-50'
    : isEvening
      ? 'bg-amber-500 text-stone-950'
      : 'bg-amber-400 text-stone-950';

  const inactiveBtnClass = isDay
    ? 'text-stone-700 hover:bg-stone-300/60'
    : isEvening
      ? 'text-amber-100/80 hover:bg-white/10'
      : 'text-slate-300 hover:bg-slate-800';

  const arrowBtnClass = isDay
    ? 'bg-stone-200/90 hover:bg-stone-300 active:bg-stone-900 active:text-white text-stone-800 border-stone-300'
    : isEvening
      ? 'bg-stone-800/90 hover:bg-amber-900/50 active:bg-amber-500 active:text-stone-950 text-amber-100 border-amber-500/25'
      : 'bg-slate-800/90 hover:bg-slate-700 active:bg-amber-400 active:text-stone-950 text-stone-100 border-slate-700';

  const setMove = (key: keyof MovementInputState, value: boolean) => {
    movementInputRef.current[key] = value;
  };

  return (
    <>
      {/* Responsive Top Spatial Header (fits 320px+ phones through 4K desktops cleanly) */}
      <header className="pointer-events-none fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20 flex items-center justify-between gap-1.5 sm:gap-2">
        <div
          className={`pointer-events-auto flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl border transition-colors duration-300 min-w-0 ${surfaceClass}`}
        >
          {onReturnHome && (
            <button
              type="button"
              onClick={onReturnHome}
              aria-label="Back to Overview Page"
              title="Back to Overview Page"
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg hover:bg-current/10 transition-colors cursor-pointer shrink-0"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-xs font-medium">Home</span>
            </button>
          )}
          <span className="font-display text-xs sm:text-base font-semibold tracking-tight whitespace-nowrap shrink-0">
            Quiet<span className="hidden xs:inline sm:inline"> Reading Space</span>
          </span>
          <span className={`text-[11px] sm:text-xs ${mutedTextClass}`} aria-hidden="true">
            /
          </span>
          <span className="text-[11px] sm:text-sm font-medium truncate max-w-[88px] sm:max-w-xs">
            {currentRoom}
          </span>
          <span
            className={`hidden xl:inline text-xs ${mutedTextClass}`}
            aria-hidden="true"
          >
            ·
          </span>
          <span className={`hidden xl:inline text-xs whitespace-nowrap ${mutedTextClass}`}>
            WASD/Arrows to walk · Drag to look · Click any chair or Maya for help
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleGuide}
            aria-label="Ask Receptionist Maya"
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isGuideOpen ? activeBtnClass : surfaceClass
            }`}
          >
            <MessageSquareHeart className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          <button
            type="button"
            onClick={onToggleMap}
            aria-label="Toggle 2D Floorplan Map"
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isMapOpen ? activeBtnClass : surfaceClass
            }`}
          >
            <MapIcon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">2D Map</span>
          </button>

          <button
            type="button"
            onClick={onOpenBookings}
            aria-label="Open Active Bookings"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${surfaceClass}`}
          >
            <CalendarCheck className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Bookings</span>
            <span className="font-mono-tabular opacity-85">({bookingCount})</span>
          </button>
        </div>
      </header>

      {/* Bottom Dock (auto-tucked on phones when an overlay/map is open) */}
      <div
        className={`fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-200 ${
          hiddenOnMobile ? 'hidden sm:block' : 'block'
        } ${isCollapsed ? 'w-auto' : 'w-[calc(100vw-16px)] sm:w-[min(1020px,96vw)]'}`}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Show Controls"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${surfaceClass}`}
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Show Controls</span>
          </button>
        ) : (
          <>
            {/* Subtle Collapse Handle */}
            <div className="flex justify-center mb-1">
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Hide Controls"
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${surfaceClass}`}
              >
                <ChevronDown className="w-3 h-3" />
                <span>Hide Controls</span>
              </button>
            </div>

            {/* Main Dock Panel */}
            <div
              className={`rounded-2xl border p-1.5 sm:p-2.5 transition-colors duration-300 ${surfaceClass}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5 sm:gap-2">
                {/* Mobile Top Row / Desktop Split: Lighting Toggle + Walk Pad */}
                <div className="flex items-center justify-between gap-1.5 lg:contents">
                  {/* 1. Day / Evening / Night Lighting Toggle */}
                  <div
                    className={`flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-xl shrink-0 lg:order-1 ${segmentBgClass}`}
                    role="group"
                    aria-label="Time of day lighting mode"
                  >
                    {LIGHTING_OPTIONS.map(({ id, label, mobileLabel, Icon }) => {
                      const active = lightingMode === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onLightingChange(id)}
                          className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                            active ? activeBtnClass : inactiveBtnClass
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="sm:hidden">{mobileLabel}</span>
                          <span className="hidden sm:inline">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 3. Compact Walk & Look Pad */}
                  <div
                    className="flex items-center gap-0.5 sm:gap-1 shrink-0 lg:order-3"
                    role="group"
                    aria-label="Walk and look navigation arrows"
                  >
                    <button
                      type="button"
                      aria-label="Turn Left"
                      onPointerDown={() => setMove('turnLeft', true)}
                      onPointerUp={() => setMove('turnLeft', false)}
                      onPointerLeave={() => setMove('turnLeft', false)}
                      onPointerCancel={() => setMove('turnLeft', false)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer touch-none ${arrowBtnClass}`}
                    >
                      <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move Left"
                      onPointerDown={() => setMove('left', true)}
                      onPointerUp={() => setMove('left', false)}
                      onPointerLeave={() => setMove('left', false)}
                      onPointerCancel={() => setMove('left', false)}
                      className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer touch-none ${arrowBtnClass}`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <button
                        type="button"
                        aria-label="Move Forward"
                        onPointerDown={() => setMove('forward', true)}
                        onPointerUp={() => setMove('forward', false)}
                        onPointerLeave={() => setMove('forward', false)}
                        onPointerCancel={() => setMove('forward', false)}
                        className={`w-7 h-5 sm:w-9 sm:h-7 flex items-center justify-center rounded-md sm:rounded-lg border transition-colors cursor-pointer touch-none ${arrowBtnClass}`}
                      >
                        <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move Backward"
                        onPointerDown={() => setMove('backward', true)}
                        onPointerUp={() => setMove('backward', false)}
                        onPointerLeave={() => setMove('backward', false)}
                        onPointerCancel={() => setMove('backward', false)}
                        className={`w-7 h-5 sm:w-9 sm:h-7 flex items-center justify-center rounded-md sm:rounded-lg border transition-colors cursor-pointer touch-none ${arrowBtnClass}`}
                      >
                        <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label="Move Right"
                      onPointerDown={() => setMove('right', true)}
                      onPointerUp={() => setMove('right', false)}
                      onPointerLeave={() => setMove('right', false)}
                      onPointerCancel={() => setMove('right', false)}
                      className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer touch-none ${arrowBtnClass}`}
                    >
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Turn Right"
                      onPointerDown={() => setMove('turnRight', true)}
                      onPointerUp={() => setMove('turnRight', false)}
                      onPointerLeave={() => setMove('turnRight', false)}
                      onPointerCancel={() => setMove('turnRight', false)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer touch-none ${arrowBtnClass}`}
                    >
                      <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Room & Wide-Angle Camera Presets (Single scrollable strip) */}
                <div
                  className={`flex items-center gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full lg:order-2 lg:flex-1 lg:min-w-0 ${segmentBgClass}`}
                  role="group"
                  aria-label="Room viewpoints"
                >
                  <Compass className={`w-3.5 h-3.5 ml-1 mr-0.5 shrink-0 ${mutedTextClass}`} />
                  {PRESETS.map((preset) => {
                    const active = activePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onSelectPreset(preset.id)}
                        className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          active ? activeBtnClass : inactiveBtnClass
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

