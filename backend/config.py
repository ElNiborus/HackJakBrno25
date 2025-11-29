from pydantic_settings import BaseSettings
from functools import lru_cache
import json
from pathlib import Path
from typing import Optional
from models.schemas import UsersConfig


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

    # User Configuration
    _users_config: Optional[UsersConfig] = None

    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def users_config(self) -> UsersConfig:
        """Lazy load users configuration"""
        if self._users_config is None:
            user_info_path = Path(__file__).parent / "user_info.json"
            with open(user_info_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self._users_config = UsersConfig(**data)
        return self._users_config


@lru_cache()
def get_settings() -> Settings:
    return Settings()
