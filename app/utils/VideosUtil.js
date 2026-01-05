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
                7200
            );
    
            return count;
        } catch (error) {
            console.error('Error getting videos count:', error);
            return 0;
        }
    }

    async getAllVideos() {
        const snapshot = await FirestoreDatabase.collection(Video.collection).get();
        const videos = [];

        for (const doc of snapshot.docs) {
            const data = doc.data();
            let uploaderName = 'Unknown';
            
            if (data.uploadedByRef) {
                try {
                    const userDoc = await data.uploadedByRef.get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        uploaderName = userData.userName || `${userData.firstName} ${userData.lastName}`;
                    }
                } catch (error) {
                    console.log('Error fetching uploader:', error.message);
                }
            }

            videos.push({
                id: doc.id,
                ...data,
                uploaderName
            });
        }
        
        return videos;
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
            const keys = await RedisCache.keys('videos:list:*');
            if (keys.length) await RedisCache.del(...keys);
        } catch (error) {
            console.log('Cache invalidation failed:', error.message);
        }
        
        return updateData;
    }
}

export default new VideosUtil();