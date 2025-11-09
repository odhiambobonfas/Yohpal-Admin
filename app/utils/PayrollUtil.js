import Util from '@utils/Util';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@config/config';
import User from '@models/User';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import Department from '@models/Department';
import EmployeeDesignation from '@models/EmployeeDesignation';
import Role from '@models/Role';
import Permissions from '@models/Permissions';
import Holiday from '@models/Holiday';
import Leave from '@models/Leave';
import PaymentComponent from '@models/PaymentComponent';
import ComponentEssential from '@models/ComponentEssential';
import Attendance from '@models/Attendance';
import Exception from '@config/exceptions';
import { payloadExtras, ucwords, fbCollectionParser, normalizeFilters } from '@config/utils';
import LANG_EN from '@lang/en';
import admin from 'firebase-admin';

class PayrollUtil extends Util {
    constructor() {
        super();
    }

    async createPaymentComponentQuery(data, redis) { 
        const db = FirestoreDatabase.collection(PaymentComponent.collection)

        const nameSnap = await db.where("componentName", "==", data.componentName).get(); 
        if (!nameSnap.empty) {
            throw new Exception(
                201,
                "PAYMENT_NAME_DUPLICATE",
                LANG_EN.error.payment_component_name_exists,
                "Duplicate Error"
            );
        }

        const codeSnap = await db.where("componentCode", "==", data.componentCode).get();
        if (!codeSnap.empty) {
            throw new Exception(
                201,
                "PAYMENT_CODE_DUPLICATE",
                LANG_EN.error.payment_component_code_exists,
                "Duplicate Error"
            );
        } 

        const extras = payloadExtras({
            userLoggedInUid: data?.userLoggedInUid,
            userLoggedInUserName: data?.userLoggedInUserName
        });
        
        const payload = { 
            componentName: data.componentName.trim(),
            componentType: data.componentType,
            componentScope: data.componentScope || "none",
            componentCode: data.componentCode?.trim() || "",
            employeeRate: data.employeeRate ? Number(data.employeeRate) : null,
            rateType: data.rateType || "value",
            componentCategory: data.componentCategory || "",
            componentDescription: data.componentDescription?.trim() || "",
            ...extras
        };

        const docRef = db.doc(data.componentCode);
        await docRef.set(payload); 

        if (redis) {
            await redis.deleteFunc('yp:paymentComponents:filtered'); 
        }

        return docRef; 
    }

    async getAllPaymentComponents(redis, filters = {}) {
        try { 
            const filtersKey = 'yp:paymentComponents:filters';
            const cacheKey = 'yp:paymentComponents:filtered';
            let ref = FirestoreDatabase.collection(PaymentComponent.collection);

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;  
            
            await redis.deleteFunc(cacheKey);
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
                7200
            );
            
            return data;
        } catch (error) {
            return [];
        }
    }

    async createPaymentBracketQuery(data, redis) { 
        const db = FirestoreDatabase.collection(ComponentEssential.collection);

        const nameSnap = await db.where("bracketName", "==", data.bracketName).get(); 
        if (!nameSnap.empty) {
            throw new Exception(
                201,
                "BRACKET_NAME_DUPLICATE",
                LANG_EN.error.payment_component_bracket_name_exists,
                "Duplicate Error"
            );
        }

        const codeSnap = await db.where("bracketCode", "==", data.bracketCode).get();
        if (!codeSnap.empty) {
            throw new Exception(
                201,
                "BRACKET_CODE_DUPLICATE",
                LANG_EN.error.payment_component_bracket_code_exists,
                "Duplicate Error"
            );
        } 

        const extras = payloadExtras({
            userLoggedInUid: data?.userLoggedInUid,
            userLoggedInUserName: data?.userLoggedInUserName
        });
        
        const payload = { 
            componentId: data.componentId,
            componentRef: FirestoreDatabase.collection(PaymentComponent.collection).doc(data.componentId),
            bracketName: data.bracketName.trim(),
            bracketCode: data.bracketCode?.trim() || "",
            minRange: data.min,
            maxRange: data.max || null,
            employeeRate: Number(data.employeeRate) || 0,
            employeeRateType: data.employeeRateType || "value",
            bracketDescription: data.bracketDescription?.trim() || "", 
            scope: 'bracket',
            ...extras
        };

        const result = await db.add(payload); 

        if (redis) {
            await redis.deleteFunc('yp:componentBrackets:filtered'); 
        }

        return result; 
    }

    async createPaymentTierQuery(data, redis) {
        const db = FirestoreDatabase.collection(ComponentEssential.collection);

        const nameSnap = await db.where("tierName", "==", data.tierName).get();
        if (!nameSnap.empty) {
            throw new Exception(
                201,
                "TIER_NAME_DUPLICATE",
                LANG_EN.error.payment_tier_name_exists,
                "Duplicate Error"
            );
        }

        if (data.tierCode) {
            const codeSnap = await db.where("tierCode", "==", data.tierCode).get();
            if (!codeSnap.empty) {
                throw new Exception(
                    201,
                    "TIER_CODE_DUPLICATE",
                    LANG_EN.error.payment_tier_code_exists,
                    "Duplicate Error"
                );
            }
        }

        const extras = payloadExtras({
            userLoggedInUid: data?.userLoggedInUid,
            userLoggedInUserName: data?.userLoggedInUserName
        });

        const payload = {
            componentId: data.componentId,
            componentRef: FirestoreDatabase.collection(PaymentComponent.collection).doc(data.componentId),
            tierName: data.tierName.trim(),
            tierCode: data.tierCode?.trim() || "",
            contributionBase: Number(data.contributionBase) || 0,
            employeeRate: Number(data.employeeRate) || 0,
            employeeRateType: data.employeeRateType || "percentage",
            employerRate: Number(data.employerRate) || 0,
            employerRateType: data.employerRateType || "percentage",
            effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
            effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
            tierDescription: data.tierDescription?.trim() || "",
            scope: 'tier',
            ...extras
        };

        const result = await db.add(payload);

        if (redis) {
            const cacheKey = 'yp:componentBrackets:filtered';
            if (filters?.scope && filters?.scope == 'tier') { 
                cacheKey = 'yp:componentTiers:filtered';
            }
            await redis.deleteFunc(cacheKey); 
        }

        return result;
    } 

    async getAllComponentSettingsByLinkedComponents(redis, filters={}) {
        try { 
            let filtersKey = 'yp:componentBrackets:filters';
            let cacheKey = 'yp:componentBrackets:filtered';
            if (filters.scope && filters?.length) {
                filtersKey = 'yp:componentTiers:filters';
                cacheKey = 'yp:componentTiers:filtered';
            }

            let ref = FirestoreDatabase.collection(PaymentComponent.collection);

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;  
            
            await redis.deleteFunc(cacheKey);
            if (savedFilters !== currentFilters) {
                await redis.deleteFunc(filtersKey);
                await redis.deleteFunc(cacheKey);
                await redis.cacheParser(filtersKey, async () => filters, 2000);
            }

            if (filters.scope && filters.scope?.length) {
                ref = ref.where('componentScope', '==', filters.scope);
            }

            let data = await redis.cacheParser(
                cacheKey,
                async () => { 
                    let collection = await ref.get();
                    
                    let data = fbCollectionParser(collection);
                    
                    data = await Promise.all(data.map(async (comp) => {
                        let essentialsRef = FirestoreDatabase
                            .collection(ComponentEssential.collection)
                            .where('componentId', '==', comp.id);
                            
                        let essentialsSnap = await essentialsRef.get();
                        comp.essentials = fbCollectionParser(essentialsSnap) || [];
                        return comp
                    }));
                    
                    return data;
                },
                7200
            );
            
            return data;
        } catch (error) {
            return [];
        }
    }
}

export default new PayrollUtil();