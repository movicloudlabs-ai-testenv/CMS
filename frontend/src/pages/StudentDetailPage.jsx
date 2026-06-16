import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { TableSkeleton } from '../components/common'
import { buildApiUrl } from '../api/apiBase'
import KpiCard from '../components/KpiCard'
import KpiGrid from '../components/KpiGrid'

// ─── Tab Components ──────────────────────────────────────────────

function OverviewTab({ student }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Core Info */}
      <div className="lg:col-span-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#276221] text-[20px]">contact_page</span>
              Contact Information
            </h3>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                <p className="text-sm font-medium text-slate-700">{student.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Personal Email</p>
                <p className="text-sm font-medium text-slate-700">{student.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Permanent Address</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{student.address}</p>
              </div>
            </div>
          </div>

          {/* Family Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#276221] text-[20px]">family_restroom</span>
              Family Details
            </h3>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Father's Name</p>
                <p className="text-sm font-medium text-slate-700">{student.guardian}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mother's Name</p>
                <p className="text-sm font-medium text-slate-700">Sunita Devi</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Guardian Contact</p>
                <p className="text-sm font-medium text-slate-700">{student.guardianPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Info Strip */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[#276221] text-[20px]">menu_book</span>
            Academic Info
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#276221] shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">event_available</span>
               </div>
               <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admission Date</p>
                  <p className="text-sm font-medium text-slate-700">{new Date(student.enrollDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
               </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">bloodtype</span>
               </div>
               <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Group</p>
                  <p className="text-sm font-medium text-slate-700">O+</p>
               </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-green-500 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
               </div>
               <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance</p>
                  <p className="text-sm font-medium text-slate-700">{student.attendancePct}%</p>
               </div>
            </div>
          </div>
        </div>

        {/* Technical Skills */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-6 uppercase tracking-wider">Technical Skills</h3>
          <div className="flex flex-wrap gap-2">
            {['Python', 'Java', 'SQL', 'React JS', 'Node.js'].map((skill, idx) => (
              <span key={skill} className={`px-4 py-2 rounded-lg text-xs font-semibold ${idx === 3 ? 'bg-[#276221]/10 text-[#276221]' : 'bg-slate-100 text-slate-600'}`}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Trends & Status */}
      <div className="lg:col-span-4 space-y-8">
        {/* GPA Trend Mock */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider text-slate-900 leading-none">GPA Trend</h3>
            <span className="px-2 py-0.5 bg-green-50 text-[#276221] rounded text-[9px] font-bold uppercase tracking-wider">B+ Average</span>
          </div>
          <div className="flex items-end justify-between h-24 gap-2 mb-4">
            {[35, 45, 100, 40].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className={`w-full rounded-md transition-all duration-1000 ${i === 2 ? 'bg-[#276221]' : 'bg-[#276221]/20'}`} 
                  style={{ height: `${h}%` }} 
                />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">SEM{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Calendar Mock */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Attendance: June 2024</h3>
              <div className="flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-green-500" />
                 <div className="w-2 h-2 rounded-full bg-red-400" />
              </div>
           </div>
           <div className="grid grid-cols-7 gap-2">
              {['M','T','W','T','F','S','S'].map(d => (
                <div key={d} className="text-center text-[9px] font-bold text-slate-300 py-1">{d}</div>
              ))}
              {Array.from({length: 21}).map((_, i) => (
                <div key={i} className={`aspect-square rounded-md border border-slate-50 transition-colors cursor-pointer ${
                  i === 15 ? 'bg-red-400' : 
                  i % 3 === 0 ? 'bg-green-100' : 
                  i % 2 === 0 ? 'bg-green-400' : 'bg-green-50'
                }`} />
              ))}
           </div>
        </div>

        {/* Academic Alert */}
        <div className="bg-[#276221]/5 border border-[#276221]/10 rounded-xl p-8 flex gap-4">
           <div className="w-10 h-10 bg-[#276221] rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#276221]/10">
              <span className="material-symbols-outlined text-[20px]">info</span>
           </div>
           <div>
              <p className="text-xs font-semibold text-[#276221] uppercase tracking-wider mb-1">Academic Alert</p>
              <p className="text-xs font-medium text-[#276221]/80 leading-relaxed">
                {student.name} has successfully completed 85% of his credit requirements for the current year.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}


function SubjectRow({ sub, studentId, onUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (field, value) => {
    setIsUpdating(true);
    await onUpdate(sub.code, field, value);
    setIsUpdating(false);
  };

  return (
    <tr className="hover:bg-slate-50/80 transition-all group">
      <td className="px-8 py-5 text-sm font-medium text-slate-500 italic">
        Sem {sub.semester}
      </td>
      <td className="px-4 py-5 text-sm font-medium text-slate-400 uppercase tracking-tight">{sub.code}</td>
      <td className="px-4 py-5 text-sm font-semibold text-slate-800">{sub.name}</td>
      <td className="px-4 py-5 text-sm font-medium text-slate-500">4.0</td>
      <td className="px-4 py-5">
        <select 
          value={sub.grade}
          onChange={(e) => handleChange('grade', e.target.value)}
          disabled={isUpdating}
          className="bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer hover:text-[#276221] transition-colors"
        >
          {['A+','A','B+','B','C+','C','D','F','Pending'].map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </td>
      <td className="px-8 py-5 text-center">
        <select 
          value={sub.status || (sub.grade === 'Pending' ? 'In Progress' : 'Passed')}
          onChange={(e) => handleChange('status', e.target.value)}
          disabled={isUpdating}
          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm outline-none cursor-pointer transition-all ${
            sub.status === 'Passed' ? 'bg-green-50 text-green-600 border border-green-100' :
            sub.status === 'In Progress' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
            'bg-slate-50 text-slate-500 border border-slate-100'
          }`}
        >
          {['Passed', 'Failed', 'In Progress'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
    </tr>
  );
}

function AddAcademicRecordModal({ isOpen, onClose, onSave, studentId }) {
  const [formData, setFormData] = useState({
    semester: '',
    code: '',
    name: '',
    credits: '4.0',
    grade: 'A',
    status: 'Passed'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
       <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <h3 className="text-lg font-bold text-slate-800">Add Academic Record</h3>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
             </button>
          </div>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester</label>
                   <select 
                     value={formData.semester} 
                     onChange={e => setFormData({...formData, semester: e.target.value})}
                     className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#276221] transition-all font-medium"
                   >
                     <option value="">Select</option>
                     {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>Sem {s}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credits</label>
                   <input 
                     type="text" 
                     value={formData.credits} 
                     onChange={e => setFormData({...formData, credits: e.target.value})}
                     className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#276221] transition-all font-medium"
                   />
                </div>
             </div>
             
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Code</label>
                <input 
                  type="text" 
                  placeholder="e.g., CS105"
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#276221] transition-all font-medium"
                />
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Database Management"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#276221] transition-all font-medium"
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</label>
                   <select 
                     value={formData.grade} 
                     onChange={e => setFormData({...formData, grade: e.target.value})}
                     className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#276221] transition-all font-medium"
                   >
                     {['A+','A','B+','B','C+','C','D','F','Pending'].map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                   <select 
                     value={formData.status} 
                     onChange={e => setFormData({...formData, status: e.target.value})}
                     className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#276221] transition-all font-medium"
                   >
                     {['Passed','Failed','In Progress'].map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
             </div>
          </div>
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
             <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
             <button 
               onClick={async () => {
                 try {
                   const res = await fetch(buildApiUrl(`/students/${studentId}/subjects`), {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                       ...formData,
                       semester: parseInt(formData.semester),
                       credits: parseFloat(formData.credits) || 4.0,
                       total: 0 // New records start at 0
                     })
                   });
                   if (!res.ok) throw new Error('Failed to save record');
                   const savedRecord = await res.json();
                   onSave(savedRecord);
                 } catch (err) {
                   alert('Error: ' + err.message);
                 }
               }}
               className="flex-1 px-4 py-3 bg-[#276221] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-[#1e4618] transition-all shadow-lg shadow-green-200 active:scale-95"
             >
               Add Record
             </button>
          </div>
       </div>
    </div>
  )
}

function AcademicsTab({ student, onRefresh }) {
  const [semesterFilter, setSemesterFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false)
  const itemsPerPage = 8

  const allSubjects = student.subjects || []
  const filteredSubjects = semesterFilter === 'All' 
    ? allSubjects 
    : allSubjects.filter(s => s.semester?.toString() === semesterFilter)

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage)
  const currentSubjects = filteredSubjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const passedSubjects = allSubjects.filter(s => s.grade !== 'Pending')
  const totalObtained = passedSubjects.reduce((s, sub) => s + (sub.total || 0), 0)
  const totalMax = passedSubjects.length * 100
  const calcCGPA = totalMax > 0 ? ((totalObtained / totalMax) * 10).toFixed(2) : '0.00'

  const handleUpdateSubject = async (subjectCode, field, value) => {
    const updatedSubjects = allSubjects.map(s => 
      s.code === subjectCode ? { ...s, [field]: value } : s
    );
    try {
      const res = await fetch(buildApiUrl(`/students/${student.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects: updatedSubjects })
      });
      if (!res.ok) throw new Error('Failed to update student');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating subject:', err);
      alert('Failed to update: ' + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Grades Table */}
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-[#276221] rounded-xl flex items-center justify-center shadow-inner">
                 <span className="material-symbols-outlined text-[24px]">school</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Semester Outcomes</h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Official Academic Record</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsAddRecordModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#276221] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#1e4618] transition-all shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add Record
              </button>
              <button 
                onClick={() => alert('Generating Provisional Transcript...')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] text-[#276221]">description</span>
                Download Transcript
              </button>
              <select 
                value={semesterFilter}
                onChange={(e) => {setSemesterFilter(e.target.value); setCurrentPage(1);}}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider outline-none cursor-pointer"
              >
                <option value="All">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s.toString()}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                   <th className="px-8 py-4">Semester</th>
                   <th className="px-4 py-4">Subject Code</th>
                   <th className="px-4 py-4">Subject Name</th>
                   <th className="px-4 py-4">Credits</th>
                   <th className="px-4 py-4">Grade</th>
                   <th className="px-8 py-4 text-center">Status</th>
                 </tr>
               </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentSubjects.length > 0 ? currentSubjects.map(sub => (
                    <SubjectRow key={sub.code} sub={sub} studentId={student.id} onUpdate={handleUpdateSubject} />
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-8 py-10 text-center text-slate-400 text-sm font-medium italic">
                        No subjects found for this selection.
                      </td>
                    </tr>
                  )}
                </tbody>
             </table>
          </div>
          <div className="px-8 py-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
             <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
               Showing {filteredSubjects.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(filteredSubjects.length, currentPage * itemsPerPage)} of {filteredSubjects.length} subjects
             </p>
             <div className="flex items-center gap-1.5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className={`w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg transition-all ${currentPage === 1 ? 'text-slate-200' : 'text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                {Array.from({length: totalPages}).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-xs border transition-all ${currentPage === i + 1 ? 'bg-[#276221] border-[#276221] text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className={`w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg transition-all ${currentPage === totalPages || totalPages === 0 ? 'text-slate-200' : 'text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
             </div>
          </div>
        </div>

        <AddAcademicRecordModal 
          isOpen={isAddRecordModalOpen}
          onClose={() => setIsAddRecordModalOpen(false)}
          studentId={student.id}
          onSave={(newRecord) => {
            setIsAddRecordModalOpen(false);
            if (onRefresh) onRefresh();
            setSemesterFilter(newRecord.semester.toString());
          }}
        />
      </div>

      {/* Right Column - Charts & Awards */}
      <div className="lg:col-span-4 space-y-8">
        {/* Credits Overview Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-semibold text-slate-800 self-start uppercase tracking-wider mb-8">Credits Overview</h3>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" stroke="#e2e8f0" strokeWidth="12" fill="none" />
              <circle
                cx="60" cy="60" r="54"
                stroke="#276221" strokeWidth="12" fill="none"
                strokeLinecap="round"
                strokeDasharray={`${((passedSubjects.length * 4) / 145) * 339} ${339}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <p className="text-4xl font-bold text-slate-900 leading-none">{passedSubjects.length * 4}</p>
               <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">of 145 Earned</p>
            </div>
          </div>
          <div className="grid grid-cols-2 w-full gap-4 mt-8 border-t border-slate-100 pt-8">
             <div className="text-center">
                <p className="text-lg font-bold text-[#276221]">{calcCGPA}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Calculated CGPA</p>
             </div>
             <div className="text-center">
                <p className="text-lg font-bold text-slate-800">{student.department === 'Computer Science' ? 'CS Eng.' : student.department || 'N/A'}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Major</p>
             </div>
          </div>
        </div>

        {/* Academic Distinctions */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6">Academic Distinctions</h3>
           <div className="space-y-4">
              {[
                { title: "Dean's List - Sem 2", desc: "Top 5% of class performance", color: "bg-green-50 text-[#276221]", icon: "military_tech" },
                { title: "Smart Hackathon Runner-up", desc: "National Level Competition 2023", color: "bg-purple-50 text-purple-600", icon: "emoji_events" },
                { title: "Google Cloud Certification", desc: "Associate Cloud Engineer", color: "bg-slate-50 text-slate-600", icon: "verified" }
              ].map(item => (
                <div key={item.title} className="flex gap-4 p-4 rounded-xl border border-slate-50 hover:border-slate-100 transition-all hover:shadow-sm cursor-pointer group">
                   <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                   </div>
                   <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{item.title}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tight">{item.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}

function FeesTab({ student }) {
  const fees = student.fees || []
  const totalAmount = fees.reduce((s, f) => s + f.amount, 0)
  const totalPaid = fees.reduce((s, f) => s + f.paid, 0)
  const totalDue = fees.reduce((s, f) => s + f.due, 0)

  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Payment Ledger */}
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Fee Payment Ledger</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#276221] text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#276221]/90 transition-all shadow-sm">
               <span className="material-symbols-outlined text-[18px]">add</span>
               New Payment
            </button>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                   <th className="px-8 py-4">Transaction ID</th>
                   <th className="px-4 py-4">Fee Type</th>
                   <th className="px-4 py-4">Date</th>
                   <th className="px-4 py-4">Method</th>
                   <th className="px-4 py-4 text-right">Amount</th>
                   <th className="px-8 py-4 text-center">Status</th>
                 </tr>
               </thead>
                <tbody className="divide-y divide-slate-100">
                 {fees.map(f => (
                   <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-8 py-5 text-sm font-medium text-slate-400 group-hover:text-slate-600 transition-colors">#{f.id}</td>
                     <td className="px-4 py-5 text-sm font-medium text-slate-800">{f.type}</td>
                     <td className="px-4 py-5 text-sm font-medium text-slate-500">{f.date}</td>
                     <td className="px-4 py-5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">Online</span>
                     </td>
                     <td className="px-4 py-5 text-sm font-bold text-slate-900 text-right">{fmt(f.amount)}</td>
                     <td className="px-8 py-5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                           f.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                           {f.status}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* Payment History Notes */}
        <div className="bg-slate-50 rounded-xl p-8 border border-slate-100">
           <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Payment Remarks</h3>
           <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                 <div className="w-10 h-10 bg-green-50 text-[#276221] rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">sticky_note_2</span>
                 </div>
                 <p className="text-xs font-medium text-slate-500 leading-relaxed">
                   Next installment of ₹12,000 scheduled for July 15, 2024. Automated reminder has been sent to the guardian.
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Right Column - Balance & Summary */}
      <div className="lg:col-span-4 space-y-8">
        {/* Outstanding Balance Card */}
        <div className="bg-[#1e293b] rounded-xl p-10 text-white relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Outstanding</p>
           <h4 className="text-5xl font-bold mb-10 tracking-tighter">{fmt(totalDue)}</h4>
           
           <div className="space-y-6 pt-10 border-t border-white/10">
              <div className="flex items-center justify-between">
                 <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Fees</span>
                 <span className="text-sm font-bold">{fmt(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid Amount</span>
                 <span className="text-sm font-bold text-green-400">{fmt(totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Late Charges</span>
                 <span className="text-sm font-bold text-red-400">₹0.00</span>
              </div>
           </div>
           
           <button className="w-full mt-10 py-3 bg-[#276221] text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#276221]/90 transition-all">
              DOWNLOAD INVOICE (PDF)
           </button>
        </div>

        {/* Quick Payment Methods */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6">Payment Methods</h3>
           <div className="space-y-3">
              {['HDFC Bank Summary', 'Unified Payments (UPI)', 'Credit/Debit Cards'].map(method => (
                <div key={method} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#276221]/30 transition-all cursor-pointer group">
                   <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">{method}</span>
                   <span className="material-symbols-outlined text-slate-300 group-hover:text-[#276221] text-[18px]">chevron_right</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}

function DocumentsTab({ student }) {
  const docs = student.documents || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Category Cards and Helper */}
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6">File Categories</h3>
           <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Academic', count: 12, color: 'bg-green-50 text-[#276221]', icon: 'school' },
                { label: 'Identity', count: 4, color: 'bg-green-50 text-green-600', icon: 'badge' },
                { label: 'Fees', count: 8, color: 'bg-purple-50 text-purple-600', icon: 'receipt_long' },
                { label: 'Others', count: 2, color: 'bg-slate-50 text-slate-400', icon: 'folder_open' }
              ].map(cat => (
                <div key={cat.label} className="p-4 rounded-xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-[#276221]/20 transition-all cursor-pointer group">
                   <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                   </div>
                   <p className="text-xs font-semibold text-slate-900 mb-0.5">{cat.label}</p>
                   <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">{cat.count} Files</p>
                </div>
              ))}
           </div>
        </div>

        {/* Upload Dropzone Preview */}
        <div className="bg-[#276221]/5 border-2 border-dashed border-[#276221]/20 rounded-xl p-10 flex flex-col items-center text-center group cursor-pointer hover:bg-[#276221]/10 transition-all">
           <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-[#276221] shadow-xl shadow-[#276221]/10 mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
           </div>
           <h4 className="text-sm font-semibold text-[#276221] uppercase tracking-wider mb-2">Upload New Media</h4>
           <p className="text-[10px] font-medium text-[#276221]/60 uppercase tracking-tight">Drag & drop or browse files</p>
        </div>
      </div>

      {/* Right Column - Document List */}
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Document Storage</h3>
            <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-lg">
               <button className="px-3 py-1.5 bg-white text-[#276221] rounded-md text-[10px] font-semibold uppercase tracking-wider shadow-sm">Grid View</button>
               <button className="px-3 py-1.5 text-slate-400 rounded-md text-[10px] font-semibold uppercase tracking-wider">List View</button>
            </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                   <th className="px-8 py-4">Document Details</th>
                   <th className="px-4 py-4">Status</th>
                   <th className="px-4 py-4">Last Updated</th>
                   <th className="px-8 py-4 text-center">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {docs.map(doc => (
                   <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-[#276221]/10 group-hover:text-[#276221] transition-all">
                              <span className="material-symbols-outlined text-[20px]">{doc.type === 'pdf' ? 'picture_as_pdf' : 'description'}</span>
                           </div>
                           <div>
                              <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{doc.size}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                           <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Verified</span>
                        </div>
                     </td>
                     <td className="px-4 py-5 text-sm font-medium text-slate-500">
                        {new Date(doc.uploadDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                     </td>
                     <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                           <button className="p-2 text-slate-400 hover:text-[#276221] hover:bg-green-50 rounded-lg transition-all">
                              <span className="material-symbols-outlined text-[18px]">download</span>
                           </button>
                           <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                           </button>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Detail Page ────────────────────────────────────────────

const tabs = [
  { id: 'overview',  label: 'Overview',  icon: 'dashboard' },
  { id: 'academics', label: 'Academics', icon: 'school' },
  { id: 'fees',      label: 'Fees',      icon: 'payments' },
  { id: 'documents', label: 'Documents', icon: 'folder_open' },
]

export default function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshData = () => setRefreshKey(prev => prev + 1)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true)
        const res = await fetch(buildApiUrl(`/students/${encodeURIComponent(id)}`))
        if (!res.ok) {
          if (res.status === 404) throw new Error('Student not found')
          throw new Error('Failed to fetch student details')
        }
        const data = await res.json()
        setStudent(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching student:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchStudent()
  }, [id, refreshKey])

  if (loading) {
    return (
      <Layout title="Loading Student...">
        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
           <div className="w-24 h-24 bg-slate-100 rounded-xl mb-6" />
           <div className="w-48 h-4 bg-slate-100 rounded mb-2" />
           <div className="w-32 h-3 bg-slate-50 rounded" />
        </div>
      </Layout>
    )
  }

  if (error || !student) {
    return (
      <Layout title="Student Not Found">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">{error === 'Student not found' ? 'person_off' : 'cloud_off'}</span>
          <h2 className="text-xl font-bold text-slate-700 mb-2">{error === 'Student not found' ? 'Student Not Found' : 'Connection Error'}</h2>
          <p className="text-sm text-slate-500 mb-6">{error === 'Student not found' ? `No student record exists with ID "${id}"` : error}</p>
          <button
            onClick={() => navigate('/students')}
            className="px-5 py-2.5 bg-[#276221] text-white rounded-lg text-sm font-semibold hover:bg-[#1e4618] transition-all"
          >
            Back to Students
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Student Profile">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/students')}
          className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#276221] hover:border-[#276221] transition-all group uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span>Back to Students</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg">
             <div className="w-1.5 h-1.5 bg-[#276221] rounded-full animate-pulse" />
             <span className="text-[10px] font-bold text-[#276221] uppercase tracking-wider">Active Session</span>
          </div>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="text-right hidden md:block">
              <span className="block text-sm font-bold text-slate-900 leading-none">Admin Control</span>
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">Super User</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm mb-8 relative overflow-hidden group">
        {/* Abstract background element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-1000" />
        <div className="absolute top-1/2 -right-12 w-32 h-32 bg-green-50/30 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-xl p-1 bg-gradient-to-br from-[#276221] to-[#60a5fa] shadow-xl">
                <img
                  src={student.avatar || `https://ui-avatars.com/api/?name=${student.name}&background=1162d4&color=fff&size=128`}
                  alt={student.name}
                  className="w-full h-full rounded-lg object-cover border-2 border-white"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
              </div>
            </div>
            
            <div className="text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{student.name}</h2>
                <span className="px-2.5 py-0.5 bg-green-50 text-[#276221] border border-green-100 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 sm:mt-0">
                  {student.id}
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2">
                  <span className="text-base font-semibold text-slate-600">{student.department}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
                  <span className="text-base font-semibold text-slate-400">Semester {student.semester}</span>
                </div>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 mt-2">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="material-symbols-outlined text-[20px] text-slate-300">school</span>
                      <span className="uppercase tracking-wide">{student.year} Year</span>
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="material-symbols-outlined text-[20px] text-slate-300">location_on</span>
                      <span className="uppercase tracking-wide">Block C, Room 402</span>
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="material-symbols-outlined text-[20px] text-slate-300">event_available</span>
                      <span className="uppercase tracking-wide">Batch 2023-27</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#276221] text-white rounded-lg text-sm font-semibold hover:bg-[#276221]/90 transition-all active:scale-95 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
              <span>Quick Action</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]">description</span>
              <span>Report</span>
            </button>
            <button className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-[#276221] hover:border-[#276221] transition-all shadow-sm group/edit">
              <span className="material-symbols-outlined text-[20px] group-hover/edit:rotate-12 transition-transform">edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Underlined Tab Navigation */}
      <div className="flex items-center gap-8 border-b border-slate-200 mb-8 px-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-semibold transition-all relative ${
              activeTab === tab.id
                ? 'text-[#276221]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#276221] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'overview' && <OverviewTab student={student} />}
        {activeTab === 'academics' && <AcademicsTab student={student} onRefresh={refreshData} />}
        {activeTab === 'fees' && <FeesTab student={student} />}
        {activeTab === 'documents' && <DocumentsTab student={student} />}
      </div>
    </Layout>
  )
}
