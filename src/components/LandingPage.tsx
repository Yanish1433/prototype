import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  Lightbulb,
  Mail,
  Map as MapIcon,
  Minus,
  Moon,
  Play,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunset,
  Wifi,
  Zap,
} from 'lucide-react';
import { MotionConfig, motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react';
import {
  PASS_TIERS,
  PASS_TIER_MAP,
  formatNpr,
  type BookingPlan,
  type BookingRecord,
  type CameraPresetId,
  type LightingMode,
} from '../types/space';

/* ─────────────────────── Types & Constants ─────────────────────── */

interface LandingPageProps {
  lightingMode: LightingMode;
  bookings: BookingRecord[];
  onLightingChange: (mode: LightingMode) => void;
  onEnter3D: (preset?: CameraPresetId) => void;
  onReserveHeroDesk: () => void;
  onOpenBookings: () => void;
}

/* ── 3 Interior Rooms (Innovation Hub, Reading Room, Quiet Study Studio) ── */
const THREE_ROOMS = [
  {
    id: 'innovation-hub' as CameraPresetId,
    index: '01 / 03',
    num: '01.',
    title: 'Innovation Hub',
    tag: 'Ideation & Private Boardroom',
    tagClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    meta: '5.5m × 4.0m · 12-Seat Private Suite · Room-Only Reservation',
    description:
      'Muted slate-blue architectural walls surround a 12-seat Calacatta marble conference table, built-in walnut credenza, and illuminated glass whiteboard. Reserved strictly as a full private room.',
    highlights: [
      'Full 12-seat private suite reservation from NPR 1,200/hr',
      'Dual ambient wall sconces, backlit signage & glass whiteboard surface',
      'Clicking any conference chair opens full-suite room reservation in 3D',
    ],
    image: '/assets/scroll-frames/interior-innovation-hub.jpg',
    cta: 'Inspect Innovation Hub in 3D',
    surfaceClass:
      'bg-gradient-to-br from-blue-50/60 via-slate-50/90 to-white dark:from-blue-950/20 dark:via-slate-900/90 dark:to-slate-950 border-blue-200/60 dark:border-blue-900/40 shadow-sm hover:shadow-md transition-shadow',
    accentBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
    Icon: Lightbulb,
  },
  {
    id: 'reading-hall' as CameraPresetId,
    index: '02 / 03',
    num: '02.',
    title: 'Main Reading Room & Collaborative Library',
    tag: 'Collaborative Library & Lounge',
    tagClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    meta: '11.0m × 7.5m · Marble Collaborative Table, Study Desks & Lounge',
    description:
      'Floor-to-ceiling walnut bookshelves, chevron oak flooring, and tall sunlit windows frame a twelve-seat Calacatta marble collaborative table, three solid wood study rows, and single reading armchairs.',
    highlights: [
      '24 individual study desk seats (S1–S12, M1–M12, W1–W6)',
      'Single leather & fabric lounge armchairs bookable individually',
      'Warm brass table domes & floor lamps respond to Day / Evening / Night',
    ],
    image: '/assets/scroll-frames/interior-library.jpg',
    cta: 'Walk Reading Room in 3D',
    surfaceClass:
      'bg-gradient-to-br from-amber-50/50 via-stone-50/90 to-white dark:from-amber-950/20 dark:via-stone-900/90 dark:to-stone-950 border-amber-200/60 dark:border-amber-900/40 shadow-sm hover:shadow-md transition-shadow',
    accentBtn: 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-600/20',
    reverse: true,
    Icon: BookOpen,
  },
  {
    id: 'quiet-studio' as CameraPresetId,
    index: '03 / 03',
    num: '03.',
    title: 'Quiet Study Studio',
    tag: 'Acoustic Focus Carrel Pods',
    tagClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    meta: '6.0m × 4.2m · 6 Acoustic Carrel Desks (Q1–Q6)',
    description:
      'Soft sage acoustic walls enclose six private walnut study stations with integrated book hutches, task lamps, power outlets, and ergonomic swivel chairs designed for deep solitary concentration.',
    highlights: [
      'Six acoustic walnut carrels (Q1–Q6) with upper library shelving',
      'Independent warm brass task lighting & under-hutch LED strips',
      'Click any carrel chair in 3D to glide it backward and reserve',
    ],
    image: '/assets/scroll-frames/interior-quiet-studio.jpg',
    cta: 'Explore Quiet Studio in 3D',
    surfaceClass:
      'bg-gradient-to-br from-emerald-50/50 via-zinc-50/90 to-white dark:from-emerald-950/20 dark:via-zinc-900/90 dark:to-zinc-950 border-emerald-200/60 dark:border-emerald-900/40 shadow-sm hover:shadow-md transition-shadow',
    accentBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-600/20',
    Icon: Compass,
  },
];

const LIGHTING_MODES: {
  id: LightingMode;
  label: string;
  note: string;
  badge: string;
  activeColor: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'day',
    label: 'Daylight',
    note: 'Crisp natural daylight pouring through floor-to-ceiling glass.',
    badge: 'Natural Sunlight',
    activeColor: 'bg-amber-500 text-white shadow-amber-500/30 shadow-md',
    Icon: Sun,
  },
  {
    id: 'evening',
    label: 'Evening',
    note: 'Animated golden-hour shafts with warm ambient sconces.',
    badge: 'Golden Hour Glow',
    activeColor: 'bg-orange-600 text-white shadow-orange-600/30 shadow-md',
    Icon: Sunset,
  },
  {
    id: 'night',
    label: 'Night',
    note: 'Deep twilight paired with illuminated brass desk task lamps.',
    badge: 'Twilight & Brass Lamps',
    activeColor: 'bg-indigo-600 text-white shadow-indigo-600/30 shadow-md',
    Icon: Moon,
  },
];

/* ─────────────────────── Sub-Components ─────────────────────── */

/* ═══════════════════════════════════════════════════════════════════
   5 HORIZONTAL SHOWCASE SLIDES (Left-to-Right direct scroll showcase)
   1. Back Open View (Sanctuary Exterior & Mountain Backdrop)
   2. Reading Room & Collaborative Library
   3. Quiet Study Studio (Acoustic Focus Desks)
   4. Innovation Hub (12-Seat Conference Suite)
   5. Architectural 3D Overview Angle (Bird's-Eye Perspective)
   ═══════════════════════════════════════════════════════════════════ */

interface ShowcaseSlide {
  id: CameraPresetId;
  num: string;
  total: string;
  tag: string;
  title: string;
  heading: string;
  description: string;
  image: string;
  ctaText: string;
  badgeClass: string;
  accentBtn: string;
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: 'entrance',
    num: '01',
    total: '05',
    tag: 'Sanctuary Exterior',
    title: 'Quiet Reading Space',
    heading: 'Back Open View & Himalayan Panorama',
    description:
      'An open-air perspective of the Quiet Reading Space sanctuary with warm-lit portico framed by the snow-capped Himalayan peaks. Scroll left-to-right to enter each study room directly.',
    image: '/assets/scroll-frames/building-wide.jpg',
    ctaText: 'Enter 3D Tour',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    accentBtn: 'from-amber-400 to-emerald-400 text-stone-950 hover:from-amber-300 hover:to-emerald-300',
  },
  {
    id: 'reading-hall',
    num: '02',
    total: '05',
    tag: 'Collaborative Library',
    title: 'Quiet Reading Place & Library',
    heading: 'Walnut Bookshelves & Solid Timber Study Tables',
    description:
      'Chevron oak flooring, tall sunlit windows, and floor-to-ceiling walnut bookcases. Features a 12-seat Calacatta marble collaborative table, study rows, and reading armchairs.',
    image: '/assets/scroll-frames/interior-library.jpg',
    ctaText: 'Walk Reading Room in 3D',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    accentBtn: 'from-amber-400 to-amber-600 text-stone-950 hover:from-amber-300 hover:to-amber-500',
  },
  {
    id: 'quiet-studio',
    num: '03',
    total: '05',
    tag: 'Silent Focus Studio',
    title: 'Quiet Study Studio',
    heading: 'Acoustic Focus Carrels & Dedicated Desks',
    description:
      'Engineered for deep concentration and zero distraction. Acoustic felt dividers, individual brass task lamps, and ergonomic seating.',
    image: '/assets/scroll-frames/interior-quiet-studio.jpg',
    ctaText: 'Inspect Quiet Studio in 3D',
    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
    accentBtn: 'from-teal-400 to-emerald-400 text-stone-950 hover:from-teal-300 hover:to-emerald-300',
  },
  {
    id: 'innovation-hub',
    num: '04',
    total: '05',
    tag: 'Private Ideation Suite',
    title: 'Innovation Hub',
    heading: '12-Seat Conference Suite & Glass Whiteboard',
    description:
      'Muted slate-blue walls, full-suite conference table, built-in walnut credenza, and illuminated glass whiteboard. Reserved for executive workshops and team sprints.',
    image: '/assets/scroll-frames/interior-innovation-hub.jpg',
    ctaText: 'Inspect Innovation Hub in 3D',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
    accentBtn: 'from-blue-400 to-indigo-500 text-white hover:from-blue-300 hover:to-indigo-400',
  },
  {
    id: 'overview',
    num: '05',
    total: '05',
    tag: 'Spatial Blueprint Overview',
    title: 'Architectural 3D Overview Angle',
    heading: 'Bird’s-Eye Architectural Perspective & Live Map',
    description:
      'A complete architectural aerial view of the 204 sq.m. flat. Inspect room boundaries, active desk availability, and spatial proportions in full interactive 3D.',
    image: '/assets/scroll-frames/overview-angle.jpg',
    ctaText: 'Launch 3D Bird’s-Eye View',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    accentBtn: 'from-purple-400 to-amber-300 text-stone-950 hover:from-purple-300 hover:to-amber-200',
  },
];

const HorizontalScrollShowcase: React.FC<{
  onEnter3D: (preset?: CameraPresetId) => void;
}> = ({ onEnter3D }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  React.useEffect(() => {
    SHOWCASE_SLIDES.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  const goToSlide = (idx: number) => {
    setActiveIndex(Math.max(0, Math.min(4, idx)));
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev < 4 ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  // Keyboard left/right controls
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Native non-passive wheel listener: intercept scrolling at the top of the page
  // to advance smoothly through each room (Sanctuary -> Collaborative -> Quiet -> Private -> Overview)
  // without immediately jumping to the next section!
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let wheelAccumulator = 0;
    let wheelCooldown = false;

    const onWheel = (e: WheelEvent) => {
      // If the page has already scrolled down past the hero, allow normal page scrolling
      if (window.scrollY > 15) return;

      const idx = activeIndexRef.current;

      // Scrolling DOWN
      if (e.deltaY > 0) {
        if (idx < 4) {
          // Prevent the browser from instantly jumping down past the hero
          e.preventDefault();
          wheelAccumulator += e.deltaY;

          if (!wheelCooldown && Math.abs(wheelAccumulator) >= 20) {
            wheelCooldown = true;
            wheelAccumulator = 0;
            setActiveIndex((prev) => Math.min(4, prev + 1));
            setTimeout(() => {
              wheelCooldown = false;
            }, 320);
          }
        }
        // When on Slide 5 (3D Overview), do NOT preventDefault:
        // continuing to scroll down naturally scrolls to the next section!
      }
      // Scrolling UP
      else if (e.deltaY < 0) {
        if (idx > 0 && window.scrollY <= 10) {
          e.preventDefault();
          wheelAccumulator += e.deltaY;

          if (!wheelCooldown && Math.abs(wheelAccumulator) >= 20) {
            wheelCooldown = true;
            wheelAccumulator = 0;
            setActiveIndex((prev) => Math.max(0, prev - 1));
            setTimeout(() => {
              wheelCooldown = false;
            }, 320);
          }
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current !== null ? touchStartY.current - e.changedTouches[0].clientY : 0;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <section
      ref={sectionRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[88vh] sm:h-screen overflow-hidden bg-black select-none"
    >
      {/* Horizontal Track - Fast 0.28s spring animation */}
      <motion.div
        className="flex h-full w-[500vw] will-change-transform"
        animate={{ x: `-${activeIndex * 100}vw` }}
        transition={{
          type: 'spring',
          stiffness: 460,
          damping: 38,
          mass: 0.55,
        }}
      >
        {SHOWCASE_SLIDES.map((slide) => (
          <div
            key={slide.num}
            className="relative w-screen h-full shrink-0 overflow-hidden"
          >
            {/* Full crystal-clear image */}
            <img
              src={slide.image}
              alt={slide.heading}
              className="w-full h-full object-cover select-none"
              loading="eager"
            />

            {/* Architectural deep contrast gradients */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/95 via-black/35 to-black/30" />
            <div className="absolute inset-y-0 left-0 w-2/5 pointer-events-none bg-gradient-to-r from-black/85 to-transparent" />

            {/* Slide Content Overlay */}
            <div className="absolute bottom-24 sm:bottom-28 left-6 sm:left-14 lg:left-20 max-w-2xl z-20 pointer-events-auto">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md mb-3 shadow-md ${slide.badgeClass}`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono-tabular tracking-wider">{slide.num} / {slide.total}</span>
                <span>·</span>
                <span>{slide.tag}</span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-2xl">
                {slide.title}
              </h1>

              <p className="mt-2 text-base sm:text-xl font-semibold text-amber-200/90 drop-shadow">
                {slide.heading}
              </p>

              <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-stone-200/90 leading-relaxed max-w-xl drop-shadow line-clamp-3">
                {slide.description}
              </p>

              {/* Direct Action Button to 3D */}
              <div className="mt-5 flex items-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => onEnter3D(slide.id)}
                  className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r ${slide.accentBtn} text-sm font-bold transition-all shadow-xl hover:scale-[1.03] active:scale-[0.98] cursor-pointer`}
                >
                  <Play className="w-4 h-4 shrink-0 fill-current" />
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => onEnter3D('overview')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-black/50 hover:bg-black/75 text-white text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer"
                >
                  <MapIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>3D Overview</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Floating Bottom Navigator & Segmented Bar */}
      <div className="absolute bottom-6 left-6 sm:left-14 right-6 sm:right-14 z-30 flex items-center justify-between gap-4 pointer-events-auto">
        {/* 5 Segmented Slide Jump Pills */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 max-w-2xl bg-black/70 p-1.5 rounded-2xl border border-white/15 backdrop-blur-md overflow-x-auto no-scrollbar">
          {SHOWCASE_SLIDES.map((s, i) => (
            <button
              key={s.num}
              type="button"
              onClick={() => goToSlide(i)}
              className={`flex-1 min-w-[70px] sm:min-w-0 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center truncate ${
                activeIndex === i
                  ? 'bg-amber-400 text-stone-950 shadow-md scale-[1.02]'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="font-mono-tabular mr-1">{s.num}.</span>
              <span>{s.tag.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Left / Right Chevron Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={prevSlide}
            disabled={activeIndex === 0}
            aria-label="Previous slide"
            className="w-10 h-10 rounded-xl border border-white/20 bg-black/60 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            disabled={activeIndex === 4}
            aria-label="Next slide"
            className="w-10 h-10 rounded-xl border border-white/20 bg-black/60 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Slide Navigation Cue */}
      <div className="absolute top-20 right-6 sm:right-14 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/15 text-white/80 text-xs backdrop-blur-md shadow-md">
        <span>Click tabs or use &lt; &gt; arrows</span>
        <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
      </div>
    </section>
  );
};

/* ═══ 4-STEP LUXURY HOW IT WORKS SECTION (Choose · Select · Schedule · Relax) ═══ */
const HOW_IT_WORKS_STEPS = [
  {
    num: 'I',
    title: 'Choose',
    tagline: 'Choose Sanctuary',
    desc: 'Pick the study hall that fits your day, from acoustic focus carrels to collaborative library tables.',
    icon: Compass,
  },
  {
    num: '2',
    title: 'Select',
    tagline: 'Select Exact Desk',
    desc: 'Browse all 42 desks in real-time 3D, inspect natural sunlight angles, and choose your favorite chair.',
    icon: Building2,
  },
  {
    num: '3',
    title: 'Schedule',
    tagline: 'Schedule Your Pass',
    desc: 'Pick your time slot or monthly pass, reserve securely in NPR, and receive instant booking confirmation.',
    icon: Clock,
  },
  {
    num: '4',
    title: 'Relax',
    tagline: 'Focus & Relax',
    desc: 'Walk into your ready sanctuary seat with high-speed WiFi, USB-C dock, espresso, and Himalayan views.',
    icon: Sparkles,
  },
];

const HowItWorksSection: React.FC<{
  onEnter3D: (preset?: CameraPresetId) => void;
}> = ({ onEnter3D }) => {
  return (
    <section className="relative z-10 bg-[#090d12] border-t border-b border-amber-500/20 py-20 px-4 sm:px-8 overflow-hidden text-stone-100">
      {/* Background warm architectural glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1240px] mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-3">
            <span>Simple 4-Step Process</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-wide text-amber-50 drop-shadow">
            How Quiet Reading Space Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-400 leading-relaxed font-light">
            From exploring the 3D sanctuary from home to settling into your private desk in Kathmandu.
          </p>
        </div>

        {/* 4 Cards Grid with Horizontal Line Connector */}
        <div className="relative">
          {/* Subtle horizontal connecting line on desktop */}
          <div className="hidden lg:block absolute top-[58px] left-[12%] right-[12%] h-[1px] bg-gradient-to-r from-transparent via-amber-500/35 to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {HOW_IT_WORKS_STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.num}
                  className="group relative flex flex-col items-center text-center p-7 rounded-3xl bg-gradient-to-b from-[#121720] to-[#0c1017] border border-amber-500/20 hover:border-amber-400/50 transition-all duration-300 shadow-xl hover:-translate-y-1"
                >
                  {/* Top 3D-styled Gold Icon Badge */}
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/25 to-yellow-500/10 border border-amber-400/40 flex items-center justify-center mb-6 shadow-lg shadow-amber-950/40 group-hover:scale-105 transition-transform">
                    <StepIcon className="w-8 h-8 text-amber-300" />
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide text-white group-hover:text-amber-200 transition-colors">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-3 text-xs sm:text-sm text-stone-400 leading-relaxed font-light min-h-[56px]">
                    {step.desc}
                  </p>

                  {/* Number Circle at Bottom */}
                  <div className="mt-8 w-9 h-9 rounded-full border border-amber-400/50 flex items-center justify-center text-amber-300 text-xs font-serif font-bold group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
                    {step.num}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Bar */}
        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={() => onEnter3D('entrance')}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-xl shadow-amber-950/40 hover:scale-[1.02] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch 3D Sanctuary & Select Your Desk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

/* ── Room Card for Section 2 ── */
const ScrollRoomCard: React.FC<{
  item: typeof THREE_ROOMS[0];
  onEnter3D: (preset: CameraPresetId) => void;
}> = ({ item, onEnter3D }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ['start end', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [14, -14]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.97, 1, 0.98]);
  const ItemIcon = item.Icon;

  return (
    <article
      ref={rowRef}
      className={`rounded-3xl border p-6 sm:p-9 lg:p-11 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${item.surfaceClass}`}
    >
      <div className={`lg:col-span-7 ${item.reverse ? 'lg:order-2' : 'lg:order-1'}`}>
        <motion.div
          style={{ y: imageY, scale: imageScale }}
          className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#1e2328] shadow-lg hover:shadow-xl transition-shadow"
        >
          <img
            src={item.image}
            alt={`${item.title} architectural render`}
            className="w-full h-auto block object-cover aspect-[4/3]"
            loading="eager"
          />
        </motion.div>
      </div>
      <div className={`lg:col-span-5 space-y-5 ${item.reverse ? 'lg:order-1' : 'lg:order-2'}`}>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.tagClass}`}>
              {item.tag}
            </span>
            <span className="font-mono-tabular text-xs font-bold text-stone-500 dark:text-slate-400">
              {item.num}
            </span>
          </div>
          <h3 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            {item.title}
          </h3>
          <p className="mt-1 text-xs font-medium text-stone-600 dark:text-slate-400">
            {item.meta}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-slate-300">
            {item.description}
          </p>
        </div>

        <ul className="space-y-2.5 border-t border-black/10 dark:border-white/10 pt-4 text-xs sm:text-sm text-stone-700 dark:text-slate-300">
          {item.highlights.map((h) => (
            <li key={h} className="leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{h}</span>
            </li>
          ))}
        </ul>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onEnter3D(item.id)}
            className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap shadow-md hover:scale-[1.02] ${item.accentBtn}`}
          >
            <span>{item.cta}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </article>
  );
};

/* ─────────────────────── Main Landing Page ─────────────────────── */

export const LandingPage: React.FC<LandingPageProps> = ({
  lightingMode,
  bookings,
  onLightingChange,
  onEnter3D,
  onReserveHeroDesk,
  onOpenBookings,
}) => {
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<'all' | CameraPresetId>('all');
  const [calcPlan, setCalcPlan] = useState<BookingPlan>('monthly-unlimited');
  const [calcUnits, setCalcUnits] = useState<number>(1);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const floorplanRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: planProgress } = useScroll({ target: floorplanRef, offset: ['start end', 'end start'] });
  const planY = useTransform(planProgress, [0, 1], [16, -16]);

  const bookedSeatCount = bookings.filter((b) => b.chairId !== 'INNOVATION-HUB-ROOM').length;
  const openDeskCount = Math.max(0, 42 - bookedSeatCount);
  const activeCalcTier = PASS_TIER_MAP[calcPlan];
  const activeCalcTotal = activeCalcTier.defaultPriceNpr * calcUnits;

  const visibleRooms = selectedRoomFilter === 'all' ? THREE_ROOMS : THREE_ROOMS.filter((r) => r.id === selectedRoomFilter);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitted(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setNewsletterSubmitted(false);
    }, 4500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className="min-h-screen bg-[#faf8f4] dark:bg-[#0c1015] text-[#1c2329] dark:text-[#eef1ef] transition-colors duration-300">

        {/* Sticky Top Bar with vibrant brand styling */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <a href="#top" className="font-display text-lg sm:text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-stone-950 font-black text-xs">
                  Q
                </span>
                <span>Quiet Reading Space</span>
              </a>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                3D Live
              </span>
            </div>

            <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7 text-sm font-medium text-white/75">
              <a href="#spaces" className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">Spaces</a>
              <a href="#floorplan" className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">Floorplan</a>
              <a href="#passes" className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">Passes</a>
              <a href="#tour" className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">Walkthrough</a>
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              {bookings.length > 0 && (
                <button type="button" onClick={onOpenBookings} className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/20 bg-white/5 text-amber-200 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap">
                  Bookings ({bookings.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => onEnter3D('entrance')}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-stone-950 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-lg shadow-emerald-950/20 hover:scale-[1.02]"
              >
                Enter 3D Tour
              </button>
            </div>
          </div>
        </header>

        {/* ═══ 5-SLIDE HORIZONTAL SHOWCASE (Instant, Snappy Left-to-Right Slider) ═══ */}
        <HorizontalScrollShowcase onEnter3D={onEnter3D} />

        {/* ═══ 4-STEP LUXURY HOW IT WORKS SECTION (Choose · Select · Schedule · Relax) ═══ */}
        <HowItWorksSection onEnter3D={onEnter3D} />

        {/* ═══ SECTION: Metrics Strip with Vibrant Color Cards ═══ */}
        <section className="relative z-10 -mt-1 bg-gradient-to-b from-[#faf8f4] to-[#f4f0e6] dark:from-[#0c1015] dark:to-[#121820]">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Metric 1 */}
              <div className="p-5 sm:p-6 rounded-2xl border border-blue-200/70 dark:border-blue-900/40 bg-white/80 dark:bg-slate-900/70 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Sanctuary Scale</span>
                  <Building2 className="w-4 h-4" />
                </div>
                <p className="font-mono-tabular text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-50">
                  204 sq.m.
                </p>
                <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
                  Walkable 17.0m × 12.0m flat in Kathmandu
                </p>
              </div>

              {/* Metric 2 */}
              <div className="p-5 sm:p-6 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white/80 dark:bg-emerald-950/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Live Availability</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="font-mono-tabular text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                  {openDeskCount} Open
                </p>
                <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
                  Bookable chairs across 3 sanctuaries
                </p>
              </div>

              {/* Metric 3 */}
              <div className="p-5 sm:p-6 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-white/80 dark:bg-amber-950/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Atmosphere</span>
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="font-mono-tabular text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-50">
                  3 Light Modes
                </p>
                <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
                  Daylight, Golden hour & Night lamps
                </p>
              </div>

              {/* Metric 4 */}
              <div className="p-5 sm:p-6 rounded-2xl border border-purple-200/70 dark:border-purple-900/40 bg-white/80 dark:bg-purple-950/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Pass Pricing</span>
                  <Zap className="w-4 h-4" />
                </div>
                <p className="font-mono-tabular text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-50">
                  NPR 100<span className="text-sm font-normal text-stone-500">/hr</span>
                </p>
                <p className="mt-1 text-xs text-stone-600 dark:text-slate-400">
                  Hourly walk-ins to Monthly pods
                </p>
              </div>
            </div>

            {/* Quick Interactive Bar */}
            <div className="mt-7 p-6 rounded-2xl border border-amber-300/60 dark:border-amber-900/40 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 backdrop-blur-sm flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Full Spatial Sanctuary Exploration
                </p>
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-50 mt-0.5">
                  Click any chair inside the 3D model to reserve your exact desk.
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onEnter3D('entrance')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Enter 3D Flat</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => onEnter3D('overview')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-800 dark:text-stone-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <MapIcon className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>Bird's-Eye View</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION: Architectural Room Gallery (3 Rooms Only) ═══ */}
        <section id="spaces" className="border-t border-stone-200 dark:border-slate-800/80 bg-[#f7f4ec] dark:bg-[#0e1319] py-16 sm:py-24">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold mb-2">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Curated Spatial Gallery</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 text-balance">
                  Quiet Reading Place: The 3 sanctuaries rendered in full, ready to walk inside.
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-stone-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-x-auto no-scrollbar shrink-0 shadow-sm" role="group" aria-label="Filter room showcase">
                {([
                  { id: 'all', label: 'All 3 Rooms' },
                  { id: 'innovation-hub', label: 'Innovation Hub' },
                  { id: 'reading-hall', label: 'Reading Room' },
                  { id: 'quiet-studio', label: 'Quiet Studio' },
                ] as const).map((tab) => {
                  const active = selectedRoomFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedRoomFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                        active
                          ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-white shadow-sm'
                          : 'text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-12 space-y-10">
              {visibleRooms.map((item) => (
                <ScrollRoomCard key={item.id} item={item} onEnter3D={onEnter3D} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION: Floorplan & Lighting Mode ═══ */}
        <section id="floorplan" ref={floorplanRef} className="border-t border-stone-200 dark:border-slate-800/80 py-16 sm:py-24 bg-[#faf8f4] dark:bg-[#0c1015]">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <motion.div style={{ y: planY }} className="rounded-3xl overflow-hidden border border-stone-300/80 dark:border-slate-800 bg-[#23282e] shadow-xl">
                <img
                  src="/assets/aistudio/Code_Generated_Image_9743945c.png"
                  alt="Complete First Floor 2D architectural plan"
                  className="w-full h-auto block object-contain"
                  loading="lazy"
                />
              </motion.div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 dark:text-slate-400">
                <span className="font-semibold text-stone-800 dark:text-stone-200">First Floor: Reading & Study Flat (Scale 1:100 · 17.0m × 12.0m)</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live 2D Mini-Map synced inside 3D walkthrough
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Atmosphere Choreography</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 text-balance">
                  Every wall, desk, and lamp aligned to the structural blueprint.
                </h2>
                <p className="mt-3 text-sm text-stone-600 dark:text-slate-300 leading-relaxed">
                  Use WASD, arrow keys, or mobile controls to enter from the portico, explore the 3 rooms, or jump instantly via the interactive 2D Mini-Map.
                </p>
              </div>

              {/* Lighting Mode Selector */}
              <div className="p-6 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-100">
                    Select 3D Lighting Atmosphere
                  </p>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    {LIGHTING_MODES.find((m) => m.id === lightingMode)?.badge}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Choose starting 3D lighting mode">
                  {LIGHTING_MODES.map(({ id, label, activeColor, Icon }) => {
                    const active = lightingMode === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onLightingChange(id)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? activeColor
                            : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3.5 text-xs text-stone-600 dark:text-slate-400 bg-stone-50 dark:bg-slate-800/50 p-3 rounded-xl border border-stone-200/50 dark:border-slate-700/50">
                  {LIGHTING_MODES.find((m) => m.id === lightingMode)?.note}
                </p>

                <button
                  type="button"
                  onClick={() => onEnter3D('entrance')}
                  className="mt-4 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 hover:from-black hover:to-stone-950 text-white dark:from-white dark:to-stone-200 dark:text-stone-950 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shadow-md hover:scale-[1.01]"
                >
                  Launch 3D Flat ({lightingMode.charAt(0).toUpperCase() + lightingMode.slice(1)} Mode)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION: Passes & Rates Estimator ═══ */}
        <section id="passes" className="border-t border-stone-200 dark:border-slate-800/80 bg-gradient-to-b from-[#f2efe6] to-[#faf8f4] dark:from-[#0e1319] dark:to-[#0c1015] py-16 sm:py-24">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2">
                  <Award className="w-3.5 h-3.5" />
                  <span>Fair Nepali Rupee (NPR) Tiers</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 text-balance">
                  Estimate your study pass & reserve your seat directly in 3D.
                </h2>
              </div>

              {/* Calculator Box */}
              <div className="p-5 rounded-3xl border border-emerald-300/80 dark:border-emerald-800/60 bg-white dark:bg-slate-900 shadow-md flex flex-wrap items-center justify-between gap-5">
                <div>
                  <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                    {activeCalcTier.name} · {calcUnits} {calcUnits === 1 ? activeCalcTier.unitLabel : activeCalcTier.unitPlural}
                  </p>
                  <p className="font-mono-tabular text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                    {formatNpr(activeCalcTotal)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease duration"
                    onClick={() => setCalcUnits((u) => Math.max(1, u - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono-tabular text-base font-bold w-7 text-center">
                    {calcUnits}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase duration"
                    onClick={() => setCalcUnits((u) => Math.min(12, u + 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onReserveHeroDesk}
                    className="ml-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-sm hover:scale-[1.02]"
                  >
                    Book in 3D
                  </button>
                </div>
              </div>
            </div>

            {/* Pass Cards Grid */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PASS_TIERS.map((tier) => {
                const isSelected = calcPlan === tier.id;
                const isPopular = tier.id === 'monthly-unlimited';
                return (
                  <div
                    key={tier.id}
                    onClick={() => setCalcPlan(tier.id)}
                    className={`relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-emerald-500 dark:border-emerald-400 shadow-xl shadow-emerald-500/10 scale-[1.01]'
                        : 'bg-white/80 dark:bg-slate-900/60 border-stone-200 dark:border-slate-800 hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-50">
                          {tier.name}
                        </h3>
                        {isSelected && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                          </span>
                        )}
                      </div>
                      <p className="mt-2 font-mono-tabular text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-50">
                        {formatNpr(tier.defaultPriceNpr)}
                        <span className="text-xs font-sans font-normal text-stone-500 dark:text-slate-400">
                          {' '}
                          / {tier.unitLabel}
                        </span>
                      </p>

                      <div className="mt-4 pt-4 border-t border-stone-200 dark:border-slate-800 space-y-2 text-sm">
                        <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                          {tier.accessAndSeatType}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                          Best for: {tier.bestFor}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReserveHeroDesk();
                      }}
                      className="mt-6 w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap"
                    >
                      Pick Desk in 3D
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Innovation Hub Suite Callout */}
            <div className="mt-8 p-7 rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Private Conference Suite Policy · Innovation Hub
                </span>
                <h3 className="mt-1 font-display text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50">
                  Innovation Hub (12-Seat Suite) — From NPR 1,200 / hr or NPR 6,000 / day
                </h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-slate-300 max-w-2xl">
                  Individual conference chairs cannot be booked separately; clicking any chair inside the Innovation Hub reserves the entire private suite.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEnter3D('innovation-hub')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer whitespace-nowrap shrink-0 hover:scale-[1.02]"
              >
                Book Innovation Hub in 3D
              </button>
            </div>
          </div>
        </section>

        {/* ═══ SECTION: Walkthrough Launch Banner ═══ */}
        <section id="tour" className="border-t border-stone-200 dark:border-slate-800/80 py-16 sm:py-24 bg-[#faf8f4] dark:bg-[#0c1015]">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
            <div className="relative overflow-hidden p-8 sm:p-14 rounded-3xl border border-white/20 bg-gradient-to-br from-[#0c2e24] via-[#091a16] to-[#0a121d] text-white shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              {/* Decorative radial blur glow */}
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Real-Time 3D Spatial Sanctuary</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">
                  Step inside the sanctuary and reserve your exact desk before you arrive.
                </h2>
                <p className="mt-3 text-sm sm:text-base text-stone-300 leading-relaxed">
                  Smooth navigation across desktop and mobile with interactive 2D Mini-Map, Day / Evening / Night lighting choreography, and immediate seat bookings.
                </p>
              </div>

              <div className="relative z-10 flex flex-wrap items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => onEnter3D('entrance')}
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-stone-950 font-extrabold text-sm transition-all shadow-xl shadow-emerald-950/40 cursor-pointer whitespace-nowrap hover:scale-[1.03]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Enter 3D Walkthrough</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onOpenBookings}
                  className="px-6 py-4 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors cursor-pointer whitespace-nowrap backdrop-blur-md"
                >
                  View Bookings ({bookings.length})
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
           AMAZING ARCHITECTURAL FOOTER
           ═══════════════════════════════════════════════════════════════════ */}
        <footer className="border-t border-stone-800 bg-[#090d12] text-stone-300">
          {/* Top Footer Banner */}
          <div className="border-b border-white/10 py-8">
            <div className="max-w-[1240px] mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center text-stone-950 font-black text-sm">
                  Q
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-white tracking-tight">
                    Quiet Reading Space
                  </h3>
                  <p className="text-xs text-stone-400">
                    204 sq.m. Architectural Sanctuary · Kathmandu, Nepal
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>42 Desks Active · Real-Time 3D Engine</span>
                </div>
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/10 text-xs font-semibold text-stone-300 transition-colors cursor-pointer"
                >
                  <span>Back to Top</span>
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Main 4-Column Grid */}
          <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Col 1: Sanctuary Concept & Amenities */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                The Sanctuary
              </h4>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                A purpose-built study sanctuary engineered for deep solitary concentration and executive ideation overlooking the Kathmandu valley.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-stone-300 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Fiber Wi-Fi</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Acoustic Walls</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>24/7 Pass Access</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>Specialty Coffee</span>
                </span>
              </div>
            </div>

            {/* Col 2: The 3 Rooms */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                The 3 Rooms
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => onEnter3D('innovation-hub')}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-left flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Innovation Hub (12-Seat Suite)</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onEnter3D('reading-hall')}
                    className="hover:text-amber-400 transition-colors cursor-pointer text-left flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Reading Room & Collaborative Library</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onEnter3D('quiet-studio')}
                    className="hover:text-emerald-400 transition-colors cursor-pointer text-left flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Quiet Study Studio (Q1–Q6)</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onEnter3D('overview')}
                    className="hover:text-stone-100 transition-colors cursor-pointer text-left flex items-center gap-2 text-stone-400 pt-1"
                  >
                    <MapIcon className="w-3.5 h-3.5 text-stone-400" />
                    <span>3D Architectural Bird's-Eye</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Passes & Pricing */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Desk & Room Passes
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-400">
                <li className="flex items-center justify-between">
                  <span>Hourly Walk-In</span>
                  <span className="font-mono-tabular font-bold text-white">NPR 100</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Day Pass Explorer</span>
                  <span className="font-mono-tabular font-bold text-white">NPR 500</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Weekly Sprint Pass</span>
                  <span className="font-mono-tabular font-bold text-white">NPR 2,200</span>
                </li>
                <li className="flex items-center justify-between text-amber-300 font-semibold">
                  <span>Monthly Unlimited</span>
                  <span className="font-mono-tabular font-bold text-white">NPR 6,500</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Dedicated Private Pod</span>
                  <span className="font-mono-tabular font-bold text-white">NPR 10,000</span>
                </li>
                <li className="flex items-center justify-between pt-1 border-t border-white/10 text-blue-300">
                  <span>Innovation Hub Suite</span>
                  <span className="font-mono-tabular font-bold text-white">NPR 1,200/hr</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Newsletter & Direct Action */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Stay In The Flow
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Receive notices on open dedicated study pods and executive weekend workshops.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex items-center rounded-xl border border-white/15 bg-white/5 overflow-hidden focus-within:border-emerald-400 transition-colors">
                  <Mail className="w-4 h-4 ml-3 text-stone-400 shrink-0" />
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="your.email@domain.com"
                    className="w-full py-2.5 px-3 text-xs bg-transparent text-white placeholder-stone-500 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to updates"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                {newsletterSubmitted && (
                  <p className="text-xs text-emerald-400 font-medium">
                    ✓ Welcome to Quiet Reading Space updates!
                  </p>
                )}
              </form>

              <button
                type="button"
                onClick={() => onEnter3D('entrance')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-stone-950 text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap hover:scale-[1.01]"
              >
                Launch 3D Room Walkthrough
              </button>
            </div>
          </div>

          {/* Bottom Legal & Credit Strip */}
          <div className="border-t border-white/10 py-6">
            <div className="max-w-[1240px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
              <p>
                © 2026 Quiet Reading Space. All rights reserved. First Floor, Kathmandu Valley.
              </p>
              <div className="flex flex-wrap items-center gap-5">
                <a href="#spaces" className="hover:text-stone-300 transition-colors">
                  Spaces
                </a>
                <a href="#floorplan" className="hover:text-stone-300 transition-colors">
                  Blueprint
                </a>
                <a href="#passes" className="hover:text-stone-300 transition-colors">
                  Passes
                </a>
                <span className="text-stone-700">|</span>
                <span className="text-stone-400">
                  Powered by WebGL 3D Spatial Technology
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
};
