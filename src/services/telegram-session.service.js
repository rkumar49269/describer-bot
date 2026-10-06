const activeUsers = new Set();

const startUserSession = (userId) => {
    activeUsers.add(userId);
};

const stopUserSession = (userId) => {
    activeUsers.delete(userId);
};

const isUserActive = (userId) => {
    return activeUsers.has(userId);
};

module.exports = {
    startUserSession,
    stopUserSession,
    isUserActive
};