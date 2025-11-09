from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from uncertanity_router import router
import uvicorn
from pathlib import Path
import os

# Ścieżka do katalogu statycznych plików
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "static"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files PRZED routerem
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.include_router(router=router)


@app.get("/")
async def serve_root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/{path_name:path}")
async def serve_frontend(path_name: str):
    # Nie podawaj index.html dla /api/* i innych ścieżek systemowych
    if path_name.startswith("api") or path_name.startswith("."):
        from fastapi.responses import JSONResponse
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)