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
        // ...
    }
}

export default new HRMUtil();