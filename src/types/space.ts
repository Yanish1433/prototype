export type LightingMode = 'day' | 'evening' | 'night';

export type BookingPlan =
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly-flex'
  | 'monthly-unlimited'
  | 'monthly-dedicated';

export interface PassTierMeta {
  id: BookingPlan;
  name: string;
  shortLabel: string;
  unitLabel: string;
  unitPlural: string;
  defaultPriceNpr: number;
  accessAndSeatType: string;
  bestFor: string;
}

export const PASS_TIERS: PassTierMeta[] = [
  {
    id: 'hourly',
    name: 'Hourly Walk-in',
    shortLabel: 'Hourly',
    unitLabel: 'hr',
    unitPlural: 'hours',
    defaultPriceNpr: 100,
    accessAndSeatType: 'Any open hot desk; pay-as-you-go.',
    bestFor: 'Quick 1–2 hour study breaks between classes or urgent calls.',
  },
  {
    id: 'daily',
    name: 'Daily Pass',
    shortLabel: 'Daily',
    unitLabel: 'day',
    unitPlural: 'days',
    defaultPriceNpr: 500,
    accessAndSeatType: 'Unlimited access for 1 full day (open to close); hot desk.',
    bestFor: 'Freelancers working remotely for a day or intensive exam prep.',
  },
  {
    id: 'weekly',
    name: 'Weekly Pass',
    shortLabel: 'Weekly',
    unitLabel: 'week',
    unitPlural: 'weeks',
    defaultPriceNpr: 2200,
    accessAndSeatType: 'Unlimited access for 7 consecutive days; hot desk.',
    bestFor: 'Short-term project deadlines, visitors, or trial users.',
  },
  {
    id: 'monthly-flex',
    name: 'Monthly Flex (Part-Time)',
    shortLabel: 'Monthly Flex',
    unitLabel: 'month',
    unitPlural: 'months',
    defaultPriceNpr: 3800,
    accessAndSeatType: 'Up to 3 hours/day (or 60 hrs/month); non-dedicated hot desk.',
    bestFor: 'Students or workers who only need a quiet spot for 2–3 hours daily.',
  },
  {
    id: 'monthly-unlimited',
    name: 'Monthly Unlimited',
    shortLabel: 'Unlimited',
    unitLabel: 'month',
    unitPlural: 'months',
    defaultPriceNpr: 6500,
    accessAndSeatType: 'Unlimited access during operating hours; non-dedicated hot desk.',
    bestFor: 'Regular remote workers, thesis writers, and full-time studiers.',
  },
  {
    id: 'monthly-dedicated',
    name: 'Monthly Dedicated Pod',
    shortLabel: 'Dedicated Pod',
    unitLabel: 'month',
    unitPlural: 'months',
    defaultPriceNpr: 10000,
    accessAndSeatType: '24/7 or priority access with a permanently reserved personal desk & locker.',
    bestFor: 'Night-shift remote workers (US/EU hours) or users leaving monitors/books behind.',
  },
];

export const PASS_TIER_MAP: Record<BookingPlan, PassTierMeta> = PASS_TIERS.reduce(
  (acc, tier) => {
    acc[tier.id] = tier;
    return acc;
  },
  {} as Record<BookingPlan, PassTierMeta>
);

export function formatNpr(amount: number): string {
  return `NPR ${Math.round(amount).toLocaleString('en-US')}`;
}

export type CameraPresetId =
  | 'entrance'
  | 'reception'
  | 'quiet-studio'
  | 'reading-hall'
  | 'innovation-hub'
  | 'overview';

export type BookableTargetKind = 'chair' | 'room';

export interface BookingRecord {
  id: string;
  referenceCode: string;
  chairId: string;
  chairLabel: string;
  roomName: string;
  targetKind?: BookableTargetKind;
  plan: BookingPlan;
  startDate: string;
  startTime: string;
  durationUnits: number;
  guestName: string;
  guestEmail: string;
  preferences: string[];
  totalPrice: number;
  createdAt: string;
}

export interface StudyChairMetadata {
  id: string;
  label: string;
  roomName: string;
  positionLabel: string;
  targetKind: BookableTargetKind;
  rates: Record<BookingPlan, number>;
  features: string[];
  worldPosition: [number, number, number];
  cameraViewPosition: [number, number, number];
  cameraLookTarget: [number, number, number];
  previewImage: string;
}

export interface HoveredTargetState {
  id: string;
  title: string;
  subtitle: string;
  screenX: number;
  screenY: number;
  kind: 'chair' | 'room' | 'sofa' | 'innovation-chair' | 'receptionist';
}

export interface MovementInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  turnLeft: boolean;
  turnRight: boolean;
}

export interface PlayerPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface MapNavigateRequest {
  x: number;
  z: number;
  lookX?: number;
  lookZ?: number;
  seq: number;
}

