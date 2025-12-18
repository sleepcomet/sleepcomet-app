import { useEffect, useRef } from 'react';

export function useSSE(onMessage: (data: any) => void) {
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
        const data = JSON.parse(event.data);
        // Ignore internal keep-alive or connection messages if needed
        if (data.type === 'connected') return;

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
