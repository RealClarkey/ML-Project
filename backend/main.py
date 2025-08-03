from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import io
import os
import uuid

from dataset_handler import DatasetHandler  # This file you create

app = FastAPI(debug=True)

# CORS setup for your frontend running on localhost:5173
origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "datasets"
os.makedirs(UPLOAD_DIR, exist_ok=True)

dataset_handler = DatasetHandler(UPLOAD_DIR)

@app.post("/upload_csv")
async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()
    dataset_id, columns = dataset_handler.save_uploaded_csv(contents)
    return {"dataset_id": dataset_id, "columns": columns}

class TopRowsRequest(BaseModel):
    dataset_id: str
    target_column: str

@app.post("/top_rows")
def top_rows(req: TopRowsRequest):
    top_rows = dataset_handler.get_top_rows(req.dataset_id)
    if top_rows is None:
        return {"error": "Dataset not found"}
    return {"top_rows": top_rows}
