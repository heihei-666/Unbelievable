from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from medical_agent import medical_agent

app = FastAPI(title="医疗导诊助手 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str


@app.get("/")
async def index():
    return FileResponse("static/index.html")


@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    response = medical_agent.run(req.question)
    return AskResponse(answer=response.content)
