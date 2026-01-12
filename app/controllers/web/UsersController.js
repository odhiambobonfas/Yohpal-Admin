import path from 'path';
import bcrypt from 'bcryptjs';
import config from '@config/config';
import User from '@models/User'; 
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes';
import { FirebaseUtility, FirestoreDatabase } from '@utils/FirebaseUtil';
import mexDtParser from '@config/mexDtParser';
import { isAjaxRequest, ucfirst, ucwords, validateEmail, handleFileUploads, reduceToObj, jsonParser, fbCollectionParser } from '@config/utils';
import {hasPermission, hasAnyPermission} from '@funcs/permissions';
import UsersUtil from '@utils/UserUtil';  
import HRMUtil from '@utils/HRMUtil';  
import PayrollUtil from '@utils/PayrollUtil';
import ReportUtil from '@utils/ReportUtil';
import LANG_EN from '@lang/en'; 
import { departments, designations, employees } from "@funcs/hrm";
import { getAllRoles, isAdmin, isSuperAdmin } from "@funcs/roles";
import Attendance from "@models/Attendance";
import Application from '@models/Application';
import PaymentComponent from '@models/PaymentComponent';

class UsersController {
    static async index(req, res) {
        if (isAjaxRequest(req)) {
            let users = [];
            let user = req.session.user; 
            try {  
                // Filter to show only users created by Super Admin
                users = await UsersUtil.getAllUsers(req?.redis, { createdBySuperAdmin: true }); 
                
                let mex = new mexDtParser(users);
                users = mex.addColumn('actions', (col) => {
                    let actions = '';
                    let id = col['uid'] || col['id'];
                    let status = col['status'] || 'unset';  
                    
                    if (hasPermission(user?.permissions || [], 'users.edit', user?.role)) {
                        actions += `<a class="btn btn-sm dropdown-item" href="/users/edit/${id}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`
                    }

                    if (hasPermission(user?.permissions || [], 'users.delete', user?.role)) {
                        actions += `<a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`
                    }

                    if (hasPermission(user?.permissions || [], 'users.activate', user?.role) && ['inactive', 'pending', 'unset'].includes(status)) { 
                        actions += `<a class="btn btn-sm dropdown-item activate" href="javascript:void(0)" data-id="${id}" data-status="active">
                                <i class="fas fa-check-circle me-1"></i> Activate
                            </a>` 
                    }

                    if (hasPermission(user?.permissions || [], 'users.deactivate', user?.role) && ['active', 'unset'].includes(status)) { 
                        actions += `<a class="btn btn-sm dropdown-item deactivate" href="javascript:void(0)" data-id="${id}" data-status="inactive">
                                <i class="fas fa-times-circle me-1"></i> Deactivate
                            </a>` 
                    }

                    if (hasPermission(user?.permissions || [], 'users.suspend', user?.role) && ['active', 'inactive', 'pending', 'unset'].includes(status)) { 
                        actions += `<a class="btn btn-sm dropdown-item suspend" href="javascript:void(0)" data-id="${id}" data-status="suspended">
                                <i class="fas fa-user-slash me-1"></i> Suspend
                            </a>` 
                    }

                    let action_dropdown = `
                        <div class="dropdown">
                            <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="triggerId" data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false">
                                    Actions
                            </button>
                            <div class="dropdown-menu action-btns" aria-labelledby="triggerId">  
                                ${actions || '<span class="dropdown-item text-muted">No Actions</span>'}
                            </div>
                        </div>
                    `;

                    return action_dropdown;
                })
                .editColumn('status', (col) => { 
                    return ucfirst(col);
                })
                .addColumn('fullName', (col) => { 
                    let fullName = 'N/A';
                    if (col.firstName?.length || col.lastName?.length) {
                        fullName = `${col.firstName ?? ''} ${col.lastName ?? ''}`.trim();
                    }

                    return ucwords(fullName);
                }) 
                .editColumn('addedBy', (col) => { 
                    return ucwords(col || 'N/A');
                }) 
                .editColumn('Country', (col) => { 
                    return ucwords(col || 'N/A');
                })
                .editColumn('userName', (col) => { 
                    return ucwords(col || 'N/A');
                })
                .editColumn('email', (col) => { 
                    return (col || 'N/A');
                })
                .editColumn('phoneNumber', (col) => { 
                    return ucwords(col || 'N/A');
                })
                .addColumn('roleName', (col) => { 
                    return ucwords(col.role.name || 'N/A');
                })
                .editColumn('description', (col) => { 
                    return ucfirst(col || 'N/A');
                })
                .editColumn('status', (col) => { 
                    col = col ? col.toLowerCase() : 'inactive';
                    if (col === 'active') {
                        return `<span class="badge text-dark bg-success">${ucfirst(col)}</span>`;
                    } else if (col === 'inactive') {
                        return `<span class="badge text-dark bg-warning">${ucfirst(col)}</span>`;
                    } else if (col === 'suspended') {
                        return `<span class="badge text-dark bg-danger">${ucfirst(col)}</span>`;
                    } else {
                        return `<span class="badge text-dark bg-warning">Inactive</span>`;
                    } 
                })
                .make();

                return res.status(200).json({
                    status: 'success',
                    message: 'Users retrieved successfully.',
                    data: users
                });
            } catch (error) {
                if (error instanceof Exception && config.APP.APP_DEBUG) { 
                    error.mexLogger();
                }
                
                return res.status((error.status || 500)).json({
                    status: 'error',
                    message: error.message || 'Something went wrong. Please try again later.',
                    code: error.code ||  'INTERNAL_SERVER_ERROR',
                    title: error.title || 'Unexpected Error'
                });
            }
        }


        // Get departments and designations data
        const allRoles = await getAllRoles(req.redis);
        const departmentsData = await departments(req.redis);
        const designationsData = await designations(req.redis); 

        // Get shifts data
        const shiftsData = await Attendance.getAllShifts(req.redis);

        // users
        const employeesData = await employees(req.redis);

        return res.render("crm/users/index", { 
            title: `${ config.APP.APP_NAME } || List Users`,
            user: req.session.user,
            allRoles: allRoles,
            departments: departmentsData,
            designations: designationsData,
            shifts: shiftsData,
            employees: employeesData
        });
    }

    static async createUser(req, res) {

        if (isAjaxRequest(req)) {
            let data = req.body;  

            try {    
                let user = req.session.user;  
                if (!user || !user.uid) {
                    throw new Exception(201, "AUTHENTICATION_ERROR_EXCEPTION", LANG_EN.req.unauthenticated, "Authentication Error!");
                }

                // validate input data
                if (!data.firstName?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_firstname, "Role Error!");
                }

                if (!data.lastName?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_lastname, "Invalid Last Name!");
                }

                if (!data.userName?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_username, "Invalid Username!");
                }

                if (!data.email?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_email, "Invalid Email!");
                }

                if (!validateEmail(data.email)) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_email_format, "Email Format Error!");
                }

                if (!data.password?.length) {
                    throw new Exception(201, "AUTHENTICATION_ERROR_EXCEPTION", LANG_EN.req.invalid_password, "Password Missing!");
                }

                if (data.password !== data.confirmPassword) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.password_mismatch, "Passwords Do Not Match!");
                }

                if (!data.roleId?.length) {
                    throw new Exception(201, "AUTHORIZATION_ERROR_EXCEPTION", LANG_EN.req.invalid_role, "Role Missing!");
                }

                if (!["active", "inactive", "pending"].includes(data.status)) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_status, "Invalid Status!");
                }

                let profilePicture = '';
                let fileUploadToFb = '';
                if (req.file && req.file.fieldname == 'profile_picture') {  
                    const uploadFilePath = handleFileUploads(req, 'images/avatars'); 
                    if (!uploadFilePath) {
                        throw new Exception(201, "PROFILE_PICTURE_UPLOAD_FAILED", LANG_EN.req.invalid_avatar_exemption, "Avatar upload error");
                    }
                    
                    profilePicture = path.relative(process.cwd(), (Array.isArray(uploadFilePath) ? uploadFilePath[0] : uploadFilePath)).replace(/\\/g, "/");
                    const FBUTIL = new FirebaseUtility();
                    fileUploadToFb = await FBUTIL.uploadFile(profilePicture, {
                        linkType: "firebase",
                        makePublic: true
                    }); 
                    if (!fileUploadToFb) {
                        throw new Exception(201, "PROFILE_PICTURE_UPLOAD_FAILED", LANG_EN.req.invalid_avatar_exemption, "Avatar upload to FB error");
                    } 
                }

                data.departmentDesignationPairs = JSON.parse(data.departmentDesignationPairs) || [];   
                data.profilePictureLocalPath = profilePicture.replace('public', '');
                data.profilePicture = profilePicture.replace('public', '');
                data.profilePictureFbPath = fileUploadToFb; 
                data.userLoggedInUserName = user.name;
                data.userLoggedInUid = user.uid;

                let create = await UsersUtil.createUser(data, req?.redis);
                
                let route;
                if (!data.stayHere) {
                    route = '/users';
                }

                return res.status(200).json({
                    status: 'success',
                    message: 'User created successfully.',
                    route: route,
                    data: create
                });
            }
            catch (error) {
                if (error instanceof Exception && config.APP.APP_DEBUG) { 
                    error.mexLogger();
                }
                return res.status((error.status || 500)).json({
                    status: 'error',
                    message: error.message || 'Something went wrong. Please try again later.',
                    code: error.code ||  'INTERNAL_SERVER_ERROR',
                    title: error.title || 'Unexpected Error'
                });
            }
        }

        // Get departments and designations data
        const allRoles = await getAllRoles(req.redis);
        const departmentsData = await departments(req.redis);
        const designationsData = await designations(req.redis); 

        // Get shifts data
        const shiftsData = await Attendance.getAllShifts(req.redis);

        // users
        const employeesData = await employees(req.redis); 

        // components For Dropdown
        const componentsForDropdown = await PaymentComponent.getComponentsForDropdown(req.redis);
        
        // countries for dropdown!
        const countriesForDropdown = await Application.countriesForDropdown(req?.redis);

        return res.render("crm/users/create", { 
            title: `${ config.APP.APP_NAME } || Create User(s)`,
            user: req.session.user,
            allRoles: allRoles,
            departments: departmentsData,
            designations: designationsData,
            shifts: shiftsData,
            employees: employeesData,
            countriesForDropdown: countriesForDropdown,
            componentsForDropdown: componentsForDropdown
        });
    }

    static async editUser(req, res) {
        let uid = req.params.id; 
        if (isAjaxRequest(req)) {
            let data = req.body;  

            try {     
                let user = req.session.user; 
                
                if (!user || !user.uid) {
                    throw new Exception(201, "AUTHENTICATION_ERROR_EXCEPTION", LANG_EN.req.unauthenticated, "Authentication Error!");
                }

                // validate input data
                if (!data.firstName?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_firstname, "Role Error!");
                }

                if (!data.lastName?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_lastname, "Invalid Last Name!");
                }

                if (!data.userName?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_username, "Invalid Username!");
                }

                if (!data.email?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_email, "Invalid Email!");
                }

                if (!validateEmail(data.email)) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_email_format, "Email Format Error!");
                }
                
                if (data.password?.length && data.password !== data.confirmPassword) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.password_mismatch, "Passwords Do Not Match!");
                } 

                if (!data.roleId?.length) {
                    throw new Exception(201, "AUTHORIZATION_ERROR_EXCEPTION", LANG_EN.req.invalid_role, "Role Missing!");
                }

                if (!["active", "inactive", "pending"].includes(data.status)) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.request_denied, "Invalid Status!");
                }

                let profilePicture = '';
                let fileUploadToFb = '';
                if (req.file && req.file?.fieldname == 'profile_picture') {  
                    const uploadFilePath = handleFileUploads(req, 'images/avatars'); 
                    if (!uploadFilePath) {
                        throw new Exception(201, "PROFILE_PICTURE_UPLOAD_FAILED", LANG_EN.req.invalid_avatar_exemption, "Avatar upload error");
                    }
                    
                    profilePicture = path.relative(process.cwd(), (Array.isArray(uploadFilePath) ? uploadFilePath[0] : uploadFilePath)).replace(/\\/g, "/");
                    const FBUTIL = new FirebaseUtility();
                    fileUploadToFb = await FBUTIL.uploadFile(profilePicture, "company/yohpal/avatars", {
                        linkType: "firebase",
                        makePublic: true
                    }); 
                    if (!fileUploadToFb) {
                        throw new Exception(201, "PROFILE_PICTURE_UPLOAD_FAILED", LANG_EN.req.invalid_avatar_exemption, "Avatar upload to FB error");
                    } 
                }
            
                data.departmentDesignationPairs = JSON.parse(data.departmentDesignationPairs) || [];   
                data.profilePictureLocalPath = profilePicture.replace('public', '');
                data.profilePicture = profilePicture.replace('public', '');
                data.profilePictureFbPath = fileUploadToFb;
                data.userLoggedInUserName = user.name;
                data.userLoggedInUid = user.uid;

                let create = await UsersUtil.updateUser(uid, data, req?.redis);
                
                let route;
                if (!data.stayHere) {
                    route = '/users';
                }

                return res.status(200).json({
                    status: 'success',
                    message: 'User updated successfully.',
                    route: route,
                    data: create
                });
            }
            catch (error) {
                if (error instanceof Exception && config.APP.APP_DEBUG) { 
                    error.mexLogger();
                }
                return res.status((error.status || 500)).json({
                    status: 'error',
                    message: error.message || 'Something went wrong. Please try again later.',
                    code: error.code ||  'INTERNAL_SERVER_ERROR',
                    title: error.title || 'Unexpected Error'
                });
            }
        } 

        let { user, role, departmentDesignationData, linkedPayComponents } = await UsersUtil.getUserByUid(req?.redis, uid);    
        if (!user || !user.uid) { 
            return res.redirect('/users');
        }

        // Get departments and designations data
        const allRoles = await getAllRoles(req.redis);
        const departmentsData = await departments(req.redis);
        const designationsData = await designations(req.redis); 

        // Get shifts data
        const shiftsData = await Attendance.getAllShifts(req.redis);

        // users
        const employeesData = await employees(req.redis);

        // components For Dropdown 
        const componentsForDropdown = await PaymentComponent.getComponentsForDropdown(req.redis, linkedPayComponents);
        
        const countriesForDropdown = await Application.countriesForDropdown(req?.redis, user?.country);

        return res.render("crm/users/update", { 
            title: `${ config.APP.APP_NAME } || List Users`,
            userData: user,
            roleData: role,
            departmentDesignationData: departmentDesignationData || {}, 
            user: req.session.user,
            allRoles: allRoles,
            departments: departmentsData,
            designations: designationsData,
            shifts: shiftsData,
            employees: employeesData,
            countriesForDropdown: countriesForDropdown,
            linkedPayComponents: linkedPayComponents,
            componentsForDropdown: componentsForDropdown
        });
    }

    static async updateUserStatus(req, res) {
        let uid = req.params.id; 
        let {status} = req.body;
        let data = { uid: uid, status: status };  

        try {   
            let user = req.session.user; 

            if (!user || !user.uid) {
                throw new Exception(201, "AUTHENTICATION_ERROR_EXCEPTION", LANG_EN.req.unauthenticated, "Authentication Error!");
            }

            if (!uid?.length) {
                throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.user_not_found, "User Not Found!");
            } 

            if (!["active", "inactive", "suspended", "pending"].includes(status)) {
                throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.request_denied, "Invalid Status!");
            }
            
            data.userLoggedInUserName = user.name;
            data.userLoggedInUid = user.uid;
            
            let create = await UsersUtil.updateUserStatus(data, req?.redis); 

            return res.status(200).json({
                status: 'success',
                message: 'User status updated successfully.', 
                data: create
            });
        }
        catch (error) {
            if (error instanceof Exception && config.APP.APP_DEBUG) { 
                error.mexLogger();
            }
            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Something went wrong. Please try again later.',
                code: error.code ||  'INTERNAL_SERVER_ERROR',
                title: error.title || 'Unexpected Error'
            });
        } 
    }

    static async getAllUsers(req, res) {
        if (isAjaxRequest(req)) {
            try {
                const users = await ReportUtil.getAllUsers();
                
                return res.status(200).json({
                    success: true,
                    count: users.length,
                    data: users
                });
            } catch (error) {
                console.error('Error fetching users:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch users',
                    message: error.message
                });
            }
        }

        return res.render("crm/reports/users", { 
            title: `${ config.APP.APP_NAME } || Users Report`,
            user: req.session.user
        });
    }

    static async deleteUser(req, res) {
        let uid = req.params.id;   

        try {   
            let user = req.session.user; 

            if (!user || !user.uid) {
                throw new Exception(201, "AUTHENTICATION_ERROR_EXCEPTION", LANG_EN.req.unauthenticated, "Authentication Error!");
            }

            if (!uid?.length) {
                throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.user_not_found, "User Not Found!");
            }  
            
            let create = await UsersUtil.deleteUser(uid, req?.redis); 

            return res.status(200).json({
                status: 'success',
                message: 'User deleted successfully.', 
                data: create
            });
        }
        catch (error) {
            if (error instanceof Exception && config.APP.APP_DEBUG) { 
                error.mexLogger();
            }
            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Something went wrong. Please try again later.',
                code: error.code ||  'INTERNAL_SERVER_ERROR',
                title: error.title || 'Unexpected Error'
            });
        } 
    }
}

export default UsersController;