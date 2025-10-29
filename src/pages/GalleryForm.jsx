import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { galleriesAPI } from "../api/endpoints";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function GalleryForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [images, setImages] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 20) {
      setError("You can upload a maximum of 20 images.");
      return;
    }
    setError("");
    setImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      setError("Please select at least one image.");
      return;
    }

    const formData = new FormData();
    if (title.trim()) {
      formData.append("title", title.trim());
    }
    images.forEach((file) => {
      formData.append("images", file);
    });

    setLoading(true);
    setError("");

    try {
      await galleriesAPI.create(formData);
      navigate("/galleries");
    } catch (err) {
      console.error("Failed to create gallery:", err);
      setError("Failed to upload gallery. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Create New Gallery
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg space-y-6">
        <div>
          <Input
            label="Gallery Title (Optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Upload Images *
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="mt-2 text-sm text-gray-500">
            Select 1–20 images (JPG, PNG, WEBP). All images will be uploaded to Cloudinary.
          </p>
          {images.length > 0 && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              {images.length} image{images.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>

        <div className="flex gap-4 pt-6">
          <Button type="submit" loading={loading} className="flex-1">
            Create Gallery 🖼️
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/galleries")}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}