import Util from '@utils/Util';
import config from '@config/config';
import User from '@models/User';
import RedisCache from '@config/redisCache';
import admin from 'firebase-admin';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en'; 
import { ucwords, fbCollectionParser } from '@config/utils';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';  
import { parseDateRange } from '@funcs/global_funcs';

class UserUtil extends Util {
    constructor() {
        super();
    }

    async getAllUsers(filters={}) {    
        try {
            filters.limit = parseInt(filters.limit) || 250; 
            filters.order = filters.order || "asc";
            filters.orderBy = filters.orderBy || "createdAt";

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

            query = query.orderBy(filters.orderBy, filters.order || "asc"); 

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const snapshot = await query.get(); 

            if (snapshot.empty) {
                return [];
            }

            let users =  fbCollectionParser(snapshot);

            users = await Promise.all(users.map( async (user) => {
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

            return users;
        } catch (error) {
            console.error('Error getting users:', error);
        }

        return [];
    }

    
    async getUserByUid(id) {  
        const usersRef = FirestoreDatabase.collection(User.collection).doc(id);
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
    
    async getAllUsersCount() {
        try {
            const rd = new RedisCache();
            await rd.initRedisCaching(); 

            const cacheKey = `yp:users:count`;
    
            const count = await rd.cacheParser(
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

            const userRecord = await admin.auth().createUser({
                email: data.email,
                password: data.password,
                displayName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            });

            if (!userRecord || !userRecord.uid) {
                throw new Exception(500, "USER_CREATION_FAILED", LANG_EN.req.user_creation_failed, "User Creation Error");
            }
            
            let addedBy = data.addedBy || null;

            let newUser = {
                authUid: userRecord.uid,
                uid: userRecord.uid,
                firstName: ucwords(data.firstName) || "", 
                lastName: ucwords(data.lastName) || "", 
                userName: data.userName.toLowerCase() || "", 
                Country: data.country || "",
                phoneNumber: data.phoneNumber || "",
                roleRef: data.roleId ? FirestoreDatabase.collection('roles').doc(data.roleId) : null,
                refPermissions: data.permissionId ? FirestoreDatabase.collection('permissions').doc(data.permissionId) : null,
                profile_picture: data.profilePicture || "",
                address: data.address || "",
                bio: data.bio || "",
                status: data.status || "active", 
                createdBy: addedBy ? FirestoreDatabase.collection(User.collection).doc(addedBy) : null,
                updatedBy: addedBy ? FirestoreDatabase.collection(User.collection).doc(addedBy) : null, 
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            const userRef = await FirestoreDatabase.collection(User.collection).add(newUser);

            if (!userRef.id) {
                throw new Exception(500, "USER_CREATION_FAILED", LANG_EN.req.user_creation_failed, "User Creation Error");
            }

            newUser.id = userRef.id;

            return newUser;
        } catch (error) {
            console.error('Error creating user:', error); 
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        }
    }

    async updateUser(data) {
        try {
            const usersRef = FirestoreDatabase.collection(User.collection);

            const emailSnapshot = await usersRef.where('email', '==', data.email).get();
            if (emailSnapshot.empty) {
                throw new Exception(
                    404,
                    "USER_NOT_FOUND",
                    LANG_EN.req.user_email_unexists,
                    `User with the email: ${ucwords(data.email)} does not exist!`
                );
            }
            
            const userDoc = emailSnapshot.docs[0];
            const uid = userDoc.data().uid;
            
            const usernameSnapshot = await usersRef.where('userName', '==', data.userName).get();
            if (!usernameSnapshot.empty && usernameSnapshot.docs[0].id !== userDoc.id) {
                throw new Exception(
                    409,
                    "USERNAME_TAKEN",
                    LANG_EN.req.userName_exists,
                    `Username ${ucwords(data.userName)} is already taken by another user`
                );
            }
            
            const userRecord = await admin.auth().updateUser(uid, {
                email: data.email,
                password: data.password,
                displayName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            });

            if (!userRecord) {
                throw new Exception(500, "USER_UPDATE_FAILED", LANG_EN.req.user_update_failed, "User update error");
            }
            
            let userObj = {
                firstName: ucwords(data.firstName) || "",
                lastName: ucwords(data.lastName) || "", 
                userName: data.userName.toLowerCase() || "",
                country: data.country || "",
                phoneNumber: data.phoneNumber || "",
                roleRef: data.roleId ? FirestoreDatabase.collection('roles').doc(data.roleId) : null,
                refPermissions: data.permissionId ? FirestoreDatabase.collection('permissions').doc(data.permissionId) : null,
                profile_picture: data.profilePicture || "",
                address: data.address || "",
                bio: data.bio || "",
                status: data.status || "active",
                updatedBy: data.addedBy ? FirestoreDatabase.collection(User.collection).doc(data.addedBy) : null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // Update Firestore document
            await usersRef.doc(userDoc.id).update(userObj);

            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Exception(error.status || 500, error.code, error.message, error.reason);
        }
    }

    async updateUserStatus(data) {
        let { uid, status, updatedBy } = data; 
        try {
            if (!uid || !status) {
                throw new Exception(400, "INVALID_INPUT", LANG_EN.uid_and_status_required, "Invalid input data");
            }

            const usersRef = FirestoreDatabase.collection(User.collection);
            const userSnapshot = await usersRef.where('uid', '==', uid).get();

            if (userSnapshot.empty) {
                throw new Exception(404, "USER_NOT_FOUND", LANG_EN.req.user_unexists, `User with UID: ${ucwords(uid)} does not exist!`);
            }

            const userDoc = userSnapshot.docs[0];

            await usersRef.doc(userDoc.id).update({
                status: status,
                updatedBy: updatedBy ? FirestoreDatabase.collection(User.collection).doc(updatedBy) : null,
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