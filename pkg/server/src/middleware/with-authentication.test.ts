import { test, describe, expect, vi, afterEach, beforeEach, Mock } from "vitest";
import { withAuthentication } from "./with-authentication";
import { authService } from "../modules/auth/auth.module";
import type { Request, Response } from "express";

vi.mock("../modules/auth/auth.module", () => ({
  authService: {
    verifyAuthentication: vi.fn(),
    generateToken: vi.fn(),
    setAuthentication: vi.fn(),
    removeAuthentication: vi.fn(),
  },
}));

const headers = {
  authorization: "Bearer token",
};
const cookies = {
  JWToken: "CookieToken",
};

describe("middleware: with-authentication", () => {
  const mockRes = {
    sendStatus: vi.fn(),
  } as unknown as Response;
  const mockNext = vi.fn();
  const { verifyAuthentication, setAuthentication, removeAuthentication, generateToken } = authService;

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe("with no authorization token", () => {
    const req = { headers: {} } as Request;
    test("should return 401 if authentication token is missing", () => {
      withAuthentication(req, mockRes, mockNext);
      expect(mockRes.sendStatus).toBeCalledWith(401);
      expect(mockNext).not.toBeCalled();
    });
  });

  describe("with valid authorization token", () => {
    beforeEach(() => {
      (verifyAuthentication as Mock).mockResolvedValue("id");
      (generateToken as Mock).mockReturnValue("newToken");
    });

    test("should authenticate if authorization header is valid", async () => {
      const req = { headers } as Request;
      await withAuthentication(req, mockRes, mockNext);

      expect(verifyAuthentication).toHaveBeenCalledWith("token");
      expect(generateToken).toHaveBeenCalledWith("id");
      expect(setAuthentication).toHaveBeenCalledWith(mockRes, "newToken");
      expect(mockNext).toHaveBeenCalled();
    });

    test("should authenticate if authorization cookie is valid", async () => {
      const req = { cookies } as unknown as Request;
      await withAuthentication(req, mockRes, mockNext);

      expect(verifyAuthentication).toHaveBeenCalledWith("CookieToken");
      expect(generateToken).toHaveBeenCalledWith("id");
      expect(setAuthentication).toHaveBeenCalledWith(mockRes, "newToken");
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("with invalid authorization token", () => {
    const req = { headers } as Request;

    beforeEach(async () => {
      (verifyAuthentication as Mock).mockRejectedValue(new Error("kaboom"));
      await withAuthentication(req, mockRes, mockNext);
    });

    test("should return UNAUTHORIZED", async () => {
      expect(verifyAuthentication).toHaveBeenCalledWith("token");
      expect(removeAuthentication).toHaveBeenCalledWith(mockRes);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
