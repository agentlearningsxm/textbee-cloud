'use client'

import { useEffect, useState } from 'react'
import { adminApi, AdminStats } from '@/lib/api/admin'
import { Users, Shield, Smartphone, MessageSquare } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminApi.getStats()
      setStats(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load statistics')
      console.error('Stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto'></div>
          <p className='mt-4 text-gray-600 dark:text-gray-400'>Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6'>
        <div className='flex items-center space-x-3'>
          <div className='flex-shrink-0'>
            <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
              <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
            </svg>
          </div>
          <div>
            <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>Error loading statistics</h3>
            <p className='mt-1 text-sm text-red-700 dark:text-red-300'>{error}</p>
          </div>
        </div>
        <button
          onClick={loadStats}
          className='mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors'
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          System Overview
        </h2>
        <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
          Real-time statistics and system health metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          title='Total Users'
          value={stats?.totalUsers || 0}
          icon={<Users className='h-6 w-6' />}
          description={`${stats?.activeUsers || 0} active, ${stats?.bannedUsers || 0} banned`}
          color='blue'
        />
        <StatCard
          title='Admin Users'
          value={stats?.adminUsers || 0}
          icon={<Shield className='h-6 w-6' />}
          description='System administrators'
          color='purple'
        />
        <StatCard
          title='Registered Devices'
          value={stats?.totalDevices || 0}
          icon={<Smartphone className='h-6 w-6' />}
          description='Active SMS gateways'
          color='green'
        />
        <StatCard
          title='Messages Sent'
          value={stats?.totalSMSSent || 0}
          icon={<MessageSquare className='h-6 w-6' />}
          description={`${stats?.totalSMSReceived || 0} received`}
          color='orange'
        />
      </div>

      {/* Quick Actions */}
      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          Quick Actions
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <QuickActionButton
            href='/admin/users'
            title='Manage Users'
            description='View and manage user accounts'
          />
          <QuickActionButton
            href='/admin/invites'
            title='Generate Invite Code'
            description='Create new invite codes'
          />
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description: string
  color: 'blue' | 'purple' | 'green' | 'orange'
}

function StatCard({ title, value, icon, description, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  }

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
            {title}
          </p>
          <p className='mt-2 text-3xl font-bold text-gray-900 dark:text-white'>
            {value.toLocaleString()}
          </p>
          <p className='mt-2 text-xs text-gray-500 dark:text-gray-500'>
            {description}
          </p>
        </div>
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <a
      href={href}
      className='block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all group'
    >
      <h4 className='font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400'>
        {title}
      </h4>
      <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
        {description}
      </p>
    </a>
  )
}
