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
import Attendance from '@models/Attendance';
import Exception from '@config/exceptions';
import { payloadExtras, ucwords, fbCollectionParser, normalizeFilters } from '@config/utils';
import LANG_EN from '@lang/en';
import admin from 'firebase-admin';

class PayrollUtil extends Util {
    constructor() {
        super();
    }

    async createPaymentComponentQuery(data) { 
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
            componentRate: data.componentRate ? Number(data.componentRate) : null,
            rateType: data.rateType || "value",
            componentCategory: data.componentCategory || "",
            componentDescription: data.componentDescription?.trim() || "",
            ...extras
        };

        const result = await db.add(payload); 

        return result; 
    }

    async getAllPaymentComponents(redis, filters = {}) {
        try { 
            const filtersKey = 'yp:paymentComponents:filters';
            const cacheKey = 'yp:paymentComponents:filtered';
            let ref = FirestoreDatabase.collection(PaymentComponent.collection);

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
                3600
            );
            
            return data;
        } catch (error) {
            return [];
        }
    }
}

export default new PayrollUtil();