from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import os
import pandas as pd
from backend.dataset_handler import DatasetHandler
from backend.dataform_store import DataFrameStore

router = APIRouter()
store = DataFrameStore()

UPLOAD_DIR = "backend/datasets"
dataset_handler = DatasetHandler(UPLOAD_DIR)

router = APIRouter()

class PreprocessRequest(BaseModel):
    dataset_id: str

@router.post("/begin_preprocessing")
def begin_preprocessing(req: PreprocessRequest):
    dataset_path = os.path.join(UPLOAD_DIR, req.dataset_id)
    if not os.path.isfile(dataset_path):
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        df = pd.read_csv(dataset_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {e}")

    # Example info to return
    columns = df.columns.tolist()
    num_rows = len(df)

    # You could optionally save this dataframe somewhere or cache it for later use
    # For now, just confirm success
    return {
        "message": "Preprocessing started",
        "columns": columns,
        "num_rows": num_rows
    }

@router.post("/upload_csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    contents = await file.read()
    try:
        result = store.save_csv_and_df(contents, file.filename)
        return {
            "message": "Upload successful",
            "dataset_id": result["dataset_id"],
            "original_filename": result["original_filename"],
            "columns": result["columns"],
            "num_rows": result["num_rows"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process dataset: {str(e)}")

class TopRowsRequest(BaseModel):
    dataset_id: str
    target_column: str

@router.post("/top_rows")
def top_rows(req: TopRowsRequest):
    top_rows = dataset_handler.get_top_rows(req.dataset_id)
    if top_rows is None:
        return {"error": "Dataset not found"}
    return {"top_rows": top_rows}