import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { eventsAPI } from "../api/endpoints"
import { Button } from "../components/ui/Button"
import { Modal } from "../components/ui/Modal"
import { CalendarDays, MapPin, Edit, Trash2, Eye, Plus, Search } from "lucide-react"

export function EventList() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, eventId: null, title: "" })
  const [previewModal, setPreviewModal] = useState({ isOpen: false, event: null })
  const [message, setMessage] = useState(null)

  useEffect(() => { fetchEvents() }, [search, filter])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      const res = await eventsAPI.list(params)
      let list = res.data?.results || res.data || []
      const now = new Date()
      if (filter === "upcoming") list = list.filter(e => new Date(e.event_date) >= now)
      else if (filter === "past") list = list.filter(e => new Date(e.event_date) < now)
      setEvents(list)
    } catch (err) {
      setMessage({ type: "error", text: "Could not load events." })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await eventsAPI.delete(deleteModal.eventId)
      setMessage({ type: "success", text: "Event deleted." })
      setDeleteModal({ isOpen: false, eventId: null, title: "" })
      fetchEvents()
    } catch {
      setMessage({ type: "error", text: "Could not delete event." })
    }
  }

  const handleTogglePublish = async (event) => {
    try {
      const formData = new FormData()
      formData.append("is_published", !event.is_published)
      await eventsAPI.partialUpdate(event.id, formData)
      setMessage({ type: "success", text: `Event ${!event.is_published ? "published" : "unpublished"}.` })
      fetchEvents()
    } catch {
      setMessage({ type: "error", text: "Could not update event." })
    }
  }

  const formatDate = (iso) => {
    if (!iso) return "—"
    const d = new Date(iso)
    return d.toLocaleString("en-NG", {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays size={26} /> Events
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Post school events visible to students and visitors</p>
        </div>
        <Button onClick={() => navigate("/events/new")}>
          <Plus size={16} className="mr-1" /> New Event
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {[{value: "all", label: "All"}, {value: "upcoming", label: "Upcoming"}, {value: "past", label: "Past"}].map(opt => (
            <button key={opt.value} onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === opt.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
          <CalendarDays size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm">No events found. Click "New Event" to add one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => {
            const isPast = new Date(event.event_date) < new Date()
            return (
              <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {event.image_url && (
                  <div className="h-40 bg-gray-100 overflow-hidden">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{event.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${isPast ? "bg-gray-100 text-gray-600" : event.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {isPast ? "Past" : event.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-blue-500" />
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-blue-500" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{event.description}</p>
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => setPreviewModal({ isOpen: true, event })} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye size={14} /> View
                    </button>
                    <button onClick={() => navigate(`/events/${event.id}/edit`)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg">
                      <Edit size={14} /> Edit
                    </button>
                    <button onClick={() => handleTogglePublish(event)} className="flex-1 px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg">
                      {event.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={() => setDeleteModal({ isOpen: true, eventId: event.id, title: event.title })} className="flex items-center justify-center px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={deleteModal.isOpen} title="Delete event?" onClose={() => setDeleteModal({ isOpen: false, eventId: null, title: "" })}
        actions={[
          { label: "Cancel", variant: "secondary", onClick: () => setDeleteModal({ isOpen: false, eventId: null, title: "" }) },
          { label: "Delete", variant: "danger", onClick: handleDelete },
        ]}>
        <p className="text-gray-700">Are you sure you want to delete <b>{deleteModal.title}</b>? This cannot be undone.</p>
      </Modal>

      <Modal isOpen={previewModal.isOpen} title={previewModal.event?.title} onClose={() => setPreviewModal({ isOpen: false, event: null })}
        actions={[{ label: "Close", variant: "secondary", onClick: () => setPreviewModal({ isOpen: false, event: null }) }]}>
        {previewModal.event && (
          <div className="space-y-3">
            {previewModal.event.image_url && (
              <img src={previewModal.event.image_url} alt={previewModal.event.title} className="w-full rounded-lg" />
            )}
            <div className="text-sm text-gray-600 space-y-1">
              <div><b>Date:</b> {formatDate(previewModal.event.event_date)}</div>
              {previewModal.event.location && <div><b>Location:</b> {previewModal.event.location}</div>}
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{previewModal.event.description}</div>
          </div>
        )}
      </Modal>
    </div>
  )
}
