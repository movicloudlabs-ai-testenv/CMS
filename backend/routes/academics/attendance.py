from __future__ import annotations

from datetime import datetime
from uuid import uuid4
from typing import Optional
from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument

from backend.db import get_db
from backend.utils.notify import send_notification
from backend.dev_store import create_attendance as create_dev_attendance
from backend.dev_store import create_od_request as create_dev_od_request
from backend.dev_store import list_attendance as list_dev_attendance
from backend.dev_store import list_attendance_markings as list_dev_attendance_markings
from backend.dev_store import list_od_requests as list_dev_od_requests
from backend.dev_store import list_weekly_attendance
from backend.dev_store import delete_od_request as delete_dev_od_request
from backend.dev_store import update_od_request as update_dev_od_request
from backend.dev_store import update_od_request_status as update_dev_od_request_status
from backend.dev_store import upsert_attendance_marking as upsert_dev_attendance_marking
from backend.schemas.academics import AttendanceRecord, WeeklyAttendancePoint
from backend.schemas.academics import AttendanceMarkRecord, OdRequestPayload, OdRequestStatusUpdate
from backend.utils.mongo import serialize_doc
from backend.utils.attendance_utils import compute_student_attendance_stats
from backend.dev_store import DEV_STORE

router = APIRouter(prefix="/api/academics/attendance", tags=["academics:attendance"])


@router.get("")
async def list_attendance(role: Optional[str] = None, person_id: Optional[str] = None):
    try:
        db = get_db()
        use_db = True
    except HTTPException as error:
        if error.status_code == 503:
            use_db = False
        else:
            raise

    if not use_db:
        from backend.routes.students import _seed_dev_students
        _seed_dev_students()
        records = []
        if not role or role == "student":
            for student in DEV_STORE.get("students", []):
                student_id = student.get("id") or student.get("rollNumber")
                if person_id and student_id != person_id:
                    continue
                present, total, pct = await compute_student_attendance_stats(student, db=None)
                records.append({
                    "id": student_id,
                    "personId": student_id,
                    "name": student.get("name", "Unknown Student"),
                    "role": "student",
                    "courseOrDepartment": student.get("department", "Computer Science"),
                    "present": present,
                    "total": total
                })
        if not role or role == "staff":
            records.extend(list_dev_attendance("staff", person_id))
        return {"success": True, "data": records}

    records = []

    # If role is student or not specified, read from "students"
    if not role or role == "student":
        student_query = {}
        if person_id:
            student_query["$or"] = [
                {"id": person_id},
                {"rollNumber": person_id},
                {"student_id": person_id}
            ]

        async for student in db["students"].find(student_query):
            present, total, pct = await compute_student_attendance_stats(student, db=db)

            records.append({
                "id": student.get("id") or student.get("rollNumber") or str(student["_id"]),
                "personId": student.get("id") or student.get("rollNumber") or str(student["_id"]),
                "name": student.get("name", "Unknown Student"),
                "role": "student",
                "courseOrDepartment": student.get("department", "Computer Science"),
                "present": present,
                "total": total
            })

    # If role is staff or not specified, read from "faculty"
    if not role or role == "staff":
        faculty_query = {}
        if person_id:
            faculty_query["$or"] = [
                {"employeeId": person_id},
                {"id": person_id}
            ]

        async for member in db["faculty"].find(faculty_query):
            rate = member.get("attendance_rate")
            if rate is not None:
                total = 20
                present = int(round(total * rate / 100))
            else:
                total = 20
                present = 18

            records.append({
                "id": member.get("employeeId") or str(member["_id"]),
                "personId": member.get("employeeId") or str(member["_id"]),
                "name": member.get("name", "Unknown Staff"),
                "role": "staff",
                "courseOrDepartment": member.get("departmentId") or member.get("department", "Computer Science"),
                "present": present,
                "total": total
            })

    # Legacy fallback: Query the custom academic_attendance collection if any manual entries exist
    attendance_query = {}
    if role:
        attendance_query["role"] = role
    if person_id:
        attendance_query["personId"] = person_id

    async for record in db["academic_attendance"].find(attendance_query):
        records.append(serialize_doc(record))

    # Sort records by name
    records = sorted(records, key=lambda r: r.get("name", "").lower())
    return {"success": True, "data": records}



@router.post("")
async def create_attendance(payload: AttendanceRecord):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": create_dev_attendance(payload.model_dump())}
        raise
    result = await db["academic_attendance"].insert_one(payload.model_dump())
    created = await db["academic_attendance"].find_one({"_id": result.inserted_id})
    return {"success": True, "data": serialize_doc(created)}


@router.get("/weekly")
async def get_weekly_attendance(role: Optional[str] = None):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": list_weekly_attendance()}
        raise
    query = {"role": role} if role else {}
    points = []
    async for point in db["academic_attendance_weekly"].find(query).sort("day", 1):
        points.append(serialize_doc(point))

    if points:
        return {"success": True, "data": points}

    default_points = [
        WeeklyAttendancePoint(day="Mon", attendance=92).model_dump(),
        WeeklyAttendancePoint(day="Tue", attendance=88).model_dump(),
        WeeklyAttendancePoint(day="Wed", attendance=90).model_dump(),
        WeeklyAttendancePoint(day="Thu", attendance=86).model_dump(),
        WeeklyAttendancePoint(day="Fri", attendance=94).model_dump(),
    ]
    return {"success": True, "data": default_points}


@router.get("/markings")
async def list_attendance_markings(
    class_id: Optional[str] = None,
    date: Optional[str] = None,
    hour: Optional[str] = None,
    student_id: Optional[str] = None,
):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {
                "success": True,
                "data": list_dev_attendance_markings(class_id, date, hour, student_id),
            }
        raise

    query = {}
    if class_id:
        query["classId"] = class_id
    if date:
        query["date"] = date
    if hour:
        query["hour"] = hour
    if student_id:
        query["entries.studentId"] = student_id

    rows = []
    async for row in db["academic_attendance_markings"].find(query).sort("date", -1):
        rows.append(serialize_doc(row))
    return {"success": True, "data": rows}


import re

def is_class_assigned_py(class_id: str, class_label: str, assigned_classes: list) -> bool:
    if not assigned_classes:
        return False
        
    normalized_label = class_label.lower()
    normalized_id = class_id.lower()
    
    dept_codes = {
        'cse': ['computer science', 'computer science & engineering', 'computer science and engineering'],
        'ece': ['electronics', 'electronics & communication', 'electronics and communication'],
        'me': ['mechanical', 'mechanical engineering'],
        'ce': ['civil', 'civil engineering'],
        'it': ['information technology'],
        'eee': ['electrical', 'electrical engineering', 'electrical & electronics', 'electrical and electronics']
    }
    
    for ac in assigned_classes:
        normalized_ac = ac.strip().lower()
        if not normalized_ac:
            continue
            
        # 1. Substring match
        if normalized_ac in normalized_label or normalized_ac in normalized_id:
            return True
            
        # 2. Abbreviation match, e.g. "CSE-A"
        parts = re.split(r'[-_\s]+', normalized_ac)
        if len(parts) >= 2:
            first = parts[0]
            last = parts[-1]
            if len(last) == 1 and last.isalpha():
                # check if student section matches
                student_sec = normalized_id.split('-')[-1]
                if student_sec == last:
                    if first in ['cs', 'cse']:
                        if 'computer-science' in normalized_id or 'cse' in normalized_id:
                            return True
                    for code, names in dept_codes.items():
                        if first == code:
                            if any(name.replace(' ', '-') in normalized_id for name in names):
                                return True
                                
        # 3. Year match
        match_num = re.search(r'\d+', normalized_ac)
        if match_num:
            num = match_num.group()
            year_words = {
                '1': ['1st', '1', 'first'],
                '2': ['2nd', '2', 'second'],
                '3': ['3rd', '3', 'third'],
                '4': ['4th', '4', 'fourth']
            }
            if num in year_words:
                if any(w in normalized_id for w in year_words[num]):
                    return True
                    
    return False

async def check_faculty_attendance_permission(db, faculty_id: str, class_id: str, date_str: str, hour_str: str, class_label: str = ""):
    # Find faculty record
    faculty = await db["faculty"].find_one({"$or": [{"employeeId": faculty_id}, {"id": faculty_id}]})
    if not faculty:
        # If not a faculty member, allow (could be admin or system user)
        return
        
    # 1. Verify class assignment
    assigned_classes = faculty.get("assignedClasses") or faculty.get("classes") or []
    if isinstance(assigned_classes, str):
        assigned_classes = [c.strip() for c in assigned_classes.split(",") if c.strip()]
        
    if not class_label:
        marking = await db["academic_attendance_markings"].find_one({"classId": class_id})
        if marking:
            class_label = marking.get("classLabel") or ""
        else:
            parts = class_id.split("-")
            class_label = " ".join([p.capitalize() for p in parts])
            
    if not is_class_assigned_py(class_id, class_label, assigned_classes):
        raise HTTPException(status_code=403, detail=f"Class '{class_label}' is not assigned to you.")
        
    # 2. Verify subject/hour assignment
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        weekday = dt.strftime("%a") # e.g. "Mon", "Tue"
    except Exception:
        # Allow if date format is invalid
        return
        
    # Find timetable for this class
    timetable = await db["academic_timetables"].find_one({"classId": class_id})
    if not timetable:
        # Allow if no timetable defined
        return
        
    hour_map = {f"Hour {i}": i-1 for i in range(1, 9)}
    hour_idx = hour_map.get(hour_str)
    if hour_idx is None or hour_idx < 0:
        return
        
    weekday_map = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4}
    day_idx = weekday_map.get(weekday)
    if day_idx is None:
        return
        
    slots = timetable.get("slots") or []
    if len(slots) > hour_idx:
        day_slots = slots[hour_idx]
        if len(day_slots) > day_idx:
            slot_entry = day_slots[day_idx]
            if slot_entry:
                instructor = slot_entry.get("instructor", "")
                subject_name = slot_entry.get("name", "")
                subject_code = slot_entry.get("code", "")
                
                faculty_name = faculty.get("name") or faculty.get("fullName") or ""
                faculty_courses = faculty.get("courses") or []
                if isinstance(faculty_courses, str):
                    faculty_courses = [c.strip() for c in faculty_courses.split(",") if c.strip()]
                    
                # Check match:
                if instructor and (faculty_id.lower() in instructor.lower() or faculty_name.lower() in instructor.lower()):
                    return
                if subject_name and any(c.lower() in subject_name.lower() for c in faculty_courses):
                    return
                if subject_code and any(c.lower() in subject_code.lower() for c in faculty_courses):
                    return
                
                # If scheduled but not for this faculty, raise 403
                raise HTTPException(status_code=403, detail=f"This hour is scheduled for {subject_name or subject_code} with {instructor or 'another instructor'}. You are not assigned to this hour.")

@router.put("/markings")
async def upsert_attendance_marking(payload: AttendanceMarkRecord):
    data = payload.model_dump()
    query = {
        "classId": data["classId"],
        "date": data["date"],
        "hour": data["hour"],
    }

    if not data.get("markedAt"):
        data["markedAt"] = datetime.utcnow().isoformat()

    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": upsert_dev_attendance_marking(data)}
        raise

    # Faculty assignment validation
    marked_by = data.get("markedBy", "")
    if marked_by:
        await check_faculty_attendance_permission(
            db,
            faculty_id=marked_by,
            class_id=data["classId"],
            date_str=data["date"],
            hour_str=data["hour"],
            class_label=data.get("classLabel", "")
        )

    updated = await db["academic_attendance_markings"].find_one_and_update(
        query,
        {"$set": data},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return {"success": True, "data": serialize_doc(updated)}


@router.get("/od-requests")
async def list_od_requests(student_id: Optional[str] = None, status: Optional[str] = None):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": list_dev_od_requests(student_id, status)}
        raise

    query = {}
    if student_id:
        query["studentId"] = student_id
    if status and status != "All":
        query["status"] = status

    rows = []
    async for row in db["academic_od_requests"].find(query).sort("createdAt", -1):
        rows.append(serialize_doc(row))
    return {"success": True, "data": rows}


@router.post("/od-requests")
async def create_od_request(payload: OdRequestPayload):
    data = payload.model_dump()
    request_id = data.get("requestId") or f"od-{uuid4().hex[:12]}"
    data["requestId"] = request_id
    if not data.get("createdAt"):
        data["createdAt"] = datetime.utcnow().isoformat()

    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            return {"success": True, "data": create_dev_od_request(data)}
        raise

    result = await db["academic_od_requests"].insert_one(data)
    created = await db["academic_od_requests"].find_one({"_id": result.inserted_id})

    # Send notification to faculty (gated by faculty settings)
    await send_notification(
        db=db,
        receiver_role="faculty",
        event_key="odRequests",
        title="New OD Request Submitted",
        message=f"Student {data.get('studentId')} has submitted a new OD request for {data.get('fromDate')}.",
        sender_role="student",
        module="Academic",
        priority="Medium",
        related_data={"studentId": data.get("studentId"), "requestId": request_id}
    )

    # Send notification to student (gated by student settings and targeted to specific student)
    student_id = data.get("studentId")
    await send_notification(
        db=db,
        receiver_role="student",
        event_key="odStatusUpdate",
        title="OD Request Submitted",
        message=f"Your OD request for {data.get('fromDate')} has been submitted and is pending faculty approval.",
        sender_role="system",
        module="Academic",
        priority="Low",
        related_data={"studentId": student_id, "requestId": request_id},
        receiver_user_id=student_id
    )

    return {"success": True, "data": serialize_doc(created)}


@router.put("/od-requests/{request_id}")
async def update_od_request(request_id: str, payload: OdRequestPayload):
    data = payload.model_dump()
    data["requestId"] = request_id
    data["updatedAt"] = datetime.utcnow().isoformat()

    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            updated = update_dev_od_request(request_id, data)
            if not updated:
                raise HTTPException(status_code=404, detail="OD request not found")
            return {"success": True, "data": updated}
        raise

    updated = await db["academic_od_requests"].find_one_and_update(
        {"requestId": request_id},
        {"$set": data},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="OD request not found")
    return {"success": True, "data": serialize_doc(updated)}


@router.patch("/od-requests/{request_id}/status")
async def update_od_request_status(request_id: str, payload: OdRequestStatusUpdate):
    status = payload.status
    if status not in {"Pending", "Approved", "Rejected"}:
        raise HTTPException(status_code=400, detail="Invalid OD status")

    patch = {
        "status": status,
        "reviewedBy": payload.reviewedBy,
        "reviewedAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat(),
    }

    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            updated = update_dev_od_request_status(request_id, status, payload.reviewedBy)
            if not updated:
                raise HTTPException(status_code=404, detail="OD request not found")
            return {"success": True, "data": updated}
        raise

    updated = await db["academic_od_requests"].find_one_and_update(
        {"requestId": request_id},
        {"$set": patch},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="OD request not found")

    # Send notification to student (gated by student settings and targeted to specific student)
    student_id = updated.get("studentId")
    await send_notification(
        db=db,
        receiver_role="student",
        event_key="odStatusUpdate",
        title=f"OD Request {status}",
        message=f"Your OD request for {updated.get('fromDate')} has been {status.lower()}.",
        sender_role="faculty",
        module="Academic",
        priority="Medium",
        related_data={"studentId": student_id, "requestId": request_id},
        receiver_user_id=student_id
    )

    # Send notification to faculty reviewer (gated by faculty settings)
    reviewer_id = payload.reviewedBy or updated.get("reviewedBy")
    if reviewer_id:
        await send_notification(
            db=db,
            receiver_role="faculty",
            event_key="odRequests",
            title="OD Request Reviewed",
            message=f"You have {status.lower()} the OD request for student {updated.get('studentId')}.",
            sender_role="system",
            module="Academic",
            priority="Low",
            related_data={"studentId": updated.get("studentId"), "requestId": request_id},
            receiver_user_id=reviewer_id
        )

    return {"success": True, "data": serialize_doc(updated)}


@router.delete("/od-requests/{request_id}")
async def delete_od_request(request_id: str):
    try:
        db = get_db()
    except HTTPException as error:
        if error.status_code == 503:
            deleted = delete_dev_od_request(request_id)
            if not deleted:
                raise HTTPException(status_code=404, detail="OD request not found")
            return {"success": True, "message": "OD request deleted"}
        raise

    result = await db["academic_od_requests"].delete_one({"requestId": request_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="OD request not found")
    return {"success": True, "message": "OD request deleted"}
