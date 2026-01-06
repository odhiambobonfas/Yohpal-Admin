import config from '@config/config';
import Exception from '@config/exceptions';
import VideosUtil from '@utils/VideosUtil';
import { isAjaxRequest } from '@config/utils';
import {hasPermission} from '@funcs/permissions';

class VideosController {
    static async index(req, res) {
        if (isAjaxRequest(req)) {
            try {
                const videos = await VideosUtil.getAllVideos();
                return res.status(200).json({
                    status: 'success',
                    data: videos
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

            if (!hasPermission(user?.permissions || [], 'videos.flag')) {
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

            if (!hasPermission(user?.permissions || [], 'videos.unflag')) {
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
}

export default VideosController;
