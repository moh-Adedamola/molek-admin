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
    sex: "male",
    address: "",
    state_of_origin: "",
    local_govt_area: "",
    class_level: "JSS1",
    stream: "General",
    section: "A",
    parent_email: "",
    parent_phone_number: "",
    passport: null,
  })
  const [preview, setPreview] = useState(null)

  // Fetch student data if editing
  useEffect(() => {
    if (mode === "edit" && id) fetchStudent()
  }, [id, mode])

  const fetchStudent = async () => {
    try {
      const response = await studentsAPI.get(id)
      setFormData({
        ...response.data,
        passport: null, // File cannot be prefilled
      })
      if (response.data.passport_url) setPreview(response.data.passport_url)
    } catch (error) {
      console.error("Failed to fetch student:", error)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, passport: file })
      const reader = new FileReader()
      reader.onload = (event) => setPreview(event.target.result)
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
      if (error.response?.data) {
        alert("Error: " + JSON.stringify(error.response.data, null, 2))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {mode === "create" ? "Create New Student" : "Edit Student"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        encType="multipart/form-data"
      >
        {/* MAIN FORM */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg space-y-6">

          {/* PERSONAL INFO */}
          <section>
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
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </section>

          {/* ACADEMIC INFO */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b-2 border-blue-500">
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Class Level */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Class Level
                </label>
                <select
                  value={formData.class_level}
                  onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
                  required
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

              {/* Stream */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Stream</label>
                <select
                  value={formData.stream}
                  onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Science">Science</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Art">Art</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">Section</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
            </div>
          </section>

          {/* PARENT INFO */}
          <section>
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
          </section>

          {/* ADDRESS INFO */}
          <section>
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
          </section>

          {/* BUTTONS */}
          <div className="flex gap-4 pt-6">
            <Button type="submit" loading={loading} className="flex-1">
              {mode === "create" ? "Create Student" : "Update Student"} ❤️
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/students")} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>

        {/* PASSPORT UPLOAD */}
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
