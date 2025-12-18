import { eventEmitter } from '@/lib/sse';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial connection message
      send({ type: 'connected' });

      // Listener for new messages
      const onMessage = (data: any) => {
        send(data);
      };

      eventEmitter.on('message', onMessage);

      req.signal.addEventListener('abort', () => {
        eventEmitter.off('message', onMessage);
        try {
          controller.close();
        } catch { }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
