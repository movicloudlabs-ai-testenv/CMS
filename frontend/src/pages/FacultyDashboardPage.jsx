import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserSession, getUserData } from '../auth/sessionController';
import { cmsRoles, roleMenuGroups } from '../data/roleConfig';
import { API_BASE } from '../api/apiBase';
import Layout from '../components/Layout';
import { Bell, Settings, User } from 'lucide-react';
import SectionAccess from '../components/SectionAccess';

// Mock modal component for attendance
function AttendanceModal({ isOpen, onClose, onSubmit }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const classes = [
    { id: 1, code: 'CS-303', name: 'Data Structures', time: '09:00 - 10:30' },
    { id: 2, code: 'CS-306', name: 'Database Systems', time: '11:00 - 12:30' },
    { id: 3, code: 'CS-309', name: 'Web Development', time: '14:00 - 15:30' }
  ];

  const handleSubmit = () => {
    if (selectedClass && date) {
      onSubmit(selectedClass, date);
      setSelectedClass('');
      alert('Attendance marked successfully!');
      onClose();
    } else {
      alert('Please select both class and date');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', margin: '0 0 16px 0' }}>
          Mark Attendance
        </h2>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Choose a class...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name} ({c.time})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#d1d5db'}
            onMouseLeave={(e) => e.target.style.background = '#e5e7eb'}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '8px 16px',
              background: '#276221',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#1e4618'}
            onMouseLeave={(e) => e.target.style.background = '#276221'}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// Mock modal component for internal marks
function PublishMarksModal({ isOpen, onClose, onSubmit }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [marksType, setMarksType] = useState('');

  const classes = [
    { id: 1, code: 'CS-303', name: 'Data Structures' },
    { id: 2, code: 'CS-306', name: 'Database Systems' },
    { id: 3, code: 'CS-309', name: 'Web Development' }
  ];

  const marksTypes = [
    { id: 'quiz', name: 'Quiz Marks' },
    { id: 'assignment', name: 'Assignment Marks' },
    { id: 'midterm', name: 'Mid-term Marks' },
    { id: 'class_test', name: 'Class Test Marks' }
  ];

  const handleSubmit = () => {
    if (selectedClass && marksType) {
      onSubmit(selectedClass, marksType);
      setSelectedClass('');
      setMarksType('');
      alert('Internal marks published successfully!');
      onClose();
    } else {
      alert('Please select both class and marks type');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', margin: '0 0 16px 0' }}>
          Publish Internal Marks
        </h2>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Choose a class...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Marks Type
          </label>
          <select
            value={marksType}
            onChange={(e) => setMarksType(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Choose marks type...</option>
            {marksTypes.map(mt => (
              <option key={mt.id} value={mt.id}>
                {mt.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#d1d5db'}
            onMouseLeave={(e) => e.target.style.background = '#e5e7eb'}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '8px 16px',
              background: '#276221',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#1e4618'}
            onMouseLeave={(e) => e.target.style.background = '#276221'}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FacultyDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [freshUserData, setFreshUserData] = useState(null);

  const session = getUserSession();
  const dynamicUser = getUserData();
  const sessionRole = session?.role || null;
  const sessionUserId = session?.userId || null;
  const role = sessionRole || 'faculty';
  
  const userToUse = freshUserData || dynamicUser;
  
  const facultyData = userToUse ? {
    name: userToUse.name || userToUse.fullName || userToUse.staffName || 'Faculty Member',
    designation: userToUse.designation || 'Faculty',
    department: userToUse.departmentId || userToUse.department || 'Engineering',
    team: userToUse.departmentId || userToUse.department || 'School of Engineering',
    focus: 'Teaching',
    primaryAction: 'Mark Attendance',
    secondaryAction: 'Publish Internal Marks',
    ...userToUse
  } : {
    name: 'Faculty Member',
    designation: 'Faculty',
    team: 'School of Engineering',
    focus: 'Teaching',
    primaryAction: 'Mark Attendance',
    secondaryAction: 'Publish Internal Marks',
  };

  const defaultStats = [
    { value: '0', label: 'Assigned Courses', sub: 'Teaching load' },
    { value: 'N/A', label: 'Attendance Rate', sub: 'Monthly average' },
    { value: 'N/A', label: 'Pass Rate', sub: 'Student success average' },
    { value: 'Active', label: 'Status', sub: 'Employment status' }
  ];

  const stats = userToUse ? [
    { 
      value: userToUse.teaching_load?.length?.toString() || '0', 
      valueRaw: userToUse.teaching_load?.length || 0,
      label: 'Assigned Courses', 
      sub: userToUse.teaching_load?.map(c => c.courseCode || c.course_code).join(', ') || 'No courses assigned' 
    },
    { 
      value: userToUse.attendance_rate ? `${userToUse.attendance_rate}%` : 'N/A', 
      valueRaw: userToUse.attendance_rate || 0,
      label: 'Attendance Rate', 
      sub: 'Monthly average' 
    },
    { 
      value: userToUse.pass_rate ? `${userToUse.pass_rate}%` : 'N/A', 
      valueRaw: userToUse.pass_rate || 0,
      label: 'Pass Rate', 
      sub: 'Student success average' 
    },
    { 
      value: userToUse.employment_status || userToUse.status || 'Active', 
      valueRaw: 0,
      label: 'Status', 
      sub: 'Employment status' 
    }
  ] : defaultStats;

  const menuGroups = roleMenuGroups[role] || [];

  useEffect(() => {
    if (!sessionRole || !sessionUserId) {
      navigate('/', { replace: true });
      return undefined;
    }

    document.title = 'MIT Connect - Faculty Dashboard';

    const expectedSearch = `?role=${encodeURIComponent(sessionRole)}`;
    if (location.search !== expectedSearch) {
      navigate(`/dashboard${expectedSearch}`, { replace: true });
    }

    function enforceSessionOnPageRestore() {
      if (!getUserSession()) {
        navigate('/', { replace: true });
      }
    }

    async function fetchFacultyData() {
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

    fetchFacultyData();

    window.addEventListener('pageshow', enforceSessionOnPageRestore);
    return () => window.removeEventListener('pageshow', enforceSessionOnPageRestore);
  }, [location.search, navigate, sessionRole, sessionUserId]);

  const statColors = [
    { bg: '#e8f1eb', border: '#9ccf89', text: '#276221', number: '#1e4618' },
    { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', number: '#15803d' },
    { bg: '#fdf2f8', border: '#fbcfe8', text: '#ec4899', number: '#be185d' },
    { bg: '#e8f1eb', border: '#bfe6c7', text: '#3d8b30', number: '#1e4618' }
  ];

  return (
    <Layout title="Dashboard">
      <div className="faculty-dashboard">
        {/* Profile Header Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #276221 0%, #3d8b30 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {(facultyData.designation || 'FA').slice(0, 2).toUpperCase()}
            </div>
            
            {/* Profile Info */}
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 8px 0' }}>
                {facultyData.name}
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>ID: {sessionUserId}</p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>Team: {facultyData.team}</p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>Focus: {facultyData.focus}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setIsAttendanceModalOpen(true)}
              style={{
              padding: '10px 20px',
              background: '#276221',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(37, 99, 235, 0.3)'
            }}
            onMouseEnter={(e) => e.target.style.background = '#1e4618'}
            onMouseLeave={(e) => e.target.style.background = '#276221'}
            >
              {facultyData.primaryAction}
            </button>
            <button 
              onClick={() => setIsMarksModalOpen(true)}
              style={{
              padding: '10px 20px',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#d1d5db'}
            onMouseLeave={(e) => e.target.style.background = '#e5e7eb'}
            >
              {facultyData.secondaryAction}
            </button>
          </div>
        </div>

        {/* Quick Overview Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            Quick Overview
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {stats.map((stat, index) => {
              const color = statColors[index % 4];
              return (
                <div
                  key={stat.label}
                  style={{
                    background: color.bg,
                    border: `1px solid ${color.border}`,
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '32px', fontWeight: '700', color: color.number, marginBottom: '4px' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '12px', color: color.text }}>
                    {stat.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

          {/* Section Access */}
          <SectionAccess role={role} />
      </div>

      {/* Modals */}
      <AttendanceModal 
        isOpen={isAttendanceModalOpen} 
        onClose={() => setIsAttendanceModalOpen(false)}
        onSubmit={(classId, date) => {
          console.log('Attendance marked for class:', classId, 'Date:', date);
        }}
      />
      
      <PublishMarksModal 
        isOpen={isMarksModalOpen} 
        onClose={() => setIsMarksModalOpen(false)}
        onSubmit={(classId, marksType) => {
          console.log('Marks published for class:', classId, 'Type:', marksType);
        }}
      />
    </Layout>
  );
}
