import { getUserSession, getUserData } from '../auth/sessionController'
import { cmsRoles } from '../data/roleConfig'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileDropdown from './ProfileDropdown'
import NotificationBell from './NotificationBell'
import NotificationDropdown from './NotificationDropdown'

export default function TopBar({ 
  title, 
  isSidebarVisible = true,
  userId = 'N/A',
  onProfilePrimaryAction,
  onProfileSecondaryAction 
}) {
  const [globalSearch, setGlobalSearch] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const navigate = useNavigate()
  const session = getUserSession()
  const dynamicUser = getUserData()
  const role = session?.role || 'student'
  
  // Use dynamic data if available, otherwise fall back to role config
  const user = dynamicUser ? {
    name: dynamicUser.name || dynamicUser.fullName || dynamicUser.staffName || 'User',
    label: dynamicUser.designation || dynamicUser.role || role.toUpperCase(),
    team: dynamicUser.department || dynamicUser.departmentId || 'Department',
    ...dynamicUser
  } : (cmsRoles[role] || cmsRoles.student)

  return (
    <header className={`h-20 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-white/80 transition-all duration-300 ${isSidebarVisible ? 'px-10' : 'pl-24 pr-10'}`}>
      <div className="flex items-center gap-4 flex-1">
        <div>
          <h2 className="text-[20px] font-bold text-[#276221] tracking-tight">MIT Connect</h2>
          <p className="text-xs text-slate-500">{title || 'Dashboard'}</p>
        </div>
      </div>
      <div className="relative hidden md:flex items-center gap-2">
        <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
        <input
          type="text"
          placeholder="Global search..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="w-48 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600-500 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
        />
        {globalSearch && (
          <button
            onClick={() => setGlobalSearch('')}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 relative">
          <NotificationBell 
            role={role}
            onBellClick={() => setIsNotificationOpen(!isNotificationOpen)}
          />
          {isNotificationOpen && (
            <NotificationDropdown 
              role={role}
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />
          )}
          <button
            className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
            onClick={() => navigate('/settings')}
            aria-label="Open settings"
            title="Settings"
          >
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </button>
        </div>
        <div className="flex items-center gap-4 border-l border-slate-100 pl-6 cursor-pointer group relative">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1e293b]">{user.name}</p>
            <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">{user.label}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105 cursor-pointer"
            aria-label="Open profile dropdown"
            title="Open profile"
          >
            <img 
              src="https://img.freepik.com/free-photo/young-bearded-man-with-striped-shirt_273609-5677.jpg" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </button>
          <ProfileDropdown
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={user}
            userId={userId}
            role={role}
            onPrimaryAction={onProfilePrimaryAction}
            onSecondaryAction={onProfileSecondaryAction}
          />
        </div>
      </div>
    </header>
  )
}
