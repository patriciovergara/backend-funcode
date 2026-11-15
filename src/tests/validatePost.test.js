import assert from "node:assert/strict";
import { test } from "node:test";

import { validatePost } from "../middlewares/validatePost.js";

function validate(body) {
  const req = { body };
  let statusCode;
  let nextCalled = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };
  validatePost(req, res, () => {
    nextCalled = true;
  });
  return { req, statusCode, nextCalled };
}

const post = {
  title: "Servicio",
  description: "Descripción",
  price: 64995,
  price_type: "from",
  image_url: "/assets/servicios/Landing_Page.jpg",
  category_id: 1,
};

test("acepta precio anterior válido y la imagen existente con mayúsculas", () => {
  const result = validate({ ...post, original_price: 129990 });
  assert.equal(result.nextCalled, true);
  assert.equal(result.req.postInput.original_price, 129990);
});

test("rechaza precios anteriores inválidos y ofertas para servicios a cotizar", () => {
  for (const original_price of [64995, 1, -1, 9999999999999, "129990"]) {
    assert.equal(validate({ ...post, original_price }).statusCode, 400);
  }
  assert.equal(
    validate({ ...post, price_type: "quote", price: null, original_price: 129990 }).statusCode,
    400,
  );
});

test("permite publicaciones sin precio anterior", () => {
  assert.equal(validate(post).req.postInput.original_price, null);
  assert.equal(
    validate({ ...post, price_type: "quote", price: null }).nextCalled,
    true,
  );
});
