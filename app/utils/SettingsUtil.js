import Util from '@utils/Util';
import config from '@config/config';
import User from '@models/User';
import Setting from '@models/Setting';
import RedisCache from '@config/redisCache';
import admin from 'firebase-admin';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en'; 
import { payloadExtras, ucwords, fbCollectionParser, reduceToObj, convertToCamelCaseKeys, normalizeFilters, jsonStringifier, jsonParser } from '@config/utils';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';  
import { parseDateRange } from '@funcs/global_funcs'; 

class SettingsUtil extends Util {
    constructor() {
        super();
    }

    async getAllAPISettings(redis, filters={}) { 
        try { 
            const filtersKey = 'yp:appApiSettings:filters';
            const cacheKey = 'yp:appApiSettings:filtered';
            filters.docId = filters.targetApp || 'yohpal';
            let ref = FirestoreDatabase.collection(Setting.collection).doc(filters.docId)
                .collection('apisetting');

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;
            
            if (savedFilters !== currentFilters) {
                await redis.deleteFunc(filtersKey);
                await redis.deleteFunc(cacheKey);
                await redis.cacheParser(filtersKey, async () => filters, 2000);
            }   

            let data = await redis.cacheParser(
                cacheKey,
                async () => { 
                    let collection = await ref.get();
                    let data = fbCollectionParser(collection);
                    
                    return data;
                },
                300
            );

            return data;
        } catch (error) {
            return [];
        }
    }

    async createCdnSettingQuery(data, redis) {
        try { 
            const {
                code,
                targetApp,
                cdnProvider,
                cdnUrl,
                cdnZoneId,
                cacheDuration,
                cdnStatus,
                cdnModule,
                userLoggedInUid,
                userLoggedInUserName
            } = data;

            const extras = payloadExtras({ 
                userLoggedInUid: userLoggedInUid,
                userLoggedInUserName: userLoggedInUserName
            });
            
            const cdnPayload = {
                code: code.trim(),
                targetApp: targetApp.trim(),
                provider: cdnProvider.trim(),
                baseUrl: cdnUrl.trim(),
                zoneId: cdnZoneId.trim(),
                cacheDuration: parseInt(cacheDuration) || 0,
                status: cdnStatus.toLowerCase(),
                module: cdnModule?.trim() || "General", 
                ...extras
            };
            
            const query = FirestoreDatabase.collection(Setting.collection)
                .doc(targetApp)
                .collection("cdnSettings");

            const existingEntry = await query.where("code", "==", code).get();
            if (!existingEntry.empty) {
                throw new Exception(
                    409,
                    "SETTING_CODE_EXISTS",
                    LANG_EN.error.setting_with_given_code_exists,
                    `Duplicate code for target: ${targetApp} and of type: ${cdnModule}`
                );
            }

            const cdnDoc = await query.add(cdnPayload);
            
            if (redis) {
                const cacheKey = `yp:cdnSetting:${cdnDoc.id}`;
                await redis.setFunc(cacheKey, {
                    id: cdnDoc.id,
                    ...cdnPayload
                });
            }
            
            if (redis) {
                await redis.deleteFunc('yp:appCdnSettings:filtered'); 
            }
            
            return {
                id: cdnDoc.id,
                ...cdnPayload
            };

        } catch (error) { 
            throw new Exception(
                error.status || 201,
                error.code || "INTERNAL_SERVER_ERROR",
                error.message || "Something went wrong. Please try again later.",
                error.title || "Unexpected Error",
            );
        }
    }

    async updateCdnSettingQuery(data, redis) {
        try { 
            const {
                id,
                code,
                targetApp,
                cdnProvider,
                cdnUrl,
                cdnZoneId,
                cacheDuration,
                cdnStatus,
                cdnModule,
                userLoggedInUid,
                userLoggedInUserName
            } = data;

            if (!id) {
                throw new Exception(
                    201,
                    "CDN_ID_REQUIRED",
                    LANG_EN.req.cdn_id_required,
                    "CDN setting ID is required for update"
                );
            }

            const extras = payloadExtras({
                userLoggedInUid,
                userLoggedInUserName
            });

            const cdnPayload = {
                code: code.trim(),
                targetApp: targetApp.trim(),
                provider: cdnProvider.trim(),
                baseUrl: cdnUrl.trim(),
                zoneId: cdnZoneId.trim(),
                cacheDuration: parseInt(cacheDuration) || 0,
                status: cdnStatus.toLowerCase(),
                module: cdnModule?.trim() || "General",
                ...extras
            };

            const query = FirestoreDatabase.collection(Setting.collection)
                .doc(targetApp)
                .collection("cdnSettings");
                
            const existingEntry = await query
                .where("code", "==", code)
                .get();

            if (!existingEntry.empty) {
                const duplicate = existingEntry.docs.find(doc => doc.id !== id);
                if (duplicate) {
                    throw new Exception(
                        409,
                        "SETTING_CODE_EXISTS",
                        LANG_EN.error.setting_with_given_code_exists,
                        `Another record with code, ${code}, already exists for target '${targetApp}'`
                    );
                }
            }

            const cdnDocRef = query.doc(id);
            const docSnapshot = await cdnDocRef.get();

            if (!docSnapshot.exists) {
                throw new Exception(
                    404,
                    "SETTING_NOT_FOUND",
                    LANG_EN.error.cdn_setting_not_found,
                    `No CDN setting found for targetApp: ${targetApp}`
                );
            }

            await cdnDocRef.update(cdnPayload);
            
            if (redis) {
                const cacheKey = `yp:cdnSetting:${id}`;
                await redis.setFunc(cacheKey, { id, ...cdnPayload });
                await redis.deleteFunc('yp:appCdnSettings:filtered');
            }

            return {
                id,
                ...cdnPayload
            };

        } catch (error) {
            throw new Exception(
                error.status || 500,
                error.code || "INTERNAL_SERVER_ERROR",
                error.message || "Something went wrong while updating CDN setting.",
                error.title || "Unexpected Error"
            );
        }
    }

    async getAllCdnSettings(redis, filters={}) { 
        try { 
            const filtersKey = 'yp:appCdnSettings:filters';
            const cacheKey = 'yp:appCdnSettings:filtered';
            filters.docId = filters.targetApp || 'yohpal';
            await redis.deleteFunc(cacheKey);
            let ref = FirestoreDatabase.collection(Setting.collection).doc(filters.docId)
                .collection('cdnSettings');

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;
            
            if (savedFilters !== currentFilters) {
                await redis.deleteFunc(filtersKey);
                await redis.deleteFunc(cacheKey);
                await redis.cacheParser(filtersKey, async () => filters, 2000);
            }   

            let data = await redis.cacheParser(
                cacheKey,
                async () => { 
                    let collection = await ref.get();
                    let data = fbCollectionParser(collection);
                    
                    return data;
                },
                300
            );

            return data;
        } catch (error) {
            return [];
        }
    }
    
    async getCdnSettingById(redis, cdn) {
        try { 
            const cacheKey = `yp:applicationSetting:${cdn?.targetApp}:${cdn?.id}`;  
            let settingsRef = FirestoreDatabase.collection(Setting.collection)
                    .doc(cdn?.targetApp)
                    .collection(cdn?.settingType || "cdnSettings")
                    .doc(cdn?.id);

            if (cdn?.flushCache && cdn.flushCache) {
                await redis.deleteFunc(cacheKey);
            }

            let data = await redis.cacheParser(
                cacheKey,
                async () => {   
                    const snap = await settingsRef.get(); 
                    return snap.exists ? { id: snap.id, ...snap.data() } : null;
                },
                3600
            ); 

            return data;
        } catch (error) {
            return [];
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

    async getAllSettings(redis, filters = {}) { 
        try { 
            const filtersKey = 'yp:applicationSettings:filters';
            const cacheKey = 'yp:applicationSettings:filtered'; 
            filters.docId = filters.targetApp || 'yohpal';

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;

            if (savedFilters !== currentFilters) {
                await redis.deleteFunc(filtersKey);
                await redis.deleteFunc(cacheKey);
                await redis.cacheParser(filtersKey, async () => filters, 2000);
            }   

            let data = await redis.cacheParser(
                cacheKey,
                async () => { 
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
                },
                300
            );

            return data;
        } catch (error) {
            return [];
        }
    }

    async getApiSettingById(redis, api) {
        try { 
            const cacheKey = `yp:applicationSetting:${api?.targetApp}:${api?.id}`;  
            let settingsRef = FirestoreDatabase.collection(Setting.collection)
                    .doc(api?.targetApp)
                    .collection(api?.settingType)
                    .doc(api?.id);

            if (api?.flushCache && api.flushCache) {
                await redis.deleteFunc(cacheKey);
            }

            let data = await redis.cacheParser(
                cacheKey,
                async () => {   
                    const snap = await settingsRef.get(); 
                    return snap.exists ? { id: snap.id, ...snap.data() } : null;
                },
                3600
            );

            if (data) {  
                data.settings.callbackUrl.confirmation = await this.decodeMessage(data?.settings?.callbackUrl?.confirmation);
                data.settings.callbackUrl.validation = await this.decodeMessage(data?.settings?.callbackUrl?.validation);
                data.settings.consumerKey = await this.decodeMessage(data?.settings?.consumerKey);
                data.settings.consumerSecret = await this.decodeMessage(data?.settings?.consumerSecret);
                data.settings.passKey = await this.decodeMessage(data?.settings?.passKey); 
            }

            return data;
        } catch (error) {
            return [];
        }
    }

    async createSettingQuery(data, redis) {
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
                
                const extras = payloadExtras({
                    userLoggedInUid: data?.userLoggedInUid,
                    userLoggedInUserName: data?.userLoggedInUserName
                });
            
                if (data.settings.shortCode) 
                    data.settings.shortCode = data?.settings?.shortCode ? Number(data?.settings?.shortCode) : 0;
                if (data.settings.consumerKey)
                    data.settings.consumerKey = await this.encodeMessage(data?.settings.consumerKey);
                if (data.settings.consumerSecret)
                    data.settings.consumerSecret = await this.encodeMessage(data?.settings.consumerSecret); 
                if (data.settings.passKey)
                    data.settings.passKey = await this.encodeMessage(data?.settings.passKey);
                if (data.settings.callbackUrl?.confirmation)
                    data.settings.callbackUrl.confirmation = await this.encodeMessage(data?.settings.callbackUrl.confirmation);
                if (data.settings.callbackUrl?.validation)
                    data.settings.callbackUrl.validation = await this.encodeMessage(data?.settings.callbackUrl.validation);
                input = data;
                
                payload = {
                    ...input,
                    ...extras
                };
                
                await settingsRef.add(payload);

                const cacheKeyA = 'yp:appApiSettings:filtered';  
                const cacheKeyB = `yp:appApiSettings:${data?.targetApp}:${data?.settings?.shortCode}`;  
                if (query && redis) {
                    await redis.deleteFunc(cacheKeyA);
                    await redis.deleteFunc(cacheKeyB);
                }
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
                
                const cacheKey = `yp:applicationSetting:filtered`; 
                if (query && redis) await redis.deleteFunc(cacheKey);
            } 

            return { id: colId, ...payload };
        } catch (error) {
            console.error("Error in createSettingQuery:", error);
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        }
    }

    async updateApiSettingQuery(data, redis) {
        try {
            const colId = data.type;
            const targetApp = data.targetApp || 'yohpal';
            const settingId = data.id;  

            if (!settingId) {
                throw new Exception(
                    400,
                    "SETTING_ID_REQUIRED",
                    "Missing setting ID for update",
                    "You must provide a valid setting ID to update"
                );
            }

            const settingsRef = FirestoreDatabase
                .collection(Setting.collection)
                .doc(targetApp)
                .collection(colId)
                .doc(settingId);
                
            const docSnap = await settingsRef.get();
            if (!docSnap.exists) {
                throw new Exception(
                    404,
                    "SETTING_NOT_FOUND",
                    `No setting found for ID '${settingId}'`,
                    "Invalid document reference"
                );
            }
            
            if (data.code) {
                const codeSnap = await FirestoreDatabase
                    .collection(Setting.collection)
                    .doc(targetApp)
                    .collection(colId)
                    .where("code", "==", data.code)
                    .limit(1)
                    .get();

                const duplicate = !codeSnap.empty && codeSnap.docs[0].id !== settingId;
                if (duplicate) {
                    throw new Exception(
                        409,
                        "SETTING_CODE_EXISTS",
                        `Setting with code '${data.code}' already exists`,
                        `Duplicate code for type: ${colId}`
                    );
                }
            }
            
            if (data.isDefault) {
                const defaultSnap = await FirestoreDatabase
                    .collection(Setting.collection)
                    .doc(targetApp)
                    .collection(colId)
                    .where("targetApp", "==", targetApp)
                    .where("isDefault", "==", true)
                    .limit(1)
                    .get();

                const defaultExists = !defaultSnap.empty && defaultSnap.docs[0].id !== settingId;
                if (defaultExists) {
                    throw new Exception(
                        409,
                        "DEFAULT_SETTING_EXISTS",
                        LANG_EN.res.default_setting_exists,
                        `Default setting already exists for targetApp: ${ucwords(targetApp)}`
                    );
                }
            }
            
            const extras = payloadExtras({
                userLoggedInUid: data?.userLoggedInUid,
                userLoggedInUserName: data?.userLoggedInUserName
            });

            const settings = { ...data.settings };

            if (settings.shortCode) 
                settings.shortCode = data?.settings?.shortCode ? Number(data?.settings?.shortCode) : 0;
            if (settings.consumerKey)
                settings.consumerKey = await this.encodeMessage(settings.consumerKey);
            if (settings.consumerSecret)
                settings.consumerSecret = await this.encodeMessage(settings.consumerSecret); 
            if (settings.passKey)
                settings.passKey = await this.encodeMessage(settings.passKey);
            if (settings.callbackUrl?.confirmation)
                settings.callbackUrl.confirmation = await this.encodeMessage(settings.callbackUrl.confirmation);
            if (settings.callbackUrl?.validation)
                settings.callbackUrl.validation = await this.encodeMessage(settings.callbackUrl.validation);

            const payload = {
                ...data,
                settings: settings,
                ...extras, 
            };
            
            let query = await settingsRef.update(payload);

            const cacheKey = 'yp:appApiSettings:filtered';
            if (query && redis) await redis.deleteFunc(cacheKey);

            return { id: settingId, ...payload };
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

    async createCpanelSettingQuery(data, redis) {
        try {
            let {
                cpanelCode,
                cpanelHost,
                cpanelUsername,
                cpanelPassword,
                cpanelApiToken,
                linkedDomain,
                cpanelStatus,
                isDefault,
                userLoggedInUid,
                userLoggedInUserName
            } = data;

            cpanelHost = await this.encodeMessage(cpanelHost);
            cpanelUsername = await this.encodeMessage(cpanelUsername);
            cpanelPassword = await this.encodeMessage(cpanelPassword);
            cpanelApiToken = await this.encodeMessage(cpanelApiToken);

            const extras = payloadExtras({
                userLoggedInUid: userLoggedInUid,
                userLoggedInUserName: userLoggedInUserName
            }); 

            const cpanelPayload = {
                code: cpanelCode.trim(),
                host: cpanelHost.trim(),
                username: cpanelUsername.trim(),
                password: cpanelPassword.trim(),
                apiToken: cpanelApiToken?.trim() || null,
                linkedDomain: linkedDomain.trim(),
                cpanelStatus: cpanelStatus || 'disabled',
                isDefault: isDefault ? true : false,
                ...extras
            };

            const query = FirestoreDatabase.collection(Setting.collection)
                .doc('yohpal')
                .collection("cpanelSettings");
                
            const existingEntry = await query
                .where("linkedDomain", "==", linkedDomain.trim())
                .where("host", "==", cpanelHost.trim())
                .get();

            if (!existingEntry.empty) {
                throw new Exception(
                    409,
                    "CPANEL_SETTING_EXISTS",
                    LANG_EN.error.setting_with_given_code_exists,
                    `A setting for domain: ${linkedDomain} and host: ${cpanelHost} already exists`
                );
            }

            const cpanelDoc = await query.doc(cpanelCode).set(cpanelPayload); 

            if (redis) {
                await redis.deleteFunc("yp:cpanelSettings:filtered");
                await redis.deleteFunc(`yp:cpanelSettings:${cpanelDoc.id}`);
            }

            return {
                id: cpanelDoc.id,
                ...cpanelPayload
            };

        } catch (error) {
            throw new Exception(
                error.status || 201,
                error.code || "INTERNAL_SERVER_ERROR",
                error.message || "Something went wrong. Please try again later.",
                error.title || "Unexpected Error"
            );
        }
    }

    async getAllCpanelSettings(redis, filters = {}) {
        try {
            const filtersKey = 'yp:appCpanelSettings:filters';
            const cacheKey = 'yp:appCpanelSettings:filtered';
            
            filters.docId = filters.targetApp || 'yohpal';
            
            await redis.deleteFunc(cacheKey);

            let ref = FirestoreDatabase.collection(Setting.collection)
                .doc(filters.docId)
                .collection('cpanelSettings');

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;

            if (savedFilters !== currentFilters) {
                await redis.deleteFunc(filtersKey);
                await redis.deleteFunc(cacheKey);
                await redis.cacheParser(filtersKey, async () => filters, 2000);
            }
            
            let data = await redis.cacheParser(
                cacheKey,
                async () => {
                    const collection = await ref.get();
                    const data = fbCollectionParser(collection); 
                    return data;
                },
                3600
            );

            if (data && data?.length) { 
                data = await Promise.all(data.map(async (col) => {
                    return {
                        ...col,
                        cpanelHost: col?.host ? await this.decodeMessage(col.host) : null,
                        cpanelUsername: col?.username ? await this.decodeMessage(col.username) : null,
                        cpanelPassword: col?.password ? await this.decodeMessage(col.password) : null,
                        cpanelApiToken: col?.apiToken ? await this.decodeMessage(col.apiToken) : null,
                    };
                })); 
            }

            return data;
        } catch (error) {
            console.error("Error fetching CPanel settings:", error);
            return [];
        }
    }

    async getCpanelSettingById(redis, filters) {
        try {
            const cacheKey = `yp:cpanelSettings:${filters?.id}`;

            const settingsRef = FirestoreDatabase.collection(Setting.collection)
                .doc('yohpal')
                .collection(filters?.settingType || "cpanelSettings")
                .doc(filters?.id);
                await redis.deleteFunc(cacheKey);
            if (filters?.flushCache && filters.flushCache) {
                await redis.deleteFunc(cacheKey);
            }

            let data = await redis.cacheParser(
                cacheKey,
                async () => {
                    const snap = await settingsRef.get();
                    let data = snap.data();
                    return snap.exists ? { id: snap.id, ...data } : null;
                },
                3600
            );
            
            if (data?.host)
                data.host = await this.decodeMessage(data?.host);
            if (data?.username)
                data.username = await this.decodeMessage(data?.username);
            if (data?.password)
                data.password = await this.decodeMessage(data?.password);
            if (data?.apiToken)
                data.apiToken = await this.decodeMessage(data?.apiToken);

            return data;
        } catch (error) {
            return [];
        }
    }
    
    async updateCpanelSettingQuery(data, redis) {
        try {
            let {
                id,
                cpanelCode,
                cpanelHost,
                cpanelUsername,
                cpanelPassword,
                cpanelApiToken,
                linkedDomain,
                cpanelStatus,
                isDefault,
                userLoggedInUid,
                userLoggedInUserName
            } = data;

            if (!id) {
                throw new Exception(
                    400,
                    "NO_ID_SPECIFIED",
                    "No ID specified for updating the CPanel Setting.",
                    "Missing Identifier"
                );
            }

            const docRef = FirestoreDatabase.collection(Setting.collection)
                .doc('yohpal')
                .collection("cpanelSettings")
                .doc(id);

            const existingDoc = await docRef.get();
            if (!existingDoc.exists) {
                throw new Exception(
                    404,
                    "SETTING_NOT_FOUND",
                    "The specified CPanel setting does not exist.",
                    "Not Found"
                );
            }
            
            cpanelHost = await this.encodeMessage(cpanelHost);
            cpanelUsername = await this.encodeMessage(cpanelUsername);
            cpanelPassword = await this.encodeMessage(cpanelPassword);
            cpanelApiToken = await this.encodeMessage(cpanelApiToken);

            const extras = payloadExtras({
                userLoggedInUid: userLoggedInUid,
                userLoggedInUserName: userLoggedInUserName
            });

            const updatePayload = {
                code: cpanelCode.trim(),
                host: cpanelHost.trim(),
                username: cpanelUsername.trim(),
                password: cpanelPassword.trim(),
                apiToken: cpanelApiToken?.trim() || null,
                linkedDomain: linkedDomain.trim(),
                cpanelStatus: cpanelStatus || 'disabled',
                isDefault: isDefault ? true : false, 
                ...extras
            };

            await docRef.update(updatePayload);

            if (redis) {
                await redis.deleteFunc(`yp:cpanelSettings:${id}`);
                await redis.deleteFunc("yp:cpanelSettings:filtered");
            }

            return {
                id,
                ...updatePayload
            };

        } catch (error) {
            throw new Exception(
                error.status || 500,
                error.code || "INTERNAL_SERVER_ERROR",
                error.message || "Failed to update CPanel Setting.",
                error.title || "Unexpected Error"
            );
        }
    } 
}

export default new SettingsUtil();