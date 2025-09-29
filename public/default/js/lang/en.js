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

        // role errors
        role_id_required: "Role ID is required.",
        role_status_required: "Role status is required.",
        default_role_status_exception: "Default roles cannot have their status changed.",
        admin_role_status_exception: "Admin roles cannot have their status changed."
    },   

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