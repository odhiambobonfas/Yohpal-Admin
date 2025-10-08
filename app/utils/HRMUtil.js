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
import Exception from '@config/exceptions';
import { payloadExtras, ucwords, fbCollectionParser, normalizeFilters } from '@config/utils';
import LANG_EN from '@lang/en';
import admin from 'firebase-admin';

class HRMUtil extends Util {
    constructor() {
        super();
    }

    async createDepartmentQuery(data) { 
        const db = FirestoreDatabase.collection(Department.collection)

        const nameSnap = await db.where("departmentName", "==", data.departmentName).get(); 
        if (!nameSnap.empty) {
            throw new Exception(
                201,
                "DEPARTMENT_NAME_DUPLICATE",
                LANG_EN.error.department_name_exists,
                "Duplicate Error"
            );
        }

        const codeSnap = await db.where("departmentCode", "==", data.departmentCode).get();
        if (!codeSnap.empty) {
            throw new Exception(
                201,
                "DEPARTMENT_CODE_DUPLICATE",
                LANG_EN.error.department_code_exists,
                "Duplicate Error"
            );
        }

        let _payloadExtras = {
            userLoggedInUid: data?.userLoggedInUid,
            userLoggedInUserName: data?.userLoggedInUserName
        };

        const extras = payloadExtras(_payloadExtras);

        const payload = {
            departmentName: data.departmentName,
            departmentCode: data.departmentCode,
            departmentHead: data.departmentHead || "",
            departmentDescription: data.departmentDescription || "",
            ...extras
        }; 

        const result = await db.add(payload); 

        return result; 
    }

    async createDesignationQuery(data) {
        const db = FirestoreDatabase.collection(EmployeeDesignation.collection)

        const nameSnap = await db.where("designationName", "==", data.designationName).get(); 
        if (!nameSnap.empty) {
            throw new Exception(
                201,
                "DESIGNATION_NAME_DUPLICATE",
                LANG_EN.error.designation_name_exists,
                "Duplicate Error"
            );
        }

        const codeSnap = await db.where("designationCode", "==", data.designationCode).get();
        if (!codeSnap.empty) {
            throw new Exception(
                201,
                "DESIGNATION_CODE_DUPLICATE",
                LANG_EN.error.designation_code_exists,
                "Duplicate Error"
            );
        }

        let _payloadExtras = {
            userLoggedInUid: data?.userLoggedInUid,
            userLoggedInUserName: data?.userLoggedInUserName
        };

        const extras = payloadExtras(_payloadExtras);

        const payload = {
            designationName: data.designationName,
            designationCode: data.designationCode,
            basicSalary: data.basicSalary || "",
            designationDescription: data.designationDescription || "",
            ...extras
        }; 

        const result = await db.add(payload); 

        return result; 
    }

    async getAllDepartments(redis, filters = {}) {
        try { 
            const filtersKey = 'yp:departments:filters';
            const cacheKey = 'yp:departments:filtered';
            let ref = FirestoreDatabase.collection(Department.collection);

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

    async getAllDesignations(redis, filters = {}) {
        try { 
            const filtersKey = 'yp:designations:filters';
            const cacheKey = 'yp:designations:filtered';
            let ref = FirestoreDatabase.collection(EmployeeDesignation.collection);

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

export default new HRMUtil();