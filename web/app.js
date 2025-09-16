const RES =
  typeof GetParentResourceName === "function"
    ? GetParentResourceName()
    : GetCurrentResourceName();

function nui(name, data = {}) {
  return fetch(`https://${RES}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(data),
  });
}

const routes = {
  "/home": () => renderHome(),
};

const view = document.getElementById("view");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("close");

let APP_REGISTRY = [];

function render(path) {
  const component =
    routes[path] || (() => `<p>404 Not Found: ${path} not found</p>`);
  view.innerHTML = component();
}

function renderHome() {
  const tiles = APP_REGISTRY.map((app) => {
    const firstRoute =
      (app.routes && app.routes[0] && (app.routes[0].path || app.routes[0])) ||
      "/";
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

function buildDynamicRoutes() {
  for (const app of APP_REGISTRY) {
    if (!Array.isArray(app.routes)) continue;
    for (const r of app.routes) {
      const path = typeof r === "string" ? r : r.path;
      if (!path || routes[path]) continue;
      const title = app.title || app.name || "App";
      routes[path] = () => `
        <div class="screen">
          <h1>${title}</h1>
          <p>Ruta: <code>${path}</code></p>
          <p>(Placeholder generado desde manifest.json)</p>
        </div>
        `;
    }
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".tile");
  if (btn) {
    const route = btn.dataset.route || "/home";
    render(route);
  }
});

window.addEventListener("message", (event) => {
  const d = event.data;
  if (!d) return;
  if (d.type === "tablet:visible") {
    overlay.style.display = d.value ? "flex" : "none";
    if (d.value) render("/home");
    nui("requestApps");
  } else if (d.type === "tablet:navigate") {
    render(d.route);
  } else if (d.type === "tablet:apps") {
    APP_REGISTRY = Array.isArray(d.apps) ? d.apps : [];
    console.log("Received apps:", d.apps.length);
    buildDynamicRoutes();
    if (overlay.style.display !== "none") {
      render("/home");
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
