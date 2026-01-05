import config from '@config/config';
import Exception from '@config/exceptions';
import VideosUtil from '@utils/VideosUtil';
import { isAjaxRequest, ucfirst } from '@config/utils';
import mexDtParser from '@config/mexDtParser';
import {hasPermission} from '@funcs/permissions';
import LANG_EN from '@lang/en';

class VideosController {
    static async index(req, res) {
        if (isAjaxRequest(req)) {
            try {
                const { page = 1, flagged } = req.query;
                const user = req.session.user;
                
                const videos = await VideosUtil.getAllVideos();

                let mex = new mexDtParser(videos);
                const formattedVideos = mex.addColumn('actions', (col) => {
                    let actions = '';
                    const id = col['id'];
                    const isFlagged = col['flagged'];
                    
                    if (hasPermission(user?.permissions || [], 'videos.flag') && !isFlagged) {
                        actions += `<a class="btn btn-sm dropdown-item flag-video" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-flag me-1"></i> Flag
                            </a>`;
                    }

                    if (hasPermission(user?.permissions || [], 'videos.unflag') && isFlagged) {
                        actions += `<a class="btn btn-sm dropdown-item unflag-video" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-check me-1"></i> Unflag
                            </a>`;
                    }

                    if (hasPermission(user?.permissions || [], 'videos.delete')) {
                        actions += `<a class="btn btn-sm dropdown-item delete-video" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`;
                    }

                    const action_dropdown = `
                        <div class="dropdown">
                            <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Actions
                            </button>
                            <div class="dropdown-menu action-btns">  
                                ${actions || '<span class="dropdown-item text-muted">No Actions</span>'}
                            </div>
                        </div>
                    `;

                    return action_dropdown;
                })
                .editColumn('uploaderName', (col) => ucfirst(col || 'Unknown'))
                .editColumn('createdAt', (col) => {
                    if (!col) return 'N/A';
                    const date = col.toDate ? col.toDate() : new Date(col);
                    return date.toLocaleDateString();
                })
                .editColumn('flagged', (col) => {
                    return col 
                        ? `<span class="badge bg-danger">Flagged</span>`
                        : `<span class="badge bg-success">Active</span>`;
                })
                .editColumn('url', (col) => {
                    return col 
                        ? `<video width="100" height="60" controls><source src="${col}"></video>`
                        : 'N/A';
                })
                .make();

                return res.status(200).json({
                    status: 'success',
                    message: 'Videos retrieved successfully.',
                    data: formattedVideos
                });
            } catch (error) {
                if (error instanceof Exception && config.APP.APP_DEBUG) { 
                    error.mexLogger();
                }
                
                return res.status((error.status || 500)).json({
                    status: 'error',
                    message: error.message || 'Something went wrong.',
                    code: error.code || 'INTERNAL_SERVER_ERROR'
                });
            }
        }

        return res.render("crm/videos/index", { 
            title: `${config.APP.APP_NAME} || Video Management`,
            user: req.session.user
        });
    }

    static async flag(req, res) {
        try {
            const { videoId } = req.params;
            const { reason } = req.body;
            const user = req.session.user;

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
