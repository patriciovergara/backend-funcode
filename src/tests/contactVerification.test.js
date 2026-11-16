import assert from "node:assert/strict";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import jwt from "jsonwebtoken";
import request from "supertest";

let receivedMail = "";
let mailCount = 0;
const smtp = createServer((socket) => {
  socket.setEncoding("utf8");
  socket.write("220 localhost ESMTP\r\n");
  let buffer = "";
  let inData = false;
  socket.on("data", (chunk) => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf("\r\n")) !== -1) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      if (inData) {
        if (line === ".") {
          inData = false;
          mailCount++;
          socket.write("250 OK\r\n");
        } else {
          receivedMail += `${line}\n`;
        }
      } else if (/^EHLO /i.test(line)) {
        socket.write("250-localhost\r\n250 AUTH PLAIN\r\n");
      } else if (/^AUTH PLAIN /i.test(line)) {
        socket.write("235 Authentication successful\r\n");
      } else if (/^MAIL FROM:|^RCPT TO:/i.test(line)) {
        socket.write("250 OK\r\n");
      } else if (line === "DATA") {
        receivedMail = "";
        inData = true;
        socket.write("354 Send data\r\n");
      } else if (line === "QUIT") {
        socket.end("221 Bye\r\n");
      } else {
        socket.write("500 Unsupported\r\n");
      }
    }
  });
});
await new Promise((resolve) => smtp.listen(0, "127.0.0.1", resolve));
process.env.NODE_ENV = "test";
delete process.env.RECAPTCHA_SECRET;
process.env.SMTP_HOST = "127.0.0.1";
process.env.SMTP_PORT = String(smtp.address().port);
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "test@example.invalid";
process.env.SMTP_PASS = "test-only";

const { default: app } = await import("../app.js");
const { default: pool } = await import("../config/db.js");
const { jwtConfig } = await import("../config/jwt.js");
const client = await pool.connect();
await client.query(`
  CREATE TEMP TABLE users (
    id integer PRIMARY KEY, name text, email text, role text,
    created_at timestamptz DEFAULT NOW(), email_verified_at timestamptz
  );
  CREATE TEMP TABLE revoked_tokens (jti text);
  CREATE TEMP TABLE pending_contact_verifications (
    id uuid PRIMARY KEY, name text, email text, phone text, message text,
    code_hash char(64), attempts integer DEFAULT 0, expires_at timestamptz
  );
  INSERT INTO users (id, name, email, role, email_verified_at)
  VALUES (1, 'Verificada', 'verified@example.com', 'user', NOW()),
         (2, 'Anterior', 'legacy@example.com', 'user', NULL);
`);
pool.query = (...args) => client.query(...args);
pool.connect = async () => ({ query: (...args) => client.query(...args), release() {} });

function token(id) {
  return jwt.sign({ jti: randomUUID() }, jwtConfig.secret, {
    algorithm: jwtConfig.algorithm,
    expiresIn: jwtConfig.expiresIn,
    subject: String(id),
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });
}

const contact = {
  name: "Prueba",
  email: "guest@example.com",
  phone: "+56 9 1234 5678",
  message: "Necesito información sobre un proyecto.",
};

test("visitante verifica el correo antes de enviar y el código no se reutiliza", async () => {
  const before = mailCount;
  const start = await request(app).post("/api/v1/contact").send(contact);
  assert.equal(start.status, 202);
  assert.equal(mailCount, before + 1);
  const code = receivedMail.match(/\b\d{6}\b/)?.[0];
  assert.ok(code);
  const invalid = await request(app).post("/api/v1/contact/verify")
    .send({ verificationId: start.body.verificationId, code: code === "000000" ? "000001" : "000000" });
  assert.equal(invalid.status, 400);
  assert.equal(mailCount, before + 1);
  const verified = await request(app).post("/api/v1/contact/verify")
    .send({ verificationId: start.body.verificationId, code });
  assert.equal(verified.status, 200);
  assert.equal(mailCount, before + 2);
  assert.match(receivedMail, /guest@example\.com/);
  const replay = await request(app).post("/api/v1/contact/verify")
    .send({ verificationId: start.body.verificationId, code });
  assert.equal(replay.status, 400);
  assert.equal(mailCount, before + 2);
});

test("cuenta verificada envía directamente y no puede usar otro correo", async () => {
  const auth = `Bearer ${token(1)}`;
  const before = mailCount;
  assert.equal((await request(app).post("/api/v1/contact").set("Authorization", auth).send(contact)).status, 400);
  const response = await request(app).post("/api/v1/contact").set("Authorization", auth)
    .send({ ...contact, email: "verified@example.com" });
  assert.equal(response.status, 200);
  assert.equal(mailCount, before + 1);
});

test("cuenta antigua verifica una vez antes de quedar marcada", async () => {
  const auth = `Bearer ${token(2)}`;
  const start = await request(app).post("/api/v1/contact").set("Authorization", auth)
    .send({ ...contact, email: "legacy@example.com" });
  assert.equal(start.status, 202);
  const code = receivedMail.match(/\b\d{6}\b/)?.[0];
  const result = await request(app).post("/api/v1/contact/verify").set("Authorization", auth)
    .send({ verificationId: start.body.verificationId, code });
  assert.equal(result.status, 200);
  assert.ok((await client.query("SELECT email_verified_at FROM users WHERE id = 2")).rows[0].email_verified_at);
});

test("rechaza datos inválidos antes de enviar correos", async () => {
  const before = mailCount;
  for (const body of [
    { ...contact, email: "persona@dominio" },
    { ...contact, email: "persona..nombre@example.com" },
    { ...contact, phone: "abcdefghi" },
  ]) {
    assert.equal((await request(app).post("/api/v1/contact").send(body)).status, 400);
  }
  assert.equal(mailCount, before);
});

test("los códigos vencidos o agotados no envían el mensaje", async () => {
  const expired = await request(app).post("/api/v1/contact").send(contact);
  assert.equal(expired.status, 202);
  const expiredCode = receivedMail.match(/\b\d{6}\b/)?.[0];
  await client.query(
    "UPDATE pending_contact_verifications SET expires_at = NOW() - INTERVAL '1 second' WHERE id = $1",
    [expired.body.verificationId],
  );
  const before = mailCount;
  assert.equal((await request(app).post("/api/v1/contact/verify")
    .send({ verificationId: expired.body.verificationId, code: expiredCode })).status, 400);
  assert.equal(mailCount, before);

  const pending = await request(app).post("/api/v1/contact").send(contact);
  assert.equal(pending.status, 202);
  const code = receivedMail.match(/\b\d{6}\b/)?.[0];
  const wrong = code === "000000" ? "000001" : "000000";
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.equal((await request(app).post("/api/v1/contact/verify")
      .send({ verificationId: pending.body.verificationId, code: wrong })).status, 400);
  }
  const afterCodeMail = mailCount;
  assert.equal((await request(app).post("/api/v1/contact/verify")
    .send({ verificationId: pending.body.verificationId, code })).status, 400);
  assert.equal(mailCount, afterCodeMail);
});

test("una sesión inválida no evita la verificación", async () => {
  const before = mailCount;
  assert.equal((await request(app).post("/api/v1/contact")
    .set("Authorization", "Bearer invalid").send(contact)).status, 401);
  assert.equal(mailCount, before);
});

after(async () => {
  client.release();
  await pool.end();
  await new Promise((resolve) => smtp.close(resolve));
});
