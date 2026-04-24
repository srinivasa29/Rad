import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchNotifications, markNotificationsRead, markSingleNotificationRead } from '../api/notificationApi';
import { fetchUserProfile } from '../api/userApi';

const getStoredUser = () => {
    try {
        const rawUser = localStorage.getItem('user');
        return rawUser ? JSON.parse(rawUser) : null;
    } catch {
        return null;
    }
};

const buildFallbackProfile = () => {
    const storedUser = getStoredUser();
    const email = localStorage.getItem('email') || storedUser?.email || '';
    const username = storedUser?.name || storedUser?.username || (email ? email.split('@')[0] : 'User');

    return {
        username,
        email,
        preferredMode: localStorage.getItem('mode') || storedUser?.preferredMode || null,
        watchlist: []
    };
};

export const useHeaderData = () => {
    const [profile, setProfile] = useState(buildFallbackProfile);
    const [notifications, setNotifications] = useState([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [isMarkingNotifications, setIsMarkingNotifications] = useState(false);

    const loadProfile = useCallback(async () => {
        const token = localStorage.getItem('token');
        const fallbackProfile = buildFallbackProfile();

        if (!token) {
            setProfile(fallbackProfile);
            return fallbackProfile;
        }

        try {
            const response = await fetchUserProfile();
            const mergedProfile = {
                ...fallbackProfile,
                ...response,
                email: fallbackProfile.email
            };

            setProfile(mergedProfile);
            return mergedProfile;
        } catch (error) {
            console.error('Failed to load user profile:', error);
            setProfile(fallbackProfile);
            return fallbackProfile;
        }
    }, []);

    const loadNotifications = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setNotifications([]);
            return [];
        }

        try {
            setIsLoadingNotifications(true);
            const response = await fetchNotifications();
            setNotifications(Array.isArray(response) ? response : []);
            return response;
        } catch (error) {
            console.error('Failed to load notifications:', error);
            setNotifications([]);
            return [];
        } finally {
            setIsLoadingNotifications(false);
        }
    }, []);

    const markSingleRead = useCallback(async (id) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            // Update UI immediately (Optimistic)
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            // Actual API call
            await markSingleNotificationRead(id);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            // Optional: Revert on failure
        }
    }, []);

    const markAllNotificationsRead = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token || notifications.every((notification) => notification.read)) {
            return;
        }

        try {
            setIsMarkingNotifications(true);
            await markNotificationsRead();
            setNotifications((currentNotifications) =>
                currentNotifications.map((notification) => ({
                    ...notification,
                    read: true
                }))
            );
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        } finally {
            setIsMarkingNotifications(false);
        }
    }, [notifications]);

    useEffect(() => {
        loadProfile();
        loadNotifications();

        // 10. AUTO REFRESH: Poll notifications every 45s
        const pollInterval = setInterval(() => {
            loadNotifications();
        }, 45000);

        return () => clearInterval(pollInterval);
    }, [loadProfile, loadNotifications]);

    const userInitial = useMemo(() => {
        const source = profile?.username || profile?.email || 'User';
        return source.charAt(0).toUpperCase();
    }, [profile]);

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.read).length,
        [notifications]
    );

    return {
        profile,
        userInitial,
        notifications,
        unreadCount,
        isLoadingNotifications,
        isMarkingNotifications,
        reloadProfile: loadProfile,
        reloadNotifications: loadNotifications,
        markAllNotificationsRead,
        markSingleRead
    };
};