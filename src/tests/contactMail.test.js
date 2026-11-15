import { test } from "node:test";
import assert from "node:assert/strict";

import { renderContactHtml } from "../config/mailer.js";

test("el correo de contacto escapa el HTML enviado por el visitante", () => {
  const html = renderContactHtml({
    name: '<img src=x onerror="alert(1)">',
    email: "<b>a@b.cl</b>",
    phone: null,
    message: "<script>alert(1)</script>\nSegunda línea & más",
  });

  assert.doesNotMatch(html, /<img|<script|<b>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;<br \/>Segunda línea &amp; más/);
  assert.match(html, /No indicado/);
});
