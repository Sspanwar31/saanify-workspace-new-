'use client'

import { useEffect } from 'react'
import { useAdminStore } from '@/lib/admin/store'

export default function AdminStoreTest() {
  const { clients, stats } = useAdminStore()

  useEffect(() => {
    console.log('🔧 Admin Store Test - Clients Count:', clients.length)
    console.log('🔧 Admin Store Test - Stats:', stats)
    console.log('🔧 Admin Store Test - First Client:', clients[0])
  }, [clients, stats])

  return (
    <div className="p-4">
      <h1>Admin Store Test</h1>
      <p>Clients: {clients.length}</p>
      <p>Total Clients: {stats.totalClients}</p>
      <p>Active Clients: {stats.activeClients}</p>
      
      {clients.length > 0 && (
        <div>
          <h2>First Client:</h2>
          <p>Name: {clients[0].name}</p>
          <p>Email: {clients[0].email}</p>
          <p>Status: {clients[0].status}</p>
        </div>
      )}
      
      {clients.length === 0 && (
        <p style={{ color: 'red' }}>❌ No clients found - Store is empty!</p>
      )}
    </div>
  )
}