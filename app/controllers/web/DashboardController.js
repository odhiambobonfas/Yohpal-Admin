import jwt from 'jsonwebtoken';
import config from '@config/config';
import User from '@models/User';
import UsersUtil from '@utils/UserUtil';
import StatsUtil from '@utils/StatsUtil';
import mexDtParser from '@config/mexDtParser'; 
import Exception from '@config/exceptions';
import { isAjaxRequest, ucfirst, ucwords } from '@config/utils';

class DashboardController {
    static async index(req, res) {  
        if (isAjaxRequest(req)) {
            let totalYpUsers = await UsersUtil.getAllUsersCount();
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

    static async graphicalStats(req, res) {
        try {
            let users = await UsersUtil.getAllUsers();  
            let marketSizeGrowth = await StatsUtil.computeMarketSizeGrowth(users);
            let ageDemographics = await StatsUtil.computeAgeDemographics(users);
            console.log(marketSizeGrowth);
            const stats = {
                ageDemographics: ageDemographics,
                marketSizeGrowth: marketSizeGrowth
            };

            return res.status(200).json({
                status: 'success',
                message: 'Graphical stats fetched successfully.',
                data: stats
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
}

export default DashboardController;
