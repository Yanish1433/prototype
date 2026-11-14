import React from 'react';
import { Maximize2, Minimize2, Navigation, X } from 'lucide-react';
import {
  formatNpr,
  type BookingRecord,
  type LightingMode,
  type PlayerPose,
  type StudyChairMetadata,
} from '../types/space';

interface MiniMap2DProps {
  lightingMode: LightingMode;
  playerPose: PlayerPose;
  chairCatalog: Record<string, StudyChairMetadata>;
  bookings: BookingRecord[];
  selectedChairId: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCloseMobile: () => void;
  onNavigatePoint: (x: number, z: number, lookX?: number, lookZ?: number) => void;
  onSelectChair: (chair: StudyChairMetadata) => void;
}

const ROOM_HOTSPOTS: {
  id: string;
  label: string;
  x: number;
  z: number;
  lookX: number;
  lookZ: number;
  w: number;
  h: number;
  cx: number;
  cz: number;
}[] = [
  {
    id: 'reading-hall',
    label: 'Main Reading Hall',
    x: -4.8,
    z: 0,
    lookX: -6.2,
    lookZ: 0,
    w: 8.4,
    h: 12.4,
    cx: -1.6,
    cz: 0,
  },
  {
    id: 'reception',
    label: 'Reception',
    x: 1.4,
    z: -0.2,
    lookX: 1.5,
    lookZ: -1.4,
    w: 4.0,
    h: 5.5,
    cx: 1.25,
    cz: 0.75,
  },
  {
    id: 'upper-pantry',
    label: 'Pantry',
    x: 0.75,
    z: -4.55,
    lookX: 0.5,
    lookZ: -5.4,
    w: 2.7,
    h: 3.3,
    cx: 1.0,
    cz: -3.6,
  },
  {
    id: 'corridor',
    label: 'Entrance',
    x: 4.0,
    z: -4.75,
    lookX: 2.85,
    lookZ: -3.0,
    w: 6.9,
    h: 2.9,
    cx: 2.85,
    cz: -4.45,
  },
  {
    id: 'quiet-studio',
    label: 'Quiet Studio',
    x: 6.2,
    z: -1.0,
    lookX: 6.45,
    lookZ: -2.2,
    w: 5.6,
    h: 4.6,
    cx: 4.15,
    cz: -0.95,
  },
  {
    id: 'innovation-hub',
    label: 'Innovation Hub',
    x: 6.2,
    z: 3.75,
    lookX: 6.4,
    lookZ: 3.8,
    w: 5.6,
    h: 4.9,
    cx: 4.15,
    cz: 3.8,
  },
  {
    id: 'lower-pantry',
    label: 'Break Room',
    x: 0.5,
    z: 4.4,
    lookX: 0.2,
    lookZ: 5.2,
    w: 2.2,
    h: 3.6,
    cx: 0.85,
    cz: 3.55,
  },
  {
    id: 'wc',
    label: 'W.C.',
    x: 2.5,
    z: 4.4,
    lookX: 2.5,
    lookZ: 5.4,
    w: 1.8,
    h: 3.6,
    cx: 2.45,
    cz: 3.35,
  },
];

export const MiniMap2D: React.FC<MiniMap2DProps> = ({
  lightingMode,
  playerPose,
  chairCatalog,
  bookings,
  selectedChairId,
  isExpanded,
  onToggleExpand,
  onCloseMobile,
  onNavigatePoint,
  onSelectChair,
}) => {
  const isDay = lightingMode === 'day';
  const isEvening = lightingMode === 'evening';

  const bookedSet = new Set(bookings.map((b) => b.chairId));
  const chairs = Object.values(chairCatalog);

  const surfaceClass = isDay
    ? 'bg-[#faf8f4] border-stone-300 text-stone-900 shadow-xl'
    : isEvening
      ? 'bg-[#211a1d] border-amber-500/30 text-amber-50 shadow-2xl'
      : 'bg-[#0f131c] border-slate-700 text-stone-100 shadow-2xl';

  const mutedText = isDay
    ? 'text-stone-500'
    : isEvening
      ? 'text-amber-200/75'
      : 'text-slate-400';

  const wallStroke = isDay ? '#292524' : '#cbd5e1';
  const floorFill = isDay ? '#efe8dc' : isEvening ? '#2b2024' : '#161d2b';
  const furnitureFill = isDay ? '#c7b299' : isEvening ? '#574337' : '#2a3447';
  const roomLabelFill = isDay ? '#57534e' : isEvening ? '#f5d0a9' : '#94a3b8';

  // Camera forward vector from yaw: (-sin(yaw), -cos(yaw))
  const headingDeg = (-playerPose.yaw * 180) / Math.PI;
  const clampedPx = Math.max(-8.7, Math.min(8.7, playerPose.x));
  const clampedPz = Math.max(-5.9, Math.min(5.9, playerPose.z));

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const nz = (e.clientY - rect.top) / rect.height;
    const worldX = -9.3 + nx * 18.6;
    const worldZ = -6.5 + nz * 13.0;

    // Snap onto safe interior floor bounds
    const safeX = Math.max(-8.3, Math.min(8.3, worldX));
    const safeZ = Math.max(-5.6, Math.min(5.6, worldZ));
    onNavigatePoint(safeX, safeZ, safeX, safeZ - 1.4);
  };

  return (
    <section
      aria-label="2D Interactive Floorplan Map"
      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${surfaceClass} ${
        isExpanded ? 'w-[min(460px,94vw)]' : 'w-[min(286px,94vw)] sm:w-[286px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-current/10">
        <div className="flex items-center gap-1.5 min-w-0">
          <Navigation className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-display text-xs font-semibold tracking-tight truncate">
            2D Plan Navigator
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Compact 2D map' : 'Expand 2D map'}
            className="hidden sm:flex w-6 h-6 items-center justify-center rounded hover:bg-current/10 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close 2D map"
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-current/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive SVG 2D Structural Plan matching Code_Generated_Image.png */}
      <div className="p-2">
        <svg
          viewBox="-9.3 -6.5 18.6 13.0"
          onClick={handleSvgClick}
          className="w-full h-auto max-h-[44dvh] sm:max-h-none rounded-xl border border-current/10 cursor-crosshair select-none"
        >
          {/* Exterior Base */}
          <rect x="-9.3" y="-6.5" width="18.6" height="13.0" fill={floorFill} />

          {/* Room Clickable Zones */}
          {ROOM_HOTSPOTS.map((r) => (
            <g
              key={r.id}
              onClick={(e) => {
                e.stopPropagation();
                onNavigatePoint(r.cx, r.cz, r.lookX, r.lookZ);
              }}
              className="cursor-pointer"
            >
              <rect
                x={r.x - r.w / 2}
                y={r.z - r.h / 2}
                width={r.w}
                height={r.h}
                fill="transparent"
              />
            </g>
          ))}

          {/* Bathroom slate tile floor */}
          <rect x="1.6" y="2.85" width="1.8" height="3.35" fill={isDay ? '#d6d3cd' : '#1e2430'} />

          {/* Main Reading Hall Furniture Silhouettes */}
          {/* Marble Collaborative Table */}
          <rect
            x="-7.4"
            y="-0.62"
            width="5.2"
            height="1.25"
            rx="0.1"
            fill={isDay ? '#e4dfd7' : '#475569'}
          />
          {/* 3 North Study Tables */}
          {[-7.95, -6.12, -4.29].map((tx) => (
            <rect
              key={tx}
              x={tx - 0.39}
              y={-5.1}
              width="0.78"
              height="2.0"
              rx="0.06"
              fill={furnitureFill}
            />
          ))}
          {/* South Walnut Table */}
          <rect x="-5.26" y="2.78" width="1.02" height="2.25" rx="0.06" fill={furnitureFill} />
          {/* Lounges */}
          <rect x="-2.95" y="-5.55" width="1.85" height="0.8" rx="0.1" fill="#8a512b" opacity="0.7" />
          <rect x="-7.68" y="3.42" width="0.86" height="0.86" rx="0.08" fill={furnitureFill} />
          <rect x="-2.55" y="3.42" width="0.86" height="0.86" rx="0.08" fill={furnitureFill} />

          {/* Curved Reception Desk */}
          <rect x="0.0" y="-1.25" width="1.95" height="0.6" rx="0.08" fill={furnitureFill} />
          <rect x="1.66" y="-2.25" width="0.58" height="1.2" rx="0.08" fill={furnitureFill} />

          {/* Innovation Hub Conference Table */}
          <rect
            x="4.6"
            y="3.12"
            width="3.2"
            height="1.35"
            rx="0.1"
            fill={isDay ? '#e4dfd7' : '#475569'}
          />

          {/* Structural Perimeter & Partition Walls matching floorplan.ts */}
          <g stroke={wallStroke} strokeWidth="0.2" strokeLinecap="round" fill="none">
            <rect x="-9" y="-6.2" width="18" height="12.4" />
            {/* Reading Hall / Reception vertical divider with doorway */}
            <line x1="-0.6" y1="-6.2" x2="-0.6" y2="-1.0" />
            <line x1="-0.6" y1="1.0" x2="-0.6" y2="6.2" />
            {/* Upper Pantry */}
            <line x1="2.1" y1="-6.2" x2="2.1" y2="-2.9" />
            <line x1="-0.6" y1="-2.9" x2="0.85" y2="-2.9" />
            <line x1="1.8" y1="-2.9" x2="2.1" y2="-2.9" />
            {/* Corridor / Reception divider */}
            <line x1="2.1" y1="-3.3" x2="2.3" y2="-3.3" />
            <line x1="3.4" y1="-3.3" x2="9.0" y2="-3.3" />
            <line x1="4.0" y1="-6.2" x2="4.0" y2="-3.3" />
            {/* Quiet Studio & Innovation Hub West Divider */}
            <line x1="3.4" y1="-3.3" x2="3.4" y2="-0.22" />
            <line x1="3.4" y1="0.78" x2="3.4" y2="1.58" />
            <line x1="3.4" y1="2.58" x2="3.4" y2="6.2" />
            {/* Quiet / Innovation divider */}
            <line x1="3.4" y1="1.3" x2="9.0" y2="1.3" />
            {/* Lower Pantry & WC */}
            <line x1="-0.6" y1="2.85" x2="0.2" y2="2.85" />
            <line x1="1.2" y1="2.85" x2="2.0" y2="2.85" />
            <line x1="2.9" y1="2.85" x2="3.4" y2="2.85" />
            <line x1="1.6" y1="2.85" x2="1.6" y2="6.2" />
          </g>

          {/* Stairwell lines */}
          <g stroke={roomLabelFill} strokeWidth="0.06" opacity="0.55">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <line key={i} x1={4.5 + i * 0.4} y1="-5.9" x2={4.5 + i * 0.4} y2="-3.6" />
            ))}
          </g>

          {/* Room Labels */}
          <g
            fill={roomLabelFill}
            fontSize="0.58"
            fontWeight="600"
            textAnchor="middle"
            className="pointer-events-none select-none"
          >
            <text x="-4.8" y="-1.25">
              Reading Hall
            </text>
            <text x="1.3" y="0.45">
              Reception
            </text>
            <text x="0.8" y="-4.75" fontSize="0.48">
              Pantry
            </text>
            <text x="6.2" y="-1.0">
              Quiet Studio
            </text>
            <text x="6.2" y="3.95" fontSize="0.54">
              Innovation Hub
            </text>
            <text x="0.5" y="4.5" fontSize="0.44">
              Pantry
            </text>
            <text x="2.5" y="4.5" fontSize="0.44">
              W.C.
            </text>
          </g>

          {/* Clickable Bookable Chair Pins + Innovation Hub Room Pin */}
          {chairs.map((ch) => {
            const isRoom = ch.targetKind === 'room';
            const isBooked = bookedSet.has(ch.id);
            const isSel = selectedChairId === ch.id;
            const fill = isSel
              ? '#f59e0b'
              : isBooked
                ? '#c2410c'
                : isRoom
                  ? '#8b5cf6'
                  : '#10b981';
            return (
              <circle
                key={ch.id}
                cx={ch.worldPosition[0]}
                cy={ch.worldPosition[2]}
                r={isRoom ? 0.36 : isSel ? 0.25 : 0.17}
                fill={fill}
                stroke="#ffffff"
                strokeWidth={isSel ? 0.09 : 0.04}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectChair(ch);
                  onNavigatePoint(
                    ch.cameraViewPosition[0],
                    ch.cameraViewPosition[2],
                    ch.cameraLookTarget[0],
                    ch.cameraLookTarget[2]
                  );
                }}
              >
                <title>{`${ch.label} (${isBooked ? 'Reserved' : `${formatNpr(ch.rates.hourly)}/hr`})`}</title>
              </circle>
            );
          })}

          {/* 3D Receptionist Maya Marker */}
          <g transform="translate(1.42, -1.75)">
            <circle r="0.28" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.06" />
            <text
              y="0.09"
              textAnchor="middle"
              fontSize="0.3"
              fontWeight="700"
              fill="#1c1917"
            >
              M
            </text>
            <title>Maya · Receptionist Guide</title>
          </g>

          {/* Live User Position + Directional Viewing Cone */}
          <g transform={`translate(${clampedPx}, ${clampedPz}) rotate(${headingDeg})`}>
            <path d="M 0 0 L -0.75 -1.45 A 1.6 1.6 0 0 1 0.75 -1.45 Z" fill="#38bdf8" opacity="0.28" />
            <circle r="0.26" fill="#0284c7" stroke="#ffffff" strokeWidth="0.08" />
          </g>
        </svg>

        <div className={`mt-1.5 flex items-center justify-between text-[10px] ${mutedText}`}>
          <span>Tap map or any green seat dot to jump there</span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Open
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-600 inline-block" />
              Booked
            </span>
          </span>
        </div>
      </div>
    </section>
  );
};
