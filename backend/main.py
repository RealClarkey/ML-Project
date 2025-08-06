from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.router import router
app = FastAPI(debug=True)

# CORS setup for your frontend running on localhost:5173
origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
