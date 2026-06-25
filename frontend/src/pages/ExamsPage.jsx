import { useState, useMemo, useEffect } from 'react'
import { Pagination, TableSkeleton } from '../components/common'
import Layout from '../components/Layout'
import KpiCard from '../components/KpiCard'
import KpiGrid from '../components/KpiGrid'
import { getUserSession } from '../auth/sessionController'
import { buildApiUrl } from '../api/apiBase'
import Modal from '../components/Modal'
import MarksEntryModal from '../components/exam/MarksEntryModal'
import HallTicket from '../components/exam/HallTicket'
import ExamSessionModal from '../components/exam/ExamSessionModal'
import TimetableScheduleWizard from '../components/exam/TimetableScheduleWizard'
import InvigilatorAssignModal from '../components/exam/InvigilatorAssignModal'
import RevaluationModal from '../components/exam/RevaluationModal'
import ExamReportModal from '../components/exam/ExamReportModal'
import AttendanceModal from '../components/exam/AttendanceModal'
import SeatAssignmentModal from '../components/exam/SeatAssignmentModal'

import TimetableApprovalModal from '../components/exam/TimetableApprovalModal'
import NotificationPanel from '../components/exam/NotificationPanel'
import {
  listExams,
  createExam,
  updateExamById,
  deleteExamById,
  listRegistrations,
  registerExam,
  listMarks,
  listSeatAssignments,
} from '../api/examsApi'
import { getStudentById } from '../data/studentData'

export default function ExamsPage({ noLayout = false }) {
  const session = getUserSession()
  const studentRecordForHallTicket = getStudentById(session?.userId)
  const isStudent = session?.role === 'student'
  const isFaculty = session?.role === 'faculty'
  const isAdmin = session?.role === 'admin'
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    date: '',
    time: '',
    room: '',
    type: 'Mid-Sem',
    status: 'Upcoming',
    duration: '',
    maxMarks: ''
  })
  
  // Modal states for exam features
  const [showMarksEntryModal, setShowMarksEntryModal] = useState(false)
  const [showHallTicket, setShowHallTicket] = useState(false)
  const [hallTicketMode, setHallTicketMode] = useState('all')
  const [showExamSessionModal, setShowExamSessionModal] = useState(false)
  const [showScheduleWizard, setShowScheduleWizard] = useState(false)
  const [showInvigilatorModal, setShowInvigilatorModal] = useState(false)
  const [showRevaluationModal, setShowRevaluationModal] = useState(false)
  const [showExamReportModal, setShowExamReportModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showSeatAssignmentModal, setShowSeatAssignmentModal] = useState(false)

  const [showTimetableApprovalModal, setShowTimetableApprovalModal] = useState(false)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [studentRegistrations, setStudentRegistrations] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(3)
  
  const [activeExamsTab, setActiveExamsTab] = useState('schedules')
  const [studentsList, setStudentsList] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState(isStudent ? (session?.userId || '') : '')
  const [studentDetails, setStudentDetails] = useState(null)
  const [yearFilter, setYearFilter] = useState('All')
  const [semesterFilter, setSemesterFilter] = useState('All')
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [studentMarks, setStudentMarks] = useState([])
  const [allExams, setAllExams] = useState([])

  // Fetch list of students for Admin/Faculty
  useEffect(() => {
    if ((isAdmin || isFaculty) && activeExamsTab === 'marks' && studentsList.length === 0) {
      const fetchStudents = async () => {
        try {
          const res = await fetch(buildApiUrl('/students'));
          if (res.ok) {
            const data = await res.json();
            setStudentsList(data || []);
            if (data.length > 0 && !selectedStudentId) {
              setSelectedStudentId(data[0].rollNumber || data[0].id);
            }
          }
        } catch (err) {
          console.error("Failed to fetch student list:", err);
        }
      };
      fetchStudents();
    }
  }, [activeExamsTab, isAdmin, isFaculty, studentsList.length]);

  // Fetch selected student details and marks
  useEffect(() => {
    if (selectedStudentId) {
      const fetchDetailsAndMarks = async () => {
        setLoadingStudent(true);
        try {
          const [res, marksData] = await Promise.all([
            fetch(buildApiUrl(`/students/${selectedStudentId}`)),
            listMarks({ studentId: selectedStudentId })
          ]);
          if (res.ok) {
            const data = await res.json();
            setStudentDetails(data);
          }
          setStudentMarks(marksData || []);
        } catch (err) {
          console.error("Failed to fetch student details/marks:", err);
          setStudentMarks([]);
        } finally {
          setLoadingStudent(false);
        }
      };
      fetchDetailsAndMarks();
    } else {
      setStudentDetails(null);
      setStudentMarks([]);
    }
  }, [selectedStudentId]);

  // Mapped subjects list based on live End-Sem marks
  const mappedSubjects = useMemo(() => {
    if (!studentDetails?.subjects) return [];

    const norm = (c) => String(c || '').replace(/[-_\s]+/g, '').toUpperCase();

    return studentDetails.subjects.map(sub => {
      const subCodeNorm = norm(sub.code);

      // Find an End-Sem exam for this subject
      const endSemExam = allExams.find(e => norm(e.code) === subCodeNorm && e.type === 'End-Sem');

      // If we found an End-Sem exam, find the student's mark for it
      let marksRecord = null;
      if (endSemExam) {
        const examId = endSemExam._id || endSemExam.id;
        marksRecord = studentMarks.find(m => String(m.examId) === String(examId));
      }

      // Fallback: search studentMarks for any mark where the corresponding exam has type 'End-Sem' and matches code
      if (!marksRecord) {
        marksRecord = studentMarks.find(m => {
          const ex = allExams.find(e => String(e._id || e.id) === String(m.examId));
          return ex && norm(ex.code) === subCodeNorm && ex.type === 'End-Sem';
        });
      }

      return {
        ...sub,
        grade: marksRecord ? (marksRecord.grade || 'Pending') : 'Pending',
        total: marksRecord ? (marksRecord.marks !== undefined ? marksRecord.marks : null) : null
      };
    });
  }, [studentDetails, studentMarks, allExams]);

  // Filtered subjects list
  const filteredSubjects = useMemo(() => {
    return mappedSubjects.filter(sub => {
      const matchesYear = yearFilter === 'All' || sub.year === yearFilter;
      const matchesSem = semesterFilter === 'All' || sub.semester?.toString() === semesterFilter;
      return matchesYear && matchesSem;
    });
  }, [mappedSubjects, yearFilter, semesterFilter]);

  // Dynamic statistics for marks tab
  const marksStats = useMemo(() => {
    if (mappedSubjects.length === 0) return { gpa: '0.00', cgpa: '0.00', coursesCount: 0, passedCredits: 0 };
    const allPassed = mappedSubjects.filter(s => s.grade && s.grade !== 'Pending' && s.grade !== 'F');
    const allObtained = allPassed.reduce((s, sub) => s + (sub.total || 0), 0);
    const allMax = allPassed.length * 100;
    const cgpa = allMax > 0 ? ((allObtained / allMax) * 10).toFixed(2) : '0.00';

    const activePassed = filteredSubjects.filter(s => s.grade && s.grade !== 'Pending' && s.grade !== 'F');
    const activeObtained = activePassed.reduce((s, sub) => s + (sub.total || 0), 0);
    const activeMax = activePassed.length * 100;
    const gpa = activeMax > 0 ? ((activeObtained / activeMax) * 10).toFixed(2) : '0.00';

    return { gpa, cgpa, coursesCount: filteredSubjects.length, passedCredits: activePassed.length * 4 };
  }, [mappedSubjects, filteredSubjects]);
  
  // Handle exam registration
  const handleRegister = async (examId) => {
    if (!session?.userId) {
      alert('Please sign in to register for exams.')
      return
    }

    try {
      await registerExam({
        examId,
        studentId: session.userId,
        studentName: studentRecordForHallTicket?.name || session.userId,
      })
      await fetchExams()
      alert('Successfully registered for the exam!')
    } catch (err) {
      alert(err?.message || 'Registration failed.')
    }
  }

  const getRegisteredExams = () => {
    const registeredIds = new Set(studentRegistrations.map((reg) => reg.examId))
    return exams.filter((exam) => registeredIds.has(exam._id || exam.id))
  }

  // Handle opening unified hall ticket
  const handleOpenAllHallTickets = () => {
    const registeredEndSemExams = getRegisteredExams().filter(e => e.type === 'End-Sem')
    if (registeredEndSemExams.length === 0) {
      alert('No end-semester exams registered yet.')
      return
    }

    // Open hall ticket with one consolidated subject list for this student
    setSelectedExam(registeredEndSemExams[0])
    setHallTicketMode('all')
    setShowHallTicket(true)
  }

  const buildHallTicketSubjects = ({ mode, exam } = {}) => {
    const mapExam = (item) => ({
      code: item.code,
      name: item.name,
      credits: item.credits ?? 4,
      semester: item.semester || studentRecordForHallTicket?.semester || 4,
    })

    if (mode === 'single' && exam) {
      if (exam.type !== 'End-Sem') return []
      return [mapExam(exam)]
    }

    const registeredEndSemExams = getRegisteredExams().filter(e => e.type === 'End-Sem')
    return registeredEndSemExams.map(mapExam)
  }

  // Fetch exams from backend
  useEffect(() => {
    fetchExams()
    const loadAll = async () => {
      try {
        const list = await listExams()
        setAllExams(list)
      } catch (err) {
        console.error('Failed to load all exams:', err)
      }
    }
    loadAll()
  }, [])

  const fetchExams = async () => {
    try {
      const examList = await listExams({ role: session?.role, userId: session?.userId })
      
      if (!isStudent || !session?.userId) {
        setExams(examList)
        return
      }

      const [registrations, marks, seats] = await Promise.all([
        listRegistrations({ studentId: session.userId }),
        listMarks({ studentId: session.userId }),
        listSeatAssignments({ studentId: session.userId }),
      ])

      setStudentRegistrations(registrations)
      const registeredIds = new Set(registrations.map((reg) => reg.examId))
      const marksByExam = marks.reduce((acc, item) => {
        if (!acc[item.examId]) acc[item.examId] = item
        return acc
      }, {})
      const seatsByExam = seats.reduce((acc, item) => {
        if (!acc[item.examId]) acc[item.examId] = item
        return acc
      }, {})

      const merged = examList.map((exam) => {
        const examId = exam._id || exam.id
        const mark = marksByExam[examId]
        const seat = seatsByExam[examId]
        return {
          ...exam,
          registered: registeredIds.has(examId) || exam.type !== 'End-Sem',
          marks: mark?.marks,
          grade: mark?.grade,
          seatNumber: seat?.seatNumber,
          hallName: seat?.hallName,
        }
      })
      setExams(merged)
    } catch (err) {
      console.error('Failed to fetch exams:', err)
      setExams([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const upcoming = exams.filter(e => e.status === 'Upcoming').length
    const completed = exams.filter(e => e.status === 'Completed').length
    const pending = exams.filter(e => e.status === 'Upcoming' && new Date(e.date) < new Date()).length
    
    return { upcoming, completed, pending }
  }, [exams])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const parseDurationToMinutes = (value) => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)

    const raw = String(value).trim().toLowerCase()
    if (!raw) return ''

    const numeric = parseFloat(raw)
    if (!Number.isFinite(numeric)) return ''

    if (raw.includes('hr')) {
      return String(Math.round(numeric * 60))
    }

    return String(Math.round(numeric))
  }

  const openAddModal = () => {
    setEditingExam(null)
    setFormData({
      code: '',
      name: '',
      date: '',
      time: '',
      room: '',
      type: 'Mid-Sem',
      status: 'Upcoming',
      duration: '',
      maxMarks: ''
    })
    setShowModal(true)
  }

  const openEditModal = (exam) => {
    setEditingExam(exam)
    setFormData({
      ...exam,
      duration: parseDurationToMinutes(exam.duration),
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingExam(null)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    const payload = {
      ...formData,
      duration: parseDurationToMinutes(formData.duration),
      senderRole: session?.role || 'faculty'
    }
    
    try {
      if (editingExam) {
        await updateExamById(editingExam._id || editingExam.id, payload)
      } else {
        await createExam(payload)
      }
      await fetchExams()
    } catch (err) {
      console.error('Failed to save exam:', err)
    }
    
    closeModal()
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      try {
        await deleteExamById(id)
        await fetchExams()
      } catch (err) {
        console.error('Failed to delete exam:', err)
      }
    }
  }
  
  // Handlers for exam feature modals
  const handleOpenMarksEntry = (exam) => {
    setSelectedExam(exam)
    setShowMarksEntryModal(true)
  }
  
  const handleOpenHallTicket = (exam) => {
    setSelectedExam(exam)
    setHallTicketMode('single')
    setShowHallTicket(true)
  }
  
  const handleOpenInvigilatorAssign = (exam) => {
    setSelectedExam(exam)
    setShowInvigilatorModal(true)
  }
  
  const handleOpenRevaluation = (exam) => {
    setSelectedExam(exam)
    setShowRevaluationModal(true)
  }
  
  const handleOpenExamReport = (exam) => {
    setSelectedExam(exam)
    setShowExamReportModal(true)
  }
  
  const handleOpenAttendance = (exam) => {
    setSelectedExam(exam)
    setShowAttendanceModal(true)
  }
  
  const handleOpenSeatAssignment = (exam) => {
    setSelectedExam(exam)
    setShowSeatAssignmentModal(true)
  }
  


  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const inputClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#276221]/10 focus:border-[#276221] outline-none transition-all text-sm text-slate-700 bg-white";
  const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-0.5";

  const inner = (
    <>
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => { setActiveExamsTab('schedules'); setCurrentPage(1); }}
          className={`pb-3 text-sm font-semibold transition-all relative px-4 ${
            activeExamsTab === 'schedules' ? 'text-[#276221]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Exam Schedules
          {activeExamsTab === 'schedules' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#276221] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => { setActiveExamsTab('marks'); }}
          className={`pb-3 text-sm font-semibold transition-all relative px-4 ${
            activeExamsTab === 'marks' ? 'text-[#276221]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Academic Marks & History
          {activeExamsTab === 'marks' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#276221] rounded-t-full" />
          )}
        </button>
      </div>

      {activeExamsTab === 'schedules' ? (
        <>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {isStudent && (
                <button 
                  onClick={handleOpenAllHallTickets}
                  className="flex items-center gap-2 px-4 py-2 bg-[#276221] text-white rounded-lg text-sm font-semibold hover:bg-[#1e4618] transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">badge</span>
                  Download Hall Tickets
                </button>
              )}
              {isAdmin && (
                <button 
                  onClick={() => setShowScheduleWizard(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-200 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">edit_calendar</span>
                  Create Schedule
                </button>
              )}
            </div>
          </div>
          
          {/* Stats Cards */}
          <KpiGrid className="lg:grid-cols-3">
            <KpiCard icon="event_upcoming" label="Upcoming Exams" value={stats.upcoming} colorScheme="blue" />
            <KpiCard icon="check_circle" label="Completed" value={stats.completed} colorScheme="emerald" />
            <KpiCard icon="pending" label="Results Pending" value={stats.pending} colorScheme="orange" />
          </KpiGrid>

          {/* Exams Table */}
          {loading ? (
            <TableSkeleton cols={isStudent ? 9 : 7} rows={8} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Room</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Status</th>
                    {isStudent && <th className="px-6 py-4 text-center">Score</th>}
                    {isStudent && <th className="px-6 py-4 text-center">Register</th>}
                    {isStudent && <th className="px-6 py-4 text-center">Revaluation</th>}
                    {!isStudent && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exams.length === 0 ? (
                    <tr>
                      <td colSpan={isStudent ? 9 : 7} className="px-6 py-12 text-center text-slate-500">
                        <span className="material-symbols-outlined text-5xl mb-2 opacity-20">quiz</span>
                        <p className="text-sm">{isStudent ? 'No exams scheduled yet.' : 'No exams scheduled yet. Click "Schedule Exam" to add one.'}</p>
                      </td>
                    </tr>
                  ) : (
                    exams.slice((currentPage-1)*pageSize, currentPage*pageSize).map((exam) => (
                      <tr key={exam._id || exam.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-[#276221] uppercase">{exam.code}</p>
                          <p className="text-sm font-semibold text-slate-900">{exam.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900">{formatDate(exam.date)}</p>
                          <p className="text-xs text-slate-500">{formatTime(exam.time)}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div>{exam.room}</div>
                          {isStudent && exam.seatNumber && (
                            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-1">
                              Seat: {exam.seatNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {exam.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {parseDurationToMinutes(exam.duration) || exam.duration} min
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            exam.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                            exam.status === 'Upcoming' ? 'bg-green-50 text-[#276221]' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {exam.status}
                          </span>
                        </td>
                        {isStudent && (
                          <>
                            <td className="px-6 py-4 text-center">
                              {exam.marks !== undefined && exam.marks !== null ? (
                                <div>
                                  <p className="text-lg font-bold text-slate-900">{exam.marks}/{exam.maxMarks}</p>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                    exam.grade === 'A+' || exam.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                    exam.grade === 'B+' || exam.grade === 'B' ? 'bg-green-100 text-green-700' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    Grade: {exam.grade}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {exam.status === 'Upcoming' && !exam.registered ? (
                                <button
                                  onClick={() => handleRegister(exam._id || exam.id)}
                                  className="px-3 py-1.5 bg-[#276221] text-white rounded-lg text-xs font-semibold hover:bg-[#1e4618] transition-all"
                                >
                                  Register
                                </button>
                              ) : exam.registered ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                  <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                                  Registered
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {exam.status === 'Completed' && exam.resultsPublished ? (
                                <button
                                  onClick={() => handleOpenRevaluation(exam)}
                                  className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-all"
                                  title="Apply for Revaluation"
                                >
                                  Apply
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </>
                        )}
                        {!isStudent && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {isFaculty && (
                                <>
                                  <button
                                    onClick={() => handleOpenMarksEntry(exam)}
                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Enter Marks"
                                  >
                                    <span className="material-symbols-outlined text-lg">edit_note</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenAttendance(exam)}
                                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Mark Attendance"
                                  >
                                    <span className="material-symbols-outlined text-lg">fact_check</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenExamReport(exam)}
                                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                    title="View Report"
                                  >
                                    <span className="material-symbols-outlined text-lg">assessment</span>
                                  </button>
                                  <button
                                    onClick={() => openEditModal(exam)}
                                    className="p-1.5 text-slate-400 hover:text-[#276221] hover:bg-[#276221]/10 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                  </button>
                                </>
                              )}
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleOpenSeatAssignment(exam)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Seat Assignment"
                                  >
                                    <span className="material-symbols-outlined text-lg">event_seat</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenInvigilatorAssign(exam)}
                                    className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                    title="Assign Invigilators"
                                  >
                                    <span className="material-symbols-outlined text-lg">person_add</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenExamReport(exam)}
                                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                    title="View Report"
                                  >
                                    <span className="material-symbols-outlined text-lg">assessment</span>
                                  </button>
                                  <button
                                    onClick={() => openEditModal(exam)}
                                    className="p-1.5 text-slate-400 hover:text-[#276221] hover:bg-[#276221]/10 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(exam._id || exam.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(exams.length / pageSize))}
                onPageChange={setCurrentPage}
                totalItems={exams.length}
                pageSize={pageSize}
                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
              />
            </div>
          )}
        </>
      ) : (
        /* Academic Marks Tab Content */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard icon="military_tech" label="Overall CGPA" value={marksStats.cgpa} colorScheme="emerald" />
            <KpiCard icon="analytics" label="Semester GPA" value={marksStats.gpa} colorScheme="blue" />
            <KpiCard icon="menu_book" label="Total Subjects" value={marksStats.coursesCount} colorScheme="orange" />
            <KpiCard icon="verified" label="Passed Credits" value={`${marksStats.passedCredits} Credits`} colorScheme="purple" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Subject Performance Outcomes</h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Official Academic Record Card</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Student Selector (Admin / Faculty only) */}
                {(isAdmin || isFaculty) && (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 uppercase tracking-wider outline-none cursor-pointer"
                  >
                    <option value="">Select Student</option>
                    {studentsList.map(st => (
                      <option key={st.rollNumber || st.id} value={st.rollNumber || st.id}>
                        {st.name} ({st.rollNumber || st.id})
                      </option>
                    ))}
                  </select>
                )}

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
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Subject Code</th>
                    <th className="px-6 py-4">Subject Name</th>
                    <th className="px-6 py-4">Year</th>
                    <th className="px-6 py-4">Semester</th>
                    <th className="px-6 py-4">Grade</th>
                    <th className="px-6 py-4">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingStudent ? (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <TableSkeleton cols={6} rows={5} />
                      </td>
                    </tr>
                  ) : !selectedStudentId ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <span className="material-symbols-outlined text-5xl mb-2 opacity-20">person</span>
                        <p className="text-sm">Please select a student to see their marks.</p>
                      </td>
                    </tr>
                  ) : filteredSubjects.length > 0 ? (
                    filteredSubjects.map((sub, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">{sub.code}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{sub.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{sub.year || '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{sub.semester ? `Semester ${sub.semester}` : '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                            sub.grade === 'A+' || sub.grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                            sub.grade === 'B+' || sub.grade === 'B' ? 'bg-green-50 text-green-700' :
                            sub.grade === 'F' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'
                          }`}>
                            {sub.grade || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{sub.total !== undefined ? sub.total : '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <span className="material-symbols-outlined text-5xl mb-2 opacity-20">menu_book</span>
                        <p className="text-sm">No subjects recorded for this selection.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingExam ? 'Edit Exam' : 'Schedule New Exam'}
        icon="calendar_add_on"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              onClick={closeModal}
              className="btn-secondary-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary-sm"
            >
              {editingExam ? 'Save Changes' : 'Schedule Exam'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className={labelClasses}>Course Code *</label>
            <input
              type="text" name="code" value={formData.code} onChange={handleInputChange} required
              placeholder="e.g., CS401" className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Course Name *</label>
            <input
              type="text" name="name" value={formData.name} onChange={handleInputChange} required
              placeholder="e.g., Data Structures" className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Date *</label>
            <input
              type="date" name="date" value={formData.date} onChange={handleInputChange} required
              className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Start Time *</label>
            <input
              type="time" name="time" value={formData.time} onChange={handleInputChange} required
              className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Room / Venue *</label>
            <input
              type="text" name="room" value={formData.room} onChange={handleInputChange} required
              placeholder="e.g., Hall A" className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Exam Type</label>
            <select name="type" value={formData.type} onChange={handleInputChange} className={inputClasses}>
              <option value="Mid-Sem">Mid-Semester</option>
              <option value="End-Sem">End-Semester</option>
              <option value="Practical">Practical</option>
              <option value="Internal">Internal Assessment</option>
              <option value="Quiz">Quiz</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Duration (mins)</label>
            <input
              type="number" name="duration" value={formData.duration} onChange={handleInputChange}
              className={inputClasses} placeholder="e.g., 120"
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Maximum Marks</label>
            <input
              type="number" name="maxMarks" value={formData.maxMarks} onChange={handleInputChange}
              className={inputClasses} placeholder="e.g., 100"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className={labelClasses}>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className={inputClasses}>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Exam Module Components */}
      {showMarksEntryModal && selectedExam && (
        <MarksEntryModal
          isOpen={showMarksEntryModal}
          onClose={() => setShowMarksEntryModal(false)}
          exam={selectedExam}
          currentUserId={session?.userId}
        />
      )}

      {showHallTicket && selectedExam && (
        <HallTicket
          exam={selectedExam}
          studentInfo={{
            name: studentRecordForHallTicket?.name || 'Student Name',
            rollNo: session?.userId || 'N/A',
            department: studentRecordForHallTicket?.department || 'Computer Science',
            semester: studentRecordForHallTicket?.semester || selectedExam?.semester || '4',
            photo: null
          }}
          subjects={buildHallTicketSubjects({ mode: hallTicketMode, exam: selectedExam })}
          onClose={() => setShowHallTicket(false)}
        />
      )}

      {showExamSessionModal && (
        <ExamSessionModal
          onClose={() => setShowExamSessionModal(false)}
          onSave={() => {
            setShowExamSessionModal(false);
          }}
        />
      )}

      <TimetableScheduleWizard
        isOpen={showScheduleWizard}
        onClose={() => setShowScheduleWizard(false)}
        onSave={() => {
          setShowScheduleWizard(false);
        }}
      />

      {showInvigilatorModal && selectedExam && (
        <InvigilatorAssignModal
          isOpen={showInvigilatorModal}
          onClose={() => setShowInvigilatorModal(false)}
          exam={selectedExam}
          currentUserId={session?.userId}
        />
      )}

      {showRevaluationModal && selectedExam && (
        <RevaluationModal
          isOpen={showRevaluationModal}
          onClose={() => setShowRevaluationModal(false)}
          exam={selectedExam}
          studentId={session?.userId}
          studentName={session?.name || 'Student Name'}
        />
      )}

      {showExamReportModal && selectedExam && (
        <ExamReportModal
          isOpen={showExamReportModal}
          onClose={() => setShowExamReportModal(false)}
          exam={selectedExam}
        />
      )}

      {showAttendanceModal && selectedExam && (
        <AttendanceModal
          exam={selectedExam}
          onClose={() => setShowAttendanceModal(false)}
          onSave={() => {
            setShowAttendanceModal(false);
          }}
        />
      )}

      {showSeatAssignmentModal && selectedExam && (
        <SeatAssignmentModal
          exam={selectedExam}
          onClose={() => setShowSeatAssignmentModal(false)}
          onSave={() => {
            setShowSeatAssignmentModal(false);
          }}
        />
      )}





      {showNotificationPanel && (
        <NotificationPanel
          studentId={session?.userId}
          isOpen={showNotificationPanel}
          onClose={() => setShowNotificationPanel(false)}
        />
      )}
    </>
  )
  return noLayout ? inner : <Layout title="Exams">{inner}</Layout>
}
