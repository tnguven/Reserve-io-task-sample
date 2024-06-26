export const eventDoc = {
  "/v1/events": {
    get: {
      tags: ["Events"],
      description: "Get all events",
      security: [{ SessionToken: [] }],
      responses: {
        "200": {
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    content: { type: "string" },
                    total_seats: { type: "number" },
                    created_at: { type: "string" },
                  },
                },
              },
            },
          },
        },
        "401": { description: "request is unauthorized" },
      },
    },
    post: {
      tags: ["Events"],
      description: "Create a new event",
      security: [{ SessionToken: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "content", "total_seats"],
              additionalProperties: false,
              properties: {
                title: { type: "string", default: "Title" },
                content: { type: "string", default: "First event" },
                total_seats: { type: "number", default: 100 },
                seats: {
                  type: "array",
                  score: { type: "number" },
                  value: { type: "string" },
                },
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
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  total_seats: { type: "number" },
                  seats: {
                    type: "array",
                    score: { type: "number" },
                    value: { type: "string" },
                  },
                },
              },
            },
          },
        },
        "401": { description: "request is unauthorized" },
      },
    },
  },
  "/v1/events/{eventId}": {
    get: {
      tags: ["Events"],
      description: "Get event by id",
      parameters: [
        {
          in: "path",
          name: "eventId",
          required: true,
          type: "string",
          description: "ID of event to Fetch event detail",
        },
      ],
      responses: {
        "201": {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  total_seats: { type: "number" },
                  created_at: { type: "string" },
                },
              },
            },
          },
        },
        "404": { description: "Event does not exist" },
      },
    },
  },
  "/v1/events/{eventId}/seats": {
    get: {
      tags: ["Events"],
      description: "Get seats by event id",
      parameters: [
        {
          in: "path",
          name: "eventId",
          required: true,
          type: "string",
          description: "ID of event to Fetch seats",
        },
      ],
      responses: {
        "201": {
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
        "401": { description: "Unauthorized" },
        "500": { description: "Something went wrong" },
      },
    },
  },
  "/v1/events/{eventId}/seats/{seatId}/hold": {
    put: {
      tags: ["Events"],
      description: "Hold a seat in a event",
      parameters: [
        {
          in: "path",
          name: "eventId",
          required: true,
          type: "string",
          description: "ID of event to Fetch seats",
        },
        {
          in: "path",
          name: "seatId",
          required: true,
          type: "string",
          description: "seatId which need to be hold",
        },
      ],
      responses: {
        "200": {
          content: {
            "application/json": {
              schema: {
                type: "object",
                msg: { type: "string" },
              },
            },
          },
        },
        "401": { description: "Unauthorized" },
        "404": {
          content: {
            "application/json": {
              schema: {
                type: "object",
                msg: { type: "string" },
              },
            },
          },
        },
        "500": { description: "Something went wrong" },
      },
    },
  },
  "/v1/events/{eventId}/seats/{seatId}/refresh": {
    put: {
      tags: ["Events"],
      description: "Refresh a held seat for another 60 sec",
      parameters: [
        {
          in: "path",
          name: "eventId",
          required: true,
          type: "string",
          description: "ID of event to Fetch seats",
        },
        {
          in: "path",
          name: "seatId",
          required: true,
          type: "string",
          description: "seatId which need to be hold",
        },
      ],
      responses: {
        "200": { description: "refresh the hold duration" },
        "401": { description: "Unauthorized" },
        "500": { description: "Something went wrong" },
      },
    },
  },
  "/v1/events/{eventId}/seats/{seatId}/reserve": {
    put: {
      tags: ["Events"],
      description: "Reserve a held seat",
      parameters: [
        {
          in: "path",
          name: "eventId",
          required: true,
          type: "string",
          description: "ID of event to Fetch seats",
        },
        {
          in: "path",
          name: "seatId",
          required: true,
          type: "string",
          description: "seatId which need to be hold",
        },
      ],
      responses: {
        "200": {
          content: {
            "application/json": {
              schema: {
                type: "object",
                msg: { type: "string" },
              },
            },
          },
        },
        "401": { description: "Unauthorized" },
        "500": { description: "Something went wrong" },
      },
    },
  },
};
