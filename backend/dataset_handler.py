import uuid
import io
import pandas as pd
import os

class DatasetHandler:
    def __init__(self, upload_dir):
        self.upload_dir = upload_dir

    def save_uploaded_csv(self, contents: bytes) -> (str, list):
        df = pd.read_csv(io.BytesIO(contents))
        dataset_id = str(uuid.uuid4())
        file_path = os.path.join(self.upload_dir, f"{dataset_id}.csv")
        df.to_csv(file_path, index=False)
        return dataset_id, df.columns.tolist()

    def get_top_rows(self, dataset_id, n=10):
        file_path = os.path.join(self.upload_dir, f"{dataset_id}.csv")
        if not os.path.exists(file_path):
            return None
        df = pd.read_csv(file_path)
        return df.head(n).to_dict(orient="records")
