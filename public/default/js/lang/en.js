const lang = {
    undefined_error: "An error occurred. Please try again or seek help!",
    nav_route_error: "Invalid route: must be a non-empty string.",
    delete_res_warning: "Delete not applicable at this time!",
    invalid_img_warning: "Please select a valid image file (JPEG, PNG, GIF)",
    invalid_img_size_warning: "Image must be less than 2MB",
    generic_auth_error: "An authentication error occurred!",
    invalid_username_password_warning: "Check your Username and Password, & try again!"
}; 

if (typeof module !== 'undefined' && module.exports) {
    module.exports = lang;
}