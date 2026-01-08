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

    async getPaginatedVideos({ limit = 20, cursorPagination = null, filters = {}, excludeIds = [] }) {
        try {
            limit = Math.min(Math.max(limit, 1), 100);
            
            // CRITICAL: Dynamic batch sizing based on filter type
            const hasTextFilter = filters.uploader?.trim();
            const hasFlaggedFilter = filters.flagged !== undefined;
            const batchSize = (hasTextFilter || hasFlaggedFilter) ? 100 : limit;
            
            const excludeSet = new Set(excludeIds);
            const videos = [];
            let lastMatchingDoc = null;
            let totalFetched = 0;
            let duplicatesSkipped = 0;
            let iterations = 0;
            const MAX_ITERATIONS = (hasTextFilter || hasFlaggedFilter) ? 5 : 1;
            
            // STRATEGY: Keep fetching batches until we have enough matches or reach end
            while (videos.length < limit && iterations < MAX_ITERATIONS) {
                iterations++;
                
                let query = FirestoreDatabase.collection(Video.collection);

                // Apply indexed filters
                query = query.where('broken', '==', false);

                if (filters.daterange?.length) {
                    let daterange = parseDateRange(filters.daterange, true);   
                    if (daterange.start && daterange.end) { 
                        query = query.where("timestamp", ">=", daterange.start);
                        query = query.where("timestamp", "<=", daterange.end);
                    }
                }

                query = query.orderBy('timestamp', 'desc').limit(batchSize);

                // Apply cursor for pagination continuity
                if (cursorPagination) {
                    try {
                        const cursor = JSON.parse(cursorPagination);
                        if (cursor.timestamp) {
                            const timestampValue = cursor.timestamp._seconds ? 
                                new admin.firestore.Timestamp(
                                    cursor.timestamp._seconds, 
                                    cursor.timestamp._nanoseconds
                                ) : cursor.timestamp;
                            query = query.startAfter(timestampValue);
                        }
                    } catch (error) {
                        console.log('Invalid cursor:', error.message);
                    }
                }

                const snapshot = await query.get();
                totalFetched += snapshot.docs.length;

                // No more documents available
                if (snapshot.docs.length === 0) {
                    break;
                }

                // Process batch and apply post-query filters
                let batchHasMatches = false;
                
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    const videoId = doc.id;

                    // Skip already displayed videos
                    if (excludeSet.has(videoId)) {
                        duplicatesSkipped++;
                        continue;
                    }

                    // Apply text filter (case-insensitive)
                    if (hasTextFilter) {
                        const searchTerm = filters.uploader.toLowerCase();
                        const userName = (data.userName || '').toLowerCase();
                        const fullName = (data.fullName || '').toLowerCase();
                        
                        if (!userName.includes(searchTerm) && !fullName.includes(searchTerm)) {
                            continue;
                        }
                    }

                    // Apply flagged filter (post-query)
                    if (hasFlaggedFilter) {
                        const isFlagged = data.flagged === true;
                        const wantsFlagged = filters.flagged === 'true';
                        if (isFlagged !== wantsFlagged) {
                            continue;
                        }
                    }

                    // Video matches all filters
                    batchHasMatches = true;
                    excludeSet.add(videoId);
                    
                    const uploaderName = data.userName || data.fullName || 'Unknown';
                    videos.push({
                        id: videoId,
                        ...data,
                        uploaderName,
                        url: data.videoUrl || data.url,
                        flagged: data.flagged || false,
                        broken: data.broken || false
                    });

                    lastMatchingDoc = doc;

                    // Stop if we have enough matches
                    if (videos.length >= limit) {
                        break;
                    }
                }

                // Update cursor for next iteration
                if (snapshot.docs.length > 0) {
                    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
                    cursorPagination = JSON.stringify({
                        timestamp: lastDoc.data().timestamp
                    });
                }

                // Break if we fetched less than batch size (reached end)
                if (snapshot.docs.length < batchSize) {
                    break;
                }

                // Break if no matches in this batch and we have some results
                if (!batchHasMatches && videos.length > 0) {
                    break;
                }
            }

            // Determine pagination state
            let nextCursorPagination = null;
            let hasMore = false;
            let isEndOfResults = false;

            if (videos.length === limit && lastMatchingDoc) {
                // Got full page - likely more available
                nextCursorPagination = JSON.stringify({
                    timestamp: lastMatchingDoc.data().timestamp
                });
                hasMore = true;
            } else if (videos.length < limit && iterations >= MAX_ITERATIONS) {
                // Hit iteration limit - might have more
                if (lastMatchingDoc) {
                    nextCursorPagination = JSON.stringify({
                        timestamp: lastMatchingDoc.data().timestamp
                    });
                    hasMore = true;
                } else {
                    isEndOfResults = true;
                }
            } else {
                // Reached end of collection
                isEndOfResults = true;
            }

            const filterDescription = this.getFilterDescription(filters);

            return {
                videos,
                nextCursorPagination,
                hasMore,
                isEndOfResults,
                filterDescription,
                totalFetched,
                totalVisible: videos.length,
                duplicatesSkipped,
                iterations
            };

        } catch (error) {
            console.error('Error in getPaginatedVideos:', error);
            throw error;
        }
    }

    getFilterDescription(filters) {
        const descriptions = [];
        
        if (filters.uploader?.trim()) {
            descriptions.push(`uploader "${filters.uploader}"`);
        }
        
        if (filters.flagged === 'true') {
            descriptions.push('flagged videos');
        } else if (filters.flagged === 'false') {
            descriptions.push('unflagged videos');
        }
        
        if (filters.daterange?.length) {
            descriptions.push('selected date range');
        }
        
        return descriptions.length > 0 ? descriptions.join(' and ') : 'all videos';
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