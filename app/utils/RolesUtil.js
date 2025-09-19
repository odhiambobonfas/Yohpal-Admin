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
import { ucwords } from '@config/utils';
import LANG_EN from '@lang/en';

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

    async getRoleByCodeId(code) {
        let rolesRef = FirestoreDatabase.collection('roles'); 
        return await rolesRef.where('code', '==', code.toUpperCase()).get()
    }

    async createRoleQuery(input) { 
        try {
            let addedBy = ucwords((input.addedBy || 'Unknown'));
            let inputCode = input.code.toUpperCase();
            const snapshot = await this.getRoleByCodeId(input.code);

            if (!snapshot.empty) {
                throw new Exception(201, `${LANG_EN.role_exists_exception}`);
            }

            let rolesRef = FirestoreDatabase.collection('roles'); 
            const roleDocRef = rolesRef.doc();
            await roleDocRef.set({
                name: ucwords(input.roleName),
                code: inputCode,
                status: input.status || 'inactive',
                isSuperAdmin: (input.isSuperAdmin ? true : false) || false,
                isAdmin: (input.isAdmin ? true : false) || false,
                description: input.description ?? '',
                target: input.targets,
                addedBy: addedBy,
                refUserId: input.refUserId,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            
            const permissionsRef = FirestoreDatabase.collection('permissions').doc();
            await permissionsRef.set({
                code: inputCode,
                permissions: input.permissions ?? [],
                updatedAt: new Date(),
            }, { merge: true });

            return true;
        } catch (error) {
            console.log(error.status);
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        } 
    } 
}

module.exports = new RolesUtil();