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
import { ucfirst, ucwords } from '@config/utils';
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
                    if (col) {
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
        return res.render("crm/users/create", { 
            title: `${ config.APP.APP_NAME } || List Users`,
            user: req.session.user
        });
    }
}

module.exports = UsersController;