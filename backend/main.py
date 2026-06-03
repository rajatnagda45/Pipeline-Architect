from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import PipelineRequest
from dag import is_dag

app = FastAPI(title="VectorShift Pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.post("/pipelines/parse")
def parse_pipeline(pipeline: PipelineRequest):
    num_nodes = len(pipeline.nodes)
    num_edges = len(pipeline.edges)
    dag = is_dag(pipeline.nodes, pipeline.edges)
    return {"num_nodes": num_nodes, "num_edges": num_edges, "is_dag": dag}
