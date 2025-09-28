export function ucwords(str) {
    return str?.length
        ? str.split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        : null;
}

export function ucfirst(str) {
    return str?.length ? str.charAt(0).toUpperCase() + str.slice(1) : null;
}

export function dateToISO8601Formatter(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function nl2br(text) {
    return text.replace(/\n/g, '<br>');
}

export function isAjaxRequest(req) {
    return req.get('X-Requested-With') === 'XMLHttpRequest';
}

export function fbCollectionParser(snapshot = {}) {
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

export function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function jsonParser(data) {
    return JSON.parse(JSON.stringify(data));
}
