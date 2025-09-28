/**
 * Check if the user has a specific permission.
 *
 * @param {Array<string>} userPermissions - List of permissions the user has
 * @param {string} key - The permission key to check
 * @returns {boolean} - Returns true if the user has the specified permission, false otherwise
 */
export function hasPermission(userPermissions, key) {
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