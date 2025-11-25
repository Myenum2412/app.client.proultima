/**
 * Broadcast Channel API for cross-tab real-time synchronization
 * More reliable than localStorage events for instant multi-browser sync
 */

// Create a single broadcast channel for the entire app
const channel = typeof window !== 'undefined' ? new BroadcastChannel('proultima-sync') : null;

export interface BroadcastMessage {
  type: string;
  data?: any;
  timestamp: number;
}

/**
 * Broadcast a data update to all open tabs/windows
 * @param type - Type of update (e.g., 'task-created', 'maintenance-approved')
 * @param data - Optional data payload
 */
export function broadcastDataUpdate(type: string, data?: any) {
  if (!channel) return;
  
  const message: BroadcastMessage = {
    type,
    data,
    timestamp: Date.now(),
  };
  
  channel.postMessage(message);
  // console.log('📡 Broadcast sent:', type, data);
}

/**
 * Subscribe to broadcast messages from other tabs
 * @param callback - Function to call when message received
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToBroadcast(callback: (message: BroadcastMessage) => void) {
  if (!channel) return () => {};
  
  const handler = (event: MessageEvent<BroadcastMessage>) => {
    // console.log('📡 Broadcast received:', event.data.type);
    callback(event.data);
  };
  
  channel.onmessage = handler;
  
  // Return cleanup function
  return () => {
    if (channel) {
      channel.onmessage = null;
    }
  };
}

/**
 * Close the broadcast channel (call on app unmount)
 */
export function closeBroadcastChannel() {
  if (channel) {
    channel.close();
  }
}
