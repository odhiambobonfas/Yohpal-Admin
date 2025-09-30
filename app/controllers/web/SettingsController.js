import bcrypt from 'bcryptjs';
import config from '@config/config';
import User from '@models/User';
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes';
import {
    FirestoreDatabase
} from '@utils/FirebaseUtil';
import mexDtParser from '@config/mexDtParser';
import {
    isAjaxRequest,
    ucfirst,
    ucwords
} from '@config/utils';
import RolesUtil from '@utils/RolesUtil';
import Binding from '@config/bindings';
import LANG_EN from '@lang/en';
import Util from '@utils/Util';
import Setting from '@models/Setting'
import ApiSettingsUtil from '@utils/ApiSettingsUtil';
import {hasPermission, hasAnyPermission} from '@funcs/permissions';
import qs from "qs";

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
                    code: error.code || 'INTERNAL_SERVER_ERROR',
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

    static async createApiSetting(req, res) {
        try {
            req.body = qs.parse(req.body);
            const {
                provider,
                code,
                phone,
                email,
                targetApp,
                environ,
                status, 
                isDefault,
                description
            } = req.body;

            let settings = req.body['mpesaSetting'] || req.body['paypalSettings'] || req.body['customSettings'] || {}; 

            const payload = {
                provider,
                code,
                phone,
                email,
                targetApp,
                environ,
                status,
                isDefault,
                settings
            };        

            const session = req.session.user;

            if (!session?.uid) {
                throw new Exception(
                    403,
                    "AUTHENTICATION_ERROR_EXCEPTION",
                    LANG_EN.req.authentication_error_exception,
                    "Authentication Error"
                );
            }

            if (!provider) {
                throw new Exception(
                    201,
                    "PROVIDER_NAME_EXCEPTION",
                    LANG_EN.req.provider_name_required,
                    "Provider Error"
                );
            }

            if (!phone) {
                throw new Exception(
                    201,
                    "PROVIDER_NAME_EXCEPTION",
                    LANG_EN.req.phone_number_required,
                    "Provider Error"
                );
            }

            if (!email) {
                throw new Exception(
                    201,
                    "PHONE_NUMBER_EXCEPTION",
                    LANG_EN.req.email_address_required,
                    "Provider Error"
                );
            }

            if (!code) {
                throw new Exception(
                    201,
                    "PROVIDER_CODE_EXCEPTION",
                    LANG_EN.req.provider_code_required,
                    "Code Error"
                );
            }

            if (!targetApp) {
                throw new Exception(
                    201,
                    "TARGET_APPLICATION_EXCEPTION",
                    LANG_EN.req.target_application_required,
                    "Code Error"
                );
            }

            if (!environ) {
                throw new Exception(
                    201,
                    "PROVIDER_CATEGORY_EXCEPTION",
                    LANG_EN.req.provider_environ_required,
                    "Category Error"
                );
            }

            if (!settings || typeof settings !== "object") {
                throw new Exception(
                    201,
                    "PROVIDER_SETTINGS_EXCEPTION",
                    LANG_EN.req.provider_settings_required,
                    "Settings Error"
                );
            }

            if (description && description.length > 200) {
                throw new Exception(
                    201,
                    "PROVIDER_DESCRIPTION_EXCEPTION",
                    LANG_EN.req.provider_description_limit,
                    "Description Error"
                );
            }

            // enrich
            payload["addedBy"] = session.name || session.email;
            payload["refUserId"] = session.uid;
            payload['isDefault'] = isDefault ? true : false;

            console.log(payload);

            // save using util/repo
            const query = await ApiSettingsUtil.createSettingQuery(payload);

            if (!query) {
                throw new Exception(
                    201,
                    "CREATE_PROVIDER_QUERY_EXCEPTION",
                    LANG_EN.req.create_provider_query_failed,
                    "Provider creation error!"
                );
            }

            return res.status(200).json({
                status: "success",
                message: LANG_EN.req.provider_created_success,
            });
        } catch (error) {
            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status(error.status || 500).json({
                status: "error",
                message: error.message || "Something went wrong. Please try again later.",
                code: error.code || "INTERNAL_SERVER_ERROR",
                title: error.title || "Unexpected Error",
            });
        }
    }

    static async getApiSettingsList(req, res) {
        try {  
            let user = req.session.user;
            let settings = await ApiSettingsUtil.getAllAPISettings(req.query); 
            
            let mex = new mexDtParser(settings);
            settings = mex.addColumn('actions', (col) => {
                let actions = '';
                let id = col['uid'] || col['id'];
                let status = col['status'] || 'unset';  
                
                if (hasPermission(user?.permissions || [], 'settings.edit')) {
                    actions += `<a class="btn btn-sm dropdown-item" href="/users/edit/${id}">
                            <i class="fas fa-edit me-1"></i> Edit
                        </a>`
                }

                if (hasPermission(user?.permissions || [], 'settings.delete')) {
                    actions += `<a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" data-id="${id}">
                            <i class="fas fa-trash-alt me-1"></i> Delete
                        </a>`
                }

                if (hasPermission(user?.permissions || [], 'settings.activate') && ['inactive', 'pending', 'unset'].includes(status)) { 
                    actions += `<a class="btn btn-sm dropdown-item activate" href="javascript:void(0)" data-id="${id}" data-status="active">
                            <i class="fas fa-check-circle me-1"></i> Activate
                        </a>` 
                }

                if (hasPermission(user?.permissions || [], 'settings.deactivate') && ['active', 'unset'].includes(status)) { 
                    actions += `<a class="btn btn-sm dropdown-item deactivate" href="javascript:void(0)" data-id="${id}" data-status="inactive">
                            <i class="fas fa-times-circle me-1"></i> Deactivate
                        </a>` 
                }

                if (hasPermission(user?.permissions || [], 'settings.suspend') && ['active', 'inactive', 'pending', 'unset'].includes(status)) { 
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
                            ${actions}
                        </div>
                    </div>
                `;

                return action_dropdown;
            }) 
            .editColumn('provider', (col) => { 
                return ucwords(col || 'N/A');
            }) 
            .editColumn('addedBy', (col) => { 
                return ucwords(col || 'N/A');
            }) 
            .editColumn('email', (col) => { 
                return (col || 'N/A');
            })
            .editColumn('phone', (col) => { 
                return ucwords(col || 'N/A');
            }) 
            .editColumn('environ', (col) => { 
                return ucwords(col || 'N/A');
            }) 
            .editColumn('targetApp', (col) => { 
                return ucwords(col || 'N/A');
            }) 
            .addColumn('linked_to', (col) => {
                const phone = col['phone'] ? ucwords(col['phone']) : 'N/A';
                const email = col['email'] ? col['email'] : 'N/A';

                return `
                    <div>
                        <div><strong>Phone:</strong> ${phone}</div>
                        <div><strong>Email:</strong> ${email}</div>
                    </div>
                `;
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
                message: 'Settings retrieved successfully.',
                data: settings
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

export default SettingsController;