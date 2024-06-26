export const userDoc = {
  "/v1/user": {
    get: {
      tags: ["User"],
      description: "Get the authorized user",
      security: [{ SessionToken: [] }],
      responses: {
        "200": {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  created_at: { type: "string" },
                },
              },
            },
          },
        },
        "401": { description: "request is unauthorized" },
      },
    },
    delete: {
      tags: ["User"],
      description: "Delete the authenticated user",
      security: [{ SessionToken: [] }],
      responses: {
        "204": { description: "Deleted successfully" },
        "401": { description: "The user does not exist" },
      },
    },
  },
  "/v1/user/signin": {
    post: {
      tags: ["User"],
      description: "Create a user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", default: "test@test.com" },
                password: { type: "string", default: "secret1234" },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  created_at: { type: "string" },
                },
              },
            },
          },
        },
        "409": { description: "User already exist" },
      },
    },
  },
  "/v1/user/login": {
    post: {
      tags: ["User"],
      description: "Login created user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", default: "test@test.com" },
                password: { type: "string", default: "secret1234" },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  created_at: { type: "string" },
                },
              },
            },
          },
        },
        "401": { description: "Unauthorized" },
      },
    },
  },
  "/v1/user/logout": {
    post: {
      tags: ["User"],
      description: "Logout authenticated user",
      responses: {
        "200": { description: "logged out" },
        "401": { description: "Unauthorized" },
      },
    },
  },
};
