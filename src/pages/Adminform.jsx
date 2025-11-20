import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { adminsAPI } from "../api/endpoints"
import { useAuth } from "../hooks/useAuth"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"

export function AdminForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const mode = id ? "edit" : "create"
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    age: "",
    sex: "male",
    address: "",
    state_of_origin: "",
    local_govt_area: "",
    role: "admin",
    password: "",
  })

  useEffect(() => {
    if (mode === "edit" && id) {
      fetchAdmin()
    }
  }, [id, mode])

  const fetchAdmin = async () => {
    try {
      const response = await adminsAPI.get(id)
      const data = response.data
      setFormData({
        ...data,
        password: "", // Never populate password field
      })
    } catch (error) {
      console.error("Failed to fetch admin:", error)
      setError("Unable to fetch admin data. Please try again later.")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!formData.username || !formData.email || !formData.first_name || !formData.last_name) {
      setError("Please fill in all required fields.")
      setLoading(false)
      return
    }

    if (mode === "create" && formData.password.length < 8) {
      setError("Password must be at least 8 characters.")
      setLoading(false)
      return
    }

    // Prevent regular admins from creating superadmins
    if (user?.role === 'admin' && formData.role === 'superadmin') {
      setError("Only superadmins can create other superadmins.")
      setLoading(false)
      return
    }

    try {
      const submitData = { ...formData }
      if (mode === "edit" && !submitData.password) {
        delete submitData.password // Don't send empty password on edit
      }

      if (mode === "create") {
        await adminsAPI.create(submitData)
      } else {
        await adminsAPI.update(id, submitData)
      }
      navigate("/admins")
    } catch (error) {
      console.error("Failed to save admin:", error)
      setError(error.response?.data?.detail || "Failed to save admin. Please check the fields and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {mode === "create" ? "Create New Admin" : "Edit Admin"}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg space-y-6">
        {/* Personal Info */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={mode === "edit"}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
            <Input
              label="Age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />

            {mode === "create" && (
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Sex</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="male"
                    checked={formData.sex === "male"}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                  />
                  <span>Male 👨</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="female"
                    checked={formData.sex === "female"}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                  />
                  <span>Female 👩</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                disabled={user?.role === 'admin' && formData.role === 'superadmin'} // Admins can't change superadmins
              >
                <option value="admin">🔑 Admin</option>
                {user?.role === 'superadmin' && <option value="superadmin">⭐ Superadmin</option>}
              </select>
              {user?.role === 'admin' && (
                <p className="text-xs text-gray-500 mt-1">Only superadmins can create superadmins</p>
              )}
            </div>

            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Input
              label="State of Origin"
              value={formData.state_of_origin}
              onChange={(e) => setFormData({ ...formData, state_of_origin: e.target.value })}
            />
            <Input
              label="Local Government Area"
              value={formData.local_govt_area}
              onChange={(e) => setFormData({ ...formData, local_govt_area: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <Button type="submit" loading={loading} className="flex-1">
            {mode === "create" ? "Create Admin" : "Update Admin"} ✨
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/admins")} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}