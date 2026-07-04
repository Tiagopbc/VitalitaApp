export const activeSessionService = {
    async update(userId, sessionData) {
        const { userService } = await import('../userService');
        return userService.updateActiveSession(userId, sessionData);
    },

    async remove(userId) {
        const { userService } = await import('../userService');
        return userService.deleteActiveSession(userId);
    }
};
