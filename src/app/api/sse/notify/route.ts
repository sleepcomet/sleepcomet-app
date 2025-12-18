import { NextResponse } from 'next/server';
import { eventEmitter } from '@/lib/sse';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Broadcast the event to all connected clients
    eventEmitter.emit('message', body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error notifying SSE:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
