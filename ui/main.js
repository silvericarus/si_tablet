window.onloadeddata = function () {
  const businessApp = document.getElementById("business-app");
  const stocksApp = document.getElementById("stocks-app");
  const settingsApp = document.getElementById("settings-app");

  businessApp.addEventListener("click", () => {
    $.post("http://si_tablet/openApp", JSON.stringify({ app: "business" }));
  });

  stocksApp.addEventListener("click", () => {
    $.post("http://si_tablet/openApp", JSON.stringify({ app: "stocks" }));
  });

  settingsApp.addEventListener("click", () => {
    $.post("http://si_tablet/openApp", JSON.stringify({ app: "settings" }));
  });
};

window.addEventListener("message", (event) => {
  const data = event.data;
  console.log("Received message:", data);

  if (data.app === "business") {
    document.getElementById("business-app").style.display = "block";
  } else if (data.app === "stocks") {
    document.getElementById("stocks-app").style.display = "block";
  } else if (data.app === "settings") {
    document.getElementById("settings-app").style.display = "block";
  }
});
