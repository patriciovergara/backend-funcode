import assert from "node:assert/strict";
import { test } from "node:test";

import { validateProject } from "../middlewares/validateProject.js";

function runValidation(body) {
  const req = { body };
  let statusCode = null;
  let responseBody = null;
  let nextCalled = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      responseBody = payload;
      return this;
    },
  };

  validateProject(req, res, () => {
    nextCalled = true;
  });

  return { req, statusCode, responseBody, nextCalled };
}

test("validateProject normalizes a valid project and applies safe defaults", () => {
  const result = runValidation({
    title: "  Proyecto de ejemplo  ",
    description: " Descripción del proyecto ",
    project_url: "https://example.com",
    technologies: [" React ", "React", "Node.js"],
  });

  assert.equal(result.nextCalled, true);
  assert.deepEqual(result.req.validatedProject, {
    title: "Proyecto de ejemplo",
    description: "Descripción del proyecto",
    project_url: "https://example.com",
    image_url: null,
    technologies: ["React", "Node.js"],
    featured: false,
    is_published: true,
    display_order: 0,
  });
});

test("validateProject rejects non-HTTP project URLs", () => {
  const result = runValidation({
    title: "Proyecto",
    description: "Descripción",
    project_url: "javascript:alert(1)",
  });

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});

test("validateProject rejects invalid technology lists", () => {
  const result = runValidation({
    title: "Proyecto",
    description: "Descripción",
    project_url: "https://example.com",
    technologies: ["React", 42],
  });

  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 400);
});
