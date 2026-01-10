import Util from '@utils/Util';
import LiveSession from '@models/LiveSession';
import { FirestoreDatabase } from '@utils/FirebaseUtil';

class LiveSessionUtil extends Util {
    constructor() {
        super();
    }

    /**
     * Get count of all live sessions
     *
     * @param {Object} redis - Redis cache instance
     * @param {Object} filters - Optional filters
     * @returns {number} Count of live sessions
     */
    async getLiveSessionsCount(redis, filters = {}) {
        try {
            const cacheKey = 'yp:live_sessions:count';

            const count = await redis.cacheParser(
                cacheKey,
                async () => {
                    // Debug: Check what fields exist in live_sessions collection
                    const sampleQuery = FirestoreDatabase.collection(LiveSession.collection).limit(1);
                    const sampleSnapshot = await sampleQuery.get();

                    if (!sampleSnapshot.empty) {
                        console.log('[DEBUG] Live_sessions collection sample document fields:',
                            Object.keys(sampleSnapshot.docs[0].data())
                        );
                        console.log('[DEBUG] Live_sessions sample data:',
                            sampleSnapshot.docs[0].data()
                        );
                    }

                    // Query all live sessions
                    const query = FirestoreDatabase.collection(LiveSession.collection);
                    const snapshot = await query.count().get();
                    return snapshot.data().count;
                },
                300 // Cache for 5 minutes
            );

            return count;
        } catch (error) {
            console.error('Error getting live sessions count:', error);
            return 0;
        }
    }

    /**
     * Get count of active live sessions only
     * (You can update this once you know what field indicates "active")
     *
     * @param {Object} redis - Redis cache instance
     * @param {Object} filters - Optional filters
     * @returns {number} Count of active live sessions
     */
    async getActiveLiveSessionsCount(redis, filters = {}) {
        try {
            const cacheKey = 'yp:live_sessions:active:count';

            const count = await redis.cacheParser(
                cacheKey,
                async () => {
                    // This assumes there's a 'status' field
                    // Update this based on your actual field names
                    const query = FirestoreDatabase.collection(LiveSession.collection)
                        .where('status', '!=', 'ended');

                    const snapshot = await query.count().get();
                    return snapshot.data().count;
                },
                300
            );

            return count;
        } catch (error) {
            console.error('Error getting active live sessions count:', error);
            return 0;
        }
    }

    /**
     * Get all live session documents
     *
     * @param {Object} redis - Redis cache instance
     * @param {Object} filters - Optional filters (orderBy, limit)
     * @returns {Array} Array of live session documents
     */
    async getAllLiveSessions(redis, filters = {}) {
        try {
            const cacheKey = 'yp:live_sessions:all';

            const liveSessions = await redis.cacheParser(
                cacheKey,
                async () => {
                    let query = FirestoreDatabase.collection(LiveSession.collection);

                    // Add orderBy if specified
                    if (filters.orderBy && filters.orderByDirection) {
                        query = query.orderBy(filters.orderBy, filters.orderByDirection);
                    }

                    // Add limit if specified
                    if (filters.limit) {
                        query = query.limit(filters.limit);
                    }

                    const snapshot = await query.get();

                    if (snapshot.empty) {
                        return [];
                    }

                    // Convert to array with timestamp parsing
                    const liveSessions = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            // Convert Firestore timestamps to Date for easier use
                            createdAt: data.createdAt?.toDate?.() || data.createdAt,
                            startTime: data.startTime?.toDate?.() || data.startTime,
                            endTime: data.endTime?.toDate?.() || data.endTime
                        };
                    });

                    return liveSessions;
                },
                300
            );

            return liveSessions;
        } catch (error) {
            console.error('Error getting live sessions:', error);
            return [];
        }
    }
}

export default new LiveSessionUtil();
