import path from 'path';
import bcrypt from 'bcryptjs';
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

class MpesaController {
    static async registerEndpoint(req, res) {
        const post = !isAjaxRequest(req) ? req.body : req.query;
        
        if (post.modal) { 
            let ypApplications = await Application.ypApplications();

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
    }
}

export default MpesaController;
