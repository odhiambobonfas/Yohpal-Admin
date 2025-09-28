import jwt from 'jsonwebtoken';
import config from '@config/config';
import User from '@models/User';
import UserUtil from '@utils/UserUtil';
import mexDtParser from '@config/mexDtParser'; 
import Exception from '@config/exceptions';
import { isAjaxRequest, ucfirst, ucwords } from '@config/utils';

class DashboardController {
    static async index(req, res) {  
        if (isAjaxRequest(req)) {
            let totalYpUsers = await UserUtil.getAllUsersCount();
            let totalPromotedAccounts = null;
            let totalApplications = null;
            let totalDepositedAmount = null;
            let totalYpReviews = null;
            let totalUploadedVideos = null;
            let totalYpTransactions = null;

            const response = [
                {
                    name: 'total-yohpal-users',
                    value: totalYpUsers || 0
                },
                {
                    name: 'total-promoted-accounts',
                    value: totalPromotedAccounts || 0
                },
                {
                    name: 'total-applications',
                    value: totalApplications || 0
                },
                {
                    name: 'total-deposited-amount',
                    value: totalDepositedAmount || 0
                },
                {
                    name: 'total-yohpal-reviews',
                    value: totalYpReviews || 0
                },
                {
                    name: 'total-uploaded-videos',
                    value: totalUploadedVideos || 0
                },
                {
                    name: 'total-yohpal-transactions',
                    value: totalYpTransactions || 0
                }
            ];
            
            return res.status(200).json({data: response})
        }

        return res.render("crm/dashboard", { title: "Dashboard Page", user: req.session.user });
    } 

    static async getUsers(req, res) {
        try {
            const users = await UserUtil.getAllUsers();
            const usersObj = new mexDtParser(users)
                .addColumn('action', (row) => { 
                    return `<button type="button" class="btn btn-primary btn-sm" data-id='${row.id}'>Edit</button>
                        <button type="button" class="btn btn-primary btn-sm" data-id='${row.id}'>Delete</button>`;
                })
                .editColumn('username', (username) => { 
                    return ucwords(username);  
                })
                .deleteColumn('id')
                .make();

            return res.status(200).json({ status: 'success', data: usersObj });
        } catch (error) {
            if (error instanceof Exception) {  
                if (config.APP.APP_DEBUG) error.mexLogger();
                return res.status(error.status).json({ status: 'error', message: error.message, code: error.code, data: [] });
            } else {   
                return res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again later.' });
            }
        }
    }
}

export default DashboardController;
