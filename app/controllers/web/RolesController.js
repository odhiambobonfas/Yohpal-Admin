import bcrypt from 'bcryptjs';
import config from '@config/config';
import User from '@models/User'; 
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes';
import { FirebaseUtil, FirestoreDatabase, RealTimeDatabase } from '@utils/FirebaseUtil';
import Util from '@utils/Util';
import utility from '@config/utils';
import mexDtParser from '@config/mexDtParser';
import { ucfirst } from '@config/utils';

class RolesController {
    static async index(req, res) {
        if (utility.is_ajax(req)) {
            let roles = [
                {
                    id: 'veuadjfoifidwecd',
                    name: 'Accountant',
                    code: 'R0001',
                    status: 'active',
                    added_by: 'Ernest',
                    description: 'This is meant for the accountants in all modules applicable!'
                }
            ]

            let mex = new mexDtParser(roles);
            roles = mex.addColumn('actions', (col) => {
                let actions = '';
                let id = col['id'];
                
                if (id) {
                    actions += `<a class="btn btn-sm dropdown-item" href="/roles/edit/${col['id']}">
                            <i class="fas fa-edit me-1"></i> Edit
                        </a>`
                }

                if (id) {
                    actions += `<a class="btn btn-sm dropdown-item" href="javascript:void(0)" data-id="${col['id']}">
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
            .make();

            return res.status(200).json({
                status: 'success',
                message: 'Roles retrieved successfully.',
                data: roles
            });
        }

        return res.render("crm/roles/index", { 
            title: "Yohpal Admin || Roles",
            user: req.session.user
        });
    }
}

module.exports = RolesController;