import Util from '@utils/Util';
import config from '@config/config'; 
import Email from '@models/Email';
import RedisCache from '@config/redisCache';
import admin from 'firebase-admin';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en'; 
import { payloadExtras, ucwords, fbCollectionParser, reduceToObj, convertToCamelCaseKeys, normalizeFilters, jsonStringifier, jsonParser } from '@config/utils';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';  
import { parseDateRange } from '@funcs/global_funcs';  
import NotificationTemplate from '@models/NotificationTemplate';
import jwt from 'jsonwebtoken';
import Binding from '@config/bindings';

class NotificationUtil extends Util {
    constructor() {
        super();
    }
    
    async createTemplateQuery(data, redis) {
        const db = FirestoreDatabase.collection(NotificationTemplate.collection);
        
        const nameSnap = await db.where("templateName", "==", data.templateName).get();
        if (!nameSnap.empty) {
            throw new Exception(
                201,
                "TEMPLATE_NAME_DUPLICATE",
                LANG_EN.error.template_name_exists,
                "Duplicate Error"
            );
        }
        
        const codeSnap = await db.where("templateCode", "==", data.templateCode).get();
        if (!codeSnap.empty) {
            throw new Exception(
                201,
                "TEMPLATE_CODE_DUPLICATE",
                LANG_EN.error.template_code_exists,
                "Duplicate Error"
            );
        }

        const duplicateSnap = await db.where("templateCode", "==", data.templateCode)
            .where("templateChannel", "==", data.templateChannel)
            .where("templateCategory", "==", data.templateCategory)
            .get();

        if (!duplicateSnap.empty) {
            throw new Exception(
                201,
                "TEMPLATE_DUPLICATE",
                LANG_EN.error.template_already_exists,
                "Duplicate Error"
            );
        }

        const extras = payloadExtras({
            userLoggedInUid: data.userLoggedInUid,
            userLoggedInUserName: data.userLoggedInUserName
        });

        const payload = {
            templateName: data.templateName,
            templateCode: data.templateCode,
            templateChannel: data.templateChannel,
            templateCategory: data.templateCategory || "",
            templateStatus: data.templateStatus || "active",
            templateDescription: data.templateDescription || "",
            ...extras
        };

        const result = await db.add(payload);

        if (redis) {
            await redis.deleteFunc("yp:motificationTemplates");
        }

        return result;
    } 

    async getAllNotificationTemplates(redis, filters={}) {
        const filtersKey = 'yp:notificationTemplates:filters';
        const cacheKey = 'yp:notificationTemplates:filtered'; 

        const cachedFilters = await redis.getFunc(filtersKey);
        const currentFilters = normalizeFilters(filters) || {};
        const savedFilters = cachedFilters ? normalizeFilters(cachedFilters) : null;  
        
        if (savedFilters !== currentFilters) {
            await redis.deleteFunc(filtersKey);
            await redis.deleteFunc(cacheKey);

            await redis.cacheParser(filtersKey, async () => filters, 2000);
        }

        let query = FirestoreDatabase.collection(NotificationTemplate.collection); 
        if (filters?.status?.length > 0) {
            query = query.where("templateStatus", "==", filters.status);
        } 

        if (filters?.tempCategory?.length > 0) {
            query = query.where("templateCategory", "==", filters.tempCategory);
        }

        if (filters?.channel?.length > 0) {
            query = query.where("templateChannel", "==", filters.channel);
        }

        if (filters?.createdRange?.length > 0) {
            const { start, end } = parseDateRange(filters.createdRange, true);  
            query = query.where("createdAt", ">=", start);
            query = query.where("createdAt", "<=", end);
        }

        if (filters?.templateName?.length > 0) {
            query = query.where("templateName", ">=", filters.templateName)
                         .where("templateName", "<=", filters.templateName + '\uf8ff');
        } 
        
        let data = await redis.cacheParser(
            cacheKey,
            async () => { 
                let collection = await query.get(); 
                let data = fbCollectionParser(collection);

                return data;
            },
            3600
        );
        
        return data;
    }
}

export default new NotificationUtil();