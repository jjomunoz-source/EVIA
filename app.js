const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll("[data-target]");
const bottomNavButtons = document.querySelectorAll(".nav-btn");
const installBtn = document.getElementById("installBtn");
const heroScrollButtons = document.querySelectorAll("[data-scroll-target]");
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

heroScrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.scrollTarget);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const chargeForm = document.getElementById("chargeForm");
const calcResult = document.getElementById("calcResult");
const tripForm = document.getElementById("tripForm");
const tripResult = document.getElementById("tripResult");
const tripStorageKey = "eviaTripPlannerLast";
const usedChecklistForm = document.getElementById("usedChecklistForm");
const usedChecklistResult = document.getElementById("usedChecklistResult");
const saveUsedChecklistBtn = document.getElementById("saveUsedChecklist");
const clearUsedChecklistBtn = document.getElementById("clearUsedChecklist");
const usedChecklistStorageKey = "eviaUsedChecklist";
const firstStepsForm = document.getElementById("firstStepsForm");
const firstStepsResult = document.getElementById("firstStepsResult");
const saveFirstStepsBtn = document.getElementById("saveFirstSteps");
const resetFirstStepsBtn = document.getElementById("resetFirstSteps");
const firstStepsStorageKey = "eviaFirstSteps";
const myEviaForm = document.getElementById("myEviaForm");
const myEviaSummary = document.getElementById("myEviaSummary");
const clearMyEviaBtn = document.getElementById("clearMyEvia");
const myEviaStorageKey = "eviaUserVehicle";
const publishChecklistForm = document.getElementById("publishChecklistForm");
const publishChecklistResult = document.getElementById("publishChecklistResult");
const savePublishChecklistBtn = document.getElementById("savePublishChecklist");
const resetPublishChecklistBtn = document.getElementById("resetPublishChecklist");
const publishChecklistStorageKey = "eviaPublishChecklist";
const copyPublishDescriptionBtn = document.getElementById("copyPublishDescription");
const publishDescriptionText = document.getElementById("publishDescriptionText");
const publishCopyStatus = document.getElementById("publishCopyStatus");

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

function getUsedChecklistInputs() {
  return Array.from(document.querySelectorAll("#usedChecklistForm input[type='checkbox']"));
}

function getUsedChecklistEvaluation(score) {
  if (score >= 8) {
    return {
      riskClass: "risk-low",
      riskText: "✅ Riesgo bajo",
      message:
        "Vas bien. Aun así, antes de cerrar la compra, revisa documentos, garantía y diagnóstico final.",
    };
  }

  if (score >= 5) {
    return {
      riskClass: "risk-medium",
      riskText: "⚠️ Riesgo medio",
      message:
        "Todavía hay puntos importantes por revisar. No cierres la compra sin confirmar batería, garantía y soporte técnico.",
    };
  }

  return {
    riskClass: "risk-high",
    riskText: "🔴 Riesgo alto",
    message:
      "Falta demasiada información. Comprar sin revisar estos puntos puede ser riesgoso, especialmente por el costo de la batería.",
  };
}

function updateUsedChecklist() {
  if (!usedChecklistForm || !usedChecklistResult) return;

  const inputs = getUsedChecklistInputs();
  const checkedCount = inputs.filter((input) => input.checked).length;
  const total = inputs.length;
  const progress = total ? Math.round((checkedCount / total) * 100) : 0;
  const evaluation = getUsedChecklistEvaluation(checkedCount);

  inputs.forEach((input) => {
    input.closest(".checklist-item")?.classList.toggle("checked", input.checked);
  });

  usedChecklistResult.classList.remove("risk-low", "risk-medium", "risk-high");
  usedChecklistResult.classList.add(evaluation.riskClass);
  usedChecklistResult.innerHTML = `
    <div class="checklist-score">Puntaje EVIA: ${checkedCount}/${total}</div>
    <div class="checklist-risk">${evaluation.riskText}</div>
    <p>${evaluation.message}</p>
    <div class="checklist-progress">
      <span style="width:${progress}%" class="checklist-progress-bar ${evaluation.riskClass}"></span>
    </div>
    <small>Has revisado ${checkedCount} de ${total} puntos</small>
  `;
}

function saveUsedChecklist() {
  const checkedKeys = getUsedChecklistInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.check);

  localStorage.setItem(usedChecklistStorageKey, JSON.stringify(checkedKeys));
}

function loadUsedChecklist() {
  if (!usedChecklistForm) return;

  try {
    const saved = JSON.parse(localStorage.getItem(usedChecklistStorageKey)) || [];
    const savedSet = new Set(saved);

    getUsedChecklistInputs().forEach((input) => {
      input.checked = savedSet.has(input.dataset.check);
    });
  } catch (error) {
    localStorage.removeItem(usedChecklistStorageKey);
  }

  updateUsedChecklist();
}

if (usedChecklistForm) {
  loadUsedChecklist();

  getUsedChecklistInputs().forEach((input) => {
    input.addEventListener("change", updateUsedChecklist);
  });

  saveUsedChecklistBtn?.addEventListener("click", () => {
    saveUsedChecklist();
    updateUsedChecklist();
  });

  clearUsedChecklistBtn?.addEventListener("click", () => {
    getUsedChecklistInputs().forEach((input) => {
      input.checked = false;
    });
    localStorage.removeItem(usedChecklistStorageKey);
    updateUsedChecklist();
  });
}

function getFirstStepsInputs() {
  return Array.from(document.querySelectorAll("#firstStepsForm input[type='checkbox']"));
}

function getFirstStepsEvaluation(score) {
  if (score >= 6) {
    return {
      riskClass: "risk-low",
      statusText: "✅ Listo para avanzar",
      message:
        "Vas muy bien. Ya tienes los conocimientos básicos para usar mejor tu vehículo eléctrico y seguir aprendiendo con EVIA.",
    };
  }

  if (score >= 3) {
    return {
      riskClass: "risk-medium",
      statusText: "⚠️ Buen avance",
      message:
        "Ya tienes una base útil. Ahora refuerza costos, mapas de carga y planificación de viajes.",
    };
  }

  return {
    riskClass: "risk-high",
    statusText: "🔴 Recién comenzando",
    message:
      "Todavía estás en la etapa inicial. Empieza por conocer tu autonomía real, tu conector y cómo cargar de forma segura.",
  };
}

function updateFirstStepsGuide() {
  if (!firstStepsForm || !firstStepsResult) return;

  const inputs = getFirstStepsInputs();
  const completedCount = inputs.filter((input) => input.checked).length;
  const total = inputs.length;
  const progress = total ? Math.round((completedCount / total) * 100) : 0;
  const evaluation = getFirstStepsEvaluation(completedCount);

  inputs.forEach((input) => {
    input.closest(".first-step-item")?.classList.toggle("checked", input.checked);
  });

  firstStepsResult.classList.remove("risk-low", "risk-medium", "risk-high");
  firstStepsResult.classList.add(evaluation.riskClass);
  firstStepsResult.innerHTML = `
    <div class="checklist-score">Has completado ${completedCount} de ${total} pasos</div>
    <div class="checklist-risk">${evaluation.statusText}</div>
    <p>${evaluation.message}</p>
    <div class="first-steps-progress">
      <span style="width:${progress}%" class="first-steps-progress-bar ${evaluation.riskClass}"></span>
    </div>
  `;
}

function saveFirstStepsGuide() {
  const checkedKeys = getFirstStepsInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.step);

  localStorage.setItem(firstStepsStorageKey, JSON.stringify(checkedKeys));
}

function loadFirstStepsGuide() {
  if (!firstStepsForm) return;

  try {
    const saved = JSON.parse(localStorage.getItem(firstStepsStorageKey)) || [];
    const savedSet = new Set(saved);

    getFirstStepsInputs().forEach((input) => {
      input.checked = savedSet.has(input.dataset.step);
    });
  } catch (error) {
    localStorage.removeItem(firstStepsStorageKey);
  }

  updateFirstStepsGuide();
}

if (firstStepsForm) {
  loadFirstStepsGuide();

  getFirstStepsInputs().forEach((input) => {
    input.addEventListener("change", updateFirstStepsGuide);
  });

  saveFirstStepsBtn?.addEventListener("click", () => {
    saveFirstStepsGuide();
    updateFirstStepsGuide();
  });

  resetFirstStepsBtn?.addEventListener("click", () => {
    getFirstStepsInputs().forEach((input) => {
      input.checked = false;
    });
    localStorage.removeItem(firstStepsStorageKey);
    updateFirstStepsGuide();
  });
}

function getPublishChecklistInputs() {
  return Array.from(document.querySelectorAll("#publishChecklistForm input[type='checkbox']"));
}

function getPublishChecklistEvaluation(score) {
  if (score >= 11) {
    return {
      riskClass: "risk-low",
      statusText: "✅ Casi lista para empaquetar",
      message:
        "EVIA está bien encaminada para comenzar la preparación técnica hacia Play Store.",
    };
  }

  if (score >= 6) {
    return {
      riskClass: "risk-medium",
      statusText: "⚠️ Buen avance",
      message:
        "EVIA ya tiene una base sólida. Ahora conviene preparar textos de tienda, capturas oficiales y revisión técnica.",
    };
  }

  return {
    riskClass: "risk-high",
    statusText: "🔴 Preparación inicial",
    message:
      "EVIA todavía está en etapa de preparación. Prioriza privacidad, pruebas móviles, identidad visual y funciones principales.",
  };
}

function updatePublishChecklist() {
  if (!publishChecklistForm || !publishChecklistResult) return;

  const inputs = getPublishChecklistInputs();
  const completedCount = inputs.filter((input) => input.checked).length;
  const total = inputs.length;
  const progress = total ? Math.round((completedCount / total) * 100) : 0;
  const evaluation = getPublishChecklistEvaluation(completedCount);

  inputs.forEach((input) => {
    input.closest(".publish-checklist-item")?.classList.toggle("checked", input.checked);
  });

  publishChecklistResult.classList.remove("risk-low", "risk-medium", "risk-high");
  publishChecklistResult.classList.add(evaluation.riskClass);
  publishChecklistResult.innerHTML = `
    <div class="checklist-score">Has completado ${completedCount} de ${total} puntos</div>
    <div class="checklist-risk">${evaluation.statusText}</div>
    <p>${evaluation.message}</p>
    <div class="publish-progress">
      <span style="width:${progress}%" class="publish-progress-bar ${evaluation.riskClass}"></span>
    </div>
  `;
}

function savePublishChecklist() {
  const checkedKeys = getPublishChecklistInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.publishCheck);

  localStorage.setItem(publishChecklistStorageKey, JSON.stringify(checkedKeys));
}

function loadPublishChecklist() {
  if (!publishChecklistForm) return;

  try {
    const saved = JSON.parse(localStorage.getItem(publishChecklistStorageKey)) || [];
    const savedSet = new Set(saved);

    getPublishChecklistInputs().forEach((input) => {
      input.checked = savedSet.has(input.dataset.publishCheck);
    });
  } catch (error) {
    localStorage.removeItem(publishChecklistStorageKey);
  }

  updatePublishChecklist();
}

if (publishChecklistForm) {
  loadPublishChecklist();

  getPublishChecklistInputs().forEach((input) => {
    input.addEventListener("change", updatePublishChecklist);
  });

  savePublishChecklistBtn?.addEventListener("click", () => {
    savePublishChecklist();
    updatePublishChecklist();
  });

  resetPublishChecklistBtn?.addEventListener("click", () => {
    getPublishChecklistInputs().forEach((input) => {
      input.checked = false;
    });
    localStorage.removeItem(publishChecklistStorageKey);
    updatePublishChecklist();
  });
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Continue with the compatibility fallback below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

copyPublishDescriptionBtn?.addEventListener("click", async () => {
  if (!publishDescriptionText || !publishCopyStatus) return;

  const copied = await copyTextToClipboard(publishDescriptionText.innerText.trim());
  publishCopyStatus.textContent = copied
    ? "Descripción copiada."
    : "No se pudo copiar. Intenta nuevamente.";
});

const myEviaFields = {
  vehicleName: "myEviaVehicleName",
  batteryCapacity: "myEviaBatteryCapacity",
  realRange: "myEviaRealRange",
  consumption: "myEviaConsumption",
  priceKwh: "myEviaPriceKwh",
  chargerPower: "myEviaChargerPower",
};

function getMyEviaData() {
  try {
    return JSON.parse(localStorage.getItem(myEviaStorageKey));
  } catch (error) {
    localStorage.removeItem(myEviaStorageKey);
    return null;
  }
}

function readMyEviaForm() {
  return Object.fromEntries(
    Object.entries(myEviaFields).map(([key, id]) => [key, document.getElementById(id)?.value.trim() || ""])
  );
}

function fillMyEviaForm(data) {
  if (!myEviaForm || !data) return;

  Object.entries(myEviaFields).forEach(([key, id]) => {
    const input = document.getElementById(id);
    if (input) input.value = data[key] || "";
  });
}

function formatSavedValue(value, suffix = "") {
  return value ? `${value}${suffix}` : "No informado";
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value || "";
  return element.innerHTML;
}

function updateMyEviaSummary(data = getMyEviaData()) {
  if (!myEviaSummary) return;

  const hasSavedData = data && Object.values(data).some(Boolean);
  if (!hasSavedData) {
    myEviaSummary.innerHTML = "<h3>Datos guardados</h3><p>Aún no has guardado datos de tu vehículo.</p>";
    return;
  }

  myEviaSummary.innerHTML = `
    <h3>Datos guardados</h3>
    <div class="saved-data-grid">
      <div class="saved-data-item"><span>Vehículo</span><strong>${escapeHtml(data.vehicleName) || "No informado"}</strong></div>
      <div class="saved-data-item"><span>Capacidad de batería</span><strong>${formatSavedValue(data.batteryCapacity, " kWh")}</strong></div>
      <div class="saved-data-item"><span>Autonomía real estimada</span><strong>${formatSavedValue(data.realRange, " km")}</strong></div>
      <div class="saved-data-item"><span>Consumo promedio</span><strong>${formatSavedValue(data.consumption, " kWh/100 km")}</strong></div>
      <div class="saved-data-item"><span>Precio kWh</span><strong>${data.priceKwh ? formatClp(data.priceKwh) : "No informado"}</strong></div>
      <div class="saved-data-item"><span>Potencia cargador</span><strong>${formatSavedValue(data.chargerPower, " kW")}</strong></div>
    </div>
  `;
}

function prefillInputIfEmpty(id, value) {
  const input = document.getElementById(id);
  if (input && !input.value && value) input.value = value;
}

function prefillToolFromMyEvia(target) {
  const data = getMyEviaData();
  if (!data) return;

  if (target === "calculator") {
    prefillInputIfEmpty("batteryCapacity", data.batteryCapacity);
    prefillInputIfEmpty("priceKwh", data.priceKwh);
    prefillInputIfEmpty("chargerPower", data.chargerPower);
    prefillInputIfEmpty("evConsumption", data.consumption);
  }

  if (target === "tripPlanner") {
    prefillInputIfEmpty("tripRange", data.realRange);
  }
}

if (myEviaForm) {
  const savedData = getMyEviaData();
  fillMyEviaForm(savedData);
  updateMyEviaSummary(savedData);

  myEviaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = readMyEviaForm();
    localStorage.setItem(myEviaStorageKey, JSON.stringify(data));
    updateMyEviaSummary(data);
  });

  clearMyEviaBtn?.addEventListener("click", () => {
    myEviaForm.reset();
    localStorage.removeItem(myEviaStorageKey);
    updateMyEviaSummary(null);
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => prefillToolFromMyEvia(button.dataset.target));
});

window.addEventListener("hashchange", () => {
  prefillToolFromMyEvia(window.location.hash.replace("#", ""));
});

prefillToolFromMyEvia(window.location.hash.replace("#", ""));

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
      .register("service-worker.js?v=17")
      .catch((error) => console.warn("Service worker no registrado:", error));
  });
}
