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
            const cacheKey = 'yp:videos:count';

            const count = await redis.cacheParser(
                cacheKey,
                async () => {
                    const query = FirestoreDatabase.collection(Video.collection);
                    const snapshot = await query.count().get();
                    return snapshot.data().count;
                },
                300
            );

            return count;
        } catch (error) {
            console.error('Error getting videos count:', error);
            return 0;
        }
    }
}

export default new VideosUtil();