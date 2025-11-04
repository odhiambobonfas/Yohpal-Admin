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

class CommunicationController {
    static async mailBox(req, res) { 
        try {  
            return res.render("crm/communication/mails/index", {
                title: `${ config.APP.APP_NAME } || App Settings`,
                user: req.session.user, 
            }); 
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

    static async emailsList(req, res) { 
        try {  
            const cpanelServers = [];
            return res.render("crm/communication/mails/index", {
                title: `${ config.APP.APP_NAME } || App Settings`,
                user: req.session.user, 
                cpanelServers: cpanelServers || []
            }); 
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

export default CommunicationController;
