import Util from '@utils/Util';
import config from '@config/config';
import User from '@models/User';
import Setting from '@models/Setting';
import RedisCache from '@config/redisCache';
import admin from 'firebase-admin';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en'; 
import { ucwords, fbCollectionParser } from '@config/utils';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';  
import { parseDateRange } from '@funcs/global_funcs';

class ApiSettingsUtil extends Util {
    constructor() {
        super();
    }

    async getAllAPISettings(filters={}) {
        try {
            let query = FirestoreDatabase.collection(Setting.collection);
            
            const snapshot = await query.get();

            if (snapshot.empty) {
                return [];
            }

            const settings = fbCollectionParser(snapshot);

            return settings;
        } catch (error) {
            console.error("Error fetching API settings:", error);
            throw error;
        }
    }

    async createSettingQuery(data) {
        try { 
            const settingsRef = FirestoreDatabase.collection(Setting.collection); 
                  
            if (data.isDefault) {
                const defaultSnap = await settingsRef
                .where("targetApp", "==", data.targetApp)
                .where("isDefault", "==", true)
                .limit(1)
                .get();

                if (!defaultSnap.empty) {
                    throw new Exception(
                        409,
                        "DEFAULT_SETTING_EXISTS",
                        `${LANG_EN.res.default_setting_exists}`,
                        `Default setting already exists for targetApp: ${ucwords(data.targetApp)}`
                    );
                }
            }

            const docId = data.code || settingsRef.doc().id;

            const payload = {
                ...data,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            
            await settingsRef.doc(docId).set(payload);

            return { id: docId, ...payload };
        } catch (error) {
            console.error("Error in createSettingQuery:", error);
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        }
    }
}

export default new ApiSettingsUtil();