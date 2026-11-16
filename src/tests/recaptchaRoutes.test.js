import assert from "node:assert/strict";
import { after, test } from "node:test";
import request from "supertest";

process.env.RECAPTCHA_SECRET = "test-secret";
process.env.FRONTEND_ORIGIN = "https://funcode.cl,https://www.funcode.cl";
globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({
    success: true,
    action: "wrong_action",
    hostname: "funcode.cl",
    score: 0.9,
  }),
});

const { default: app } = await import("../app.js");
const { default: pool } = await import("../config/db.js");

test("los cuatro endpoints exigen un token y rechazan acciones distintas", async () => {
  const cases = [
    ["/api/v1/users", { name: "Prueba", email: "test@example.com", password: "ClavePrueba123" }],
    ["/api/v1/login", { email: "test@example.com", password: "ClavePrueba123" }],
    ["/api/v1/contact", { name: "Prueba", email: "test@example.com", message: "Mensaje de prueba" }],
    ["/api/v1/service-requests", { post_id: 1, full_name: "Prueba", email: "test@example.com", message: "Mensaje de prueba" }],
  ];
  for (const [path, body] of cases) {
    assert.equal((await request(app).post(path).send(body)).status, 400, path);
    assert.equal((await request(app).post(path).send({ ...body, recaptchaToken: "token" })).status, 403, path);
  }
});

after(async () => pool.end());
