from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.scheduling_demo import solve_student_timetable_demo_data

app = FastAPI()

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Esta corriendo"}


@app.get("/api/scheduling-demo")
def get_scheduling_demo():
    try:
        return solve_student_timetable_demo_data()
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Error interno al generar el horario: {exc}",
            },
        )
