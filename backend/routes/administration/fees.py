from fastapi import APIRouter, HTTPException
from datetime import datetime

from backend.db import get_db
from backend.schemas.fees_schema import AssignFee
from backend.utils.fee_calculator import calculate_fee
from backend.utils.mongo import serialize_doc, parse_object_id

router = APIRouter(prefix="/api/fees", tags=["Fees"])


@router.post("/assign")
async def assign_fee(data: AssignFee):
    """Assign fees to a student"""
    
    # Validate student_id
    if not data.student_id:
        raise HTTPException(status_code=400, detail="student_id is required")
    
    db = get_db()
    fees_collection = db["fees_structure"]

    # Calculate fee breakdown
    fee = calculate_fee(
        data.first_graduate,
        data.hostel_required
    )

    record = {
        "student_id": data.student_id,
        "student_name": data.student_name,
        "course": data.course,
        "semester": data.semester,
        "first_graduate": data.first_graduate,
        "hostel_required": data.hostel_required,
        "fee_breakdown": fee,
        "total_fee": fee["total"],
        "assigned_date": datetime.now(),
        "payment_status": "Pending"
    }

    result = await fees_collection.insert_one(record)
    
    # Update student's fee_status
    students_collection = db["students"]
    await students_collection.update_one(
        {"$or": [
            {"id": data.student_id},
            {"student_id": data.student_id},
            {"rollNumber": data.student_id}
        ]},
        {"$set": {
            "fee_status": "Pending",
            "feeStatus": "Pending"
        }}
    )

    return {
        "message": "Fee assigned successfully",
        "collection": "fees_structure",
        "id": str(result.inserted_id),
        "student_id": data.student_id,
        "total": fee["total"]
    }


@router.get("/student/{student_id}")
async def get_student_fees(student_id: str):
    """Get all fees for a student"""
    db = get_db()
    fees_collection = db["fees_structure"]
    
    fees = []
    async for fee in fees_collection.find({"student_id": student_id}):
        fees.append(serialize_doc(fee))
    
    return {
        "student_id": student_id,
        "fees": fees,
        "count": len(fees),
        "total_assigned": sum(f.get("total_fee", 0) for f in fees)
    }


@router.get("")
async def get_all_fees():
    """Get all fee assignments"""
    db = get_db()
    fees_collection = db["fees_structure"]
    
    fees = []
    async for fee in fees_collection.find().sort("assigned_date", -1):
        fees.append(serialize_doc(fee))
    
    return fees


@router.patch("/{fee_id}/payment")
async def update_fee_payment(fee_id: str, payload: dict):
    """Update payment status for a fee assignment"""
    db = get_db()
    fees_collection = db["fees_structure"]

    oid = parse_object_id(fee_id)
    fee = await fees_collection.find_one({"_id": oid})
    if not fee:
        # Try by string id
        fee = await fees_collection.find_one({"id": fee_id})
        if not fee:
            raise HTTPException(status_code=404, detail="Fee assignment not found")
        oid = fee["_id"]

    update_data = {}
    if "payment_status" in payload or "paymentStatus" in payload:
        status = payload.get("payment_status") or payload.get("paymentStatus")
        update_data["payment_status"] = status
    if "payment_method" in payload or "paymentMethod" in payload:
        update_data["payment_method"] = payload.get("payment_method") or payload.get("paymentMethod")
    if "transaction_id" in payload or "transactionId" in payload:
        update_data["transaction_id"] = payload.get("transaction_id") or payload.get("transactionId")
    if "paid_date" in payload or "paidDate" in payload:
        update_data["paid_date"] = payload.get("paid_date") or payload.get("paidDate")

    if not update_data:
        raise HTTPException(status_code=400, detail="No update fields provided")

    result = await fees_collection.find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=True
    )

    # Also update the student's fee status
    if update_data.get("payment_status"):
        student_id = fee.get("student_id")
        if student_id:
            students_collection = db["students"]
            await students_collection.update_one(
                {"$or": [
                    {"id": student_id},
                    {"student_id": student_id},
                    {"rollNumber": student_id}
                ]},
                {"$set": {
                    "fee_status": update_data["payment_status"],
                    "feeStatus": update_data["payment_status"]
                }}
            )

    return serialize_doc(result)


@router.delete("/{fee_id}")
async def delete_fee_assignment(fee_id: str):
    """Delete a fee assignment"""
    db = get_db()
    fees_collection = db["fees_structure"]

    try:
        oid = parse_object_id(fee_id)
        result = await fees_collection.delete_one({"_id": oid})
    except Exception:
        result = await fees_collection.delete_one({"id": fee_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fee assignment not found")

    return {"message": "Fee assignment deleted"}