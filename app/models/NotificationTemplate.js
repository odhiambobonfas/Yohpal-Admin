import jwt from 'jsonwebtoken';
import config from '@config/config';
import AppModel from '@models/AppModel';   

class NotificationTemplate extends AppModel {
    static table = ''; 

    static collection = 'notificationCategories';

    static fields = {};

    static nullableFields = [];

    /**
     * Defines all model associations and relationships.
     * This method is automatically called after all models are initialized.
     * 
     * @param {Object.<string, Model>} models - Dictionary of all initialized models,
     *   keyed by model name. Use this to reference other models when defining associations.
     */
    static associate(models) {
        // Define all associations here
    } 

    static async notificationCategories(redis) { 
        const cacheKey = `yp:notificationCategories`;

        const temps = await redis.cacheParser(
            cacheKey,
            () => [
                // General / System Notifications
                { name: 'Welcome Message', slug: 'welcome_message', default: true, description: "Sent to new users upon registration." },
                { name: 'User Login', slug: 'user_login', default: true, description: "Sent when a user logs in." },
                { name: 'Password Reset', slug: 'password_reset', default: true, description: "Sent when a user requests a password reset." },
                { name: 'Account Activation', slug: 'account_activation', default: true, description: "Sent when an account is activated." },

                // Yohpal App Manager
                { name: 'App Submission Approved', slug: 'app_submission_approved', default: true, description: "Sent when an app submission is approved in App Manager." },
                { name: 'App Submission Rejected', slug: 'app_submission_rejected', default: true, description: "Sent when an app submission is rejected in App Manager." },
                { name: 'App Update Notification', slug: 'app_update_notification', default: true, description: "Sent to users when an app has an update available." },

                // Hustle Module
                { name: 'New Opportunity Alert', slug: 'new_opportunity_alert', default: true, description: "Notifies users of new job opportunities." },
                { name: 'Opportunity Assignment', slug: 'opportunity_assignment', default: true, description: "Sent when a user is assigned to an opportunity." },
                { name: 'Opportunity Completed', slug: 'opportunity_completed', default: true, description: "Sent when a user completes an assigned opportunity." },

                // Chat Module
                { name: 'New Chat Message', slug: 'new_chat_message', default: true, description: "Sent when a user receives a new chat message." },
                { name: 'Chat Request Accepted', slug: 'chat_request_accepted', default: true, description: "Notifies a user when their chat request is accepted." },

                // Video Module
                { name: 'Video Call Invitation', slug: 'video_call_invitation', default: true, description: "Sent when a user is invited to a video call." },
                { name: 'Video Call Reminder', slug: 'video_call_reminder', default: true, description: "Sent to remind a user of an upcoming video call." },

                // Miscellaneous
                { name: 'Payment Received', slug: 'payment_received', default: true, description: "Sent to users when a payment is successfully received." },
                { name: 'Payment Failed', slug: 'payment_failed', default: true, description: "Sent to users when a payment fails." },
                { name: 'System Alert', slug: 'system_alert', default: true, description: "Sent for important system alerts." }
            ]
        );

        return temps;
    } 

    static async templateCategoriesForDropdown(redis) {
        const temps = await this.notificationCategories(redis);
        let html = '';
        temps.forEach(temp => {
            html += `<option value="${temp.slug}">${temp.name}</option>`;
        });
        
        return html;
    }

}

export default NotificationTemplate;
