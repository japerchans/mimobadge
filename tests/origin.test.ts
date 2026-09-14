import { test } from "node:test";
import assert from "node:assert/strict";
import { sameOrigin } from "../lib/auth";
test("origin validation uses the browser Host despite Next.js localhost normalization", () => {
  const previous = process.env.APP_ORIGIN;
  delete process.env.APP_ORIGIN;
  try {
    assert.equal(
      sameOrigin(
        new Request("http://localhost:3000/api/actions", {
          headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
        }),
      ),
      true,
    );
    assert.equal(
      sameOrigin(
        new Request("http://localhost:3000/api/actions", {
          headers: {
            host: "127.0.0.1:3000",
            origin: "https://attacker.example",
          },
        }),
      ),
      false,
    );
    assert.equal(
      sameOrigin(new Request("http://localhost:3000/api/actions")),
      false,
    );
    process.env.APP_ORIGIN = "https://care.example.com";
    assert.equal(
      sameOrigin(
        new Request("http://internal:3000/api/actions", {
          headers: { origin: "https://care.example.com" },
        }),
      ),
      true,
    );
    assert.equal(
      sameOrigin(
        new Request("http://internal:3000/api/actions", {
          headers: { origin: "https://other.example.com" },
        }),
      ),
      false,
    );
  } finally {
    if (previous === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previous;
  }
});
