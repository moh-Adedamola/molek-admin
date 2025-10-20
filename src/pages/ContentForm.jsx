import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { contentAPI } from "../api/endpoints"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"

export function ContentForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const mode = id ? "edit" : "create"
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "image",
    media: null,
    published: false,
    is_active: true,
  })
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (mode === "edit" && id) {
      fetchContent()
    }
  }, [id, mode])

  const fetchContent = async () => {
    try {
      const response = await contentAPI.get(id)
      setFormData(response.data)
      if (response.data.media_url) {
        setPreview(response.data.media_url)
      }
    } catch (error) {
      console.error("Failed to fetch content:", error)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff", "image/webp"]
      const validVideoTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-matroska",
        "video/x-flv",
        "video/x-ms-wmv",
      ]

      const isValidType =
        formData.content_type === "image" ? validImageTypes.includes(file.type) : validVideoTypes.includes(file.type)

      if (!isValidType) {
        alert(`Invalid ${formData.content_type} file type`)
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }

      setFormData({ ...formData, media: file })
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

  try {
    const submitData = new FormData()
    Object.keys(formData).forEach(key => {
      if (key === 'media' && formData.media instanceof File) {
        submitData.append(key, formData.media)
      } else if (formData[key] !== null && formData[key] !== undefined) {
        submitData.append(key, formData[key])
      }
    })

    if (mode === "create") {
      await contentAPI.create(submitData)
    } else {
      await contentAPI.update(id, submitData)
    }
    navigate("/content")
  } catch (error) {
    console.error("Failed to save content:", error)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {mode === "create" ? "Create New Content" : "Edit Content"}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
              Basic Information
            </h3>
            <div className="space-y-4">
              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:outline-none"
                  rows="4"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
              Content Type
            </h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="image"
                  checked={formData.content_type === "image"}
                  onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                />
                <span>📸 Image</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="video"
                  checked={formData.content_type === "video"}
                  onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                />
                <span>🎬 Video</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
              Publishing
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="font-semibold text-gray-700 dark:text-gray-300">Publish this content</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="font-semibold text-gray-700 dark:text-gray-300">Keep active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" loading={loading} className="flex-1">
              {mode === "create" ? "Create Content" : "Update Content"} ❤️
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/content")} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg h-fit">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {formData.content_type === "image" ? "📸" : "🎬"} Media
          </h3>
          <label className="block border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl p-6 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <div className="text-5xl mb-2">{formData.content_type === "image" ? "📸" : "🎬"}</div>
            <p className="text-gray-600 dark:text-gray-400 font-semibold">Drop {formData.content_type} here</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">or click to select</p>
            <input
              type="file"
              accept={formData.content_type === "image" ? "image/*" : "video/*"}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {preview && (
            <div className="mt-4">
              {formData.content_type === "image" ? (
                <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full rounded-xl" />
              ) : (
                <video src={preview} controls className="w-full rounded-xl" />
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
