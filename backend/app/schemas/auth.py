import uuid

from pydantic import BaseModel, EmailStr, Field

from app.models.usuario import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UsuarioOut(BaseModel):
    id: uuid.UUID
    condominio_id: uuid.UUID
    email: EmailStr
    nombre: str
    rol: UserRole
    is_active: bool

    model_config = {"from_attributes": True}
