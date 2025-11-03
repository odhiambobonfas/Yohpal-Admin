import path from 'path';
import bcrypt from 'bcryptjs';
import config from '@config/config';
import User from '@models/User'; 
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes';
import { FirebaseUtility, FirestoreDatabase } from '@utils/FirebaseUtil';
import mexDtParser from '@config/mexDtParser';
import { isAjaxRequest, ucfirst, ucwords, validateEmail, handleFileUploads, reduceToObj, jsonParser, fbCollectionParser } from '@config/utils';
import {hasPermission, hasAnyPermission} from '@funcs/permissions';
import StatsUtil from '@utils/StatsUtil';
import HRMUtil from '@utils/HRMUtil';  
import PayrollUtil from '@utils/PayrollUtil';
import LANG_EN from '@lang/en'; 
import { departments, designations, employees } from "@funcs/hrm";
import { getAllRoles, isAdmin, isSuperAdmin } from "@funcs/roles";
import Attendance from "@models/Attendance"; 

class FollowerController {
    async bubbleSortUsers(arr) {
        let n = arr.length;
        let swapped;
      
        do {
          swapped = false;
          for (let i = 0; i < n - 1; i++) {
            const current = arr[i].followersCount || 0;
            const next = arr[i + 1].followersCount || 0;
      
            // Sort descending (largest first)
            if (current < next) {
              [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
              swapped = true;
            }
          }
          n--; // optimization: ignore the last sorted element
        } while (swapped);
      
        return arr;
    }
      
    static async getTopFollowersListing(req, res) {
        let user = req.session.user; 
        if (isAjaxRequest(req)) {
            let users = [];
            try {  
                req.query.roleExists = true;
                req.query.orderBy = 'followersCount';
                req.query.orderByDirection = 'desc';
                req.query.limit = 10;
                users = await StatsUtil.getFollowersStats(req?.redis, req.query); 

                let mex = new mexDtParser(users);
                users = mex.addColumn('profile', (col) => {  
                    let fullName = 'N/A';
                    let avatar = '/store/images/avatars/default-avatar.jpg';

                    if (col.firstName?.trim() || col.lastName?.trim()) {
                        fullName = `${col.firstName ?? ''} ${col.lastName ?? ''}`.trim();
                    }
                    
                    if (col.profilePictureFbPath?.trim()) {
                        avatar = col.profilePictureFbPath;
                    } else if (col.profilePictureLocalPath?.trim()) {
                        avatar = col.profilePictureLocalPath;
                    } else if (col.profile_picture?.trim()) {
                        avatar = col.profile_picture;
                    }
                    
                    const user = `<div class="d-flex align-items-center">
                            <img src="${avatar}" class="rounded-circle me-2 ts-user-avatar" alt="${fullName}">
                            <div>
                                <div class="fw-semibold">@${col?.userName || 'unknown'}</div>
                                <small class="text-muted">${col.roleName || 'Influencer'}</small>
                            </div>
                        </div>`;

                    return user.trim();
                })
                .addColumn('count', (col) => { 
                    return Number(col?.followersCount || 0);
                })
                .editColumn('status', (col) => { 
                    col = col ? col.toLowerCase() : 'inactive';
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

        return res.render("crm/yohpal/statistics/index", { 
            title: `${ config.APP.APP_NAME } || Statistics`,
            user: req.session.user, 
        });
    }
}

export default FollowerController;