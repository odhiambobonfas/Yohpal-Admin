import Util from '@utils/Util';
import qs from 'qs';
import config from '@config/config';
import User from '@models/User';
import Video from '@models/Video';
import RedisCache from '@config/redisCache';
import admin from 'firebase-admin';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en'; 
import { ucwords, fbCollectionParser, normalizeFilters } from '@config/utils';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';  
import { parseDateRange } from '@funcs/global_funcs';
import Role from '@models/Role';
import Permission from '@models/Permissions';
import PaymentComponent from '@models/PaymentComponent';
import EmployeeDesignation from '@models/EmployeeDesignation';
import Department from '@models/Department';

class VideosUtil extends Util {
    constructor() {
        super();
    }
    
    async getAllVideosCount(redis, filters={}) {
        try {
            const filtersKey = 'yp:videos:filters';
            const cacheKey = 'yp:videos:filtered';

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;
            
            // If filters changed, have to invalidate the cache
            if (savedFilters !== currentFilters) {
                await redis.deleteFunc(filtersKey);
                await redis.deleteFunc(cacheKey);
                await redis.cacheParser(filtersKey, async () => filters, 2000);
            }
             
            let query = FirestoreDatabase.collection(Video.collection);

            if (filters?.daterange?.length) {
                let daterange = parseDateRange(filters.daterange, true);   
                if (daterange.start && daterange.end) { 
                    query = query.where("timestamp", ">=", daterange.start);
                    query = query.where("timestamp", "<=", daterange.end);
                }
            }

            const count = await redis.cacheParser(
                cacheKey,
                async () => { 
                    const snapshot = await query.count().get();
    
                    return snapshot.data().count;
                },
                5
            );
    
            return count;
        } catch (error) {
            console.error('Error getting videos count:', error);
            return 0;
        }
    }

    async getPaginatedVideos({ limit = 20, cursorPagination = null, filters = {} }) {
        try {
            // Defensive limits
            limit = Math.min(Math.max(limit, 1), 100);

            let query = FirestoreDatabase.collection(Video.collection);

            // Filter out broken videos - MUST REMAIN
            query = query.where('broken', '!=', true);

            // Apply filters before ordering
            if (filters.flagged !== undefined) {
                query = query.where('flagged', '==', filters.flagged === 'true');
            }

            // Date range filter
            if (filters.daterange?.length) {
                let daterange = parseDateRange(filters.daterange, true);   
                if (daterange.start && daterange.end) { 
                    query = query.where("timestamp", ">=", daterange.start);
                    query = query.where("timestamp", "<=", daterange.end);
                }
            }

            // Order by broken first (required for != filter), then timestamp
            query = query.orderBy('broken').orderBy('timestamp', 'desc').limit(limit);

            // Cursor logic using broken + timestamp
            if (cursorPagination) {
                try {
                    const cursor = JSON.parse(cursorPagination);
                    if (cursor.broken !== undefined && cursor.timestamp) {
                        query = query.startAfter(cursor.broken, cursor.timestamp);
                    }
                } catch (error) {
                    console.log('Invalid cursor format, ignoring:', error.message);
                }
            }

            const snapshot = await query.get();

            const videos = [];
            for (const doc of snapshot.docs) {
                const data = doc.data();

                // Use userName/fullName directly from video document
                const uploaderName = data.userName || data.fullName || 'Unknown';

                videos.push({
                    id: doc.id,
                    ...data,
                    uploaderName
                });
            }

            // Create next cursor from last document
            let nextCursorPagination = null;
            if (snapshot.docs.length === limit && videos.length > 0) {
                const lastDoc = snapshot.docs[snapshot.docs.length - 1];
                const lastData = lastDoc.data();
                nextCursorPagination = JSON.stringify({
                    broken: lastData.broken || false,
                    timestamp: lastData.timestamp
                });
            }

            return {
                videos,
                nextCursorPagination,
                hasMore: snapshot.docs.length === limit
            };
        } catch (error) {
            console.error('Error in getPaginatedVideos:', error);
            throw error;
        }
    }

    async updateVideoFlag(videoId, flagged, reason = null) {
        const updateData = {
            flagged,
            flaggedAt: flagged ? admin.firestore.FieldValue.serverTimestamp() : null,
            flagReason: reason,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await FirestoreDatabase.collection(Video.collection).doc(videoId).update(updateData);
        
        try {
            // Invalidate cursorPagination cache patterns
            const cursorKeys = await RedisCache.keys('videos:cursorPagination:*');
            if (cursorKeys.length) await RedisCache.del(...cursorKeys);
        } catch (error) {
            console.log('Cache invalidation failed:', error.message);
        }
        
        return updateData;
    }
}

export default new VideosUtil();