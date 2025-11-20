import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { adminsAPI } from "../api/endpoints"
import { Table } from "../components/ui/Table"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Modal } from "../components/ui/Modal"

export function AdminsList() {
  const navigate = useNavigate()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, adminId: null })
  const [stats, setStats] = useState({ total_admins: 0, total_superadmins: 0 })

  useEffect(() => {
    fetchAdmins()
    fetchStats()
  }, [search, roleFilter])

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (roleFilter !== "all") params.role = roleFilter

      const response = await adminsAPI.list(params)
      setAdmins(response.data.results || response.data || [])
    } catch (error) {
      console.error("Failed to fetch admins:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await adminsAPI.stats()
      setStats(response.data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleDelete = async () => {
    try {
      await adminsAPI.delete(deleteModal.adminId)
      setAdmins(admins.filter((a) => a.id !== deleteModal.adminId))
      setDeleteModal({ isOpen: false, adminId: null })
      fetchStats()
    } catch (error) {
      console.error("Failed to delete admin:", error)
    }
  }

  const columns = [
    {
      key: "username",
      label: "Username",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="text-2xl">👤</span>
          <button
            onClick={() => navigate(`/admins/${row.id}/edit`)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            {value}
          </button>
        </div>
      ),
    },
    { key: "email", label: "Email" },
    { 
      key: "full_name", 
      label: "Full Name",
      render: (value, row) => `${row.first_name} ${row.last_name}`
    },
    {
      key: "role",
      label: "Role",
      render: (value) => (
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
          value === 'superadmin' 
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
        }`}>
          {value === 'superadmin' ? '⭐ SuperAdmin' : '🔑 Admin'}
        </span>
      ),
    },
    { key: "phone_number", label: "Phone" },
    {
      key: "id",
      label: "Actions",
      render: (value, row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate(`/admins/${value}/edit`)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteModal({ isOpen: true, adminId: value })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {stats.total_admins} admins • {stats.total_superadmins} superadmins
          </p>
        </div>
        <Button onClick={() => navigate("/admins/create")}>Add Admin +</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search admins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>

      <Table columns={columns} data={admins} loading={loading} />

      <Modal
        isOpen={deleteModal.isOpen}
        title="Delete Admin?"
        onClose={() => setDeleteModal({ isOpen: false, adminId: null })}
        actions={[
          { label: "Cancel", onClick: () => setDeleteModal({ isOpen: false, adminId: null }) },
          { label: "Delete", variant: "danger", onClick: handleDelete },
        ]}
      >
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to deactivate this admin account? This action can be reversed by a superadmin.
        </p>
      </Modal>
    </div>
  )
}