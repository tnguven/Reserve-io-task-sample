import { test, describe, expect } from "vitest";

import { formatError } from "./validate";

describe("middleware: validate formatError", () => {
  test.each`
    error                                                             | expected
    ${[{ message: "Required", path: ["body", "title"] }]}             | ${["Required body.title"]}
    ${[{ message: "Invalid email" }]}                                 | ${["Invalid email"]}
    ${[{ message: "Invalid email" }, { message: "Invalid content" }]} | ${["Invalid email", "Invalid content"]}
  `("must format $error", async ({ error, expected }) => {
    expect(formatError(error)).toEqual(expected);
  });
});
