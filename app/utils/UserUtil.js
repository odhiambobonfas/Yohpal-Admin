const Util = require('@utils/Util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const db = require('@database/database');
import RedisCache from '@config/redisCache';
import { FirestoreDatabase } from '@utils/FirebaseUtil'; 
import utility from '@config/utils'

class UserUtil extends Util {
    constructor() {
        super();
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