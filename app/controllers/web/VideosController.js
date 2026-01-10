import config from '@config/config';
import Exception from '@config/exceptions';
import VideosUtil from '@utils/VideosUtil';
import ReportUtil from '@utils/ReportUtil';
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import User from '@models/User';
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

    static async getReportedVideos(req, res) {
        try {
            console.log('Received request for reported videos');

            const reportedVideos = await ReportUtil.getReportedVideos();
            console.log(`Found ${reportedVideos.length} reported videos`);

            // Transform for frontend - ensure consistent structure
            const transformedVideos = reportedVideos.map(video => {
                const userId = video.uid || video.userId || video.userUid;
                
                return {
                    ...video,
                    id: video.id,
                    isReported: true,
                    reportReason: video.reason,
                    reportedAt: video.reportedAt,
                    reporterName: video.reporterName,
                    reporterId: video.reporterId,
                    reporterEmail: video.reporterEmail,
                    reportCount: video.reportCount || 1,
                    reporters: video.reports || [],
                    uploaderName: video.uploaderName || video.userName || video.fullName || 'Unknown',
                    url: video.videoUrl || video.url,
                    flagged: video.flagged || false,
                    broken: video.broken || false,
                    uid: userId,
                    userStatus: video.userStatus || 'active',
                    banReason: video.banReason || null
                };
            });

            console.log(`Returning ${transformedVideos.length} reported videos`);

            return res.status(200).json({
                status: 'success',
                data: transformedVideos,
                count: transformedVideos.length
            });
        } catch (error) {
            console.error('Error fetching reported videos:', error);

            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Failed to fetch reported videos',
                error: config.APP.APP_DEBUG ? error.stack : undefined
            });
        }
    }
}

export default VideosController;
