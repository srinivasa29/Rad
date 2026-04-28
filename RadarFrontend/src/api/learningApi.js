import api from './api';

export const fetchCourses = async () => {
    try {
        const res = await api.get('/learning');
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
