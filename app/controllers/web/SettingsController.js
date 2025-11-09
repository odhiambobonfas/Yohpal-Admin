import path from 'path';
import bcrypt from 'bcryptjs';
import config from '@config/config';
import User from '@models/User';
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes';
import {
    FirebaseUtility,
    FirestoreDatabase
} from '@utils/FirebaseUtil';
import mexDtParser from '@config/mexDtParser';
import {
    isAjaxRequest,
    ucfirst,
    ucwords,
    handleFileUploads,
    dateToISO8601Formatter,
    jsonParser,
    reduceToObj
} from '@config/utils';
import RolesUtil from '@utils/RolesUtil';
import Binding from '@config/bindings';
import LANG_EN from '@lang/en';
import Util from '@utils/Util';
import Setting from '@models/Setting'
import Application from '@models/Application'
import SettingsUtil from '@utils/SettingsUtil';
import {hasPermission, hasAnyPermission} from '@funcs/permissions';
import qs from "qs"; 
class SettingsController {
    static async index(req, res) {
        let settings = await SettingsUtil.getAllSettings(req.redis);   

        let generalsettings = Object.assign({}, ...(settings?.generalsettings || [])); 

        console.log(generalsettings.companyLogoLocalPath);
        let apisettings = Object.assign({}, ...(settings?.apisettings || [])); 
        let taxsettings = Object.assign({}, ...(settings?.taxsettings || [])); 

        let ypApplications = await Application.ypApplications(req?.redis);

        return res.render("crm/settings/index", {
            title: `${ config.APP.APP_NAME } || App Settings`,
            user: req.session.user,
            generalsetting: generalsettings,
            apisetting: apisettings,
            taxsetting: taxsettings,
            applications: ypApplications
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
                                ${actions || '<span class="dropdown-item text-muted">No Actions</span>'}
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

    static async createUpdateSettings(req, res) {
        try { 
            req.body = qs.parse(req.body);

            let payload; 
            let user;
            const session = user = req.session.user;

            const {type} = req.body;

            if (!type) {
                throw new Exception(
                    403,
                    "TYPE_ERROR_EXCEPTION",
                    LANG_EN.req.request_denied,
                    "Settings type Error"
                );
            }

            if (!session?.uid) {
                throw new Exception(
                    403,
                    "AUTHENTICATION_ERROR_EXCEPTION",
                    LANG_EN.req.authentication_error_exception,
                    "Authentication Error"
                );
            } 
            
            if (type == 'apisetting') {
                const {
                    type,
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

                payload = {
                    type,
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
                
                payload['isDefault'] = isDefault ? true : false;  
            }

            if (type == 'generalsettings') {
                const { generalSetting } = req.body;
                
                const {
                    companyInformation = {},
                    contactInformation = {},
                    otherSettings = {}
                } = generalSetting || {};

                const {
                    company_name,
                    company_website
                } = companyInformation;

                const {
                    company_email,
                    company_phone,
                    company_address
                } = contactInformation;

                const {
                    company_industry,
                    company_registration
                } = otherSettings;
                
                if (!company_name || company_name.trim() === "") {
                    throw new Exception(
                        201,
                        "COMPANY_NAME_EXCEPTION",
                        LANG_EN.req.company_name_required,
                        "Company Name Error"
                    );
                }

                if (!company_email || company_email.trim() === "") {
                    throw new Exception(
                        201,
                        "COMPANY_EMAIL_EXCEPTION",
                        LANG_EN.req.company_email_required,
                        "Company Email Error"
                    );
                }

                if (!company_phone || company_phone.trim() === "") {
                    throw new Exception(
                        201,
                        "COMPANY_PHONE_EXCEPTION",
                        LANG_EN.req.company_phone_required,
                        "Company Phone Error"
                    );
                }

                if (!company_address || company_address.trim() === "") {
                    throw new Exception(
                        201,
                        "COMPANY_ADDRESS_EXCEPTION",
                        LANG_EN.req.company_address_required,
                        "Company Address Error"
                    );
                }
                
                if (company_name.length > 100) {
                    throw new Exception(
                        201,
                        "COMPANY_NAME_LIMIT_EXCEPTION",
                        LANG_EN.req.company_name_limit,
                        "Company Name Length Error"
                    );
                }

                if (company_address.length > 200) {
                    throw new Exception(
                        201,
                        "COMPANY_ADDRESS_LIMIT_EXCEPTION",
                        LANG_EN.req.company_address_limit,
                        "Company Address Length Error"
                    );
                }

                if (company_industry && company_industry.length > 50) {
                    throw new Exception(
                        201,
                        "COMPANY_INDUSTRY_LIMIT_EXCEPTION",
                        LANG_EN.req.company_industry_limit,
                        "Company Industry Error"
                    );
                }

                if (company_registration && company_registration.length > 50) {
                    throw new Exception(
                        201,
                        "COMPANY_REGISTRATION_LIMIT_EXCEPTION",
                        LANG_EN.req.company_registration_limit,
                        "Company Registration Error"
                    );
                }
                
                let companyLogo = '';
                let fileUploadToFb = ''; 
                if (req.file && req.file?.fieldname?.length) {
                    const uploadFilePath = handleFileUploads(req, 'images/logos');

                    if (!uploadFilePath) {
                        throw new Exception(
                            201,
                            "COMPANY_LOGO_UPLOAD_FAILED",
                            LANG_EN.req.company_logo_upload_exemption,
                            "Company logo upload to FB error"
                        );
                    }

                    companyLogo = path
                        .relative(process.cwd(), Array.isArray(uploadFilePath) ? uploadFilePath[0] : uploadFilePath)
                        .replace(/\\/g, "/");

                    const FBUTIL = new FirebaseUtility();
                    fileUploadToFb = await FBUTIL.uploadFile(companyLogo, "company/yohpal/logos", {
                        linkType: "firebase",
                        makePublic: true
                    });

                    if (!fileUploadToFb) {
                        throw new Exception(
                            201,
                            "COMPANY_LOGO_UPLOAD_FAILED",
                            LANG_EN.req.company_logo_upload_exemption,
                            "Company logo upload to FB error"
                        );
                    }
                }

                const companyLogoLocalPath = companyLogo.replace('public', '');
                const companyLogoFbPath = fileUploadToFb;

                // Attach logo paths
                generalSetting.otherSettings = {
                    ...generalSetting.otherSettings,
                    companyLogoLocalPath,
                    companyLogoFbPath
                };
                
                payload = { 
                    type,
                    generalSetting
                };
            }

            const finalPayload = {
                userLoggedInUserName: user.name,
                userLoggedInUid: user.uid,
                ...payload
            } 
            
            const query = await SettingsUtil.createSettingQuery(finalPayload, req?.redis);

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
                code: error.code || "INTERNAL_SERVER_ERROR",
                message: error.message || "Something went wrong. Please try again later.",
                title: error.title || "Unexpected Error",
            });
        }
    }

    static async getApiSettingsList(req, res) {
        try {  
            let user = req.session.user;
            let settings = await SettingsUtil.getAllAPISettings(req.redis, req.query); 
            
            let mex = new mexDtParser(settings);
            settings = mex.addColumn('actions', (col) => {
                let actions = '';
                let id = col['uid'] || col['id'];
                let targetApp = col['targetApp'] || 'yohpal';
                let status = col['status'] || 'unset'; 
                let provider = col.provider?.toLowerCase();
                
                if (hasPermission(user?.permissions || [], 'settings.api.edit')) {
                    actions += `<a class="btn btn-sm dropdown-item edit" href="javascript:void(0)" data-target="${targetApp}" data-id="${id}" target-modal=".editApiSettingModal">
                            <i class="fas fa-edit me-1"></i> Edit
                        </a>`
                }

                if (hasPermission(user?.permissions || [], 'settings.api.delete')) {
                    actions += `<a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" data-target="${targetApp}" data-id="${id}">
                            <i class="fas fa-trash-alt me-1"></i> Delete
                        </a>`
                }

                if (hasPermission(user?.permissions || [], 'settings.api.activate') && ['inactive', 'pending', 'unset'].includes(status)) { 
                    actions += `<a class="btn btn-sm dropdown-item activate" href="javascript:void(0)" data-target="${targetApp}" data-id="${id}" data-status="active">
                            <i class="fas fa-check-circle me-1"></i> Activate
                        </a>` 
                }

                if (hasPermission(user?.permissions || [], 'settings.api.deactivate') && ['active', 'unset'].includes(status)) { 
                    actions += `<a class="btn btn-sm dropdown-item deactivate" href="javascript:void(0)" data-target="${targetApp}" data-id="${id}" data-status="inactive">
                            <i class="fas fa-times-circle me-1"></i> Deactivate
                        </a>` 
                }

                if (hasPermission(user?.permissions || [], 'settings.api.suspend') && ['active', 'inactive', 'pending', 'unset'].includes(status)) { 
                    actions += `<a class="btn btn-sm dropdown-item suspend" href="javascript:void(0)" data-target="${targetApp}" data-id="${id}" data-status="suspended">
                            <i class="fas fa-user-slash me-1"></i> Suspend
                        </a>` 
                }

                if (hasPermission(user?.permissions || [], 'settings.mpesa.register_endpoint') && provider == 'mpesa' && status == 'active') { 
                    actions += `<a class="btn btn-sm dropdown-item register_endpoint" href="javascript:void(0)" data-target="${targetApp}" data-id="${id}" target-modal=".registerApiCallbackModal">
                            <i class="fas fa-globe me-1"></i> Register Endpoint
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
            .addColumn('_provider', (col) => { 
                let provider = ucwords(col.provider || 'N/A');
                if (col.isDefault) {
                    provider += ' <sup class="text-danger fw-bold text-sm">default</sup>';
                }
                return provider;
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
                data: settings
            });
        } catch (error) {
            if (error instanceof Exception && config.APP.APP_DEBUG) { 
                error.mexLogger();
            }
            
            return res.status((error.status || 500)).json({
                status: 'error', 
                code: error.code ||  'INTERNAL_SERVER_ERROR',
                title: error.title || 'Unexpected Error'
            });
        }
    }

    static async editApiSettingRes(req, res) {
        try { 
            let post = req.query;
            if (post.modal) { 
                let ypApplications = await Application.ypApplications(req?.redis);

                const data = {
                    id: post.clickedId,
                    targetApp: post.targetApp,
                    settingType: "apisetting",
                    flushCache: post?.flushCache ? true : false
                };

                let apiSet = await SettingsUtil.getApiSettingById(req?.redis, data);  
                return res.render('views/crm/settings/partials/edit-api-setting', { 
                    user: req.session.user,
                    applications: ypApplications,
                    setting: apiSet
                }); 
            } 

            if (!post.modal) {
                let payload;  
                let { id } = req.params;
                let user = req.session.user; 
                req.body = qs.parse(req.body);

                if (!user?.uid) {
                    throw new Exception(
                        403,
                        "AUTHENTICATION_ERROR_EXCEPTION",
                        LANG_EN.req.authentication_error_exception,
                        "Authentication Error"
                    );
                } 
                
                const { 
                    type,
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

                payload = {
                    id,
                    type,
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
                
                payload['isDefault'] = isDefault ? true : false;   

                const finalPayload = {
                    userLoggedInUserName: user.name,
                    userLoggedInUid: user.uid,
                    ...payload
                } 
                
                const query = await SettingsUtil.updateApiSettingQuery(finalPayload, req?.redis);

                if (!query) {
                    throw new Exception(
                        201,
                        "UPDATE_PROVIDER_QUERY_EXCEPTION",
                        LANG_EN.error.update_provider_query_failed,
                        "Provider update error!"
                    );
                }

                return res.status(200).json({
                    status: "success",
                    message: LANG_EN.success.provider_update_success,
                });
            }

        } catch (error) {
            console.log(error.message);
            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status(error.status || 500).json({
                status: "error",
                code: error.code || "INTERNAL_SERVER_ERROR",
                message: error.message || "Something went wrong. Please try again later.",
                title: error.title || "Unexpected Error",
            });
        }
    }

    static async createCdnSettingsList(req, res) {
        try {
            const post = req.body;
            const user = req.session.user;
            
            if (!post.cdnProvider || post.cdnProvider.trim() === "") {
                throw new Exception(
                    201,
                    "CDN_PROVIDER_REQUIRED",
                    LANG_EN.req.cdn_provider_required,
                    "CDN provider is required"
                );
            }

            if (!post.code || post.code.trim() === "") {
                throw new Exception(
                    201,
                    "CDN_CODE_REQUIRED",
                    LANG_EN.req.cdn_code_required,
                    "CODE is required"
                );
            }

            if (!post.targetApp || post.targetApp.trim() === "") {
                throw new Exception(
                    201,
                    "TARGET_APP_REQUIRED",
                    LANG_EN.req.target_app_required,
                    "Target application name is required"
                );
            }

            if (!post.cdnUrl || post.cdnUrl.trim() === "") {
                throw new Exception(
                    201,
                    "CDN_URL_REQUIRED",
                    LANG_EN.req.cdn_url_required,
                    "CDN base URL is required"
                );
            }

            if (post.cdnUrl && post.cdnUrl.length > 255) {
                throw new Exception(
                    201,
                    "CDN_URL_TOO_LONG",
                    LANG_EN.req.cdn_url_too_long,
                    "CDN base URL exceeds maximum length"
                );
            }

            if (!post.cdnZoneId || post.cdnZoneId.trim() === "") {
                throw new Exception(
                    201,
                    "CDN_ZONE_ID_REQUIRED",
                    LANG_EN.req.cdn_zone_id_required,
                    "CDN Zone / Distribution ID is required"
                );
            }

            if (post.cacheDuration && (isNaN(post.cacheDuration) || post.cacheDuration < 0)) {
                throw new Exception(
                    201,
                    "INVALID_CACHE_DURATION",
                    LANG_EN.req.invalid_cache_duration,
                    "Cache duration must be a valid positive number"
                );
            }

            if (!post.cdnStatus || !["enabled", "disabled"].includes(post.cdnStatus.toLowerCase())) {
                throw new Exception(
                    201,
                    "INVALID_CDN_STATUS",
                    LANG_EN.req.invalid_cdn_status,
                    "CDN status must be either 'enabled' or 'disabled'"
                );
            }

            if (post.cdnModule && post.cdnModule.length > 100) {
                throw new Exception(
                    201,
                    "CDN_MODULE_TOO_LONG",
                    LANG_EN.req.cdn_module_too_long,
                    "CDN module name exceeds maximum length"
                );
            }
            
            const finalPayload = {
                userLoggedInUid: user?.uid,
                userLoggedInUserName: user?.name,
                ...post,
            };
            
            const result = await SettingsUtil.createCdnSettingQuery(finalPayload, req?.redis);
            if (!result) {
                throw new Exception(
                    500,
                    "CDN_SETTING_CREATE_FAILED",
                    LANG_EN.error.cdn_setting_creation_failed,
                    "Database error while creating CDN setting"
                );
            }
            
            return res.status(200).json({
                status: "success",
                message: LANG_EN.success.cdn_setting_created,
                data: result,
            });

        } catch (error) {
            console.log(error.message);

            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status(error.status || 500).json({
                status: "error",
                code: error.code || "INTERNAL_SERVER_ERROR",
                message: error.message || "Something went wrong. Please try again later.",
                title: error.title || "Unexpected Error",
            });
        }
    }

    static async getCdnSettingsList(req, res) { 
        try {  
            const user = req.session.user; 
            let ypApplications = await Application.ypApplications(req?.redis);
            let cdnSettings = await SettingsUtil.getAllCdnSettings(req.redis, req.query);

            const mex = new mexDtParser(cdnSettings);
            cdnSettings = mex
                .addColumn('actions', (col) => {
                    let actions = '';
                    const id = col.uid || col.id;
                    const status = col.status || 'unset';
                    let targetApp = col['targetApp'] || 'yohpal'; 

                    if (hasPermission(user?.permissions || [], 'settings.cdn.edit')) {
                        actions += `
                            <a class="btn btn-sm dropdown-item edit" href="javascript:void(0)" data-id="${id}" target-modal=".editCdnSettingModal" data-target="${targetApp}" data-id="${id}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`;
                    }
                    
                    if (hasPermission(user?.permissions || [], 'settings.cdn.delete')) {
                        actions += `
                            <a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" data-target="${targetApp}" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`;
                    }
                    
                    if (hasPermission(user?.permissions || [], 'settings.cdn.activate') && ['enabled', 'disabled', 'unset'].includes(status)) {
                        actions += `
                            <a class="btn btn-sm dropdown-item activate" href="javascript:void(0) data-target="${targetApp}"" data-id="${id}" data-status="active">
                                <i class="fas fa-check-circle me-1"></i> Activate
                            </a>`;
                    }
                    
                    if (hasPermission(user?.permissions || [], 'settings.cdn.deactivate') && ['enabled', 'unset'].includes(status)) {
                        actions += `
                            <a class="btn btn-sm dropdown-item deactivate" href="javascript:void(0)" data-target="${targetApp}" data-id="${id}" data-status="disabled">
                                <i class="fas fa-times-circle me-1"></i> Deactivate
                            </a>`;
                    }
                    
                    if (hasPermission(user?.permissions || [], 'settings.cdn.suspend') && ['enabled', 'disabled', 'unset'].includes(status)) {
                        actions += `
                            <a class="btn btn-sm dropdown-item suspend" href="javascript:void(0)" data-target="${targetApp}" data-id="${id}" data-status="suspended">
                                <i class="fas fa-user-slash me-1"></i> Suspend
                            </a>`;
                    }

                    const actionDropdown = `
                        <div class="dropdown">
                            <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="triggerId" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                Actions
                            </button>
                            <div class="dropdown-menu action-btns" aria-labelledby="triggerId">
                                ${actions || '<span class="dropdown-item text-muted">No Actions</span>'}
                            </div>
                        </div>
                    `;
                    return actionDropdown;
                })
                .editColumn('provider', (col) => { 
                    return ucwords(col || 'N/A'); 
                })
                .editColumn('baseUrl', (col) => col || 'N/A')
                .editColumn('zoneId', (col) => col || 'N/A')
                .editColumn('cacheDuration', (col) => col ? `${col} hrs` : 'N/A')
                .editColumn('module', (col) => ucwords(col || 'N/A'))
                .addColumn('linkedTo', (col) => {
                    const linkedSlug = col.targetApp || 'N/A';
                    const matchedApp = ypApplications.find(app => app.slug === linkedSlug);  
                    return `<span>${matchedApp?.name}</span>`;
                })
                .editColumn('status', (col) => {
                    col = col ? col.toLowerCase() : 'disabled';
                    if (col === 'enabled') {
                        return `<span class="badge text-dark bg-success">${ucfirst(col)}</span>`;
                    } else if (col === 'disabled') {
                        return `<span class="badge text-dark bg-warning">${ucfirst(col)}</span>`;
                    } else if (col === 'suspended') {
                        return `<span class="badge text-dark bg-danger">${ucfirst(col)}</span>`;
                    } else {
                        return `<span class="badge text-dark bg-secondary">Unknown</span>`;
                    }
                })
                .editColumn('createdAt', (col) =>{
                    return dateToISO8601Formatter(col?.toDate?.() || col || '');
                })
                .make();

            return res.status(200).json({
                status: 'success', 
                data: cdnSettings
            });

        } catch (error) {
            console.log(error);
            if (error instanceof Exception && config.APP.APP_DEBUG) { 
                error.mexLogger();
            }

            return res.status(error.status || 500).json({
                status: 'error', 
                code: error.code || 'INTERNAL_SERVER_ERROR',
                title: error.title || 'Unexpected Error'
            });
        }
    } 

    static async updateCdnSettingsList(req, res) {
        try { 
            let post = req.query;
            let { id } = req?.params;
            let user = req.session.user; 
            
            if (post.modal) { 
                let ypApplications = await Application.ypApplications(req?.redis);

                const data = {
                    id: id,
                    targetApp: post.targetApp,
                    settingType: "cdnSettings",
                    flushCache: post?.flushCache ? true : false
                };

                let cdnSet = await SettingsUtil.getCdnSettingById(req?.redis, data);  
                return res.render('views/crm/settings/partials/edit-cdn-setting', { 
                    user: req.session.user,
                    applications: ypApplications,
                    setting: cdnSet
                }); 
            } 

            post = qs.parse(req.body);
            post.id = id;

            if (!post.modal) {    
                if (!user?.uid) {
                    throw new Exception(
                        403,
                        "AUTHENTICATION_ERROR_EXCEPTION",
                        LANG_EN.req.authentication_error_exception,
                        "Authentication Error"
                    );
                } 

                if (!post.cdnProvider || post.cdnProvider.trim() === "") {
                    throw new Exception(
                        201,
                        "CDN_PROVIDER_REQUIRED",
                        LANG_EN.req.cdn_provider_required,
                        "CDN provider is required"
                    );
                }

                if (!post.code || post.code.trim() === "") {
                    throw new Exception(
                        201,
                        "CDN_CODE_REQUIRED",
                        LANG_EN.req.cdn_code_required,
                        "CODE is required"
                    );
                }

                if (!post.targetApp || post.targetApp.trim() === "") {
                    throw new Exception(
                        201,
                        "TARGET_APP_REQUIRED",
                        LANG_EN.req.target_app_required,
                        "Target application name is required"
                    );
                }

                if (!post.cdnUrl || post.cdnUrl.trim() === "") {
                    throw new Exception(
                        201,
                        "CDN_URL_REQUIRED",
                        LANG_EN.req.cdn_url_required,
                        "CDN base URL is required"
                    );
                }

                if (post.cdnUrl && post.cdnUrl.length > 255) {
                    throw new Exception(
                        201,
                        "CDN_URL_TOO_LONG",
                        LANG_EN.req.cdn_url_too_long,
                        "CDN base URL exceeds maximum length"
                    );
                }

                if (!post.cdnZoneId || post.cdnZoneId.trim() === "") {
                    throw new Exception(
                        201,
                        "CDN_ZONE_ID_REQUIRED",
                        LANG_EN.req.cdn_zone_id_required,
                        "CDN Zone / Distribution ID is required"
                    );
                }

                if (post.cacheDuration && (isNaN(post.cacheDuration) || post.cacheDuration < 0)) {
                    throw new Exception(
                        201,
                        "INVALID_CACHE_DURATION",
                        LANG_EN.req.invalid_cache_duration,
                        "Cache duration must be a valid positive number"
                    );
                }

                if (!post.cdnStatus || !["enabled", "disabled"].includes(post.cdnStatus.toLowerCase())) {
                    throw new Exception(
                        201,
                        "INVALID_CDN_STATUS",
                        LANG_EN.req.invalid_cdn_status,
                        "CDN status must be either 'enabled' or 'disabled'"
                    );
                }

                if (post.cdnModule && post.cdnModule.length > 100) {
                    throw new Exception(
                        201,
                        "CDN_MODULE_TOO_LONG",
                        LANG_EN.req.cdn_module_too_long,
                        "CDN module name exceeds maximum length"
                    );
                }
                
                const finalPayload = {
                    userLoggedInUid: user?.uid,
                    userLoggedInUserName: user?.name,
                    ...post,
                };
                
                const result = await SettingsUtil.updateCdnSettingQuery(finalPayload, req?.redis);
                if (!result) {
                    throw new Exception(
                        500,
                        "CDN_SETTING_CREATE_FAILED",
                        LANG_EN.error.cdn_setting_update_failed,
                        "Database error while creating CDN setting"
                    );
                }
                
                return res.status(200).json({
                    status: "success",
                    message: LANG_EN.success.cdn_setting_updated,
                    data: result,
                }); 
            }
        } catch (error) {
            console.log(error.message);
            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status(error.status || 500).json({
                status: "error",
                code: error.code || "INTERNAL_SERVER_ERROR",
                message: error.message || "Something went wrong. Please try again later.",
                title: error.title || "Unexpected Error",
            });
        }
    }

    static async createCpanelSettingsList(req, res) {
        try {
            const post = req.body;
            const user = req.session.user;

            if (!post.cpanelHost || post.cpanelHost.trim() === "") {
                throw new Exception(
                    201,
                    "CPANEL_HOST_REQUIRED",
                    LANG_EN.req.cpanel_host_required,
                    "CPanel host URL is required"
                );
            }

            if (!post.cpanelUsername || post.cpanelUsername.trim() === "") {
                throw new Exception(
                    201,
                    "CPANEL_USERNAME_REQUIRED",
                    LANG_EN.req.cpanel_username_required,
                    "CPanel username is required"
                );
            }

            if (!post.cpanelPassword || post.cpanelPassword.trim() === "") {
                throw new Exception(
                    201,
                    "CPANEL_PASSWORD_REQUIRED",
                    LANG_EN.req.cpanel_password_required,
                    "CPanel password is required"
                );
            }

            if (post.cpanelApiToken && post.cpanelApiToken.length > 255) {
                throw new Exception(
                    201,
                    "CPANEL_API_TOKEN_TOO_LONG",
                    LANG_EN.req.cpanel_api_token_too_long,
                    "API Token exceeds maximum length"
                );
            }

            if (!post.linkedDomain || post.linkedDomain.trim() === "") {
                throw new Exception(
                    201,
                    "LINKED_DOMAIN_REQUIRED",
                    LANG_EN.req.linked_domain_required,
                    "Linked domain is required"
                );
            }

            if (post.linkedDomain && post.linkedDomain.length > 255) {
                throw new Exception(
                    201,
                    "LINKED_DOMAIN_TOO_LONG",
                    LANG_EN.req.linked_domain_too_long,
                    "Linked domain exceeds maximum length"
                );
            }

            if (post.isDefault && ![0, 1, "0", "1", true, false].includes(post.isDefault)) {
                throw new Exception(
                    201,
                    "INVALID_IS_DEFAULT",
                    LANG_EN.req.invalid_is_default,
                    "Invalid value for default server option"
                );
            }

            const finalPayload = {
                userLoggedInUid: user?.uid,
                userLoggedInUserName: user?.name,
                ...post,
            }; 

            const result = await SettingsUtil.createCpanelSettingQuery(finalPayload, req?.redis);
            if (!result) {
                throw new Exception(
                    500,
                    "CPANEL_SETTING_CREATE_FAILED",
                    LANG_EN.error.cpanel_setting_creation_failed,
                    "Database error while creating CPanel setting"
                );
            }

            return res.status(200).json({
                status: "success",
                message: LANG_EN.success.cpanel_setting_created,
                data: result,
            });

        } catch (error) {
            console.log(error.message);

            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status(error.status || 500).json({
                status: "error",
                code: error.code || "INTERNAL_SERVER_ERROR",
                message: error.message || "Something went wrong. Please try again later.",
                title: error.title || "Unexpected Error",
            });
        }
    }
    
    static async getCpanelSettingsList(req, res) {
        try {
            const user = req.session.user; 
            let ypApplications = await Application.ypApplications(req?.redis);
            let cpanelSettings = await SettingsUtil.getAllCpanelSettings(req.redis, req.query);

            const mex = new mexDtParser(cpanelSettings);
            cpanelSettings = mex
                .addColumn('actions', (col) => {
                    let actions = '';
                    const id = col.uid || col.id;
                    const status = col.status || 'disabled';
                    const targetApp = col.targetApp || 'yohpal'; 

                    if (hasPermission(user?.permissions || [], 'settings.cpanel.edit')) {
                        actions += `
                            <a class="btn btn-sm dropdown-item edit" href="javascript:void(0)" 
                                data-id="${id}" target-modal=".editCpanelSettingModal">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`;
                    }

                    if (hasPermission(user?.permissions || [], 'settings.cpanel.delete')) {
                        actions += `
                            <a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" 
                                data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`;
                    }

                    if (hasPermission(user?.permissions || [], 'settings.cpanel.activate') && ['disabled'].includes(status)) {
                        actions += `
                            <a class="btn btn-sm dropdown-item activate" href="javascript:void(0)" 
                                data-id="${id}" data-status="enabled">
                                <i class="fas fa-check-circle me-1"></i> Activate
                            </a>`;
                    }

                    if (hasPermission(user?.permissions || [], 'settings.cpanel.deactivate') && ['enabled'].includes(status)) {
                        actions += `
                            <a class="btn btn-sm dropdown-item deactivate" href="javascript:void(0)" 
                                data-id="${id}" data-status="disabled">
                                <i class="fas fa-times-circle me-1"></i> Deactivate
                            </a>`;
                    }

                    const actionDropdown = `
                        <div class="dropdown">
                            <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Actions
                            </button>
                            <div class="dropdown-menu action-btns">
                                ${actions || '<span class="dropdown-item text-muted">No Actions</span>'}
                            </div>
                        </div>`;
                    return actionDropdown;
                })
                .editColumn('cpanelHost', (col) => col || 'N/A')
                .editColumn('cpanelUsername', (col) => col || 'N/A')
                .editColumn('cpanelApiToken', (col) => col ? `${col.slice(0, 10)}...` : '<em>Not Set</em>')
                .editColumn('linkedDomain', (col) => col || 'N/A')
                .addColumn('status', (col) => {
                    col = col?.cpanelStatus?.toLowerCase();
                    if (col === 'enabled') {
                        return `<span class="badge text-dark bg-success">${ucfirst(col)}</span>`;
                    } else if (col === 'disabled') {
                        return `<span class="badge text-dark bg-warning">${ucfirst(col)}</span>`;
                    } else if (col === 'suspended') {
                        return `<span class="badge text-dark bg-danger">${ucfirst(col)}</span>`;
                    }
                    return `<span class="badge text-dark bg-secondary">Unknown</span>`;
                })
                .editColumn('createdAt', (col) => dateToISO8601Formatter(col?.toDate?.() || col || ''))
                .make();

            return res.status(200).json({
                status: 'success',
                data: cpanelSettings
            });

        } catch (error) {
            console.log(error);
            if (error instanceof Exception && config.APP.APP_DEBUG) { 
                error.mexLogger();
            }

            return res.status(error.status || 500).json({
                status: 'error',
                code: error.code || 'INTERNAL_SERVER_ERROR',
                title: error.title || 'Unexpected Error'
            });
        }
    }

    static async updateCpanelSettingsList(req, res) {
        try {
            let post = req.query;
            let { id } = req?.params;
            let user = req.session.user;

            if (post.modal) {
                let ypApplications = await Application.ypApplications(req?.redis);

                const data = {
                    id: id,
                    targetApp: post.targetApp,
                    settingType: "cpanelSettings",
                    flushCache: post?.flushCache ? true : false
                };

                let cpanelSet = await SettingsUtil.getCpanelSettingById(req?.redis, data);
                return res.render('views/crm/settings/partials/edit-cpanel-setting', {
                    user: req.session.user,
                    applications: ypApplications,
                    setting: cpanelSet
                });
            }

            post = qs.parse(req.body);
            post.id = id;

            if (!post.modal) {
                if (!user?.uid) {
                    throw new Exception(
                        403,
                        "AUTHENTICATION_ERROR_EXCEPTION",
                        LANG_EN.req.authentication_error_exception,
                        "Authentication Error"
                    );
                }

                if (!post.cpanelHost || post.cpanelHost.trim() === "") {
                    throw new Exception(
                        201,
                        "CPANEL_HOST_REQUIRED",
                        LANG_EN.req.cpanel_host_required,
                        "CPanel host address is required"
                    );
                }

                if (!post.cpanelUsername || post.cpanelUsername.trim() === "") {
                    throw new Exception(
                        201,
                        "CPANEL_USERNAME_REQUIRED",
                        LANG_EN.req.cpanel_username_required,
                        "CPanel username is required"
                    );
                }

                if (!post.cpanelPassword || post.cpanelPassword.trim() === "") {
                    throw new Exception(
                        201,
                        "CPANEL_PASSWORD_REQUIRED",
                        LANG_EN.req.cpanel_password_required,
                        "CPanel password is required"
                    );
                }

                if (!post.cpanelApiToken || post.cpanelApiToken.trim() === "") {
                    throw new Exception(
                        201,
                        "CPANEL_API_TOKEN_REQUIRED",
                        LANG_EN.req.cpanel_api_token_required,
                        "CPanel API token is required"
                    );
                }

                if (!post.targetApp || post.targetApp.trim() === "") {
                    throw new Exception(
                        201,
                        "TARGET_APP_REQUIRED",
                        LANG_EN.req.target_app_required,
                        "Target application name is required"
                    );
                }

                if (post.cpanelHost && post.cpanelHost.length > 255) {
                    throw new Exception(
                        201,
                        "CPANEL_HOST_TOO_LONG",
                        LANG_EN.req.cpanel_host_too_long,
                        "CPanel host exceeds maximum length"
                    );
                }

                if (post.cpanelModule && post.cpanelModule.length > 100) {
                    throw new Exception(
                        201,
                        "CPANEL_MODULE_TOO_LONG",
                        LANG_EN.req.cpanel_module_too_long,
                        "CPanel module name exceeds maximum length"
                    );
                }

                const finalPayload = {
                    userLoggedInUid: user?.uid,
                    userLoggedInUserName: user?.name,
                    ...post,
                };

                const result = await SettingsUtil.updateCpanelSettingQuery(finalPayload, req?.redis);
                if (!result) {
                    throw new Exception(
                        500,
                        "CPANEL_SETTING_UPDATE_FAILED",
                        LANG_EN.error.cpanel_setting_update_failed,
                        "Database error while updating CPanel setting"
                    );
                }

                return res.status(200).json({
                    status: "success",
                    message: LANG_EN.success.cpanel_setting_updated,
                    data: result,
                });
            }
        } catch (error) {
            console.log(error.message);
            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status(error.status || 500).json({
                status: "error",
                code: error.code || "INTERNAL_SERVER_ERROR",
                message: error.message || "Something went wrong. Please try again later.",
                title: error.title || "Unexpected Error",
            });
        }
    }

}

export default SettingsController;