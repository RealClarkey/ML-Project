from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import os
import pandas as pd
from backend.dataset_handler import DatasetHandler
from backend.dataform_store import DataFrameStore
from backend.preprocessing import preprocessing

router = APIRouter()
store = DataFrameStore()

UPLOAD_DIR = "backend/datasets"
dataset_handler = DatasetHandler(UPLOAD_DIR)

router = APIRouter()

class PreprocessRequest(BaseModel):
    dataset_id: str

@router.post("/begin_preprocessing")
def begin_preprocessing(req: PreprocessRequest):
    try:
        df = preprocessing.load_dataframe(req.dataset_id)
        summary = preprocessing.get_preprocessing_summary(df)
        return {
            "message": "Preprocessing ready",
            **summary  # includes columns, types, missing values, etc.
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(e)}")

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
    dataset_id = req.dataset_id.replace(".csv", "")  # Remove if user includes ".csv"

    df_path = os.path.join("backend/datasets", f"{dataset_id}.pkl")
    if not os.path.isfile(df_path):
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        df = pd.read_pickle(df_path)
        top = df.head(10).to_dict(orient="records")
        return {"top_rows": top}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load DataFrame: {str(e)}")