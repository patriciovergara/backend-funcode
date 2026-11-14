import { randomUUID, createHmac } from "node:crypto";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcryptjs";

// Prevent integration tests from sending mail to real addresses.
delete process.env.SMTP_HOST;
const { default: app } = await import("../app.js");
const { default: pool } = await import("../config/db.js");
const { jwtConfig } = await import("../config/jwt.js");

const email = `verification-${randomUUID()}@example.invalid`;
const ids = [];

async function addPending({ expired = false, pendingEmail = email } = {}) {
  const id = randomUUID();
  ids.push(id);
  const code = "123456";
  const hash = createHmac("sha256", jwtConfig.secret)
    .update(`email-verification:${id}:${code}`)
    .digest("hex");
  await pool.query(
    `INSERT INTO pending_registrations (id, name, email, password_hash, code_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, NOW() + $6::interval)`,
    [id, "Prueba", pendingEmail, await bcrypt.hash("ClavePrueba123", 12), hash,
      expired ? "-1 minute" : "10 minutes"],
  );
  return id;
}

test("el código es obligatorio, limitado y de un solo uso", async () => {
  const id = await addPending();
  const invalid = await request(app).post("/api/v1/users/verify")
    .send({ verificationId: id, code: "111111" });
  assert.equal(invalid.status, 400);
  assert.equal((await pool.query("SELECT id FROM users WHERE email = $1", [email])).rowCount, 0);

  const verified = await request(app).post("/api/v1/users/verify")
    .send({ verificationId: id, code: "123456" });
  assert.equal(verified.status, 201);

  const replay = await request(app).post("/api/v1/users/verify")
    .send({ verificationId: id, code: "123456" });
  assert.equal(replay.status, 400);

  const login = await request(app).post("/api/v1/login")
    .send({ email, password: "ClavePrueba123" });
  assert.equal(login.status, 200);
});

test("un código vencido o con cinco errores no crea una cuenta", async () => {
  const pendingEmail = `blocked-${randomUUID()}@example.invalid`;
  const expiredId = await addPending({ expired: true, pendingEmail });
  const expired = await request(app).post("/api/v1/users/verify")
    .send({ verificationId: expiredId, code: "123456" });
  assert.equal(expired.status, 400);

  const id = await addPending({ pendingEmail });
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await request(app).post("/api/v1/users/verify")
      .send({ verificationId: id, code: "000000" });
    assert.equal(response.status, 400);
  }
  const blocked = await request(app).post("/api/v1/users/verify")
    .send({ verificationId: id, code: "123456" });
  assert.equal(blocked.status, 400);
  assert.equal((await pool.query("SELECT id FROM users WHERE email = $1", [pendingEmail])).rowCount, 0);
});

test("sin SMTP no se crea la cuenta ni queda un registro pendiente", async () => {
  const newEmail = `no-smtp-${randomUUID()}@example.invalid`;
  const response = await request(app).post("/api/v1/users")
    .send({ name: "Prueba", email: newEmail, password: "ClavePrueba123" });
  assert.equal(response.status, 503);
  assert.equal((await pool.query("SELECT id FROM users WHERE email = $1", [newEmail])).rowCount, 0);
  assert.equal((await pool.query("SELECT id FROM pending_registrations WHERE email = $1", [newEmail])).rowCount, 0);
});

after(async () => {
  await pool.query("DELETE FROM pending_registrations WHERE id = ANY($1::uuid[])", [ids]);
  await pool.query("DELETE FROM users WHERE email = $1", [email]);
  await pool.end();
});
