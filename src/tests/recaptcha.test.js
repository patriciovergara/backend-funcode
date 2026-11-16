import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import request from "supertest";
import { createRecaptchaVerifier } from "../middlewares/verifyRecaptcha.js";

function appWithResponse(result, fetchImpl) {
  const app = express();
  app.use(express.json());
  const verify = createRecaptchaVerifier({
    secret: "test-secret",
    hostnames: ["funcode.cl", "www.funcode.cl"],
    fetchImpl: fetchImpl || (async () => ({ ok: true, json: async () => result })),
  });
  app.post("/:action", (req, res, next) => {
    const actions = ["register", "login", "contact", "quote"];
    if (!actions.includes(req.params.action)) return res.sendStatus(404);
    return verify(req.params.action)(req, res, next);
  }, (req, res) => res.sendStatus(204));
  return app;
}

test("acepta tokens válidos únicamente para la acción y dominio esperados", async () => {
  for (const action of ["register", "login", "contact", "quote"]) {
    const app = appWithResponse({
      success: true, action, hostname: "funcode.cl", score: 0.5,
    });
    assert.equal((await request(app).post(`/${action}`).send({ recaptchaToken: "test-token" })).status, 204);
    assert.equal((await request(app).post(`/${action}`).send({})).status, 400);
  }
});

test("rechaza resultado inválido, puntuación baja, acción o dominio incorrectos", async () => {
  const valid = { success: true, action: "login", hostname: "funcode.cl", score: 0.9 };
  for (const result of [
    { ...valid, success: false },
    { ...valid, action: "register" },
    { ...valid, hostname: "otro.example" },
    { ...valid, score: 0.49 },
    { ...valid, score: null },
    null,
  ]) {
    const response = await request(appWithResponse(result)).post("/login").send({ recaptchaToken: "token" });
    assert.equal(response.status, 403);
  }
});

test("si Google no responde, devuelve un error y no procesa el formulario", async () => {
  const app = appWithResponse(null, async () => { throw new Error("unavailable"); });
  assert.equal((await request(app).post("/contact").send({ recaptchaToken: "token" })).status, 503);
});

test("la configuración activa exige secreto", () => {
  assert.throws(() => createRecaptchaVerifier({ hostnames: [], enabled: true }), /RECAPTCHA_SECRET/);
});
