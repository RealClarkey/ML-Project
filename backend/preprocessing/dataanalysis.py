import os
import pandas as pd

DATASET_DIR = "backend/datasets"

def load_dataframe(dataset_id: str):
    dataset_id = dataset_id.replace(".csv", "")
    df_path = os.path.join(DATASET_DIR, f"{dataset_id}.pkl")

    if not os.path.isfile(df_path):
        raise FileNotFoundError("Dataset not found")

    return pd.read_pickle(df_path)


def get_dataanalysis_summary(df: pd.DataFrame):
    return {
        "columns": df.columns.tolist(),
        "num_rows": len(df),
        "missing_values": df.isnull().sum().to_dict(),
        "column_types": df.dtypes.astype(str).to_dict(),
        "summary": df.describe().to_dict()
    }
