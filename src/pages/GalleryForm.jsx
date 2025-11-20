import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { galleriesAPI } from "../api/endpoints";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

// Enhanced reusable validator (per-file; called in batch)
const validateMediaFile = (file) => {
  const maxSizeMB = 50;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File "${file.name}" exceeds ${maxSizeMB}MB limit.`;
  }
  if (!allowedTypes.some(type => file.type === type)) {
    return `Unsupported type for "${file.name}". Use images (JPG/PNG/WEBP) or videos (MP4/MOV).`;
  }
  return null;
};

// Custom hook for media management (now supports batch append)
const useMediaUpload = (options = { maxFiles: 20, maxSizeMB: 50 }) => {
  const { maxFiles } = options;
  const [media, setMedia] = useState([]);
  const [error, setError] = useState("");

  const addFiles = (files) => {
    const newFiles = Array.from(files);
    if (media.length + newFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files reached (adding ${newFiles.length} would exceed).`);
      return false;
    }

    const validationErrors = newFiles.map(validateMediaFile).filter(Boolean);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '));
      return false;
    }

    setMedia(prev => [...prev, ...newFiles]);
    setError("");
    return true;
  };

  const removeFile = (index) => setMedia(prev => prev.filter((_, i) => i !== index));
  const clearAll = () => setMedia([]);

  return { media, addFiles, removeFile, clearAll, error, setError };
};

// Reusable upload progress hook
const useUploadProgress = () => {
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'complete' | 'error'

  const startUpload = () => {
    setUploadStatus('uploading');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + (Math.random() * 10 + 5);
      });
    }, 200);
    return interval;
  };

  const completeUpload = () => {
    setProgress(100);
    setUploadStatus('complete');
  };

  const failUpload = () => {
    setUploadStatus('error');
  };

  const reset = () => {
    setProgress(0);
    setUploadStatus('idle');
  };

  return { progress, uploadStatus, startUpload, completeUpload, failUpload, reset };
};

export function GalleryForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const fileInputRef = useRef(null);
  const { media, addFiles, removeFile, clearAll, error: mediaError, setError: setMediaError } = useMediaUpload();
  const { progress, uploadStatus, startUpload, completeUpload, failUpload, reset } = useUploadProgress();

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      addFiles(files);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (media.length === 0) {
      setMediaError("Please select at least one media file.");
      return;
    }

    const formData = new FormData();
    if (title.trim()) {
      formData.append("title", title.trim());
    }
    media.forEach((file) => {
      formData.append("media", file);
    });

    setLoading(true);
    const uploadInterval = startUpload();
    setMediaError("");

    try {
      const response = await galleriesAPI.create(formData);
      console.log('Gallery created successfully:', response.data);
      
      clearInterval(uploadInterval);
      completeUpload();
      
      // Navigate after brief success display
      setTimeout(() => {
        navigate("/galleries");
      }, 1000);
    } catch (err) {
      console.error("Failed to create gallery:", err);
      clearInterval(uploadInterval);
      failUpload();
      
      // Extract error message
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail ||
                          'Failed to upload gallery. Please try again.';
      setMediaError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Create New Gallery ✨
      </h1>

      {mediaError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg animate-pulse">
          {mediaError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg space-y-6">
        <div>
          <Input
            label="Gallery Title (Optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter gallery title..."
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Upload Media Files * (Images or Videos) 📸🎥
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="mt-2 text-sm text-gray-500">
            Select multiple files (up to 20 total). Supports images (JPG/PNG/WEBP) and videos (MP4/MOV).
          </p>

          {media.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                {media.length}/20 file{media.length !== 1 ? "s" : ""} selected:
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {media.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-md shadow-sm">
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="text-xs">
                        {file.type.startsWith('image/') ? '🖼️' : '🎥'}
                      </span>
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
              {media.length < 20 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-full border-dashed border-2"
                >
                  Add More Files 📁
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {uploadStatus === 'uploading' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Uploading... {progress.toFixed(0)}%</span>
              <span>✨</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {uploadStatus === 'complete' && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-center font-semibold">
            🎉 Gallery created successfully! Redirecting...
          </div>
        )}

        <div className="flex gap-4 pt-6">
          <Button 
            type="submit" 
            loading={loading || uploadStatus === 'uploading'} 
            disabled={uploadStatus === 'uploading' || media.length === 0}
            className="flex-1"
          >
            {uploadStatus === 'complete' ? 'All Done! 🎊' : 'Create Gallery 📸🎥'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              clearAll();
              reset();
              navigate("/galleries");
            }}
            className="flex-1"
            disabled={uploadStatus === 'uploading'}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}