import bcrypt from 'bcryptjs';
import config from '@config/config';
import User from '@models/User'; 
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes';
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import Util from '@utils/Util';
import utility from '@config/utils';
import mexDtParser from '@config/mexDtParser';
import { ucfirst, ucwords, validateEmail } from '@config/utils';
import UsersUtil from '@utils/UserUtil'; 
import Binding from '@config/bindings'; 
import LANG_EN from '@lang/en';

class UsersController {
    static async index(req, res) {
        if (utility.isAjaxRequest(req)) {
            let users = [];

            try { 
                users = await UsersUtil.getAllUsers(req.query); 
                
                let mex = new mexDtParser(users);
                users = mex.addColumn('actions', (col) => {
                    let actions = '';
                    let id = col['id'];
                    
                    if (id) {
                        actions += `<a class="btn btn-sm dropdown-item" href="/users/edit/${id}">
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
                                ${actions}
                            </div>
                        </div>
                    `;

                    return action_dropdown;
                })
                .editColumn('status', (col) => { 
                    return ucfirst(col);
                })
                .addColumn('fullName', (col) => { 
                    let fullName = 'N/A';
                    if (col.firstName?.length || col.lastName?.length) {
                        fullName = `${col.firstName ?? ''} ${col.lastName ?? ''}`.trim();
                    }

                    return ucwords(fullName);
                }) 
                .editColumn('addedBy', (col) => { 
                    return ucwords(col || 'N/A');
                }) 
                .editColumn('Country', (col) => { 
                    return ucwords(col || 'N/A');
                })
                .editColumn('userName', (col) => { 
                    return ucwords(col || 'N/A');
                })
                .editColumn('phoneNumber', (col) => { 
                    return ucwords(col || 'N/A');
                })
                .addColumn('roleName', (col) => { 
                    return ucwords(col.role.name || 'N/A');
                })
                .editColumn('description', (col) => { 
                    return ucfirst(col || 'N/A');
                })
                .editColumn('status', (col) => { 
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
                    message: 'Users retrieved successfully.',
                    data: users
                });
            } catch (error) {
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
        }

        return res.render("crm/users/index", { 
            title: `${ config.APP.APP_NAME } || List Users`,
            user: req.session.user
        });
    }

    static async createUser(req, res) {

        if (utility.isAjaxRequest(req)) {
            let data = req.body;  

            try {  
                console.log(data);
                console.log(data.userName);
                // validate input data
                if (!data.firstName?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_firstname, "Role Error!");
                }

                if (!data.lastName?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_lastname, "Invalid Last Name!");
                }

                if (!data.userName?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_username, "Invalid Username!");
                }

                if (!data.email?.length) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_email, "Invalid Email!");
                }

                if (!validateEmail(data.email)) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_email_format, "Email Format Error!");
                }

                if (!data.password?.length) {
                    throw new Exception(201, "AUTHENTICATION_ERROR_EXCEPTION", LANG_EN.req.invalid_password, "Password Missing!");
                }

                if (data.password !== data.confirmPassword) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.password_mismatch, "Passwords Do Not Match!");
                }

                if (!data.roleId?.length) {
                    throw new Exception(201, "AUTHORIZATION_ERROR_EXCEPTION", LANG_EN.req.invalid_role, "Role Missing!");
                }

                if (!["active", "inactive", "pending"].includes(data.status)) {
                    throw new Exception(201, "VALIDATION_ERROR_EXCEPTION", LANG_EN.req.invalid_status, "Invalid Status!");
                }
 
                let user = await UsersUtil.createUser(data);
                
                let route;
                if (!data.stayHere) {
                    route = '/roles';
                }

                return res.status(200).json({
                    status: 'success',
                    message: 'User created successfully.',
                    route: route,
                    data: user
                });
            }
            catch (error) {
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
        }

        return res.render("crm/users/create", { 
            title: `${ config.APP.APP_NAME } || List Users`,
            user: req.session.user
        });
    }
}

module.exports = UsersController;