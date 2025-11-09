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
import NotificationTemplate from '@models/NotificationTemplate'
import NotificationUtil from '@utils/NotificationUtil';
import {hasPermission, hasAnyPermission} from '@funcs/permissions';
import qs from 'qs'; 

class NotificationController {
    static async index(req, res) { 
        try { 
            if (isAjaxRequest(req)) {
                return res.status(200).json({
                    status: 'success', 
                    data: []
                });
            }

            const templateCategoriesForDropdown = await NotificationTemplate.templateCategoriesForDropdown(req?.redis); 
            return res.render("crm/notificationTemp/index", {
                title: `${ config.APP.APP_NAME } || Notification Template Management`,
                user: req.session.user, 
                templateCategoriesForDropdown: templateCategoriesForDropdown
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

    static async createNtTemplate(req, res) {
        try {
            const post = req.body;
            const user = req.session.user;

            if (!post.templateName || post.templateName.trim() === "") {
                throw new Exception(
                    201,
                    "TEMPLATE_NAME_REQUIRED",
                    LANG_EN.req.template_name_required,
                    "Template name is required"
                );
            }

            if (!post.templateCode || post.templateCode.trim() === "") {
                throw new Exception(
                    201,
                    "TEMPLATE_CODE_REQUIRED",
                    LANG_EN.req.template_code_required,
                    "Template code is required"
                );
            }

            if (!post.templateChannel || post.templateChannel.trim() === "") {
                throw new Exception(
                    201,
                    "CHANNEL_REQUIRED",
                    LANG_EN.req.template_channel_required,
                    "Notification channel is required"
                );
            }

            if (!post.templateCategory || post.templateCategory.trim() === "") {
                throw new Exception(
                    201,
                    "CHANNEL_REQUIRED",
                    LANG_EN.req.template_category_required,
                    "Notification channel is required"
                );
            }

            const channels = ["email", "sms", "whatsapp"];
            if (!channels.includes(post.templateChannel)) {
                throw new Exception(
                    201,
                    "INVALID_CHANNEL",
                    LANG_EN.req.template_invalid_channel,
                    "Invalid notification channel"
                );
            }

            if (post.templateDescription && (post.templateDescription.length === 0 || post.templateDescription.length > 2000)) {
                throw new Exception(
                    201,
                    "DESCRIPTION_TOO_LONG",
                    LANG_EN.req.template_description_too_long_or_too_short,
                    "Template description too short or too long"
                );
            }

            const templateStatus = ["active", "inactive"];
            if (post.templateStatus && !templateStatus.includes(post.templateStatus)) {
                throw new Exception(
                    201,
                    "INVALID_STATUS",
                    LANG_EN.req.template_invalid_status,
                    "Invalid template status"
                );
            }

            const finalPayload = {
                userLoggedInUid: user.uid,
                userLoggedInUserName: user.name,
                ...post
            };
            
            const result = await NotificationUtil.createTemplateQuery(finalPayload, req?.redis);
            if (!result) {
                throw new Exception(
                    500,
                    "TEMPLATE_CREATION_FAILED",
                    LANG_EN.error.template_creation_failed,
                    "Database error creating notification template"
                );
            }

            return res.status(200).json({
                status: "success",
                message: LANG_EN.success.template_created,
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
}

export default NotificationController;
