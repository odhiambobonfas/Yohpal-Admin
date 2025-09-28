import Util from '@utils/Util';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@config/config';
import User from '@models/User';
import db from '@database/database';
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import Role from '@models/Role';
import Permissions from '@models/Permissions';
import Exception from '@config/exceptions';
import { ucwords, fbCollectionParser } from '@config/utils';
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
            
            let data = fbCollectionParser(collection);
            
            return data;
        } catch (error) { 
            return [];
        }
    } 

    async getRoleByCodeId(code) {
        let rolesRef = FirestoreDatabase.collection(Role.collection); 
        return await rolesRef.where('code', '==', code.toUpperCase()).get()
    }

    async getRoleByDocId(id) { 
        let roleRef = FirestoreDatabase.collection(Role.collection).doc(id); 
        let roleSnapshot = await roleRef.get();

        if (!roleSnapshot.exists) return {};
        
        let role = roleSnapshot.data();

        let permissions = {};
        if (role.refPermissions && role.refPermissions.get) {
            const permSnap = await role.refPermissions.get();
            if (permSnap.exists) {
                permissions = permSnap.data(); 
            }
        }  
        
        role.permissions = permissions;

        return role;
    }

    async createRoleQuery(input) { 
        try {
            let addedBy = ucwords((input.addedBy || 'Unknown'));
            let inputCode = input.code.toUpperCase();
            const snapshot = await this.getRoleByCodeId(input.code);

            if (!snapshot.empty) {
                throw new Exception(201, `${LANG_EN.role_exists_exception}`);
            }

            let rolesRef = FirestoreDatabase.collection(Role.collection); 
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
                refUser: FirestoreDatabase.collection(User.collection).doc(input.refUserId),
                refPermissions: FirestoreDatabase.collection(Permissions.collection).doc(inputCode),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            
            const permissionsRef = FirestoreDatabase.collection(Permissions.collection).doc(inputCode);
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

    async updateRoleQuery(input) { 
        try {
            let addedBy = ucwords((input.addedBy || 'Unknown'));
            let inputCode = input.code.toUpperCase();
            const snapshot = await this.getRoleByCodeId(input.code);

            if (snapshot.empty) {
                throw new Exception(201, 'ROLE_UNEXISTS_EXCEPTION' `${LANG_EN.role_unexists_exception}`, 'Role Unexists Error!');
            }
            
            let rolesRef = FirestoreDatabase.collection(Role.collection);
            let roleDocRef;
            
            if (!input.roleId) { 
                throw new Exception(201, 'GENERIC_EXCEPTION' `${LANG_EN.undefined_error}`, 'Role ID Not Found Error!');
            } 
            
            roleDocRef = rolesRef.doc(input.roleId);
            await roleDocRef.update({
                name: ucwords(input.roleName),
                code: inputCode,
                status: input.status || 'inactive',
                isSuperAdmin: !!input.isSuperAdmin,
                isAdmin: !!input.isAdmin,
                description: input.description ?? '',
                target: input.targets,
                addedBy: addedBy,
                refUser: FirestoreDatabase.collection(User.collection).doc(input.refUserId),
                refPermissions: FirestoreDatabase.collection(Permissions.collection).doc(inputCode),
                updatedAt: new Date(),
            });
            
            // create if not exists, merge otherwise
            const permissionsRef = FirestoreDatabase.collection(Permissions.collection).doc(inputCode);
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

export default new RolesUtil();