import { describe, test, expect, vi, beforeAll, afterEach } from "vitest";
import type { Response } from "express";
import {
  makeDeleteUserByID,
  makeSignInUser,
  makeGetUser,
  makeLoginUser,
  type DepsType,
} from "./user.controller";
import { ReqObj } from "../../types";
import { UserCreateInput } from "./user.validation";

describe("User controller", () => {
  const mockUserService = {
    getUserById: vi.fn(),
    isEmailExist: vi.fn(),
    createUser: vi.fn(),
    getUserByEmailPassword: vi.fn(),
    deleteUserById: vi.fn(),
  };
  const mockAuthService = {
    setAuthentication: vi.fn(),
    generateToken: vi.fn(),
    removeAuthentication: vi.fn(),
  };
  const mockRes = {} as unknown as Response;
  const deps = {
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    },
    userService: mockUserService,
    authService: mockAuthService,
  } as unknown as DepsType;
  const userInput = {
    email: "test@test.com",
    password: "secret12",
  };

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("makeGetUser", () => {
    let getUser: ReturnType<typeof makeGetUser>;

    beforeAll(() => {
      getUser = makeGetUser(deps);
    });

    test("must return unauthorized is the user doesn't exist in db", async () => {
      mockUserService.getUserById.mockResolvedValue(null);

      const result = await getUser({ user: { id: "userId" } } as ReqObj);

      expect(mockUserService.getUserById).toHaveBeenCalledWith("userId");
      expect(result.statusCode).toBe(401);
    });

    test("must return user detail", async () => {
      const now = new Date().toISOString();
      mockUserService.getUserById.mockResolvedValue({
        id: "userId",
        email: "test@test.com",
        created_at: now,
      });

      const result = await getUser({ user: { id: "userId" } } as ReqObj);

      expect(mockUserService.getUserById).toHaveBeenCalledWith("userId");
      expect(result.statusCode).toBe(200);
      expect(result.body).toEqual({
        id: "userId",
        email: "test@test.com",
        created_at: now,
      });
    });
  });

  describe("makeSignInUser", () => {
    let signInUser: ReturnType<typeof makeSignInUser>;

    beforeAll(() => {
      signInUser = makeSignInUser(deps);
    });

    test("must return 409 conflict if the email already exist", async () => {
      mockUserService.isEmailExist.mockResolvedValue(true);

      const result = await signInUser({ body: userInput } as ReqObj<UserCreateInput>);

      expect(mockUserService.isEmailExist).toHaveBeenCalledWith("test@test.com");
      expect(result.statusCode).toBe(409);
    });

    test("must create a user and return user detail", async () => {
      const now = new Date();
      vi.setSystemTime(now);
      mockUserService.isEmailExist.mockResolvedValue(false);
      mockUserService.createUser.mockResolvedValue({ ...userInput, created_at: now.toISOString() });

      const result = await signInUser({ body: userInput } as ReqObj<UserCreateInput>);

      expect(mockUserService.isEmailExist).toHaveBeenCalledWith("test@test.com");
      expect(mockUserService.createUser).toHaveBeenCalledWith(userInput);
      expect(result.statusCode).toBe(201);
      expect(result.body).toEqual({
        ...userInput,
        created_at: now.toISOString(),
      });
    });
  });

  describe("makeLoginUser", () => {
    let loginUser: ReturnType<typeof makeLoginUser>;

    beforeAll(() => {
      loginUser = makeLoginUser(deps);
    });

    test("must return unauthorized if the user doesn't exist or wrong password", async () => {
      mockUserService.getUserByEmailPassword.mockResolvedValue(null);

      const result = await loginUser({ body: userInput } as ReqObj<UserCreateInput>, mockRes);

      expect(mockUserService.getUserByEmailPassword).toHaveBeenCalledWith(
        userInput.email,
        userInput.password,
      );
      expect(result.statusCode).toBe(401);
    });

    test("must login user and return user detail", async () => {
      const now = new Date();
      vi.setSystemTime(now);
      mockUserService.getUserByEmailPassword.mockResolvedValue({
        ...userInput,
        id: "userId",
        created_at: now.toISOString(),
      });
      mockAuthService.generateToken.mockReturnValue("token");

      const result = await loginUser({ body: userInput } as ReqObj<UserCreateInput>, mockRes);

      expect(mockUserService.getUserByEmailPassword).toHaveBeenCalledWith(
        userInput.email,
        userInput.password,
      );
      expect(mockAuthService.generateToken).toBeCalledWith("userId");
      expect(mockAuthService.setAuthentication).toBeCalledWith(mockRes, "token");
      expect(result.statusCode).toBe(200);
      expect(result.body).toEqual({
        email: "test@test.com",
        id: "userId",
        created_at: now.toISOString(),
      });
    });
  });

  describe("makeDeleteUserByID", () => {
    let deleteUserByID: ReturnType<typeof makeDeleteUserByID>;

    beforeAll(() => {
      deleteUserByID = makeDeleteUserByID(deps);
    });

    test("must return un processable entity if the user does not exist", async () => {
      mockUserService.deleteUserById.mockResolvedValue(null);

      const result = await deleteUserByID({ user: { id: "userId" } } as unknown as ReqObj, mockRes);

      expect(mockUserService.deleteUserById).toHaveBeenCalledWith("userId");
      expect(mockAuthService.removeAuthentication).toHaveBeenCalledWith(mockRes);
      expect(result.statusCode).toBe(422);
    });

    test("must login user and return user detail", async () => {
      const now = new Date();
      vi.setSystemTime(now);
      mockUserService.deleteUserById.mockResolvedValue(1);

      const result = await deleteUserByID({ user: { id: "userId" } } as unknown as ReqObj, mockRes);

      expect(mockUserService.deleteUserById).toHaveBeenCalledWith("userId");
      expect(mockAuthService.removeAuthentication).toHaveBeenCalledWith(mockRes);
      expect(result.statusCode).toBe(204);
    });
  });
});
