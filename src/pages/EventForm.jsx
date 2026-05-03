import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { eventsAPI } from "../api/endpoints"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { CalendarDays, ArrowLeft, ImageIcon } from "lucide-react"

export function EventForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    is_published: true,
  })
  const [imageFile, setImageFile] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isEdit) fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      const res = await eventsAPI.get(id)
      const e = res.data
      // Convert event_date to local datetime-local format (YYYY-MM-DDTHH:MM)
      let dt = ""
      if (e.event_date) {
        const d = new Date(e.event_date)
        const pad = (n) => String(n).padStart(2, "0")
        dt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
      setForm({
        title: e.title || "",
        description: e.description || "",
        event_date: dt,
        location: e.location || "",
        is_published: e.is_published ?? true,
      })
      setExistingImageUrl(e.image_url || null)
    } catch {
      setError("Could not load event.")
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("title", form.title)
      formData.append("description", form.description)
      formData.append("event_date", new Date(form.event_date).toISOString())
      formData.append("location", form.location)
      formData.append("is_published", form.is_published)
      if (imageFile) formData.append("image", imageFile)

      if (isEdit) await eventsAPI.update(id, formData)
      else await eventsAPI.create(formData)

      navigate("/events")
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || "Failed to save event.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="text-center py-12 text-gray-500">Loading event...</div>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/events")} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays size={26} /> {isEdit ? "Edit Event" : "New Event"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? "Update event details" : "Post a new event for students and visitors"}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-800 border border-red-200">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g., Inter-House Sports Competition"
        />

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={5}
            placeholder="Full details about the event..."
            className="px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date & Time"
            type="datetime-local"
            required
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          />
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g., School Hall (optional)"
          />
        </div>

        {/* Image upload */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">Cover Image (optional)</label>
          {existingImageUrl && !imageFile && (
            <div className="mb-2">
              <img src={existingImageUrl} alt="Current" className="h-32 rounded-lg object-cover" />
              <p className="text-xs text-gray-500 mt-1">Current image — upload a new one to replace it</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <ImageIcon className="text-gray-400" size={20} />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          {imageFile && <p className="text-xs text-gray-500">Selected: {imageFile.name}</p>}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600"
          />
          <span className="text-sm text-gray-700">Publish immediately (visible to students)</span>
        </label>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button type="submit" loading={loading}>{isEdit ? "Save Changes" : "Create Event"}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/events")}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
