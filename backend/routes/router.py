# backend/routes/router.py
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from pydantic import BaseModel
import os, io, pandas as pd, boto3
from fastapi.responses import JSONResponse
from botocore.exceptions import ClientError
from backend.preprocessing import dataanalysis
from .s3_utils import s3_dataset_key, put_bytes, put_pickle_df, get_pickle_df, S3_BUCKET
from backend.auth import verify_cognito_token
from backend.utils.json_utils import safe_json, df_to_json_records

router = APIRouter()

class PreprocessRequest(BaseModel):
    dataset_id: str

class TopRowsRequest(BaseModel):
    dataset_id: str
    target_column: Optional[str] = None # original was just "str" kept it in for future use?


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
    claims = Depends(verify_cognito_token),      # <-- add
):
    user_sub = claims["sub"]
    s3 = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "eu-north-1"))
    prefix = f"{user_sub}/datasets/"
    resp = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)

    datasets = []
    for obj in resp.get("Contents", []):
        key = obj["Key"]
        if key.endswith(".pkl"):
            url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": S3_BUCKET, "Key": key},
                ExpiresIn=3600,
            )
            datasets.append({
                "id": key,
                "key": key,
                "name": key.split("/")[-1],
                "format": "pkl",
                "uploadedAt": obj["LastModified"].isoformat(),
                "downloadUrl": url,
            })
    return JSONResponse(content=datasets)
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
