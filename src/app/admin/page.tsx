'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [id, setId] = useState('')
  const [pass, setPass] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (id === 'akaal-id' && pass === 'Asia2025!') {
      // Set a cookie or local storage to prove we are logged in
      localStorage.setItem('isAdmin', 'true')
      // Redirect to the dashboard folder
      router.push('/admin-dashboard')
    } else {
      alert('Invalid Credentials')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white font-sans">
      <form onSubmit={handleLogin} className="flex flex-col gap-6 p-10 border border-gray-800 rounded-2xl bg-[#111] w-full max-w-sm">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold">Neksa Admin</h1>
          <p className="text-gray-500 text-sm">Please sign in to continue</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Admin ID</label>
            <input 
              value={id} 
              onChange={e => setId(e.target.value)}
              className="w-full bg-[#222] p-3 rounded-lg border border-gray-700 text-white focus:border-green-500 outline-none transition" 
              placeholder="Enter ID"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Password</label>
            <input 
              type="password" 
              value={pass} 
              onChange={e => setPass(e.target.value)}
              className="w-full bg-[#222] p-3 rounded-lg border border-gray-700 text-white focus:border-green-500 outline-none transition" 
              placeholder="••••••••"
            />
          </div>
        </div>

        <button className="bg-green-600 hover:bg-green-700 text-black font-bold p-3 rounded-lg transition mt-2">
          Sign In
        </button>
      </form>
    </div>
  )
}