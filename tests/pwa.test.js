const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
);

function readPngDimensions(filePath) {
  const header = fs.readFileSync(filePath).subarray(0, 24);
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
  };
}

test("los íconos declarados existen y tienen las dimensiones correctas", () => {
  manifest.icons.forEach((icon) => {
    const filePath = path.join(root, icon.src);
    assert.equal(fs.existsSync(filePath), true, `${icon.src} no existe`);

    const [expectedWidth, expectedHeight] = icon.sizes.split("x").map(Number);
    assert.deepEqual(readPngDimensions(filePath), {
      width: expectedWidth,
      height: expectedHeight,
    });
  });
});

test("el manifiesto define identidad, idioma y alcance de la PWA", () => {
  assert.equal(manifest.id, "./");
  assert.equal(manifest.lang, "es-CL");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.equal(
    manifest.icons.some((icon) => icon.purpose === "maskable"),
    true,
  );
});

test("los recursos esenciales existen", () => {
  [
    "index.html",
    "style.css",
    "calculations.js",
    "ev-models.js",
    "app.js",
    "service-worker.js",
    "assets/eva.webp",
  ].forEach((relativePath) => {
    assert.equal(
      fs.existsSync(path.join(root, relativePath)),
      true,
      `${relativePath} no existe`,
    );
  });
});
