import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsProvider, useSettingsContext } from '../../context/SettingsContext';
import AcademicSidebar from '../AcademicSidebar';
import TopBar from '../TopBar';
import AccessibilitySettings from './AccessibilitySettings';
import AccountManagement from './AccountManagement';
import AccountSettings from './AccountSettings';
import AppearanceSettings from './AppearanceSettings';
import LanguageSettings from './LanguageSettings';
import NotificationSettings from './NotificationSettings';
import PrivacySettings from './PrivacySettings';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import SettingsSidebar from './SettingsSidebar';
import TeachingPreferences from './TeachingPreferences';
import { getSettingsMenu } from './settingsMenu';

function SettingsContent({ role, userId }) {
  const navigate = useNavigate();
  const menuItems = useMemo(() => getSettingsMenu(role), [role]);
  const [activeItem, setActiveItem] = useState('profile');
  const { hasUnsavedChanges } = useSettingsContext();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  function toggleSidebar() {
    setIsSidebarVisible((prev) => !prev);
  }

  function handleSelect(itemId) {
    if (itemId === 'dashboard') {
      if (hasUnsavedChanges) {
        const shouldProceed = window.confirm('You have unsaved changes. Leave settings and return to dashboard?');
        if (!shouldProceed) {
          return;
        }
      }

      navigate(`/dashboard?role=${encodeURIComponent(role)}`);
      return;
    }

    setActiveItem(itemId);
  }

  function renderSection() {
    switch (activeItem) {
      case 'profile':
        return <ProfileSettings role={role} userId={userId} />;
      case 'account':
        return <AccountSettings role={role} userId={userId} />;
      case 'notifications':
        return <NotificationSettings role={role} userId={userId} />;
      case 'security':
        return <SecuritySettings role={role} userId={userId} />;
      case 'appearance':
        return <AppearanceSettings role={role} userId={userId} />;
      case 'language':
        return <LanguageSettings role={role} userId={userId} />;
      case 'privacy':
        return <PrivacySettings role={role} userId={userId} />;
      case 'accessibility':
        return <AccessibilitySettings role={role} userId={userId} />;
      case 'teaching-preferences':
        return <TeachingPreferences role={role} userId={userId} />;
      case 'account-management':
        return <AccountManagement role={role} userId={userId} />;
      default:
        return <ProfileSettings role={role} userId={userId} />;
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#1e293b]">
      <AcademicSidebar isSidebarVisible={isSidebarVisible} onToggleSidebar={toggleSidebar} />

      {!isSidebarVisible && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-6 z-[60] p-3 rounded-xl shadow-lg bg-white border border-slate-200 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center"
          title="Show sidebar"
        >
          <span className="material-symbols-outlined text-[28px] text-black font-semibold">menu</span>
        </button>
      )}

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarVisible ? 'ml-64' : 'ml-0'}`}>
        <TopBar 
          title="User Settings" 
          isSidebarVisible={isSidebarVisible}
          userId={userId}
        />
        
        <div className="user-settings-page">
          <div className="user-settings-layout">
            <SettingsSidebar role={role} menuItems={menuItems} activeItemId={activeItem} onSelectItem={handleSelect} />

            <div className="user-settings-main">
              {hasUnsavedChanges ? (
                <div className="user-settings-warning">Unsaved changes detected. Save or reset before leaving this page.</div>
              ) : null}
              {renderSection()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function UserSettingsPage({ role, userId }) {
  return (
    <SettingsProvider>
      <SettingsContent role={role} userId={userId} />
    </SettingsProvider>
  );
}
