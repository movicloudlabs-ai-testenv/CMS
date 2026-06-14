import React, { useState, useEffect, useMemo } from 'react';
import { createTimetableDraft, listExamHalls } from '../../api/examsApi';
import { getUserSession } from '../../auth/sessionController';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
}

export default function TimetableScheduleWizard({ isOpen, onClose, onSave }) {
  const session = getUserSession();
  const [wizardStep, setWizardStep] = useState(1);
  const [halls, setHalls] = useState([]);

  // Step 1: Session & Basic Info
  const [sessionName, setSessionName] = useState('');
  const [semester, setSemester] = useState('1');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  // Step 2: Add Exams
  const [exams, setExams] = useState([
    {
      subject: '',
      subjectCode: '',
      date: '',
      startTime: '',
      endTime: '',
      room: ''
    }
  ]);

  // Step 3: Review (derived)
  const totalExams = exams.length;
  const completedExams = exams.filter(
    (e) =>e.subject && e.subjectCode && e.date && e.startTime && e.endTime && e.room
  ).length;

  useEffect(() =>{
    let cancelled = false;

    async function loadHalls() {
      try {
        const rows = await listExamHalls();
        if (!cancelled) setHalls(rows);
      } catch (err) {
        console.error('Failed to load exam halls:', err);
      }
    }

    if (isOpen) loadHalls();

    return () =>{
      cancelled = true;
    };
  }, [isOpen]);

  const handleAddExam = () =>{
    setExams([
      ...exams,
      {
        subject: '',
        subjectCode: '',
        date: '',
        startTime: '',
        endTime: '',
        room: ''
      }
    ]);
  };

  const handleRemoveExam = (index) =>{
    if (exams.length >1) {
      setExams(exams.filter((_, i) =>i !== index));
    }
  };

  const handleExamChange = (index, field, value) =>{
    const updated = [...exams];
    updated[index][field] = value;
    setExams(updated);
  };

  const handleNext = () =>{
    if (wizardStep === 1) {
      if (!sessionName.trim()) {
        alert('Please enter session name');
        return;
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      const incomplete = exams.filter(
        (e) =>!e.subject || !e.subjectCode || !e.date || !e.startTime || !e.endTime || !e.room
      );
      if (incomplete.length >0) {
        alert('Please fill all exam details before proceeding');
        return;
      }
      setWizardStep(3);
    }
  };

  const handleBack = () =>{
    setWizardStep((prev) =>Math.max(1, prev - 1));
  };

  const handleSaveAsDraft = async () =>{
    const draft = {
      session: sessionName,
      semester,
      academicYear,
      exams,
      createdBy: session?.username || 'Unknown',
      status: 'Draft'
    };

    try {
      await createTimetableDraft(draft);
      alert('Timetable draft saved successfully');
      resetWizard();
      onSave();
    } catch (err) {
      alert(err?.message || 'Failed to save timetable draft');
    }
  };

  const handleSubmitForApproval = async () =>{
    const draft = {
      session: sessionName,
      semester,
      academicYear,
      exams,
      createdBy: session?.username || 'Unknown',
      status: 'Submitted'
    };

    try {
      await createTimetableDraft(draft);
      alert('Timetable submitted for approval');
      resetWizard();
      onSave();
    } catch (err) {
      alert(err?.message || 'Failed to submit timetable');
    }
  };

  const resetWizard = () =>{
    setWizardStep(1);
    setSessionName('');
    setSemester('1');
    setAcademicYear(new Date().getFullYear().toString());
    setExams([
      {
        subject: '',
        subjectCode: '',
        date: '',
        startTime: '',
        endTime: '',
        room: ''
      }
    ]);
  };

  const handleClose = () =>{
    resetWizard();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}><div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideUp 0.3s ease-out', overflow: 'hidden' }}>{/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}><h3 style={{ margin: 0, fontSize: 18, color: '#1f2937', fontWeight: 600 }}>Create Exam Schedule</h3><button type="button" onClick={handleClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><CloseIcon /></button></div>{/* Step Indicator */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>{['Session Info', 'Add Exams', 'Review'].map((label, idx) =>{
            const stepNum = idx + 1;
            const isActive = wizardStep === stepNum;
            const isPassed = wizardStep >stepNum;
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}><div style={{
                  width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600,
                  background: isActive || isPassed ? '#276221' : '#e5e7eb',
                  color: isActive || isPassed ? '#fff' : '#6b7280',
                  marginBottom: 8, zIndex: 2
                }}>{isPassed ? '' : stepNum}
                </div><div style={{ fontSize: 12, fontWeight: isActive ? 600 : 500, color: isActive ? '#1f2937' : '#6b7280' }}>{label}</div>{idx < 2 && (
                  <div style={{ position: 'absolute', top: 16, left: '50%', width: '100%', height: 2, background: isPassed ? '#276221' : '#e5e7eb', zIndex: 1 }} />)}
              </div>);
          })}
        </div>{/* Wizard Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>{/* STEP 1: Session Info */}
          {wizardStep === 1 && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}><h4 style={{ margin: '0 0 20px 0', fontSize: 16, color: '#374151' }}>Step 1 – Session & Academic Information</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Session Name *</label><input
                    type="text"
                    value={sessionName}
                    onChange={(e) =>setSessionName(e.target.value)}
                    placeholder="e.g., Mid Sem 2026"
                    style={{ width: '100%', height: 40, borderRadius: 6, border: '1px solid #d1d5db', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' }}
                  /></div><div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Semester</label><select
                    value={semester}
                    onChange={(e) =>setSemester(e.target.value)}
                    style={{ width: '100%', height: 40, borderRadius: 6, border: '1px solid #d1d5db', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' }}
                  >{[1, 2, 3, 4, 5, 6, 7, 8].map((s) =>(
                      <option key={s} value={s}>Semester {s}</option>))}
                  </select></div><div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Academic Year</label><select
                    value={academicYear}
                    onChange={(e) =>setAcademicYear(e.target.value)}
                    style={{ width: '100%', height: 40, borderRadius: 6, border: '1px solid #d1d5db', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' }}
                  ><option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option></select></div></div><div style={{ marginTop: 20, padding: 16, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}><p style={{ margin: 0, fontSize: 13, color: '#0369a1' }}><strong>Next Step:</strong>You'll add exam details one by one. You can add multiple exams and review before submitting.
                </p></div></div>)}

          {/* STEP 2: Add Exams */}
          {wizardStep === 2 && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}><h4 style={{ margin: '0 0 20px 0', fontSize: 16, color: '#374151' }}>Step 2 – Add Exam Details</h4><div style={{ marginBottom: 16, padding: 12, background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}><p style={{ margin: 0, fontSize: 13, color: '#166534', fontWeight: 500 }}>{completedExams} of {totalExams} exams completed
                </p></div><div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 20 }}>{exams.map((exam, idx) =>(
                  <div key={idx} style={{ marginBottom: 20, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h5 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1f2937' }}>Exam {idx + 1}</h5>{exams.length >1 && (
                        <button
                          type="button"
                          onClick={() =>handleRemoveExam(idx)}
                          style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                        >Remove
                        </button>)}
                    </div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Subject *</label><input
                          type="text"
                          value={exam.subject}
                          onChange={(e) =>handleExamChange(idx, 'subject', e.target.value)}
                          placeholder="e.g., Data Structures"
                          style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #d1d5db', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }}
                        /></div><div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Subject Code *</label><input
                          type="text"
                          value={exam.subjectCode}
                          onChange={(e) =>handleExamChange(idx, 'subjectCode', e.target.value)}
                          placeholder="e.g., CS301"
                          style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #d1d5db', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }}
                        /></div><div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Date *</label><input
                          type="date"
                          value={exam.date}
                          onChange={(e) =>handleExamChange(idx, 'date', e.target.value)}
                          style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #d1d5db', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }}
                        /></div><div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Room *</label><select
                          value={exam.room}
                          onChange={(e) =>handleExamChange(idx, 'room', e.target.value)}
                          style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #d1d5db', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }}
                        ><option value="">Select Room</option>{halls.map((hall) =>(
                            <option key={hall.id || hall.name} value={hall.name || hall.id}>{hall.name || hall.id}
                            </option>))}
                        </select></div><div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Start Time *</label><input
                          type="time"
                          value={exam.startTime}
                          onChange={(e) =>handleExamChange(idx, 'startTime', e.target.value)}
                          style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #d1d5db', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }}
                        /></div><div><label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>End Time *</label><input
                          type="time"
                          value={exam.endTime}
                          onChange={(e) =>handleExamChange(idx, 'endTime', e.target.value)}
                          style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #d1d5db', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }}
                        /></div></div></div>))}
              </div><button
                type="button"
                onClick={handleAddExam}
                style={{ width: '100%', padding: 12, background: '#f0f9ff', color: '#276221', border: '2px dashed #276221', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              >+ Add Another Exam
              </button></div>)}

          {/* STEP 3: Review */}
          {wizardStep === 3 && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}><h4 style={{ margin: '0 0 20px 0', fontSize: 16, color: '#374151', textAlign: 'center' }}>Step 3 – Review & Submit</h4><div style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}><div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Session</div><div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{sessionName}</div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div><div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Semester</div><div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Semester {semester}</div></div><div><div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Academic Year</div><div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{academicYear}</div></div></div></div><h5 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#374151' }}>Exams Added: {totalExams}</h5><div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}><table style={{ width: '100%', fontSize: 13 }}><thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}><th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Subject</th><th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Code</th><th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Date</th><th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Time</th><th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Room</th></tr></thead><tbody>{exams.map((exam, idx) =>(
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '10px 12px', color: '#1f2937', fontWeight: 500 }}>{exam.subject}</td><td style={{ padding: '10px 12px', color: '#6b7280' }}>{exam.subjectCode}</td><td style={{ padding: '10px 12px', color: '#6b7280' }}>{exam.date}</td><td style={{ padding: '10px 12px', color: '#6b7280' }}>{exam.startTime} - {exam.endTime}</td><td style={{ padding: '10px 12px', color: '#6b7280' }}>{exam.room}</td></tr>))}
                  </tbody></table></div><div style={{ padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 20 }}><p style={{ margin: 0, fontSize: 13, color: '#92400e' }}><strong>Ready to submit?</strong>You can save as draft or submit for admin approval.
                </p></div></div>)}
        </div>{/* Footer */}
        <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={handleBack}
            disabled={wizardStep === 1}
            className={`w-full sm:w-auto px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
              wizardStep === 1
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 active:scale-95 cursor-pointer'
            }`}
          >
            Back
          </button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {wizardStep === 3 && (
              <>
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium transition-all active:scale-95 cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  className="w-full sm:w-auto px-4 py-2 bg-[#276221] hover:bg-[#1e4618] text-white rounded-lg text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  Submit for Approval
                </button>
              </>
            )}

            {wizardStep < 3 && (
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto px-4 py-2 bg-[#276221] hover:bg-[#1e4618] text-white rounded-lg text-sm font-semibold transition-all active:scale-95 cursor-pointer shadow-sm text-center"
              >
                Next
              </button>
            )}
          </div>
        </div></div></div>);
}
