import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import KpiCard from '../components/KpiCard';
import KpiGrid from '../components/KpiGrid';
import { Building2, Users, BookOpen, Mail, MapPin, Share2, Edit, X, Save } from 'lucide-react';
import { getUserData } from '../auth/sessionController';

const API_BASE_URL = 'http://localhost:5000/api';

// Mock department data for Faculty
const mockDepartments = [
  {
    id: 1,
    name: 'Computer Science & Engineering',
    code: 'CSE',
    head: 'Prof. Dr. Amjad Khan',
    totalFaculty: 24,
    totalStudents: 312,
    courses: 45,
    email: 'cse@mit.edu',
    phone: '+91-9876543210',
    location: 'Building A, Floor 3',
    description: 'Excellence in computer science education and research'
  },
  {
    id: 2,
    name: 'Electrical Engineering',
    code: 'EEE',
    head: 'Prof. K.V. Rao',
    totalFaculty: 18,
    totalStudents: 256,
    courses: 38,
    email: 'eee@mit.edu',
    phone: '+91-9876543211',
    location: 'Building B, Floor 2',
    description: 'Power systems, control systems, and renewable energy focus'
  },
  {
    id: 3,
    name: 'Mechanical Engineering',
    code: 'ME',
    head: 'Prof. S. Natarajan',
    totalFaculty: 22,
    totalStudents: 298,
    courses: 42,
    email: 'me@mit.edu',
    phone: '+91-9876543212',
    location: 'Building C, Floor 1',
    description: 'Thermal engineering, manufacturing, and design specializations'
  },
  {
    id: 4,
    name: 'Civil Engineering',
    code: 'CE',
    head: 'Prof. Ramesh Gupta',
    totalFaculty: 16,
    totalStudents: 224,
    courses: 35,
    email: 'ce@mit.edu',
    phone: '+91-9876543213',
    location: 'Building D, Floor 2',
    description: 'Infrastructure, structures, and environmental engineering'
  }
];

// Edit Department Modal
function EditDepartmentModal({ isOpen, onClose, department, onSave }) {
  const [formData, setFormData] = useState(department || {});

  useEffect(() => {
    if (department) {
      setFormData(department);
    }
  }, [department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
    alert('Department information updated successfully!');
    onClose();
  };

  if (!isOpen || !department) return null;

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
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            Edit Department Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Department Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Department Code
            </label>
            <input
              type="text"
              name="code"
              value={formData.code || ''}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Head of Department
            </label>
            <input
              type="text"
              name="head"
              value={formData.head || ''}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location || ''}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows="3"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
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
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#1e4618'}
            onMouseLeave={(e) => e.target.style.background = '#276221'}
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Department Modal
function AddDepartmentModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    head: '',
    totalFaculty: 0,
    totalStudents: 0,
    courses: 0,
    email: '',
    phone: '',
    location: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name.includes('total') || name === 'courses' ? (value === '' ? '' : Number(value)) : value 
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code) {
      alert('Please fill in all required fields');
      return;
    }
    
    const newDept = {
      id: Date.now(),
      ...formData,
      totalFaculty: formData.totalFaculty === '' ? 0 : Number(formData.totalFaculty),
      totalStudents: formData.totalStudents === '' ? 0 : Number(formData.totalStudents),
      courses: formData.courses === '' ? 0 : Number(formData.courses)
    };
    
    onSave(newDept);
    setFormData({
      name: '',
      code: '',
      head: '',
      totalFaculty: 0,
      totalStudents: 0,
      courses: 0,
      email: '',
      phone: '',
      location: '',
      description: ''
    });
    alert('Department added successfully!');
    onClose();
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
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            Add New Department
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Department Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Computer Science & Engineering"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Department Code *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g., CSE"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Head of Department
            </label>
            <input
              type="text"
              name="head"
              value={formData.head}
              onChange={handleChange}
              placeholder="e.g., Prof. Name"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="dept@mit.edu"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91-9876543210"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Building A, Floor 3"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Faculty
            </label>
            <input
              type="number"
              name="totalFaculty"
              value={formData.totalFaculty}
              onChange={handleChange}
              min="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Students
            </label>
            <input
              type="number"
              name="totalStudents"
              value={formData.totalStudents}
              onChange={handleChange}
              min="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Courses
            </label>
            <input
              type="number"
              name="courses"
              value={formData.courses}
              onChange={handleChange}
              min="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Brief description of the department"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
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
              background: '#06b6d4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#3d8b30'}
            onMouseLeave={(e) => e.target.style.background = '#06b6d4'}
          >
            <Save size={16} />
            Add Department
          </button>
        </div>
      </div>
    </div>
  );
}

// Share Department Modal
function ShareDepartmentModal({ isOpen, onClose, departmentName }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/department/${departmentName}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareEmail = () => {
    const subject = `Department Information - ${departmentName}`;
    const body = `Check out this department information: ${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            Share Department
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
            Share Link
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '6px'
          }}>
            <input
              type="text"
              value={shareUrl}
              readOnly
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                color: '#374151'
              }}
            />
            <button
              onClick={handleCopyLink}
              style={{
                padding: '6px 10px',
                background: '#276221',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleShareEmail}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e5e7eb';
              e.target.style.borderColor = '#c4b5fd';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f3f4f6';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            📧 Share via Email
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FacultyDepartmentPage() {
  const userData = getUserData();
  const userDept = userData?.departmentId || userData?.department || '';
  
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    // Simulate fetching departments
    setTimeout(() => {
      setDepartments(mockDepartments);
      setLoading(false);
      
      // Try to find user's department first, otherwise default to first
      const userDeptMatch = mockDepartments.find(d => 
        d.code === userDept || 
        d.name === userDept || 
        (userDept && d.name.toLowerCase().includes(userDept.toLowerCase()))
      );
      
      if (userDeptMatch) {
        setSelectedDept(userDeptMatch);
      } else if (mockDepartments.length > 0) {
        setSelectedDept(mockDepartments[0]);
      }
    }, 500);
  }, [userDept]);

  const handleEditSave = (updatedData) => {
    setSelectedDept(updatedData);
    setDepartments(departments.map(d => d.id === updatedData.id ? updatedData : d));
  };

  const handleAddDepartment = (newDept) => {
    setDepartments([...departments, newDept]);
    setSelectedDept(newDept);
  };

  const stats = {
    totalDepts: departments.length,
    totalFacultyAcross: departments.reduce((sum, d) => sum + d.totalFaculty, 0),
    totalStudentsAcross: departments.reduce((sum, d) => sum + d.totalStudents, 0),
    totalCourses: departments.reduce((sum, d) => sum + d.courses, 0)
  };

  return (
    <Layout title="Departments">
      <div style={{ paddingBottom: '40px' }}>
        {/* Action Button */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
              onClick={() => setIsAddOpen(true)}
              style={{
                padding: '10px 20px',
                background: '#06b6d4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#3d8b30'}
              onMouseLeave={(e) => e.target.style.background = '#06b6d4'}
            >
              + Add Department
            </button>
        </div>

        {/* Stats Grid - Department Statistics */}
        <KpiGrid>
          <KpiCard
            icon="domain"
            label="Departments"
            value={stats.totalDepts.toString()}
            colorScheme="green"
          />
          <KpiCard
            icon="person"
            label="Total Faculty"
            value={stats.totalFacultyAcross.toString()}
            colorScheme="green"
          />
          <KpiCard
            icon="group"
            label="Total Students"
            value={stats.totalStudentsAcross.toString()}
            colorScheme="emerald"
          />
          <KpiCard
            icon="school"
            label="Total Courses"
            value={stats.totalCourses.toString()}
            colorScheme="emerald"
          />
        </KpiGrid>

        {/* Department List and Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '24px'
        }}>
          {/* Department Sidebar List */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            maxHeight: '600px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              Departments
            </div>
            <div style={{ overflow: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>
                  Loading...
                </div>
              ) : (
                departments.map((dept) => {
                  const isUserDept = dept.code === userDept || dept.name === userDept;
                  return (
                    <button
                      key={dept.id}
                      onClick={() => setSelectedDept(dept)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: selectedDept?.id === dept.id ? '#eff6ff' : 'transparent',
                        borderLeft: selectedDept?.id === dept.id ? '3px solid #276221' : '3px solid transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderBottom: '1px solid #f3f4f6',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedDept?.id !== dept.id) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedDept?.id !== dept.id) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: selectedDept?.id === dept.id ? '#276221' : '#1f2937', marginBottom: '2px' }}>
                          {dept.code}
                        </div>
                        {isUserDept && (
                          <span style={{ 
                            fontSize: '9px', 
                            background: '#dcfce7', 
                            color: '#166534', 
                            padding: '2px 6px', 
                            borderRadius: '10px',
                            fontWeight: '700'
                          }}>YOUR DEPT</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.2' }}>
                        {dept.name.split(' & ')[0]}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Department Details */}
          {selectedDept && (
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {/* Header */}
              <div style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#276221', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      {selectedDept.code}
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                      {selectedDept.name}
                    </h2>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setIsEditOpen(true)}
                      style={{
                        padding: '8px 16px',
                        background: '#f5f3ff',
                        color: '#7c3aed',
                        border: '1px solid #ddd6fe',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ede9fe';
                        e.currentTarget.style.borderColor = '#c4b5fd';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f5f3ff';
                        e.currentTarget.style.borderColor = '#ddd6fe';
                      }}
                      title="Edit department details"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button 
                      onClick={() => setIsShareOpen(true)}
                      style={{
                        padding: '8px 16px',
                        background: '#276221',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#1e4618'}
                      onMouseLeave={(e) => e.target.style.background = '#276221'}
                      title="Share department information"
                    >
                      <Share2 size={14} />
                      Share
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  {selectedDept.description}
                </p>
              </div>

              {/* Stats Grid for Selected Dept */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Faculty Members
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#15803d' }}>
                    {selectedDept.totalFaculty}
                  </div>
                </div>
                <div style={{
                  background: '#fdf2f8',
                  border: '1px solid #fbcfe8',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Students
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#be185d' }}>
                    {selectedDept.totalStudents}
                  </div>
                </div>
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#276221', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Courses Offered
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e4618' }}>
                    {selectedDept.courses}
                  </div>
                </div>
                <div style={{
                  background: '#ecf5ff',
                  border: '1px solid #a5f3fc',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#3d8b30', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Head of Department
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1', lineHeight: '1.4' }}>
                    {selectedDept.head}
                  </div>
                </div>
              </div>

              {/* Contact & Location */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px', margin: '0 0 12px 0' }}>
                  Contact Information
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <Mail size={18} style={{ color: '#276221', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '2px' }}>Email</div>
                      <a href={`mailto:${selectedDept.email}`} style={{ fontSize: '14px', color: '#276221', textDecoration: 'none' }}>
                        {selectedDept.email}
                      </a>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#276221', marginTop: '2px', flexShrink: 0, fontWeight: '600' }}>📞</span>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '2px' }}>Phone</div>
                      <a href={`tel:${selectedDept.phone}`} style={{ fontSize: '14px', color: '#276221', textDecoration: 'none' }}>
                        {selectedDept.phone}
                      </a>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', gridColumn: '1 / -1' }}>
                    <MapPin size={18} style={{ color: '#276221', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '2px' }}>Location</div>
                      <div style={{ fontSize: '14px', color: '#374151' }}>{selectedDept.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <AddDepartmentModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSave={handleAddDepartment}
        />

        <EditDepartmentModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          department={selectedDept}
          onSave={handleEditSave}
        />

        <ShareDepartmentModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          departmentName={selectedDept?.name || 'Department'}
        />
      </div>
    </Layout>
  );
}
