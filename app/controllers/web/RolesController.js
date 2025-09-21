import bcrypt from 'bcryptjs';
import config from '@config/config';
import User from '@models/User'; 
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes';
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import Util from '@utils/Util';
import utility from '@config/utils';
import mexDtParser from '@config/mexDtParser';
import { ucfirst, ucwords } from '@config/utils';
import RolesUtil from '@utils/RolesUtil'; 
import Binding from '@config/bindings'; 
import LANG_EN from '@lang/en';

class RolesController {
    static async index(req, res) {
        if (utility.isAjaxRequest(req)) {
            let roles = [];

            try {
                roles = await RolesUtil.getAllRoles(); 

                let mex = new mexDtParser(roles);
                roles = mex.addColumn('actions', (col) => {
                    let actions = '';
                    let id = col['id'];
                    
                    if (id) {
                        actions += `<a class="btn btn-sm dropdown-item" href="/roles/edit/${id}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`
                    }

                    if (id) {
                        actions += `<a class="btn btn-sm dropdown-item" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
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
                .editColumn('status', (col) => { 
                    return ucfirst(col);
                })
                .editColumn('addedBy', (col) => { 
                    return ucwords(col || 'N/A');
                })
                .editColumn('description', (col) => { 
                    return ucfirst(col || 'N/A');
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
        if (utility.isAjaxRequest(req)) { 
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

        if (utility.isAjaxRequest(req)) { 
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
}

module.exports = RolesController;