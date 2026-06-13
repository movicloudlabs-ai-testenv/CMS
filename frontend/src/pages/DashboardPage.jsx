import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserSession, getUserData } from '../auth/sessionController';
import { cmsRoles, roleMenuGroups } from '../data/roleConfig';
import { getDashboardSummary } from '../services/dashboardService';
import { API_BASE } from '../api/apiBase';
import Layout from '../components/Layout';
import KpiCard from '../components/KpiCard';

import KpiGrid from '../components/KpiGrid';
import SectionAccess from '../components/SectionAccess';

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [freshUserData, setFreshUserData] = useState(null);

  const session = getUserSession();
  const dynamicUser = getUserData();
  const sessionRole = session?.role || null;
  const sessionUserId = session?.userId || null;
  const role = sessionRole || 'student';
  
  const userToUse = freshUserData || dynamicUser;
  const data = userToUse ? {
    name: userToUse.name || userToUse.fullName || userToUse.staffName || 'User',
    label: userToUse.designation || userToUse.role?.toUpperCase() || role.toUpperCase(),
    ...cmsRoles[role], // Merge with default stats/tasks/alerts
    ...userToUse,
    // Override stats for students with dynamic values
    stats: role === 'student' ? [
      { value: userToUse.cgpa?.toString() || '0.0', label: 'Current GPA', sub: 'From academic record' },
      { value: `${userToUse.attendancePct || userToUse.attendancePct === 0 ? userToUse.attendancePct : 0}%`, label: 'Attendance', sub: (userToUse.attendancePct || 0) >= 75 ? 'Good standing' : 'Low attendance' },
      { value: userToUse.subjects?.length?.toString() || '0', label: 'Enrolled Courses', sub: 'Current semester' },
      { value: userToUse.feeStatus || 'N/A', label: 'Fee Status', sub: 'Financial record' },
    ] : (userToUse.stats || cmsRoles[role].stats)
  } : (cmsRoles[role] || cmsRoles.student);

  const menuGroups = roleMenuGroups[role] || roleMenuGroups.student;
  const userId = sessionUserId || 'N/A';
  const roleQuery = `?role=${encodeURIComponent(role)}`;
  const fallbackStudentId = 'STU-2024-1547';

  function handlePrimaryAction() {
    if (role === 'faculty') {
      navigate(`/attendance${roleQuery}`);
    } else if (role === 'admin') {
      navigate(`/admin-fees${roleQuery}`);
    } else if (role === 'finance') {
      navigate(`/invoices${roleQuery}`);
    } else if (role === 'student') {
      navigate(`/timetable${roleQuery}`);
    }
  }

  function handleSecondaryAction() {
    if (role === 'faculty') {
      navigate(`/exams${roleQuery}`);
    } else if (role === 'admin') {
      navigate(`/administration${roleQuery}`);
    } else if (role === 'finance') {
      navigate(`/payroll${roleQuery}`);
    } else if (role === 'student') {
      navigate(`/attendance${roleQuery}`);
    }
  }

  useEffect(() => {
    if (!sessionRole || !sessionUserId) {
      navigate('/', { replace: true });
      return undefined;
    }

    document.title = 'MIT Connect - Dashboard';

    const expectedSearch = `?role=${encodeURIComponent(sessionRole)}`;
    if (location.search !== expectedSearch) {
      navigate(`/dashboard${expectedSearch}`, { replace: true });
    }

    function enforceSessionOnPageRestore() {
      if (!getUserSession()) {
        navigate('/', { replace: true });
      }
    }

    // Fetch dashboard summary for admin/finance roles
    async function fetchDashboardData() {
      if (role === 'admin' || role === 'finance') {
        setLoadingStats(true);
        const summary = await getDashboardSummary();
        if (summary) {
          setDashboardStats(summary);
        }
        setLoadingStats(false);
      } else if (role === 'student' && sessionUserId) {
        try {
          const res = await fetch(`${API_BASE}/students/${encodeURIComponent(sessionUserId)}`);
          if (res.ok) {
            const stuData = await res.json();
            setFreshUserData(stuData);
          }
        } catch (err) {
          console.error('Failed to fetch fresh student data:', err);
        }
      } else if (role === 'faculty' && sessionUserId) {
        try {
          const res = await fetch(`${API_BASE}/faculty/${encodeURIComponent(sessionUserId)}`);
          if (res.ok) {
            const facData = await res.json();
            setFreshUserData(facData);
          }
        } catch (err) {
          console.error('Failed to fetch fresh faculty data:', err);
        }
      }
    }

    fetchDashboardData();

    window.addEventListener('pageshow', enforceSessionOnPageRestore);
    return () => window.removeEventListener('pageshow', enforceSessionOnPageRestore);
  }, [data.label, location.search, navigate, sessionRole, sessionUserId, role]);

  return (
    <Layout 
      title="Dashboard"
      userId={userId}
      onProfilePrimaryAction={handlePrimaryAction}
      onProfileSecondaryAction={handleSecondaryAction}
    >
      {/* Quick Overview */}
      <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Overview</h3>
                <KpiGrid>
                  {(() => {
                    // For admin/finance roles, if not loaded yet, show fallback stats (loading state)
                    if (role === 'admin' || role === 'finance') {
                      const statsToUse = dashboardStats ? [
                        { value: String(dashboardStats.total_students), label: 'Total Students', icon: 'group', sub: 'Approved & Active' },
                        { value: String(dashboardStats.total_faculty), label: 'Faculty Members', icon: 'person', sub: 'Approved & Active' },
                        { value: String(dashboardStats.active_events), label: 'Active Events', icon: 'event', sub: 'Current month' },
                        { value: String(dashboardStats.dept_requests), label: 'Dept Requests', icon: 'assignment', sub: 'Pending action' },
                      ] : [
                        { value: '...', label: 'Total Students', icon: 'group', sub: 'Loading...' },
                        { value: '...', label: 'Faculty Members', icon: 'person', sub: 'Loading...' },
                        { value: '...', label: 'Active Events', icon: 'event', sub: 'Loading...' },
                        { value: '...', label: 'Dept Requests', icon: 'assignment', sub: 'Loading...' },
                      ];

                      return statsToUse.map((entry, index) => {
                        const colorSchemes = ['blue', 'green', 'emerald', 'cyan'];
                        return (
                          <KpiCard
                            key={entry.label}
                            icon={entry.icon}
                            label={entry.label}
                            value={entry.value}
                            colorScheme={colorSchemes[index % 4]}
                          />
                        );
                      });
                    }
                    
                    // For student and other roles
                    const statsToUse = data.stats || [];
                    return statsToUse.map((entry, index) => {
                      const colorSchemes = ['blue', 'green', 'emerald', 'cyan'];
                      return (
                        <KpiCard
                          key={entry.label}
                          icon={entry.icon || 'dashboard'}
                          label={entry.label}
                          value={entry.value}
                          colorScheme={colorSchemes[index % 4]}
                        />
                      );
                    });
                  })()}
                </KpiGrid>
              </div>

      {/* Section Access */}
      <SectionAccess role={role} />
    </Layout>
  );
}
