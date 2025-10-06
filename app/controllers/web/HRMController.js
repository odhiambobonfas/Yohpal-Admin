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
    jsonParser,
    reduceToObj
} from '@config/utils';
import RolesUtil from '@utils/RolesUtil';
import Binding from '@config/bindings';
import LANG_EN from '@lang/en';
import Util from '@utils/Util';
import Setting from '@models/Setting'
import SettingsUtil from '@utils/SettingsUtil';
import {hasPermission, hasAnyPermission} from '@funcs/permissions';
import qs from "qs"; 
class HRMController {
    static async index(req, res) {
        let settings = await SettingsUtil.getAllSettings();   

        let generalsettings = Object.assign({}, ...(settings?.generalsettings || [])); 
        let apisettings = Object.assign({}, ...(settings?.apisettings || [])); 
        let taxsettings = Object.assign({}, ...(settings?.taxsettings || [])); 
 
        return res.render("crm/hrm/index", {
            title: `${ config.APP.APP_NAME } || HRM`,
            user: req.session.user,
            generalsetting: generalsettings,
            apisetting: apisettings,
            taxsetting: taxsettings
        });
    }

    static async departments(req, res) {
        return res.render("crm/hrm/departments", {
            title: `${ config.APP.APP_NAME } || HRM`,
            user: req.session.user, 
        });
    }

    static async designations(req, res) { 
        return res.render("crm/hrm/designations", {
            title: `${ config.APP.APP_NAME } || HRM`,
            user: req.session.user
        });
    }
}

export default HRMController;