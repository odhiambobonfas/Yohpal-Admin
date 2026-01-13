import VideosUtil from '@utils/VideosUtil';

/**
 * Middleware to check if a user is allowed to upload videos
 * Blocks uploads from users with status='inactive' (banned users)
 */
export default async (req, res, next) => {
    try {
        const userId = req.session?.user?.uid || req.body?.userId || req.query?.userId;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                code: 'UNAUTHORIZED',
                message: 'User authentication required'
            });
        }

        const uploadCheck = await VideosUtil.checkUserCanUpload(userId);

        if (!uploadCheck.canUpload) {
            return res.status(403).json({
                status: 'error',
                code: 'UPLOAD_RESTRICTED',
                message: 'Video upload is not allowed',
                data: {
                    reason: uploadCheck.reason
                }
            });
        }

        next();
    } catch (error) {
        console.error('Upload restriction middleware error:', error);
        return res.status(500).json({
            status: 'error',
            code: 'INTERNAL_ERROR',
            message: 'Failed to verify upload permissions'
        });
    }
};

