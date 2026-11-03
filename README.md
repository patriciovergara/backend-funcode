# Funcode Backend

API REST para Funcode, un marketplace de servicios digitales. Permite registrar usuarios, iniciar sesión y gestionar publicaciones de páginas web, catálogos digitales y sistemas de gestión.

Desarrollado para el **Hito 3: Desarrollo Backend** del proyecto final JavaScript Full Stack.

## Tecnologías

- Node.js con módulos ES.
- Express: servidor y rutas HTTP.
- PostgreSQL y `pg`: almacenamiento y consultas parametrizadas.
- `bcryptjs`: hash y comparación de contraseñas.
- `jsonwebtoken`: emisión y verificación de JWT.
- `cors`: configuración de consultas de otros orígenes.
- Supertest y `node:test`: pruebas automatizadas de la API.
- Thunder Client: pruebas manuales.

## Funcionalidades

- Registro con validación de datos y normalización del correo.
- Inicio de sesión y emisión de JWT.
- Consulta del perfil autenticado.
- Catálogo público con búsqueda por título, filtro por categoría y paginación.
- Detalle público de una publicación.
- Creación de publicaciones con autenticación.
- Edición y eliminación restringidas al propietario.
- Listado paginado de publicaciones del usuario autenticado.

## Requisitos de ejecución

- Node.js 22.14.0, versión utilizada durante las pruebas.
- npm.
- PostgreSQL en ejecución.
- Una base de datos local configurada para el proyecto.

## Instalación

Desde la carpeta `Funcode_backend`, instalar las dependencias:

```bash
npm install
```

### Configuración de entorno

Crear un archivo `.env` en la raíz del backend usando `.env.example` como referencia. Configurar las siguientes variables:

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173

PGHOST=localhost
PGPORT=5432
PGDATABASE=funcode
PGUSER=postgres
PGPASSWORD=REEMPLAZAR_POR_CONTRASENA_LOCAL

JWT_SECRET=REEMPLAZAR_POR_SECRETO_HEXADECIMAL_DE_64_CARACTERES

TEST_USER_EMAIL=REEMPLAZAR_POR_CORREO_DE_USUARIO_EXISTENTE
TEST_USER_PASSWORD=REEMPLAZAR_POR_CONTRASENA_DE_PRUEBA
TEST_POST_ID=REEMPLAZAR_POR_ID_DE_PUBLICACION_EXISTENTE
```

Generar el secreto JWT con:

```bash
node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('hex'))"
```

No versionar `.env` ni publicar credenciales o tokens. Las variables `TEST_*` se utilizan para ejecutar las pruebas automatizadas y deben corresponder a datos existentes en la base local.

### Base de datos

Crear la base de datos desde una sesión de PostgreSQL con permisos suficientes:

```sql
CREATE DATABASE funcode;
```

Desde una terminal, ejecutar el esquema sobre la base recién creada:

```bash
psql -h localhost -U postgres -d funcode -f sql/schema.sql
```

El esquema contiene las tablas `users`, `categories` y `posts`, sus restricciones y las categorías iniciales. Ejecutarlo una sola vez sobre una base nueva; no volver a ejecutarlo sobre una base ya configurada.

Comprobar la conexión desde Node.js:

```bash
npm run db:check
```

## Ejecución

Iniciar el backend:

```bash
npm start
```

Iniciar en modo desarrollo con reinicio automático:

```bash
npm run dev
```

Con `PORT=3000`, la URL base de la API es:

```text
http://localhost:3000/api/v1
```

Comprobar el servidor:

```http
GET /api/v1/health
```

Respuesta esperada:

```json
{
  "message": "API de Funcode funcionando"
}
```

Esta ruta comprueba la respuesta del servidor; no verifica por sí sola la conexión con PostgreSQL.

## Estructura principal

```text
Funcode_backend/
├── sql/
│   └── schema.sql
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── jwt.js
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── tests/
│   │   └── api.test.js
│   ├── app.js
│   └── server.js
├── .env.example
├── .gitignore
├── package-lock.json
└── package.json
```

`app.js` configura y exporta Express. `server.js` inicia la escucha del servidor. Los modelos contienen las consultas SQL; los controladores procesan las solicitudes y los middlewares validan los datos y la autenticación.

## Endpoints

Todas las rutas de la tabla utilizan el prefijo `/api/v1`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Comprobación del servidor. |
| POST | `/users` | Público | Registrar un usuario. |
| POST | `/login` | Público | Iniciar sesión y obtener un JWT. |
| GET | `/users/me` | Privado | Consultar el perfil autenticado. |
| GET | `/users/me/posts` | Privado | Listar las publicaciones propias. |
| GET | `/posts` | Público | Consultar el catálogo. |
| GET | `/posts/:id` | Público | Consultar una publicación. |
| POST | `/posts` | Privado | Crear una publicación. |
| PUT | `/posts/:id` | Propietario | Actualizar una publicación. |
| DELETE | `/posts/:id` | Propietario | Eliminar una publicación. |

### Autenticación

Enviar el token obtenido en el login mediante este encabezado:

```http
Authorization: Bearer TOKEN_JWT
```

Los tokens utilizan HS256, tienen una duración de una hora y se verifican con el emisor `funcode-api` y la audiencia `funcode-frontend`.

La identidad del usuario se obtiene del token verificado mediante `req.auth.userId`. El cliente no puede elegir el propietario enviando `user_id`.

### Registro

```http
POST /api/v1/users
Content-Type: application/json
```

```json
{
  "name": "Usuario de ejemplo",
  "email": "usuario@example.com",
  "password": "ClaveDeEjemplo123!"
}
```

- `201`: usuario registrado.
- `400`: datos inválidos o incompletos.
- `409`: correo ya registrado.

La respuesta no incluye la contraseña ni su hash.

### Inicio de sesión

```http
POST /api/v1/login
Content-Type: application/json
```

```json
{
  "email": "usuario@example.com",
  "password": "ClaveDeEjemplo123!"
}
```

- `200`: sesión iniciada; devuelve `token` y los datos del usuario.
- `400`: credenciales incompletas o con tipos inválidos.
- `401`: credenciales incorrectas.

Las credenciales del ejemplo solo funcionan si previamente se registró esa cuenta.

### Catálogo público

```http
GET /api/v1/posts?page=1&category=2&search=catálogo
```

| Parámetro | Descripción |
|---|---|
| `page` | Entero positivo. Valor predeterminado: `1`. |
| `category` | Identificador positivo de categoría; opcional. |
| `search` | Texto de búsqueda en el título; opcional, hasta 150 caracteres. |

El listado utiliza 12 publicaciones por página y orden descendente por fecha de creación e identificador. La búsqueda no distingue mayúsculas de minúsculas, pero sí conserva diferencias de acentuación.

Estructura de respuesta:

```json
{
  "posts": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 0
  }
}
```

### Crear o editar una publicación

Enviar el siguiente cuerpo a `POST /api/v1/posts` o `PUT /api/v1/posts/:id`, con un token válido:

```json
{
  "title": "Catálogo digital para emprendimiento",
  "description": "Diseño de catálogo digital con imágenes y datos de contacto.",
  "price": 35000,
  "image_url": "https://example.com/catalogo.jpg",
  "category_id": 2
}
```

- `price`: número JSON entero positivo, sin decimales, de hasta 12 dígitos; representa un precio en CLP.
- `category_id`: número JSON entero positivo correspondiente a una categoría existente.
- `image_url`: URL HTTP o HTTPS sin credenciales. La validación no garantiza que el recurso exista.
- `title`: texto no vacío de hasta 150 caracteres.
- `description`: texto no vacío.
- No enviar `user_id`.

La edición recibe todos los campos indicados y actualiza `updated_at`.

### Publicaciones propias

```http
GET /api/v1/users/me/posts?page=1
Authorization: Bearer TOKEN_JWT
```

Devuelve únicamente las publicaciones del usuario autenticado, con hasta 12 resultados por página y la estructura `posts` y `pagination`.

### Códigos de respuesta principales

| Código | Uso |
|---|---|
| `200` | Consulta o actualización exitosa. |
| `201` | Usuario o publicación creados. |
| `204` | Publicación eliminada; respuesta sin cuerpo. |
| `400` | Datos, identificadores o parámetros inválidos. |
| `401` | Credenciales incorrectas, token ausente, inválido o vencido. |
| `404` | Ruta o publicación inexistente; también edición o eliminación de una publicación ajena. |
| `409` | Correo ya registrado. |
| `413` | Cuerpo de la solicitud superior al límite configurado. |
| `500` | Error interno del servidor. |

## Pruebas automatizadas

Ejecutar:

```bash
npm test
```

El script utiliza:

```bash
node --env-file=.env --test src/tests/api.test.js
```

Las pruebas importan directamente `app.js`; no requieren iniciar previamente `server.js`. PostgreSQL debe estar disponible.

| Ruta | Escenario | Estado esperado |
|---|---|---|
| `POST /api/v1/login` | Credenciales incorrectas. | `401` |
| `GET /api/v1/users/me` | Solicitud sin token. | `401` |
| `GET /api/v1/posts/:id` | Publicación existente configurada en `TEST_POST_ID`. | `200` |
| `GET /api/v1/users/me/posts?page=0` | Token válido y página inválida. | `400` |

La última prueba obtiene automáticamente un token mediante login. Al finalizar, el hook `after` cierra el pool de PostgreSQL.

Resultado comprobado:

```text
tests 4
suites 1
pass 4
fail 0
```

Las pruebas usan la base de datos local configurada en `.env` y dependen de un usuario y una publicación existentes. La contraseña utilizada para el escenario de credenciales incorrectas debe ser distinta de la contraseña real de la cuenta de prueba.

## Alcance del hito

Este backend corresponde al Hito 3 e incluye proyecto npm, comunicación con PostgreSQL mediante `pg`, autenticación y autorización JWT, CORS, middlewares y pruebas de cuatro rutas con Supertest. Las pruebas manuales se realizaron con Thunder Client.

La integración del frontend con el backend no se ha realizado y no forma parte de los requisitos explícitos de este hito.
