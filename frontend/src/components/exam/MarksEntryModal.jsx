import { useState, useEffect, useMemo } from 'react';
import { listEnrolledStudents, listMarks, upsertMark, calculateGrade } from '../../api/examsApi';

export default function MarksEntryModal({ isOpen, onClose, exam, currentUserId }) {
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && exam) {
      loadStudentsAndMarks();
    }
  }, [isOpen, exam]);

  const loadStudentsAndMarks = async () => {
    setLoading(true);
    try {
      const examId = exam._id || exam.id;
      const [enrolled, existingMarks] = await Promise.all([
        listEnrolledStudents(examId),
        listMarks({ examId }),
      ]);

      const marksMap = {};
      existingMarks.forEach((m) => {
        marksMap[m.studentId] = { marks: m.marks, grade: m.grade };
      });

      setStudents(enrolled);
      setMarksData(marksMap);
    } catch (err) {
      console.error('Failed to load marks entry data:', err);
      setStudents([]);
      setMarksData({});
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId, value) => {
    if (value === '') {
      setMarksData(prev => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
      return;
    }

    const marks = parseFloat(value);
    const maxMarksVal = parseFloat(exam.maxMarks) || 100;
    const grade = isNaN(marks) || marks < 0 || marks > maxMarksVal 
      ? 'Invalid' 
      : calculateGrade(marks, maxMarksVal);
    
    setMarksData(prev => ({
      ...prev,
      [studentId]: { marks: isNaN(marks) ? '' : marks, grade }
    }));
  };

  // Real-time student search filtering
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(st => 
      st.studentName?.toLowerCase().includes(term) || 
      st.studentId?.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // Live Statistics Calculation
  const stats = useMemo(() => {
    const total = students.length;
    const marksList = Object.values(marksData).filter(v => v?.marks !== undefined && v?.marks !== '');
    const entered = marksList.length;
    const pending = total - entered;
    
    let average = '—';
    let topScore = '—';
    
    if (entered > 0) {
      const numericMarks = marksList.map(v => parseFloat(v.marks) || 0);
      const sum = numericMarks.reduce((acc, m) => acc + m, 0);
      average = (sum / entered).toFixed(1);
      topScore = Math.max(...numericMarks).toString();
    }
    
    // Check if any mark exceeds maximum allowed marks
    const maxMarksVal = parseFloat(exam.maxMarks) || 100;
    const hasErrors = marksList.some(v => parseFloat(v.marks) > maxMarksVal || parseFloat(v.marks) < 0);
    
    return { total, entered, pending, average, topScore, hasErrors };
  }, [students, marksData, exam.maxMarks]);

  const handleSave = async () => {
    if (stats.hasErrors) {
      alert('Please fix the validation errors (marks exceeding maximum limit) before saving.');
      return;
    }

    setSaving(true);
    try {
      const examId = exam._id || exam.id;
      const rows = Object.entries(marksData).filter(([, value]) => value?.marks !== undefined && value?.marks !== '');
      await Promise.all(
        rows.map(([studentId, value]) =>
          upsertMark({
            examId,
            studentId,
            marks: value.marks,
            grade: value.grade,
            maxMarks: exam.maxMarks,
            enteredBy: currentUserId || '',
          })
        )
      );
      alert('Marks saved successfully!');
      onClose();
    } catch (err) {
      alert(err?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Premium Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="material-symbols-outlined text-emerald-400 text-2xl">edit_note</span>
            </div>
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                {exam.type} Academic Marks
              </span>
              <h3 className="text-xl font-bold text-slate-100">{exam.name}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{exam.code} • Max Score: {exam.maxMarks} Marks</p>
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
        <div className="px-8 py-4 bg-slate-900/40 border-b border-slate-800/80 grid grid-cols-5 gap-3">
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-sm font-medium text-slate-400">Enrolled</p>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-sm font-medium text-emerald-400">Entered</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.entered}</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-sm font-medium text-amber-500">Pending</p>
            <p className="text-xl font-bold text-amber-500 mt-0.5">{stats.pending}</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-sm font-medium text-indigo-400">Average</p>
            <p className="text-xl font-bold text-indigo-400 mt-0.5">{stats.average}</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-sm font-medium text-rose-400">Top Score</p>
            <p className="text-xl font-bold text-rose-400 mt-0.5">{stats.topScore}</p>
          </div>
        </div>

        {/* Live Filter Bar */}
        <div className="px-8 py-4 bg-slate-950/20 border-b border-slate-800/60 flex items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
            <input
              type="text"
              placeholder="Search enrolled students by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Fetching enrolled academic profiles...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl text-slate-500">
              <span className="material-symbols-outlined text-5xl mb-3 text-slate-600">person_off</span>
              <p className="text-sm font-semibold text-slate-400">No matching students found</p>
              <p className="text-xs text-slate-500 mt-1">Please verify the search spelling or register students for this subject.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredStudents.map((student) => {
                const currentVal = marksData[student.studentId]?.marks;
                const isOverMax = currentVal !== undefined && currentVal !== '' && parseFloat(currentVal) > (parseFloat(exam.maxMarks) || 100);
                const isNegative = currentVal !== undefined && currentVal !== '' && parseFloat(currentVal) < 0;
                const hasError = isOverMax || isNegative;
                const currentGrade = marksData[student.studentId]?.grade;

                return (
                  <div 
                    key={student.id} 
                    className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${
                      hasError 
                        ? 'bg-rose-950/20 border-rose-800/80 shadow-rose-950/10' 
                        : currentVal !== undefined && currentVal !== ''
                          ? 'bg-emerald-950/10 border-emerald-900/40 hover:border-emerald-900/60'
                          : 'bg-slate-950/30 border-slate-800/80 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider uppercase shrink-0 border ${
                        hasError 
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : currentVal !== undefined && currentVal !== ''
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-slate-800/40 border-slate-800 text-slate-300'
                      }`}>
                        {student.studentName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate">{student.studentName}</p>
                        <p className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5">{student.studentId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Mark Input */}
                      <div className="w-32">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={exam.maxMarks}
                            step="any"
                            value={currentVal ?? ''}
                            onChange={(e) => handleMarksChange(student.studentId, e.target.value)}
                            className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-sm font-semibold text-right pr-9 outline-none transition-all ${
                              hasError 
                                ? 'border-rose-600 focus:border-rose-500 text-rose-400' 
                                : 'border-slate-800 hover:border-slate-700 focus:border-emerald-500 text-slate-200'
                            }`}
                            placeholder="—"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase pointer-events-none">
                            /{exam.maxMarks}
                          </span>
                        </div>
                      </div>

                      {/* Calculated Grade Badge */}
                      <div className="w-20 text-center shrink-0">
                        <div className={`px-2.5 py-2 rounded-xl border text-xs font-black tracking-wider uppercase ${
                          hasError 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : currentGrade && currentGrade !== '-' && currentGrade !== 'Pending'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-950/60 border-slate-800 text-slate-500'
                        }`}>
                          {currentGrade || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Save/Cancel Footer */}
        <div className="px-8 py-5 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3 shrink-0">
          <div>
            {stats.hasErrors && (
              <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                <span className="material-symbols-outlined text-sm">warning</span>
                Resolve invalid marks before saving
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-800 text-slate-300 hover:text-slate-100 bg-transparent hover:bg-slate-800 rounded-xl transition-all font-bold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || stats.hasErrors || loading || students.length === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-950/30 border border-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Marks...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  Save Marks
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
