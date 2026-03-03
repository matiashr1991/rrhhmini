# Guía de Despliegue con Docker

Este documento explica cómo levantar el Sistema de RRHH completo (Base de Datos, Backend y Frontend) en cualquier servidor o computadora utilizando **Docker**.

## Requisitos Previos

1. Tener instalado [Docker](https://docs.docker.com/get-docker/).
2. Tener instalado Docker Compose (usualmente viene incluido con Docker Desktop).

## Archivos Necesarios

Antes de levantar el proyecto, asegurate de tener tu archivo `.env` configurado dentro de la carpeta `backend/`. Este archivo debe contener las credenciales de la base de datos y la API de Hikvision. **Nunca subas este archivo a GitHub.**

Copiá el archivo de ejemplo y completá con tus valores:
```bash
cp backend/.env.example backend/.env
# Luego editá backend/.env con tus credenciales reales
```
> **Nota:** El `DB_HOST` debe ser `mysql_db` (el nombre del contenedor en el `docker-compose.yml`) o `localhost` (para desarrollo local sin Docker). El `docker-compose.yml` fuerza el host a `mysql_db` automáticamente de todos modos.

## Levantar el Sistema (Primer despliegue o actualización)

1. Abre una terminal y colocate en la raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`).
2. Ejecuta el siguiente comando para construir las imágenes y levantar los contenedores en segundo plano:

```bash
docker compose up -d --build
```

- `-d`: Ejecuta los contenedores en modo "detached" (segundo plano) para que puedas cerrar la terminal.
- `--build`: Fuerza la reconstrucción de las imágenes del backend y frontend. Esto es útil si hiciste cambios en el código.

## Apagar el Sistema

Para detener los contenedores sin borrar la información:

```bash
docker compose stop
```

Para detener e iniciar los contenedores (reiniciar):

```bash
docker compose restart
```

## Borrar los Contenedores (La info persistirá)

Para detener y borrar los contenedores y la red creada:

```bash
docker compose down
```
> **¡Importante!** Al ejecutar `down`, la información de la base de datos **NO se borrará** porque está guardada en un volumen persistente (`db_data`). Cuando vuelvas a hacer `docker compose up`, todo estará ahí.

## Borrar TODO (Peligro: Pérdida total de datos)

Si quieres destruir el entorno por completo y **borrar toda la base de datos y sus registros**, ejecuta:

```bash
docker compose down -v
```
El parámetro `-v` elimina los volúmenes, desapareciendo toda tu base de datos permanentemente. Úsalo con mucha cautela.

## Monitorear los Logs

Si algo no funciona o quieres ver qué está haciendo el sistema:

Ver logs de todos los contenedores:
```bash
docker compose logs -f
```

Ver logs de un contenedor en específico (ej: backend):
```bash
docker compose logs -f backend_api
```

## Accesos
- **Frontend App:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Base de Datos:** Puerto expuesto en local al `3306` (Puedes conectar DBeaver o TablePlus a `localhost:3306` con la clave de root).
