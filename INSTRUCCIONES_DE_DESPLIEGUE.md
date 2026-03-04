# Guía de Despliegue — Docker Swarm + Traefik

Este documento explica cómo desplegar el Sistema RRHH en un VPS con **Docker Swarm**, **Traefik** como reverse proxy, y **MySQL corriendo en el host**.

## Arquitectura

```
Internet → Traefik (HTTPS) → rrhh.mmatdev.com
                                ├── /api/*  → backend_api:8000  (NestJS)
                                └── /*      → frontend_web:3000 (Next.js)
                                
                backend_api → host.docker.internal:3306 (MySQL del host)
```

## Requisitos

1. **Docker** con Swarm mode habilitado (`docker swarm init`)
2. **Traefik** corriendo como servicio Swarm con red externa `web`
3. **MySQL 8.0** corriendo en el host (no en Docker)
4. Dominio `rrhh.mmatdev.com` apuntando al VPS

## Paso 1: Preparar variables de entorno

Crear el archivo `.env` junto al `docker-compose.yml`:

```bash
cp .env.example .env
nano .env   # Completar con las credenciales reales
```

Variables obligatorias:
- `DB_PASSWORD` — contraseña del MySQL del host
- `JWT_SECRET` — secreto largo (>32 chars) para tokens JWT
- `MAIL_PASS` — app password de Gmail
- `HIK_API_KEY` — API Key de Hikvision

## Paso 2: Crear la base de datos en MySQL

Si todavía no existe la base de datos:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS rrhh_moderno CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## Paso 3: Build de las imágenes

```bash
docker compose build
```

Esto construye `rrhh-backend:latest` y `rrhh-frontend:latest` usando los Dockerfiles multi-stage.

## Paso 4: Deploy del stack

```bash
docker stack deploy -c docker-compose.yml rrhhmini
```

Verificar que los servicios estén corriendo:
```bash
docker service ls | grep rrhhmini
docker service logs rrhhmini_backend_api -f
docker service logs rrhhmini_frontend_web -f
```

## Paso 5: Verificar

- **Frontend:** https://rrhh.mmatdev.com/login
- **Backend API:** https://rrhh.mmatdev.com/api/health (si existe el endpoint)
- **Logs:** `docker service logs rrhhmini_backend_api -f`

## Actualizar el sistema

Para desplegar una nueva versión:

```bash
cd /opt/stacks/rrhhmini
git pull
docker compose build
docker stack deploy -c docker-compose.yml rrhhmini
```

> Los servicios se actualizan con rolling update automático.

## Notas importantes

- **`DB_SYNC=false`** en producción: TypeORM no modificará el esquema automáticamente. Para migraciones de esquema, usar TypeORM CLI o scripts SQL manuales.
- **`host.docker.internal`** es la forma estándar de acceder al host desde un contenedor Docker. Funciona en Linux con `extra_hosts: ["host.docker.internal:host-gateway"]`.
- **Red `web`**: debe existir antes del deploy (`docker network create --driver overlay web`).
- **Traefik strip-prefix**: el middleware `rrhh-strip-api` quita `/api` antes de reenviar al backend, así NestJS recibe las rutas limpias (ej: `/employees` en vez de `/api/employees`).
