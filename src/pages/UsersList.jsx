"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { usersAPI } from "../api/endpoints"
import { Table } from "../components/ui/Table"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Modal } from "../components/ui/Modal"

export function UsersList() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null })

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (roleFilter !== "all") params.role = roleFilter

      const response = await usersAPI.list(params)
      setUsers(response.data.results || response.data)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await usersAPI.delete(deleteModal.userId)
      setUsers(users.filter((u) => u.id !== deleteModal.userId))
      setDeleteModal({ isOpen: false, userId: null })
    } catch (error) {
      console.error("Failed to delete user:", error)
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
            onClick={() => navigate(`/users/${row.id}/edit`)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            {value}
          </button>
        </div>
      ),
    },
    { key: "email", label: "Email" },
    { key: "full_name", label: "Full Name" },
    {
      key: "role",
      label: "Role",
      render: (value) => (
        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full px-3 py-1 text-sm font-semibold">
          {value}
        </span>
      ),
    },
    { key: "phone_number", label: "Phone" },
    {
      key: "id",
      label: "Actions",
      render: (value, row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate(`/users/${value}/edit`)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteModal({ isOpen: true, userId: value })}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users Management</h1>
        <Button onClick={() => navigate("/users/create")}>Add User +</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search users..."
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
          <option value="teacher">Teacher</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>

      <Table columns={columns} data={users} loading={loading} />

      <Modal
        isOpen={deleteModal.isOpen}
        title="Delete User?"
        onClose={() => setDeleteModal({ isOpen: false, userId: null })}
        actions={[
          { label: "Cancel", onClick: () => setDeleteModal({ isOpen: false, userId: null }) },
          { label: "Delete", variant: "danger", onClick: handleDelete },
        ]}
      >
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this user? This action cannot be undone. 😢
        </p>
      </Modal>
    </div>
  )
}
