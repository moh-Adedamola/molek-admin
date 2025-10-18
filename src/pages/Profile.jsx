"use client"

import { useState } from "react"
import { useAuth } from "../hooks/useAuth"
import { profileAPI, authAPI } from "../api/endpoints"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Modal } from "../components/ui/Modal"

export function Profile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [formData, setFormData] = useState({
    phone_number: user?.phone_number || "",
    address: user?.address || "",
    state_of_origin: user?.state_of_origin || "",
    local_govt_area: user?.local_govt_area || "",
  })
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await profileAPI.update(formData)
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Failed to update profile:", error)
      alert("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      await authAPI.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
      alert("Password changed successfully!")
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
      setShowPasswordModal(false)
    } catch (error) {
      console.error("Failed to change password:", error)
      alert("Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Username" value={user?.username || ""} disabled />
              <Input label="Email" value={user?.email || ""} disabled />
              <Input label="First Name" value={user?.first_name || ""} disabled />
              <Input label="Last Name" value={user?.last_name || ""} disabled />
            </div>

            <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Editable Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
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
                Save Changes ❤️
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowPasswordModal(true)} className="flex-1">
                Change Password 🔐
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg h-fit">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Summary</h2>
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">👤</div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user?.role}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User ID</p>
              <p className="font-mono text-gray-900 dark:text-white">{user?.id}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Role</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPasswordModal}
        title="Change Password"
        onClose={() => setShowPasswordModal(false)}
        actions={[
          { label: "Cancel", onClick: () => setShowPasswordModal(false) },
          { label: "Change Password", onClick: handleChangePassword },
        ]}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Old Password"
            type="password"
            value={passwordForm.oldPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
          />
        </form>
      </Modal>
    </div>
  )
}
