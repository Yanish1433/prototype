import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

export type BookingPlan =
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly-flex'
  | 'monthly-unlimited'
  | 'monthly-dedicated';

const VALID_PLANS = new Set<BookingPlan>([
  'hourly',
  'daily',
  'weekly',
  'monthly-flex',
  'monthly-unlimited',
  'monthly-dedicated',
]);

export interface BookingRecord {
  id: string;
  referenceCode: string;
  chairId: string;
  chairLabel: string;
  roomName: string;
  targetKind?: 'chair' | 'room';
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

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

function ensureDataFile(): BookingRecord[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BOOKINGS_FILE)) {
    const initial: BookingRecord[] = [
      {
        id: 'bk-seed-q5',
        referenceCode: 'AT-8421',
        chairId: 'Q5',
        chairLabel: 'Quiet Desk Q5',
        roomName: 'Quiet Study Studio',
        targetKind: 'chair',
        plan: 'monthly-dedicated',
        startDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        durationUnits: 1,
        guestName: 'Aarav Shrestha',
        guestEmail: 'aarav.shrestha@studynepal.np',
        preferences: ['Warm Desk Lamp', 'Power & USB-C Dock'],
        totalPrice: 10000,
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
    return JSON.parse(raw) as BookingRecord[];
  } catch {
    return [];
  }
}

function saveBookings(records: BookingRecord[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/bookings', (_req, res) => {
    const bookings = ensureDataFile();
    res.json({ bookings });
  });

  app.post('/api/bookings', (req, res) => {
    const {
      chairId,
      chairLabel,
      roomName,
      targetKind,
      plan,
      startDate,
      startTime,
      durationUnits,
      guestName,
      guestEmail,
      preferences,
      totalPrice,
    } = req.body ?? {};

    if (!chairId || !plan || !startDate || !guestName || !guestEmail) {
      res.status(400).json({ error: 'Missing required booking fields.' });
      return;
    }

    const bookings = ensureDataFile();
    const existing = bookings.find((b) => b.chairId === chairId);
    if (existing) {
      res.status(409).json({
        error: `${chairLabel || chairId} is currently reserved under ${existing.referenceCode}.`,
      });
      return;
    }

    const normalizedPlan: BookingPlan = VALID_PLANS.has(plan as BookingPlan)
      ? (plan as BookingPlan)
      : 'hourly';

    const newBooking: BookingRecord = {
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      referenceCode: `AT-${Math.floor(1000 + Math.random() * 9000)}`,
      chairId: String(chairId),
      chairLabel: String(chairLabel || `Seat ${chairId}`),
      roomName: String(roomName || 'Quiet Study Studio'),
      targetKind: targetKind === 'room' ? 'room' : 'chair',
      plan: normalizedPlan,
      startDate: String(startDate),
      startTime: String(startTime || '09:00'),
      durationUnits: Math.max(1, Number(durationUnits) || 1),
      guestName: String(guestName).trim(),
      guestEmail: String(guestEmail).trim(),
      preferences: Array.isArray(preferences) ? preferences.map(String) : [],
      totalPrice: Number(totalPrice) || 0,
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    saveBookings(bookings);
    res.status(201).json({ booking: newBooking, bookings });
  });

  app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const bookings = ensureDataFile();
    const next = bookings.filter((b) => b.id !== id);
    if (next.length === bookings.length) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    saveBookings(next);
    res.json({ bookings: next });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Atelier Study 3D server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
