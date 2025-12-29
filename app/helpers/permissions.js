/**
 * Check if the user has a specific permission.
 *
 * @param {Array<string>} userPermissions - List of permissions the user has
 * @param {string} key - The permission key to check
 * @param {object} userRole - User role object to check for super admin status
 * @returns {boolean} - Returns true if the user has the specified permission, false otherwise
 */
export function hasPermission(userPermissions, key, userRole = null) {
    // Super admins have all permissions
    if (userRole && userRole.isSuperAdmin) {
        return true;
    }
    return userPermissions.includes(key);
}

/**
 * Check if the user has any permission from a list of keys.
 *
 * @param {Array<string>} userPermissions - List of permissions the user has
 * @param {Array<string>} keys - List of permission keys to check against
 * @returns {boolean} - Returns true if the user has at least one of the specified permissions, false otherwise
 */
export function hasAnyPermission(userPermissions, keys = []) { 
    return keys.some(key => userPermissions.includes(key));
} 