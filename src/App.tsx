/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { SpaceViewport } from './components/SpaceViewport';
import { ControlDock } from './components/ControlDock';
import { BookingOverlay } from './components/BookingOverlay';
import { BookingsDrawer } from './components/BookingsDrawer';
import { MiniMap2D } from './components/MiniMap2D';
import { ReceptionistGuideModal } from './components/ReceptionistGuideModal';
import { LandingPage } from './components/LandingPage';
import type {
  BookableTargetKind,
  BookingPlan,
  BookingRecord,
  CameraPresetId,
  LightingMode,
  MapNavigateRequest,
  MovementInputState,
  PlayerPose,
  StudyChairMetadata,
} from './types/space';

const LOCAL_STORAGE_KEY = 'atelier_study_bookings_v1';

export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | '3d'>('landing');
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');
  const [activePreset, setActivePreset] = useState<CameraPresetId>('entrance');
  const [presetTrigger, setPresetTrigger] = useState<number>(0);
  const [currentRoom, setCurrentRoom] = useState<string>('Main Entrance · Corridor');
  const [selectedChair, setSelectedChair] = useState<StudyChairMetadata | null>(null);
  const [chairCatalog, setChairCatalog] = useState<Record<string, StudyChairMetadata>>({});
  const [focusChairRequest, setFocusChairRequest] = useState<{
    chairId: string;
    seq: number;
  } | null>(null);
  const [mapNavigateRequest, setMapNavigateRequest] =
    useState<MapNavigateRequest | null>(null);
  const [playerPose, setPlayerPose] = useState<PlayerPose>({
    x: 2.85,
    y: 1.62,
    z: -4.25,
    yaw: 0.25,
  });
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [bookingsDrawerOpen, setBookingsDrawerOpen] = useState<boolean>(false);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);
  const [mapOpen, setMapOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [mapExpanded, setMapExpanded] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const pendingFocusChairIdRef = useRef<string | null>(null);

  const movementInputRef = useRef<MovementInputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false,
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', lightingMode !== 'day');
  }, [lightingMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setMapOpen((prev) => !prev);
      } else if (e.key === 'g' || e.key === 'G') {
        setGuideOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSelectedChair(null);
        setBookingsDrawerOpen(false);
        setGuideOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/bookings')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('API unavailable'))))
      .then((data) => {
        if (active && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.bookings));
        }
      })
      .catch(() => {
        if (!active) return;
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) setBookings(JSON.parse(cached));
        } catch {
          // ignore
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const showNotice = useCallback((msg: string) => {
    setNoticeMsg(msg);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => {
      setNoticeMsg(null);
    }, 4200);
  }, []);

  const handleEnter3D = useCallback((preset: CameraPresetId = 'entrance') => {
    setActivePreset(preset);
    setPresetTrigger((n) => n + 1);
    setViewMode('3d');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handleReserveHeroDesk = useCallback(() => {
    const bookedIds = new Set(bookings.map((b) => b.chairId));
    const openQuietId =
      ['Q2', 'Q1', 'Q3', 'Q4', 'Q6', 'Q5'].find((id) => !bookedIds.has(id)) ?? 'Q2';
    setActivePreset('quiet-studio');
    setPresetTrigger((n) => n + 1);
    pendingFocusChairIdRef.current = openQuietId;
    setViewMode('3d');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [bookings]);

  const handleReturnHome = useCallback(() => {
    setSelectedChair(null);
    setGuideOpen(false);
    setViewMode('landing');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handleSelectPreset = useCallback((preset: CameraPresetId) => {
    setActivePreset(preset);
    setPresetTrigger((n) => n + 1);
  }, []);

  const handleUserCameraOverride = useCallback(() => {
    // Allow free movement without keeping preset locked
  }, []);

  const handleCatalogReady = useCallback((catalog: Record<string, StudyChairMetadata>) => {
    setChairCatalog(catalog);
    const pendingId = pendingFocusChairIdRef.current;
    if (pendingId && catalog[pendingId]) {
      pendingFocusChairIdRef.current = null;
      setSelectedChair(catalog[pendingId]);
      setFocusChairRequest((prev) => ({
        chairId: pendingId,
        seq: (prev?.seq ?? 0) + 1,
      }));
    }
  }, []);

  const handleSelectChair = useCallback((chair: StudyChairMetadata) => {
    setSelectedChair(chair);
  }, []);

  const handleNavigatePoint = useCallback(
    (x: number, z: number, lookX?: number, lookZ?: number) => {
      setMapNavigateRequest((prev) => ({
        x,
        z,
        lookX,
        lookZ,
        seq: (prev?.seq ?? 0) + 1,
      }));
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setMapOpen(false);
      }
    },
    []
  );

  const handleSubmitBooking = useCallback(
    async (payload: {
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
    }) => {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not complete reservation.');
      }
      if (Array.isArray(data.bookings)) {
        setBookings(data.bookings);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.bookings));
      }
    },
    []
  );

  const handleCancelBooking = useCallback(async (bookingId: string) => {
    const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.bookings)) {
      setBookings(data.bookings);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.bookings));
    }
  }, []);

  const handleFocusChair = useCallback(
    (chairId: string) => {
      const meta = chairCatalog[chairId];
      setBookingsDrawerOpen(false);
      setViewMode('3d');
      if (meta) {
        setSelectedChair(meta);
        setFocusChairRequest((prev) => ({
          chairId,
          seq: (prev?.seq ?? 0) + 1,
        }));
      } else {
        pendingFocusChairIdRef.current = chairId;
      }
    },
    [chairCatalog]
  );

  const activeChairBooking = selectedChair
    ? bookings.find((b) => b.chairId === selectedChair.id)
    : undefined;

  const isDay = lightingMode === 'day';

  return (
    <div className="relative min-h-screen bg-black">
      {/* 3D Viewport - Pre-warmed on page load so entering 3D renders with ZERO delay */}
      <main
        className={`fixed inset-0 overflow-hidden select-none transition-opacity duration-300 ${
          viewMode === '3d'
            ? 'z-20 opacity-100 pointer-events-auto'
            : 'z-0 opacity-0 pointer-events-none invisible'
        } ${
          isDay ? 'bg-[#e7e2d8]' : lightingMode === 'evening' ? 'bg-[#2c343f]' : 'bg-[#0c131d]'
        }`}
      >
        <SpaceViewport
          isActive={viewMode === '3d'}
          lightingMode={lightingMode}
          activePreset={activePreset}
          presetTrigger={presetTrigger}
          selectedChairId={selectedChair?.id ?? null}
          focusChairRequest={focusChairRequest}
          mapNavigateRequest={mapNavigateRequest}
          isGuideOpen={guideOpen}
          bookings={bookings}
          movementInputRef={movementInputRef}
          onSelectChair={handleSelectChair}
          onOpenGuide={() => setGuideOpen(true)}
          onNoticeMessage={showNotice}
          onCatalogReady={handleCatalogReady}
          onRoomChange={setCurrentRoom}
          onPoseChange={setPlayerPose}
          onUserCameraOverride={handleUserCameraOverride}
        />

        {viewMode === '3d' && (
          <>
            <ControlDock
              lightingMode={lightingMode}
              activePreset={activePreset}
              currentRoom={currentRoom}
              bookingCount={bookings.length}
              isCollapsed={dockCollapsed}
              isMapOpen={mapOpen}
              isGuideOpen={guideOpen}
              hiddenOnMobile={Boolean(selectedChair || mapOpen || guideOpen || bookingsDrawerOpen)}
              movementInputRef={movementInputRef}
              onLightingChange={setLightingMode}
              onSelectPreset={handleSelectPreset}
              onOpenBookings={() => setBookingsDrawerOpen(true)}
              onToggleMap={() => setMapOpen((v) => !v)}
              onToggleGuide={() => setGuideOpen((v) => !v)}
              onToggleCollapse={() => setDockCollapsed((v) => !v)}
              onReturnHome={handleReturnHome}
            />

            {/* Interactive 2D Floorplan Map (Corner HUD on Desktop, Overlay on Phones) */}
            {mapOpen && (
              <div className="fixed inset-x-2 top-14 sm:inset-auto sm:top-20 sm:left-4 z-25 flex justify-center sm:block pointer-events-auto">
                <MiniMap2D
                  lightingMode={lightingMode}
                  playerPose={playerPose}
                  chairCatalog={chairCatalog}
                  bookings={bookings}
                  selectedChairId={selectedChair?.id ?? null}
                  isExpanded={mapExpanded}
                  onToggleExpand={() => setMapExpanded((v) => !v)}
                  onCloseMobile={() => setMapOpen(false)}
                  onNavigatePoint={handleNavigatePoint}
                  onSelectChair={(ch) => {
                    setSelectedChair(ch);
                  }}
                />
              </div>
            )}

            {noticeMsg && (
              <div
                role="status"
                className={`fixed top-14 sm:top-18 left-1/2 -translate-x-1/2 z-30 max-w-[92vw] sm:max-w-md px-4 py-2.5 rounded-xl border shadow-lg text-xs font-medium text-center transition-opacity ${
                  isDay
                    ? 'bg-[#faf8f4]/95 border-stone-300 text-stone-900'
                    : 'bg-stone-900/95 border-amber-500/35 text-amber-50'
                }`}
              >
                {noticeMsg}
              </div>
            )}

            {selectedChair && (
              <BookingOverlay
                chair={selectedChair}
                existingBooking={activeChairBooking}
                lightingMode={lightingMode}
                onClose={() => setSelectedChair(null)}
                onSubmitBooking={handleSubmitBooking}
                onCancelBooking={handleCancelBooking}
              />
            )}

            {guideOpen && (
              <ReceptionistGuideModal
                lightingMode={lightingMode}
                chairCatalog={chairCatalog}
                bookings={bookings}
                onClose={() => setGuideOpen(false)}
                onWalkToSpot={handleNavigatePoint}
                onPickChairToBook={(ch) => handleFocusChair(ch.id)}
              />
            )}
          </>
        )}
      </main>

      {/* Landing Page (Visible when viewMode === 'landing') */}
      {viewMode === 'landing' && (
        <div className="relative z-10">
          <LandingPage
            lightingMode={lightingMode}
            bookings={bookings}
            onLightingChange={setLightingMode}
            onEnter3D={handleEnter3D}
            onReserveHeroDesk={handleReserveHeroDesk}
            onOpenBookings={() => setBookingsDrawerOpen(true)}
          />
        </div>
      )}

      {/* Bookings Drawer */}
      {bookingsDrawerOpen && (
        <BookingsDrawer
          bookings={bookings}
          lightingMode={lightingMode}
          onClose={() => setBookingsDrawerOpen(false)}
          onFocusChair={handleFocusChair}
          onCancelBooking={handleCancelBooking}
        />
      )}
    </div>
  );
}

