import os
import uuid
import pandas as pd

class DataFrameStore:
    def __init__(self, dataset_dir="backend/datasets"):
        self.dataset_dir = dataset_dir
        os.makedirs(self.dataset_dir, exist_ok=True)

    def save_csv_and_df(self, contents, original_filename):
        # Generate a unique base name (without extension)
        # dataset_id = str(uuid.uuid4())

        #Use original file name but add unique user to the end.
        base_name = os.path.splitext(original_filename)[0]
        safe_name = base_name.replace(" ", "_").lower()
        dataset_id = f"{safe_name}_user" #user will be changed to username when adding membership.

        csv_filename = f"{dataset_id}.csv"
        pkl_filename = f"{dataset_id}.pkl"

        csv_path = os.path.join(self.dataset_dir, csv_filename)
        pkl_path = os.path.join(self.dataset_dir, pkl_filename)

        # Save CSV
        with open(csv_path, "wb") as f:
            f.write(contents)
            print(f"CSV Saved to: {csv_path}", flush=True)

        try:
            # Convert to DataFrame
            df = pd.read_csv(csv_path)
        except Exception as e:
            raise RuntimeError(f"Error reading CSV into DataFrame: {e}")

        try:
            # Save as .pkl
            df.to_pickle(pkl_path)
            print(f"Saved DataFrame to: {pkl_path}", flush=True)
        except Exception as e:
            raise RuntimeError(f"Error saving DataFrame as pickle: {e}")

        return {
            "dataset_id": csv_filename,
            "original_filename": original_filename,
            "columns": df.columns.tolist(),
            "num_rows": len(df)
        }
