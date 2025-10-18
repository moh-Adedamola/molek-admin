"use client"

import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { studentsAPI } from "../api/endpoints"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"

export function StudentForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const mode = id ? "edit" : "create"
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    age: "",
    sex: "M",
    address: "",
    state_of_origin: "",
    local_govt_area: "",
    class_level: "JSS1",
    stream: "",
    section: "",
    parent_email: "",
    parent_phone_number: "",
    passport: null,
  })
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (mode === "edit" && id) {
      fetchStudent()
    }
  }, [id, mode])

  const fetchStudent = async () => {
    try {
      const response = await studentsAPI.get(id)
      setFormData(response.data)
      if (response.data.passport_url) {
        setPreview(response.data.passport_url)
      }
    } catch (error) {
      console.error("Failed to fetch student:", error)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, passport: file })
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "create") {
        await studentsAPI.create(formData)
      } else {
        await studentsAPI.update(id, formData)
      }
      navigate("/students")
    } catch (error) {
      console.error("Failed to save student:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {mode === "create" ? "Create New Student" : "Edit Student"}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                label="Age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Sex</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="M"
                      checked={formData.sex === "M"}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    />
                    <span>Male 👨</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="F"
                      checked={formData.sex === "F"}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    />
                    <span>Female 👩</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Class Level</label>
                <select
                  value={formData.class_level}
                  onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="JSS1">JSS1</option>
                  <option value="JSS2">JSS2</option>
                  <option value="JSS3">JSS3</option>
                  <option value="SS1">SS1</option>
                  <option value="SS2">SS2</option>
                  <option value="SS3">SS3</option>
                </select>
              </div>
              <Input
                label="Stream"
                value={formData.stream}
                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
              />
              <Input
                label="Section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
              Parent Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Parent Email"
                type="email"
                value={formData.parent_email}
                onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
              />
              <Input
                label="Parent Phone"
                value={formData.parent_phone_number}
                onChange={(e) => setFormData({ ...formData, parent_phone_number: e.target.value })}
              />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {mode === "create" ? "Create Student" : "Update Student"} ❤️
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/students")} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg h-fit">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Passport Photo</h3>
          <label className="block border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl p-6 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <div className="text-5xl mb-2">📸</div>
            <p className="text-gray-600 dark:text-gray-400 font-semibold">Drop photo here</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">or click to select</p>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
          {preview && (
            <div className="mt-4">
              <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full rounded-xl" />
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
