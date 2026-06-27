import { useState, useEffect } from 'react';
import { assignInvigilator, listInvigilators, deleteInvigilator } from '../../api/examsApi';
import { buildApiUrl } from '../../api/apiBase';

export default function InvigilatorAssignModal({ isOpen, onClose, exam, currentUserId }) {
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [assignedInvigilators, setAssignedInvigilators] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  useEffect(() => {
    if (isOpen && exam) {
      loadAssignedInvigilators();
      loadFacultyList();
    }
  }, [isOpen, exam]);

  const loadFacultyList = async () => {
    try {
      const res = await fetch(buildApiUrl('/faculty'));
      if (res.ok) {
        const data = await res.json();
        setFacultyList(data || []);
      }
    } catch (err) {
      console.error('Failed to load faculty list:', err);
    }
  };

  const loadAssignedInvigilators = async () => {
    try {
      const examId = exam._id || exam.id;
      const assigned = await listInvigilators({ examId });
      setAssignedInvigilators(assigned);
    } catch (err) {
      console.error('Failed to load invigilators:', err);
      setAssignedInvigilators([]);
    }
  };

  const handleAssign = async () => {
    if (!selectedFaculty) return;

    const faculty = facultyList.find(f => (f.employeeId || f.id || f._id) === selectedFaculty);
    if (!faculty) return;

    try {
      await assignInvigilator({
        examId: exam._id || exam.id,
        facultyId: faculty.employeeId || faculty.id || faculty._id,
        facultyName: faculty.fullName || faculty.name,
        assignedBy: currentUserId || '',
      });
      loadAssignedInvigilators();
      setSelectedFaculty('');
      alert('Invigilator assigned successfully!');
    } catch (err) {
      alert(err?.message || 'Failed to assign invigilator');
    }
  };

  const handleRemove = async (assignmentId) => {
    if (confirm('Remove this invigilator assignment?')) {
      try {
        await deleteInvigilator(assignmentId);
        loadAssignedInvigilators();
      } catch (err) {
        alert(err?.message || 'Failed to remove invigilator');
      }
    }
  };

  if (!isOpen) return null;

  // Filter out already assigned faculty
  const availableFaculty = facultyList.filter(
    f => !assignedInvigilators.some(a => a.facultyId === (f.employeeId || f.id || f._id))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#276221]/10 rounded-lg">
              <span className="material-symbols-outlined text-[#276221]">person_add</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Assign Invigilators</h3>
              <p className="text-sm text-slate-500">{exam.code} - {exam.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Invigilator */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              Select Faculty Member
            </label>
            <div className="flex gap-2">
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#276221]/20 focus:border-[#276221] outline-none bg-white text-slate-800"
              >
                <option value="">-- Select Faculty --</option>
                {availableFaculty.map(faculty => {
                  const fId = faculty.employeeId || faculty.id || faculty._id;
                  const fName = faculty.fullName || faculty.name;
                  const fDept = faculty.department || 'N/A';
                  return (
                    <option key={fId} value={fId}>
                      {fName} ({fDept})
                    </option>
                  );
                })}
              </select>
              <button
                onClick={handleAssign}
                disabled={!selectedFaculty}
                className="px-4 py-2 bg-[#276221] text-white rounded-lg hover:bg-[#276221]/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>

          {/* Assigned Invigilators List */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Assigned Invigilators ({assignedInvigilators.length})
            </h4>
            {assignedInvigilators.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">person_off</span>
                <p className="text-sm">No invigilators assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignedInvigilators.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#276221] flex items-center justify-center text-white font-bold">
                        {assignment.facultyName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{assignment.facultyName}</p>
                        <p className="text-xs text-slate-500">{assignment.facultyId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(assignment.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
