import Dexie from 'dexie';

const db = new Dexie('TravelMateDB');

db.version(1).stores({
  trips: 'id, name, startDate',
  expenses: 'id, tripId, date',
  locations: 'id, tripId, name',
  itinerary: 'id, tripId, date',
  documents: 'id, tripId',
  offlineMaps: 'id, name',
  syncQueue: '++id, action, timestamp'
});

export default db;

// Sync helper
export const addToSyncQueue = async (action, data) => {
  await db.syncQueue.add({
    action,
    data,
    timestamp: new Date()
  });
};

export const processSyncQueue = async () => {
  const queue = await db.syncQueue.toArray();
  // Process queue items when online
  for (const item of queue) {
    try {
      // Send to API
      // ... implement sync logic
      await db.syncQueue.delete(item.id);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
};
