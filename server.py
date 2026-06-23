from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os

app = FastAPI(title="Forex CEO Operational Core API")

# Enable CORS so your frontend can communicate securely with your backend local port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "database.json"

# Initialize an empty file database if it doesn't exist yet
if not os.path.exists(DB_FILE):
    with open(DB_FILE, "w") as f:
        json.dump({"students": [], "trades": [], "events": [], "leads": []}, f)

def read_db() -> dict:
    with open(DB_FILE, "r") as f:
        return json.load(f)

def write_db(data: dict):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

# ---------------- API ENDPOINTS FOR THE APP & JARVIS ----------------

@app.get("/api/state")
def get_full_state():
    """Returns the entire application database state for Jarvis to analyze."""
    return read_db()

@app.post("/api/state/sync")
def sync_full_state(payload: Dict[str, Any]):
    """Syncs incoming automated updates from the application interface framework."""
    write_db(payload)
    return {"status": "success", "message": "Database state synced successfully."}

@app.get("/api/students/overdue")
def get_overdue_students():
    """Isolates accounts flagged with a pending balance calculation parameter."""
    db = read_db()
    overdue = []
    # Simple calculation loop checking for overdue student parameters
    for student in db.get("students", []):
        if student.get("status") == "active":
            # If payments don't match the monthly fee structure setup
            payments = student.get("payments", [])
            if not payments:
                overdue.append({"name": student.get("fullName"), "fee": student.get("fee")})
    return {"overdue_students": overdue}

@app.get("/api/journal/stats")
def get_journal_analytics():
    """Computes advanced mechanical execution win-rates for AI reporting loops."""
    db = read_db()
    trades = db.get("trades", [])
    if not trades:
        return {"message": "No trades logged yet."}

    wins = len([t for t in trades if t.get("outcome") == "win" or float(t.get("pnl", 0)) > 0])
    total = len(trades)
    win_rate = (wins / total) * 100 if total > 0 else 0
    total_pnl = sum([float(t.get("pnl", 0)) for t in trades])

    return {
        "total_trades": total,
        "win_rate_percentage": round(win_rate, 2),
        "cumulative_net_pnl": total_pnl
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)