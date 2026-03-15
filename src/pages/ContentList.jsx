import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { contentAPI } from "../api/endpoints"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Modal } from "../components/ui/Modal"

export function ContentList({ defaultContentType = "all", pageTitle = "Content Management" }) {
  const navigate = useNavigate()
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState(defaultContentType)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, contentId: null })
  const [previewModal, setPreviewModal] = useState({ isOpen: false, item: null })

  useEffect(() => {
    fetchContent()
  }, [search, typeFilter])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (typeFilter !== "all") params.content_type = typeFilter

      const response = await contentAPI.list(params)
      setContent(response.data.results || response.data || [])
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await contentAPI.delete(deleteModal.contentId)
      setContent(content.filter((c) => c.id !== deleteModal.contentId))
      setDeleteModal({ isOpen: false, contentId: null })
    } catch (error) {

    }
  }

  const togglePublished = async (item) => {
    try {
      await contentAPI.update(item.id, { published: !item.published })
      setContent(content.map((c) => (c.id === item.id ? { ...c, published: !c.published } : c)))
    } catch (error) {

    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      image: "",
      video: "",
      news: ""
    }
    return icons[type] || ""
  }

  const createPath = defaultContentType === "news" ? "/news/create" : "/content/create"
  const editPath = (id) => defaultContentType === "news" ? `/news/${id}/edit` : `/content/${id}/edit`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
        <Button onClick={() => navigate(createPath)}>
          Add {defaultContentType === "news" ? "News" : "Content"} +
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder={`Search ${defaultContentType === "news" ? "news" : "content"}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        {defaultContentType === "all" && (
          <div className="flex gap-2">
            {["all", "image", "video", "news"].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                  typeFilter === type
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }`}
              >
                {type === "all" ? "All" : `${getTypeIcon(type)} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {content.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {item.media_url && item.content_type !== 'news' && (
                  <div className="md:w-32 h-32 flex-shrink-0">
                    {item.content_type === "image" ? (
                      <img
                        src={item.media_url}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-xl cursor-pointer"
                        onClick={() => setPreviewModal({ isOpen: true, item })}
                      />
                    ) : (
                      <video
                        src={item.media_url}
                        className="w-full h-full object-cover rounded-xl cursor-pointer"
                        onClick={() => setPreviewModal({ isOpen: true, item })}
                      />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">
                        {getTypeIcon(item.content_type)} {item.content_type_display || item.content_type.toUpperCase()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        item.published
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      By {item.created_by?.full_name || "Admin"} • {new Date(item.publish_date).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePublished(item)}
                        className="px-3 py-2 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        {item.published ? "Unpublish" : "Publish"}
                      </button>
                      <Button size="sm" onClick={() => navigate(editPath(item.id))}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteModal({ isOpen: true, contentId: item.id })}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={deleteModal.isOpen}
        title="Delete Content?"
        onClose={() => setDeleteModal({ isOpen: false, contentId: null })}
        actions={[
          { label: "Cancel", onClick: () => setDeleteModal({ isOpen: false, contentId: null }) },
          { label: "Delete", variant: "danger", onClick: handleDelete },
        ]}
      >
        <p className="text-gray-600">
          Are you sure you want to delete this content? This action cannot be undone.
        </p>
      </Modal>

      <Modal
        isOpen={previewModal.isOpen}
        title={previewModal.item?.title || "Preview"}
        onClose={() => setPreviewModal({ isOpen: false, item: null })}
      >
        {previewModal.item?.content_type === "image" ? (
          <img
            src={previewModal.item?.media_url}
            alt={previewModal.item?.title}
            className="w-full rounded-xl"
          />
        ) : (
          <video src={previewModal.item?.media_url} controls className="w-full rounded-xl" />
        )}
      </Modal>
    </div>
  )
}