# Funcode — Backend

API REST para Funcode, un marketplace de servicios digitales dirigido a emprendimientos y pequeñas empresas.

Gestiona autenticación, usuarios y publicaciones de servicios como páginas web, catálogos digitales y sistemas de gestión.

Desarrollado como proyecto final del programa JavaScript Full Stack.

## Estado del proyecto

La versión documentada del backend incluye:

- Conexión con PostgreSQL.
- Registro e inicio de sesión.
- Autenticación mediante JWT.
- Perfil autenticado.
- Catálogo y detalle públicos.
- Operaciones sobre publicaciones.
- Validaciones y manejo de errores.
- Pruebas automatizadas de integración de cuatro escenarios.

La documentación original corresponde al Hito 3.

Actualmente se prepara la integración y el despliegue. No se considera validado el entorno de producción hasta completar las pruebas sobre los servicios remotos.

## Modelo de permisos: revisión pendiente

La implementación documentada originalmente permite:

- Crear publicaciones con autenticación.
- Editar y eliminar publicaciones propias.

El objetivo comercial actual es que solo la administración de Funcode gestione el catálogo.

Antes de abrir el sitio al público, comprobar e implementar los permisos administrativos en el backend.

No asumir que una ruta es exclusiva de administrador porque el frontend oculta sus botones.

## Tecnologías

- Node.js con módulos ES.
- Express.
- PostgreSQL.
- `pg`.
- `bcryptjs`.
- `jsonwebtoken`.
- `cors`.
- Supertest.
- `node:test`.

Consultar `package.json` y `package-lock.json` para versiones exactas.

## Requisitos

- Git.
- Node.js compatible con los scripts y dependencias.
- npm.
- PostgreSQL.
- Una base de datos configurada.

La documentación anterior registra Node.js 22.14.0 como versión utilizada durante las pruebas, no como certificación de compatibilidad con cualquier entorno de despliegue.

## Instalación

```bash
git clone [https://github.com/patriciovergara/backend-funcode.git](https://github.com/patriciovergara/backend-funcode.git)
cd backend-funcode
npm ci
```

Si ya se dispone del proyecto local, ejecutar los comandos desde la carpeta que contiene su `package.json`.

## Variables de entorno

Crear `.env` usando `.env.example` como referencia.

Configuración local documentada:

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173

PGHOST=localhost
PGPORT=5432
PGDATABASE=funcode
PGUSER=postgres
PGPASSWORD=REEMPLAZAR

JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_SEGURO

TEST_USER_EMAIL=REEMPLAZAR
TEST_USER_PASSWORD=REEMPLAZAR
TEST_POST_ID=REEMPLAZAR
```

Generar un secreto JWT:

```bash
node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('hex'))"
```

No publicar el resultado ni incorporarlo al código fuente.

Las variables `TEST_*` corresponden al entorno de pruebas y no deben utilizar credenciales de clientes reales.

La configuración desplegada debe coincidir con las variables que efectivamente lee `src/config/db.js`.

No asumir soporte para `DATABASE_URL` si todavía no está implementado.

## Base de datos local

Crear una base nueva:

```sql
CREATE DATABASE funcode;
```

Desde una terminal:

```bash
psql -h localhost -U postgres -d funcode -f sql/schema.sql
```

El esquema original documenta:

- `users`.
- `categories`.
- `posts`.
- Restricciones y categorías iniciales.

Revisar el contenido de `schema.sql` antes de ejecutarlo.

No ejecutar scripts de inicialización sobre una base con datos existentes sin revisar sus efectos y contar con respaldo.

Comprobar la conexión:

```bash
npm run db:check
```

## Ejecución

Desarrollo:

```bash
npm run dev
```

Inicio:

```bash
npm start
```

Consultar todos los scripts:

```bash
npm run
```

Con `PORT=3000`, la URL base local es:

```text
http://localhost:3000/api/v1
```

## Estructura general

```text
backend-funcode/
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
├── package.json
└── package-lock.json
```

### Responsabilidades

- `app.js`: configuración de Express y montaje de rutas.
- `server.js`: inicio del servidor.
- `controllers/`: procesamiento de solicitudes.
- `models/`: acceso a PostgreSQL.
- `middlewares/`: validación, autenticación y controles transversales.
- `routes/`: definición de endpoints.
- `tests/`: pruebas automatizadas.

## API documentada

Todas las rutas siguientes utilizan el prefijo `/api/v1`.

Los permisos corresponden al contrato original y deben actualizarse cuando se implemente o confirme la autorización administrativa.

| Método | Ruta | Acceso original | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado del servidor. |
| POST | `/users` | Público | Registro. |
| POST | `/login` | Público | Autenticación. |
| GET | `/users/me` | Autenticado | Perfil. |
| GET | `/users/me/posts` | Autenticado | Publicaciones propias. |
| GET | `/posts` | Público | Catálogo. |
| GET | `/posts/:id` | Público | Detalle. |
| POST | `/posts` | Autenticado | Crear publicación. |
| PUT | `/posts/:id` | Propietario | Actualizar publicación. |
| DELETE | `/posts/:id` | Propietario | Eliminar publicación. |

No se documenta aquí un endpoint de cotizaciones porque debe verificarse su implementación real.

## Estado del servidor

```http
GET /api/v1/health
```

Respuesta documentada:

```json
{
  "message": "API de Funcode funcionando"
}
```

Esta respuesta comprueba que Express responde. No demuestra por sí sola que PostgreSQL esté disponible.

## Autenticación

Enviar el JWT en el encabezado:

```http
Authorization: Bearer TOKEN_JWT
```

La configuración original documenta:

- Algoritmo HS256.
- Duración de una hora.
- Emisor `funcode-api`.
- Audiencia `funcode-frontend`.

Verificar estos valores en `src/config/jwt.js` si se modifica la configuración.

La identidad debe obtenerse del token verificado, no de un `user_id` elegido por el cliente.

## Registro

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

Respuestas documentadas:

- `201`: usuario creado.
- `400`: datos inválidos.
- `409`: correo ya registrado.

La respuesta no debe incluir la contraseña ni su hash.

## Inicio de sesión

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

Respuestas documentadas:

- `200`: token y datos del usuario.
- `400`: datos inválidos.
- `401`: credenciales incorrectas.

La cuenta del ejemplo debe existir previamente para autenticarla.

## Catálogo

```http
GET /api/v1/posts?page=1&category=2&search=catálogo
```

Parámetros documentados:

| Parámetro | Uso |
|---|---|
| `page` | Entero positivo; predeterminado `1`. |
| `category` | ID positivo de categoría; opcional. |
| `search` | Búsqueda por título; opcional, hasta 150 caracteres. |

El contrato original utiliza 12 resultados por página.

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

## Crear o editar publicaciones

Cuerpo documentado para `POST /posts` y `PUT /posts/:id`:

```json
{
  "title": "Servicio de ejemplo",
  "description": "Descripción del alcance del servicio.",
  "price": 129990,
  "image_url": "[https://example.com/servicio.jpg](https://example.com/servicio.jpg)",
  "category_id": 1
}
```

Condiciones del contrato original:

- `title`: texto no vacío, máximo 150 caracteres.
- `description`: texto no vacío.
- `price`: número entero positivo en CLP, máximo 12 dígitos.
- `image_url`: URL HTTP o HTTPS sin credenciales.
- `category_id`: categoría existente.
- No enviar `user_id`.

La URL de imagen es ilustrativa.

El contrato original exige precio positivo. Los servicios “A cotizar” requieren verificar si existe una extensión del modelo; no enviar `null` o `0` sin soporte explícito del backend.

## Códigos HTTP

| Código | Significado documentado |
|---|---|
| `200` | Consulta o actualización correcta. |
| `201` | Recurso creado. |
| `204` | Eliminación correcta, sin cuerpo. |
| `400` | Datos o parámetros inválidos. |
| `401` | Credenciales o token inválidos. |
| `404` | Recurso inexistente o no accesible según el contrato original. |
| `409` | Correo ya registrado. |
| `413` | Cuerpo demasiado grande. |
| `500` | Error interno. |

## Pruebas

```bash
npm test
```

La configuración documentada utiliza:

```bash
node --env-file=.env --test src/tests/api.test.js
```

Las pruebas importan `app.js`; no requieren iniciar `server.js`.

PostgreSQL y los datos de prueba deben estar disponibles.

Escenarios originales:

1. Login con credenciales incorrectas: `401`.
2. Perfil sin token: `401`.
3. Detalle de una publicación existente: `200`.
4. Publicaciones propias con página inválida y token válido: `400`.

El README anterior registra cuatro pruebas aprobadas. Ese resultado histórico no sustituye una ejecución sobre la versión actual.

No ejecutar pruebas contra producción sin revisar si modifican datos.

## Integración con el frontend

El frontend utiliza:

```env
VITE_DATA_MODE=api
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

El backend debe permitir el origen real del frontend mediante su configuración CORS.

Antes de desplegar, verificar:

- Métodos y rutas.
- Formatos de request y response.
- Encabezado de autenticación.
- Expiración de sesión.
- Mensajes de error.
- Identificadores de categorías.
- Permisos administrativos.
- Representación de precios y servicios a cotizar.

## Preparación para producción

Arquitectura propuesta, todavía pendiente de despliegue:

- API Express en Render.
- PostgreSQL administrado.
- Frontend en Cloudflare Pages.

Comprobaciones previas:

- [ ] Código sincronizado con GitHub.
- [ ] Inicio correcto con `npm start`.
- [ ] Puerto obtenido del entorno.
- [ ] Interfaz de escucha compatible con el proveedor.
- [ ] Base remota y conexión segura configuradas.
- [ ] CORS limitado a los orígenes autorizados.
- [ ] JWT_SECRET independiente del entorno local.
- [ ] Autorización administrativa implementada y probada.
- [ ] Validaciones y consultas parametrizadas revisadas.
- [ ] Errores sin exposición de secretos.
- [ ] Datos de prueba excluidos.
- [ ] Cuenta administradora creada de forma segura.
- [ ] Catálogo real cargado.
- [ ] Copias de seguridad y recuperación definidas.
- [ ] Persistencia externa o adecuada para archivos, si corresponde.
- [ ] Pruebas completas desde el frontend público.

No considerar el despliegue terminado por obtener únicamente una respuesta de `/health`.

## Seguridad y privacidad

- No versionar `.env`.
- No registrar contraseñas o JWT en logs.
- No devolver hashes de contraseñas.
- No utilizar credenciales de clientes para pruebas.
- Limitar accesos a la base de datos.
- Revisar medidas contra abuso de endpoints públicos.
- Verificar los procesos de rectificación y eliminación de datos.
- Alinear la política de privacidad con el tratamiento real.

Los documentos legales del sitio se muestran en el frontend. El backend debe implementar los controles y procesos que correspondan.

## Repositorio relacionado

Frontend:

https://github.com/patriciovergara/frontend_funcode