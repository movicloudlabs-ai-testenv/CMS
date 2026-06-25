import { useState, useEffect, useMemo } from 'react';
import { 
  listEnrolledStudents,
  listExamAttendance,
  upsertExamAttendance,
} from '../../api/examsApi';
import { getUserSession } from '../../auth/sessionController';

export default function AttendanceModal({ exam, onClose, onSave }) {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const session = getUserSession();

  useEffect(() => {
    if (exam) {
      loadStudentsAndAttendance();
    }
  }, [exam]);

  const loadStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      const examId = exam._id || exam.id;
      const [enrolled, existingAttendance] = await Promise.all([
        listEnrolledStudents(examId),
        listExamAttendance({ examId }),
      ]);

      setStudents(enrolled);

      const attObj = {};
      // Default all to Present first, then merge existing attendance values
      enrolled.forEach(s => {
        attObj[s.studentId] = 'Present';
      });
      existingAttendance.forEach((a) => {
        attObj[a.studentId] = a.status;
      });
      
      setAttendanceData(attObj);
    } catch (err) {
      console.error('Failed to load exam attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.studentId] = status;
    });
    setAttendanceData(updated);
  };

  // Real-time search filter
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(s => 
      s.studentName?.toLowerCase().includes(term) || 
      s.studentId?.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const total = students.length;
    const values = Object.values(attendanceData);
    const present = values.filter(s => s === 'Present').length;
    const absent = values.filter(s => s === 'Absent').length;
    const late = values.filter(s => s === 'Late').length;
    
    const pctPresent = total > 0 ? Math.round((present / total) * 100) : 0;
    const pctAbsent = total > 0 ? Math.round((absent / total) * 100) : 0;
    const pctLate = total > 0 ? Math.round((late / total) * 100) : 0;
    
    return { total, present, absent, late, pctPresent, pctAbsent, pctLate };
  }, [students, attendanceData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const examId = exam._id || exam.id;
      const rows = Object.entries(attendanceData).filter(([, status]) => Boolean(status));
      await Promise.all(
        rows.map(([studentId, status]) =>
          upsertExamAttendance({
            examId,
            studentId,
            status,
            markedBy: session?.userId || session?.username || 'faculty',
          })
        )
      );
      alert(`Attendance saved for ${rows.length} students successfully!`);
      onSave();
    } catch (err) {
      alert(err?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Premium Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <span className="material-symbols-outlined text-purple-400 text-2xl">fact_check</span>
            </div>
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-1">
                Exam Roll & Attendance
              </span>
              <h3 className="text-xl font-bold text-slate-100">Mark Attendance</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{exam.name} ({exam.code})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-full border border-slate-800 hover:border-slate-700 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Dynamic Statistics Panel */}
        <div className="px-8 py-4 bg-slate-900/40 border-b border-slate-800/80 grid grid-cols-4 gap-3">
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-slate-400">Total Enrolled</p>
            <p className="text-xl font-black text-slate-100 mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-slate-950/40 border border-emerald-900/40 rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-emerald-400">Present ({stats.pctPresent}%)</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{stats.present}</p>
          </div>
          <div className="bg-slate-950/40 border border-rose-900/40 rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-rose-400">Absent ({stats.pctAbsent}%)</p>
            <p className="text-xl font-black text-rose-400 mt-0.5">{stats.absent}</p>
          </div>
          <div className="bg-slate-950/40 border border-amber-900/40 rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-amber-500 font-medium">Late ({stats.pctLate}%)</p>
            <p className="text-xl font-black text-amber-500 mt-0.5">{stats.late}</p>
          </div>
        </div>

        {/* Action Row & Live Search */}
        <div className="px-8 py-4 bg-slate-950/20 border-b border-slate-800/60 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-purple-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={() => handleMarkAll('Present')}
              className="px-3.5 py-2 bg-emerald-950/45 hover:bg-emerald-900/60 text-emerald-400 rounded-xl border border-emerald-900/40 hover:border-emerald-800 transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-xs">check_circle</span>
              All Present
            </button>
            <button
              onClick={() => handleMarkAll('Absent')}
              className="px-3.5 py-2 bg-rose-950/45 hover:bg-rose-900/60 text-rose-400 rounded-xl border border-rose-900/40 hover:border-rose-800 transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-xs">cancel</span>
              All Absent
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Fetching class attendance sheets...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl text-slate-500">
              <span className="material-symbols-outlined text-5xl mb-3 text-slate-600">person_off</span>
              <p className="text-sm font-semibold text-slate-400">No students found</p>
              <p className="text-xs text-slate-500 mt-1">Please verify the search filters or class list.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student) => {
                const currentStatus = attendanceData[student.studentId];
                
                return (
                  <div 
                    key={student.id} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all duration-200 ${
                      currentStatus === 'Present' 
                        ? 'bg-emerald-950/10 border-emerald-900/30' 
                        : currentStatus === 'Absent'
                          ? 'bg-rose-950/10 border-rose-900/30'
                          : currentStatus === 'Late'
                            ? 'bg-amber-950/10 border-amber-900/30'
                            : 'bg-slate-950/30 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs tracking-wider uppercase shrink-0 border ${
                        currentStatus === 'Present' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : currentStatus === 'Absent'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : currentStatus === 'Late'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-slate-800/40 border-slate-800 text-slate-400'
                      }`}>
                        {student.studentName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate">{student.studentName}</p>
                        <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5">{student.studentId}</p>
                      </div>
                    </div>

                    {/* Animated Sliding Selectors */}
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 select-none">
                      {['Present', 'Absent', 'Late'].map((status) => {
                        const active = currentStatus === status;
                        let activeStyles = '';
                        if (active) {
                          if (status === 'Present') activeStyles = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold';
                          if (status === 'Absent') activeStyles = 'bg-rose-500/15 border-rose-500/30 text-rose-400 font-bold';
                          if (status === 'Late') activeStyles = 'bg-amber-500/15 border-amber-500/30 text-amber-400 font-bold';
                        } else {
                          activeStyles = 'text-slate-500 hover:text-slate-300 border-transparent';
                        }
                        
                        return (
                          <button
                            key={status}
                            onClick={() => handleAttendanceChange(student.studentId, status)}
                            className={`px-4.5 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all active:scale-95 ${activeStyles}`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-800 text-slate-300 hover:text-slate-100 bg-transparent hover:bg-slate-800 rounded-xl transition-all font-bold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || students.length === 0}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-950/30 border border-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                Save Attendance
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
