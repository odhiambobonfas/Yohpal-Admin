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
    viewTemplate,
    isAjaxRequest,
    ucfirst,
    ucwords,
    handleFileUploads,
    jsonParser,
    reduceToObj,
    dateToISO8601Formatter
} from '@config/utils';
import RolesUtil from '@utils/RolesUtil';
import Binding from '@config/bindings';
import LANG_EN from '@lang/en';
import Util from '@utils/Util';
import Setting from '@models/Setting'
import Application from '@models/Application'
import NotificationTemplate from '@models/NotificationTemplate'
import NotificationUtil from '@utils/NotificationUtil';
import Email from '@models/Email';
import {hasPermission, hasAnyPermission} from '@funcs/permissions';
import qs from 'qs'; 

class NotificationController {
    static async index(req, res) { 
        try { 
            if (isAjaxRequest(req)) {
                const user = req.session.user;
                let notificationTemplates = await NotificationUtil.getAllNotificationTemplates(req.redis, req.query);
                const mex = new mexDtParser(notificationTemplates);
                notificationTemplates = mex.addColumn('actions', 
                    (col) => {
                        let actions = '';
                        const id = col.uid || col.id;
                        const status = col.templateStatus?.toLowerCase() || 'inactive';

                        // Edit action
                        if (hasPermission(user?.permissions || [], 'notifications.templates.edit')) {
                            actions += `
                                <a class="btn btn-sm dropdown-item edit" href="javascript:void(0)" 
                                    data-id="${id}" target-modal=".editTemplateModal">
                                    <i class="fas fa-edit me-1"></i> Edit
                                </a>`;
                        }

                        // Delete action
                        if (hasPermission(user?.permissions || [], 'notifications.templates.delete')) {
                            actions += `
                                <a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" 
                                    data-id="${id}">
                                    <i class="fas fa-trash-alt me-1"></i> Delete
                                </a>`;
                        }

                        // Activate action
                        if (hasPermission(user?.permissions || [], 'notifications.templates.activate') && status !== 'active') {
                            actions += `
                                <a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" 
                                    data-id="${id}">
                                    <i class="fas fa-trash-alt me-1"></i> Delete
                                </a>`;
                        }

                        // Deactivate action
                        if (hasPermission(user?.permissions || [], 'notifications.templates.deactivate') && status === 'active') {
                            actions += `
                                <a class="btn btn-sm dropdown-item deactivate" href="javascript:void(0)" 
                                    data-id="${id}">
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
                    .editColumn('templateName', (col) => col || '<em>Untitled</em>')
                    .editColumn('templateDescription', (col) => col || '<em>No Description</em>')
                    .editColumn('emailSubject', (col) => ucfirst(col) || '<em>N/A</em>')
                    .addColumn('linkedEmail', (col) => { 
                        return col ? col?.associatedEmail?.email : '<em>N/A</em>';
                    });

                notificationTemplates = await notificationTemplates.addColumnAsync('viewTemplate', async (col) => {  
                        const view = await viewTemplate(res, 'crm/notificationTemp/partials/view-template', { 
                            template: col
                        });
                        
                        return view;
                    });

                notificationTemplates = notificationTemplates.editColumn('templateCategory', (col) => ucfirst(col || 'general'))
                    .editColumn('templateChannel', (col) => ucfirst(col || 'unspecified'))
                    .editColumn('templateCode', (col) => col || '<em>N/A</em>')
                    .addColumn('addedBy', (col) => col?.addedBy || '<em>Unknown</em>')
                    .editColumn('addedByRefUser', (col) => col?.addedByRefUser ? `<code>${col.addedByRefUser}</code>` : '<em>N/A</em>')
                    .addColumn('status', (col) => {
                        const status = col?.templateStatus?.toLowerCase();
                        if (status === 'active') {
                            return `<span class="badge text-dark bg-success">${ucfirst(status)}</span>`;
                        } else if (status === 'inactive') {
                            return `<span class="badge text-dark bg-warning">${ucfirst(status)}</span>`;
                        } else if (status === 'archived') {
                            return `<span class="badge text-dark bg-danger">${ucfirst(status)}</span>`;
                        }
                        return `<span class="badge text-dark bg-secondary">Unknown</span>`;
                    })
                    .editColumn('createdAt', (col) => dateToISO8601Formatter(col?.toDate?.() || col || ''))
                    .editColumn('updatedAt', (col) => dateToISO8601Formatter(col?.toDate?.() || col || ''));

                notificationTemplates = await notificationTemplates.makeAsync();
                    
                return res.status(200).json({
                    status: 'success',
                    data: notificationTemplates
                });

            }

            const templateCategoriesForDropdown = await NotificationTemplate.templateCategoriesForDropdown(req?.redis);  
            const emailsListForDropdown = await Email.emailsListForDropdown(req?.redis);
            return res.render("crm/notificationTemp/index", {
                title: `${ config.APP.APP_NAME } || Notification Template Management`,
                user: req.session.user, 
                templateCategoriesForDropdown: templateCategoriesForDropdown,
                emailsListForDropdown: emailsListForDropdown
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

            if (post.templateChannel === 'email' && (!post.associatedEmail || post.associatedEmail.trim() === "")) {
                throw new Exception(
                    201,
                    "ASSOCIATED_EMAIL_REQUIRED",
                    LANG_EN.req.template_associated_email_required,
                    "Associated email is required for email channel"
                );
            }

            if (post.templateChannel === 'email' && (!post.emailSubject || post.emailSubject.trim() === "")) {
                throw new Exception(
                    201,
                    "EMAIL_SUBJECT_REQUIRED",
                    LANG_EN.req.template_email_subject_required,
                    "Email subject is required for email channel"
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
            
            if (post.templateDescription && (post.templateDescription.length === 0 || post.templateDescription.length > 10000)) {
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

    static async updateNtTemplate(req, res) {
        try {
            let post = req.query;
            let { id } = req?.params;
            let user = req.session.user;

            if (post.modal) {
                let template = await NotificationUtil.getTemplateByid(id, req?.redis);
                if (!template) {
                    throw new Exception(
                        404,
                        "TEMPLATE_NOT_FOUND",
                        LANG_EN.error.template_not_found,
                        "Notification template not found"
                    );
                } 

                const templateCategoriesForDropdown = await NotificationTemplate.templateCategoriesForDropdown(req?.redis, template.templateCategory || null);  
                const emailsListForDropdown = await Email.emailsListForDropdown(req?.redis, template?.associatedEmail?.emailId || null);
                return res.render('crm/notificationTemp/partials/edit-template', {
                    user: req.session.user,
                    template: template,
                    templateCategoriesForDropdown: templateCategoriesForDropdown,
                    emailsListForDropdown: emailsListForDropdown
                });
            }

            post = qs.parse(req.body);
            post.id = id;
            if (!post.modal) {
                if (!post.id || post.id.trim() === "") {
                    throw new Exception(
                        201,
                        "TEMPLATE_UID_REQUIRED",
                        LANG_EN.req.request_denied,
                        "Template UID is required"
                    );
                }
                
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

                if (post.templateChannel === 'email' && (!post.associatedEmail || post.associatedEmail.trim() === "")) {
                    throw new Exception(
                        201,
                        "ASSOCIATED_EMAIL_REQUIRED",
                        LANG_EN.req.template_associated_email_required,
                        "Associated email is required for email channel"
                    );
                }

                if (post.templateChannel === 'email' && (!post.emailSubject || post.emailSubject.trim() === "")) {
                    throw new Exception(
                        201,
                        "EMAIL_SUBJECT_REQUIRED",
                        LANG_EN.req.template_email_subject_required,
                        "Email subject is required for email channel"
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
                
                if (post.templateDescription && (post.templateDescription.length === 0 || post.templateDescription.length > 10000)) {
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

                const result = await NotificationUtil.editTemplateQuery(finalPayload, req?.redis);
                if (!result) {
                    throw new Exception(
                        500,
                        "TEMPLATE_UPDATE_FAILED",
                        LANG_EN.error.template_update_failed,
                        "Database error updating notification template"
                    );
                }

                return res.status(200).json({
                    status: "success",
                    message: LANG_EN.success.template_updated,
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

export default NotificationController;
