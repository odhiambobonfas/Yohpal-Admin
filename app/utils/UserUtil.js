import Util from '@utils/Util';
import qs from 'qs';
import config from '@config/config';
import User from '@models/User';
import RedisCache from '@config/redisCache';
import admin from 'firebase-admin';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en'; 
import { ucwords, fbCollectionParser, normalizeFilters } from '@config/utils';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';  
import { parseDateRange } from '@funcs/global_funcs';
import Role from '@models/Role';
import Permission from '@models/Permissions';
import PaymentComponent from '@models/PaymentComponent';
import EmployeeDesignation from '@models/EmployeeDesignation';

class UserUtil extends Util {
    constructor() {
        super();
    }

    async getAllUsers(redis, filters={}) {    
        try { 
            const filtersKey = 'yp:users:filters';
            const cacheKey = 'yp:users:filtered';

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;
            
            // If filters changed, have to invalidate the cache
            if (savedFilters !== currentFilters) {
                await redis.deleteFunc(filtersKey);
                await redis.deleteFunc(cacheKey);

                await redis.cacheParser(filtersKey, async () => filters, 2000);
            }
            
            let users = await redis?.cacheParser(
                cacheKey,
                async () => {  
                    let query = FirestoreDatabase.collection(User.collection);

                    if (filters?.userName?.length) {
                        query = query.where("username", "==", filters.userName);
                    }

                    if (filters?.email?.length) {
                        query = query.where("email", "==", filters.email);
                    } 

                    if (filters?.country?.length) {
                        query = query.where("country", "==", filters.country);
                    }

                    if (filters?.phoneNumber?.length) {
                        query = query.where("phoneNumber", "==", filters.phoneNumber);
                    }
                    
                    if (filters?.adminType?.length) {
                        query = query.where("adminType", "==", filters.adminType);
                    }

                    if (filters?.Status?.length) {
                        query = query.where("status", "==", filters.Status);
                    } 

                    if (filters?.roleId?.length) {
                        query = query.where("roleId", "==", filters.roleId);
                    } 

                    if (filters?.createdAt?.length) {
                        let createdAt = parseDateRange(filters.createdAt, true); 
                        if (createdAt.start && createdAt.end) { 
                            query = query.where("createdAt", ">=", createdAt.start);
                            query = query.where("createdAt", "<=", createdAt.end);
                        }
                    }
                    
                    if (filters.orderBy) {
                        query = query.orderBy(filters.orderBy, filters.orderBy); 
                    }

                    if (filters.limit) {
                        query = query.limit(filters.limit);
                    }

                    const snapshot = await query.get(); 

                    if (snapshot.empty) {
                        return [];
                    }

                    let fetched =  fbCollectionParser(snapshot); 

                    fetched = await Promise.all(fetched.map( async (user) => {
                        let role = {};      
                        // if user has a role reference
                        if (user.roleRef && user.roleRef.get) {
                            const roleSnap = await user.roleRef.get();
                            if (roleSnap.exists) {
                                role = roleSnap.data(); 
                            }
                        }
                        
                        user.role = role; 
                        return user;
                    }));  

                    if (filters?.roleExists && filters.roleExists) {
                        fetched = fetched.filter(user => user.roleRef !== null && user.roleRef !== undefined && user.roleRef !== '');
                    }

                    return fetched;
                },
                300
            );

            return users;
        } catch (error) {
            console.error('Error getting users:', error);
        }

        return [];
    }

    
    async getUserByUid(uid) {
        const usersRef = FirestoreDatabase.collection(User.collection)
            .where("uid", "==", uid);

        const snapshot = await usersRef.get();

        if (snapshot.empty) {
            return {};
        }

        const userDoc = snapshot.docs[0];
        let user = userDoc.data() ?? {};

        let role = {};
        let permissions = {};

        // if user has a role reference
        if (user.roleRef && user.roleRef.get) {
            const roleSnap = await user.roleRef.get();
            if (roleSnap.exists) {
                role = roleSnap.data();

                // if role has a permissions reference
                if (role.refPermissions && role.refPermissions.get) {
                    const permSnap = await role.refPermissions.get();
                    if (permSnap.exists) {
                        permissions = permSnap.data();
                    }
                }
            }
        }

        const departmentData = {};
        const designationData = {};

        return {
            user,
            role,
            permissions,
            departmentData,
            designationData
        };
    }

    async getUserByDocid(uid) {  
        let usersRef = FirestoreDatabase.collection(User.collection).doc(uid);
        const snapshot = await usersRef.get();  
        
        if (!snapshot.exists) {
            return {}; 
        }
    
        let user = snapshot.data() ?? {}; 
    
        let role = {};
        let permissions = {};
    
        // if user has a role reference
        if (user.roleRef && user.roleRef.get) {
            const roleSnap = await user.roleRef.get();
            if (roleSnap.exists) {
                role = roleSnap.data();
    
                // if role has a permissions reference
                if (role.refPermissions && role.refPermissions.get) {
                    const permSnap = await role.refPermissions.get();
                    if (permSnap.exists) {
                        permissions = permSnap.data();
                    }
                }
            }
        }
    
        return {
            user,
            role,
            permissions
        };
    }
    
    async getAllUsersCount(redis) { 
        try {
            const cacheKey = 'yp:users:count'; 
    
            const count = await redis.cacheParser(
                cacheKey,
                async () => {
                    const usersRef = FirestoreDatabase.collection(User.collection);
                    const snapshot = await usersRef.count().get();
    
                    return snapshot.data().count;
                },
                300
            );
    
            return count;
        } catch (error) {
            console.error('Error getting user count:', error);
            return 0;
        }
    }    

    async createUser(data) { 
        try {  
            // check if email or username already exists
            const existingUsersRef = FirestoreDatabase.collection(User.collection);
            const emailSnapshot = await existingUsersRef
                .where('email', '==', data.email) 
                .get();
                
            if (!emailSnapshot.empty) {
                throw new Exception( 201, "USER_ALREADY_EXISTS", LANG_EN.req.user_email_already_exists, `User with same email: ${ucwords(data.email)}, exists!`);
            }

            const usernameSnapshot = await FirestoreDatabase.collection(User.collection)
                .where('userName', '==', data.userName)
                .get();

            if (!usernameSnapshot.empty) {
                throw new Exception( 201, "USER_ALREADY_EXISTS", LANG_EN.req.userName_already_exists, `User with same username: ${ucwords(data.userName)}, exists!`);
            }

            let userRecord = await admin.auth().createUser({
                email: data.email,
                password: data.password,
                displayName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            });

            userRecord = qs.parse(userRecord); 

            if (!userRecord && !userRecord.uid) {
                throw new Exception(200, "USER_CREATION_FAILED", LANG_EN.req.user_creation_failed, "User Creation Error");
            }

            let paymentComponentRefs = [];
            if (data?.paymentComponents?.length) {
                data.paymentComponents.map(componentId => {
                    const ref = FirestoreDatabase.collection(PaymentComponent.collection).doc(componentId);
                    paymentComponentRefs.push(ref);
                });
            }
            
            let newUser = { 
                uid: userRecord.uid,
                firstName: ucwords(data.firstName) || "", 
                lastName: ucwords(data.lastName) || "", 
                userName: data.userName.toLowerCase() || "", 
                isEmployee: data.isEmployee ? true : false, 
                email: data.email.toLowerCase() || "", 
                Country: data.country || "",
                phoneNumber: data.phoneNumber || "",
                roleRef: data.roleId ? FirestoreDatabase.collection(Role.collection).doc(data.roleId) : null,
                refPermissions: data.permissionId ? FirestoreDatabase.collection(Permission.collection).doc(data.permissionId) : null,
                profile_picture: data.profilePicture || '/store/images/avatars/default-avatar.jpg', 
                profilePictureLocalPath: data.profilePictureLocalPath || '/store/images/avatars/default-avatar.jpg',
                profilePictureFbPath: data.profilePictureFbPath,
                address: data.address || "",
                bio: data.bio || "",
                status: data.status || "active", 

                // HRM information 
                departmentName: data?.departmentName || '',
                departmentRef: data?.departmentId ? FirestoreDatabase.collection(EmployeeDesignation.collection).doc(data.departmentId) :  '',
                
                designationName: data?.designationName || '',
                designationRef: data?.designationId ? FirestoreDatabase.collection(EmployeeDesignation.collection).doc(data.designationId) :  '',
                
                paymentComponentRefs: paymentComponentRefs,
                
                basicSalary: data?.basicSalary || 0,
                basicSalaryDuration: data?.basicSalaryDuration || '',
                tokenAmount: data?.tokenAmount || 0,
                // End of HRM information

                addedBy: data.userLoggedInUserName,
                addedByRefUser: data.userLoggedInUserName ? FirestoreDatabase.collection(User.collection).doc(data.userLoggedInUid) : null, 
                updatedBy: data.userLoggedInUserName,
                updatedByRefUser: data.userLoggedInUserName ? FirestoreDatabase.collection(User.collection).doc(data.userLoggedInUid) : null, 
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            const userRef = await FirestoreDatabase.collection(User.collection).doc(userRecord.uid).set(newUser);
            console.log("USER REF: ", userRef);
            if (!userRef) {
                throw new Exception(500, "USER_CREATION_FAILED", LANG_EN.req.user_creation_failed, "User Creation Error");
            }
            
            return newUser;
        } catch (error) {
            console.error('Error creating user:', error); 
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        }
    }

    async updateUser(uid, data) {
        try {
            if (!uid) {
                throw new Exception(400, "INVALID_INPUT", LANG_EN.req.invalid_request, "Invalid input data");
            }

            const usersRef = FirestoreDatabase.collection(User.collection);
            const userSnapshot = await usersRef.where('uid', '==', uid).get();

            if (userSnapshot.empty) {
                throw new Exception(404, "USER_NOT_FOUND", LANG_EN.req.user_not_found, `User with UID: ${ucwords(uid)} does not exist!`);
            }

            const userDoc = userSnapshot.docs[0];
            let updatedData = {};

            if (data.password) { 
                let updateReq = await admin.auth().updateUser(uid, { 
                    password: data.password, 
                }); 

                if (!updateReq) {
                    throw new Exception(200, "USER_UPDATE_FAILED", LANG_EN.req.request_denied, "User password update Error");
                }
            }

            if (data.firstName) {
                updatedData.firstName = ucwords(data.firstName);
            }

            if (data.lastName) {
                updatedData.lastName = ucwords(data.lastName);
            }

            if (data.userName) {
                // Check if username already exists (excluding current user)
                const usernameSnapshot = await usersRef
                    .where('userName', '==', data.userName)
                    .get();

                if (!usernameSnapshot.empty) {
                    const conflict = usernameSnapshot.docs.find(doc => doc.id !== userDoc.id);
                    if (conflict) {
                        throw new Exception(
                            201,
                            "USER_ALREADY_EXISTS",
                            LANG_EN.req.userName_already_exists,
                            `User with same username: ${ucwords(data.userName)}, exists!`
                        );
                    }
                }
                updatedData.userName = data.userName.toLowerCase();
            }

            if (data.country) {
                updatedData.country = data.country; // fixed casing (was Country)
            }

            if (data.email) {
                updatedData.email = data.email; // fixed casing (was Country)
            }

            if (data.phoneNumber) {
                updatedData.phoneNumber = data.phoneNumber;
            }

            if (data.isEmployee) {
                updatedData.isEmployee = data.isEmployee ? true : false;
            }

            if (data.roleId) {
                updatedData.roleRef = FirestoreDatabase.collection('roles').doc(data.roleId);
            }

            if (data.permissionId) {
                updatedData.refPermissions = FirestoreDatabase.collection('permissions').doc(data.permissionId);
            }

            if (data.profilePicture) { 
                updatedData.profile_picture = data.profilePicture || '/store/images/avatars/default-avatar.jpg';
                updatedData.profilePictureLocalPath = data.profilePictureLocalPath || '/store/images/avatars/default-avatar.jpg';
                updatedData.profilePictureFbPath = data.profilePictureFbPath;
            } 

            if (data.address) {
                updatedData.address = data.address;
            }

            if (data.bio) {
                updatedData.bio = data.bio;
            }

            if (data.status) {
                updatedData.status = data.status;
            }
            
            if (data.userLoggedInUid) {
                updatedData.updatedBy = data.userLoggedInUserName.toLowerCase();
                updatedData.updatedByRefUser = data.userLoggedInUid ? FirestoreDatabase.collection(User.collection).doc(data.userLoggedInUid) : null; 
            }
            
            let paymentComponentRefs = [];
            if (data?.paymentComponents?.length) {
                data.paymentComponents.map(componentId => {
                    const ref = FirestoreDatabase.collection(PaymentComponent.collection).doc(componentId);
                    paymentComponentRefs.push(ref);
                });
            }

            let hrmInformation = {
                // HRM information 
                departmentName: data?.departmentName || '',
                departmentRef: data?.departmentId ? FirestoreDatabase.collection(EmployeeDesignation.collection).doc(data.departmentId) :  '',
                
                designationName: data?.designationName || '',
                designationRef: data?.designationId ? FirestoreDatabase.collection(EmployeeDesignation.collection).doc(data.designationId) :  '',
                
                paymentComponentRefs: paymentComponentRefs,
                
                basicSalary: data?.basicSalary || 0,
                basicSalaryDuration: data?.basicSalaryDuration || '',
                tokenAmount: data?.tokenAmount || 0,
                // End of HRM information
            }

            updatedData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

            await usersRef.doc(userDoc.id).update({...updatedData, ...hrmInformation}); // fixed doc reference

            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        }
    }

    async updateUserStatus(data) {
        let { uid, status, userLoggedInUserName, userLoggedInUid } = data; 
        
        try {
            if (!uid || !status) {
                throw new Exception(400, "INVALID_INPUT", LANG_EN.uid_and_status_required, "Invalid input data");
            }

            const usersRef = FirestoreDatabase.collection(User.collection);
            const userSnapshot = await usersRef.where('uid', '==', uid).get();
            
            if (userSnapshot.empty) {
                throw new Exception(404, "USER_NOT_FOUND", LANG_EN.req.operation_failed, `User with UID: ${ucwords(uid)} does not exist!`);
            }

            const userDoc = userSnapshot.docs[0];
            console.log(data);
            await usersRef.doc(userDoc.id).update({
                status: status, 
                updatedBy: userLoggedInUserName,
                updatedByRefUser: userLoggedInUserName ? FirestoreDatabase.collection(User.collection).doc(userLoggedInUid) : null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error updating user status:', error);
            throw new Exception(error.status || 500, error.code, error.message, error.reason);
        }
    }

    async deleteUser(uid) {
        try {
            if (!uid) {
                throw new Exception(400, "INVALID_INPUT", LANG_EN.req.invalid_request, "Invalid input data");
            }

            const usersRef = FirestoreDatabase.collection(User.collection);
            const userSnapshot = await usersRef.where('uid', '==', uid).get();

            if (userSnapshot.empty) {
                throw new Exception(404, "USER_NOT_FOUND", LANG_EN.req.user_not_found, `User with UID: ${ucwords(uid)} does not exist!`);
            }

            const userDoc = userSnapshot.docs[0];

            // Delete user from Firebase Authentication
            await admin.auth().deleteUser(uid);

            // Delete user document from Firestore
            await usersRef.doc(userDoc.id).delete();

            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw new Exception(error.status || 500, error.code, error.message, error.reason);
        }
    }
}

export default new UserUtil();