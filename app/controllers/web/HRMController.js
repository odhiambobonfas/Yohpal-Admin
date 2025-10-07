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
import HRMUtil from '@utils/HRMUtil';
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
        try {
            if (isAjaxRequest(req)) {
                const post = req.body;
                let user = req.session.user; 

                if (!post.departmentName || post.departmentName.trim() === "") {
                    throw new Exception(
                        201,
                        "DEPARTMENT_NAME_REQUIRED",
                        LANG_EN.req.department_name_required,
                        "Missing department name"
                    );
                }
    
                if (post.departmentCode && post.departmentCode.length > 10) {
                    throw new Exception(
                        201,
                        "DEPARTMENT_CODE_INVALID",
                        LANG_EN.req.department_code_too_long,
                        "Department code too long"
                    );
                }
    
                if (post.departmentHead && isNaN(post.departmentHead)) {
                    throw new Exception(
                        201,
                        "DEPARTMENT_HEAD_INVALID",
                        LANG_EN.req.department_head_invalid,
                        "Invalid department head ID"
                    );
                }
    
                if (post.departmentDescription && post.departmentDescription.length > 500) {
                    throw new Exception(
                        201,
                        "DEPARTMENT_DESCRIPTION_TOO_LONG",
                        LANG_EN.req.department_description_too_long,
                        "Description too long"
                    );
                }

                const finalPayload = {
                    userLoggedInUserName: user.name,
                    userLoggedInUid: user.uid,
                    ...post
                }

                const result = await HRMUtil.createDepartmentQuery(finalPayload);
    
                if (!result) {
                    throw new Exception(
                        500,
                        "DEPARTMENT_CREATE_FAILED",
                        LANG_EN.error.department_creation_failed,
                        "Database Error"
                    );
                }
    
                return res.status(200).json({
                    status: 'success',
                    message: LANG_EN.success.department_created,
                    data: result,
                });
            }    
        } catch (error) {
            console.log(error.message);
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

        return res.render("crm/hrm/departments", {
            title: `${ config.APP.APP_NAME } || HRM`,
            user: req.session.user, 
        });
    }

    static async designations(req, res) { 
        try {
            if (isAjaxRequest(req)) {
                const post = req.body;
                let user = req.session.user; 
                
                if (!post.designationName || post.designationName.trim() === "") {
                    throw new Exception(
                        201,
                        "DESIGNATION_NAME_REQUIRED",
                        LANG_EN.req.designation_name_required,
                        "Missing designation name"
                    );
                }

                if (post.designationCode && post.designationCode.length > 10) {
                    throw new Exception(
                        201,
                        "DESIGNATION_CODE_INVALID",
                        LANG_EN.req.designation_code_too_long,
                        "Designation code too long"
                    );
                }

                if (!post.departmentId || isNaN(post.departmentId)) {
                    throw new Exception(
                        201,
                        "DEPARTMENT_ID_REQUIRED",
                        LANG_EN.req.department_id_required,
                        "Missing or invalid department ID"
                    );
                }

                if (post.basicSalary && (isNaN(post.basicSalary) || post.basicSalary < 0)) {
                    throw new Exception(
                        201,
                        "BASIC_SALARY_INVALID",
                        LANG_EN.req.basic_salary_invalid,
                        "Invalid basic salary value"
                    );
                }

                if (post.designationDescription && post.designationDescription.length > 500) {
                    throw new Exception(
                        201,
                        "DESIGNATION_DESCRIPTION_TOO_LONG",
                        LANG_EN.req.designation_description_too_long,
                        "Description too long"
                    );
                }


                const finalPayload = {
                    userLoggedInUserName: user.name,
                    userLoggedInUserName: user.uid,
                    ...post
                }

                const result = await HRMUtil.createDesignationQuery(finalPayload);

                if (!result) {
                    throw new Exception(
                        500,
                        "DESIGNATION_CREATE_FAILED",
                        LANG_EN.error.designation_creation_failed,
                        "Database Error"
                    );
                }
                
                return res.status(200).json({
                    status: 'success',
                    message: LANG_EN.success.designation_created,
                    data: result,
                });
            } 
        } catch (error) {
            console.log(error);
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

        return res.render("crm/hrm/designations", {
            title: `${ config.APP.APP_NAME } || HRM`,
            user: req.session.user
        });
    }
}

export default HRMController;