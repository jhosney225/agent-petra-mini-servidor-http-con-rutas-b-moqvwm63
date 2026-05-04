
```javascript
const http = require("http");

// Routes configuration
const routes = {
  "/": {
    method: "GET",
    handler: (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Welcome to Mini HTTP Server",
          endpoints: [
            { path: "/", method: "GET", description: "Welcome message" },
            { path: "/api/hello", method: "GET", description: "Hello endpoint" },
            {
              path: "/api/hello",
              method: "POST",
              description: "Create greeting",
            },
            {
              path: "/api/users/:id",
              method: "GET",
              description: "Get user by ID",
            },
            { path: "/about", method: "GET", description: "About page" },
            { path: "/health", method: "GET", description: "Health check" },
          ],
        })
      );
    },
  },
  "/api/hello": {
    GET: (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Hello from the API!" }));
    },
    POST: (req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: `Hello, ${data.name || "Guest"}!`,
              received: data,
            })
          );
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
    },
  },
  "/about": {
    method: "GET",
    handler: (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          name: "Mini HTTP Server",
          version: "1.0.0",
          description: "A simple HTTP server with basic routing",
          author: "Petra",
          features: ["GET requests", "POST requests", "URL parameters", "JSON"],
        })
      );
    },
  },
  "/health": {
    method: "GET",
    handler: (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        })
      );
    },
  },
};

// Helper function to match routes with parameters
function matchRoute(pathname) {
  // Direct match
  if (routes[pathname]) {
    return { route: pathname, params: {} };
  }

  // Pattern matching for /api/users/:id
  if (pathname.startsWith("/api/users/")) {
    const id = pathname.split("/")[3];
    if (id) {
      return {
        route: "/api/users/:id",
        params: { id },
        handler: (req, res) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              id: id,
              name: `User ${id}`,
              email: `user${id}@example.com`,
            })
          );
        },
      };
    }
  }

  return null;
}

// Create server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const pathname = req.url.split("?")[0]; // Remove query string
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // Try to find matching route
  const matchedRoute = matchRoute(pathname);

  if (matchedRoute) {
    if (matchedRoute.handler) {
      // Custom handler for parameterized routes
      matchedRoute.handler(req, res);
    } else {
      const route = routes[matchedRoute.route];
      if (route.handler) {
        route.handler(req, res);
      } else if (route[method]) {
        route[method](req, res);
      } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: `Method ${method} not allowed` })
        );
      }
    }
  } else {
    // 404 Not Found
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Route not found",
        path: pathname,
        method: method,
        availableRoutes: [
          "GET /",
          "GET /api/hello",
          "POST /api/hello",
          "GET /api/users/:id",
          "GET /about",
          "GET /health",
        ],
      })
    );
  }
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Mini HTTP Server running on http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop the server");
  console.log("\nAvailable routes:");