"""Dashboard Summary API - KPI endpoints for dashboard cards"""

from fastapi import APIRouter, HTTPException
from backend.db import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def get_dashboard_summary():
    """
    Get KPI summary for dashboard cards.
    Returns only APPROVED/ACTIVE records.
    
    Returns:
    {
        "total_students": count of approved/active students,
        "total_faculty": count of approved/active faculty,
        "active_events": count of active events,
        "dept_requests": count of pending department requests
    }
    """
    try:
        db = get_db()
    except HTTPException:
        raise HTTPException(status_code=503, detail="Database connection failed")

    try:
        # 1. Count APPROVED/ACTIVE Students
        total_students = await db["students"].count_documents({
            "status": {"$in": ["Approved", "Active"]}
        })

        # 2. Count APPROVED/ACTIVE Faculty
        total_faculty = await db["faculty"].count_documents({
            "$or": [
                {"employment_status": {"$in": ["Approved", "Active"]}},
                {"status": {"$in": ["Approved", "Active"]}}
            ]
        })

        # If faculty collection is empty, try staff_Details
        if total_faculty == 0:
            total_faculty = await db["staff_Details"].count_documents({
                "status": {"$in": ["Approved", "Active"]}
            })

        # 3. Count ACTIVE Events
        active_events = await db["events"].count_documents({
            "event_status": "Active"
        })

        # 4. Count PENDING Department Requests
        dept_requests = await db["department_requests"].count_documents({
            "status": "Pending"
        })

        return {
            "success": True,
            "data": {
                "total_students": total_students,
                "total_faculty": total_faculty,
                "active_events": active_events,
                "dept_requests": dept_requests
            }
        }

    except Exception as e:
        print(f"Error fetching dashboard summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard summary: {str(e)}")
