# Auth API

El servicio usa FastAPI y TinyDB. Para ejecutar el backend desde este directorio:

```bash
uvicorn main:app --reload --port 8000
```

Configura estas variables en `services_auth/api/.env` (ese archivo no debe entrar en Git):

```env
JWT_SECRET=una-clave-larga-y-aleatoria
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
RESET_TOKEN_EXPIRE_MINUTES=30
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:3000
```

`RESEND_API_KEY` se usa exclusivamente para enviar el enlace de recuperación. El endpoint de solicitud responde siempre con `200`, incluso cuando el email no existe. Los tokens se almacenan hasheados en la tabla `reset_tokens`, expiran a los 30 minutos y se marcan como usados tras un reset exitoso.