import axios from "axios";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "https://molek-school-backend-production.up.railway.app";

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

// ============================================
// CLIENT-SIDE CACHE
// Caches GET responses in memory for instant tab switching.
// Cache is per-URL+params. Mutations (POST/PUT/DELETE) auto-invalidate.
// ============================================
const cache = new Map();
const CACHE_TTL = {
    static: 10 * 60 * 1000,    // 10 min — class levels, subjects (rarely change)
    academic: 5 * 60 * 1000,   // 5 min — sessions, terms
    data: 2 * 60 * 1000,       // 2 min — students, scores, results
    stats: 60 * 1000,          // 1 min — dashboard stats
};

function getCacheKey(url, params) {
    return url + (params ? '?' + JSON.stringify(params) : '');
}

function getCached(key) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.time < entry.ttl) {
        return entry.data;
    }
    cache.delete(key);
    return null;
}

function setCache(key, data, ttl) {
    cache.set(key, { data, time: Date.now(), ttl });
}

function invalidatePrefix(prefix) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) cache.delete(key);
    }
}

function invalidateAll() {
    cache.clear();
}

// Cached GET wrapper
function cachedGet(url, options = {}, ttl = CACHE_TTL.data) {
    const key = getCacheKey(url, options.params);
    const cached = getCached(key);
    if (cached) return Promise.resolve(cached);
    return api.get(url, options).then(response => {
        setCache(key, response, ttl);
        return response;
    });
}

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token && token !== "undefined") {
        const authHeader = token.startsWith("eyJ") ? `Bearer ${token}` : `Token ${token}`;
        config.headers["Authorization"] = authHeader;
    }
    return config;
});

// Handle token expiration and refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const refreshToken = localStorage.getItem("refreshToken");

        if (
            error.response?.status === 401 &&
            refreshToken &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;
            try {
                const res = await axios.post(`${API_BASE}/api/token/refresh/`, {
                    refresh: refreshToken,
                });
                const newAccessToken = res.data.access;
                localStorage.setItem("accessToken", newAccessToken);
                const authHeader = newAccessToken.startsWith("eyJ") ? `Bearer ${newAccessToken}` : `Token ${newAccessToken}`;
                api.defaults.headers.common["Authorization"] = authHeader;
                originalRequest.headers["Authorization"] = authHeader;
                return api(originalRequest);
            } catch {
                localStorage.clear();
                invalidateAll();
                window.location.href = "/login";
            }
        }

        if ([401, 403].includes(error.response?.status)) {
            localStorage.clear();
            invalidateAll();
            delete api.defaults.headers.common["Authorization"];
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

// ============================================
// AUTHENTICATION API
// ============================================
export const authAPI = {
    login: async (username, password) => {
        const response = await api.post("/api/token/", { username, password });

        let accessToken, refreshToken;
        const data = response.data;

        if (data.access && data.refresh) {
            accessToken = data.access;
            refreshToken = data.refresh;
        } else if (data.token) {
            accessToken = data.token.replace(/^Token\s+/, "");
            refreshToken = null;
        } else {
            throw new Error("Unexpected login response format: " + JSON.stringify(data));
        }

        if (!accessToken || accessToken === "undefined") {
            throw new Error("Invalid access token received from server");
        }

        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }

        const authHeader = data.token ? `Token ${accessToken}` : `Bearer ${accessToken}`;
        api.defaults.headers.common["Authorization"] = authHeader;

        invalidateAll();
        return response;
    },

    logout: () => {
        localStorage.clear();
        invalidateAll();
        delete api.defaults.headers.common["Authorization"];
    },

    changePassword: async (oldPassword, newPassword) => {
        return api.post("/api/users/profile/change-password/", {
            old_password: oldPassword,
            new_password: newPassword
        });
    },
};

// ============================================
// ADMIN MANAGEMENT API
// ============================================
export const adminsAPI = {
    list: (params = {}) => cachedGet("/api/admins/", { params }, CACHE_TTL.data),
    get: (id) => cachedGet(`/api/admins/${id}/`, {}, CACHE_TTL.data),
    create: (data) => { invalidatePrefix("/api/admins"); return api.post("/api/admins/", data); },
    update: (id, data) => { invalidatePrefix("/api/admins"); return api.put(`/api/admins/${id}/`, data); },
    delete: (id) => { invalidatePrefix("/api/admins"); return api.delete(`/api/admins/${id}/`); },
    stats: () => cachedGet("/api/admins/stats/", {}, CACHE_TTL.stats),
};

// ============================================
// CONTENT API
// ============================================
export const contentAPI = {
    list: (params = {}) => cachedGet("/api/content/", { params }, CACHE_TTL.data),
    get: (id) => cachedGet(`/api/content/${id}/`, {}, CACHE_TTL.data),
    create: (formData) => { invalidatePrefix("/api/content"); return api.post("/api/content/", formData, { headers: { "Content-Type": "multipart/form-data" } }); },
    update: (id, formData) => { invalidatePrefix("/api/content"); return api.put(`/api/content/${id}/`, formData, { headers: { "Content-Type": "multipart/form-data" } }); },
    delete: (id) => { invalidatePrefix("/api/content"); return api.delete(`/api/content/${id}/`); },
    publicList: (params = {}) => cachedGet("/api/content/public/", { params }, CACHE_TTL.data),
    stats: () => cachedGet("/api/content/stats/", {}, CACHE_TTL.stats),
};

// ============================================
// GALLERY API
// ============================================
export const galleriesAPI = {
    list: (params = {}) => cachedGet("/api/galleries/", { params }, CACHE_TTL.data),
    get: (id) => cachedGet(`/api/galleries/${id}/`, {}, CACHE_TTL.data),
    create: (formData) => { invalidatePrefix("/api/galleries"); return api.post("/api/galleries/", formData, { headers: { "Content-Type": "multipart/form-data" } }); },
    update: (id, formData) => { invalidatePrefix("/api/galleries"); return api.put(`/api/galleries/${id}/`, formData, { headers: { "Content-Type": "multipart/form-data" } }); },
    delete: (id) => { invalidatePrefix("/api/galleries"); return api.delete(`/api/galleries/${id}/`); },
    stats: () => cachedGet("/api/galleries/stats/", {}, CACHE_TTL.stats),
};

// ============================================
// PROFILE API
// ============================================
export const profileAPI = {
    getCurrent: async () => {
        try {
            const response = await cachedGet("/api/users/profile/", {}, CACHE_TTL.data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    update: (data) => { invalidatePrefix("/api/users/profile"); return api.put("/api/users/profile/", data); },
};

// ============================================
// STUDENT MANAGEMENT API
// ============================================
export const studentsAPI = {
    list: (params = {}) => cachedGet("/api/students/", { params }, CACHE_TTL.data),
    get: (id) => cachedGet(`/api/students/${id}/`, {}, CACHE_TTL.data),
    create: (data) => {
        invalidatePrefix("/api/students");
        const isFormData = data instanceof FormData;
        return api.post("/api/students/", data, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
        });
    },
    update: (id, data) => {
        invalidatePrefix("/api/students");
        const isFormData = data instanceof FormData;
        return api.put(`/api/students/${id}/`, data, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
        });
    },
    delete: (id) => { invalidatePrefix("/api/students"); return api.delete(`/api/students/${id}/`); },
    stats: () => cachedGet("/api/students/stats/", {}, CACHE_TTL.stats),

    bulkUpload: (formData, config = {}) => {
        invalidatePrefix("/api/students");
        return api.post("/api/students/bulk-upload/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            ...config
        });
    },

    exportCSV: (params = {}) => api.get("/api/students/export-csv/", { params, responseType: 'blob' }),
    exportForCBT: (params = {}) => api.get("/api/students/export-for-cbt/", { params, responseType: 'blob' }),
    promoteStudents: (data) => { invalidatePrefix("/api/students"); return api.post("/api/students/promote_class/", data); },
    
    getPromotionAnalysis: (params) => cachedGet("/api/users/promotion/", { params }, CACHE_TTL.data),
    getPromotionRules: (params) => cachedGet("/api/users/promotion/rules/", { params }, CACHE_TTL.academic),
    savePromotionRules: (data) => { invalidatePrefix("/api/users/promotion"); return api.post("/api/users/promotion/rules/save/", data); },
    getPromotionSubjects: () => cachedGet("/api/users/promotion/subjects/", {}, CACHE_TTL.static),
};

// ============================================
// ACADEMIC SESSION API (cached longer — rarely changes)
// ============================================
export const academicSessionsAPI = {
    list: (params = {}) => cachedGet("/api/academic-sessions/", { params }, CACHE_TTL.academic),
    get: (id) => cachedGet(`/api/academic-sessions/${id}/`, {}, CACHE_TTL.academic),
    create: (data) => { invalidatePrefix("/api/academic-sessions"); return api.post("/api/academic-sessions/", data); },
    update: (id, data) => { invalidatePrefix("/api/academic-sessions"); return api.put(`/api/academic-sessions/${id}/`, data); },
    delete: (id) => { invalidatePrefix("/api/academic-sessions"); return api.delete(`/api/academic-sessions/${id}/`); },
    setActive: (id) => { invalidatePrefix("/api/academic-sessions"); return api.post(`/api/academic-sessions/${id}/set-active/`); },
};

// ============================================
// TERM API (cached longer)
// ============================================
export const termsAPI = {
    list: (params = {}) => cachedGet("/api/terms/", { params }, CACHE_TTL.academic),
    get: (id) => cachedGet(`/api/terms/${id}/`, {}, CACHE_TTL.academic),
    create: (data) => { invalidatePrefix("/api/terms"); return api.post("/api/terms/", data); },
    update: (id, data) => { invalidatePrefix("/api/terms"); return api.put(`/api/terms/${id}/`, data); },
    delete: (id) => { invalidatePrefix("/api/terms"); return api.delete(`/api/terms/${id}/`); },
    setActive: (id) => { invalidatePrefix("/api/terms"); return api.post(`/api/terms/${id}/set-active/`); },
};

// ============================================
// CLASS LEVEL API (cached longest — almost never changes)
// ============================================
export const classLevelsAPI = {
    list: (params = {}) => cachedGet("/api/class-levels/", { params }, CACHE_TTL.static),
    get: (id) => cachedGet(`/api/class-levels/${id}/`, {}, CACHE_TTL.static),
    create: (data) => { invalidatePrefix("/api/class-levels"); return api.post("/api/class-levels/", data); },
    update: (id, data) => { invalidatePrefix("/api/class-levels"); return api.put(`/api/class-levels/${id}/`, data); },
    delete: (id) => { invalidatePrefix("/api/class-levels"); return api.delete(`/api/class-levels/${id}/`); },
};

// ============================================
// SUBJECT API (cached longest)
// ============================================
export const subjectsAPI = {
    list: (params = {}) => cachedGet("/api/subjects/", { params }, CACHE_TTL.static),
    get: (id) => cachedGet(`/api/subjects/${id}/`, {}, CACHE_TTL.static),
    create: (data) => { invalidatePrefix("/api/subjects"); return api.post("/api/subjects/", data); },
    update: (id, data) => { invalidatePrefix("/api/subjects"); return api.put(`/api/subjects/${id}/`, data); },
    delete: (id) => { invalidatePrefix("/api/subjects"); return api.delete(`/api/subjects/${id}/`); },
};

// ============================================
// CA SCORE API
// ============================================
export const caScoresAPI = {
    list: (params = {}) => cachedGet("/api/ca-scores/", { params }, CACHE_TTL.data),
    get: (id) => cachedGet(`/api/ca-scores/${id}/`, {}, CACHE_TTL.data),
    create: (data) => { invalidatePrefix("/api/ca-scores"); return api.post("/api/ca-scores/", data); },
    update: (id, data) => { invalidatePrefix("/api/ca-scores"); return api.put(`/api/ca-scores/${id}/`, data); },
    delete: (id) => { invalidatePrefix("/api/ca-scores"); return api.delete(`/api/ca-scores/${id}/`); },
    bulkUpload: (formData) => { invalidatePrefix("/api/ca-scores"); return api.post("/api/ca-scores/bulk-upload/", formData, { headers: { "Content-Type": "multipart/form-data" } }); },
    exportTemplate: () => api.get("/api/ca-scores/export-template/", { responseType: 'blob' }),
    getByStudent: (studentId, params = {}) => cachedGet(`/api/ca-scores/student/${studentId}/`, { params }, CACHE_TTL.data),
};

// ============================================
// EXAM RESULT API
// ============================================
export const examResultsAPI = {
    list: (params = {}) => cachedGet("/api/exam-results/", { params }, CACHE_TTL.data),
    get: (id) => cachedGet(`/api/exam-results/${id}/`, {}, CACHE_TTL.data),
    create: (data) => { invalidatePrefix("/api/exam-results"); return api.post("/api/exam-results/", data); },
    update: (id, data) => { invalidatePrefix("/api/exam-results"); return api.put(`/api/exam-results/${id}/`, data); },
    partialUpdate: (id, data) => { invalidatePrefix("/api/exam-results"); return api.patch(`/api/exam-results/${id}/`, data); },
    delete: (id) => { invalidatePrefix("/api/exam-results"); return api.delete(`/api/exam-results/${id}/`); },

    bulkUpload: (formData, config = {}) => {
        invalidatePrefix("/api/exam-results");
        invalidatePrefix("/api/users/exam-results");
        return api.post("/api/users/exam-results/bulk-upload/", formData, {
            headers: { "Content-Type": "multipart/form-data" }, ...config,
        });
    },

    importObjScores: (formData, config = {}) => {
        invalidatePrefix("/api/exam-results");
        return api.post("/api/exam-results/import-obj-scores/", formData, {
            headers: { "Content-Type": "multipart/form-data" }, ...config,
        });
    },

    importTheoryScores: (formData, config = {}) => {
        invalidatePrefix("/api/exam-results");
        return api.post("/api/exam-results/import-theory-scores/", formData, {
            headers: { "Content-Type": "multipart/form-data" }, ...config,
        });
    },

    recalculatePositions: (data) => { invalidatePrefix("/api/exam-results"); return api.post("/api/exam-results/recalculate-positions/", data); },
    syncCAScores: (data) => { invalidatePrefix("/api/exam-results"); return api.post("/api/exam-results/sync-ca-scores/", data); },

    exportObjTemplate: () => api.get("/api/exam-results/export-template-obj/", { responseType: 'blob' }),
    exportTheoryTemplate: () => api.get("/api/exam-results/export-template-theory/", { responseType: 'blob' }),

    getByStudent: (studentId, params = {}) => cachedGet(`/api/exam-results/student/${studentId}/`, { params }, CACHE_TTL.data),
};

// ============================================
// LEGACY WRAPPERS (deprecated — use named APIs above)
// ============================================
export const uploadCAScores = (formData) => caScoresAPI.bulkUpload(formData);
export const getCAScores = (params) => caScoresAPI.list(params);
export const uploadExamResults = (formData) => examResultsAPI.bulkUpload(formData);
export const getExamResults = (params) => examResultsAPI.list(params);
export const getPromotionData = (classLevel, sessionId) => studentsAPI.list({ class_level: classLevel, session_id: sessionId, is_active: true });
export const promoteStudents = (data) => studentsAPI.promoteStudents(data);
export const getSessions = () => academicSessionsAPI.list();
export const getTerms = (sessionId) => termsAPI.list({ session: sessionId });

export default api;