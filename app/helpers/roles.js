import RolesUtil from '@utils/RolesUtil'; 

export async function getAllRoles(redis) {
    return await RolesUtil.getAllRoles(redis);
} 

/**
 * Check if the user has an admin or superadmin role instance
 *
 * @param {Array<string>} role - List of permissions the user has 
 * @returns {boolean} - Returns true if the user is an admin, & false otherwise
 */
export function isAdmin(role) {
    return role.isAdmin || false;
}

/**
 * Check if the user has an admin or superadmin role instance
 *
 * @param {Array<string>} role - List of permissions the user has 
 * @returns {boolean} - Returns true if the user is an admin, & false otherwise
 */
export function isSuperAdmin(role) {
    return role.isSuperAdmin || false;
}