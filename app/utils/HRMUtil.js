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
import Attendance from '@models/Attendance';
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

    async createHolidayQuery(data) { 
        const db = FirestoreDatabase.collection(Holiday.collection);
        let _payloadExtras = {
            userLoggedInUid: data?.userLoggedInUid,
            userLoggedInUserName: data?.userLoggedInUserName
        };

        const extras = payloadExtras(_payloadExtras);

        const payload = {
            holidayName: data.holidayName, 
            startDate: data.startDate,
            endDate: data.endDate,
            holidayType: data.holidayType === 'custom' ? data.customHolidayType : data.holidayType,
            holidayDescription: data.holidayDescription || "",
            ...extras
        };
        const result = await db.add(payload); 

        return result; 
    }

    async getAllHolidays(redis, filters = {}) {
        try { 
            const filtersKey = 'yp:holidays:filters';
            const cacheKey = 'yp:holidays:filtered';
            let ref = FirestoreDatabase.collection(Holiday.collection);
            ref = ref.orderBy("startDate", "desc");

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

    async getAllEmployees(redis, filters = {}) {
        try { 
            const filtersKey = 'yp:employees:filters';
            const cacheKey = 'yp:employees:filtered';
            let ref = FirestoreDatabase.collection(User.collection);
            ref = ref.where("isEmployee", '==', true); // all who have isEmployee true

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

    async createAttendanceRecordQuery(data) {
        try {
            const db = FirestoreDatabase.collection(Attendance.collection);

            const extras = payloadExtras({
                userLoggedInUid: data?.userLoggedInUid,
                userLoggedInUserName: data?.userLoggedInUserName
            });

            const payload = {
                userId: data.userId, 
                userRef: FirestoreDatabase.collection(User.collection).doc(data.userId),
                attendanceDate: data.attendanceDate,
                clockInTime: data.clockInTime || "",
                clockOutTime: data.clockOutTime || "",
                shift: data.shift || "",
                status: data.status || "present",
                remarks: data.remarks || "",
                ...extras
            };

            const result = await db.add(payload);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getAllAttendanceRecords(redis, filters = {}) {
        try { 
            const filtersKey = 'yp:attendances:filters';
            const cacheKey = 'yp:attendances:filtered';
            let ref = FirestoreDatabase.collection(Attendance.collection);
            ref = ref.orderBy("attendanceDate", "desc");

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

                    let fetched = await Promise.all(data.map( async (attendance) => {
                        let user = {};     

                        // if attendance has a userRef reference
                        if (attendance.userRef && attendance.userRef.get) {
                            const userDoc = await attendance.userRef.get(); 
                            if (userDoc.exists) {
                                user = { id: userDoc.id, ...userDoc.data() }; 
                            }
                        }
                        
                        attendance.user = user; 
                        return attendance;
                    })); 

                    return fetched;
                },
                100
            );

            return data;
        } catch (error) {
            return [];
        }
    }
}

export default new HRMUtil();