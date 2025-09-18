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

class RolesController {
    static async index(req, res) {
        if (utility.isAjaxRequest(req)) {
            let roles = [];

            try {
                roles = await RolesUtil.getAllRoles();
                console.log(roles); 

                let mex = new mexDtParser(roles);
                roles = mex.addColumn('actions', (col) => {
                    let actions = '';
                    let id = col['id'];
                    
                    if (id) {
                        actions += `<a class="btn btn-sm dropdown-item" href="/roles/edit/${col['id']}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`
                    }

                    if (id) {
                        actions += `<a class="btn btn-sm dropdown-item" href="javascript:void(0)" data-id="${col['id']}">
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
                if (error instanceof Exception) {
                    if (config.APP.APP_DEBUG) error.mexLogger();
                    return res.status(error.status).json({
                        status: 'error',
                        message: error.message,
                        code: error.code,
                        title: error.title,
                        data: roles
                    });
                } else { 
                    return res.status(500).json({
                        status: 'error',
                        message: 'Something went wrong. Please try again later.',
                        code: 'INTERNAL_SERVER_ERROR',
                        title: 'Unexpected Error',
                        data: roles
                    });
                }
            }
        }

        return res.render("crm/roles/index", { 
            title: "Yohpal Admin || Roles",
            user: req.session.user
        });
    }

    static async createRoles(req, res) {
        const permissions = Binding.permissions;
        if (utility.isAjaxRequest(req)) { 
            try {
                const { 
                    name,
                    code,
                    isSuperAdmin,
                    isAdmin
                } = req.body;

                if (!name) {
                    throw new Exception(400, "ROLE_NAME_EXCEPTION", "Role name is required!", "Role Error!");
                }

                if (!code) {
                    throw new Exception(400, "ROLE_NAME_EXCEPTION", "Role code is required!", "Role Code Error!");
                }
                
                if (isSuperAdmin && isAdmin) {
                    throw new Exception(400, "DEFAULT_ROLE_EXCEPTION", "Super admin and admin role cannot be applicable the same time!", "Default Role Error!");
                }

                const query = await RolesUtil.createRoleQuery(req.body);

                if (!query) {
                    throw new Exception(503, "CREATE_ROLE_QUERY_EXCEPTION", "Role could not be created!", "Role creation error!");
                }

                return res.status(200).json({
                    status: 'success',
                    message: 'Role created successfully!'
                })

            } catch (error) {
                if (error instanceof Exception) {
                    if (config.APP.APP_DEBUG) error.mexLogger();
                    return res.status(error.status).json({
                        status: 'error',
                        message: error.message,
                        code: error.code,
                        title: error.title
                    });
                } else { 
                    return res.status(500).json({
                        status: 'error',
                        message: 'Something went wrong. Please try again later.',
                        code: 'INTERNAL_SERVER_ERROR',
                        title: 'Unexpected Error'
                    });
                }
            }
        }

        return res.render("crm/roles/create", { 
            title: "Yohpal Admin || Create Role",
            user: req.session.user,
            permission_bindings: permissions
        });
    }
}

module.exports = RolesController;