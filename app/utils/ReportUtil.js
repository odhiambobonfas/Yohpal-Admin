import Util from '@utils/Util';
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import User from '@models/User';
import Video from '@models/Video';

class ReportUtil extends Util {
    constructor() {
        super();
    }

    async getAllUsers(redis, params = {}) {
        try {
            console.log('ENTER getAllUsers', params);

            const { start = 0, length = 10, search = '', status = '' } = params;
            const limit = parseInt(length);
            const offset = parseInt(start);

            const cacheKey = 'yp:users:total:count';

            // 1. Get Total Count (Cached)
            const recordsTotal = await redis?.cacheParser(
                cacheKey,
                async () => {
                    const snapshot = await FirestoreDatabase
                        .collection(User.collection)
                        .where('email', '>=', '')
                        .count()
                        .get();
                    return snapshot.data().count;
                },
                300
            ) || 0;


            let recordsFiltered = recordsTotal;



            // 2. Build Query
            let query = FirestoreDatabase.collection(User.collection);
            let hasFilters = false;

            // 3. Apply Search
            if (search && search.toString().trim().length > 0) {
                const searchTerm = search.toString().toLowerCase().trim();

                query = query.where('email', '>=', searchTerm)
                    .where('email', '<=', searchTerm + '\uf8ff');

                hasFilters = true;
            }

            // 3.1 Apply Status Filter
            if (status && status !== 'all') {
                if (status === 'deleted') {
                    // User requested unique fields for filtering accounts scheduled for deletion
                    query = query.where('isDeactivated', '==', true)
                        .where('scheduledForDeletion', '==', true);
                    hasFilters = true;
                } else if (['active', 'inactive', 'suspended', 'pending'].includes(status)) {
                    query = query.where('status', '==', status);
                    hasFilters = true;
                }
            }

            // Only Recalculate filtered count if filters were actually applied
            if (hasFilters) {
                const filteredCountSnapshot = await query.count().get();
                recordsFiltered = filteredCountSnapshot.data().count;
            }

            // 4. Apply Pagination
            // Only order by email if we are NOT filtering by status, or if we are searching (which implies email filter/sort logic might vary)
            // This avoids "missing index" errors for 'status' + 'email' composite queries if the index doesn't exist.
            if (!status || status === 'all') {
                query = query.orderBy('email');
            }

            const usersSnapshot = await query
                .limit(limit)
                .offset(offset)
                .get();

            const users = usersSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    uid: data.uid || doc.id,
                    email: data.email || 'N/A',
                    userName: data.userName || data.firstName || 'N/A',
                    createdAt: data.createdAt ? new Date(data.createdAt._seconds * 1000).toISOString() : 'N/A',
                    status: data.status || 'active',
                    flagged: data.flagged || false,
                    banReason: data.banReason || null,
                    flagReason: data.flagReason || null,
                    banCount: data.banCount || 0,
                    // Deletion fields
                    deactivatedAt: data.deactivatedAt ? new Date(data.deactivatedAt._seconds * 1000).toISOString() : null,
                    deletionDate: data.deletionDate ? new Date(data.deletionDate._seconds * 1000).toISOString() : null,
                    scheduledForDeletion: data.scheduledForDeletion || false,
                    isDeactivated: data.isDeactivated || false,
                    updatedBy: data.updatedBy || null
                };
            });

            console.log(`EXIT getAllUsers - returning ${users.length} users (Total: ${recordsTotal}, Filtered: ${recordsFiltered})`);

            return {
                data: users,
                recordsTotal: recordsTotal,
                recordsFiltered: recordsFiltered
            };
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            throw error;
        }
    }

    async getReportedVideos() {
        try {
            console.log('ENTER getReportedVideos');

            // Get videos that have reports subcollection
            const videosSnapshot = await FirestoreDatabase
                .collection(Video.collection)
                .orderBy('timestamp', 'desc')
                .limit(20)
                .get();

            console.log(`Checking ${videosSnapshot.docs.length} videos for reports`);

            const reportedVideos = [];

            // Check each video for reports subcollection
            for (const videoDoc of videosSnapshot.docs) {
                const videoId = videoDoc.id;

                try {
                    const reportsSnapshot = await FirestoreDatabase
                        .collection(Video.collection)
                        .doc(videoId)
                        .collection('reports')
                        .get();

                    if (reportsSnapshot.empty) continue;

                    const videoData = { id: videoId, ...videoDoc.data() };
                    const reports = [];

                    // Process each report
                    for (const reportDoc of reportsSnapshot.docs) {
                        const reportData = reportDoc.data();

                        // Get reporter user info
                        let reporterName = 'Unknown';
                        let reporterEmail = 'Unknown';

                        if (reportData.uid) {
                            try {
                                const userSnapshot = await FirestoreDatabase
                                    .collection(User.collection)
                                    .where('uid', '==', reportData.uid)
                                    .limit(1)
                                    .get();

                                if (!userSnapshot.empty) {
                                    const userData = userSnapshot.docs[0].data();
                                    reporterName = userData.userName || userData.firstName || userData.fullName || 'Unknown';
                                    reporterEmail = userData.email || 'Unknown';
                                }
                            } catch (error) {
                                console.log('Error fetching reporter info:', error.message);
                            }
                        }

                        reports.push({
                            reason: reportData.reason || 'No reason provided',
                            timestamp: reportData.timestamp,
                            reporterUid: reportData.uid,
                            reporterName,
                            reporterEmail
                        });
                    }

                    const firstReport = reports[0] || {};

                    const reportedVideo = {
                        ...videoData,
                        reports,
                        reportCount: reports.length,
                        reason: firstReport.reason,
                        reportedAt: firstReport.timestamp,
                        reporterName: firstReport.reporterName,
                        reporterId: firstReport.reporterUid,
                        reporterEmail: firstReport.reporterEmail
                    };

                    reportedVideos.push(reportedVideo);

                } catch (error) {
                    console.log(`Error checking reports for video ${videoId}:`, error.message);
                }
            }

            console.log(`EXIT getReportedVideos - returning ${reportedVideos.length} videos`);
            return reportedVideos;

        } catch (error) {
            console.error('Error in getReportedVideos:', error);
            throw error;
        }
    }
}

export default new ReportUtil();