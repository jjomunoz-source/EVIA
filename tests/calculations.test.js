const assert = require("node:assert/strict");
const test = require("node:test");
const {
  normalizeNumber,
  calculateCharge,
  calculateTrip,
} = require("../calculations.js");

test("normaliza decimales con coma o punto", () => {
  assert.equal(normalizeNumber("7,4").value, 7.4);
  assert.equal(normalizeNumber(" 16.5 ").value, 16.5);
  assert.equal(normalizeNumber("1,2.3").valid, false);
  assert.equal(normalizeNumber("").empty, true);
});

test("calcula una carga completa", () => {
  const result = calculateCharge({
    batteryCapacity: 60,
    currentPercent: 20,
    targetPercent: 80,
    priceKwh: 200,
    chargerPower: 7.2,
    evConsumption: 15,
    monthlyKm: 1000,
  });

  assert.equal(result.energyNeeded, 36);
  assert.equal(result.estimatedCost, 7200);
  assert.equal(result.chargeHours, 5);
  assert.equal(result.addedRange, 240);
  assert.equal(result.monthlyCost, 30000);
});

test("calcula un viaje con margen suficiente", () => {
  const result = calculateTrip({
    tripRange: 400,
    tripBatteryPercent: 80,
    tripDistance: 200,
    tripSafetyMargin: 20,
  });

  assert.equal(result.availableRange, 320);
  assert.equal(result.neededBattery, 50);
  assert.equal(result.remainingBattery, 30);
  assert.equal(result.recommendedStartBattery, 70);
  assert.equal(result.cannotKeepMarginWithoutStop, false);
});

test("detecta que un viaje requiere recarga", () => {
  const result = calculateTrip({
    tripRange: 300,
    tripBatteryPercent: 100,
    tripDistance: 280,
    tripSafetyMargin: 20,
  });

  assert.equal(result.cannotKeepMarginWithoutStop, true);
  assert.equal(result.recommendedRounded, 100);
});
