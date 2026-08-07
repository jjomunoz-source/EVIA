const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const serviceWorker = fs.readFileSync(
  path.join(root, "service-worker.js"),
  "utf8",
);

const chargersStart = html.indexOf('<section id="chargers"');
const chargersEnd = html.indexOf('<section id="homeCharging"');
const chargers = html.slice(chargersStart, chargersEnd);

test("el módulo Cargadores existe y destaca la fuente oficial", () => {
  assert.notEqual(chargersStart, -1);
  assert.notEqual(chargersEnd, -1);
  assert.match(chargers, /Mapa oficial recomendado/);
  assert.match(chargers, /EcoCarga · Ministerio de Energía/);
  assert.match(
    chargers,
    /https:\/\/energia\.gob\.cl\/electromovilidad\/ecocarga/,
  );
});

test("los enlaces verificados apuntan directamente a servicios HTTPS", () => {
  [
    "https://copecvoltex.cl/pages/red-de-carga-publica",
    "https://www.enelx.com/cl/es/mapa-puntos-de-carga",
    "https://www.google.com/maps/search/?api=1&amp;query=cargadores+electricos+cerca+de+mi",
    "https://www.plugshare.com/",
    "https://map.electromaps.com/es/",
  ].forEach((url) => assert.ok(chargers.includes(url), `${url} no existe`));

  const externalLinks = chargers.match(/<a[\s\S]*?<\/a\s*>/g) || [];
  assert.equal(externalLinks.length, 7);
  externalLinks.forEach((link) => {
    assert.match(link, /href="https:\/\//);
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noopener noreferrer"/);
  });
});

test("Cargadores explica sus límites y conecta con el Planificador", () => {
  assert.match(chargers, /EVIA funciona como directorio/);
  assert.match(chargers, /No muestra disponibilidad en tiempo real/);
  assert.match(chargers, /data-target="tripPlanner"/);
  assert.match(chargers, /compatibilidad del\s+conector y medio de pago/);
  assert.match(chargers, /Requieren conexión a\s+internet/);
});

test("la búsqueda cercana no captura ubicación dentro de EVIA", () => {
  assert.match(chargers, /Buscar cerca de mí/);
  assert.doesNotMatch(app, /navigator\.geolocation/);
  assert.match(
    html,
    /El módulo Cargadores no solicita, almacena ni transmite tu\s+ubicación/,
  );
});

test("la publicación usa versión de caché 30 de forma consistente", () => {
  assert.match(serviceWorker, /evia-cache-v30/);
  assert.match(app, /service-worker\.js\?v=30/);
  assert.match(
    serviceWorker,
    /url\.pathname\.endsWith\("\/calculations\.js"\)/,
  );
  ["style.css?v=30", "calculations.js?v=30", "ev-models.js?v=30", "app.js?v=30"].forEach(
    (asset) => assert.ok(html.includes(asset), `${asset} no está versionado`),
  );
});
