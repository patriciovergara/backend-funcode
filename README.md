# Funcode — Backend

API REST para Funcode, un marketplace de servicios digitales dirigido a emprendimientos y pequeñas empresas.

Gestiona autenticación, usuarios y publicaciones de servicios como páginas web, catálogos digitales y sistemas de gestión.

Desarrollado como proyecto final del programa JavaScript Full Stack.

## Estado del proyecto

La versión documentada del backend incluye:

- Conexión con PostgreSQL.
- Registro e inicio de sesión.
- Autenticación mediante JWT con `jti` para revocación de tokens.
- Sesión protegida con cookie `HttpOnly` y `SameSite=Lax`.
- Logout con invalidación y limpieza de sesión.
- Protección de la API con `helmet`, CORS restringido, HSTS en producción y rate limiting.
- Registro de eventos de seguridad e intentos fallidos de login.
- Perfil autenticado.
- Catálogo y detalle públicos.
- Operaciones sobre publicaciones.
- Portafolio público y gestión administrativa de proyectos realizados.
- Validaciones y manejo de errores.
- Pruebas automatizadas de integración de cuatro escenarios.

La seguridad del backend fue reforzada para reducir riesgos de abuso, brute force, exposición de tokens y acceso desde orígenes no autorizados. Esto se considera un cierre de seguridad previo al despliegue en producción y no reemplaza la validación final del entorno remoto.

## Seguridad y hardening

La capa de seguridad del backend incluye:

- `helmet` para reducir encabezados y riesgos de XSS/Clickjacking.
- `express-rate-limit` para limitar intentos de login y solicitudes intensivas.
- CORS con whitelist de orígenes configurados en `FRONTEND_ORIGIN`.
- `NODE_ENV=production` activa HSTS y deshabilita modos inseguros.
- JWT con `jti`, soporte de revocación y verificación de tokens revocados antes de autorizar peticiones.
- Cookies `HttpOnly` para evitar que el token se exponga en JavaScript del cliente.
- Registro de eventos de seguridad para revocación, intentos fallidos y alertas por abuso.

## Modelo de permisos

La API aplica autorización en el backend:

- Crear publicaciones solo con sesión de administrador.
- Editar y eliminar publicaciones con sesión de administrador, manteniendo el control de propiedad existente.
- Crear, editar, eliminar y administrar proyectos solo con sesión de administrador.

Ocultar enlaces en el frontend no reemplaza estos controles; cada ruta protegida valida el rol desde el backend.

## Tecnologías

- Node.js con módulos ES.
- Express.
- PostgreSQL.
- `pg`.
- `bcryptjs`.
- `jsonwebtoken`.
- `cors`.
- `helmet`.
- `express-rate-limit`.
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
NODE_ENV=development

PGHOST=localhost
PGPORT=5432
PGDATABASE=funcode
PGUSER=postgres
PGPASSWORD=REEMPLAZAR_POR_CONTRASEÑA_LOCAL

JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_LOCAL

TEST_USER_EMAIL=REEMPLAZAR
TEST_USER_PASSWORD=REEMPLAZAR
TEST_POST_ID=REEMPLAZAR
```

En producción, `NODE_ENV` debe configurarse en `production` y `FRONTEND_ORIGIN` debe contener únicamente los orígenes autorizados. Nunca dejar valores comodín ni expedir JWTs con secretos débiles.

El correo corporativo oficial del proyecto es `contacto@funcode.cl` y debe configurarse a través de Zoho Mail/SMTP con las variables `CONTACT_EMAIL`, `SMTP_HOST`, `SMTP_USER` y `SMTP_PASS`.

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

Después del esquema inicial, ejecutar las migraciones pendientes en orden numérico. Para una base nueva:

```bash
psql -h localhost -U postgres -d funcode -f sql/migrations/001_post_price_types.sql
psql -h localhost -U postgres -d funcode -f sql/migrations/002_service_requests.sql
psql -h localhost -U postgres -d funcode -f sql/migrations/003_user_roles.sql
psql -h localhost -U postgres -d funcode -f sql/migrations/004_category_names_ascii.sql
psql -h localhost -U postgres -d funcode -f sql/migrations/005_security_audit.sql
psql -h localhost -U postgres -d funcode -f sql/migrations/006_projects.sql
psql -h localhost -U postgres -d funcode -f sql/migrations/007_litigio_project_image.sql
psql -h localhost -U postgres -d funcode -f sql/migrations/008_email_verification.sql
```

Para una base que ya tiene las migraciones `001` a `005`, ejecutar las migraciones `006` y `007`:

```bash
psql -h localhost -U postgres -d funcode -f sql/migrations/006_projects.sql
psql -h localhost -U postgres -d funcode -f sql/migrations/007_litigio_project_image.sql
```

La migración `006` crea la tabla `projects` e incorpora como ejemplos iniciales los proyectos `litigiomunicipal.cl` y `routeseg.cl`. Revisar las migraciones antes de ejecutarlas en producción y respaldar la base de datos.

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

## Autenticación y sesión

El backend usa JWT para la identidad del usuario y los guarda en una cookie `auth_token` con `httpOnly: true`.

- El registro de cuentas nuevas requiere un código enviado por SMTP. El código vence en 10 minutos y permite cinco intentos; para solicitar otro, se inicia nuevamente el registro. Las cuentas existentes conservan su acceso.
- Antes de activar el registro en un entorno, aplicar la migración `008_email_verification.sql` y configurar y comprobar el envío SMTP. Si falla el envío, no se crea la cuenta.
- Los registros pendientes vencidos se eliminan al iniciar un nuevo registro; si se necesita una política de retención más estricta, programar su eliminación periódica.
- El token no se devuelve ni se expone dentro del cuerpo JSON del login.
- El cliente debe enviar la sesión mediante cookie, con compatibilidad para `Authorization` cuando exista un flujo legado.
- `requireAuth` valida firma, expiración, emisor, audiencia y revocación del `jti` antes de autorizar la operación.
- `logout` invalida el token actual y limpia la cookie del navegador.

Esto reduce la exposición del token en el navegador y mejora la resistencia frente a XSS y reutilización de credenciales.

## Estructura general

```text
backend-funcode/
├── sql/
│   ├── migrations/
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

Las rutas protegidas validan la sesión y el rol en el backend.

| Método | Ruta | Acceso original | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado del servidor. |
| POST | `/users` | Público | Registro. |
| POST | `/login` | Público | Autenticación. |
| GET | `/users/me` | Autenticado | Perfil. |
| GET | `/users/me/posts` | Autenticado | Publicaciones propias. |
| GET | `/posts` | Público | Catálogo. |
| GET | `/posts/:id` | Público | Detalle. |
| POST | `/posts` | Administrador | Crear publicación. |
| PUT | `/posts/:id` | Administrador y propietario | Actualizar publicación. |
| DELETE | `/posts/:id` | Administrador y propietario | Eliminar publicación. |
| GET | `/projects` | Público | Lista proyectos publicados. |
| GET | `/projects/manage` | Administrador | Lista todos los proyectos, incluidos borradores. |
| POST | `/projects` | Administrador | Crear proyecto. |
| PUT | `/projects/:id` | Administrador | Actualizar proyecto. |
| DELETE | `/projects/:id` | Administrador | Eliminar proyecto. |

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

La sesión se establece en una cookie `HttpOnly` al iniciar sesión. El cliente web envía esa cookie con `credentials: "include"`. `Authorization: Bearer ...` se mantiene disponible para clientes compatibles.

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

Respuestas:

- `202`: código enviado; incluye `verificationId` para el siguiente paso. La cuenta aún no existe.
- `400`: datos inválidos.
- `409`: correo ya registrado.
- `429`: límite de intentos alcanzado.
- `503`: no se pudo enviar el correo.

Enviar el código recibido para crear la cuenta:

```http
POST /api/v1/users/verify
Content-Type: application/json
```

```json
{
  "verificationId": "ID_DEVUELTO_POR_EL_REGISTRO",
  "code": "123456"
}
```

La respuesta es `201` si se verificó y creó la cuenta, `400` si el código es incorrecto, venció o agotó los intentos, y `409` si el correo ya fue registrado.

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

- `200`: datos del usuario; el JWT se entrega mediante cookie `HttpOnly`, no en el JSON.
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

## Portafolio de proyectos

La ruta pública `GET /api/v1/projects` devuelve solamente proyectos publicados.
La administración se realiza con cookie de sesión de un usuario `admin`:

- `GET /api/v1/projects/manage`
- `POST /api/v1/projects`
- `PUT /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`

El cuerpo de creación y actualización contiene `title`, `description`,
`project_url`, `image_url` (opcional), `technologies` (lista de textos),
`featured`, `is_published` y `display_order`. Los enlaces externos aceptan
únicamente URLs HTTP o HTTPS.

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