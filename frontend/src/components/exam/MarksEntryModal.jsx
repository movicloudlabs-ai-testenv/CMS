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

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(st => 
      st.studentName?.toLowerCase().includes(term) || 
      st.studentId?.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#276221]/10 rounded-lg">
              <span className="material-symbols-outlined text-[#276221]">edit_note</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Enter Marks</h3>
              <p className="text-sm text-slate-500">{exam.code} - {exam.name} • Max: {exam.maxMarks}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Stats Row */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Enrolled', value: stats.total, color: 'text-slate-900' },
              { label: 'Entered', value: stats.entered, color: 'text-emerald-600' },
              { label: 'Pending', value: stats.pending, color: 'text-orange-600' },
              { label: 'Average', value: stats.average, color: 'text-blue-600' },
              { label: 'Top Score', value: stats.topScore, color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
                <p className={`text-xl font-bold ${s.color} mt-0.5`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search students by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#276221]/20 focus:border-[#276221] transition-all"
            />
          </div>

          {/* Student List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-8 h-8 border-2 border-[#276221] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <span className="material-symbols-outlined text-5xl mb-2 opacity-20">person_off</span>
              <p className="text-sm">No students found for this exam.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Roll Number</th>
                    <th className="px-4 py-3 text-center">Marks (/{exam.maxMarks})</th>
                    <th className="px-4 py-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const currentVal = marksData[student.studentId]?.marks;
                    const maxMarksVal = parseFloat(exam.maxMarks) || 100;
                    const isOverMax = currentVal !== undefined && currentVal !== '' && parseFloat(currentVal) > maxMarksVal;
                    const isNegative = currentVal !== undefined && currentVal !== '' && parseFloat(currentVal) < 0;
                    const hasError = isOverMax || isNegative;
                    const currentGrade = marksData[student.studentId]?.grade;

                    return (
                      <tr key={student.id} className={`hover:bg-slate-50 transition-colors ${hasError ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-3 font-medium text-slate-900">{student.studentName}</td>
                        <td className="px-4 py-3 text-slate-600">{student.studentId}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={exam.maxMarks}
                            step="any"
                            value={currentVal ?? ''}
                            onChange={(e) => handleMarksChange(student.studentId, e.target.value)}
                            className={`w-24 px-3 py-2 border rounded-lg text-sm font-semibold text-center outline-none transition-all ${
                              hasError
                                ? 'border-red-300 focus:ring-red-200 focus:border-red-400 text-red-600 bg-red-50'
                                : 'border-slate-200 focus:ring-2 focus:ring-[#276221]/20 focus:border-[#276221] text-slate-900'
                            }`}
                            placeholder="—"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {currentGrade && currentGrade !== '-' ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              hasError
                                ? 'bg-red-100 text-red-800'
                                : currentGrade === 'F'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {currentGrade}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <div>
            {stats.hasErrors && (
              <span className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                <span className="material-symbols-outlined text-sm">warning</span>
                Fix invalid marks before saving
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || stats.hasErrors || loading || students.length === 0}
              className="px-4 py-2 bg-[#276221] text-white rounded-lg hover:bg-[#1e4618] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
