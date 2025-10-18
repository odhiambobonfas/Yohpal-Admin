import Util from '@utils/Util';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@config/config';
import User from '@models/User';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import Department from '@models/Department';
import PaymentAccount from '@models/PaymentAccount';
import PaymentAccountCategory from '@models/PaymentAccountCategory';
import EmployeeDesignation from '@models/EmployeeDesignation';
import Role from '@models/Role';
import Permissions from '@models/Permissions';
import Holiday from '@models/Holiday';
import Leave from '@models/Leave';
import Attendance from '@models/Attendance';
import Exception from '@config/exceptions';
import { payloadExtras, ucwords, fbCollectionParser, normalizeFilters } from '@config/utils';
import LANG_EN from '@lang/en';
import admin from 'firebase-admin';

class AccountsUtil extends Util {
    constructor() {
        super();
    }

    async createAccountCategoryQuery(data) { 
        const db = FirestoreDatabase.collection(PaymentAccountCategory.collection)

        const nameSnap = await db.where("name", "==", data.accountCategoryName).get(); 
        if (!nameSnap.empty) {
            throw new Exception(
                201,
                "ACCOUNT_CATEGORY_NAME_DUPLICATE",
                LANG_EN.error.account_category_name_exists,
                "Duplicate Error"
            );
        }

        const codeSnap = await db.where("code", "==", data.accountCategoryCode).get();
        if (!codeSnap.empty) {
            throw new Exception(
                201,
                "ACCOUNT_CATEGORY_CODE_DUPLICATE",
                LANG_EN.error.account_category_code_exists,
                "Duplicate Error"
            );
        }

        let _payloadExtras = {
            userLoggedInUid: data?.userLoggedInUid,
            userLoggedInUserName: data?.userLoggedInUserName
        };

        const extras = payloadExtras(_payloadExtras);
        
        const payload = { 
            name: data.accountCategoryName.trim(),
            code: data.accountCategoryCode ? data.accountCategoryCode.trim() : null,
            description: data.accountCategoryDescription ? data.accountCategoryDescription.trim() : null,
            status: data.status || "active",
            ...extras
        };
        
        const docId = data.accountCategoryCode.trim();
        await db.doc(docId).set(payload);

        return { id: docId, ...payload }; 
    }

    async getAllAccountCategories(redis, filters={}){
        const filtersKey = 'yp:paymentAccountCategories:filters';
        const cacheKey = 'yp:paymentAccountCategories:filtered';
        let ref = FirestoreDatabase.collection(PaymentAccountCategory.collection);

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
            300
        );
        
        return data;
    }
}

export default new AccountsUtil();