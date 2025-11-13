import jwt from 'jsonwebtoken';
import config from '@config/config';
import AppModel from '@models/AppModel'; 

class EventLogger extends AppModel {
    static table = ''; 

    static collection = 'events';

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

    
    static async eventsCategories(redis) { 
        const cacheKey = `yp:eventsCategories`;

        const temps = await redis.cacheParser(
            cacheKey,
            () => [
                // General / Event Notifications
                { name: 'User Registered', slug: 'user_registered', default: true, description: "Sent when a new user registers." },
                { name: 'Password Changed', slug: 'password_changed', default: true, description: "Sent when a user changes their password." },
                { name: 'Profile Updated', slug: 'profile_updated', default: true, description: "Sent when a user updates their profile." },
                { name: 'New Login Detected', slug: 'new_login_detected', default: true, description: "Sent when a new login is detected from an unrecognized device." },

                // System Events
                { name: 'System Error', slug: 'system_error', default: true, description: "Sent when a critical system error occurs." },
                { name: 'Service Downtime', slug: 'service_downtime', default: true, description: "Sent when a service experiences downtime." },
                { name: 'Data Backup Completed', slug: 'data_backup_completed', default: true, description: "Sent when a data backup is successfully completed." },
                { name: 'Data Backup Failed', slug: 'data_backup_failed', default: true, description: "Sent when a data backup fails." },
                
                // Security Events
                { name: 'Suspicious Activity', slug: 'suspicious_activity', default: true, description: "Sent when suspicious activity is detected on an account." },
                { name: 'Account Locked', slug: 'account_locked', default: true, description: "Sent when an account is locked due to multiple failed login attempts." },
                { name: 'Two-Factor Authentication Enabled', slug: '2fa_enabled', default: true, description: "Sent when a user enables two-factor authentication." },
                { name: 'Two-Factor Authentication Disabled', slug: '2fa_disabled', default: true, description: "Sent when a user disables two-factor authentication." },

                // Transaction Events
                { name: 'Payment Processed', slug: 'payment_processed', default: true, description: "Sent when a payment is successfully processed." },
                { name: 'Payment Failed', slug: 'payment_failed', default: true, description: "Sent when a payment fails." },
                { name: 'Refund Issued', slug: 'refund_issued', default: true, description: "Sent when a refund is issued to a user." },
                { name: 'Subscription Renewed', slug: 'subscription_renewed', default: true, description: "Sent when a user's subscription is renewed." },
                { name: 'Subscription Canceled', slug: 'subscription_canceled', default: true, description: "Sent when a user cancels their subscription." },
                { name: 'Invoice Generated', slug: 'invoice_generated', default: true, description: "Sent when an invoice is generated for a user." },
                { name: 'Invoice Payment Received', slug: 'invoice_payment_received', default: true, description: "Sent when payment is received for an invoice." },
                { name: 'Low Balance Alert', slug: 'low_balance_alert', default: true, description: "Sent when a user's account balance is low." },
                { name: 'High-Value Transaction', slug: 'high_value_transaction', default: true, description: "Sent when a high-value transaction is made." },
                { name: 'Fraudulent Transaction Detected', slug: 'fraudulent_transaction_detected', default: true, description: "Sent when a potentially fraudulent transaction is detected." },
                { name: 'Payment Method Updated', slug: 'payment_method_updated', default: true, description: "Sent when a user updates their payment method." },
                { name: 'Billing Information Updated', slug: 'billing_info_updated', default: true, description: "Sent when a user updates their billing information." },
                { name: 'Tax Document Available', slug: 'tax_document_available', default: true, description: "Sent when a tax document is available for download." },
                { name: 'Chargeback Issued', slug: 'chargeback_issued', default: true, description: "Sent when a chargeback is issued on a transaction." },
                { name: 'Payment Dispute Resolved', slug: 'payment_dispute_resolved', default: true, description: "Sent when a payment dispute is resolved." },
                { name: 'Recurring Payment Failed', slug: 'recurring_payment_failed', default: true, description: "Sent when a recurring payment fails." },
                { name: 'Payment Plan Changed', slug: 'payment_plan_changed', default: true, description: "Sent when a user changes their payment plan." },
                { name: 'Account Credited', slug: 'account_credited', default: true, description: "Sent when a user's account is credited." },
                { name: 'Account Debited', slug: 'account_debited', default: true, description: "Sent when a user's account is debited." },

                // MPESA Events
                { name: 'Mpesa Payment Received', slug: 'mpesa_payment_received', default: true, description: "Sent when an Mpesa payment is received." },
                { name: 'Mpesa Payment Failed', slug: 'mpesa_payment_failed', default: true, description: "Sent when an Mpesa payment fails." },
                { name: 'Mpesa Account Balance Low', slug: 'mpesa_account_balance_low', default: true, description: "Sent when an Mpesa account balance is low." },
                { name: 'Mpesa Transaction Reversed', slug: 'mpesa_transaction_reversed', default: true, description: "Sent when an Mpesa transaction is reversed." },
                { name: 'Mpesa Payment Confirmation', slug: 'mpesa_payment_confirmation', default: true, description: "Sent to confirm an Mpesa payment." },
                { name: 'Mpesa Payment Validation', slug: 'mpesa_payment_validation', default: true, description: "Sent to validate an Mpesa payment." },
                { name: 'Mpesa Subscription Payment', slug: 'mpesa_subscription_payment', default: true, description: "Sent when an Mpesa subscription payment is processed." },
                { name: 'Mpesa Refund Processed', slug: 'mpesa_refund_processed', default: true, description: "Sent when an Mpesa refund is processed." },
                { name: 'Mpesa Payment Dispute', slug: 'mpesa_payment_dispute', default: true, description: "Sent when there is a dispute regarding an Mpesa payment." },
                { name: 'Mpesa Transaction Notification', slug: 'mpesa_transaction_notification', default: true, description: "Sent to notify about an Mpesa transaction." },
                { name: 'Mpesa Account Statement', slug: 'mpesa_account_statement', default: true, description: "Sent when an Mpesa account statement is generated." },
                { name: 'Mpesa Payment Reminder', slug: 'mpesa_payment_reminder', default: true, description: "Sent to remind users of upcoming Mpesa payments." },
                { name: 'Mpesa Account Update', slug: 'mpesa_account_update', default: true, description: "Sent when there is an update to the Mpesa account." },
                { name: 'Mpesa Promotional Offer', slug: 'mpesa_promotional_offer', default: true, description: "Sent to inform users about Mpesa promotional offers." },
                { name: 'Mpesa Security Alert', slug: 'mpesa_security_alert', default: true, description: "Sent when there is a security alert related to Mpesa transactions." },

                // Miscellaneous
                { name: 'Feature Announcement', slug: 'feature_announcement', default: true, description: "Sent to announce new features or updates." },
                { name: 'Survey Invitation', slug: 'survey_invitation', default: true, description: "Sent to invite users to participate in surveys." },
                { name: 'Event Reminder', slug: 'event_reminder', default: true, description: "Sent to remind users of upcoming events." },
                { name: 'Newsletter', slug: 'newsletter', default: true, description: "Sent as part of regular newsletters to users." }

                // Add more event notification categories as needed
            ]
        );

        return temps;
    } 
    
    static async dispatch(redis, data, cacheDuration = null) {
        const cacheKey = `yp:events:${data.eventType}:${data.eventActor}`;  
        let request = await redis.cacheParser(cacheKey, 
            () => {
                return data?.eventPayload;
            },
            cacheDuration || 259200, // cached for three days! 
        ); 

        return request;
    }

    static async getRecentEvents(redis, limit = 10) {
        const pattern = 'yp:events:*';
        const keys = await redis.getKeysByPattern(pattern);
        const events = [];  

        // PROMISE ALL 
        await Promise.all(keys.map(async (key) => {
            const eventData = await redis.getFunc(key);
            if (eventData) {
                events.push({
                    key,
                    data: eventData
                });
            }
        }));

        // Sort events by Descending order
        events.sort((a, b) => {
            const dateA = new Date(a.data.createdAt || 0);
            const dateB = new Date(b.data.createdAt || 0);
            return dateB - dateA;
        });

        return events.slice(0, limit);
    }

    static async allEvents(redis) {
        const pattern = 'yp:events:*';
        const keys = await redis.getKeysByPattern(pattern);
        const events = []; 

        // PROMISE ALL
        await Promise.all(keys.map(async (key) => {
            const eventData = await redis.getFunc(key);
            if (eventData) {
                events.push({
                    key,
                    data: eventData
                });
            }
        }));

        // Sort events by Descending order
        events.sort((a, b) => {
            const dateA = new Date(a.data.createdAt || 0);
            const dateB = new Date(b.data.createdAt || 0);
            return dateB - dateA;
        });

        return events;
    }

    static async clearEvents(redis) {
        const pattern = 'yp:events:*';
        const keys = await redis.getKeysByPattern(pattern);
        if (keys.length > 0) {
            await redis.client.deleteFunc(keys);
        }

        return true;
    }
}

export default EventLogger;
