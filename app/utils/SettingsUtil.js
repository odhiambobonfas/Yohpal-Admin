import Util from '@utils/Util';
import config from '@config/config';
import User from '@models/User';
import Setting from '@models/Setting';
import RedisCache from '@config/redisCache';
import admin from 'firebase-admin';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en'; 
import { ucwords, fbCollectionParser, reduceToObj, convertToCamelCaseKeys, jsonStringifier, jsonParser } from '@config/utils';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';  
import { parseDateRange } from '@funcs/global_funcs'; 

class SettingsUtil extends Util {
    constructor() {
        super();
    }

    async getAllAPISettings(filters={}) {
        try { 
            console.log("Filters: ", filters);
            filters.docId = filters.targetApp || 'yohpal';
            let query = FirestoreDatabase.collection(Setting.collection).doc(filters.docId)
                .collection('apisetting');
            
            const snapshot = await query.get();

            if (snapshot.empty) {
                return [];
            } 

            const settings = fbCollectionParser(snapshot);

            return settings;
        } catch (error) {
            console.error("Error fetching API settings:", error);
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        }
    }

    async getSettingByDocType(filters) {
        const query = await FirestoreDatabase
            .collection(Setting.collection)
            .doc(filters.docId)
            .collection(filters.documentType);
        
        const snapshot = await query.get();

        if (snapshot.empty) {
            return [];
        } 
        
        const settings = fbCollectionParser(snapshot);

        return settings;
    }

    async getAllSettings(filters = {}) {
        try { 
            filters.docId = filters.targetApp || 'yohpal'; 
            const docs = Setting.documentSettingTypes || []; 
            
            const promises = docs.map(async (type) => {
                filters.documentType = type;
                try {
                    const setting = await this.getSettingByDocType(filters);
                    if (!setting) return null; 
                    return { [type]: setting };
                } catch (error) {
                    return null;
                }
            });
            
            const results = await Promise.all(promises); 

            return reduceToObj(results); 
        } catch (error) {
            console.error("Error fetching API settings:", error);
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        }
    }

    async createSettingQuery(data) {
        try { 
            const colId = data.type;
            const targetApp = data.targetApp || 'yohpal';
            
            let input;
            let payload = {};

            if (['apisetting'].includes(data.type)) {  
                let settingsRef = FirestoreDatabase.collection(Setting.collection).doc(targetApp)
                    .collection(colId); 
                
                if (data.code) {
                    
                    const codeSnap = await settingsRef
                        .where("code", "==", data.code)
                        .limit(1)
                        .get();

                    if (!codeSnap.empty) {
                        throw new Exception(
                            409,
                            "SETTING_CODE_EXISTS",
                            `Setting with code '${data.code}' already exists`,
                            `Duplicate code for type: ${colId}`
                        );
                    }
                }

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

                data['addeByRefUser'] = data.addedByRefUserId 
                    ?   FirestoreDatabase.collection(User.collection).doc(data.addedByRefUserId) 
                    :   null;

                input = data;
                
                payload = {
                    ...input,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                
                await settingsRef.add(payload);
            }

            if (['generalsettings'].includes(data.type)) { 
                const obj = data.generalSetting || '';
                const settingsArray = Object.entries(obj).map(([key, value]) => ({
                    key,
                    ...value,
                })); 

                const allInsertPromises = await Promise.all(
                    settingsArray.map(async (setting) => { 
                        setting = convertToCamelCaseKeys(setting);
                        const input = {
                            ...setting,
                            createdBy: data.userLoggedInUserName,
                            createdByRefUser: data.userLoggedInUid
                                ? FirestoreDatabase.collection(User.collection).doc(data.userLoggedInUid)
                                : null,
                            updatedBy: data.userLoggedInUserName,
                            updatedByRefUser: data.userLoggedInUid
                                ? FirestoreDatabase.collection(User.collection).doc(data.userLoggedInUid)
                                : null
                        };

                        return await this.multiInsertSetingsDocs(targetApp, colId, setting.key, input);
                    })
                );
                
                allInsertPromises.forEach(res => {
                    Object.assign(payload, res);
                });
            } 

            return { id: colId, ...payload };
        } catch (error) {
            console.error("Error in createSettingQuery:", error);
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        }
    }

    async multiInsertSetingsDocs(topLevelDocName, colId, categoryName, input) {
        const payload = {
            ...input,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        let settingsRef = FirestoreDatabase.collection(Setting.collection) // settings
            .doc(topLevelDocName) //yohpal
            .collection(colId) //generalsettings
            .doc(categoryName) // categoryName - companyInformation 
                
        const setData = await settingsRef.set(payload);

        if (setData) await settingsRef.update({ key: settingsRef.id });

        return { ...payload };
    }
}

export default new SettingsUtil();