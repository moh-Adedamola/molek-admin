import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { galleriesAPI } from "../api/endpoints";
import { Table } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";

export function GalleryList() {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, galleryId: null });

  useEffect(() => {
    fetchGalleries();
  }, [search]);

  const fetchGalleries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const response = await galleriesAPI.list(params);
      setGalleries(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch galleries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await galleriesAPI.delete(deleteModal.galleryId);
      setGalleries(galleries.filter((g) => g.id !== deleteModal.galleryId));
      setDeleteModal({ isOpen: false, galleryId: null });
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
      key: "image_count",
      label: "Images",
      render: (value) => (
        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full px-3 py-1 text-sm font-semibold">
          {value} image{value !== 1 ? "s" : ""}
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
      key: "id",
      label: "Actions",
      render: (value, row) => (
        <div className="flex gap-2">
          {/* View button (optional) */}
          <Button
            size="sm"
            onClick={() => window.open(`/gallery/${value}`, "_blank")}
          >
            View
          </Button>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gallery Management</h1>
        <Button onClick={() => navigate("/galleries/create")}>Add Gallery +</Button>
      </div>

      <Input
        placeholder="Search galleries..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Table columns={columns} data={galleries} loading={loading} />

      <Modal
        isOpen={deleteModal.isOpen}
        title="Delete Gallery?"
        onClose={() => setDeleteModal({ isOpen: false, galleryId: null })}
        actions={[
          { label: "Cancel", onClick: () => setDeleteModal({ isOpen: false, galleryId: null }) },
          { label: "Delete", variant: "danger", onClick: handleDelete },
        ]}
      >
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this gallery? Images will remain on Cloudinary.
        </p>
      </Modal>
    </div>
  );
}