import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

let receivedMail = "";
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
process.env.SMTP_HOST = "127.0.0.1";
process.env.SMTP_PORT = String(smtp.address().port);
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "test@example.invalid";
process.env.SMTP_PASS = "test-only";

const { default: app } = await import("../app.js");
const { default: pool } = await import("../config/db.js");
const email = `registration-${randomUUID()}@example.invalid`;
let verificationId;

test("el registro envía el código y crea la cuenta solo después de verificarlo", async () => {
  const response = await request(app).post("/api/v1/users")
    .send({ name: "Prueba", email, password: "ClavePrueba123" });
  assert.equal(response.status, 202);
  verificationId = response.body.verificationId;
  assert.ok(verificationId);
  assert.equal((await pool.query("SELECT id FROM users WHERE email = $1", [email])).rowCount, 0);

  const code = receivedMail.match(/\b\d{6}\b/)?.[0];
  assert.ok(code, "El correo debe incluir un código de seis dígitos");
  const verified = await request(app).post("/api/v1/users/verify")
    .send({ verificationId, code });
  assert.equal(verified.status, 201);
  assert.equal((await pool.query("SELECT id FROM users WHERE email = $1", [email])).rowCount, 1);
});

after(async () => {
  if (verificationId) {
    await pool.query("DELETE FROM pending_registrations WHERE id = $1", [verificationId]);
  }
  await pool.query("DELETE FROM users WHERE email = $1", [email]);
  await pool.end();
  await new Promise((resolve) => smtp.close(resolve));
});
