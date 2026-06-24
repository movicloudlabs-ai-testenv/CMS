import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AddStudentModal from '../components/AddStudentModal';
import { TableSkeleton } from '../components/common';
import { getUserSession, updateUserData } from '../auth/sessionController';
import { 
  ArrowLeft, User, BarChart2,
  Mail, Phone, MapPin, Calendar, Users, FolderOpen
} from 'lucide-react';
import { API_BASE } from '../api/apiBase';
import '../styles.css';

const API_BASE_URL = API_BASE;
const profileTabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'academics', label: 'Academics', icon: BarChart2 },
  { id: 'fees', label: 'Fees', icon: Calendar }
];

export default function StudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchStudentDetails();
    } else {
      setError('Invalid student ID');
      setLoading(false);
    }
  }, [id]);

  const fetchStudentDetails = async () => {
    // Validate ID is not undefined
    if (!id || id === 'undefined') {
      setError('Invalid student ID');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Student not found');
        throw new Error('Failed to fetch student details');
      }
      const data = await response.json();
      setStudent(data);
      setError(null);
    } catch (error) {
      console.error(error);
      setStudent(null);
      setError(error.message || 'Failed to fetch student details');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/students/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: base64Data })
        });
        if (!response.ok) {
          throw new Error('Failed to update profile photo');
        }
        await fetchStudentDetails();
        const session = getUserSession();
        if (session && (session.userId === id || session.userId === id.toString())) {
          updateUserData({ avatar: base64Data });
        }
        alert('Profile photo updated successfully!');
      } catch (err) {
        console.error(err);
        alert(err.message || 'Failed to upload photo');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async (e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove your profile photo?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: null })
      });
      if (!response.ok) {
        throw new Error('Failed to remove profile photo');
      }
      await fetchStudentDetails();
      const session = getUserSession();
      if (session && (session.userId === id || session.userId === id.toString())) {
        updateUserData({ avatar: null });
      }
      alert('Profile photo removed successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to remove photo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Loading Student Profile">
        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
          <div className="w-24 h-24 bg-slate-100 rounded-xl mb-6" />
          <div className="w-48 h-4 bg-slate-100 rounded mb-2" />
          <div className="w-32 h-3 bg-slate-50 rounded" />
        </div>
      </Layout>
    );
  }

  if (error || !student) {
    return (
      <Layout title="Student Not Found">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">{error === 'Student not found' ? 'person_off' : 'cloud_off'}</span>
          <h2 className="text-xl font-bold text-slate-700 mb-2">{error === 'Student not found' ? 'Student Not Found' : 'Connection Error'}</h2>
          <p className="text-sm text-slate-500 mb-6">
            {error === 'Student not found' ? `No student record exists with ID "${id}"` : error}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStudentDetails}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/students')}
              className="px-5 py-2.5 bg-[#276221] text-white rounded-lg text-sm font-semibold hover:bg-[#1e4618] transition-all"
            >
              Back to Students
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusStyles = {
    active: 'bg-green-50 text-green-700',
    Active: 'bg-green-50 text-green-700',
    inactive: 'bg-red-50 text-red-700',
    Inactive: 'bg-red-50 text-red-700',
    graduated: 'bg-blue-50 text-blue-700',
    Graduated: 'bg-blue-50 text-blue-700',
  };

  return (
    <Layout title="Student Profile">
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/students')}
            className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#276221] hover:border-[#276221] transition-all group uppercase tracking-wider"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Students</span>
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-5 py-2.5 bg-[#276221] text-white rounded-lg text-sm font-semibold hover:bg-[#276221]/90 transition-all"
          >
            Edit Profile
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm mb-8 relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute top-1/2 -right-12 w-32 h-32 bg-green-50/30 rounded-full blur-3xl" />

          <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <div 
                className="w-28 h-28 rounded-xl bg-gradient-to-br from-[#276221] to-[#60a5fa] p-1 shadow-xl cursor-pointer relative group overflow-hidden"
              >
                <img
                  src={student.avatar || `https://ui-avatars.com/api/?name=${student.name}&background=1162d4&color=fff&size=128`}
                  alt={student.name}
                  className="w-full h-full rounded-lg object-cover"
                  onClick={() => document.getElementById('student-profile-photo-upload').click()}
                />
                <div 
                  onClick={() => document.getElementById('student-profile-photo-upload').click()}
                  className="absolute inset-0 bg-[#276221]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 rounded-lg"
                >
                  <span className="text-white text-[10px] font-bold text-center tracking-wider px-1">UPLOAD PHOTO</span>
                </div>
                {student.avatar && !student.avatar.startsWith('https://ui-avatars.com') && (
                  <button 
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute top-1.5 right-1.5 z-20 p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border border-white/10"
                    title="Remove profile photo"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
              <input 
                id="student-profile-photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />

              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{student.name}</h1>
                  <span className="px-2.5 py-0.5 bg-green-50 text-[#276221] border border-green-100 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 sm:mt-0">
                    {student.rollNumber || student.id}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2">
                  <span className="text-base font-semibold text-slate-600">
                    {student.semester ? `Semester ${student.semester}` : 'Semester 1'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
                  <span className="text-base font-semibold text-slate-400">{student.departmentId || student.department}</span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusStyles[student.status] || 'bg-slate-50 text-slate-700'}`}>
                    {student.status || 'Active'}
                  </span>
                  {student.cgpa && (
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      CGPA: {student.cgpa}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {(() => {
          const session = getUserSession();
          const showDocumentsTab = session && (session.role === 'admin' || session.userId === id || session.userId?.toString() === id?.toString());
          const dynamicTabs = [...profileTabs];
          if (showDocumentsTab) {
            dynamicTabs.push({ id: 'documents', label: 'Documents', icon: FolderOpen });
          }

          return (
            <div className="flex items-center gap-8 border-b border-slate-200 mb-8 px-4 overflow-x-auto">
              {dynamicTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-sm font-semibold transition-all relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-[#276221]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <tab.icon size={16} />
                    {tab.label}
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#276221] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          );
        })()}

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[#276221] text-[20px]">contact_page</span>
                  Contact Info
                </h3>

                <div className="space-y-5">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <Mail size={18} className="text-slate-400" />
                    <span>{student.email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <Phone size={18} className="text-slate-400" />
                    <span>{student.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <MapPin size={18} className="text-slate-400" />
                    <span>{student.address || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <Calendar size={18} className="text-slate-400" />
                    <span>DOB: {student.dob || 'Not provided'}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 my-6" />

                <h3 className="text-sm font-semibold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-slate-400" />
                  Family Details
                </h3>

                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Guardian</p>
                    <p className="text-sm font-medium text-slate-800">{student.guardian || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Guardian Phone</p>
                    <p className="text-sm font-medium text-slate-800">{student.guardianPhone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800 mb-6 uppercase tracking-wider">Academic Info</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Year</p>
                      <p className="text-lg font-bold text-slate-900">{student.year || 1}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Semester</p>
                      <p className="text-lg font-bold text-slate-900">{student.semester || 1}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">CGPA</p>
                      <p className="text-lg font-bold text-slate-900">{student.cgpa || '0.0'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Attendance</p>
                      <p className="text-lg font-bold text-slate-900">{student.attendancePct || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Section</p>
                      <p className="text-lg font-bold text-slate-900">{student.section || 'A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Enroll Date</p>
                      <p className="text-sm font-medium text-slate-700">{student.enrollDate || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academics' && (() => {
            const filteredSubjects = (student.subjects || []).filter(sub => {
              const matchesYear = yearFilter === 'All' || sub.year === yearFilter;
              const matchesSem = semesterFilter === 'All' || sub.semester?.toString() === semesterFilter;
              return matchesYear && matchesSem;
            });

            // Calculate GPA/CGPA
            const activePassed = filteredSubjects.filter(s => s.grade && s.grade !== 'Pending' && s.grade !== 'F');
            const activeTotalObtained = activePassed.reduce((acc, s) => acc + (s.total || 0), 0);
            const activeTotalMax = activePassed.length * 100;
            const dynamicGPA = activeTotalMax > 0 ? ((activeTotalObtained / activeTotalMax) * 10).toFixed(2) : '0.00';

            const allPassed = (student.subjects || []).filter(s => s.grade && s.grade !== 'Pending' && s.grade !== 'F');
            const allTotalObtained = allPassed.reduce((acc, s) => acc + (s.total || 0), 0);
            const allTotalMax = allPassed.length * 100;
            const globalCGPA = allTotalMax > 0 ? ((allTotalObtained / allTotalMax) * 10).toFixed(2) : '0.00';

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-[#276221] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">military_tech</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall CGPA</p>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">{globalCGPA}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-[#276221] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">analytics</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtered GPA</p>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">{dynamicGPA}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-[#276221] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">menu_book</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courses</p>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">{filteredSubjects.length}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-[#276221] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">verified</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passed Credits</p>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">{activePassed.length * 4} Credits</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Subject Performance</h3>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Academic history and marks</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select 
                        value={yearFilter}
                        onChange={(e) => { setYearFilter(e.target.value); setSemesterFilter('All'); }}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 uppercase tracking-wider outline-none cursor-pointer"
                      >
                        <option value="All">All Years</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>

                      <select 
                        value={semesterFilter}
                        onChange={(e) => setSemesterFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 uppercase tracking-wider outline-none cursor-pointer"
                      >
                        <option value="All">All Semesters</option>
                        {(() => {
                          let sems = [1, 2, 3, 4, 5, 6, 7, 8];
                          if (yearFilter === '1st Year') sems = [1, 2];
                          else if (yearFilter === '2nd Year') sems = [3, 4];
                          else if (yearFilter === '3rd Year') sems = [5, 6];
                          else if (yearFilter === '4th Year') sems = [7, 8];
                          
                          return sems.map(s => (
                            <option key={s} value={s.toString()}>Semester {s}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Subject Code</th>
                          <th className="px-6 py-4">Subject Name</th>
                          <th className="px-6 py-4">Year</th>
                          <th className="px-6 py-4">Semester</th>
                          <th className="px-6 py-4">Grade</th>
                          <th className="px-6 py-4">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="p-0">
                              <TableSkeleton cols={6} rows={5} />
                            </td>
                          </tr>
                        ) : filteredSubjects.length > 0 ? (
                          filteredSubjects.map((subject, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-sm font-semibold text-slate-800">{subject.code}</td>
                              <td className="px-6 py-4 text-sm text-slate-600">{subject.name}</td>
                              <td className="px-6 py-4 text-sm text-slate-500">{subject.year || '—'}</td>
                              <td className="px-6 py-4 text-sm text-slate-500">{subject.semester ? `Semester ${subject.semester}` : '—'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  subject.grade === 'A+' || subject.grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                                  subject.grade === 'B+' || subject.grade === 'B' ? 'bg-green-50 text-green-700' :
                                  subject.grade === 'F' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'
                                }`}>
                                  {subject.grade || '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-700">{subject.total !== undefined ? subject.total : '—'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                              No subjects found matching the selection
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === 'fees' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Fee Status</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Fee Type</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Paid</th>
                      <th className="px-6 py-4">Due</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <TableSkeleton cols={5} rows={4} />
                        </td>
                      </tr>
                    ) : student.fees && student.fees.length > 0 ? (
                      student.fees.map((fee, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-slate-800">{fee.type}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">₹{fee.amount}</td>
                          <td className="px-6 py-4 text-sm text-green-700 font-medium">₹{fee.paid}</td>
                          <td className="px-6 py-4 text-sm text-red-700 font-medium">₹{fee.due}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                              fee.status === 'Paid' ? 'bg-green-50 text-green-700' :
                              fee.status === 'Partial' ? 'bg-orange-50 text-orange-700' :
                              'bg-red-50 text-red-700'
                            }`}>
                              {fee.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          No fees recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'documents' && <DocumentsTab student={student} />}
        </div>
      </div>

      {isEditModalOpen && (
        <AddStudentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editStudent={student}
          onSuccess={() => {
            fetchStudentDetails();
            setIsEditModalOpen(false);
          }}
        />
      )}
    </Layout>
  );
}

function DocumentsTab({ student }) {
  const docs = student.documents || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2">
        <FolderOpen size={18} className="text-[#276221]" />
        Uploaded Documents
      </h3>
      {docs.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">folder_open</span>
          <p className="text-sm font-medium">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((doc, idx) => {
            const hasData = !!(doc.data?.data || (typeof doc.data === 'string' ? doc.data : null) || doc.file_url || doc.fileUrl);
            const fileName = doc.data?.name || doc.name || 'Document';
            const fileSize = doc.data?.size ? `${(doc.data.size / 1024 / 1024).toFixed(2)} MB` : (doc.size || 'N/A');
            return (
              <div key={doc.id || idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-[#276221]/30 transition-all hover:bg-white hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 text-[#276221] rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">
                      {doc.name?.toLowerCase().includes('photo') ? 'image' : 'picture_as_pdf'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 leading-tight">{doc.name || 'Uploaded Document'}</h4>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tight">
                      {fileName} • {fileSize}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const fileData = doc.data?.data || (typeof doc.data === 'string' ? doc.data : null) || doc.file_url || doc.fileUrl;
                      if (!fileData) {
                        alert("Document data is not available (demo seed document).");
                        return;
                      }
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(
                          `<iframe src="${fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                        );
                      }
                    }}
                    disabled={!hasData}
                    className={`p-2 rounded-lg transition-all ${
                      hasData 
                        ? 'text-slate-400 hover:text-[#276221] hover:bg-green-50' 
                        : 'text-slate-200 cursor-not-allowed'
                    }`}
                    title="View Document"
                  >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                  <button
                    onClick={() => {
                      const fileData = doc.data?.data || (typeof doc.data === 'string' ? doc.data : null) || doc.file_url || doc.fileUrl;
                      if (!fileData) {
                        alert("Document data is not available (demo seed document).");
                        return;
                      }
                      const link = document.createElement('a');
                      link.href = fileData;
                      link.download = fileName;
                      link.click();
                    }}
                    disabled={!hasData}
                    className={`p-2 rounded-lg transition-all ${
                      hasData 
                        ? 'text-slate-400 hover:text-[#276221] hover:bg-green-50' 
                        : 'text-slate-200 cursor-not-allowed'
                    }`}
                    title="Download Document"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
