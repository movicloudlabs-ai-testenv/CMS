import { useState, useRef, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import KpiCard from '../components/KpiCard'
import KpiGrid from '../components/KpiGrid'
import { getUserSession } from '../auth/sessionController'
import {
  fetchAttendanceSummary,
  fetchAttendanceWeekly,
  fetchAttendanceMarkings,
  saveAttendanceMarking,
  fetchOdRequests,
  createOdRequest,
  updateOdRequest,
  reviewOdRequestStatus,
  deleteOdRequestById,
} from '../api/attendanceApi'
import { buildApiUrl } from '../api/apiBase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const FALLBACK_WEEKLY = [
  { day: 'Mon', attendance: 92 },
  { day: 'Tue', attendance: 88 },
  { day: 'Wed', attendance: 90 },
  { day: 'Thu', attendance: 86 },
  { day: 'Fri', attendance: 94 },
]

// ─── Attendance helpers ──────────────────────────────────────────────────────
const REQUIRED_PCT = 75

const ATTENDANCE_RANGE_OPTIONS = [
  { id: 'below_75', label: 'Below 75%' },
  { id: '75_to_85', label: '75% - 84.9%' },
  { id: '85_and_above', label: '85% and above' },
]

function calcPct(present, total) {
  if (!total) return 0
  return Number(((present / total) * 100).toFixed(1))
}

function getRiskStatus(pct) {
  if (pct >= 85) return 'Good'
  if (pct >= 75) return 'At Risk'
  return 'Critical'
}

function getEligibilityStatus(pct) {
  return pct >= REQUIRED_PCT ? 'Eligible for Exams' : 'Low Attendance'
}

function getAttendanceCardTone(pct) {
  if (pct >= 85) {
    return {
      card: 'bg-green-50 border-green-200',
      icon: 'text-green-700 bg-green-100',
      label: 'text-green-700',
      value: 'text-green-900',
    }
  }
  if (pct >= 75) {
    return {
      card: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-700 bg-amber-100',
      label: 'text-amber-700',
      value: 'text-amber-900',
    }
  }
  return {
    card: 'bg-red-50 border-red-200',
    icon: 'text-red-700 bg-red-100',
    label: 'text-red-700',
    value: 'text-red-900',
  }
}

function getClassesCanMissCardTone(canMiss, totalClasses) {
  const ratio = totalClasses > 0 ? canMiss / totalClasses : 0

  if (canMiss >= 6 || ratio >= 0.2) {
    return {
      card: 'bg-green-50 border-green-200',
      icon: 'text-green-700 bg-green-100',
      label: 'text-green-700',
      value: 'text-green-900',
    }
  }

  if (canMiss >= 3 || ratio >= 0.1) {
    return {
      card: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-700 bg-amber-100',
      label: 'text-amber-700',
      value: 'text-amber-900',
    }
  }

  return {
    card: 'bg-red-50 border-red-200',
    icon: 'text-red-700 bg-red-100',
    label: 'text-red-700',
    value: 'text-red-900',
  }
}

function classesNeeded(present, total) {
  return Math.max(0, Math.ceil((0.75 * total - present) / 0.25))
}

function safeClasses(present, total) {
  return Math.max(0, Math.floor(present / 0.75 - total))
}

function normalizeId(v) {
  return String(v || '').replace('#', '').trim().toUpperCase()
}

function isInAttendanceRange(pct, rangeId) {
  if (rangeId === 'below_75') return pct < 75
  if (rangeId === '75_to_85') return pct >= 75 && pct < 85
  if (rangeId === '85_and_above') return pct >= 85
  return true
}
// ────────────────────────────────────────────────────────────────────────────

const FALLBACK_STUDENTS = [
  { name: 'John Anderson',  id: '#STU-2024-1547', course: 'Data Structures',   present: 22, total: 24 },
  { name: 'Alice Smith',    id: '#STU-2024-042',  course: 'Discrete Math',     present: 23, total: 24 },
  { name: 'Michael Ross',   id: '#STU-2024-118',  course: 'Database Systems',   present: 18, total: 24 },
  { name: 'Elena Lopez',    id: '#STU-2024-089',  course: 'Tech Writing',       present: 20, total: 24 },
  { name: 'David Kim',      id: '#STU-2024-203',  course: 'Operating Systems',  present: 21, total: 24 },
]

const FALLBACK_STAFF = [
  { name: 'Dr. Rajesh Iyer',     id: '#FAC-204',      department: 'Computer Science',       present: 18, total: 20 },
  { name: 'Lydia Brooks',        id: '#FIN-880',      department: 'Finance Office',          present: 19, total: 20 },
  { name: 'Prof. James Carter',  id: '#STF-2024-002', department: 'Mathematics',             present: 17, total: 20 },
  { name: 'Ms. Sandra Lee',      id: '#STF-2024-003', department: 'English & Tech Writing',  present: 15, total: 20 },
  { name: 'Mr. Robert Hughes',   id: '#STF-2024-004', department: 'Database Systems',        present: 19, total: 20 },
  { name: 'Dr. Fatima Noor',     id: '#STF-2024-005', department: 'Operating Systems',       present: 14, total: 20 },
]

const STAFF_MARK_HOURS = ['Hour 1', 'Hour 2', 'Hour 3', 'Hour 4', 'Hour 5', 'Hour 6', 'Hour 7', 'Hour 8']
const LEAVE_DAYS_STORAGE_KEY = 'cms:academic:leave-days'
const STUDENT_DAILY_LOOKBACK_DAYS = 15
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const HOUR_SLOT_TIMINGS = {
  'Hour 1': '09:00 AM - 09:50 AM',
  'Hour 2': '09:50 AM - 10:40 AM',
  'Hour 3': '10:55 AM - 11:45 AM',
  'Hour 4': '11:45 AM - 12:35 PM',
  'Hour 5': '01:20 PM - 02:10 PM',
  'Hour 6': '02:10 PM - 03:00 PM',
  'Hour 7': '03:10 PM - 04:00 PM',
  'Hour 8': '04:00 PM - 04:50 PM',
}

function getTodayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function shiftISODate(isoDate, daysToShift) {
  const base = new Date(`${isoDate}T12:00:00`)
  base.setDate(base.getDate() + daysToShift)
  return base.toISOString().slice(0, 10)
}

function listISODateRange(fromDate, toDate) {
  if (!fromDate || !toDate) return []

  const start = new Date(`${fromDate}T12:00:00`)
  const end = new Date(`${toDate}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return []

  const result = []
  const cursor = new Date(start)
  while (cursor <= end) {
    result.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}

function formatGridDateLabel(isoDate) {
  const d = new Date(`${isoDate}T12:00:00`)
  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(d)

  const get = (type) => parts.find((item) => item.type === type)?.value || ''
  return `${get('weekday')}, ${get('day')} ${get('month')}, ${get('year')}`
}

function toNormalizedText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function toSemesterNumber(value) {
  const match = String(value || '').match(/\d+/)
  return match ? Number(match[0]) : null
}

function toSectionCode(value) {
  const match = String(value || '').toUpperCase().match(/[A-Z]/)
  return match ? match[0] : null
}

function weekdayCodeFromDate(isoDate) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(`${isoDate}T12:00:00`))
}

function findMatchingTimetableRecord(records, profile) {
  if (!profile || !Array.isArray(records) || records.length === 0) return null

  const wantedDept = toNormalizedText(profile.department)
  const wantedSemester = toSemesterNumber(profile.semester)
  const wantedSection = toSectionCode(profile.section)

  const exact = records.find((record) => {
    const dept = toNormalizedText(record?.dept)
    const semester = toSemesterNumber(record?.semester)
    const section = toSectionCode(record?.section)
    return dept === wantedDept && semester === wantedSemester && section === wantedSection
  })
  if (exact) return exact

  const semSection = records.find((record) => {
    const semester = toSemesterNumber(record?.semester)
    const section = toSectionCode(record?.section)
    return semester === wantedSemester && section === wantedSection
  })
  if (semSection) return semSection

  const sectionOnly = records.find((record) => toSectionCode(record?.section) === wantedSection)
  return sectionOnly || null
}

function buildClassMeta(student) {
  const department = String(student?.department || 'General')
  const year = String(student?.year || 'Year')
  const section = String(student?.section || 'A')
  const classLabel = `${department} - ${year} - Sec ${section}`
  const classId = `${department}__${year}__${section}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return { classId, classLabel }
}

function getOdRequestId(request) {
  return String(request?.requestId || request?.id || '')
}

function readLeaveDaysStorage() {
  try {
    const raw = localStorage.getItem(LEAVE_DAYS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function isWeekendDate(isoDate) {
  const day = new Date(`${isoDate}T12:00:00`).getDay()
  return day === 0
}

function isLeaveDate(isoDate, configuredLeaveDateSet) {
  return configuredLeaveDateSet.has(isoDate) || isWeekendDate(isoDate)
}

function normalizeAttendanceRecord(r) {
  return {
    id: r.personId || r.id || '',
    name: r.name,
    course: r.courseOrDepartment || r.course || '',
    department: r.courseOrDepartment || r.department || '',
    present: r.present,
    total: r.total,
  }
}

function isClassAssigned(classId, classLabel, assignedClasses) {
  if (!assignedClasses || assignedClasses.length === 0) return false;
  
  const normalizedLabel = classLabel.toLowerCase();
  const normalizedId = classId.toLowerCase();
  
  const deptCodes = {
    'cse': ['computer science', 'computer science & engineering', 'computer science and engineering'],
    'ece': ['electronics', 'electronics & communication', 'electronics and communication'],
    'me': ['mechanical', 'mechanical engineering'],
    'ce': ['civil', 'civil engineering'],
    'it': ['information technology'],
    'eee': ['electrical', 'electrical engineering', 'electrical & electronics', 'electrical and electronics']
  };
  
  return assignedClasses.some(ac => {
    const normalizedAc = ac.trim().toLowerCase();
    if (!normalizedAc) return false;
    
    // 1. Direct substring match
    if (normalizedLabel.includes(normalizedAc) || normalizedId.includes(normalizedAc)) {
      return true;
    }
    
    // 2. Abbreviation match, e.g. "CSE-A"
    const parts = normalizedAc.split(/[-_\s]+/);
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts[parts.length - 1];
      if (last.length === 1 && /[a-z]/.test(last)) {
        const studentSec = normalizedId.split('-').pop();
        if (studentSec === last) {
          if (first === 'cs' || first === 'cse') {
            return normalizedId.includes('computer-science') || normalizedId.includes('cse');
          }
          for (const [code, names] of Object.entries(deptCodes)) {
            if (first === code) {
              return names.some(name => normalizedId.includes(name.replace(/\s+/g, '-')));
            }
          }
        }
      }
    }
    
    // 3. Year match
    const matchNum = normalizedAc.match(/\d+/);
    if (matchNum) {
      const num = matchNum[0];
      const yearWords = {
        '1': ['1st', '1', 'first'],
        '2': ['2nd', '2', 'second'],
        '3': ['3rd', '3', 'third'],
        '4': ['4th', '4', 'fourth']
      };
      if (yearWords[num]) {
        return yearWords[num].some(w => normalizedId.includes(w));
      }
    }
    
    return false;
  });
}

function AttendanceTable({ data, type, isAdmin }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            <th className="px-6 py-4">{type === 'staff' ? 'Staff Member' : 'Student'}</th>
            <th className="px-6 py-4">{type === 'staff' ? 'Department' : 'Course'}</th>
            <th className="px-6 py-4">Days Attended</th>
            <th className="px-6 py-4">Attendance %</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">No records found</td>
            </tr>
          )}
          {data.map((s, i) => {
            const pct     = calcPct(s.present, s.total)
            const risk    = getRiskStatus(pct)
            const isStaff = type === 'staff'
            const statusLabel = isStaff
              ? (pct >= 75 ? 'Regular Attendance' : 'Irregular Attendance')
              : getEligibilityStatus(pct)
            const statusGreen = pct >= 75
            const needed  = classesNeeded(s.present, s.total)
            const safe    = safeClasses(s.present, s.total)
            return (
              <tr
                key={s.id}
                className="hover:bg-slate-50 transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.id}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{isStaff ? s.department : s.course}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#276221] transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600">{s.present}/{s.total}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Progress: {pct}%</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold">{pct}%</p>
                  <p className={`text-xs mt-1 font-medium ${statusGreen ? 'text-green-700' : 'text-red-600'}`}>
                    {statusLabel}
                  </p>
                  {!statusGreen ? (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isStaff ? `Attend ${needed} more sessions to reach 75%.` : `Attend ${needed} more classes to reach 75%.`}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isStaff ? `Can miss ${safe} more sessions and stay ≥75%.` : `Can miss ${safe} more and still stay ≥75%.`}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  {isAdmin ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      risk === 'Good'    ? 'bg-green-100 text-green-800'   :
                      risk === 'At Risk' ? 'bg-orange-100 text-orange-800' :
                                          'bg-red-100 text-red-800'
                    }`}>{risk}</span>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusGreen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>{statusLabel}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function AttendancePage({ noLayout = false }) {
  const session       = getUserSession()
  const role          = session?.role || 'student'
  const sessionUserId = session?.userId || ''
  const isAdmin       = role === 'admin'
  const isStudent     = role === 'student'
  const isFaculty     = role === 'faculty'

  const [activeTab,               setActiveTab]               = useState('students')
  const [studentViewTab,          setStudentViewTab]          = useState('my')
  const [staffViewTab,            setStaffViewTab]            = useState('my')
  const [selectedStatuses,        setSelectedStatuses]        = useState([])
  const [selectedAttendanceRange, setSelectedAttendanceRange] = useState([])
  const [selectedCourses,         setSelectedCourses]         = useState([])
  const [activeFilterTab,         setActiveFilterTab]         = useState('status')
  const [filterOpen,              setFilterOpen]              = useState(false)
  const [searchQuery,             setSearchQuery]             = useState('')
  const filterRef = useRef(null)
  const odProofInputRef = useRef(null)

  const [studentData,      setStudentData]      = useState(FALLBACK_STUDENTS)
  const [staffData,        setStaffData]        = useState(FALLBACK_STAFF)
  const [studentWeeklyAttendance, setStudentWeeklyAttendance] = useState(FALLBACK_WEEKLY)
  const [staffWeeklyAttendance, setStaffWeeklyAttendance] = useState(FALLBACK_WEEKLY)

  const [classOptions,     setClassOptions]     = useState([])
  const [classStudentsMap, setClassStudentsMap] = useState({})
  const [selectedClassId,  setSelectedClassId]  = useState('')
  const [attendanceDate,   setAttendanceDate]   = useState(getTodayISODate())
  const [attendanceHour,   setAttendanceHour]   = useState(STAFF_MARK_HOURS[0])
  const [markRows,         setMarkRows]         = useState([])
  const [markNotice,       setMarkNotice]       = useState('')
  const [studentDailyDate, setStudentDailyDate] = useState(getTodayISODate())
  const [studentMarkings, setStudentMarkings] = useState([])
  const [studentClassProfile, setStudentClassProfile] = useState(null)
  const [studentTimetableRecord, setStudentTimetableRecord] = useState(null)
  const [studentOdRequests, setStudentOdRequests] = useState([])
  const [facultyOdRequests, setFacultyOdRequests] = useState([])
  const [odApplyFromDate, setOdApplyFromDate] = useState('')
  const [odApplyToDate, setOdApplyToDate] = useState('')
  const [odApplyReason, setOdApplyReason] = useState('')
  const [odApplyType, setOdApplyType] = useState('')
  const [odApplyHours, setOdApplyHours] = useState([])
  const [odProofFileData, setOdProofFileData] = useState('')
  const [odProofFileName, setOdProofFileName] = useState('')
  const [odNotice, setOdNotice] = useState('')
  const [odEditingRequestId, setOdEditingRequestId] = useState('')
  const [facultyOdNotice, setFacultyOdNotice] = useState('')
  const [viewingProofUrl, setViewingProofUrl] = useState('')
  const [facultyCourses, setFacultyCourses] = useState([])
  const [classTimetable, setClassTimetable] = useState(null)

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const [students, staff, weeklyStudents, weeklyStaff] = await Promise.all([
          fetchAttendanceSummary('student'),
          fetchAttendanceSummary('staff'),
          fetchAttendanceWeekly('student'),
          fetchAttendanceWeekly('staff'),
        ])
        if (students.length > 0) setStudentData(students.map(normalizeAttendanceRecord))
        if (staff.length > 0) setStaffData(staff.map(normalizeAttendanceRecord))
        if (weeklyStudents.length > 0) setStudentWeeklyAttendance(weeklyStudents)
        if (weeklyStaff.length > 0) setStaffWeeklyAttendance(weeklyStaff)
      } catch (err) {
        console.error('Failed to fetch attendance data:', err)
      }
    }
    fetchAttendance()
  }, [])

  useEffect(() => {
    if (!isFaculty && !isStudent) return

    let cancelled = false

    async function fetchClassStudents() {
      try {
        let rawAssigned = []
        if (isFaculty) {
          const profileRes = await fetch(buildApiUrl(`/faculty/${sessionUserId}`))
          if (profileRes.ok) {
            const profile = await profileRes.json()
            const assigned = profile?.assignedClasses || profile?.classes || []
            rawAssigned = Array.isArray(assigned) 
              ? assigned 
              : (typeof assigned === 'string' ? assigned.split(',').map(s => s.trim()).filter(Boolean) : [])
            
            const courses = profile?.courses || []
            const rawCourses = Array.isArray(courses)
              ? courses
              : (typeof courses === 'string' ? courses.split(',').map(s => s.trim()).filter(Boolean) : [])
            setFacultyCourses(rawCourses)
          }
        }

        const res = await fetch(buildApiUrl('/students'))
        const json = await res.json().catch(() => null)
        const students = Array.isArray(json)
          ? json
          : (Array.isArray(json?.data) ? json.data : [])

        const grouped = {}

        students.forEach((student) => {
          const { classId, classLabel } = buildClassMeta(student)
          if (!grouped[classId]) grouped[classId] = { id: classId, label: classLabel, students: [] }

          grouped[classId].students.push({
            id: student.id || student.rollNumber || student._id || '',
            rollNumber: student.rollNumber || student.id || '-',
            name: student.name || 'Unnamed Student',
          })
        })

        const groupedList = Object.values(grouped)
          .map((item) => ({
            ...item,
            students: [...item.students].sort((a, b) => String(a.rollNumber).localeCompare(String(b.rollNumber))),
          }))
          .filter((item) => {
            if (isFaculty) {
              return isClassAssigned(item.id, item.label, rawAssigned)
            }
            return true;
          })
          .sort((a, b) => a.label.localeCompare(b.label))

        const nextOptions = groupedList.map(({ id, label }) => ({ id, label }))
        const nextMap = groupedList.reduce((acc, item) => {
          acc[item.id] = item.students
          return acc
        }, {})

        if (cancelled) return

        setClassOptions(nextOptions)
        setClassStudentsMap(nextMap)
        setSelectedClassId((prev) => {
          if (isStudent) {
            const myStudent = students.find((student) =>
              normalizeId(student.id || student.rollNumber) === normalizeId(sessionUserId)
            )
            if (myStudent) {
              setStudentClassProfile({
                department: myStudent.department,
                semester: myStudent.semester || myStudent.year,
                section: myStudent.section,
              })
              return buildClassMeta(myStudent).classId
            }
            return prev || nextOptions[0]?.id || ''
          }
          if (prev && nextMap[prev]) return prev
          return nextOptions[0]?.id || ''
        })
      } catch (err) {
        console.error('Failed to fetch class students for attendance:', err)
      }
    }

    fetchClassStudents()

    return () => {
      cancelled = true
    }
  }, [isFaculty, isStudent, sessionUserId])

  useEffect(() => {
    if (!isStudent || !studentClassProfile) return

    let cancelled = false

    async function fetchStudentTimetable() {
      try {
        const res = await fetch(buildApiUrl('/academics/timetable'))
        const json = await res.json().catch(() => null)
        const records = Array.isArray(json?.data) ? json.data : []
        const matched = findMatchingTimetableRecord(records, studentClassProfile)
        if (!cancelled) {
          setStudentTimetableRecord(matched)
        }
      } catch (err) {
        console.error('Failed to fetch timetable for attendance tooltip:', err)
      }
    }

    fetchStudentTimetable()

    return () => {
      cancelled = true
    }
  }, [isStudent, studentClassProfile])

  async function refreshStudentOdRequests() {
    if (!isStudent) return
    try {
      const scoped = await fetchOdRequests({ studentId: sessionUserId })
      const sorted = scoped
        .slice()
        .sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')))
      setStudentOdRequests(sorted)
    } catch (err) {
      console.error('Failed to load student OD requests:', err)
      setOdNotice(err?.message || 'Failed to load OD requests.')
    }
  }

  async function refreshFacultyOdRequests(notice = '') {
    if (!isFaculty) return
    try {
      const allRequests = await fetchOdRequests()
      const sorted = allRequests
        .slice()
        .sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')))
      setFacultyOdRequests(sorted)
      if (notice) setFacultyOdNotice(notice)
    } catch (err) {
      console.error('Failed to load faculty OD requests:', err)
      setFacultyOdNotice(err?.message || 'Failed to load OD requests.')
    }
  }

  useEffect(() => {
    if (!isStudent) return
    refreshStudentOdRequests()
  }, [isStudent, sessionUserId])

  useEffect(() => {
    if (!isFaculty) return
    refreshFacultyOdRequests()
  }, [isFaculty])

  useEffect(() => {
    if (!isStudent) return

    let cancelled = false

    async function fetchStudentMarkings() {
      try {
        const rows = await fetchAttendanceMarkings({ studentId: sessionUserId })
        if (!cancelled) setStudentMarkings(rows)
      } catch (err) {
        console.error('Failed to load student attendance markings:', err)
      }
    }

    fetchStudentMarkings()

    return () => {
      cancelled = true
    }
  }, [isStudent, sessionUserId])

  useEffect(() => {
    if (!isFaculty || staffViewTab !== 'mark') return

    const studentsForClass = classStudentsMap[selectedClassId] || []
    const baseRows = studentsForClass.map((student) => ({ ...student, status: 'Present' }))

    if (!selectedClassId || !attendanceDate || !attendanceHour) {
      setMarkRows(baseRows)
      return
    }

    let cancelled = false

    async function fetchMarkedRows() {
      try {
        const records = await fetchAttendanceMarkings({
          classId: selectedClassId,
          date: attendanceDate,
          hour: attendanceHour,
        })
        const latest = Array.isArray(records) && records.length > 0 ? records[0] : null
        const savedEntries = Array.isArray(latest?.entries) ? latest.entries : []

        if (savedEntries.length === 0) {
          if (!cancelled) setMarkRows(baseRows)
          return
        }

        const statusByStudent = savedEntries.reduce((acc, item) => {
          if (item?.studentId) acc[item.studentId] = item.status
          return acc
        }, {})

        if (!cancelled) {
          setMarkRows(baseRows.map((student) => ({
            ...student,
            status: statusByStudent[student.id] === 'Absent' ? 'Absent' : 'Present',
          })))
        }
      } catch (err) {
        console.error('Failed to load marked attendance rows:', err)
        if (!cancelled) {
          setMarkRows(baseRows)
          setMarkNotice(err?.message || 'Failed to load attendance record.')
        }
      }
    }

    fetchMarkedRows()

    return () => {
      cancelled = true
    }
  }, [isFaculty, staffViewTab, classStudentsMap, selectedClassId, attendanceDate, attendanceHour])

  useEffect(() => {
    if (!selectedClassId) {
      setClassTimetable(null)
      return
    }
    let cancelled = false
    async function fetchTimetable() {
      try {
        const res = await fetch(buildApiUrl(`/academics/timetable/${selectedClassId}`))
        if (res.ok) {
          const json = await res.json()
          if (!cancelled) setClassTimetable(json?.data || null)
        } else {
          if (!cancelled) setClassTimetable(null)
        }
      } catch (err) {
        console.error('Failed to fetch timetable for class:', err)
        if (!cancelled) setClassTimetable(null)
      }
    }
    fetchTimetable()
    return () => { cancelled = true }
  }, [selectedClassId])

  const hourSubjectAndInstructor = useMemo(() => {
    if (!classTimetable || !attendanceDate || !attendanceHour) return null
    const dayCode = weekdayCodeFromDate(attendanceDate)
    const dayIndex = WEEK_DAYS.indexOf(dayCode)
    const slotIndex = STAFF_MARK_HOURS.indexOf(attendanceHour)
    if (dayIndex === -1 || slotIndex === -1) return null
    
    const slot = classTimetable?.slots?.[slotIndex]?.[dayIndex]
    if (!slot || (!slot.code && !slot.name && !slot.label)) return null
    return {
      code: slot.code || '',
      name: slot.name || slot.label || '',
      instructor: slot.instructor || ''
    }
  }, [classTimetable, attendanceDate, attendanceHour])

  const isFacultyAssignedToHour = useMemo(() => {
    if (!isFaculty) return true
    if (!hourSubjectAndInstructor) return true
    
    const { code, name, instructor } = hourSubjectAndInstructor
    const facultyName = session?.name || ''
    
    if (instructor && (
      instructor.toLowerCase().includes(sessionUserId.toLowerCase()) ||
      instructor.toLowerCase().includes(facultyName.toLowerCase())
    )) {
      return true
    }
    
    if (facultyCourses && facultyCourses.length > 0) {
      return facultyCourses.some(fc => {
        const fcNorm = fc.toLowerCase()
        return (code && code.toLowerCase().includes(fcNorm)) || 
               (name && name.toLowerCase().includes(fcNorm)) ||
               fcNorm.includes(code.toLowerCase()) ||
               fcNorm.includes(name.toLowerCase())
      })
    }
    
    return true
  }, [isFaculty, hourSubjectAndInstructor, facultyCourses, sessionUserId, session])

  // Scope records: non-admin sees only their own row
  const scopedStudents = isAdmin
    ? studentData
    : studentData.filter(e => normalizeId(e.id) === normalizeId(sessionUserId))

  const scopedStaff = isAdmin
    ? staffData
    : staffData.filter(e => normalizeId(e.id) === normalizeId(sessionUserId))

  const currentTabData   = isStudent ? scopedStudents : (isAdmin ? (activeTab === 'students' ? scopedStudents : scopedStaff) : scopedStaff)
  const currentTableType = isStudent ? 'student'      : (isAdmin ? (activeTab === 'students' ? 'student' : 'staff') : 'staff')
  const statusOptions = isAdmin
    ? ['Good', 'At Risk', 'Critical']
    : ['Eligible for Exams', 'Low Attendance']

  const courseOptions = Array.from(
    new Set(
      currentTabData
        .map((item) => (currentTableType === 'staff' ? item.department : item.course))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b))

  const activeFilterCount =
    selectedStatuses.length + selectedAttendanceRange.length + selectedCourses.length

  const filterTabs = [
    { id: 'status', label: 'Status' },
    { id: 'attendance', label: 'Attendance %' },
    { id: 'course', label: currentTableType === 'staff' ? 'Department' : 'Course' },
  ]

  const showStudentDailyView = isStudent && studentViewTab === 'daily'
  const showStudentOdApplyView = isStudent && studentViewTab === 'od'
  const showStaffMarkingView = isFaculty && staffViewTab === 'mark'
  const showFacultyOdManageView = isFaculty && staffViewTab === 'od'
  const pendingFacultyOdCount = facultyOdRequests.filter((request) => String(request?.status || 'Pending') === 'Pending').length

  const studentLookupById = (() => {
    const lookup = {}
    Object.values(classStudentsMap).forEach((students) => {
      if (!Array.isArray(students)) return
      students.forEach((student) => {
        const key = normalizeId(student?.id || student?.rollNumber)
        if (!key) return
        if (!lookup[key]) {
          lookup[key] = {
            name: student?.name || 'Student',
            rollNumber: student?.rollNumber || student?.id || '-',
          }
        }
      })
    })
    return lookup
  })()

  const selectedClassLabel =
    classOptions.find((option) => option.id === selectedClassId)?.label || 'Select class'

  const presentCount = markRows.filter((row) => row.status === 'Present').length
  const absentCount = markRows.filter((row) => row.status === 'Absent').length

  const approvedOdKeySet = (() => {
    if (!isStudent) return new Set()
    const approved = studentOdRequests.filter((request) => request?.status === 'Approved')
    const keys = []
    approved.forEach((request) => {
      const fromDate = request?.fromDate || request?.date
      const toDate = request?.toDate || request?.date
      const dates = listISODateRange(fromDate, toDate)
      const hours = Array.isArray(request?.hours) ? request.hours : []
      dates.forEach((date) => {
        hours.forEach((hour) => {
          keys.push(`${date}::${hour}`)
        })
      })
    })
    return new Set(keys)
  })()

  const studentDailyGridRows = (() => {
    if (!isStudent) return []

    const currentStudentId = normalizeId(sessionUserId)
    const statusMap = {}

    studentMarkings.forEach((record) => {
      if (!record || !record.date || !record.hour || !Array.isArray(record.entries)) return

      const matched = record.entries.find((entry) => {
        const entryId = normalizeId(entry?.studentId || entry?.rollNumber)
        return entryId === currentStudentId
      })

      if (!matched) return

      const key = `${record.date}::${record.hour}`
      const incomingStatus = matched.status === 'Absent' ? 'Absent' : 'Present'
      const existing = statusMap[key]

      // If multiple records exist for same date/hour, Absent takes precedence.
      statusMap[key] = existing === 'Absent' || incomingStatus === 'Absent' ? 'Absent' : 'Present'
    })

    const rows = []
    let dayOffset = 0

    while (rows.length < STUDENT_DAILY_LOOKBACK_DAYS) {
      const date = shiftISODate(studentDailyDate, -dayOffset)
      dayOffset += 1

      // Sunday is excluded from the daily attendance view.
      if (new Date(`${date}T12:00:00`).getDay() === 0) continue

      const hours = STAFF_MARK_HOURS.map((hour) => {
        const cellKey = `${date}::${hour}`
        const isApprovedOd = approvedOdKeySet.has(cellKey)
        const baseStatus = statusMap[cellKey] || 'Not Marked'
        // Approved OD has highest priority in student view, irrespective of faculty mark.
        const status = isApprovedOd ? 'On Duty' : baseStatus
        return { hour, status }
      })

      rows.push({
        date,
        label: formatGridDateLabel(date),
        isToday: date === getTodayISODate(),
        hours,
      })
    }

    return rows
  })()

  const approvedOdCountForSummary = (() => {
    if (!isStudent) return 0
    const my = scopedStudents[0]
    if (!my || !my.total) return 0

    // OD should not reduce attendance: treat approved OD as present.
    return Math.max(0, Math.min(my.total, approvedOdKeySet.size))
  })()

  const myEffectiveAttendance = (() => {
    const my = scopedStudents[0]
    if (!my) return { present: 0, total: 0 }
    return {
      present: my.present,
      total: my.total,
    }
  })()

  const selectedDailyRow = (() => {
    if (!isStudent) return null
    return studentDailyGridRows.find((row) => row.date === studentDailyDate) || studentDailyGridRows[0] || null
  })()

  const dailySummaryCounts = (() => {
    if (!selectedDailyRow) return { present: 0, absent: 0, od: 0 }
    const summary = { present: 0, absent: 0, od: 0 }
    selectedDailyRow.hours.forEach((cell) => {
      if (cell.status === 'Present') summary.present += 1
      else if (cell.status === 'Absent') summary.absent += 1
      else if (cell.status === 'On Duty') summary.od += 1
    })
    return summary
  })()

  const odSummaryCounts = (() => {
    if (!isStudent) return { applied: 0, approved: 0, pending: 0 }
    const applied = studentOdRequests.length
    const approved = studentOdRequests.filter((request) => request?.status === 'Approved').length
    const pending = studentOdRequests.filter((request) => request?.status === 'Pending').length
    return { applied, approved, pending }
  })()

  function getTimetableSubjectForCell(dateIso, hourLabel) {
    if (!studentTimetableRecord) return 'Subject not available'

    const dayCode = weekdayCodeFromDate(dateIso)
    const dayIndex = WEEK_DAYS.indexOf(dayCode)
    if (dayIndex === -1) return 'No class scheduled'

    const slotIndex = STAFF_MARK_HOURS.indexOf(hourLabel)
    if (slotIndex === -1) return 'No class scheduled'

    const slotEntry = studentTimetableRecord?.slots?.[slotIndex]?.[dayIndex]
    if (!slotEntry || (!slotEntry.code && !slotEntry.name && !slotEntry.label)) return 'No class scheduled'

    const code = String(slotEntry.code || '').trim()
    const name = String(slotEntry.name || slotEntry.label || '').trim()

    if (code && name) return `${code} - ${name}`
    return code || name || 'No class scheduled'
  }

  function setStudentAttendanceStatus(studentId, status) {
    setMarkRows((prev) =>
      prev.map((row) =>
        row.id === studentId
          ? { ...row, status: status === 'Absent' ? 'Absent' : 'Present' }
          : row
      )
    )
    setMarkNotice('')
  }

  async function saveMarkedAttendance() {
    if (!selectedClassId || markRows.length === 0) {
      setMarkNotice('No students available for the selected class.')
      return
    }

    try {
      await saveAttendanceMarking({
        classId: selectedClassId,
        classLabel: selectedClassLabel,
        date: attendanceDate,
        hour: attendanceHour,
        markedBy: sessionUserId,
        markedAt: new Date().toISOString(),
        entries: markRows.map((row) => ({
          studentId: row.id,
          rollNumber: row.rollNumber,
          name: row.name,
          status: row.status,
        })),
      })
      setMarkNotice(`Saved attendance for ${selectedClassLabel} on ${attendanceDate} (${attendanceHour}).`)
    } catch (err) {
      console.error('Failed to save attendance marking:', err)
      setMarkNotice(err?.message || 'Failed to save attendance.')
    }
  }

  function toggleOdHour(hour) {
    setOdApplyHours((prev) => {
      if (prev.includes(hour)) {
        if (prev.length === 1) return prev
        return prev.filter((item) => item !== hour)
      }
      return [...prev, hour]
    })
    setOdNotice('')
  }

  function resetOdForm() {
    setOdApplyFromDate('')
    setOdApplyToDate('')
    setOdApplyReason('')
    setOdApplyType('')
    setOdApplyHours([])
    setOdProofFileData('')
    setOdProofFileName('')
    setOdEditingRequestId('')
    if (odProofInputRef.current) {
      odProofInputRef.current.value = ''
    }
  }

  async function setFacultyOdStatus(request, status) {
    if (!request) return
    const normalizedStatus = status === 'Approved' ? 'Approved' : 'Rejected'
    const requestId = getOdRequestId(request)
    if (!requestId) return

    try {
      await reviewOdRequestStatus(requestId, {
        status: normalizedStatus,
        reviewedBy: sessionUserId,
      })
      await refreshFacultyOdRequests(`OD request ${normalizedStatus.toLowerCase()} successfully.`)
    } catch (err) {
      console.error('Failed to review OD request:', err)
      setFacultyOdNotice(err?.message || 'Failed to update OD request status.')
    }
  }

  function startOdEdit(request) {
    if (!request || request.status === 'Approved') return
    const requestHours = Array.isArray(request.hours) ? request.hours : []
    const isFullDay = requestHours.length === STAFF_MARK_HOURS.length && STAFF_MARK_HOURS.every((hour) => requestHours.includes(hour))
    const fromDate = request.fromDate || request.date || ''
    const toDate = request.toDate || request.date || ''
    const requestId = getOdRequestId(request)

    setOdEditingRequestId(requestId)
    setOdApplyFromDate(fromDate)
    setOdApplyToDate(toDate)
    setOdApplyReason(request.reason || '')
    setOdApplyType(isFullDay ? 'full_day' : 'specific')
    setOdApplyHours(requestHours.length > 0 ? requestHours : [])
    setOdProofFileData(request.proofImageData || '')
    setOdProofFileName(request.proofImageName || '')
    setOdNotice('Editing pending OD request.')
  }

  async function deleteOdRequest(request) {
    if (!request || request.status === 'Approved') return
    const requestId = getOdRequestId(request)
    if (!requestId) return

    try {
      await deleteOdRequestById(requestId)
      await refreshStudentOdRequests()

      if (odEditingRequestId === requestId) {
        resetOdForm()
      }
      setOdNotice('Pending OD request deleted.')
    } catch (err) {
      console.error('Failed to delete OD request:', err)
      setOdNotice(err?.message || 'Failed to delete OD request.')
    }
  }

  function handleOdProofChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      setOdProofFileData('')
      setOdProofFileName('')
      return
    }

    if (!String(file.type || '').startsWith('image/')) {
      setOdNotice('Only image proof files are allowed (jpg, jpeg, png, webp).')
      setOdProofFileData('')
      setOdProofFileName('')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      setOdProofFileData(result)
      setOdProofFileName(file.name)
      setOdNotice('')
    }
    reader.onerror = () => {
      setOdNotice('Failed to read OD proof image. Try again.')
      setOdProofFileData('')
      setOdProofFileName('')
    }
    reader.readAsDataURL(file)
  }

  async function submitOdRequest() {
    const trimmedReason = odApplyReason.trim()
    if (!odApplyFromDate || !odApplyToDate) {
      setOdNotice('Select OD from date and to date.')
      return
    }
    if (odApplyFromDate > odApplyToDate) {
      setOdNotice('To date should be same as or after from date.')
      return
    }
    if (!odApplyType) {
      setOdNotice('Select OD type before submitting.')
      return
    }
    if (odApplyType === 'specific' && odApplyHours.length === 0) {
      setOdNotice('Select at least one hour for OD request.')
      return
    }
    if (!trimmedReason) {
      setOdNotice('Enter OD reason before submitting.')
      return
    }
    if (!odProofFileData) {
      setOdNotice('Upload OD proof in image format before submitting.')
      return
    }

    const allRequests = studentOdRequests
    const selectedDates = listISODateRange(odApplyFromDate, odApplyToDate)
    if (selectedDates.length === 0) {
      setOdNotice('Invalid OD date range. Select valid from/to dates.')
      return
    }

    const configuredLeaveDates = new Set(
      readLeaveDaysStorage().map((value) => String(value || '').trim()).filter(Boolean)
    )
    const leaveDaysInRange = selectedDates.filter((date) => isLeaveDate(date, configuredLeaveDates))
    if (selectedDates.length === 1 && leaveDaysInRange.length > 0) {
      const joined = leaveDaysInRange.join(', ')
      setOdNotice(`Single-day OD cannot be applied on leave day (${joined}).`)
      return
    }

    const selectedHours = odApplyType === 'full_day' ? [...STAFF_MARK_HOURS] : [...odApplyHours]
    const sortedHours = selectedHours.sort((a, b) => STAFF_MARK_HOURS.indexOf(a) - STAFF_MARK_HOURS.indexOf(b))

    const hasDuplicateHour = allRequests.some((request) => {
      if (normalizeId(request?.studentId) !== normalizeId(sessionUserId)) return false
      if (getOdRequestId(request) === odEditingRequestId) return false
      const requestFromDate = request?.fromDate || request?.date
      const requestToDate = request?.toDate || request?.date
      const requestDates = listISODateRange(requestFromDate, requestToDate)
      const hasOverlapDate = requestDates.some((date) => selectedDates.includes(date))
      if (!hasOverlapDate) return false
      const requestHours = Array.isArray(request?.hours) ? request.hours : []
      return requestHours.some((hour) => sortedHours.includes(hour))
    })

    if (hasDuplicateHour) {
      setOdNotice('OD already exists for one or more selected hours on this date. Duplicate OD is not allowed.')
      return
    }

    if (odEditingRequestId) {
      const existing = allRequests.find((item) => getOdRequestId(item) === odEditingRequestId)
      if (existing?.status === 'Approved') {
        setOdNotice('Approved OD request cannot be edited.')
        return
      }

      try {
        await updateOdRequest(odEditingRequestId, {
          studentId: sessionUserId,
          fromDate: odApplyFromDate,
          toDate: odApplyToDate,
          hours: sortedHours,
          reason: trimmedReason,
          proofImageData: odProofFileData,
          proofImageName: odProofFileName,
          status: existing?.status || 'Pending',
          createdAt: existing?.createdAt,
          reviewedBy: existing?.reviewedBy,
          reviewedAt: existing?.reviewedAt,
        })
        await refreshStudentOdRequests()
        resetOdForm()
        setOdNotice('Pending OD request updated successfully.')
      } catch (err) {
        console.error('Failed to update OD request:', err)
        setOdNotice(err?.message || 'Failed to update OD request.')
      }
      return
    }

    try {
      await createOdRequest({
        studentId: sessionUserId,
        fromDate: odApplyFromDate,
        toDate: odApplyToDate,
        hours: sortedHours,
        reason: trimmedReason,
        proofImageData: odProofFileData,
        proofImageName: odProofFileName,
        status: 'Pending',
      })
      await refreshStudentOdRequests()
      resetOdForm()
      setOdNotice('OD submitted successfully. You can edit or delete it until faculty approval.')
    } catch (err) {
      console.error('Failed to submit OD request:', err)
      setOdNotice(err?.message || 'Failed to submit OD request.')
    }
  }

  function toggleFilterValue(value, setter) {
    setter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    )
  }

  function clearAllFilters() {
    setSelectedStatuses([])
    setSelectedAttendanceRange([])
    setSelectedCourses([])
  }

  const filteredData = currentTabData.filter(s => {
    const pct = calcPct(s.present, s.total)
    const statusValue = isAdmin ? getRiskStatus(pct) : getEligibilityStatus(pct)
    const courseValue = currentTableType === 'staff' ? s.department : s.course

    const statusMatch =
      selectedStatuses.length === 0 || selectedStatuses.includes(statusValue)
    const attendanceRangeMatch =
      selectedAttendanceRange.length === 0 ||
      selectedAttendanceRange.some((rangeId) => isInAttendanceRange(pct, rangeId))
    const courseMatch =
      selectedCourses.length === 0 || selectedCourses.includes(courseValue)
    const searchMatch = s.name.toLowerCase().includes(searchQuery.toLowerCase())

    return statusMatch && attendanceRangeMatch && courseMatch && searchMatch
  })

  const summaryData = isAdmin
    ? (activeTab === 'students' ? scopedStudents : scopedStaff)
    : scopedStaff
  const summaryLabel = isAdmin
    ? (activeTab === 'students' ? 'Students' : 'Staff')
    : 'Staff'
  const selectedWeeklyAttendance = isStudent
    ? studentWeeklyAttendance
    : (isAdmin
      ? (activeTab === 'students' ? studentWeeklyAttendance : staffWeeklyAttendance)
      : staffWeeklyAttendance)

  function csvCell(value) {
    const text = String(value ?? '')
    const escaped = text.replace(/"/g, '""')
    return `"${escaped}"`
  }

  function exportAttendanceReport() {
    if (!isAdmin) return

    const reportType = currentTableType === 'staff' ? 'staff' : 'students'
    const rows = filteredData.map((entry) => {
      const pct = calcPct(entry.present, entry.total)
      const statusValue = getRiskStatus(pct)
      return [
        entry.name,
        entry.id,
        currentTableType === 'staff' ? entry.department : entry.course,
        entry.present,
        entry.total,
        `${pct}%`,
        statusValue,
      ]
    })

    const headers = [
      'Name',
      'ID',
      currentTableType === 'staff' ? 'Department' : 'Course',
      'Days Attended',
      'Total Days',
      'Attendance %',
      'Status',
    ]

    const csvLines = [
      ['Attendance Report', new Date().toLocaleString()].map(csvCell).join(','),
      ['Report Type', reportType].map(csvCell).join(','),
      ['Applied Search', searchQuery || 'None'].map(csvCell).join(','),
      ['Status Filters', selectedStatuses.join(' | ') || 'All'].map(csvCell).join(','),
      ['Attendance Filters', selectedAttendanceRange.join(' | ') || 'All'].map(csvCell).join(','),
      ['Course/Department Filters', selectedCourses.join(' | ') || 'All'].map(csvCell).join(','),
      '',
      headers.map(csvCell).join(','),
      ...rows.map((row) => row.map(csvCell).join(',')),
    ]

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dayStamp = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `attendance-report-${reportType}-${dayStamp}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    setSelectedCourses((prev) => {
      const next = prev.filter((course) => courseOptions.includes(course))
      return next.length === prev.length ? prev : next
    })
  }, [courseOptions])

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const inner = (
    <>
      {isAdmin && (
        <div className="flex justify-start mb-6">
          <button
            onClick={exportAttendanceReport}
            className="flex items-center gap-2 px-4 py-2 bg-[#276221] text-white rounded-lg text-sm font-semibold hover:bg-[#276221]/90"
          >
            <span className="material-symbols-outlined text-lg">download</span>Export Report
          </button>
        </div>
      )}

      {(() => {
        if (isStudent) {
          const my = scopedStudents[0]
          if (!my) return null
          const pct      = calcPct(myEffectiveAttendance.present, myEffectiveAttendance.total)
          const canMiss  = safeClasses(myEffectiveAttendance.present, myEffectiveAttendance.total)
          const attendanceTone = getAttendanceCardTone(pct)
          const canMissTone = getClassesCanMissCardTone(canMiss, myEffectiveAttendance.total)

          if (showStudentDailyView) {
            return (
              <KpiGrid className="lg:grid-cols-3">
                <KpiCard icon="check_circle" label="Present (Selected Date)" value={dailySummaryCounts.present} colorScheme="green" />
                <KpiCard icon="cancel" label="Absent (Selected Date)" value={dailySummaryCounts.absent} colorScheme="red" />
                <KpiCard icon="event_available" label="OD (Selected Date)" value={dailySummaryCounts.od} colorScheme="green" />
              </KpiGrid>
            )
          }

          if (showStudentOdApplyView) {
            return (
              <KpiGrid className="lg:grid-cols-3">
                <KpiCard icon="assignment" label="OD Applied" value={odSummaryCounts.applied} colorScheme="green" />
                <KpiCard icon="verified" label="OD Approved" value={odSummaryCounts.approved} colorScheme="green" />
                <KpiCard icon="hourglass_top" label="OD Pending" value={odSummaryCounts.pending} colorScheme="amber" />
              </KpiGrid>
            )
          }

          return (
            <KpiGrid className="lg:grid-cols-3">
              <KpiCard icon="calendar_today" label="Total Classes" value={myEffectiveAttendance.total} colorScheme="blue" />
              <KpiCard icon="percent" label="Attendance %" value={`${pct}%`} colorScheme="green" />
              <KpiCard icon="event_available" label="Classes Can Miss" value={canMiss} colorScheme="orange" />
            </KpiGrid>
          )
        }
        // Faculty / Admin view
        const avgPct      = summaryData.length
          ? Number((summaryData.reduce((acc, s) => acc + calcPct(s.present, s.total), 0) / summaryData.length).toFixed(1))
          : 0
        const below75     = summaryData.filter(s => calcPct(s.present, s.total) < 75).length
        const totalPeople = summaryData.length
        const isStudentSummary = summaryLabel === 'Students'
        return (
          <KpiGrid className="lg:grid-cols-3">
            <KpiCard icon={isStudentSummary ? 'school' : 'badge'} label={isStudentSummary ? 'Total Students' : 'Total Staff'} value={totalPeople} colorScheme="blue" />
            <KpiCard icon="bar_chart" label="Average Attendance %" value={`${avgPct}%`} colorScheme="green" />
            <KpiCard icon="warning" label={`${summaryLabel} Below 75%`} value={below75} colorScheme="red" />
          </KpiGrid>
        )
      })()}

      {
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
          <p className="text-sm font-semibold text-slate-700 mb-4">
            {isStudent
              ? showStudentDailyView
                ? 'Daily Status Summary'
                : showStudentOdApplyView
                  ? 'OD Request Summary'
                  : 'Weekly Attendance Trend'
              : 'Weekly Attendance Trend'}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={
                isStudent
                  ? showStudentDailyView
                    ? [{
                        label: selectedDailyRow?.date || studentDailyDate,
                        present: dailySummaryCounts.present,
                        absent: dailySummaryCounts.absent,
                        od: dailySummaryCounts.od,
                      }]
                    : showStudentOdApplyView
                      ? [{
                          label: 'OD Requests',
                          applied: odSummaryCounts.applied,
                          approved: odSummaryCounts.approved,
                          pending: odSummaryCounts.pending,
                        }]
                      : selectedWeeklyAttendance
                  : selectedWeeklyAttendance
              }
              barCategoryGap="35%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey={isStudent && (showStudentDailyView || showStudentOdApplyView) ? 'label' : 'day'}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={isStudent && (showStudentDailyView || showStudentOdApplyView) ? [0, 'dataMax + 1'] : [70, 100]}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (isStudent && (showStudentDailyView || showStudentOdApplyView) ? `${v}` : `${v}%`)}
              />
              <Tooltip
                formatter={(v, name) => {
                  if (isStudent && (showStudentDailyView || showStudentOdApplyView)) {
                    return [String(v), String(name)]
                  }
                  return [`${v}%`, 'Attendance']
                }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                cursor={{ fill: '#f8fafc' }}
              />
              {isStudent && showStudentDailyView ? (
                <>
                  <Bar dataKey="present" name="Present" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#dc2626" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="od" name="On Duty" fill="#276221" radius={[6, 6, 0, 0]} />
                </>
              ) : isStudent && showStudentOdApplyView ? (
                <>
                  <Bar dataKey="applied" name="OD Applied" fill="#276221" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="approved" name="OD Approved" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" name="OD Pending" fill="#d97706" radius={[6, 6, 0, 0]} />
                </>
              ) : (
                <Bar dataKey="attendance" name="Attendance" fill="#276221" radius={[6, 6, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      }

      {(() => {
        if (isStudent) {
          const my  = scopedStudents[0]
          if (!my) return null
          const pct = calcPct(myEffectiveAttendance.present, myEffectiveAttendance.total)
          return pct < 75 ? (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
              <span className="material-symbols-outlined text-orange-500 mt-0.5">warning</span>
              <div>
                <p className="text-sm font-semibold text-orange-700">Warning: Your attendance is below 75%.</p>
                <p className="text-xs text-orange-600 mt-0.5">Attend upcoming classes to maintain eligibility.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              <p className="text-sm font-semibold text-emerald-700">Eligible for Exams</p>
            </div>
          )
        }
        if (isAdmin) return null
        // Faculty / Admin view
        const lowAttendanceRows = summaryData.filter(s => calcPct(s.present, s.total) < 75)
        if (lowAttendanceRows.length === 0) return null
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-orange-500">warning</span>
              <p className="text-sm font-semibold text-orange-700">{summaryLabel} Below 75%</p>
            </div>
            <ul className="space-y-1">
              {lowAttendanceRows.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm text-orange-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                  {s.name} ({calcPct(s.present, s.total)}%)
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      {/* Summary Cards — admin only */}
      {isAdmin && (() => {
        const data     = activeTab === 'students' ? scopedStudents : scopedStaff
        const good     = data.filter(s => calcPct(s.present, s.total) >= 85).length
        const atRisk   = data.filter(s => { const p = calcPct(s.present, s.total); return p >= 75 && p < 85 }).length
        const critical = data.filter(s => calcPct(s.present, s.total) < 75).length
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.length}</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Good</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{good}</p>
            </div>
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">At Risk</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">{atRisk}</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Critical</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{critical}</p>
            </div>
          </div>
        )
      })()}

      {/* Tabs + Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {isAdmin ? (
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === 'students' ? 'bg-white text-[#276221] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">school</span>Students
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === 'staff' ? 'bg-white text-[#276221] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">badge</span>Staff
            </button>
          </div>
        ) : isFaculty ? (
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setStaffViewTab('my')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                staffViewTab === 'my' ? 'bg-white text-[#276221] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">person</span>My Attendance
            </button>
            <button
              onClick={() => setStaffViewTab('mark')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                staffViewTab === 'mark' ? 'bg-white text-[#276221] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">checklist</span>Mark Attendance
            </button>
            <button
              onClick={() => { setStaffViewTab('od'); setFacultyOdNotice(''); refreshFacultyOdRequests() }}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                staffViewTab === 'od' ? 'bg-white text-[#276221] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">approval</span>
              <span>OD Requests</span>
              {pendingFacultyOdCount > 0 && (
                <span className="inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold leading-none text-white">
                  {pendingFacultyOdCount}
                </span>
              )}
            </button>
          </div>
        ) : isStudent ? (
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setStudentViewTab('my')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                studentViewTab === 'my' ? 'bg-white text-[#276221] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">person</span>My Attendance
            </button>
            <button
              onClick={() => setStudentViewTab('daily')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                studentViewTab === 'daily' ? 'bg-white text-[#276221] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>Daily Attendance
            </button>
            <button
              onClick={() => setStudentViewTab('od')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                studentViewTab === 'od' ? 'bg-white text-[#276221] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">event_upcoming</span>Apply OD
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold w-fit">
            <span className="material-symbols-outlined text-base">person</span>My Attendance
          </div>
        )}

        {isAdmin && (
          <div className="flex items-center justify-end gap-3">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-56 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#276221]/30 focus:border-[#276221] transition-all duration-200"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  activeFilterCount > 0
                    ? 'bg-[#276221] text-white border-[#276221] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <span className="material-symbols-outlined text-lg">filter_list</span>
                {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
              </button>

              {filterOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-20 animate-dropIn origin-top-right overflow-hidden">
                  <div className="border-b border-slate-100 px-2 pt-1.5">
                    <div className="grid grid-cols-3 gap-1">
                      {filterTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveFilterTab(tab.id)}
                          className={`px-2 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                            activeFilterTab === tab.id
                              ? 'text-[#276221] border-b-2 border-[#276221]'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 max-h-56 overflow-y-auto">
                    {activeFilterTab === 'status' && (
                      <div className="space-y-1">
                        {statusOptions.map((opt) => {
                          const checked = selectedStatuses.includes(opt)
                          return (
                            <button
                              key={opt}
                              onClick={() => toggleFilterValue(opt, setSelectedStatuses)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                checked ? 'bg-[#276221]/10 text-[#276221] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  opt === 'Good' || opt === 'Eligible for Exams' ? 'bg-green-500' :
                                  opt === 'At Risk' ? 'bg-orange-500' : 'bg-red-500'
                                }`} />
                                {opt}
                              </span>
                              {checked && <span className="material-symbols-outlined text-base">check</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {activeFilterTab === 'attendance' && (
                      <div className="space-y-1">
                        {ATTENDANCE_RANGE_OPTIONS.map((range) => {
                          const checked = selectedAttendanceRange.includes(range.id)
                          return (
                            <button
                              key={range.id}
                              onClick={() => toggleFilterValue(range.id, setSelectedAttendanceRange)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                checked ? 'bg-[#276221]/10 text-[#276221] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span>{range.label}</span>
                              {checked && <span className="material-symbols-outlined text-base">check</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {activeFilterTab === 'course' && (
                      <div className="space-y-1">
                        {courseOptions.length === 0 && (
                          <p className="px-3 py-2 text-sm text-slate-400">No options available</p>
                        )}
                        {courseOptions.map((course) => {
                          const checked = selectedCourses.includes(course)
                          return (
                            <button
                              key={course}
                              onClick={() => toggleFilterValue(course, setSelectedCourses)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                checked ? 'bg-[#276221]/10 text-[#276221] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className="truncate text-left">{course}</span>
                              {checked && <span className="material-symbols-outlined text-base">check</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 px-3 py-2.5 flex items-center justify-between bg-slate-50/70">
                    <p className="text-xs text-slate-500">{activeFilterCount} filter(s) applied</p>
                    <button
                      onClick={clearAllFilters}
                      disabled={activeFilterCount === 0}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm">restart_alt</span>
                      Clear All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showStaffMarkingView ? (
        <>
          {!isFacultyAssignedToHour && hourSubjectAndInstructor && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl mb-4 animate-fadeIn">
              <span className="material-symbols-outlined text-rose-500 mt-0.5">error</span>
              <div>
                <p className="text-sm font-semibold text-rose-700">Access Denied: Unassigned Subject/Hour</p>
                <p className="text-xs text-rose-600 mt-0.5">
                  This hour is scheduled for <strong>{hourSubjectAndInstructor.code} - {hourSubjectAndInstructor.name}</strong> with instructor <strong>{hourSubjectAndInstructor.instructor}</strong>. You are only allowed to mark attendance for your assigned courses.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => { setSelectedClassId(e.target.value); setMarkNotice('') }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#276221]/30 focus:border-[#276221]"
                >
                  {classOptions.length === 0 && <option value="">No classes available</option>}
                  {classOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => { setAttendanceDate(e.target.value); setMarkNotice('') }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#276221]/30 focus:border-[#276221]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Hour</label>
                <select
                  value={attendanceHour}
                  onChange={(e) => { setAttendanceHour(e.target.value); setMarkNotice('') }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#276221]/30 focus:border-[#276221]"
                >
                  {STAFF_MARK_HOURS.map((hour) => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-700">Hour-wise Attendance</p>
                <p className="text-xs text-slate-500">Default status is Present. Use cross icon only for absent students.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  Present: {presentCount}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                  Absent: {absentCount}
                </span>
                <button
                  onClick={saveMarkedAttendance}
                  disabled={!isFacultyAssignedToHour}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#276221] text-white rounded-lg text-sm font-semibold hover:bg-[#276221]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  Save
                </button>
              </div>
            </div>

            {markNotice && (
              <div className="px-5 py-2.5 border-b border-slate-100 bg-emerald-50 text-emerald-700 text-xs font-medium">
                {markNotice}
              </div>
            )}

            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Register Number</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {markRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-400 text-sm">No students found for this class</td>
                  </tr>
                )}

                {markRows.map((row) => (
                  <tr key={row.id || row.rollNumber} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{row.rollNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-semibold">{row.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setStudentAttendanceStatus(row.id, 'Present')}
                          className={`w-9 h-9 inline-flex items-center justify-center rounded-lg border transition-colors ${
                            row.status === 'Present'
                              ? 'bg-green-50 border-green-200 text-green-600'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-green-200'
                          }`}
                          title="Present"
                        >
                          <span className="material-symbols-outlined text-base">check</span>
                        </button>
                        <button
                          onClick={() => setStudentAttendanceStatus(row.id, 'Absent')}
                          className={`w-9 h-9 inline-flex items-center justify-center rounded-lg border transition-colors ${
                            row.status === 'Absent'
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-red-200'
                          }`}
                          title="Absent"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                        <span className={`text-xs font-semibold ${row.status === 'Present' ? 'text-green-600' : 'text-red-600'}`}>
                          {row.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : showFacultyOdManageView ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-700">Student OD Requests</p>
              <p className="text-xs text-slate-500">Faculty can approve or reject pending OD requests.</p>
            </div>
            <button
              onClick={() => refreshFacultyOdRequests('Request list refreshed.')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Refresh
            </button>
          </div>

          {facultyOdNotice && (
            <div className="px-5 py-2.5 border-b border-slate-100 bg-emerald-50 text-emerald-700 text-xs font-medium">
              {facultyOdNotice}
            </div>
          )}

          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Date Range</th>
                  <th className="px-6 py-4">Hours</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Proof</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facultyOdRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-sm">No OD requests found</td>
                  </tr>
                )}

                {facultyOdRequests.map((request) => {
                  const studentKey = normalizeId(request?.studentId)
                  const lookup = studentLookupById[studentKey]
                  const displayName = lookup?.name || request?.studentId || 'Unknown Student'
                  const displayRoll = lookup?.rollNumber || request?.studentId || '-'
                  const fromDate = request?.fromDate || request?.date || '-'
                  const toDate = request?.toDate || request?.date || '-'
                  const dateLabel = fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`
                  const hoursLabel = Array.isArray(request?.hours) && request.hours.length > 0
                    ? request.hours.join(', ')
                    : '-'
                  const status = request?.status || 'Pending'

                  return (
                    <tr key={getOdRequestId(request) || `${request?.studentId}-${request?.createdAt || ''}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <p className="font-semibold text-slate-800">{displayName}</p>
                        <p className="text-xs text-slate-500">{displayRoll}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">{dateLabel}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{hoursLabel}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{request?.reason || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {request?.proofImageData ? (
                          <button
                            onClick={() => setViewingProofUrl(request.proofImageData)}
                            className="inline-flex items-center gap-1 text-[#276221] font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
                          >
                            <span className="material-symbols-outlined text-sm">image</span>
                            View
                          </button>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : status === 'Rejected'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {status === 'Pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setFacultyOdStatus(request, 'Approved')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                              Approve
                            </button>
                            <button
                              onClick={() => setFacultyOdStatus(request, 'Rejected')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Already reviewed</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : showStudentDailyView ? (
        <div className="bg-white rounded-[10px] border border-[#e5e7eb] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e5e7eb] bg-slate-50 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-700">Daily Hour-wise Attendance</p>
              <p className="text-xs text-slate-500">Date-wise overview for Hour 1 to Hour 8.</p>
            </div>
            <input
              type="date"
              value={studentDailyDate}
              onChange={(e) => setStudentDailyDate(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#276221]/30 focus:border-[#276221]"
            />
          </div>

          <div className="overflow-auto max-h-[540px] bg-[#f3f8ff]">
            <table className="min-w-[1120px] w-full text-center bg-[#f3f8ff]">
              <thead>
                <tr className="bg-[#1e3a5f] text-white text-xs font-semibold uppercase tracking-wider border-b border-[#2f4f73]">
                  <th className="px-4 py-3 sticky top-0 bg-[#1e3a5f] z-10 min-w-[170px]">Date</th>
                  {STAFF_MARK_HOURS.map((hour) => (
                    <th key={hour} className="px-4 py-3 sticky top-0 bg-[#1e3a5f] z-10 min-w-[120px]">{hour}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {studentDailyGridRows.map((row, rowIndex) => (
                  <tr
                    key={row.date}
                    className={`cursor-pointer transition-colors duration-200 ${
                      rowIndex % 2 === 0 ? 'bg-[#f7fbff]' : 'bg-[#edf4ff]'
                    } hover:bg-[#e3eeff]`}
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-[#334155]">
                      <div className="flex flex-col items-center gap-1">
                        <span>{row.label}</span>
                        {row.isToday && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#276221]/10 text-[#276221]">Today</span>
                        )}
                      </div>
                    </td>
                    {row.hours.map((cell) => (
                      <td key={`${row.date}-${cell.hour}`} className="px-4 py-3">
                        <span
                          title={`${cell.hour}: ${getTimetableSubjectForCell(row.date, cell.hour)} (${cell.status})`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border cursor-help ${
                          cell.status === 'Present'
                            ? 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]'
                            : cell.status === 'On Duty'
                              ? 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
                            : cell.status === 'Absent'
                              ? 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]'
                              : 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]'
                        }`}
                        >
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                            cell.status === 'Present'
                              ? 'bg-[#16a34a]'
                              : cell.status === 'On Duty'
                                ? 'bg-[#0284c7]'
                                : cell.status === 'Absent'
                                  ? 'bg-[#dc2626]'
                                  : 'bg-[#64748b]'
                          }`} />
                          {cell.status}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : showStudentOdApplyView ? (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Apply On Duty (OD)</p>
                <p className="text-xs text-slate-500">Approved OD is treated as present and does not reduce your attendance percentage.</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                Approved OD: {approvedOdCountForSummary}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">From Date</label>
                <input
                  type="date"
                  value={odApplyFromDate}
                  onChange={(e) => { setOdApplyFromDate(e.target.value); setOdNotice('') }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#276221]/30 focus:border-[#276221]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To Date</label>
                <input
                  type="date"
                  value={odApplyToDate}
                  onChange={(e) => { setOdApplyToDate(e.target.value); setOdNotice('') }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#276221]/30 focus:border-[#276221]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reason</label>
                <input
                  type="text"
                  value={odApplyReason}
                  onChange={(e) => { setOdApplyReason(e.target.value); setOdNotice('') }}
                  placeholder="Ex: Inter-college event, workshop, placement drive"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#276221]/30 focus:border-[#276221]"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">OD Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  onClick={() => { setOdApplyType('full_day'); setOdNotice('') }}
                  className={`inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    odApplyType === 'full_day'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>Full Day OD</span>
                  {odApplyType === 'full_day' && <span className="material-symbols-outlined text-base">check</span>}
                </button>
                <button
                  onClick={() => { setOdApplyType('specific'); setOdNotice('') }}
                  className={`inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    odApplyType === 'specific'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>Specific Hour</span>
                  {odApplyType === 'specific' && <span className="material-symbols-outlined text-base">check</span>}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">OD Proof (Image)</label>
              <input
                ref={odProofInputRef}
                type="file"
                accept="image/*"
                onChange={handleOdProofChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-slate-100 file:text-slate-700"
              />
              <p className="text-xs text-slate-500 mt-1">
                {odProofFileName ? `Selected: ${odProofFileName}` : 'Upload proof image (required).'}
              </p>
            </div>

            {odApplyType === 'specific' ? (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hours</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {STAFF_MARK_HOURS.map((hour) => {
                    const checked = odApplyHours.includes(hour)
                    return (
                      <button
                        key={hour}
                        onClick={() => toggleOdHour(hour)}
                        className={`inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          checked
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span>{hour}</span>
                        {checked && <span className="material-symbols-outlined text-base">check</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : odApplyType === 'full_day' ? (
              <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-sm font-medium text-sky-700">
                Full Day OD selected. Request will be applied for Hour 1 to Hour 8.
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-600">
                Select an OD type to continue.
              </div>
            )}

            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={submitOdRequest}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#276221] text-white rounded-lg text-sm font-semibold hover:bg-[#1e4618] transition-all"
              >
                <span className="material-symbols-outlined text-base">{odEditingRequestId ? 'save' : 'send'}</span>
                {odEditingRequestId ? 'Update OD Request' : 'Submit OD Request'}
              </button>
              {odEditingRequestId && (
                <button
                  onClick={() => { resetOdForm(); setOdNotice('Edit cancelled.') }}
                  className="inline-flex items-center gap-1.5 ml-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                  Cancel
                </button>
              )}
            </div>

            {odNotice && (
              <div className="mt-3 px-3.5 py-2.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                {odNotice}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">Note: Single-day OD is not allowed on leave day. Date-range OD can include leave days.</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-700">My OD Requests</p>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Date Range</th>
                    <th className="px-6 py-4">Hours</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Proof</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentOdRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">No OD requests submitted</td>
                    </tr>
                  )}

                  {studentOdRequests.map((request) => (
                    <tr key={getOdRequestId(request) || `${request?.studentId}-${request?.createdAt || ''}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                        {(() => {
                          const fromDate = request.fromDate || request.date || '-'
                          const toDate = request.toDate || request.date || '-'
                          return fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{Array.isArray(request.hours) ? request.hours.join(', ') : '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{request.reason || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {request.proofImageData ? (
                          <button
                            onClick={() => setViewingProofUrl(request.proofImageData)}
                            className="inline-flex items-center gap-1 text-[#276221] font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
                          >
                            <span className="material-symbols-outlined text-sm">image</span>
                            View
                          </button>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : request.status === 'Rejected'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {request.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {request.status === 'Pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startOdEdit(request)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                              Edit
                            </button>
                            <button
                              onClick={() => deleteOdRequest(request)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Locked after approval</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <AttendanceTable data={filteredData} type={currentTableType} isAdmin={isAdmin} />
      )}

      {viewingProofUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
          onClick={() => setViewingProofUrl('')}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden m-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setViewingProofUrl('')} 
              className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 border-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            <img 
              src={viewingProofUrl} 
              alt="OD Proof" 
              className="max-w-full max-h-[80vh] rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
  return noLayout ? inner : <Layout title="Attendance">{inner}</Layout>
}
