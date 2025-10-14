const LANG_EN = {
    // Request errors
    req: {
        // api errors
        request_denied: "Your request has been denied.",
        invalid_csrf_token: "Invalid CSRF token. Please refresh the page and try again.",
        session_expired: "Your session has expired. Please log in again.",
        invalid_request: "Invalid request. Please check your input and try again.",
        missing_parameters: "Missing required parameters. Please provide all necessary information.",
        unauthorized_access: "You do not have permission to access this resource.",
        resource_not_found: "The requested resource could not be found.",
        internal_server_error: "An internal server error occurred. Please try again later.",
        bad_gateway: "Bad gateway. Please try again later.",
        service_unavailable: "Service is currently unavailable. Please try again later.",
        gateway_timeout: "Gateway timeout. Please try again later.",

        // user errors
        unauthenticated: "You must be logged in to perform this action.",
        forbidden: "You do not have permission to perform this action.",

        invalid_data_format: "The data format provided is invalid. Please check and try again.",
        operation_failed: "The operation could not be completed. Please try again.",
        duplicate_entry: "A record with the same information already exists.",

        invalid_username: "The username provided is invalid. Please check and try again.",
        invalid_firstname: "The first name provided is invalid. Please check and try again.",
        invalid_lastname: "The last name provided is invalid. Please check and try again.",
        invalid_email: "The email address provided is invalid. Please check and try again.",
        invalid_email_format: "The email address format is incorrect. Please provide a valid email.",
        invalid_password: "The password provided does not meet the required criteria.",
        password_mismatch: "The passwords provided do not match. Please check and try again.",
        user_not_found: "The specified user could not be found.",
        invalid_role: "The role specified is invalid. Please check and try again.",
        invalid_status: "The status value provided is invalid. Please use Active, Inactive, or Pending.",
        insufficient_permissions: "You do not have sufficient permissions to perform this action.",
        user_creation_failed: "Failed to create user. Please try again.",
        User_update_failed: "Failed to update user. Please try again.",
        user_already_exists: "A user with this email or username already exists.",
        user_email_already_exists: "A user with this email already exists.",
        userName_already_exists: "A user with this username already exists.",
        user_unexists: "A user with this email or username already exists.",
        user_email_unexists: "A user with this email already exists.",
        userName_unexists: "A user with this username already exists.",
        uid_and_status_required: "User ID and status are required to update user status.",
        invalid_avatar_exemption: "Failed to upload profile picture. Please try again.",
        company_logo_upload_exemption: "Failed to upload company logo. Please try again.",

        // role errors
        role_id_required: "Role ID is required.",
        role_status_required: "Role status is required.",
        default_role_status_exception: "Default roles cannot have their status changed.",
        admin_role_status_exception: "Admin roles cannot have their status changed.",

        // Authentication
        authentication_error_exception: "User authentication failed. Please log in again.",

        // Provider / API Settings
        provider_name_required: "Provider name is required.",
        provider_code_required: "Provider code is required.",
        phone_number_required: "Phone number is required.",
        email_address_required: "Email address is required.",
        target_application_required: "Target application is required.",
        provider_environ_required: "Provider environment category is required.",
        provider_settings_required: "Provider settings object is required.",
        provider_description_limit: "Description cannot exceed 200 characters.",

        create_provider_query_failed: "The API setting could not be created.",
        provider_created_success: "API setting created successfully!",

        // settings 
        company_name_required: "Company name is required.",
        company_name_limit: "Company name cannot exceed 100 characters.",
        company_email_required: "Company email address is required.",
        company_phone_required: "Company phone number is required.",
        company_address_required: "Company address is required.",
        company_address_limit: "Company address cannot exceed 200 characters.",
        company_industry_limit: "Company industry cannot exceed 50 characters.",
        company_registration_limit: "Company registration number cannot exceed 50 characters.",

        // department
        department_name_required: "Department name is required.",
        department_code_required: "Department code is required.",
        department_exists: "A department with the same name or code already exists.",

        // designation
        designation_name_required: "Designation name is required.",
        designation_code_required: "Designation code is required.",
        designation_exists: "A designation with the same name or code already exists.",
        provider_code_required: "Provider code is required.",

        // holiday
        holiday_name_required: "Holiday name is required.",
        holiday_start_date_invalid: "Please provide a valid start date for the holiday.",
        holiday_end_date_invalid: "Please provide a valid end date for the holiday.",
        holiday_type_invalid: "Please select a valid holiday type (public, company, or custom).",
        custom_holiday_type_required: "Please specify a custom holiday type.",
        holiday_description_too_long: "Holiday description cannot exceed 500 characters.",

        // attendance
        employee_id_invalid: "Invalid or missing employee ID.",
        attendance_date_invalid: "Please provide a valid attendance date.",
        shift_type_invalid: "Invalid shift type. Allowed types: morning, evening, night, or custom.",
        custom_shift_start_invalid: "Please provide a valid custom shift start time.",
        custom_shift_end_invalid: "Please provide a valid custom shift end time.",
        custom_shift_end_before_start: "Custom shift end time must be after the start time.",
        attendance_status_invalid: "Invalid attendance status. Allowed values: present, absent, or on leave.",
        attendance_remarks_too_long: "Attendance remarks cannot exceed 500 characters.",

        // leave
        leave_start_date_invalid: "Invalid leave start date.",
        leave_end_date_invalid: "Invalid leave end date.",
        leave_type_invalid: "Invalid leave type.",
        custom_leave_type_required: "Custom leave type is required when leave type is set to 'custom'.",
        leave_reason_required: "Leave reason is required.",
        leave_reason_too_long: "Leave reason cannot exceed 500 characters.",
        leave_status_invalid: "Invalid leave status.",
        leave_attachment_upload_failed: "Failed to upload leave attachment. Please try again.",
    },

    // response errors and statements
    res: {
        invalid_json_exception: "Invalid JSON response",
        default_setting_exists: "A default setting for the target application you tried to add, already exists!",
        general_setting_conflict: " A conflict occurred while processing the general settings.",
    },
    
    success: {
        // department
        department_created: "Department created successfully.",
        designation_created: "Designation created successfully.",

        // holiday
        holiday_created: "Holiday has been successfully created.",

        // attendance
        attendance_record_created: "Attendance record has been successfully created."
    },

    error: {
        invalid_request: "Invalid request.",
        department_creation_failed: "Failed to create record.",
        designation_creation_failed: "Failed to create record.",
        server_error: "An internal server error occurred.",
        department_name_exists: "A department with this name already exists.",
        department_code_exists: "A department with this code already exists.",
        designation_name_exists: "A designation with this name already exists.",
        designation_code_exists: "A designation with this code already exists.",

        // General
        success: "Operation completed successfully!",
        error: "An error occurred. Please try again.",
        undefined_error: "An error occurred. Please try again or seek help!",
        nav_route_error: "Invalid route: must be a non-empty string.",
        delete_res_warning: "Delete not applicable at this time!",
        invalid_img_warning: "Please select a valid image file (JPEG, PNG, GIF)",
        invalid_img_size_warning: "Image must be less than 2MB",
        generic_auth_error: "An authentication error occurred!",
        invalid_username_password_warning: "Check your Username and Password, & try again!",

        // holiday
        holiday_creation_failed: "Failed to create the holiday. Please try again later.",

        // attendance
        attendance_record_creation_failed: "Failed to create attendance record. Please try again later."
    },

    // New role/authentication errors
    authentication_error_exception: "Authentication denied. Please contact the administrator for assistance",
    account_suspended_exception: "Authentication denied. Please contact the administrator for assistance",
    role_name_required: "Role name is required!",
    role_code_required: "Role code is required!",
    target_app_required: "Target application is required!",
    default_role_conflict: "Super admin and admin role cannot be applicable the same time!",
    role_description_limit: "Role description cannot exceed a 100 maximum of characters!",
    role_exists_exception: "Role you are trying to create already exists",
    role_unexists_exception: "Role you are trying to update unexists!",
    
    swal: {
        // Users
        activate_users_title: "Activate Users",  
        activate_users_confirm_btn: "Yes, activate user(s)",
        activate_users_cancel_btn: "No, cancel please!",
        ready_to_activate_user: "Are you sure you want to activate the selected user(s)?",

        delete_users_title: "Delete Users",
        delete_users_confirm_btn: "Yes, delete user(s)!",
        delete_users_cancel_btn: "No, cancel please!",
        ready_to_delete_users: "Are you sure you want to delete the selected user(s)? This action cannot be undone.", 

        suspend_users_title: "Suspend Users",
        suspend_users_confirm_btn: "Yes, suspend user(s)!",
        suspend_users_cancel_btn: "No, cancel please!",
        ready_to_suspend_user: "Are you sure you want to suspend the selected user(s)?",

        reset_password_title: "Reset Password",
        reset_password_confirm_btn: "Yes, send reset email!",
        reset_password_cancel_btn: "No, cancel please!",
        ready_to_send_reset_password_email_prompt: "Are you sure you want to send a password reset email to the selected user(s)?",

        inactivate_users_title: "Inactivate Users",
        inactivate_users_confirm_btn: "Yes, inactivate user(s)!",
        inactivate_users_cancel_btn: "No, cancel please!",
        ready_to_inactivate_user: "Are you sure you want to inactivate the selected user(s)?",

        suspend_role_title: "Suspend Role",
        ready_to_suspend_role: "Are you sure you want to suspend this role? Users assigned to this role may lose access to certain features.",
        suspend_role_confirm_btn: "Yes, suspend role!",
        suspend_role_cancel_btn: "No, cancel please!",
        inactivate_role_title: "Inactivate Role",

        ready_to_inactivate_role: "Are you sure you want to inactivate this role? Users assigned to this role may lose access to certain features.",
        inactivate_role_confirm_btn: "Yes, inactivate role!",
        inactivate_role_cancel_btn: "No, cancel please!",

        activate_role_title: "Activate Role",
        ready_to_activate_role: "Are you sure you want to activate this role? Users assigned to this role will regain access to features.",
        activate_role_confirm_btn: "Yes, activate role!",
        activate_role_cancel_btn: "No, cancel please!",

        delete_role_title: "Delete Role",
        ready_to_delete_role: "Are you sure you want to delete this role? This action cannot be undone.",
        delete_role_confirm_btn: "Yes, delete role!",
        delete_role_cancel_btn: "No, cancel please!",
    }
};

if (typeof window !== "undefined") {
    window.LANG_EN = LANG_EN;
}

export default LANG_EN;