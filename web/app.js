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
  "/home": () => `
    <div class="screen">
      <h1>Bienvenido</h1>
      <p>Core v0.1 cargado.</p>
      <ul>
        <li>F1 o /tablet para abrir/cerrar</li>
        <li>Prueba /tablet_busdemo para ver el bus</li>
      </ul>
    </div>`,
};

const view = document.getElementById("view");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("close");

function render(path) {
  const component =
    routes[path] || (() => `<p>404 Not Found: ${path} not found</p>`);
  view.innerHTML = component();
}

window.addEventListener("message", (event) => {
  const d = event.data;
  if (!d) return;
  if (d.type === "tablet:visible") {
    overlay.style.display = d.value ? "flex" : "none";
    if (d.value) render("/home");
  } else if (d.type === "tablet:navigate") {
    render(d.route);
  } else if (d.type === "tablet:force") {
    console.log("[tablet-core] FORCE overlay");
    overlay.style.display = "flex";
    render("/home");
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
