from fastapi import FastAPI
from app.api.websocket import router

app = FastAPI(title="Ai powered meeting analyzer")

app.include_router(router)


@app.get("/")
def root():
    return {"status": "Backend running"}
