import { useEffect, useRef } from 'react';

export function useSSE<T = unknown>(onMessage: (data: T) => void) {
  // Use ref to keep the latest callback without restarting effect
  const callbackRef = useRef(onMessage);

  useEffect(() => {
    callbackRef.current = onMessage;
  });

  useEffect(() => {
    // Only connect if in browser
    if (typeof window === 'undefined') return;

    const eventSource = new EventSource('/api/sse/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as T;
        // Ignore internal keep-alive or connection messages if needed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((data as any).type === 'connected') return;

        if (callbackRef.current) {
          callbackRef.current(data);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);
}
