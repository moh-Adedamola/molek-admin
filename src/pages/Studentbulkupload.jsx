import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentsAPI } from "../api/endpoints";
import { Button } from "../components/ui/Button";

export function StudentBulkUpload() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploadResults, setUploadResults] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "text/csv") {
            setFile(selectedFile);
            setError("");
            setUploadProgress(0);
            setProcessingStatus("");
        } else {
            setError("Please select a valid CSV file");
            setFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setError("Please select a CSV file");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");
        setUploadResults(null);
        setUploadProgress(0);
        setProcessingStatus("Uploading file...");

        const formData = new FormData();
        formData.append("file", file);

        try {
            // Create axios request with progress tracking
            const response = await studentsAPI.bulkUpload(formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);

                    if (percentCompleted === 100) {
                        setProcessingStatus("Processing students... Please wait.");
                    }
                }
            });

            setUploadProgress(100);
            setProcessingStatus("Complete!");
            setSuccess(`✅ Successfully uploaded ${response.data.created} students!`);
            setUploadResults(response.data);
            setFile(null);
            // Reset file input
            document.getElementById("csv-file").value = "";
        } catch (err) {
            console.error("Bulk upload error:", err);
            const errorMsg = err.response?.data?.error ||
                err.response?.data?.detail ||
                "Failed to upload students. Please check the CSV format and try again.";
            setError(errorMsg);
            if (err.response?.data?.errors) {
                setUploadResults({ errors: err.response.data.errors });
            }
            setUploadProgress(0);
            setProcessingStatus("");
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "first_name,middle_name,last_name,date_of_birth,gender,email,phone_number,class_level,parent_name,parent_email,parent_phone,address,state_of_origin,local_govt_area\n" +
            "John,Paul,Doe,2010-05-15,M,john@example.com,08012345678,JSS1,Mr. Doe,parent@example.com,08098765432,123 Main St,Lagos,Ikeja\n" +
            "Jane,Mary,Smith,2011-03-20,F,jane@example.com,08087654321,JSS1,Mrs. Smith,parent2@example.com,08087654322,456 Oak Ave,Ogun,Abeokuta";

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'students_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Bulk Upload Students
            </h1>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg">
                    {success}
                </div>
            )}

            {/* Upload Progress Bar */}
            {loading && (
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {processingStatus}
                            </span>
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {uploadProgress}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                                style={{ width: `${uploadProgress}%` }}
                            >
                                {uploadProgress > 10 && (
                                    <span className="text-xs font-bold text-white">
                                        {uploadProgress}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Please wait, do not close this page</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        📤 Upload CSV File
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Select CSV File <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="csv-file"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={loading}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {file && !loading && (
                                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                                    ✓ Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                loading={loading}
                                disabled={!file || loading}
                                className="flex-1"
                            >
                                {loading ? `Uploading... ${uploadProgress}%` : 'Upload Students ✨'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate("/students")}
                                disabled={loading}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Instructions */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        📋 Instructions
                    </h2>

                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <div>
                            <h3 className="font-bold mb-2">✅ Required CSV Columns:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>first_name (required)</li>
                                <li>middle_name (optional)</li>
                                <li>last_name (required)</li>
                                <li>date_of_birth (YYYY-MM-DD, required)</li>
                                <li>gender (M or F, required)</li>
                                <li>email (optional but recommended)</li>
                                <li>phone_number (optional)</li>
                                <li>class_level (e.g., JSS1, SS2, required)</li>
                                <li>parent_name (optional)</li>
                                <li>parent_email (optional)</li>
                                <li>parent_phone (optional)</li>
                                <li>address (optional)</li>
                                <li>state_of_origin (optional)</li>
                                <li>local_govt_area (optional)</li>
                            </ul>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                            <h3 className="font-bold mb-2 text-yellow-800 dark:text-yellow-300">⚠️ Important Notes:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                                <li>First row MUST be column headers</li>
                                <li><strong>DO NOT</strong> include admission_number (auto-generated)</li>
                                <li>Class levels must exist in system (JSS1-JSS3, SS1-SS3)</li>
                                <li>Date format: YYYY-MM-DD (e.g., 2010-05-15)</li>
                                <li>Gender: M (Male) or F (Female)</li>
                                <li>Multiple students can share same email</li>
                                <li>File encoding: UTF-8</li>
                            </ul>
                        </div>

                        <Button
                            variant="outline"
                            onClick={downloadTemplate}
                            disabled={loading}
                            className="w-full"
                        >
                            📥 Download Template
                        </Button>
                    </div>
                </div>
            </div>

            {/* Upload Results */}
            {uploadResults && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        📊 Upload Results
                    </h2>

                    {uploadResults.created !== undefined && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                                <p className="text-green-600 dark:text-green-400 font-semibold">Created</p>
                                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                                    {uploadResults.created || 0}
                                </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                                <p className="text-blue-600 dark:text-blue-400 font-semibold">Updated</p>
                                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                                    {uploadResults.updated || 0}
                                </p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                                <p className="text-red-600 dark:text-red-400 font-semibold">Failed</p>
                                <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                                    {uploadResults.failed || uploadResults.errors?.length || 0}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Created Students with Credentials */}
                    {uploadResults.created_students && uploadResults.created_students.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                ✅ Created Students - Save These Credentials!
                                <span className="text-sm font-normal text-red-600 dark:text-red-400">
                                    (Passwords shown only once!)
                                </span>
                            </h3>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
                                <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                                    ⚠️ <strong>Important:</strong> Copy or screenshot these credentials now! Passwords won't be shown again.
                                </p>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {uploadResults.created_students.map((student, index) => (
                                    <div
                                        key={index}
                                        className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Name:</span>{' '}
                                                <span className="text-gray-900 dark:text-white">{student.full_name}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Admission No:</span>{' '}
                                                <span className="text-blue-700 dark:text-blue-300 font-mono font-bold">{student.admission_number}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Password:</span>{' '}
                                                <span className="text-green-700 dark:text-green-300 font-mono font-bold">{student.password}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Errors */}
                    {uploadResults.errors && uploadResults.errors.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Errors:</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {uploadResults.errors.map((error, index) => (
                                    <div
                                        key={index}
                                        className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-700 dark:text-red-300"
                                    >
                                        Row {error.row}: {error.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}