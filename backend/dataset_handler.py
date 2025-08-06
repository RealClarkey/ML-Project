import os
import uuid
import pandas as pd
import io

class DatasetHandler:
    def __init__(self, upload_dir):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    def save_uploaded_csv(self, file_bytes: bytes):
        dataset_id = str(uuid.uuid4())
        file_path = os.path.join(self.upload_dir, f"{dataset_id}.csv")
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        df = pd.read_csv(file_path)
        return dataset_id, df.columns.tolist()

    def get_top_rows(self, dataset_id, n=10):
        file_path = os.path.join(self.upload_dir, f"{dataset_id}.csv")
        if not os.path.exists(file_path):
            return None
        df = pd.read_csv(file_path)
        return df.head(n).to_dict(orient="records")
