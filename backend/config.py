from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    openai_api_key: str

    # InterSystems IRIS Configuration
    iris_host: str = "localhost"
    iris_port: int = 1972
    iris_namespace: str = "USER"
    iris_username: str = "_SYSTEM"
    iris_password: str = "SYS"

    # Model Configuration
    embedding_model: str = "text-embedding-3-large"
    embedding_dimension: int = 3072
    openai_model: str = "gpt-5-mini"

    # RAG Configuration
    top_k_results: int = 10
    min_relevance_score: float = 0.0

    # Conversation Configuration
    max_history_messages: int = 10
    router_model: str = "gpt-5-mini"
    router_reasoning_effort: str = "minimal"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
