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
            console.log('ENTER getReportedVideos (Optimized)');

            // Query reports using Collection Group Query
            const reportsSnapshot = await FirestoreDatabase.collectionGroup('reports').get();

            if (reportsSnapshot.empty) {
                return { videos: [], reporters: [], creators: [] };
            }

            const reportsData = [];
            const videoIds = new Set();
            const userIds = new Set();

            for (const reportDoc of reportsSnapshot.docs) {
                const parentPath = reportDoc.ref.parent.parent.path;
                if (!parentPath.startsWith(Video.collection + '/')) continue;

                const videoId = reportDoc.ref.parent.parent.id;
                const reporterId = reportDoc.id;

                videoIds.add(videoId);
                userIds.add(reporterId);

                reportsData.push({
                    videoId,
                    reporterId,
                    data: reportDoc.data()
                });
            }

            const [videosSnapshot, usersSnapshot] = await Promise.all([
                Promise.all(Array.from(videoIds).map(id =>
                    FirestoreDatabase.collection(Video.collection).doc(id).get()
                )),
                Promise.all(Array.from(userIds).map(id =>
                    FirestoreDatabase.collection(User.collection).doc(id).get()
                ))
            ]);

            const videoLookup = new Map();
            videosSnapshot.forEach(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    videoLookup.set(doc.id, { id: doc.id, ...data });
                    const creatorId = data.userId || data.uid || data.userUid;
                    if (creatorId) userIds.add(creatorId);
                }
            });

            const creatorsToFetch = Array.from(userIds).filter(id =>
                !usersSnapshot.some(u => u.id === id)
            );

            let extraUsersSnapshot = [];
            if (creatorsToFetch.length > 0) {
                extraUsersSnapshot = await Promise.all(creatorsToFetch.map(id =>
                    FirestoreDatabase.collection(User.collection).doc(id).get()
                ));
            }

            const userLookup = new Map();
            [...usersSnapshot, ...extraUsersSnapshot].forEach(doc => {
                if (doc.exists) userLookup.set(doc.id, doc.data());
            });

            const videosMap = new Map();
            const reportersMap = new Map();
            const creatorsMap = new Map();

            for (const item of reportsData) {
                const { videoId, reporterId, data } = item;
                const reason = data.reason || 'No reason provided';
                const timestamp = data.timestamp;

                const videoInfo = videoLookup.get(videoId) || { title: 'Unknown', id: videoId };
                const reporterInfo = userLookup.get(reporterId) || { userName: 'Unknown' };

                const creatorId = videoInfo.userId || videoInfo.uid || videoInfo.userUid;
                let creatorInfo = { userName: 'Unknown Creator' };
                if (creatorId && userLookup.has(creatorId)) {
                    creatorInfo = userLookup.get(creatorId);
                }

                if (!videosMap.has(videoId)) {
                    videosMap.set(videoId, { videoInfo, reports: [] });
                }
                videosMap.get(videoId).reports.push({ reporterId, reporterInfo, reason, timestamp });

                if (!reportersMap.has(reporterId)) {
                    reportersMap.set(reporterId, { reporterInfo, reportedVideos: [] });
                }
                reportersMap.get(reporterId).reportedVideos.push({ videoId, videoInfo, reason, timestamp });

                if (creatorId) {
                    if (!creatorsMap.has(creatorId)) {
                        creatorsMap.set(creatorId, { creatorInfo, creatorId, reportsOnVideos: [] });
                    }
                    creatorsMap.get(creatorId).reportsOnVideos.push({ videoId, videoInfo, reporterId, reporterInfo, reason, timestamp });
                }
            }

            const videosArray = Array.from(videosMap.values()).map(v => ({
                id: v.videoInfo.id,
                ...v.videoInfo,
                isFlagged: v.videoInfo.flagged === true,
                reports: v.reports
            }));

            const reportersArray = Array.from(reportersMap.entries()).map(([id, val]) => ({
                id,
                ...val.reporterInfo,
                isBlocked: ['suspended', 'blocked', 'inactive'].includes(val.reporterInfo.status),
                reportedVideos: val.reportedVideos
            }));

            const creatorsArray = Array.from(creatorsMap.values()).map(c => ({
                id: c.creatorId,
                ...c.creatorInfo,
                isBlocked: ['suspended', 'blocked', 'inactive'].includes(c.creatorInfo.status),
                reportsOnVideos: c.reportsOnVideos
            }));

            return {
                videos: videosArray,
                reporters: reportersArray,
                creators: creatorsArray
            };

        } catch (error) {
            console.error('Error in getReportedVideos:', error);
            throw error;
        }
    }
}

export default new ReportUtil();