const Util = require('@utils/Util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const db = require('@database/database');
import RedisCache from '@config/redisCache';
import { FirestoreDatabase } from '@utils/FirebaseUtil'; 
import utility from '@config/utils'
import { parseDateRange, parseToISO } from '@funcs/global_funcs';
import admin from 'firebase-admin';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en';

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

            let users =  utility.fbCollectionParser(snapshot);

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
            const cacheKey = `yp:users:count`;
    
            const count = await RedisCache.cacheParser(
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

    async createUser(data={}) { 
        try { 
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);

            let newUser = {
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                fullName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
                userName: data.userName || "",
                email: data.email || "",
                password: data.password ? hashedPassword : "",
                Country: data.country || "",
                phoneNumber: data.phoneNumber || "",
                roleRef: data.roleId ? FirestoreDatabase.collection('roles').doc(data.roleId) : null,
                refPermissions: data.permissionId ? FirestoreDatabase.collection('permissions').doc(data.permissionId) : null,
                profile_picture: data.profilePicture || "",
                address: data.address || "",
                bio: data.bio || "",
                status: data.status || "active",
                adminType: data.adminType || "user",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            console.log('New User Data:', newUser);

            const userRef = await FirestoreDatabase.collection(User.collection).add(newUser);

            if (!userRef.id) {
                throw new Exception(500, "USER_CREATION_FAILED", LANG_EN.req.user_creation_failed, "User Creation Error");
            }

            newUser.id = userRef.id;

            return newUser;
        } catch (error) {
            console.error('Error creating user:', error);
        }

        return {};
    }
}

module.exports = new UserUtil();