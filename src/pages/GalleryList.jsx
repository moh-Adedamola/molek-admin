import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { galleriesAPI } from "../api/endpoints";
import { Table } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";

export function GalleryList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, galleryId: null });

  useEffect(() => {
    fetchGalleries();
  }, [search, location.key]); // ✅ Added location.key to refetch on navigation

  const fetchGalleries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      
      // ✅ Force no cache
      const response = await galleriesAPI.list(params);
      
      // Handle both paginated and non-paginated responses
      let galleryData;
      if (response.data.results) {
        galleryData = response.data.results;
      } else if (Array.isArray(response.data)) {
        galleryData = response.data;
      } else {
        galleryData = [];
      }
      
      console.log('Fetched galleries:', galleryData);
      
      // ✅ Filter only active galleries on frontend as backup
      const activeGalleries = galleryData.filter(g => g.is_active !== false);
      setGalleries(activeGalleries);
    } catch (error) {
      console.error("Failed to fetch galleries:", error);
      setGalleries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await galleriesAPI.delete(deleteModal.galleryId);
      
      // ✅ Immediately remove from local state
      setGalleries(galleries.filter((g) => g.id !== deleteModal.galleryId));
      setDeleteModal({ isOpen: false, galleryId: null });
      
      // ✅ Refetch to ensure sync
      setTimeout(() => fetchGalleries(), 500);
    } catch (error) {
      console.error("Failed to delete gallery:", error);
    }
  };

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="text-2xl">🖼️</span>
          <span className="font-semibold text-gray-800 dark:text-white">
            {value || `Gallery ${row.id}`}
          </span>
        </div>
      ),
    },
    {
      key: "media_count",
      label: "Media",
      render: (value) => (
        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full px-3 py-1 text-sm font-semibold">
          {value || 0} {value === 1 ? "item" : "items"}
        </span>
      ),
    },
    {
      key: "created_by",
      label: "Created By",
      render: (value) => value?.username || "Admin",
    },
    {
      key: "created_at",
      label: "Date",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "is_active",
      label: "Status",
      render: (value) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (value, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteModal({ isOpen: true, galleryId: value })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gallery Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total: {galleries.length} {galleries.length === 1 ? 'gallery' : 'galleries'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => fetchGalleries()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </Button>
          <Button onClick={() => navigate("/galleries/create")}>
            ➕ Add Gallery
          </Button>
        </div>
      </div>

      <Input
        placeholder="Search galleries..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {galleries.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            No galleries found
          </p>
          <Button onClick={() => navigate("/galleries/create")}>
            Create Your First Gallery
          </Button>
        </div>
      )}

      {galleries.length > 0 && (
        <Table columns={columns} data={galleries} loading={loading} />
      )}

      <Modal
        isOpen={deleteModal.isOpen}
        title="Delete Gallery?"
        onClose={() => setDeleteModal({ isOpen: false, galleryId: null })}
        actions={[
          { 
            label: "Cancel", 
            onClick: () => setDeleteModal({ isOpen: false, galleryId: null }) 
          },
          { 
            label: "Delete", 
            variant: "danger", 
            onClick: handleDelete 
          },
        ]}
      >
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this gallery? This will soft-delete the gallery (set is_active=False). 
          Media files will remain on Cloudinary.
        </p>
      </Modal>
    </div>
  );
}