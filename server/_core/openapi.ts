import type { Express, Request, Response } from "express";

const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "YayaAiki API",
    version: "1.0.0",
    description:
      "Verified work infrastructure for businesses and professionals. The application API currently uses tRPC over HTTP; the documented procedure names are included as extensions so the contract remains honest while partner REST endpoints are added.",
  },
  servers: [{ url: "https://yayaaiki.com", description: "Production" }],
  tags: [
    { name: "System", description: "Service health and runtime metadata" },
    { name: "Authentication", description: "Current-user and session procedures" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Check service health",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "The service is running",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } },
          },
        },
      },
    },
    "/api/trpc": {
      post: {
        tags: ["Authentication"],
        summary: "Call a tRPC procedure",
        description:
          "The current application API is tRPC. Use the tRPC client for typed calls. The supported authentication procedures are auth.me and auth.logout. Send the Supabase access token as a Bearer token.",
        operationId: "callTrpcProcedure",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TrpcBatchRequest" },
              examples: { authMe: { summary: "Current user", value: [{ json: null }] } },
            },
          },
        },
        responses: {
          "200": { description: "tRPC response envelope" },
          "401": { description: "Missing or invalid Supabase access token" },
        },
        "x-yayaaiki-procedures": ["auth.me", "auth.logout"],
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Supabase access token" },
    },
    schemas: {
      HealthResponse: {
        type: "object",
        required: ["ok", "service"],
        properties: { ok: { type: "boolean", example: true }, service: { type: "string", example: "yayaaiki" } },
      },
      TrpcBatchRequest: {
        type: "array",
        description: "tRPC batch input. Prefer the generated client for production integrations.",
        items: { type: "object", properties: { json: {} }, required: ["json"] },
      },
    },
  },
} as const;

const swaggerHtml = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YayaAiki API Docs</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head>
<body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>window.onload=()=>SwaggerUIBundle({url:'/api/openapi.json',dom_id:'#swagger-ui',deepLinking:true,presets:[SwaggerUIBundle.presets.apis,SwaggerUIBundle.SwaggerUIStandalonePreset],layout:'BaseLayout'});</script></body>
</html>`;

export function registerOpenApiRoutes(app: Express) {
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "yayaaiki" });
  });
  app.get("/api/openapi.json", (_req: Request, res: Response) => {
    res.type("application/json").send(JSON.stringify(openApiDocument));
  });
  app.get("/api/docs", (_req: Request, res: Response) => {
    res.type("html").send(swaggerHtml);
  });
}

export { openApiDocument };
