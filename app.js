const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll("[data-target]");
const bottomNavButtons = document.querySelectorAll(".nav-btn");
const installBtn = document.getElementById("installBtn");
const validScreens = new Set(Array.from(screens).map((screen) => screen.id));
let deferredPrompt = null;

function showScreen(id, updateHash = true) {
  const targetId = validScreens.has(id) ? id : "home";

  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === targetId);
  });

  bottomNavButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.target === targetId);
  });

  if (updateHash) {
    const nextHash = targetId === "home" ? "#" : `#${targetId}`;
    history.pushState(null, "", nextHash);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showScreenFromHash() {
  const id = window.location.hash.replace("#", "") || "home";
  showScreen(id, false);
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.target;
    if (target) showScreen(target);
  });
});

window.addEventListener("hashchange", showScreenFromHash);
showScreenFromHash();

const chargeForm = document.getElementById("chargeForm");
const calcResult = document.getElementById("calcResult");
const tripForm = document.getElementById("tripForm");
const tripResult = document.getElementById("tripResult");
const tripStorageKey = "eviaTripPlannerLast";

function formatClp(value) {
  return `$${Math.round(value).toLocaleString("es-CL")} CLP`;
}

function formatChargeTime(hours) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0) return `${minutes} min aprox.`;
  if (minutes === 0) return `${wholeHours} h aprox.`;
  return `${wholeHours} h ${minutes} min aprox.`;
}

if (chargeForm) {
  chargeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const batteryCapacity = Number(document.getElementById("batteryCapacity").value);
    const currentPercent = Number(document.getElementById("currentPercent").value);
    const targetPercent = Number(document.getElementById("targetPercent").value);
    const priceKwh = Number(document.getElementById("priceKwh").value);
    const chargerPower = Number(document.getElementById("chargerPower").value);
    const evConsumption = Number(document.getElementById("evConsumption").value);
    const monthlyKm = Number(document.getElementById("monthlyKm").value);

    if (
      !batteryCapacity ||
      !priceKwh ||
      currentPercent < 0 ||
      targetPercent <= currentPercent ||
      targetPercent > 100
    ) {
      calcResult.classList.remove("hidden");
      calcResult.innerHTML =
        "<h3>Revisa los datos</h3><p>El porcentaje objetivo debe ser mayor al porcentaje actual y no superar 100%.</p>";
      return;
    }

    const energyNeeded = batteryCapacity * ((targetPercent - currentPercent) / 100);
    const estimatedCost = energyNeeded * priceKwh;
    const timeEstimate = chargerPower > 0 ? formatChargeTime(energyNeeded / chargerPower) : null;
    const addedRange = evConsumption > 0 ? (energyNeeded / evConsumption) * 100 : null;
    const costPer100Km = evConsumption > 0 ? evConsumption * priceKwh : null;
    const monthlyEnergy =
      evConsumption > 0 && monthlyKm > 0 ? (evConsumption * monthlyKm) / 100 : null;
    const monthlyCost = monthlyEnergy ? monthlyEnergy * priceKwh : null;

    let advice = "Para uso diario, intenta mantener rangos intermedios de carga.";
    if (targetPercent > 90) {
      advice =
        "Cargar sobre 90% puede ser útil antes de viajes largos, pero no siempre es necesario para el día a día.";
    } else if (targetPercent <= 80) {
      advice =
        "Buen rango para uso diario. Cargar hasta 80% suele ser una práctica saludable para la batería.";
    }

    calcResult.classList.remove("hidden");
    calcResult.innerHTML = `
      <h3>Resultado estimado</h3>
      <div class="result-grid">
        <div class="result-item"><span class="result-icon">⚡</span><div><span>Energía necesaria</span><strong>${energyNeeded.toFixed(1)} kWh</strong></div></div>
        <div class="result-item"><span class="result-icon">💰</span><div><span>Costo de carga</span><strong>${formatClp(estimatedCost)}</strong></div></div>
        ${
          timeEstimate
            ? `<div class="result-item"><span class="result-icon">⏱️</span><div><span>Tiempo estimado</span><strong>${timeEstimate}</strong></div></div>`
            : ""
        }
        ${
          addedRange
            ? `<div class="result-item"><span class="result-icon">🚗</span><div><span>Autonomía agregada</span><strong>${Math.round(addedRange).toLocaleString("es-CL")} km aprox.</strong></div></div>`
            : ""
        }
        ${
          costPer100Km
            ? `<div class="result-item"><span class="result-icon">📊</span><div><span>Costo por 100 km</span><strong>${formatClp(costPer100Km)}</strong></div></div>`
            : ""
        }
        ${
          monthlyCost && monthlyEnergy
            ? `<div class="result-item result-item-monthly"><span class="result-icon">📅</span><div><span>Costo mensual</span><strong>${formatClp(monthlyCost)}</strong><small>${monthlyEnergy.toFixed(1)} kWh mensuales estimados</small></div></div>`
            : ""
        }
      </div>
      <p class="result-advice">${advice}</p>
    `;
  });
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function loadTripPlannerLast() {
  if (!tripForm) return;

  try {
    const saved = JSON.parse(localStorage.getItem(tripStorageKey));
    if (!saved) return;

    Object.entries(saved).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input && value !== undefined && value !== null) input.value = value;
    });
  } catch (error) {
    localStorage.removeItem(tripStorageKey);
  }
}

if (tripForm) {
  loadTripPlannerLast();

  tripForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const tripRange = Number(document.getElementById("tripRange").value);
    const tripBatteryPercent = Number(document.getElementById("tripBatteryPercent").value);
    const tripDistance = Number(document.getElementById("tripDistance").value);
    const tripSafetyMargin = Number(document.getElementById("tripSafetyMargin").value || 0);

    if (
      tripRange <= 0 ||
      tripBatteryPercent <= 0 ||
      tripBatteryPercent > 100 ||
      tripDistance <= 0 ||
      tripSafetyMargin < 0 ||
      tripSafetyMargin > 50
    ) {
      tripResult.classList.remove("hidden", "green", "yellow", "red");
      tripResult.innerHTML =
        "<h3>Revisa los datos ingresados</h3><p>La autonomía, porcentaje actual y distancia deben ser mayores a cero.</p>";
      return;
    }

    const availableRange = tripRange * (tripBatteryPercent / 100);
    const neededBattery = (tripDistance / tripRange) * 100;
    const remainingBattery = tripBatteryPercent - neededBattery;
    const remainingRange = tripRange * (remainingBattery / 100);
    const safetyMarginKm = tripRange * (tripSafetyMargin / 100);

    let statusClass = "red";
    let statusText = "🔴 Necesitas cargar";
    let message =
      "Con la carga actual no alcanzarías a completar el viaje. Carga antes de salir o planifica una parada.";
    let evaTip =
      "Consejo de Eva: antes de salir, revisa cargadores disponibles y considera una parada intermedia.";

    if (remainingBattery >= tripSafetyMargin) {
      statusClass = "green";
      statusText = "✅ Viaje posible";
      message =
        "Tu carga actual debería alcanzar para este viaje manteniendo el margen de seguridad indicado.";
      evaTip =
        "Consejo de Eva: aun cuando el viaje sea posible, revisa clima, velocidad y cargadores cercanos por si necesitas margen extra.";
    } else if (remainingBattery >= 0) {
      statusClass = "yellow";
      statusText = "⚠️ Viaje justo";
      message =
        "Podrías llegar, pero con poco margen. Revisa cargadores en ruta o considera cargar antes de salir.";
      evaTip =
        "Consejo de Eva: si el resultado queda justo, cargar unos minutos antes de salir puede hacer el viaje mucho más tranquilo.";
    }

    localStorage.setItem(
      tripStorageKey,
      JSON.stringify({
        tripRange,
        tripBatteryPercent,
        tripDistance,
        tripSafetyMargin,
      })
    );

    tripResult.classList.remove("hidden", "green", "yellow", "red");
    tripResult.classList.add(statusClass);
    tripResult.innerHTML = `
      <div class="trip-status ${statusClass}">${statusText}</div>
      <p>${message}</p>
      <div class="result-grid">
        <div class="result-item"><span class="result-icon">🔋</span><div><span>Autonomía disponible</span><strong>${Math.round(availableRange).toLocaleString("es-CL")} km aprox.</strong></div></div>
        <div class="result-item"><span class="result-icon">🛣️</span><div><span>Distancia del viaje</span><strong>${Math.round(tripDistance).toLocaleString("es-CL")} km</strong></div></div>
        <div class="result-item"><span class="result-icon">⚡</span><div><span>Batería necesaria</span><strong>${formatPercent(neededBattery)}</strong></div></div>
        <div class="result-item"><span class="result-icon">📍</span><div><span>Batería al llegar</span><strong>${formatPercent(remainingBattery)}</strong></div></div>
        <div class="result-item"><span class="result-icon">🚗</span><div><span>Autonomía restante</span><strong>${Math.max(0, Math.round(remainingRange)).toLocaleString("es-CL")} km aprox.</strong></div></div>
        <div class="result-item"><span class="result-icon">🛡️</span><div><span>Margen de seguridad</span><strong>${Math.round(tripSafetyMargin)}%</strong><small>${Math.round(safetyMarginKm).toLocaleString("es-CL")} km reservados aprox.</small></div></div>
      </div>
      <p class="result-advice">${evaTip}</p>
      <div class="action-links">
        <a href="https://www.google.com/maps/search/?api=1&query=cargadores+electricos+cerca+de+mi" target="_blank" rel="noopener">Buscar ruta en Google Maps</a>
        <a href="https://www.plugshare.com/" target="_blank" rel="noopener">Buscar cargadores en PlugShare</a>
      </div>
    `;
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn?.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js?v=9")
      .catch((error) => console.warn("Service worker no registrado:", error));
  });
}
