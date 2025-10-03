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
import admin from 'firebase-admin';

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
                addedBy: input.userLoggedInUserName,
                addedByRefUser: input.userLoggedInUserName ? FirestoreDatabase.collection(User.collection).doc(input.userLoggedInUid) : null, 
                updatedBy: input.userLoggedInUserName,
                updatedByRefUser: input.userLoggedInUserName ? FirestoreDatabase.collection(User.collection).doc(input.userLoggedInUid) : null, 
                refUser: input.userLoggedInUserName ? FirestoreDatabase.collection(User.collection).doc(input.userLoggedInUid) : null,
                refPermissions: FirestoreDatabase.collection(Permissions.collection).doc(inputCode),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            const permissionsRef = FirestoreDatabase.collection(Permissions.collection).doc(inputCode);
            await permissionsRef.set({
                code: inputCode,
                permissions: input.permissions ?? [],
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            return true;
        } catch (error) {
            console.log(error.status);
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        } 
    } 

    async updateRoleQuery(input) { 
        try { 
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
                updatedBy: input.userLoggedInUserName,
                updatedByRefUser: input.userLoggedInUserName ? FirestoreDatabase.collection(User.collection).doc(input.userLoggedInUid) : null, 
                refUser: input.userLoggedInUserName ? FirestoreDatabase.collection(User.collection).doc(input.userLoggedInUid) : null,
                refPermissions: input.userLoggedInUserName ? FirestoreDatabase.collection(Permissions.collection).doc(inputCode) : null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            // create if not exists, merge otherwise
            const permissionsRef = FirestoreDatabase.collection(Permissions.collection).doc(inputCode);
            await permissionsRef.set({
                code: inputCode,
                permissions: input.permissions ?? [],
                updatedBy: input.userLoggedInUserName,
                updatedByRefUser: input.userLoggedInUserName ? FirestoreDatabase.collection(User.collection).doc(input.userLoggedInUid) : null, 
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            
            return true;
        } catch (error) {
            console.log(error.status);
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        } 
    } 

    async updateRoleStatusQuery(input, status) {
        try {
            if (!input.roleId) { 
                throw new Exception(201, 'GENERIC_EXCEPTION' `${LANG_EN.undefined_error}`, 'Role ID Not Found Error!');
            } 
            
            let rolesRef = FirestoreDatabase.collection(Role.collection);
            let roleDocRef = rolesRef.doc(input.roleId);
            const roleSnapshot = await roleDocRef.get();

            if (!roleSnapshot.exists) {
                throw new Exception(201, 'ROLE_UNEXISTS_EXCEPTION' `${LANG_EN.role_unexists_exception}`, 'Role Unexists Error!');
            }

            await roleDocRef.update({
                status: status || 'inactive',  
                updatedBy: input.userLoggedInUserName,
                updatedByRefUser: input.userLoggedInUserName ? FirestoreDatabase.collection(User.collection).doc(input.userLoggedInUid) : null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            return true;
        } catch (error) {
            console.log(error.status);
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        }
    }

    async deleteRoleQuery(roleId) {
        try {
            if (!roleId) { 
                throw new Exception(201, 'GENERIC_EXCEPTION' `${LANG_EN.undefined_error}`, 'Role ID Not Found Error!');
            } 
            
            let rolesRef = FirestoreDatabase.collection(Role.collection);
            let roleDocRef = rolesRef.doc(roleId);
            const roleSnapshot = await roleDocRef.get();

            if (!roleSnapshot.exists) {
                throw new Exception(201, 'ROLE_UNEXISTS_EXCEPTION' `${LANG_EN.role_unexists_exception}`, 'Role Unexists Error!');
            }

            const roleData = roleSnapshot.data();
            if (roleData && roleData.code) {
                // delete permissions associated with this role
                const permissionsRef = FirestoreDatabase.collection(Permissions.collection).doc(roleData.code);
                await permissionsRef.delete();
            }

            await roleDocRef.delete();
            
            return true;
        } catch (error) {
            console.log(error.status);
            throw new Exception((error.status || 500), error.code, error.message, error.reason);
        }
    }
}

export default new RolesUtil();