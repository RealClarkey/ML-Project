from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI()

# Allowing frontend React (localhost:3000) to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload_csv/")
async def upload_csv(file: UploadFile = File(...)):
    df = pd.read_csv(file.file)
    return {"columns": df.columns.tolist(), "rows": len(df)}