import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { studentsAPI } from "../api/endpoints"
import { Table } from "../components/ui/Table"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Modal } from "../components/ui/Modal"

export function StudentsList() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [classLevel, setClassLevel] = useState("all")
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, studentId: null })

  useEffect(() => {
    fetchStudents()
  }, [search, classLevel])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (classLevel !== "all") params.class_level = classLevel

      const response = await studentsAPI.list(params)
      setStudents(response.data.results || response.data)
    } catch (error) {
      console.error("Failed to fetch students:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await studentsAPI.delete(deleteModal.studentId)
      setStudents(students.filter((s) => s.id !== deleteModal.studentId))
      setDeleteModal({ isOpen: false, studentId: null })
    } catch (error) {
      console.error("Failed to delete student:", error)
    }
  }

  const columns = [
    {
      key: "admission_number",
      label: "Admission #",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
            title="Copy admission number"
          >
            📋
          </button>
        </div>
      ),
    },
    {
      key: "full_name",
      label: "Full Name",
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="text-2xl">👦</span>
          <span>{value}</span>
        </div>
      ),
    },
    { key: "class_level", label: "Class" },
    { key: "stream", label: "Stream" },
    { key: "age", label: "Age" },
    { key: "parent_email", label: "Parent Email" },
    {
      key: "id",
      label: "Actions",
      render: (value, row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate(`/students/${value}/edit`)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteModal({ isOpen: true, studentId: value })}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students Management</h1>
        <Button onClick={() => navigate("/students/create")}>Add Student +</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={classLevel}
          onChange={(e) => setClassLevel(e.target.value)}
          className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Classes</option>
          <option value="JSS1">JSS1</option>
          <option value="JSS2">JSS2</option>
          <option value="JSS3">JSS3</option>
          <option value="SS1">SS1</option>
          <option value="SS2">SS2</option>
          <option value="SS3">SS3</option>
        </select>
      </div>

      <Table columns={columns} data={students} loading={loading} />

      <Modal
        isOpen={deleteModal.isOpen}
        title="Delete Student?"
        onClose={() => setDeleteModal({ isOpen: false, studentId: null })}
        actions={[
          { label: "Cancel", onClick: () => setDeleteModal({ isOpen: false, studentId: null }) },
          { label: "Delete", variant: "danger", onClick: handleDelete },
        ]}
      >
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this student? This action cannot be undone. 😢
        </p>
      </Modal>
    </div>
  )
}
