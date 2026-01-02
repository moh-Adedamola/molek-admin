import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { studentsAPI, classLevelsAPI, academicSessionsAPI, subjectsAPI } from "../api/endpoints";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function StudentForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const mode = id ? "edit" : "create";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [classLevels, setClassLevels] = useState([]);
    const [academicSessions, setAcademicSessions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [formData, setFormData] = useState({
        // Student Info
        first_name: "",
        middle_name: "",
        last_name: "",
        date_of_birth: "",
        gender: "M",
        email: "",
        phone_number: "",

        // Address
        address: "",
        state_of_origin: "",
        local_govt_area: "",  // Changed from lga

        // Academic
        class_level: "",  // Changed from current_class
        enrollment_session: "",  // Added
        subjects: [],  // Added

        // Parent Info
        parent_name: "",  // Changed from parent_guardian_name
        parent_email: "",  // Added
        parent_phone: "",  // Changed from parent_guardian_phone

        // Other
        passport: null,  // Added for file upload
        is_active: true,
        graduation_date: "",  // Added
    });

    useEffect(() => {
        fetchClassLevels();
        fetchAcademicSessions();
        fetchSubjects();
        if (mode === "edit" && id) {
            fetchStudent();
        }
    }, [id, mode]);

    const fetchClassLevels = async () => {
        try {
            const response = await classLevelsAPI.list();
            setClassLevels(response.data.results || response.data || []);
        } catch (error) {
            console.error("Failed to fetch class levels:", error);
        }
    };

    const fetchAcademicSessions = async () => {
        try {
            const response = await academicSessionsAPI.list();
            setAcademicSessions(response.data.results || response.data || []);
        } catch (error) {
            console.error("Failed to fetch academic sessions:", error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await subjectsAPI.list();
            setSubjects(response.data.results || response.data || []);
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
        }
    };

    const fetchStudent = async () => {
        try {
            const response = await studentsAPI.get(id);
            const data = response.data;
            setFormData({
                first_name: data.first_name || "",
                middle_name: data.middle_name || "",
                last_name: data.last_name || "",
                date_of_birth: data.date_of_birth || "",
                gender: data.gender || "M",
                email: data.email || "",
                phone_number: data.phone_number || "",
                address: data.address || "",
                state_of_origin: data.state_of_origin || "",
                local_govt_area: data.local_govt_area || "",
                class_level: data.class_level?.id || "",
                enrollment_session: data.enrollment_session?.id || "",
                subjects: data.subjects?.map(s => s.id) || [],
                parent_name: data.parent_name || "",
                parent_email: data.parent_email || "",
                parent_phone: data.parent_phone || "",
                is_active: data.is_active,
                graduation_date: data.graduation_date || "",
                passport: null,
            });
        } catch (error) {
            console.error("Failed to fetch student:", error);
            setError("Unable to fetch student data. Please try again later.");
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, passport: file });
        }
    };

    const handleSubjectChange = (subjectId) => {
        const currentSubjects = formData.subjects || [];
        if (currentSubjects.includes(subjectId)) {
            setFormData({
                ...formData,
                subjects: currentSubjects.filter(id => id !== subjectId)
            });
        } else {
            setFormData({
                ...formData,
                subjects: [...currentSubjects, subjectId]
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validation
        if (!formData.first_name || !formData.last_name ||
            !formData.date_of_birth || !formData.class_level ||
            !formData.enrollment_session) {
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }

        try {
            // Create FormData for file upload
            const submitData = new FormData();

            // Add all text fields
            submitData.append('first_name', formData.first_name);
            submitData.append('middle_name', formData.middle_name);
            submitData.append('last_name', formData.last_name);
            submitData.append('date_of_birth', formData.date_of_birth);
            submitData.append('gender', formData.gender);
            submitData.append('email', formData.email);
            submitData.append('phone_number', formData.phone_number);
            submitData.append('address', formData.address);
            submitData.append('state_of_origin', formData.state_of_origin);
            submitData.append('local_govt_area', formData.local_govt_area);
            submitData.append('class_level', formData.class_level);
            submitData.append('enrollment_session', formData.enrollment_session);
            submitData.append('parent_name', formData.parent_name);
            submitData.append('parent_email', formData.parent_email);
            submitData.append('parent_phone', formData.parent_phone);
            submitData.append('is_active', formData.is_active);
            if (formData.graduation_date) {
                submitData.append('graduation_date', formData.graduation_date);
            }

            // Add subjects (many-to-many)
            formData.subjects.forEach(subjectId => {
                submitData.append('subjects', subjectId);
            });

            // Add passport file if exists
            if (formData.passport) {
                submitData.append('passport', formData.passport);
            }

            if (mode === "create") {
                await studentsAPI.create(submitData);
            } else {
                await studentsAPI.update(id, submitData);
            }
            navigate("/students");
        } catch (error) {
            console.error("Failed to save student:", error);
            setError(
                error.response?.data?.detail ||
                error.response?.data?.admission_number?.[0] ||
                error.response?.data?.email?.[0] ||
                "Failed to save student. Please check the fields and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                {mode === "create" ? "Add New Student" : "Edit Student"}
            </h1>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg space-y-6">
                {/* Student Information */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
                        📚 Student Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            required
                        />
                        <Input
                            label="Middle Name"
                            value={formData.middle_name}
                            onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                        />
                        <Input
                            label="Last Name"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            required
                        />
                        <Input
                            label="Date of Birth"
                            type="date"
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <Input
                            label="Phone Number"
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        />
                    </div>
                </div>

                {/* Gender */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
                        👤 Personal Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Gender <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="M"
                                        checked={formData.gender === "M"}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    />
                                    <span>Male 👨</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="F"
                                        checked={formData.gender === "F"}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    />
                                    <span>Female 👩</span>
                                </label>
                            </div>
                        </div>
                        <Input
                            label="State of Origin"
                            value={formData.state_of_origin}
                            onChange={(e) => setFormData({ ...formData, state_of_origin: e.target.value })}
                        />
                        <Input
                            label="Local Government Area"
                            value={formData.local_govt_area}
                            onChange={(e) => setFormData({ ...formData, local_govt_area: e.target.value })}
                        />
                        <Input
                            label="Address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Profile Picture
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Academic Information */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
                        🎓 Academic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Class Level <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.class_level}
                                onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select Class</option>
                                {classLevels.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Enrollment Session <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.enrollment_session}
                                onChange={(e) => setFormData({ ...formData, enrollment_session: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select Session</option>
                                {academicSessions.map((session) => (
                                    <option key={session.id} value={session.id}>
                                        {session.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Graduation Date (Optional)"
                            type="date"
                            value={formData.graduation_date}
                            onChange={(e) => setFormData({ ...formData, graduation_date: e.target.value })}
                        />
                    </div>

                    {/* Subjects */}
                    <div className="mt-4">
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Subjects
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl">
                            {subjects.map((subject) => (
                                <label key={subject.id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.subjects.includes(subject.id)}
                                        onChange={() => handleSubjectChange(subject.id)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm">{subject.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Parent/Guardian Information */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
                        👨‍👩‍👧 Parent/Guardian Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Parent/Guardian Name"
                            value={formData.parent_name}
                            onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        />
                        <Input
                            label="Parent/Guardian Phone"
                            value={formData.parent_phone}
                            onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                        />
                        <Input
                            label="Parent/Guardian Email"
                            type="email"
                            value={formData.parent_email}
                            onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                        />
                    </div>
                </div>

                {/* Status */}
                {mode === "edit" && (
                    <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-5 h-5 rounded"
                            />
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Active Student</span>
                        </label>
                    </div>
                )}

                <div className="flex gap-4 pt-6">
                    <Button type="submit" loading={loading} className="flex-1">
                        {mode === "create" ? "Create Student ✨" : "Update Student ✨"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => navigate("/students")} className="flex-1">
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}