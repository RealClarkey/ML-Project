# backend/routes/s3_utils.py
import io, uuid, os, pickle
import pandas as pd
import boto3
from dotenv import load_dotenv

load_dotenv()


S3_BUCKET = os.environ["S3_BUCKET"]
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
)
if not S3_BUCKET:
    raise RuntimeError("Missing S3_BUCKET environment variable")
REGION = os.environ.get("AWS_REGION", "eu-north-1")
S3 = boto3.client("s3", region_name=REGION)

def s3_dataset_key(user_sub: str, filename: str) -> str:
    base, ext = os.path.splitext(filename)
    uid = uuid.uuid4().hex
    return f"{user_sub}/datasets/{uid}{ext.lower()}"

def put_bytes(key: str, data: bytes, content_type: str):
    S3.put_object(Bucket=S3_BUCKET, Key=key, Body=data, ContentType=content_type)

def put_pickle_df(key: str, df: pd.DataFrame):
    buf = io.BytesIO()
    pickle.dump(df, buf, protocol=pickle.HIGHEST_PROTOCOL)
    buf.seek(0)
    S3.put_object(Bucket=S3_BUCKET, Key=key, Body=buf.getvalue(), ContentType="application/octet-stream")

def get_pickle_df(key: str) -> pd.DataFrame:
    obj = S3.get_object(Bucket=S3_BUCKET, Key=key)
    return pickle.load(io.BytesIO(obj["Body"].read()))
