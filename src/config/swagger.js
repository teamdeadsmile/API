function normalizePath(path) {
  if (!path) return "";

  let normalized = path
    .replace(/\\\//g, "/")
    .replace(/\(\?=\\?\/\|\$\)/g, "")
    .replace(/\(\?:\\?\/\)\?/g, "")
    .replace(/\/\?/g, "")
    .replace(/\/+/g, "/");

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (normalized.length > 1) {
    normalized = normalized.replace(/\/$/, "");
  }

  return normalized;
}

function regexpToPath(regexp) {
  if (!regexp) return "";

  const source = regexp.source;

  if (source === "^\\/?$") {
    return "";
  }

  let path = source
    .replace(/^\^/, "")
    .replace(/\\\/\?\(\?=\\\/\|\$\)$/, "")
    .replace(/\\\/\?\(\?=\\\/\|\$\)/, "")
    .replace(/\\\//g, "/")
    .replace(/\(\?=\\\/\|\$\)/g, "")
    .replace(/\(\?:\\\/\)\?/g, "")
    .replace(/\/\?/g, "");

  path = path.replace(/\(\[\^\\\/\]\+\?\)/g, ":param");
  path = path.replace(/\(\[\^\\\/\]\+\)/g, ":param");

  return normalizePath(path);
}

function convertParams(path) {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function addOperation(paths, path, method) {
  if (!path || path === "/") return;

  const openApiPath = convertParams(normalizePath(path));

  if (!paths[openApiPath]) {
    paths[openApiPath] = {};
  }

  paths[openApiPath][method.toLowerCase()] = {
    responses: {
      200: {
        description: "Successful response",
      },
    },
  };
}

function inspectRouter(stack, prefix, paths) {
  for (const layer of stack) {
    if (layer.route) {
      const routePath =
        typeof layer.route.path === "string"
          ? layer.route.path
          : "";

      const fullPath = normalizePath(
        `${prefix}${routePath}`,
      );

      for (const method of Object.keys(layer.route.methods)) {
        if (layer.route.methods[method]) {
          addOperation(paths, fullPath, method);
        }
      }

      continue;
    }

    if (layer.name === "router" && layer.handle?.stack) {
      const routerPrefix = regexpToPath(layer.regexp);

      inspectRouter(
        layer.handle.stack,
        normalizePath(`${prefix}${routerPrefix}`),
        paths,
      );
    }
  }
}

export function createSwaggerSpec(app) {
  const paths = {};

  inspectRouter(
    app._router?.stack || [],
    "",
    paths,
  );

  return {
    openapi: "3.0.0",

    info: {
      title: "API Documentation",
      version: "1.0.0",
      description:
        "API Documentation",
    },

    servers: [
      {
        url: "https://apideadsmile.vercel.app",
        description: "API Documentation",
      },
      {
        url: "http://localhost:5000",
        description: "API Documentation",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token.",
        },
      },
    },

    paths,
  };
}