from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData, Table, Column, Integer, String, update
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
import asyncio
import os

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
AUDIO_FILES_PATH = os.getenv("AUDIO_FILES_PATH")
# Async database engine and session setup
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
metadata = MetaData()

# Table definition
rows = Table(
    "ml_training_finetune",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("audio_file_path", String),
    Column("human_output", String),
    Column("model_output_v1", String),
    Column("model_output_v2", String),
    Column("accuracy_v1", String),
    Column("accuracy_v2", String),
    Column("cdng", String),
    Column("date", String),
    Column("ngdu", String),
    Column("gu", String),
    Column("oiler_number", String),
    Column("rut", String),
    Column("ip_address", String),
    Column("isu", String),
)

# WebSocket clients
clients = []


# Lifespan for startup and shutdown events
async def app_lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)

    async def start_websocket_task():
        await asyncio.create_task(notify_clients())

    yield
    await engine.dispose()


# FastAPI app
app = FastAPI(lifespan=app_lifespan)

app.mount("/media", StaticFiles(directory=AUDIO_FILES_PATH), name="media")
# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific frontend origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models
class Row(BaseModel):
    id: int
    audio_file_path: str
    human_output: Optional[str] = None  # Allow None
    model_output_v1: Optional[str] = None  # Allow None
    model_output_v2: Optional[str] = None  # Allow None
    accuracy_v1: Optional[str] = None  # Allow None
    accuracy_v2: Optional[str] = None  # Allow None
    cdng: Optional[str] = None  # Allow None
    date: Optional[str] = None  # Allow None
    ngdu: Optional[str] = None  # Allow None
    gu: Optional[str] = None  # Allow None
    oiler_number: Optional[str] = None  # Allow None
    rut: Optional[str] = None  # Allow None
    ip_address: Optional[str] = None  # Allow None
    isu: Optional[str] = None  # Allow None
    class Config:
        from_attributes = True

# WebSocket route
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.remove(websocket)


# Notify connected WebSocket clients of updates
async def notify_clients():
    while True:
        if clients:
            for client in clients:
                await client.send_text("update")
        await asyncio.sleep(2)


# CRUD API endpoints
@app.get("/rows", response_model=list[Row])
async def get_rows():
    async with async_session() as session:
        result = await session.execute(rows.select())
        return result


@app.put("/rows/{row_id}")
async def update_row(row_id: int, row: dict):  # `row` is expected to be a dict
    async with async_session() as session:
        async with session.begin():
            # Define the update statement correctly
            stmt = (
                update(rows)  # Assuming `rows` is a valid SQLAlchemy table object
                .where(rows.c.id == row_id)  # Assuming 'id' is the column name
                .values(row)  # If row is a dict, you can pass it directly here
            )
            result = await session.execute(stmt)
            await session.commit()
            return {"status": "success", "updated_rows": result.rowcount}


# Endpoint to serve the audio file
@app.get("/media/{audio_file_name}")
async def get_audio(audio_file_name: str):
    # Create the full path to the audio file
    audio_file_path = os.path.join(AUDIO_FILES_PATH, audio_file_name)

    # Check if the file exists
    if os.path.exists(audio_file_path):
        return FileResponse(audio_file_path)
    else:
        raise HTTPException(status_code=404, detail="Аудио не найдено")