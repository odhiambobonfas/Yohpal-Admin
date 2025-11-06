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
    dateToISO8601Formatter,
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
import CommunicationUtil from '@utils/CommunicationUtil';
import {hasPermission, hasAnyPermission} from '@funcs/permissions';
import qs from 'qs'; 

class CommunicationController {
    static async mailBox(req, res) { 
        try {  
            return res.render("crm/communication/mails/inbox", {
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
                code: error.code || "INTERNAL_SERVER_ERROR",
                message: error.message || "Something went wrong. Please try again later.",
                title: error.title || "Unexpected Error",
            });
        }
    }

    static async emailsList(req, res) { 
        try {  
            if (isAjaxRequest(req)) {
                let emails = [];
                let user = req.session.user;  
                let filters = req.body;

                emails = await CommunicationUtil.getAllEmails(req?.redis, filters);

                let mex = new mexDtParser(emails);

                emails = mex
                    .addColumn('actions', (col) => {
                        let actions = '';
                        let id = col['id'];
                        
                        // edit
                        if (hasPermission(user?.permissions || [], 'communication.emails.edit')) {
                            actions += `
                                <a class="btn btn-sm dropdown-item" href="/emails/edit/${id}">
                                    <i class="fas fa-edit me-1"></i> Edit
                                </a>`;
                        }

                        // delete
                        if (hasPermission(user?.permissions || [], 'communication.emails.delete')) {
                            actions += `
                                <a class="btn btn-sm dropdown-item delete-email" href="javascript:void(0)" data-id="${id}">
                                    <i class="fas fa-trash-alt me-1"></i> Delete
                                </a>`;
                        }

                        // suspend login
                        if (hasPermission(user?.permissions || [], 'communication.emails.suspend_login') && col['suspended_login'] === 0) {
                            actions += `
                                <a class="btn btn-sm dropdown-item suspend-login" href="javascript:void(0)" data-id="${id}" data-type="login">
                                    <i class="fas fa-pause-circle me-1"></i> Suspend Login
                                </a>`;
                        }

                        // unsuspend login
                        if (hasPermission(user?.permissions || [], 'communication.emails.unsuspend_login') && col['suspended_login'] === 1) {
                            actions += `
                                <a class="btn btn-sm dropdown-item unsuspend-login" href="javascript:void(0)" data-id="${id}" data-type="login">
                                    <i class="fas fa-play-circle me-1"></i> Unsuspend Login
                                </a>`;
                        }

                        // suspend incoming
                        if (hasPermission(user?.permissions || [], 'communication.emails.suspend_incoming') && col['suspended_incoming'] === 0) {
                            actions += `
                                <a class="btn btn-sm dropdown-item suspend-incoming" href="javascript:void(0)" data-id="${id}" data-type="incoming">
                                    <i class="fas fa-stop-circle me-1"></i> Suspend Incoming
                                </a>`;
                        }

                        // unsuspend incoming
                        if (hasPermission(user?.permissions || [], 'communication.emails.unsuspend_incoming') && col['suspended_incoming'] === 1) {
                            actions += `
                                <a class="btn btn-sm dropdown-item unsuspend-incoming" href="javascript:void(0)" data-id="${id}" data-type="incoming">
                                    <i class="fas fa-envelope-open me-1"></i> Unsuspend Incoming
                                </a>`;
                        }

                        const action_dropdown = `
                            <div class="dropdown">
                                <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="triggerId" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Actions
                                </button>
                                <div class="dropdown-menu action-btns" aria-labelledby="triggerId">  
                                    ${actions || '<span class="dropdown-item text-muted">No Actions</span>'}
                                </div>
                            </div>
                        `;
                        return action_dropdown;
                    })
                    .editColumn('email', (col) => col || 'N/A')
                    .editColumn('login', (col) => col || 'N/A')
                    .addColumn('emailExtras', (col) => {
                        const domain = col?.domain || 'N/A';
                        const quota = col?.diskQuota ? `${col.diskQuota} MB` : 'Unlimited';
                        const suspendedLogin = col?.suspended_login == 1 
                            ? '<span class="badge bg-danger text-light">Login Suspended</span>' 
                            : '<span class="badge bg-success text-light">Login Active</span>';
                        const suspendedIncoming = col?.suspended_incoming == 1 
                            ? '<span class="badge bg-danger text-light">Incoming Suspended</span>' 
                            : '<span class="badge bg-success text-light">Incoming Active</span>';
                        const suspendedOutgoing = col?.suspended_outgoing == 1
                            ? '<span class="badge bg-danger text-light">Outgoing Suspended</span>' 
                            : '<span class="badge bg-success text-light">Outgoing Active</span>';

                        return `
                            <div class="d-flex flex-column">
                                <span><strong>Login:</strong> ${suspendedLogin}</span>
                                <span><strong>Incoming:</strong> ${suspendedIncoming}</span>
                                <span><strong>Outgoing:</strong> ${suspendedOutgoing}</span>
                                <span><strong>Disk Quota:</strong> ${quota}</span>
                                <span><strong>Domain:</strong> ${domain}</span>
                            </div>
                        `;
                    })
                    .editColumn('server', (col) => col || 'N/A')
                    .editColumn('suspended_login', (col) => {
                        if (col === 1) {
                            return `<span class="badge bg-danger text-light">Suspended</span>`;
                        } else {
                            return `<span class="badge bg-success text-light">Active</span>`;
                        }
                    })
                    .editColumn('suspended_incoming', (col) => {
                        if (col === 1) {
                            return `<span class="badge bg-danger text-light">Suspended</span>`;
                        } else {
                            return `<span class="badge bg-success text-light">Active</span>`;
                        }
                    })
                    .addColumn('accessScope', (col) => {
                        const suspendedLogin = col.suspended_login === 1;               
                        const suspendedIncoming = col.suspended_incoming === 1;

                        if (suspendedLogin && suspendedIncoming) {
                            return `<span class="badge bg-danger text-light">Fully Suspended</span>`;
                        } else if (suspendedLogin) {
                            return `<span class="badge bg-warning text-dark">Login Suspended</span>`;
                        } else if (suspendedIncoming) {
                            return `<span class="badge bg-warning text-dark">Incoming Suspended</span>`;
                        } else {
                            return `<span class="badge bg-success text-light">Active</span>`;
                        }
                    }) 
                    .editColumn('status', (col) => { 
                        col = col ? col.toLowerCase() : 'inactive';
                        if (col === 'active') {
                            return `<span class="badge text-light bg-success">${ucfirst(col)}</span>`;
                        } else if (col === 'inactive') {
                            return `<span class="badge text-light bg-warning">${ucfirst(col)}</span>`;
                        } else if (col === 'suspended') {
                            return `<span class="badge text-light bg-danger">${ucfirst(col)}</span>`;
                        } else {
                            return `<span class="badge text-light bg-warning">Inactive</span>`;
                        } 
                    })
                    .addColumn('timestamps', (col) => {
                        const created = col?.createdAt?.toDate ? dateToISO8601Formatter(col.createdAt.toDate()) : 'N/A';
                        const updated = col?.updatedAt?.toDate ? dateToISO8601Formatter(col.updatedAt.toDate()) : 'N/A';
                        return `
                            <div class="d-flex flex-column">
                                <small><strong>Created:</strong> ${created}</small>
                                <small><strong>Updated:</strong> ${updated}</small>
                            </div>
                        `;
                    })
                    .addColumn('createdBy', (col) => {
                        return ucwords(col?.length ? col : 'N/A');
                    })
                    .make();

                return res.status(200).json({
                    status: 'success',
                    message: 'Emails retrieved successfully.',
                    data: emails
                }); 
            }

            const cpanelServersForDropdown = await Application.cpanelsListForDropdown(req?.redis);
            console.log("SERVER LIST: ", cpanelServersForDropdown);
            return res.render("crm/communication/mails/index", {
                title: `${ config.APP.APP_NAME } || App Settings`,
                user: req.session.user, 
                cpanelServersForDropdown: cpanelServersForDropdown
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

    static async createEmailAddress(req, res) {
        try {
            const post = req.body;
            const user = req.session.user;
            
            if (!post.emailName || post.emailName.trim() === "") {
                throw new Exception(
                    201,
                    "EMAIL_NAME_REQUIRED",
                    LANG_EN.req.email_name_required,
                    "Email name is required"
                );
            }

            if (!post.emailUsername || post.emailUsername.trim() === "") {
                throw new Exception(
                    201,
                    "EMAIL_ADDRESS_REQUIRED",
                    LANG_EN.req.email_address_required,
                    "Email address is required"
                );
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(post.emailUsername.trim())) {
                throw new Exception(
                    201,
                    "EMAIL_ADDRESS_TAG_INVALID",
                    LANG_EN.req.email_address_tag_invalid,
                    "Invalid email address tag format"
                );
            }

            if (!post.serverSelect || post.serverSelect.trim() === "") {
                throw new Exception(
                    201,
                    "SERVER_REQUIRED",
                    LANG_EN.req.server_required,
                    "Server to link to this email is required"
                );
            }

            if (!post.smtpHost || post.smtpHost.trim() === "") {
                throw new Exception(
                    201,
                    "SMTP_HOST_REQUIRED",
                    LANG_EN.req.smtp_host_required,
                    "SMTP host is required"
                );
            }

            if (!post.outgoingSmtpPort || isNaN(Number(post.outgoingSmtpPort))) {
                throw new Exception(
                    201,
                    "SMTP_PORT_INVALID",
                    LANG_EN.req.smtp_port_invalid,
                    "Valid Incoming SMTP port is required"
                );
            }

            if (!post.incomingSmtpPort || isNaN(Number(post.outgoingSmtpPort))) {
                throw new Exception(
                    201,
                    "SMTP_PORT_INVALID",
                    LANG_EN.req.smtp_port_invalid,
                    "Valid Outgoing SMTP port is required"
                );
            }
            
            if (!post.smtpPassword || post.smtpPassword.trim() === "") {
                throw new Exception(
                    201,
                    "SMTP_PASSWORD_REQUIRED",
                    LANG_EN.req.smtp_password_required,
                    "SMTP password is required"
                );
            }

            if (!post.encryption || post.encryption.trim() === "") {
                throw new Exception(
                    201,
                    "ENCRYPTION_REQUIRED",
                    LANG_EN.req.encryption_required,
                    "Encryption type is required"
                );
            }

            if (!["ssl", "tls"].includes(post.encryption.toLowerCase())) {
                throw new Exception(
                    201,
                    "ENCRYPTION_INVALID",
                    LANG_EN.req.encryption_invalid,
                    "Invalid encryption type"
                );
            }

            if (!post.status || !["active", "inactive"].includes(post.status.toLowerCase())) {
                throw new Exception(
                    201,
                    "STATUS_INVALID",
                    LANG_EN.req.status_invalid,
                    "Status must be Active or Inactive"
                );
            }
            
            if (!post.diskQuota || !["unlimited", "limited"].includes(post.diskQuota.toLowerCase())) {
                throw new Exception(
                    201,
                    "DISK_QUOTA_INVALID",
                    LANG_EN.req.disk_quota_invalid,
                    "Disk quota must be Unlimited or Limited"
                );
            }

            if (post.diskQuota === "limited") {
                if (!post.quotaValue || isNaN(Number(post.quotaValue)) || Number(post.quotaValue) <= 0) {
                    throw new Exception(
                        201,
                        "QUOTA_VALUE_REQUIRED",
                        LANG_EN.req.quota_value_required,
                        "Enter a valid disk quota value (MB)"
                    );
                }
            }
            
            if (post.shareToEmail && post.shareToEmail.length > 0) {
                const invalidEmails = post.shareToEmail
                    .split(',')
                    .map(e => e.trim())
                    .filter(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

                if (invalidEmails.length > 0) {
                    throw new Exception(
                        201,
                        "INVALID_SHARE_EMAILS",
                        LANG_EN.req.invalid_share_emails,
                        "One or more shared emails are invalid"
                    );
                }
            }
            
            const finalPayload = {
                userLoggedInUid: user.uid,
                userLoggedInUserName: user.name,
                ...post
            };
            
            const result = await CommunicationUtil.createEmailAddressQuery(finalPayload, req?.redis);
            console.log("RESPONSE: ", result);
            if (!result) {
                throw new Exception(
                    500,
                    "EMAIL_CREATE_FAILED",
                    LANG_EN.error.email_create_failed,
                    "Database error creating email setting"
                );
            }
            
            return res.status(200).json({
                status: "success",
                message: LANG_EN.success.email_created,
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

export default CommunicationController;
