import axios from "axios";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "https://molek-school-backend-production.up.railway.app";

console.log("🌐 API_BASE URL:", API_BASE);

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

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
                window.location.href = "/login";
            }
        }

        // If no refresh token or other 401/403, clear and redirect
        if ([401, 403].includes(error.response?.status)) {
            localStorage.clear();
            delete api.defaults.headers.common["Authorization"];
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

// ============================================
// 🔐 AUTHENTICATION API
// ============================================
export const authAPI = {
    login: async (username, password) => {
        const response = await api.post("/api/token/", { username, password });

        let accessToken, refreshToken;
        const data = response.data;

        // console.log("Login Response Data:", data);

        if (data.access && data.refresh) {
            // Standard SimpleJWT
            accessToken = data.access;
            refreshToken = data.refresh;
        } else if (data.token) {
            // DRF TokenAuth
            accessToken = data.token.replace(/^Token\s+/, "");
            refreshToken = null;
        } else {
            throw new Error("Unexpected login response format: " + JSON.stringify(data));
        }

        // Validate token
        if (!accessToken || accessToken === "undefined") {
            throw new Error("Invalid access token received from server");
        }

        // Store tokens
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }

        // Set header
        const authHeader = data.token ? `Token ${accessToken}` : `Bearer ${accessToken}`;
        api.defaults.headers.common["Authorization"] = authHeader;

        return response;
    },

    logout: () => {
        localStorage.clear();
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
// 👥 ADMIN MANAGEMENT API
// ============================================
export const adminsAPI = {
    list: (params = {}) => api.get("/api/admins/", { params }),
    get: (id) => api.get(`/api/admins/${id}/`),
    create: (data) => api.post("/api/admins/", data),
    update: (id, data) => api.put(`/api/admins/${id}/`, data),
    delete: (id) => api.delete(`/api/admins/${id}/`),
    stats: () => api.get("/api/admins/stats/"),
};

// ============================================
// 📚 CONTENT API (Images, Videos, News)
// ============================================
export const contentAPI = {
    list: (params = {}) => api.get("/api/content/", { params }),
    get: (id) => api.get(`/api/content/${id}/`),
    create: (formData) => api.post("/api/content/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    }),
    update: (id, formData) => api.put(`/api/content/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    }),
    delete: (id) => api.delete(`/api/content/${id}/`),
    publicList: (params = {}) => api.get("/api/content/public/", { params }),
    stats: () => api.get("/api/content/stats/"),
};

// ============================================
// 🖼️ GALLERY API
// ============================================
export const galleriesAPI = {
    list: (params = {}) => api.get("/api/galleries/", { params }),
    get: (id) => api.get(`/api/galleries/${id}/`),
    create: (formData) => api.post("/api/galleries/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    }),
    update: (id, formData) => api.put(`/api/galleries/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    }),
    delete: (id) => api.delete(`/api/galleries/${id}/`),
    stats: () => api.get("/api/galleries/stats/"),
};

// ============================================
// 👤 PROFILE API
// ============================================
export const profileAPI = {
    getCurrent: async () => {
        try {
            const response = await api.get("/api/users/profile/");
            return response.data;
        } catch (error) {
            console.error("Failed to fetch current profile:", error);
            throw error;
        }
    },
    update: (data) => api.put("/api/users/profile/", data),
};

// ============================================
// 🎓 STUDENT MANAGEMENT API
// ✅ FIXED: Uses /api/students/
// ⚠️ Supports FormData for file uploads (passport photos)
// ============================================
export const studentsAPI = {
    list: (params = {}) => api.get("/api/students/", { params }),
    get: (id) => api.get(`/api/students/${id}/`),
    create: (data) => {
        // Check if data is FormData (for file uploads) or regular object
        const isFormData = data instanceof FormData;
        return api.post("/api/students/", data, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
        });
    },
    update: (id, data) => {
        // Check if data is FormData (for file uploads) or regular object
        const isFormData = data instanceof FormData;
        return api.put(`/api/students/${id}/`, data, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
        });
    },
    delete: (id) => api.delete(`/api/students/${id}/`),
    stats: () => api.get("/api/students/stats/"),

    // ✅ UPDATED: Now accepts config object with onUploadProgress
    bulkUpload: (formData, config = {}) => api.post("/api/students/bulk-upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        ...config  // Spread any additional config (like onUploadProgress)
    }),

    exportCSV: () => api.get("/api/students/export-csv/", {
        responseType: 'blob'
    }),
    exportForCBT: (params = {}) => api.get("/api/students/export-for-cbt/", { params }),
    // ✅ FIXED: Backend uses promote_class not promote
    promoteStudents: (data) => api.post("/api/students/promote_class/", data),
    
    // Promotion analysis with configurable rules (Bug 7)
    getPromotionAnalysis: (params) => api.get("/api/users/promotion/", { params }),
    getPromotionRules: (params) => api.get("/api/users/promotion/rules/", { params }),
    savePromotionRules: (data) => api.post("/api/users/promotion/rules/save/", data),
    getPromotionSubjects: () => api.get("/api/users/promotion/subjects/"),
};

// ============================================
// 📅 ACADEMIC SESSION API
// ✅ FIXED: Uses /api/academic-sessions/
// ============================================
export const academicSessionsAPI = {
    list: (params = {}) => api.get("/api/academic-sessions/", { params }),
    get: (id) => api.get(`/api/academic-sessions/${id}/`),
    create: (data) => api.post("/api/academic-sessions/", data),
    update: (id, data) => api.put(`/api/academic-sessions/${id}/`, data),
    delete: (id) => api.delete(`/api/academic-sessions/${id}/`),
    setActive: (id) => api.post(`/api/academic-sessions/${id}/set-active/`),
};

// ============================================
// 📆 TERM API
// ✅ FIXED: Uses /api/terms/
// ============================================
export const termsAPI = {
    list: (params = {}) => api.get("/api/terms/", { params }),
    get: (id) => api.get(`/api/terms/${id}/`),
    create: (data) => api.post("/api/terms/", data),
    update: (id, data) => api.put(`/api/terms/${id}/`, data),
    delete: (id) => api.delete(`/api/terms/${id}/`),
    setActive: (id) => api.post(`/api/terms/${id}/set-active/`),
};

// ============================================
// 🏫 CLASS LEVEL API
// ✅ FIXED: Uses /api/class-levels/
// ============================================
export const classLevelsAPI = {
    list: (params = {}) => api.get("/api/class-levels/", { params }),
    get: (id) => api.get(`/api/class-levels/${id}/`),
    create: (data) => api.post("/api/class-levels/", data),
    update: (id, data) => api.put(`/api/class-levels/${id}/`, data),
    delete: (id) => api.delete(`/api/class-levels/${id}/`),
};

// ============================================
// 📖 SUBJECT API
// ✅ FIXED: Uses /api/subjects/ (matches your backend router)
// ============================================
export const subjectsAPI = {
    list: (params = {}) => api.get("/api/subjects/", { params }),
    get: (id) => api.get(`/api/subjects/${id}/`),
    create: (data) => api.post("/api/subjects/", data),
    update: (id, data) => api.put(`/api/subjects/${id}/`, data),
    delete: (id) => api.delete(`/api/subjects/${id}/`),
};

// ============================================
// 📝 CA SCORE API
// ✅ FIXED: Uses /api/ca-scores/
// ============================================
export const caScoresAPI = {
    list: (params = {}) => api.get("/api/ca-scores/", { params }),
    get: (id) => api.get(`/api/ca-scores/${id}/`),
    create: (data) => api.post("/api/ca-scores/", data),
    update: (id, data) => api.put(`/api/ca-scores/${id}/`, data),
    delete: (id) => api.delete(`/api/ca-scores/${id}/`),
    bulkUpload: (formData) => api.post("/api/ca-scores/bulk-upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    }),
    exportTemplate: () => api.get("/api/ca-scores/export-template/", {
        responseType: 'blob'
    }),
    getByStudent: (studentId, params = {}) =>
        api.get(`/api/ca-scores/student/${studentId}/`, { params }),
};

// ============================================
// 📊 EXAM RESULT API
// ✅ FIXED: URLs match actual backend routes
// ViewSet actions:  /api/exam-results/{action}/
// Standalone:       /api/users/exam-results/bulk-upload/
// ============================================
export const examResultsAPI = {
    // CRUD (ViewSet router)
    list: (params = {}) => api.get("/api/exam-results/", { params }),
    get: (id) => api.get(`/api/exam-results/${id}/`),
    create: (data) => api.post("/api/exam-results/", data),
    update: (id, data) => api.put(`/api/exam-results/${id}/`, data),
    partialUpdate: (id, data) => api.patch(`/api/exam-results/${id}/`, data),
    delete: (id) => api.delete(`/api/exam-results/${id}/`),

    // Bulk upload combined (OBJ + Theory) - standalone view under /api/users/
    bulkUpload: (formData, config = {}) => api.post("/api/users/exam-results/bulk-upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        ...config,
    }),

    // Import OBJ/CBT scores (ViewSet action) - auto-pulls CA1+CA2
    importObjScores: (formData, config = {}) => api.post("/api/exam-results/import-obj-scores/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        ...config,
    }),

    // Import Theory scores (ViewSet action)
    importTheoryScores: (formData, config = {}) => api.post("/api/exam-results/import-theory-scores/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        ...config,
    }),

    // Recalculate positions (ViewSet action)
    recalculatePositions: (data) => api.post("/api/exam-results/recalculate-positions/", data),

    // Sync CA scores from CAScore table to ExamResult table (ViewSet action)
    syncCAScores: (data) => api.post("/api/exam-results/sync-ca-scores/", data),

    // Export templates (ViewSet actions)
    exportObjTemplate: () => api.get("/api/exam-results/export-template-obj/", { responseType: 'blob' }),
    exportTheoryTemplate: () => api.get("/api/exam-results/export-template-theory/", { responseType: 'blob' }),

    // Student-specific results
    getByStudent: (studentId, params = {}) =>
        api.get(`/api/exam-results/student/${studentId}/`, { params }),
};

// ============================================
// CA + THEORY SCORES (Legacy - use caScoresAPI instead)
// ============================================

/**
 * Upload CA + Theory scores from CSV
 * @param {FormData} formData - Contains file, session, term
 * @deprecated Use caScoresAPI.bulkUpload() instead
 */
export const uploadCAScores = (formData) => {
    return api.post('/api/ca-scores/bulk-upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

/**
 * Get CA scores with filters
 * @deprecated Use caScoresAPI.list() instead
 */
export const getCAScores = (params) => {
    return api.get('/api/ca-scores/', { params });
};

// ============================================
// EXAM RESULTS (Legacy - use examResultsAPI instead)
// ============================================

/**
 * Upload CBT exam results
 * @param {FormData} formData - Contains file, session, term
 * @deprecated Use examResultsAPI.bulkUpload() instead
 */
export const uploadExamResults = (formData) => {
    return api.post('/api/users/exam-results/bulk-upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

/**
 * Get exam results with filters
 * @deprecated Use examResultsAPI.list() instead
 */
export const getExamResults = (params) => {
    return api.get('/api/exam-results/', { params });
};

// ============================================
// STUDENT PROMOTION (Legacy - use studentsAPI instead)
// ============================================

/**
 * Get promotion data for a class
 * @param {string} classLevel - Class level (e.g., 'JSS1')
 * @param {number} sessionId - Academic session ID
 * @deprecated Use studentsAPI.list() with class_level filter instead
 */
export const getPromotionData = (classLevel, sessionId) => {
    return api.get('/api/students/', {
        params: {
            class_level: classLevel,
            session_id: sessionId,
            is_active: true
        }
    });
};

/**
 * Promote selected students
 * @param {Object} data - { student_ids, from_class, to_class, session_id }
 * @deprecated Use studentsAPI.promoteStudents() instead
 */
export const promoteStudents = (data) => {
    return api.post('/api/students/promote_class/', data);
};

// ============================================
// SESSIONS & TERMS (Legacy - use academicSessionsAPI/termsAPI instead)
// ============================================

/**
 * Get all academic sessions
 * @deprecated Use academicSessionsAPI.list() instead
 */
export const getSessions = () => {
    return api.get('/api/academic-sessions/');
};

/**
 * Get terms for a session
 * @param {number} sessionId - Session ID
 * @deprecated Use termsAPI.list() instead
 */
export const getTerms = (sessionId) => {
    return api.get('/api/terms/', { params: { session: sessionId } });
};


export default api;