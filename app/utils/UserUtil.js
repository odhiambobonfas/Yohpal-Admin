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
}

module.exports = new UserUtil();