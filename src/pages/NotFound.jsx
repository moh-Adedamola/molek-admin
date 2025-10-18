"use client"

import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-9xl mb-4">🏫</div>
        <h1 className="text-5xl font-bold text-white mb-2 font-poppins">Page Not Found</h1>
        <p className="text-xl text-blue-100 mb-8">Lost in the halls? Let's get you back on track!</p>
        <Button onClick={() => navigate("/")} className="text-lg">
          Back to Dashboard 🏠
        </Button>
      </div>
    </div>
  )
}
