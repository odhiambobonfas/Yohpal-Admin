import config from '@config/config';
import Exception from '@config/exceptions';
import VideosUtil from '@utils/VideosUtil';
import { isAjaxRequest } from '@config/utils';
import {hasPermission} from '@funcs/permissions';

class VideosController {
    static async index(req, res) {
        if (isAjaxRequest(req)) {
            try {
                const limit = Number(req.query.limit) || 20;
                const cursorPagination = req.query.cursorPagination || null;
                
                let excludeIds = [];
                if (req.query.excludeIds) {
                    try {
                        excludeIds = JSON.parse(req.query.excludeIds);
                        if (!Array.isArray(excludeIds)) excludeIds = [];
                    } catch (e) {
                        excludeIds = [];
                    }
                }
                
                const filters = {
                    flagged: req.query.flagged,
                    daterange: req.query.daterange,
                    uploader: req.query.uploader?.trim()
                };

                const result = await VideosUtil.getPaginatedVideos({
                    limit,
                    cursorPagination,
                    filters,
                    excludeIds
                });

                return res.status(200).json({
                    status: 'success',
                    data: result.videos,
                    page: {
                        limit,
                        nextCursorPagination: result.nextCursorPagination,
                        hasMore: result.hasMore,
                        isEndOfResults: result.isEndOfResults,
                        filterDescription: result.filterDescription,
                        debug: {
                            totalFetched: result.totalFetched,
                            totalVisible: result.totalVisible,
                            duplicatesSkipped: result.duplicatesSkipped,
                            iterations: result.iterations
                        }
                    }
                });
            } catch (error) {
                return res.status(500).json({
                    status: 'error',
                    message: error.message
                });
            }
        }

        try {
            return res.render("crm/videos/index", { 
                title: `${config.APP.APP_NAME} || Video Gallery`,
                user: req.session.user
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to render page'
            });
        }
    }

    static async flag(req, res) {
        try {
            const { videoId } = req.params;
            const { reason } = req.body;
            const user = req.session.user;

            if (!videoId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Video ID is required'
                });
            }

            // Check permission - super admins bypass this check
            if (!hasPermission(user?.permissions || [], 'videos.flag', user?.role)) {
                throw new Exception(403, 'PERMISSION_DENIED', 'You do not have permission to flag videos');
            }

            await VideosUtil.updateVideoFlag(videoId, true, reason);

            return res.status(200).json({
                status: 'success',
                message: 'Video flagged successfully'
            });
        } catch (error) {
            if (error instanceof Exception && config.APP.APP_DEBUG) { 
                error.mexLogger();
            }
            
            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Failed to flag video'
            });
        }
    }

    static async unflag(req, res) {
        try {
            const { videoId } = req.params;
            const user = req.session.user;

            if (!videoId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Video ID is required'
                });
            }

            // Check permission - super admins bypass this check
            if (!hasPermission(user?.permissions || [], 'videos.unflag', user?.role)) {
                throw new Exception(403, 'PERMISSION_DENIED', 'You do not have permission to unflag videos');
            }

            await VideosUtil.updateVideoFlag(videoId, false);

            return res.status(200).json({
                status: 'success',
                message: 'Video unflagged successfully'
            });
        } catch (error) {
            if (error instanceof Exception && config.APP.APP_DEBUG) { 
                error.mexLogger();
            }
            
            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Failed to unflag video'
            });
        }
    }

    /**
     * Block a user from the video management interface
     * Endpoint: POST /videos/user/:userId/block
     * Body: { reason: string }
     */
    static async blockUser(req, res) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;
            const user = req.session.user;

            // Validate input
            if (!userId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'User ID is required'
                });
            }

            if (!reason || !reason.trim()) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Block reason is required'
                });
            }

            // Check permission - super admins bypass this check
            if (!hasPermission(user?.permissions || [], 'videos.block_user', user?.role)) {
                throw new Exception(403, 'PERMISSION_DENIED', 'You do not have permission to block users');
            }

            // Call business logic layer to block user
            await VideosUtil.blockUserFromVideo(userId, reason.trim(), user?.username || 'Admin');

            return res.status(200).json({
                status: 'success',
                message: 'User blocked successfully'
            });
        } catch (error) {
            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Failed to block user'
            });
        }
    }

    /**
     * Unblock a previously blocked user
     * Endpoint: POST /videos/user/:userId/unblock
     */
    static async unblockUser(req, res) {
        try {
            const { userId } = req.params;
            const user = req.session.user;

            // Validate input
            if (!userId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'User ID is required'
                });
            }

            // Check permission - super admins bypass this check
            if (!hasPermission(user?.permissions || [], 'videos.unblock_user', user?.role)) {
                throw new Exception(403, 'PERMISSION_DENIED', 'You do not have permission to unblock users');
            }

            // Call business logic layer to unblock user
            await VideosUtil.unblockUserFromVideo(userId, user?.username || 'Admin');

            return res.status(200).json({
                status: 'success',
                message: 'User unblocked successfully'
            });
        } catch (error) {
            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Failed to unblock user'
            });
        }
    }
}

export default VideosController;
