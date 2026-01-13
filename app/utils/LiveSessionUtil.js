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
     * Get active live sessions with pagination
     *
     * @param {Object} redis - Redis cache instance
     * @param {Object} params - Pagination params { offset, limit }
     * @returns {Promise<{data: Array, total: number}>}
     */
    async getActiveLiveSessions(redis, { offset = 0, limit = 10 } = {}) {
        try {
            const cacheKey = `yp:live_sessions:active_v3:${offset}:${limit}`;

            const result = await redis.cacheParser(
                cacheKey,
                async () => {
                    // To avoid composite indexes, we fetch ALL recent sessions and filter in Node.js
                    // This query only uses ONE field for sorting, which is automatically indexed.
                    let query = FirestoreDatabase.collection(LiveSession.collection)
                        .orderBy('startTime', 'desc')
                        .limit(200); // Fetch top 200 to ensure we find enough active ones

                    const snapshot = await query.get();

                    if (snapshot.empty) {
                        return { data: [], total: 0 };
                    }

                    // Map all fetched sessions first
                    let allSessions = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return { id: doc.id, ...data };
                    });

                    // Filter for active sessions in memory (status != 'ended')
                    let activeSessions = allSessions.filter(s => s.status !== 'ended');
                    const total = activeSessions.length;

                    // Paginate in memory
                    activeSessions = activeSessions.slice(offset, offset + limit);

                    // Extract host IDs for batch user fetch
                    const hostIds = [...new Set(activeSessions.map(s => s.hostID).filter(Boolean))];
                    const usersMap = await this._batchFetchUsers(hostIds);

                    // Enrich with user data
                    const enrichedSessions = activeSessions.map(data => {
                        const hostUser = usersMap[data.hostID] || {};

                        return {
                            id: data.id,
                            liveID: data.liveID,
                            roomID: data.roomID,
                            hostID: data.hostID,
                            hostUserName: data.hostUserName || hostUser.userName || 'Unknown',
                            hostAvatar: data.hostAvatar || hostUser.profilePictureFbPath || hostUser.profilePictureLocalPath || hostUser.profile_picture || '/store/images/avatars/default-avatar.jpg',
                            startTime: data.startTime?.toDate?.() || data.startTime,
                            endTime: data.endTime?.toDate?.() || data.endTime || null,
                            status: data.status || 'active',
                            totalAudienceCount: data.totalAudienceCount || 0,
                            coHostsCount: Array.isArray(data.coHosts) ? data.coHosts.length : 0,
                            coHosts: data.coHosts || [],
                            durationMinutes: data.startTime ? Math.floor((Date.now() - data.startTime.toDate().getTime()) / 60000) : 0
                        };
                    });

                    return { data: enrichedSessions, total };
                },
                30
            );

            return result;
        } catch (error) {
            console.error('Error getting active live sessions:', error);
            return { data: [], total: 0 };
        }
    }

    async getHistoryLiveSessions(redis, { offset = 0, limit = 10, filters = {} } = {}) {
        try {
            const filterKey = JSON.stringify(filters);
            const cacheKey = `yp:live_sessions:history_v4:${offset}:${limit}:${filterKey}`;

            const result = await redis.cacheParser(
                cacheKey,
                async () => {
                    // Approach: Fetch recent sessions ordered by startTime (Auto-indexed)
                    // Then filter status == 'ended' in memory.
                    let query = FirestoreDatabase.collection(LiveSession.collection);

                    // If date range is provided, we filter on startTime (index-free if we only use one field)
                    if (filters.daterange && filters.daterange.length) {
                        const [startDate, endDate] = filters.daterange.split(' - ');
                        if (startDate && endDate) {
                            const start = new Date(startDate);
                            const end = new Date(endDate);
                            end.setHours(23, 59, 59, 999);
                            
                            query = query.where('startTime', '>=', start)
                                         .where('startTime', '<=', end);
                        }
                    }

                    query = query.orderBy('startTime', 'desc').limit(500);

                    const snapshot = await query.get();

                    if (snapshot.empty) {
                        return { data: [], total: 0 };
                    }

                    // Map and filter in memory
                    let sessions = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return { id: doc.id, ...data };
                    }).filter(s => s.status === 'ended');

                    const total = sessions.length;

                    // Paginate
                    sessions = sessions.slice(offset, offset + limit);

                    // Extract host IDs and batch fetch
                    const hostIds = [...new Set(sessions.map(s => s.hostID).filter(Boolean))];
                    const usersMap = await this._batchFetchUsers(hostIds);

                    const enrichedSessions = sessions.map(data => {
                        const hostUser = usersMap[data.hostID] || {};
                        const startTime = data.startTime?.toDate?.() || data.startTime;
                        const endTime = data.endTime?.toDate?.() || data.endTime;
                        const durationMs = endTime && startTime ? endTime.getTime() - startTime.getTime() : 0;

                        return {
                            id: data.id,
                            liveID: data.liveID,
                            roomID: data.roomID,
                            hostID: data.hostID,
                            hostUserName: data.hostUserName || hostUser.userName || 'Unknown',
                            hostAvatar: data.hostAvatar || hostUser.profilePictureFbPath || hostUser.profilePictureLocalPath || hostUser.profile_picture || '/store/images/avatars/default-avatar.jpg',
                            startTime,
                            endTime,
                            status: data.status || 'ended',
                            totalAudienceCount: data.totalAudienceCount || 0,
                            coHostsCount: Array.isArray(data.coHosts) ? data.coHosts.length : 0,
                            coHosts: data.coHosts || [],
                            durationMinutes: Math.floor(durationMs / 60000)
                        };
                    });

                    return { data: enrichedSessions, total };
                },
                300
            );

            return result;
        } catch (error) {
            console.error('Error getting history live sessions:', error);
            return { data: [], total: 0 };
        }
    }

    /**
     * Aggregates streaming insights and metrics
     */
    async getLiveInsights(redis) {
        try {
            const cacheKey = 'yp:live_sessions:insights_v1';

            const result = await redis.cacheParser(
                cacheKey,
                async () => {
                    // Fetch recent ended sessions for aggregation
                    const query = FirestoreDatabase.collection(LiveSession.collection)
                        .orderBy('startTime', 'desc')
                        .limit(500);

                    const snapshot = await query.get();
                    if (snapshot.empty) {
                        return {
                            stats: { totalAirtime: 0, avgLength: 0, avgAttendees: 0, totalSessions: 0 },
                            topStreamer: null,
                            latestStream: null,
                            peakSession: null
                        };
                    }

                    const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    const endedSessions = allDocs.filter(s => s.status === 'ended');
                    
                    if (endedSessions.length === 0) {
                        return {
                            stats: { totalAirtime: 0, avgLength: 0, avgAttendees: 0, totalSessions: 0 },
                            topStreamer: null,
                            latestStream: allDocs[0] || null,
                            peakSession: null
                        };
                    }

                    let totalDurationMs = 0;
                    let totalAttendees = 0;
                    let peakSession = endedSessions[0];
                    const hostCounts = {};

                    endedSessions.forEach(s => {
                        const start = s.startTime?.toDate?.() || s.startTime;
                        const end = s.endTime?.toDate?.() || s.endTime;
                        if (start && end) {
                            totalDurationMs += (end.getTime() - start.getTime());
                        }
                        totalAttendees += (s.totalAudienceCount || 0);

                        if ((s.totalAudienceCount || 0) > (peakSession.totalAudienceCount || 0)) {
                            peakSession = s;
                        }

                        if (s.hostID) {
                            hostCounts[s.hostID] = (hostCounts[s.hostID] || 0) + 1;
                        }
                    });

                    // Find top streamer
                    let topHostID = null;
                    let maxStreams = 0;
                    Object.entries(hostCounts).forEach(([hostID, count]) => {
                        if (count > maxStreams) {
                            maxStreams = count;
                            topHostID = hostID;
                        }
                    });

                    // Enrich top hosts and peak sessions
                    const userIdsToFetch = [...new Set([topHostID, peakSession.hostID, allDocs[0].hostID].filter(Boolean))];
                    const usersMap = await this._batchFetchUsers(userIdsToFetch);

                    const enrich = (session) => {
                        if (!session) return null;
                        const user = usersMap[session.hostID] || {};
                        return {
                            ...session,
                            hostUserName: session.hostUserName || user.userName || 'Unknown',
                            hostAvatar: session.hostAvatar || user.profilePictureFbPath || user.profilePictureLocalPath || user.profile_picture || '/store/images/avatars/default-avatar.jpg',
                            startTime: session.startTime?.toDate?.() || session.startTime,
                            endTime: session.endTime?.toDate?.() || session.endTime
                        };
                    };

                    const topStreamerUser = usersMap[topHostID] || {};

                    return {
                        stats: {
                            totalAirtime: Math.floor(totalDurationMs / 60000), // in minutes
                            avgLength: endedSessions.length ? Math.floor((totalDurationMs / endedSessions.length) / 60000) : 0,
                            avgAttendees: endedSessions.length ? Math.floor(totalAttendees / endedSessions.length) : 0,
                            totalSessions: endedSessions.length
                        },
                        topStreamer: topHostID ? {
                            hostID: topHostID,
                            streamCount: maxStreams,
                            userName: topStreamerUser.userName || 'Unknown',
                            avatar: topStreamerUser.profilePictureFbPath || topStreamerUser.profilePictureLocalPath || topStreamerUser.profile_picture || '/store/images/avatars/default-avatar.jpg'
                        } : null,
                        latestStream: enrich(allDocs[0]),
                        peakSession: enrich(peakSession)
                    };
                },
                600 // Cache for 10 minutes
            );

            return result;
        } catch (error) {
            console.error('Error in getLiveInsights:', error);
            return null;
        }
    }


    /**
     * Batch fetch users by IDs to avoid N+1 queries
     * @private
     */
    async _batchFetchUsers(userIds) {
        if (!userIds || userIds.length === 0) return {};

        try {
            const usersMap = {};
            
            // Firestore 'in' query supports max 10 items, so batch in chunks
            const chunks = [];
            for (let i = 0; i < userIds.length; i += 10) {
                chunks.push(userIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
                const snapshot = await FirestoreDatabase.collection('users')
                    .where('uid', 'in', chunk)
                    .get();

                snapshot.docs.forEach(doc => {
                    const userData = doc.data();
                    usersMap[userData.uid] = userData;
                });
            }

            return usersMap;
        } catch (error) {
            console.error('Error batch fetching users:', error);
            return {};
        }
    }
}

export default new LiveSessionUtil();
