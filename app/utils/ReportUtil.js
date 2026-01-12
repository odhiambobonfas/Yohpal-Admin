import Util from '@utils/Util';
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import User from '@models/User';
import Video from '@models/Video';

class ReportUtil extends Util {
    constructor() {
        super();
    }

    async getAllUsers() {
        try {
            console.log('ENTER getAllUsers');
            
            const usersSnapshot = await FirestoreDatabase
                .collection(User.collection)
                .get();

            console.log(`Found ${usersSnapshot.docs.length} users in database`);

            const users = usersSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    email: data.email || 'N/A',
                    userName: data.userName || data.firstName || 'Anonymous'
                };
            });

            console.log(`EXIT getAllUsers - returning ${users.length} users`);
            return users;
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