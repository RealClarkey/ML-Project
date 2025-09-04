# backend/utils/json_utils.py
import math
from datetime import datetime
import numpy as np
import pandas as pd
from fastapi.encoders import jsonable_encoder

def safe_json(obj):
    """
    Created to try and handle most NaN/Inf types of data within datasets. Convert to None JSON values.
    Deeply sanitize any structure for JSON: NaN/Inf -> None, numpy scalars -> py, timestamps -> iso.
    """
    if obj is None:
        return None

    # numpy scalars
    if isinstance(obj, (np.floating, np.integer, np.bool_)):
        obj = obj.item()

    # floats: handle nan/inf
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj

    # pandas timestamps
    if isinstance(obj, (pd.Timestamp, datetime)):
        return obj.isoformat()

    # containers
    if isinstance(obj, dict):
        return {k: safe_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [safe_json(v) for v in obj]

    return obj


def df_to_json_records(df: pd.DataFrame):
    """Convert a DataFrame into JSON-safe records."""
    # Handle inf -> NaN, then NaN -> None
    tmp = df.replace([np.inf, -np.inf], np.nan)
    tmp = tmp.astype(object).where(pd.notnull(tmp), None)
    records = tmp.to_dict(orient="records")
    return jsonable_encoder(safe_json(records))
