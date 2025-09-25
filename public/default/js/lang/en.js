const lang = {
    // Request errors
    req: {
        request_denied: "Your request has been denied.",
        invalid_csrf_token: "Invalid CSRF token. Please refresh the page and try again.",
        session_expired: "Your session has expired. Please log in again.",
        invalid_request: "Invalid request. Please check your input and try again.",
        missing_parameters: "Missing required parameters. Please provide all necessary information.",
        unauthorized_access: "You do not have permission to access this resource.",
        resource_not_found: "The requested resource could not be found.",
        internal_server_error: "An internal server error occurred. Please try again later."
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
    role_unexists_exception: "Role you are trying to update unexists!"
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = lang;
}
