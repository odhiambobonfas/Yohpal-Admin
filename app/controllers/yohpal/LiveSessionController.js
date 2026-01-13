import LiveSessionUtil from '@utils/LiveSessionUtil';
import mexDtParser from '@config/mexDtParser';
import { isAjaxRequest } from '@config/utils';

class LiveSessionController {
    
    // Render Active Sessions View
    static async activeSessions(req, res) {
        return res.render("crm/yohpal/live/active", { 
            title: "Active Live Sessions",
            user: req.session.user 
        });
    }

    // Render History Sessions View
    static async historySessions(req, res) {
        return res.render("crm/yohpal/live/history", { 
            title: "Live Sessions History",
            user: req.session.user 
        });
    }

    // API for Active Sessions
    static async getActiveSessionsApi(req, res) {
        try {
            if (!isAjaxRequest(req)) {
                return res.status(400).json({ error: 'Invalid request' });
            }

            // Extract DataTables parameters
            const draw = parseInt(req.query.draw) || 1;
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;

            // Fetch active sessions
            const { data, total } = await LiveSessionUtil.getActiveLiveSessions(req.redis, {
                offset: start,
                limit: length
            });

            // Format response for DataTables
            return res.json({
                draw,
                recordsTotal: total,
                recordsFiltered: total,
                data
            });
        } catch (error) {
            console.error('Error in getActiveSessionsApi:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // API for History Sessions
    static async getHistorySessionsApi(req, res) {
        try {
            if (!isAjaxRequest(req)) {
                return res.status(400).json({ error: 'Invalid request' });
            }

            // Extract DataTables parameters
            const draw = parseInt(req.query.draw) || 1;
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;

            // Extract filters
            const filters = {};
            if (req.query.daterange) {
                filters.daterange = req.query.daterange;
            }

            // Fetch history sessions
            const { data, total } = await LiveSessionUtil.getHistoryLiveSessions(req.redis, {
                offset: start,
                limit: length,
                filters
            });

            // Format response for DataTables
            return res.json({
                draw,
                recordsTotal: total,
                recordsFiltered: total,
                data
            });
        } catch (error) {
            console.error('Error in getHistorySessionsApi:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Render Analytics/Insights View
    static async analytics(req, res) {
        return res.render("crm/yohpal/live/analytics", { 
            title: "Streaming Insights",
            user: req.session.user 
        });
    }

    // API for Streaming Insights
    static async getAnalyticsApi(req, res) {
        try {
            const data = await LiveSessionUtil.getLiveInsights(req.redis);
            return res.status(200).json({
                status: 'success',
                data
            });
        } catch (error) {
            console.error('Error in getAnalyticsApi:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get just the count of active sessions for UI badges
     * GET /live/api/count/active
     */
    static async getActiveCountApi(req, res) {
        try {
            const count = await LiveSessionUtil.getActiveLiveSessionsCount(req.redis);
            return res.status(200).json({
                status: 'success',
                count
            });
        } catch (error) {
            console.error('Error in getActiveCountApi:', error);
            return res.status(500).json({ count: 0 });
        }
    }
}

export default LiveSessionController;
