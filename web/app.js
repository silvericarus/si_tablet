let RES =
  typeof GetParentResourceName === "function"
    ? GetParentResourceName()
    : "si_tablet";
let CURRENT_ROUTE = null;
let CURRENT_APP = null;
const APP_MODULES = new Map();
const APP_LOADING = new Map();
const APP_SCRIPTS = new Map();
const ROUTE_APP = new Map();
const DYNAMIC_ROUTES = new Set();
let RENDER_TOKEN = 0;

const SHARED_BUS = createEventBus();

function nui(name, data = {}) {
  return fetch(`https://${RES}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(data),
  });
}

function waitForApp(name) {
  if (APP_MODULES.has(name)) return Promise.resolve(APP_MODULES.get(name));
  if (APP_LOADING.has(name)) return APP_LOADING.get(name).promise;
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  APP_LOADING.set(name, { promise, resolve, reject });
  return promise;
}

nui("uiReady")
  .then((r) => r.json())
  .then(({ resource }) => {
    if (resource && typeof resource === "string") {
      RES = resource;
    }
  })
  .catch(() => {});

const routes = {
  "/home": renderHome,
};

const view = document.getElementById("view");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("close");

let APP_REGISTRY = [];

async function render(path) {
  const token = ++RENDER_TOKEN;
  const handler = routes[path] || renderNotFound;
  const targetApp = ROUTE_APP.get(path);

  if (
    CURRENT_APP &&
    (!targetApp ||
      CURRENT_APP.name !== (targetApp.name && targetApp) ||
      CURRENT_APP.route !== path)
  ) {
    unmountCurrentApp();
  }

  let result;
  try {
    result = await handler(path, token);
  } catch (e) {
    console.error(e);
    result = renderError(path);
  }

  if (token !== RENDER_TOKEN) return;

  if (result instanceof Node) {
    view.innerHTML = "";
    view.appendChild(result);
  } else if (typeof result === "string") {
    view.innerHTML = result;
  } else if (result !== undefined && result !== null) {
    view.innerHTML = String(result);
  }

  CURRENT_ROUTE = path;
  if (!ROUTE_APP.has(path) && CURRENT_APP) {
    CURRENT_APP = null;
  }
}

function renderHome() {
  const tiles = APP_REGISTRY.map((app) => {
    const firstRoute =
      normalizeRoutePath(app && app.routes && app.routes[0]) || "/";
    const icon = app.icon || "";
    const title = app.title || app.name || "App";

    return `<button class="tile" data-route="${firstRoute}" title="${title}">
        <div class="tile-icon">${
          icon
            ? `<img src="${icon}" alt="">`
            : `<div class="tile-fallback">${title[0] || "A"}</div>`
        }</div>
        <div class="tile-title">${title}</div>
      </button>
    `;
  }).join("");

  return `
    <div class="screen">
      <h1>Bienvenido</h1>
      <p>Selecciona una app:</p>
      <div class="grid">${tiles}</div>
    </div>
  `;
}

function renderNotFound(path) {
  const target = escapeHtml(path || "");
  return `
    <div class="screen">
      <h1>404</h1>
      <p>La ruta ${target} no está disponible.</p>
    </div>
  `;
}

function renderError(path) {
  const target = escapeHtml(path || "");
  return `
    <div class="screen">
      <h1>Error</h1>
      <p>No se pudo cargar la ruta ${target}.</p>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeRoutePath(route) {
  if (!route) return null;
  if (typeof route === "string") return route;
  if (typeof route === "object" && typeof route.path === "string") {
    return route.path;
  }
  return null;
}

function unmountCurrentApp() {
  if (!CURRENT_APP) return;
  const { unmount, module, container, styleEl, sdk } = CURRENT_APP;
  try {
    if (typeof unmount === "function") {
      unmount();
    } else if (module && typeof module.unmount === "function") {
      module.unmount(container, sdk);
    }
  } catch (err) {
    console.error(err);
  }

  if (styleEl && styleEl.parentNode) {
    styleEl.parentNode.removeChild(styleEl);
  }

  if (container && container.parentNode === view) {
    container.parentNode.removeChild(container);
  }

  CURRENT_APP = null;
}

function applyAppStyle(app) {
  if (!app || !app.style) return null;
  const href = `nui://${RES}/apps/${app.name}/${app.style}`;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.appStyle = app.name;
  document.head.appendChild(link);
  return link;
}

function loadAppScript(app) {
  if (!app || !app.name || !app.ui) return null;
  if (APP_SCRIPTS.has(app.name)) return APP_SCRIPTS.get(app.name);

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.async = true;
  script.src = `nui://${RES}/apps/${app.name}/${app.ui}`;
  script.dataset.appScript = app.name;
  script.addEventListener("error", (err) => {
    console.error(`No se pudo cargar el script de ${app.name}`, err);
    APP_SCRIPTS.delete(app.name);
    const wait = APP_LOADING.get(app.name);
    if (wait) {
      if (typeof wait.reject === "function") {
        wait.reject(err);
      }
      APP_LOADING.delete(app.name);
    }
  });
  document.head.appendChild(script);
  APP_SCRIPTS.set(app.name, script);
  return script;
}

async function ensureAppModule(app) {
  if (!app || !app.name) return null;
  if (APP_MODULES.has(app.name)) {
    return APP_MODULES.get(app.name);
  }

  if (!APP_LOADING.has(app.name)) {
    if (!app.ui) {
      return null;
    }
    loadAppScript(app);
  }

  try {
    return await waitForApp(app.name);
  } catch (err) {
    console.error(err);
    return null;
  }
}

function createAppSdk(app) {
  return {
    close: () => {
      render("/home").catch((err) => console.error(err));
    },
    navigate: (route) => {
      if (typeof route === "string") {
        render(route).catch((err) => console.error(err));
      }
	  },
	bus: SHARED_BUS,
    app: app || null,
    nui,
  };
}

function createEventBus() {
	const listeners = new Map();
	
	function off(event, callback) {
		if (typeof event !== "string" || typeof callback !== "function") return;

		const callbacks = listeners.get(event);
		if (!callbacks) return;

		if (callbacks.size === 0) callbacks.delete(event);
	}

	return {
		on(event, callback) {
			if (typeof event !== "string" || typeof callback !== "function") return;

			let callbacks = listeners.get(event);
			if (!callbacks) {
				callbacks = new Set();
				listeners.set(event, callbacks);
			}

			callbacks.add(callback);
			let active = true;

			return () => {
				if (!active) return;
				active = false;
				off(event, callback);
			};
		},
		off,
		emit(event, payload) {
			if (typeof event !== "string") return;
			const handlers = listeners.get(event);
			if (!handlers || handlers.size === 0) return;

			const callbacks = Array.from(handlers);
			for (const cb of callbacks) {
				try {
					cb(payload);
				} catch (err) {
					console.error(`[bus] Error en el handler de "${event}":`,err);
				}
			}
		},
	};
}


async function renderAppRoute(app, path, token) {
  if (
    CURRENT_APP &&
    CURRENT_APP.name === (app && app.name) &&
    CURRENT_APP.route === path &&
    CURRENT_APP.container
  ) {
    return CURRENT_APP.container;
  }

  const container = document.createElement("div");
  container.className = "app-view";
  if (path) container.setAttribute("data-route", path);
  if (app && app.name) container.setAttribute("data-app", app.name);

  const title = app && (app.title || app.name) ? app.title || app.name : "App";
  container.innerHTML = `
    <div class="screen">
      <p>Cargando ${escapeHtml(title)}...</p>
    </div>
  `;

  if (!app || !app.name) {
    container.innerHTML = renderError(path);
    return container;
  }

  const module = await ensureAppModule(app);

  if (token !== RENDER_TOKEN) {
    return container;
  }

  if (!module || typeof module.mount !== "function") {
    container.innerHTML = `
      <div class="screen">
        <p>La app ${escapeHtml(title)} no está disponible.</p>
      </div>
    `;
    return container;
  }

  const sdk = createAppSdk(app);
  const styleEl = applyAppStyle(app);
  let unmountFn = null;

  try {
    const mountResult = module.mount(container, sdk);
    if (mountResult && typeof mountResult.then === "function") {
      unmountFn = await mountResult;
    } else if (typeof mountResult === "function") {
      unmountFn = mountResult;
    }
  } catch (err) {
    console.error(err);
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
    container.innerHTML = `
      <div class="screen">
        <p>Se produjo un error al iniciar ${escapeHtml(title)}.</p>
      </div>
    `;
    return container;
  }

  if (token !== RENDER_TOKEN) {
    if (typeof unmountFn === "function") {
      try {
        unmountFn();
      } catch (err) {
        console.error(err);
      }
    }
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
    return container;
  }

  if (!unmountFn && module && typeof module.unmount === "function") {
    unmountFn = () => module.unmount(container, sdk);
  }

  CURRENT_APP = {
    name: app.name,
    module,
    route: path,
    container,
    unmount: typeof unmountFn === "function" ? unmountFn : null,
    styleEl,
    sdk,
  };

  return container;
}

function buildDynamicRoutes() {
  DYNAMIC_ROUTES.forEach((r) => {
    delete routes[r];
    ROUTE_APP.delete(r);
  });
  DYNAMIC_ROUTES.clear();

  for (const app of APP_REGISTRY) {
    if (!app || !Array.isArray(app.routes)) continue;
    for (const routeDef of app.routes) {
      const path = normalizeRoutePath(routeDef);
      if (!path || path === "/home") continue;
      DYNAMIC_ROUTES.add(path);
      ROUTE_APP.set(path, app);
      routes[path] = (_, token) => renderAppRoute(app, path, token);
    }
  }

  if (CURRENT_APP && !ROUTE_APP.has(CURRENT_APP.route)) {
    unmountCurrentApp();
    CURRENT_ROUTE = null;
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".tile");
  if (btn) {
    const route = btn.dataset.route || "/home";
    render(route).catch((err) => console.error(err));
  }
});

window.addEventListener("message", (event) => {
  const d = event.data;
  if (!d) return;
  if (d.type === "tablet:visible") {
    overlay.style.display = d.value ? "flex" : "none";
    if (d.value) render("/home").catch((err) => console.error(err));
    nui("requestApps");
  } else if (d.type === "tablet:navigate") {
    render(d.route).catch((err) => console.error(err));
  } else if (d.type === "tablet:apps") {
    APP_REGISTRY = Array.isArray(d.apps) ? d.apps : [];
    buildDynamicRoutes();
    if (overlay.style.display !== "none") {
      render("/home").catch((err) => console.error(err));
    }
  }
});

closeBtn.addEventListener("click", () => {
  nui("uiClose");
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    nui("uiClose");
  }
});

nui("uiReady").catch(() => {}); // Ignore errors

window.__si_register_app = function (name, mod) {
  const module = mod || {};
  APP_MODULES.set(name, module);
  const wait = APP_LOADING.get(name);
  if (wait) {
    if (typeof wait.resolve === "function") {
      wait.resolve(module);
    }
    APP_LOADING.delete(name);
  }
};
