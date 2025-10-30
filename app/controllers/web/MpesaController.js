import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@config/config';
import User from '@models/User';
import Exception from '@config/exceptions'; 
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
import qs from 'qs'; 

class MpesaController {
    static async registerEndpoint(req, res) { 
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
                return res.render('views/crm/settings/partials/register-api-endpoints', { 
                    user: req.session.user,
                    applications: ypApplications,
                    setting: apiSet
                }); 
            } 
            
            if (!post.modal) {
                post = qs.parse(req.body); 
                const user = req.session.user; 
                
                let callbacks = post?.callback || [];
                
                if (!callbacks.confirmation || callbacks.confirmation.trim() === "") {
                    throw new Exception(
                        201,
                        "CONFIRMATION_URL_REQUIRED",
                        LANG_EN.req.confirmation_url_required,
                        "Confirmation callback URL is required"
                    );
                }
                
                if (!callbacks.validation || callbacks.validation.trim() === "") {
                    throw new Exception(
                        201,
                        "VALIDATION_URL_REQUIRED",
                        LANG_EN.req.validation_url_required,
                        "Validation callback URL is required"
                    );
                }

                const endpoint1 = Binding.endpoints.registerCallbacks;
                let secret = jwt.sign({yohpalApiSecret: config.APP.APP_SECRET}, config.APP.APP_SECRET, {
                    expiresIn: config.AUTH.TOKEN_EXPIRY || '1h'
                });
                
                const body = {
                    id: post?.clickedId,
                    targetApp: post?.targetApp,
                    settingType: post?.settingType, // optional though...
                    validation: callbacks.validation,
                    confirmation: callbacks.confirmation,
                };
                
                const result = await fetch(endpoint1.route, {
                    credentials: 'include',
                    method: endpoint1.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${secret}`
                    },
                    body: JSON.stringify(body)
                });

                if (!result.ok) {
                    const text = await result.text();
                    console.error("Server responded with error:", result.status, text);
                    throw new Exception(result.status, "CALLBACK_REGISTRATION_FAILED", text || "Callback registration request failed.", "FetchError");
                }

                let response = await result.json(); 
                
                if (!response.status) {
                    throw new Exception(201, 'INVALID_RESPONSE', LANG_EN.error.generic_error, 'Invalid API response error!');
                }

                if (response.status == 'error') {
                    throw new Exception(
                        result.status || 201, 
                        response.code || 'INVALID_RESPONSE', 
                        response.message || LANG_EN.error.generic_error, 
                        response.title || 'Invalid API response error!'
                    );
                }

                return res.status(200).json({
                    status: response.status,
                    message: LANG_EN.success.api_callbacks_registered_successfully,
                    data: result
                }); 
            } 
        } catch (error) {
            console.log(error.message);
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
}

export default MpesaController;
