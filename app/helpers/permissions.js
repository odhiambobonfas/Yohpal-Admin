function hasPermission(userPermissions, key) {
    return userPermissions.includes(key);
}

function hasAnyPermission(userPermissions, keys = []) { 
    return keys.some(key => userPermissions.includes(key));
}

module.exports = {
    hasPermission,
    hasAnyPermission
};