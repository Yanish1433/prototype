export interface BookingRecord {
  id: string;
  referenceCode: string;
  chairId: string;
  chairLabel: string;
  roomName: string;
  targetKind?: 'chair' | 'room';
  plan: string;
  startDate: string;
  startTime: string;
  durationUnits: number;
  guestName: string;
  guestEmail: string;
  preferences: string[];
  totalPrice: number;
  createdAt: string;
}

let memoryBookings: BookingRecord[] = [
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

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({ bookings: memoryBookings });
    return;
  }

  if (req.method === 'POST') {
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

    const existing = memoryBookings.find((b) => b.chairId === chairId);
    if (existing) {
      res.status(409).json({
        error: `${chairLabel || chairId} is currently reserved under ${existing.referenceCode}.`,
      });
      return;
    }

    const newBooking: BookingRecord = {
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      referenceCode: `AT-${Math.floor(1000 + Math.random() * 9000)}`,
      chairId: String(chairId),
      chairLabel: String(chairLabel || `Seat ${chairId}`),
      roomName: String(roomName || 'Quiet Study Studio'),
      targetKind: targetKind === 'room' ? 'room' : 'chair',
      plan: String(plan || 'hourly'),
      startDate: String(startDate),
      startTime: String(startTime || '09:00'),
      durationUnits: Math.max(1, Number(durationUnits) || 1),
      guestName: String(guestName).trim(),
      guestEmail: String(guestEmail).trim(),
      preferences: Array.isArray(preferences) ? preferences.map(String) : [],
      totalPrice: Number(totalPrice) || 0,
      createdAt: new Date().toISOString(),
    };

    memoryBookings.push(newBooking);
    res.status(201).json({ booking: newBooking, bookings: memoryBookings });
    return;
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id;
    if (!id) {
      res.status(400).json({ error: 'Missing booking ID.' });
      return;
    }
    const next = memoryBookings.filter((b) => b.id !== id);
    if (next.length === memoryBookings.length) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    memoryBookings = next;
    res.status(200).json({ bookings: next });
    return;
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
