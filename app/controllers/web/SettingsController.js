import bcrypt from 'bcryptjs';
import config from '@config/config';
import User from '@models/User'; 
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes';
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import mexDtParser from '@config/mexDtParser';
import { isAjaxRequest, ucfirst, ucwords } from '@config/utils';
import RolesUtil from '@utils/RolesUtil'; 
import Binding from '@config/bindings'; 
import LANG_EN from '@lang/en';
import Util from '@utils/Util'; 

class SettingsController {
    static async index(req, res) { 
        return res.render("crm/settings/index", { 
            title: `${ config.APP.APP_NAME } || App Settings`,
            user: req.session.user
        });
    }

    static async appsList(req, res) {
        if (isAjaxRequest(req)) {
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

        return res.render("crm/settings/appsList", { 
            title: `${ config.APP.APP_NAME } || List Application Updates`,
            user: req.session.user
        });
    }

    static async createAppUpdate(req, res) {
        if (isAjaxRequest(req)) {
            // ...
        }

        return res.render("crm/settings/create", { 
            title: `${ config.APP.APP_NAME } || Create Application Update`,
            user: req.session.user
        });
    }
}

export default SettingsController;