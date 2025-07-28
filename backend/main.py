from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import pandas as pd

app = FastAPI()

# Allowing frontend React (localhost:3000) to access backend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount React build folder to serve static files (adjust path if needed)
app.mount("/", StaticFiles(directory="../frontend/build", html=True), name="static")

@app.get("/")
def read_index():
    return FileResponse("../frontend/build/index.html")

@app.post("/upload_csv/")
async def upload_csv(file: UploadFile = File(...)):
    df = pd.read_csv(file.file)
    return {"columns": df.columns.tolist(), "rows": df.head().to_dict(orient="records")}
