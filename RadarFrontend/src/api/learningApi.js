import api from './api';

// Returns the localStorage key scoped by userId + mode so each user's progress is isolated
export const getProgressKey = (courseId, mode = '') => {
    const userId = localStorage.getItem('userId') || 'guest';
    const prefix = mode ? `${mode}_` : '';
    return `radar_academy_progress_${userId}_${prefix}${courseId}`;
};

export const fetchCourses = async (audience = '') => {
    try {
        const url = audience ? `/learning?audience=${audience}` : '/learning';
        const res = await api.get(url);
        return Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        console.error('Failed to fetch courses:', err);
        return [];
    }
};

export const fetchCourse = async (id) => {
    try {
        const res = await api.get(`/learning/${id}`);
        return res.data?.data ?? res.data ?? null;
    } catch (err) {
        console.error(`Failed to fetch course ${id}:`, err);
        return null;
    }
};

export const saveProgress = async (courseId, chapterId, completed = true) => {
    try {
        const userId = localStorage.getItem('userId') || 'anonymous';
        await api.post('/learning/progress', { courseId, chapterId, completed, userId });
    } catch (err) {
        // silently fail — progress is also tracked locally
    }
};

export const fetchProgress = async (userId) => {
    try {
        const uid = userId || localStorage.getItem('userId') || 'anonymous';
        const res = await api.get(`/learning/progress/${uid}`);
        return res.data?.data ?? res.data ?? {};
    } catch (err) {
        console.error('Failed to fetch progress:', err);
        return {};
    }
};

export const submitQuiz = async (courseId, answers) => {
    try {
        const userId = localStorage.getItem('userId') || 'anonymous';
        const res = await api.post('/learning/quiz', { courseId, answers, userId });
        return res.data?.data ?? null;
    } catch (err) {
        console.error('Failed to submit quiz:', err);
        return null;
    }
};

