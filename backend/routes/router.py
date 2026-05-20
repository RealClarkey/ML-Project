# backend/routes/router.py
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from pydantic import BaseModel
import os, time, io, pandas as pd, boto3, numpy as np
from fastapi.responses import JSONResponse
from botocore.exceptions import ClientError
from backend.preprocessing import dataanalysis
from .s3_utils import s3_dataset_key, put_bytes, put_pickle_df, get_pickle_df, S3_BUCKET
from backend.auth import verify_cognito_token
from backend.utils.json_utils import safe_json, df_to_json_records
from typing import Optional, Dict, Any

router = APIRouter()

class PreprocessRequest(BaseModel):
    dataset_id: str

class TopRowsRequest(BaseModel):
    dataset_id: str
    target_column: Optional[str] = None # original was just "str" kept it in for future use?

class PreprocessAndSaveRequest(BaseModel):
    dataset_id: str                    # S3 key to original .pkl
    strategy: Optional[str] = "basic"  # for future variations
    options: Optional[Dict[str, Any]] = None

def basic_preprocess(df: pd.DataFrame, options: dict | None = None) -> pd.DataFrame:
    """Simple example preprocessing — replace with your own pipeline."""
    opts = options or {}
    df = df.copy()

    # 1. Normalize column names
    df.columns = [str(c).strip().lower() for c in df.columns]

    # 2. Drop all-NaN columns
    if opts.get("drop_all_nan", True):
        df = df.dropna(axis=1, how="all")

    # 3. Fill numeric NaN with median
    num_cols = df.select_dtypes(include=[np.number]).columns
    for c in num_cols:
        med = df[c].median(skipna=True)
        if pd.isna(med):
            continue
        df[c] = df[c].fillna(med)

    # 4. Fill categorical NaN with mode
    cat_cols = df.select_dtypes(exclude=[np.number]).columns
    for c in cat_cols:
        mode = df[c].mode(dropna=True)
        if len(mode) > 0:
            df[c] = df[c].fillna(mode.iloc[0])

    return df


@router.post("/upload_csv")
async def upload_csv(
    file: UploadFile = File(...),
    claims = Depends(verify_cognito_token),      # <-- add
):
    user_sub = claims["sub"]                     # <-- real user id
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    raw = await file.read()
    try:
        csv_key = s3_dataset_key(user_sub, file.filename)
        put_bytes(csv_key, raw, "text/csv")

        df = pd.read_csv(io.BytesIO(raw))
        pkl_key = csv_key.rsplit(".", 1)[0] + ".pkl"
        put_pickle_df(pkl_key, df)

        return {
            "message": "Upload successful",
            "dataset_id": pkl_key,
            "original_filename": file.filename,
            "columns": list(df.columns),
            "num_rows": len(df),
            "s3": {"csv": csv_key, "pkl": pkl_key},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process dataset: {e}")

@router.get("/datasets")
def list_datasets(
    claims = Depends(verify_cognito_token),
):
    user_sub = claims["sub"]
    s3 = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "eu-north-1"))
    prefixes = [f"{user_sub}/datasets/", f"{user_sub}/processed/"]

    out = []
    for prefix in prefixes:
        resp = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
        for obj in resp.get("Contents", []):
            key = obj["Key"]
            if not key.endswith(".pkl"):
                continue
            url = s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": S3_BUCKET,
                    "Key": key,
                    "ResponseContentDisposition": f'attachment; filename="{key.split("/")[-1]}"',
                },
                ExpiresIn=3600,
            )
            out.append({
                "id": key,
                "key": key,
                "name": key.split("/")[-1],
                "format": "pkl",
                "uploadedAt": obj["LastModified"].isoformat(),
                "downloadUrl": url,
                "folder": "processed" if "/processed/" in key else "datasets",
            })
    # newest first (optional)
    out.sort(key=lambda r: r["uploadedAt"], reverse=True)
    return out
# Delete dataset from S3 bucket.
# Used from the data table field in membership area.
@router.delete("/datasets")
def delete_dataset(
        key: str = Query(..., description="S3 object key of the dataset (e.g. <sub>/datasets/foo.pkl)"),
        claims=Depends(verify_cognito_token),
):
    user_sub = claims["sub"]
    first_segment = key.split("/", 1)[0]
    if first_segment != user_sub:
        raise HTTPException(status_code=403, detail="Not your dataset")

    s3 = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "eu-north-1"))

    #Deleting the plk file
    try:
        s3.delete_object(Bucket=S3_BUCKET, Key=key)
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code in ("NoSuchKey", "404"):
            raise HTTPException(status_code=404, detail=f"Dataset not found")
        raise HTTPException(status_code=500, detail=f"Failed to delete dataset: {e}")

    #Deleting the associated .csv file
    if key.endswith(".pkl"):
        csv_key = key[:-4] + ".csv"
        try:
            s3.delete_object(Bucket=S3_BUCKET, Key=csv_key)
        except ClientError:
            pass

    return {"ok": True, "deleted": key}

@router.post("/begin_preprocessing")
def begin_preprocessing(
    req: PreprocessRequest,
    claims = Depends(verify_cognito_token),      # <-- add
):
    user_sub = claims["sub"]
    if not req.dataset_id.startswith(f"{user_sub}/"):
        raise HTTPException(status_code=403, detail="Not your dataset")

    try:
        df = get_pickle_df(req.dataset_id)
        summary = dataanalysis.get_dataanalysis_summary(df)
        return {"message": "", **summary} #This was Message: "Preprocessing complete"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {e}")

@router.post("/top_rows")
def top_rows(
    req: TopRowsRequest,
    claims = Depends(verify_cognito_token),
):
    user_sub = claims["sub"]
    key = req.dataset_id if req.dataset_id.endswith(".pkl") else f"{req.dataset_id}.pkl"
    if not key.startswith(f"{user_sub}/"):
        raise HTTPException(status_code=403, detail="Not your dataset")

    try:
        df = get_pickle_df(key)
        top = df_to_json_records(df.head(10))  # NaN/Inf → None, numpy → py types
        return {"top_rows": top}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load DataFrame: {e}")

@router.post("/preprocess_and_save")
def preprocess_and_save(
    req: PreprocessAndSaveRequest,
    claims = Depends(verify_cognito_token),
):
    user_sub = claims["sub"]
    if not req.dataset_id.startswith(f"{user_sub}/"):
        raise HTTPException(status_code=403, detail="Not your dataset")

    # 1) load
    try:
        df = get_pickle_df(req.dataset_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Original dataset not found: {e}")

    # 2) preprocess
    try:
        df_proc = basic_preprocess(df, req.options)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {e}")

    # 3) save as new key (processed/)
    base = os.path.basename(req.dataset_id)                  # foo.pkl
    stem = base[:-4] if base.endswith(".pkl") else base      # foo
    ts = int(time.time())
    new_key = f"{user_sub}/processed/{stem}__preprocessed_{ts}.pkl"
    try:
        put_pickle_df(new_key, df_proc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save preprocessed dataset: {e}")

    # 4) presign and return
    s3 = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "eu-north-1"))
    url = s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": S3_BUCKET,
            "Key": new_key,
            "ResponseContentDisposition": f'attachment; filename="{os.path.basename(new_key)}"',
        },
        ExpiresIn=3600,
    )
    return {
        "message": "Preprocessed dataset saved",
        "original_key": req.dataset_id,
        "new_key": new_key,
        "downloadUrl": url,
        "rows": int(len(df_proc)),
        "cols": int(df_proc.shape[1]),
    }
