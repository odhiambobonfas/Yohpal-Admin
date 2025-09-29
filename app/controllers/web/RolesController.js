import bcrypt from 'bcryptjs';
import config from '@config/config';
import User from '@models/User'; 
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes';
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import Util from '@utils/Util'; 
import mexDtParser from '@config/mexDtParser';
import { isAjaxRequest, ucfirst, ucwords } from '@config/utils';
import {hasPermission, hasAnyPermission} from '@funcs/permissions';
import RolesUtil from '@utils/RolesUtil'; 
import Binding from '@config/bindings'; 
import LANG_EN from '@lang/en';

class RolesController {
    static async index(req, res) {
        if (isAjaxRequest(req)) {
            let roles = [];
            let user = req.session.user;
            try {
                roles = await RolesUtil.getAllRoles(); 

                let mex = new mexDtParser(roles);
                roles = mex.addColumn('actions', (col) => {
                    let actions = '';
                    let id = col['id'];
                    
                    if (hasPermission(user?.permissions || [], 'roles.edit') || hasPermission(user?.permissions || [], 'roles.assign')) {
                        actions += `<a class="btn btn-sm dropdown-item" href="/roles/edit/${id}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`
                    }

                    if (hasPermission(user?.permissions || [], 'roles.delete')) {
                        actions += `<a class="btn btn-sm dropdown-item" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`
                    }

                    // activate
                    if (hasPermission(user?.permissions || [], 'roles.activate') && col['status'] !== 'active') {
                        actions += `<a class="btn btn-sm dropdown-item activate" href="javascript:void(0)" data-id="${id}" data-status="active">
                                <i class="fas fa-check-circle me-1"></i> Activate
                            </a>`
                    }

                    // deactivate
                    if (hasPermission(user?.permissions || [], 'roles.deactivate') && col['status'] !== 'inactive') {
                        actions += `<a class="btn btn-sm dropdown-item deactivate" href="javascript:void(0)" data-id="${id}" data-status="inactive">
                                <i class="fas fa-times-circle me-1"></i> Deactivate
                            </a>`
                    }

                    // suspend
                    if (hasPermission(user?.permissions || [], 'roles.suspend') && col['status'] !== 'suspended') {
                        actions += `<a class="btn btn-sm dropdown-item suspend" href="javascript:void(0)" data-id="${id}" data-status="suspended">
                                <i class="fas fa-pause-circle me-1"></i> Suspend
                            </a>`
                    }

                    let action_dropdown = `
                        <div class="dropdown">
                            <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="triggerId" data-bs-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false">
                                    Actions
                            </button>
                            <div class="dropdown-menu action-btns" aria-labelledby="triggerId">  
                                ${actions}
                            </div>
                        </div>
                    `;

                    return action_dropdown;
                }) 
                .editColumn('addedBy', (col) => { 
                    return ucwords(col || 'N/A');
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
                    message: 'Roles retrieved successfully.',
                    data: roles
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

        return res.render("crm/roles/index", { 
            title: `${ config.APP.APP_NAME } || Create Role`,
            user: req.session.user
        });
    }

    static async createRoles(req, res) {
        const permissions = Binding.permissions;
        if (isAjaxRequest(req)) { 
            try {
                const { 
                    roleName,
                    code,
                    status,
                    targets,
                    isSuperAdmin,
                    isAdmin,
                    description,
                    stayHere
                } = req.body;
                
                let cookie = req.cookies.user; 
                
                if (!cookie['uid']) {
                    throw new Exception(403, "AUTHENTICATION_ERROR_EXCEPTION", LANG_EN.authentication_error_exception, "Role Error!");
                }
                
                if (!roleName) {
                    throw new Exception(201, "ROLE_NAME_EXCEPTION", LANG_EN.role_name_required, "Role Error!");
                }
                
                if (!code) {
                    throw new Exception(201, "ROLE_CODE_EXCEPTION", LANG_EN.role_code_required, "Role Code Error!");
                }
                
                if (!targets) {
                    throw new Exception(201, "TARGET_APP_EXCEPTION", LANG_EN.target_app_required, "Target Application Error!");
                }
                
                if (isSuperAdmin && isAdmin) {
                    throw new Exception(201, "DEFAULT_ROLE_EXCEPTION", LANG_EN.default_role_conflict, "Default Role Error!");
                }
                
                if (description && description.length > 100) {
                    throw new Exception(201, "ROLE_DESCRIPTION_EXCEPTION", LANG_EN.role_description_limit, "Role Description Error!");
                }                

                req.body['addedBy'] = cookie['name'] || cookie['email'];  
                req.body['refUserId'] = cookie['uid']; 

                const query = await RolesUtil.createRoleQuery(req.body);

                if (!query) {
                    throw new Exception(201, "CREATE_ROLE_QUERY_EXCEPTION", "Role could not be created!", "Role creation error!");
                }

                let route;
                if (!stayHere) {
                    route = '/roles';
                }

                return res.status(200).json({
                    status: 'success',
                    message: 'Role created successfully!',
                    route:  route
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

        return res.render("crm/roles/create", { 
            title: `${ config.APP.APP_NAME } || Create Role`,
            user: req.session.user,
            permission_bindings: Object.entries(permissions)
        });
    }

    static async updateRoles(req, res) {
        const roleId = req.params.id;
        const permissions = Binding.permissions;
        let role = await RolesUtil.getRoleByDocId(roleId);
        role.permissions = role.permissions.permissions 
            ?   role.permissions.permissions
            :   [];

        if (isAjaxRequest(req)) { 
            try {
                const { 
                    roleName,
                    code,
                    status,
                    targets,
                    isSuperAdmin,
                    isAdmin,
                    description,
                    stayHere
                } = req.body;
                
                let cookie = req.session.user; 
                
                if (!cookie['uid']) {
                    throw new Exception(403, "AUTHENTICATION_ERROR_EXCEPTION", LANG_EN.authentication_error_exception, "Role Error!");
                }
                
                if (!roleName) {
                    throw new Exception(201, "ROLE_NAME_EXCEPTION", LANG_EN.role_name_required, "Role Error!");
                }
                
                if (!code) {
                    throw new Exception(201, "ROLE_CODE_EXCEPTION", LANG_EN.role_code_required, "Role Code Error!");
                }
                
                if (!targets) {
                    throw new Exception(201, "TARGET_APP_EXCEPTION", LANG_EN.target_app_required, "Target Application Error!");
                }
                
                if (isSuperAdmin && isAdmin) {
                    throw new Exception(201, "DEFAULT_ROLE_EXCEPTION", LANG_EN.default_role_conflict, "Default Role Error!");
                }
                
                if (description && description.length > 100) {
                    throw new Exception(201, "ROLE_DESCRIPTION_EXCEPTION", LANG_EN.role_description_limit, "Role Description Error!");
                }                

                req.body['addedBy'] = cookie['name'] || cookie['email'];  
                req.body['refUserId'] = cookie['uid']; 
                req.body['roleId'] = roleId; 

                const query = await RolesUtil.updateRoleQuery(req.body);

                if (!query) {
                    throw new Exception(201, "CREATE_ROLE_QUERY_EXCEPTION", "Role could not be updated!", "Role creation error!");
                }

                let route;
                if (!stayHere) {
                    route = '/roles';
                }

                return res.status(200).json({
                    status: 'success',
                    message: 'Role updated successfully!',
                    route:  route
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

        return res.render("crm/roles/update", { 
            title: `${ config.APP.APP_NAME } || Update Role`,
            user: req.session.user,
            roleId: roleId || '',
            role: role ?? [],
            permission_bindings: Object.entries(permissions)
        });
    }

    static async updateRoleStatus(req, res) {
        try {
            const roleId = req.params.id;
            const { status } = req.body;
            
            if (!roleId) {
                throw new Exception(201, "ROLE_ID_EXCEPTION", LANG_EN.role_id_required, "Role ID Error!");
            } 

            if (!status) {
                throw new Exception(201, "ROLE_STATUS_EXCEPTION", LANG_EN.role_status_required, "Role Status Error!");
            } 

            let snapshot = await RolesUtil.getRoleByDocId(roleId);

            if (snapshot.isSuperAdmin && status !== 'active') {
                throw new Exception(201, "DEFAULT_ROLE_STATUS_EXCEPTION", LANG_EN.default_role_status_exception, "Default Role Status Error!");
            }

            if (snapshot.isAdmin && status !== 'active') {
                throw new Exception(201, "ADMIN_ROLE_STATUS_EXCEPTION", LANG_EN.admin_role_status_exception, "Admin Role Status Error!");
            }

            const query = await RolesUtil.updateRoleStatusQuery(roleId, status);

            if (!query) {
                throw new Exception(201, "UPDATE_ROLE_STATUS_QUERY_EXCEPTION", "Role status could not be updated!", "Role status update error!");
            }

            return res.status(200).json({
                status: 'success',
                message: 'Role status updated successfully!'
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

    static async deleteRole(req, res) {
        try {
            const roleId = req.params.id;
            
            if (!roleId) {
                throw new Exception(201, "ROLE_ID_EXCEPTION", LANG_EN.role_id_required, "Role ID Error!");
            } 

            let snapshot = await RolesUtil.getRoleByDocId(roleId);

            if (snapshot.isSuperAdmin && snapshot.isSuperAdmin) {
                throw new Exception(201, "DEFAULT_ROLE_DELETE_EXCEPTION", LANG_EN.default_role_delete_exception, "Default Role Deletion Error!");
            } 

            const query = await RolesUtil.deleteRoleQuery(roleId);

            if (!query) {
                throw new Exception(201, "DELETE_ROLE_QUERY_EXCEPTION", "Role could not be deleted!", "Role deletion error!");
            }

            return res.status(200).json({
                status: 'success',
                message: 'Role deleted successfully!'
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
}

export default RolesController;