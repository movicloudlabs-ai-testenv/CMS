import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { buildApiUrl } from '../api/apiBase';
import { settingsApi } from '../api/settingsApi';

export default function EditStudentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', gender: '', dob: '',
    department: '', year: '', semester: '', section: '',
    address: '', bloodGroup: '', status: 'Active',
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await settingsApi.getDepartments();
        setDepartments(data || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await fetch(buildApiUrl(`/students/${encodeURIComponent(id)}`));
      if (!res.ok) throw new Error('Student not found');
      const data = await res.json();
      setFormData({
        name: data.name || data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        gender: data.gender || '',
        dob: data.dateOfBirth || data.dob || '',
        department: data.department || data.department_id || '',
        year: data.year?.toString() || '1',
        semester: data.semester?.toString() || '1',
        section: data.section || 'A',
        address: data.address || '',
        bloodGroup: data.bloodGroup || data.blood_group || '',
        status: data.status || 'Active',
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching student:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert('Name is required'); return; }
    if (!formData.email.trim()) { alert('Email is required'); return; }

    setSaving(true);
    try {
      const res = await fetch(buildApiUrl(`/students/${encodeURIComponent(id)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          dateOfBirth: formData.dob,
          department: formData.department,
          year: parseInt(formData.year) || 1,
          semester: parseInt(formData.semester) || 1,
          section: formData.section,
          address: formData.address,
          bloodGroup: formData.bloodGroup,
          status: formData.status,
        }),
      });
      if (!res.ok) throw new Error('Failed to update student');
      alert('Student updated successfully!');
      navigate('/students');
    } catch (err) {
      console.error('Error updating student:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Edit Student">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col items-center justify-center h-64 gap-4 animate-pulse">
              <div className="w-12 h-12 bg-slate-200 rounded-full" />
              <div className="w-48 h-4 bg-slate-200 rounded" />
              <div className="w-32 h-3 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Edit Student">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <span className="material-symbols-outlined text-red-400 text-5xl mb-4">error</span>
            <h3 className="text-lg font-bold text-red-900">Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button onClick={() => navigate('/students')} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all">
              Back to Students
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Student">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#276221]/10 rounded-lg">
              <span className="material-symbols-outlined text-lg text-[#276221]">edit</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Edit Student</h1>
              <p className="text-xs text-gray-600 mt-0.5">Update student information for {formData.name}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/students')}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Full Name <span className="text-red-500">*</span></label>
                  <input name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#276221]/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} maxLength="10" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white">
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white">
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <label className="text-xs font-semibold text-gray-700">Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-gray-50/30 resize-none" />
              </div>
            </div>

            {/* Academic Info */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Department</label>
                  <select name="department" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white">
                    {(departments || []).map(d => <option key={d.id || d.code} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Year</label>
                  <select name="year" value={formData.year} onChange={handleChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white">
                    <option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Section</label>
                  <select name="section" value={formData.section} onChange={handleChange} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white">
                    {['A','B','C','D'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Status</h3>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full max-w-xs px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 bg-white">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button type="button" onClick={() => navigate('/students')} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium">
                ← Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-[#276221] text-white text-sm rounded-lg hover:bg-[#1e4618] disabled:opacity-50 transition-colors font-medium">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
