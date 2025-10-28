import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { usersAPI } from "../api/endpoints"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"

export function UserForm() {
  const navigate = useNavigate()
  const { id } = useParams()
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
    sex: "male", // ✅ corrected value
    address: "",
    state_of_origin: "",
    local_govt_area: "",
    role: "teacher",
    password: "", // ✅ added for create mode
  })

  useEffect(() => {
    if (mode === "edit" && id) {
      fetchUser()
    }
  }, [id, mode])

  const fetchUser = async () => {
    try {
      const response = await usersAPI.get(id)
      setFormData(response.data)
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setError("Unable to fetch user data. Please try again later.")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // ✅ Basic validation
    if (!formData.username || !formData.email || !formData.first_name || !formData.last_name) {
      setError("Please fill in all required fields.")
      setLoading(false)
      return
    }

    if (mode === "create" && formData.password.length < 6) {
      setError("Password must be at least 6 characters.")
      setLoading(false)
      return
    }

    try {
      if (mode === "create") {
        await usersAPI.create(formData)
      } else {
        await usersAPI.update(id, formData)
      }
      navigate("/users")
    } catch (error) {
      console.error("Failed to save user:", error)
      setError("Failed to save user. Please check the fields and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {mode === "create" ? "Create New User" : "Edit User"}
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

            {/* ✅ Only show password field when creating */}
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
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
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
            {mode === "create" ? "Create User" : "Update User"} ❤️
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/users")} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
