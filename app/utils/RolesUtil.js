const Util = require('@utils/Util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const db = require('@database/database');
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import Role from '@models/Role';
import Exception from '@config/exceptions';
import utility from '@config/utils';

class RolesUtil extends Util {
    constructor() {
        super();
    }

    /**
     * Fetches and returns all the created roles.
     * 
     * @returns collection
     */
    async getAllRoles() {
        try {
            let ref = FirestoreDatabase.collection(Role.collection);
            let collection = await ref.get();
            
            let data = utility.fbCollectionParser(collection);
    
            console.log(data);
            
            return data;
        } catch (error) {
            if (config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return [];
        }
    } 

    static async getRoleByCodeId(code) {
        let rolesRef = FirestoreDatabase.collection('roles'); 
        return await rolesRef.where('code', '==', code).get()
    }

    static async createRoleQuery(input) {
        try { 
            const snapshot = await this.getRoleByCodeId(input.code);

            if (!snapshot.empty) {
                throw new Exception(404, `Role with code ${input.code} already exists`);
            }
            
            const roleDocRef = rolesRef.doc(input.code);
            await roleDocRef.set({
                name: input.name,
                code: input.code,
                isSuperAdmin: (input.isSuperAdmin ? true : false) || false,
                isAdmin: (input.isAdmin ? true : false) || false,
                description: input.description ?? '',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            
            const permissionsRef = FirestoreDatabase.collection('permissions').doc(input.code);
            await permissionsRef.set({
                code: input.code,
                permissions: input.permissions ?? [],
                updatedAt: new Date(),
            }, { merge: true });

            return true;
        } catch (error) {
            if (config.APP.APP_DEBUG) {
                error.mexLogger();
            }
            return false;
        }
    } 
}

module.exports = new RolesUtil();