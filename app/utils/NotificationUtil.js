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
            .where("templateCategory", "==", data.templateCategory)
            .get();

        if (!duplicateSnap.empty) {
            throw new Exception(
                201,
                "TEMPLATE_CODE_DUPLICATE",
                LANG_EN.error.template_code_exists,
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
}

export default new NotificationUtil();