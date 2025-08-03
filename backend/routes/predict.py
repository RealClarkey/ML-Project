from pydantic import BaseModel
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression

class PredictRequest(BaseModel):
    dataset_id: str
    target_column: str
    model_type: str

@app.post("/predict")
def predict(req: PredictRequest):
    df = pd.read_csv(f"{UPLOAD_DIR}/{req.dataset_id}.csv")

    X = df.drop(columns=[req.target_column])
    y = df[req.target_column]

    # Use only numeric features, fill missing values
    X = X.select_dtypes(include=['number']).fillna(0)
    X_train, X_test, y_train, _ = train_test_split(X, y, test_size=0.2)

    if req.model_type == "random_forest":
        model = RandomForestRegressor()
    else:
        model = LinearRegression()

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    return {"predictions": predictions.tolist()}
