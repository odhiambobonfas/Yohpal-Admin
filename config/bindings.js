const bindings = {
    // API endpoints bindings
    endpoints: {
        // authentication endpoints bindings
        auth_user: {
            method: 'POST',
            route: 'https://yohpal-market-apis.onrender.com/auth/signin',
            action: 'Sign In User API service - log in to ...',
        },

        firebase_auth: {
            method: "POST",
            route: 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=',
            action: 'Firebase authentication API endpoint'
        },

        // Mpesa endpoints bindings
        registerCallbacks: {
            method: "POST",
            route: 'https://msv1.yohpal.com/v1/callbacks/register',
            action: 'Callback registration happens via this endpoint!'
        },

        // Communication bindings
        createEmail: {
            method: "POST",
            route: 'https://msv1.yohpal.com/v1/api/email/create',
            action: 'Email creation happens via this endpoint!'
        },
    },

    // Role Permission Bindings 
    permissions: {
        // Authentication
        auth: {
            access: 'auth.access',
            suspend: 'auth.suspend',
            reset_password: 'auth.reset_password'
        },

        // Dashboard
        dashboard: {
            view: 'dashboard.view',
            access: 'crm.access',
        },

        // Users Panel
        users: {
            access: 'users.access',
            list: 'users.list',
            view: 'users.view',
            create: 'users.create',
            edit: 'users.edit',
            delete: 'users.delete',
            activate: 'users.activate',
            deactivate: 'users.deactivate',
            suspend: 'users.suspend',
        },

        // Roles Management
        roles: {
            access: 'roles.access',
            view: 'roles.view',
            create: 'roles.create',
            edit: 'roles.edit',
            delete: 'roles.delete',
            assign: 'roles.assign',
            activate: 'roles.activate',
            deactivate: 'roles.deactivate',
            suspend: 'roles.suspend',
        },

        // Contacts Panel
        contacts: {
            access: 'contacts.access',
            create: 'contacts.create',
            edit: 'contacts.edit',
            delete: 'contacts.delete',
            groups: 'contacts.view.groups',
            contact_groups: 'contacts.group.access',
        },

        // Communication Panel (merged with chat)
        communication: {
            access_module: 'communication.access',
            access_chat: 'communication.chat.access',
            announcements: 'communication.announcements',
            access_email_mangement: 'communication.emails.access',
            access_mails_inbox: 'communication.mails.access',
            access_bulk_messaging: 'communication.bulkMessaging.access',
            edit_email_record: 'communication.emails.edit',
            delete_email_record: 'communication.emails.delete',
            suspend_login_email_record_status: 'communication.emails.suspend_login',
            unsuspend_login_email_record_status: 'communication.emails.unsuspend_login',
            suspend_incoming_email_record_status: 'communication.emails.suspend_incoming',
            unsuspend_incoming_email_record_status: 'communication.emails.unsuspend_incoming',
            suspend_outgoing_email_record_status: 'communication.emails.suspend_outgoing',
            unsuspend_outgoing_email_record_status: 'communication.emails.unsuspend_outgoing',
        },

        chat: {
            messages: 'chat.messages',
            groups: 'chat.groups',
            contacts: 'chat.contacts',
        },

        // Payment Accounts
        accounts: {
            access_accounts: 'accounts.access',
            view_accounts: 'accounts.view',
            create_accounts: 'accounts.create',
            edit_accounts: 'accounts.edit',
            delete_accounts: 'accounts.delete',
            deposit_amount: 'accounts.deposit',
            transfer_amount: 'accounts.transfer',
            access_bank_accounts: 'accounts.bank.access',
            edit_account_categories: 'accounts.categories.edit',
            delete_account_categories: 'accounts.categories.delete',
        },

        invoices: {
            access: 'invoices.access',
        },

        expenses: {
            access: 'expenses.access',
        },

        // Transactions
        transactions: {
            access: 'transactions.access',
            view_incoming: 'transactions.view.incoming',
            view_outgoing: 'transactions.view.outgoing',
            view_reversals: 'transactions.view.reversals',
            create: 'transactions.create',
            edit: 'transactions.edit',
            delete: 'transactions.delete',
        },

        hrm: {
            access_dashboard: 'hrm.dashboard.access',
            access_employees: 'hrm.employees.access',
            access_departments: 'hrm.departments.access',
            edit_departments: 'hrm.departments.edit',
            delete_departments: 'hrm.departments.delete',
            access_designation: 'hrm.designation.access',
            edit_designations: 'hrm.designations.edit',
            delete_designations: 'hrm.designations.delete',
            access_payroll: 'hrm.payroll.access',
            access_attendance: 'hrm.attendance.access',
            edit_attendance: 'hrm.attendance.edit',
            view_attendance: 'hrm.attendance.view',
            create_attendance_shift: 'hrm.attendance.customShifts.create',
            access_holidays: 'hrm.holidays.access',
            edit_holidays: 'hrm.holidays.edits',
            view_holidays: 'hrm.holidays.view',
            access_leaves: 'hrm.leaves.access',
            view_leaves: 'hrm.leaves.view',
            edi_leaves: 'hrm.leaves.edit',
            confirm_leaves: 'hrm.leaves.confirm',
            reject_leaves: 'hrm.leaves.reject',
            delete_leaves: 'hrm.leaves.delete',
            create_leaves: 'hrm.leaves.create',
            create_custom_leave_type: 'hrm.leaves.custom.create',
            edit_components: 'hrm.payments.components.edit',
            delete_components: 'hrm.payments.components.delete',
            edit_component_brackets: 'hrm.payments.brackets.edit',
            delete_component_brackets: 'hrm.payments.brackets.delete',
            edit_component_tiers: 'hrm.payments.tiers.edit',
            delete_component_tiers: 'hrm.payments.tiers.delete',
            manage_account_types: 'accounts.types.manage',
        },

        // Wallet
        wallet: {
            deposit: 'wallet.deposit',
            withdraw: 'wallet.withdraw',
            transactions: 'wallet.transactions',
        },

        // Market
        market: {
            products: 'market.products',
            orders: 'market.orders',
            vendors: 'market.vendors',
        },

        // Hustle
        hustle: {
            hustle_jobs_access: 'hustle.jobs.access',
            hustle_projects_access: 'hustle.projects.access',
            access_hustle_clients_access: 'hustle.clients.access',
            hustle_hustlers_access: 'hustle.hustlers.access',
        },

        // Accounting
        accounting: {
            access: 'accounting.access',
            overview: 'accounting.view.overview',
            ledgers: 'accounting.view.ledgers',
            statements: 'accounting.view.statements',
        },

        // Reports
        reports: {
            access: 'reports.access',
            users: 'reports.users',
            financial: 'reports.financial',
            activity: 'reports.activity',
            payments: 'reports.view.payments',
            communication: 'reports.view.communication',
            system: 'reports.view.system',
            access_account_report: 'reports.accounts.access'
        },

        // Profile
        profile: {
            view: 'profile.view',
            edit: 'profile.edit',
        },

        // Notifications Permissions
        notifications: {
            access: 'notifications.access',
            view_all: 'notifications.view.all',
            view_system: 'notifications.view.system',
            view_emails: 'notifications.view.emails',
            view_sms: 'notifications.view.sms',
            view_whatsapp: 'notifications.view.whatsapp',
            view_templates: 'notifications.view.templates',
            edit_templates: 'notifications.templates.edit',
            delete_templates: 'notifications.templates.delete',
            activate_templates: 'notifications.templates.activate',
            deactivate_templates: 'notifications.templates.deactivate',
            view_categories: 'notifications.view.categories',
            manage_templates: 'notifications.manage.templates',
            manage_categories: 'notifications.manage.categories',
            manage_send: 'notifications.manage.send',
            manage_system: 'notifications.manage.system',
            manage_emails: 'notifications.manage.emails',
            manage_sms: 'notifications.manage.sms',
            manage_whatsapp: 'notifications.manage.whatsapp',
            settings: 'notifications.settings',
        },

        // Settings
        settings: {
            access: 'settings.access',
            app_settings_access: 'settings.view',
            view_general_settings: 'settings.general.view',
            update_general_settings: 'settings.general.update',
            create_api_settings: "settings.api.create",
            edit_api_settings: "settings.api.edit",
            activate_api_settings: "settings.api.activate",
            deactivate_api_settings: "settings.api.deactivate",
            suspend_api_settings: "settings.api.suspend",
            update_status_api_settings: "settings.api.statusUpdate",
            edit_cdn_settings: "settings.cdn.edit",
            delete_cdn_settings: "settings.cdn.delete",
            activate_cdn_settings: "settings.cdn.activate",
            deactivate_cdn_settings: "settings.cdn.deactivate",
            suspend_cdn_settings: "settings.cdn.suspend",
            register_mpesa_callbacks: "settings.mpesa.register_endpoint",
            access_cpanel_setting: 'edit',
            delete_cpanel_setting: 'delete',
            activate_cpanel_setting: 'activate',
            deactivate_cpanel_setting: 'deactivate',
            access_cpanel_setting: 'settings.cpanel.edit',
            delete_cpanel_setting: 'settings.cpanel.delete',
            activate_cpanel_setting: 'settings.cpanel.activate',
            deactivate_cpanel_setting: 'settings.cpanel.deactivate',
        },

        // Developer
        developer: {
            access: 'developer.access',
            create_app: 'developer.apps.create',
            view_app: 'developer.view.apps',
            edit_app: 'developer.apps.update',
            delete_app: 'developer.apps.delete',
            upload_updates: 'developer.zip.upload',
            unpack_updates: 'developer.zip.unpack',
        },

        // Videos Management
        videos: {
            access: 'videos.access',
            view: 'videos.view',
            flag: 'videos.flag',
            unflag: 'videos.unflag',
            delete: 'videos.delete',
        },
    },

    templateInstructions: {
        business_info: {
            tabName: 'Business Info',
            description: 'Details related to the business identity and contact information.',
            bindings: {
                business_logo: {
                    name: 'Business Logo',
                    slug: 'business_logo',
                    description: 'The official logo of the business, used in documents and communication.',
                },
                business_name: {
                    name: 'Business Name',
                    slug: 'business_name',
                    description: 'The registered name of the business.',
                },
                business_email: {
                    name: 'Business Email',
                    slug: 'business_email',
                    description: 'Primary communication email address for the business.',
                },
                business_phone: {
                    name: 'Business Phone',
                    slug: 'business_phone',
                    description: 'The official contact phone number of the business.',
                },
                business_address: {
                    name: 'Business Address',
                    slug: 'business_address',
                    description: 'The postal or physical address of the business.',
                },
            }
        },

        user_info: {
            tabName: 'User Info',
            description: 'Details related to the user performing the action or receiving the notification.',
            bindings: {
                user_id: {
                    name: 'User ID',
                    slug: 'user_id',
                    description: 'Unique system identifier for the user.',
                },
                user_email: {
                    name: 'User Email',
                    slug: 'user_email',
                    description: 'The email address of the user.',
                },
                user_username: {
                    name: 'Username',
                    slug: 'user_username',
                    description: 'The display or login username of the user.',
                },
                login_at: {
                    name: 'Login Time',
                    slug: 'login_at',
                    description: 'The date and time when the user logged in.',
                },
                ip_address: {
                    name: 'IP Address',
                    slug: 'ip_address',
                    description: 'The IP address used during login.',
                },
                user_agent: {
                    name: 'User Agent',
                    slug: 'user_agent',
                    description: 'Browser or device used to perform the login.',
                },
            }
        },

        payment_info: {
            tabName: 'Payment Info',
            description: 'Bindings for invoices, payments and financial communication.',
            bindings: {
                payment_amount: {
                    name: 'Payment Amount',
                    slug: 'payment_amount',
                    description: 'The amount paid by the customer.',
                },
                payment_date: {
                    name: 'Payment Date',
                    slug: 'payment_date',
                    description: 'The date the payment was made.',
                },
                payment_method: {
                    name: 'Payment Method',
                    slug: 'payment_method',
                    description: 'The payment channel used (M-Pesa, Cash, Bank).',
                },
                invoice_amount: {
                    name: 'Invoice Amount',
                    slug: 'invoice_amount',
                    description: 'The total invoice amount issued to the customer.',
                },
                invoice_due_date: {
                    name: 'Invoice Due Date',
                    slug: 'invoice_due_date',
                    description: 'The deadline for paying the invoice.',
                },
            }
        },

        system_info: {
            tabName: 'System Info',
            description: 'Auto-generated metadata from the system.',
            bindings: {
                current_date: {
                    name: 'Current Date',
                    slug: 'current_date',
                    description: 'The date the notification is generated.',
                },
                current_time: {
                    name: 'Current Time',
                    slug: 'current_time',
                    description: 'The time the notification is generated.',
                },
                system_name: {
                    name: 'System Name',
                    slug: 'system_name',
                    description: 'Name of the SaaS system sending the notification.',
                },
            }
        },
    }
}

export default bindings;