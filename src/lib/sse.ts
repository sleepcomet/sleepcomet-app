import { EventEmitter } from 'events';

// Use a global variable to maintain the EventEmitter instance across hot reloads in development
// Note: In a serverless environment (like Vercel), this pattern won't work for scaling. 
// You would need Redis or a service like Pusher/Ably.
const globalForEvents = global as unknown as { eventEmitter: EventEmitter };

export const eventEmitter = globalForEvents.eventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.eventEmitter = eventEmitter;
}

// Increase limit to avoid warnings with many clients
eventEmitter.setMaxListeners(100);
