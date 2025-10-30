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
    dateToISO8601Formatter,
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
import Leave from '@models/Leave';
import Application from '@models/Application';
import Transaction from '@models/Transaction';
import SettingsUtil from '@utils/SettingsUtil';
import PayrollUtil from '@utils/PayrollUtil';
import AccountUtil from '@utils/AccountUtil';
import {hasPermission, hasAnyPermission} from '@funcs/permissions';
import { departments, designations, employees } from "@funcs/hrm";
import { getAllRoles, isAdmin, isSuperAdmin } from "@funcs/roles";
import { currencyFormat } from '@funcs/global_funcs';
import Attendance from "@models/Attendance";

class AccountsController {
    static async index(req, res) {
        let user = req.session.user;

        if (isAjaxRequest(req)) {
            try {
                const user = req.session.user;
                let accounts = await AccountUtil.getAllAccounts(req?.redis, req.query);

                let mex = new mexDtParser(accounts);

                accounts = mex 
                    .addColumn('actions', (col) => {
                        let actions = '';
                        const id = col['id'] || col['uid'];

                        if (hasPermission(user?.permissions || [], 'accounts.edit')) {
                            actions += `<a class="btn btn-sm dropdown-item edit-account" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-edit me-1 text-dark"></i> Edit
                            </a>`;
                        }

                        if (hasPermission(user?.permissions || [], 'accounts.view')) {
                            actions += `<a class="dropdown-item btn-sm view-account" href="/accounts/${id}">
                                <i class="fas fa-eye me-1 text-info"></i> View
                            </a>`;
                        }

                        if (hasPermission(user?.permissions || [], 'accounts.delete')) {
                            actions += `<a class="dropdown-item btn-sm delete-account text-danger" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`;
                        }

                        if (hasPermission(user?.permissions || [], 'accounts.deposit')) {
                            actions += `<a class="dropdown-item btn-sm deposit" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-coins me-1 text-success"></i> Deposit Amount
                            </a>`;
                        }

                        if (hasPermission(user?.permissions || [], 'accounts.transfer')) {
                            actions += `<a class="dropdown-item btn-sm transfer" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-exchange-alt me-1 text-warning"></i> Transfer Amount
                            </a>`;
                        }
                        return `
                            <div class="dropdown">
                                <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="actionDropdown-${id}"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Actions
                                </button>
                                <div class="dropdown-menu action-btns" aria-labelledby="actionDropdown-${id}">
                                    ${actions || '<span class="dropdown-item btn-sm text-muted">No Actions</span>'}
                                </div>
                            </div>
                        `;
                    })
                    .editColumn('accountName', (col) => ucwords(col || 'N/A'))
                    .editColumn('accountNumber', (col) => col || 'N/A')
                    .addColumn('accountCategory', (col) => {
                        return ucwords(col.category.name || 'N/A');
                    })
                    .addColumn('accountBalance', (col) => {
                        const balance = currencyFormat(col.accountBalance || 0, "Ksh");
                        return balance;
                    })
                    .editColumn('accountStatus', (col) => { 
                        return `<span class="badge ${col == 'active' ? 'bg-success' : 'bg-danger'}">
                            ${col == 'active' ? 'Active' : 'Inactive'}
                        </span>`;
                    })
                    .addColumn('ownerDetails', (col) => {
                        const name = ucwords(col?.ownerName || 'N/A');
                        const phone = col?.ownerContactNumber ? `<br><small class="text-muted">${col?.ownerContactNumber}</small>` : '';
                        return `${name}${phone}`;
                    })
                    .addColumn('createdAt', (col) => {
                        return dateToISO8601Formatter(col.createdAt?.toDate?.() || col.createdAt || '');
                    })
                    .make();

                return res.status(200).json({
                    status: 'success',
                    message: 'Payment Accounts retrieved successfully.',
                    data: accounts
                });
            }   
            catch (error) {
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

        let ypApplications = await Application.ypApplications(req?.redis);
        let categories = await AccountUtil.getAllAccountCategories(req?.redis, req.query);
        let paymentMethods = await Transaction.paymentMethods();
        let pmsForDropdown = await Transaction.paymentMethodsForDropdown();

        return res.render("crm/accounts/index", {
            title: `${ config.APP.APP_NAME } || Accounts Management`,
            user: req.session.user, 
            categories: categories,
            applications: ypApplications,
            paymentMethods: paymentMethods,
            paymentMethodsForDropdown: pmsForDropdown,

        });
    }

    static async accountCategories(req, res) {
        let user = req.session.user;

        if (isAjaxRequest(req)) {
            try {
                let categories = await AccountUtil.getAllAccountCategories(req?.redis, req.query);
                let mex = new mexDtParser(categories);

                categories = mex
                    .addColumn('actions', (col) => {
                        let actions = '';
                        let id = col['id'] || col['uid'];

                        if (hasPermission(user?.permissions || [], 'accounts.categories.edit')) {
                            actions += `<a class="btn btn-sm dropdown-item edit" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`;
                        }

                        if (hasPermission(user?.permissions || [], 'accounts.categories.delete')) {
                            actions += `<a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`;
                        }

                        return `
                            <div class="dropdown">
                                <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="triggerId-${id}"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Actions
                                </button>
                                <div class="dropdown-menu action-btns" aria-labelledby="triggerId-${id}">
                                    ${actions || '<span class="dropdown-item btn-sm text-muted">No Actions</span>'}
                                </div>
                            </div>
                        `;
                    })
                    .editColumn('name', (col) => {
                        return ucwords(col || 'N/A');
                    })
                    .editColumn('code', (col) => {
                        return (col || 'N/A').toUpperCase();
                    }) 
                    .editColumn('description', (col) => {
                        return ucfirst(col || 'N/A');
                    })
                    .editColumn('createdAt', (col) => {
                        return dateToISO8601Formatter(col?.toDate?.() || col || '');
                    })
                    .addColumn('addedBy', (col) => {
                        return ucwords(col?.addedBy || 'System');
                    })
                    .make();

                return res.status(200).json({
                    status: 'success',
                    message: 'Account categories retrieved successfully.',
                    data: categories
                });
            } catch (error) {
                if (error instanceof Exception && config.APP.APP_DEBUG) {
                    error.mexLogger();
                }

                return res.status(error.status || 500).json({
                    status: 'error',
                    message: error.message || 'Something went wrong. Please try again later.',
                    code: error.code || 'INTERNAL_SERVER_ERROR',
                    title: error.title || 'Unexpected Error'
                });
            }
        }

        return res.render("crm/accounts/categories", {
            title: `${config.APP.APP_NAME} || Accounts Management`,
            user: req.session.user,
        });
    }

    static async createAccountCategory(req, res) {
        try {
            const post = req.body;
            const user = req.session.user;
            
            if (!post.accountCategoryName || post.accountCategoryName.trim() === "") {
                throw new Exception(
                    201,
                    "CATEGORY_NAME_REQUIRED",
                    LANG_EN.req.category_name_required,
                    "Account category name is required"
                );
            }

            if (post.accountCategoryCode && post.accountCategoryCode.length > 20) {
                throw new Exception(
                    201,
                    "CATEGORY_CODE_TOO_LONG",
                    LANG_EN.req.category_code_too_long,
                    "Account category code is too long"
                );
            }
            
            if (post.accountCategoryDescription && post.accountCategoryDescription.length > 500) {
                throw new Exception(
                    201,
                    "CATEGORY_DESCRIPTION_TOO_LONG",
                    LANG_EN.req.category_description_too_long,
                    "Description too long"
                );
            }
            
            const finalPayload = {
                userLoggedInUid: user.uid,
                userLoggedInUserName: user.name,
                ...post
            };

            const result = await AccountUtil.createAccountCategoryQuery(finalPayload);
            if (!result) {
                throw new Exception(
                    500,
                    "ACCOUNT_CATEGORY_CREATE_FAILED",
                    LANG_EN.error.account_category_creation_failed,
                    "Database error creating payment account category"
                );
            }
            
            return res.status(200).json({
                status: "success",
                message: LANG_EN.success.account_category_created,
                data: result
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

    static async createAccount(req, res) {
        try {
            const post = req.body;
            const user = req.session.user;
            
            if (!post.accountName || post.accountName.trim() === "") {
                throw new Exception(
                    201,
                    "ACCOUNT_NAME_REQUIRED",
                    LANG_EN.req.account_name_required,
                    "Account name is required"
                );
            }

            if (!post.accountCategory || post.accountCategory.trim() === "") {
                throw new Exception(
                    201,
                    "ACCOUNT_CATEGORY_REQUIRED",
                    LANG_EN.req.account_category_required,
                    "Account category is required"
                );
            }

            if (post.accountNumber && post.accountNumber.length > 30) {
                throw new Exception(
                    201,
                    "ACCOUNT_NUMBER_TOO_LONG",
                    LANG_EN.req.account_number_too_long,
                    "Account number is too long"
                );
            }

            if (post.applicationName && post.applicationName.length > 30) {
                throw new Exception(
                    201,
                    "APPLICATION_NAME_REQUIRED",
                    LANG_EN.req.application_name_required,
                    "Application name is missing"
                );
            }

            if (post.openingBalance && !post.paymentMethod?.length) {
                throw new Exception(
                    201,
                    "PAYMENT_METHOD_REQUIRED",
                    LANG_EN.req.payment_method_required,
                    "Payment error"
                );
            }

            if (post.accountDescription && post.accountDescription.length > 500) {
                throw new Exception(
                    201,
                    "ACCOUNT_DESCRIPTION_TOO_LONG",
                    LANG_EN.req.account_description_too_long,
                    "Description too long"
                );
            }
            
            const finalPayload = {
                userLoggedInUid: user.uid,
                userLoggedInUserName: user.name,
                ...post
            };
            
            const result = await AccountUtil.createAccountQuery(finalPayload, req?.redis);
            if (!result) {
                throw new Exception(
                    500,
                    "ACCOUNT_CREATE_FAILED",
                    LANG_EN.error.account_creation_failed,
                    "Database error creating payment account"
                );
            }
            
            return res.status(200).json({
                status: "success",
                message: LANG_EN.success.account_created,
                data: result
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

export default AccountsController;