import request from "supertest";
import { test, describe, after } from "node:test";
import assert from "node:assert/strict";

import app from "../app.js";
import pool from "../config/db.js";

const baseURL = "/api/v1";

const testUserEmail = process.env.TEST_USER_EMAIL;
const testUserPassword = process.env.TEST_USER_PASSWORD;
const testPostId = process.env.TEST_POST_ID;

if (!testUserEmail || !testUserPassword || !testPostId) {
  throw new Error(
    "Faltan TEST_USER_EMAIL, TEST_USER_PASSWORD o TEST_POST_ID en .env",
  );
}

describe("API de Funcode", () => {
  test("POST /login rechaza credenciales incorrectas con 401", async () => {
    const response = await request(app)
      .post(`${baseURL}/login`)
      .send({
        email: testUserEmail,
        password: "ContraseñaIncorrecta123",
      });

    assert.equal(response.status, 401);
    assert.equal(response.body.message, "Correo o contraseña incorrectos");
    assert.equal(response.body.token, undefined);
  });

  test("GET /users/me rechaza una solicitud sin token con 401", async () => {
    const response = await request(app).get(`${baseURL}/users/me`);

    assert.equal(response.status, 401);
    assert.equal(
      response.body.message,
      "Debes enviar un token de autenticación",
    );
  });

  test("GET /posts/:id devuelve una publicación existente con 200", async () => {
    const response = await request(app).get(`${baseURL}/posts/${testPostId}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.post.id, Number(testPostId));
    assert.equal(typeof response.body.post.title, "string");
    assert.equal(typeof response.body.post.price, "number");
    assert.ok(response.body.post.category);
    assert.ok(response.body.post.user);
  });

  test("GET /users/me/posts rechaza una página inválida con 400", async () => {
    const loginResponse = await request(app)
      .post(`${baseURL}/login`)
      .send({
        email: testUserEmail,
        password: testUserPassword,
      });

    assert.equal(loginResponse.status, 200);

    const response = await request(app)
      .get(`${baseURL}/users/me/posts?page=0`)
      .set("Cookie", loginResponse.headers["set-cookie"]);

    assert.equal(response.status, 400);
  });

  test("GET /projects/manage rechaza solicitudes sin sesión", async () => {
    const response = await request(app).get(`${baseURL}/projects/manage`);

    assert.equal(response.status, 401);
  });

  test("POST /projects rechaza solicitudes sin sesión", async () => {
    const response = await request(app)
      .post(`${baseURL}/projects`)
      .send({});

    assert.equal(response.status, 401);
  });
});

after(async () => {
  await pool.end();
});