(function exposeEviaCalculations(globalScope) {
  function normalizeNumber(rawValue) {
    const compactValue = String(rawValue || "").replace(/\s+/g, "");
    if (!compactValue) return { empty: true, valid: false, value: null };

    const commaCount = (compactValue.match(/,/g) || []).length;
    const dotCount = (compactValue.match(/\./g) || []).length;
    if (commaCount + dotCount > 1) {
      return { empty: false, valid: false, value: null };
    }

    const normalizedValue = compactValue.replace(",", ".");
    if (!/^-?(?:\d+|\d*\.\d+)$/.test(normalizedValue)) {
      return { empty: false, valid: false, value: null };
    }

    const value = Number(normalizedValue);
    return Number.isFinite(value)
      ? { empty: false, valid: true, value }
      : { empty: false, valid: false, value: null };
  }

  function calculateCharge(values) {
    const energyNeeded =
      values.batteryCapacity *
      ((values.targetPercent - values.currentPercent) / 100);
    const monthlyEnergy =
      values.monthlyKm === null
        ? null
        : (values.evConsumption * values.monthlyKm) / 100;

    return {
      energyNeeded,
      estimatedCost: energyNeeded * values.priceKwh,
      chargeHours: values.chargerPower
        ? energyNeeded / values.chargerPower
        : null,
      addedRange: (energyNeeded / values.evConsumption) * 100,
      costPer100Km: values.evConsumption * values.priceKwh,
      monthlyEnergy,
      monthlyCost:
        monthlyEnergy === null ? null : monthlyEnergy * values.priceKwh,
    };
  }

  function calculateTrip(values) {
    const availableRange = values.tripRange * (values.tripBatteryPercent / 100);
    const neededBattery = (values.tripDistance / values.tripRange) * 100;
    const remainingBattery = values.tripBatteryPercent - neededBattery;
    const recommendedStartBattery = neededBattery + values.tripSafetyMargin;

    return {
      availableRange,
      neededBattery,
      remainingBattery,
      remainingRange: values.tripRange * (remainingBattery / 100),
      safetyMarginKm: values.tripRange * (values.tripSafetyMargin / 100),
      recommendedStartBattery,
      recommendedRounded: Math.min(100, Math.ceil(recommendedStartBattery)),
      chargeDeficit: recommendedStartBattery - values.tripBatteryPercent,
      missingMarginPoints: Math.max(
        0,
        values.tripSafetyMargin - Math.max(0, remainingBattery),
      ),
      cannotKeepMarginWithoutStop: recommendedStartBattery > 100,
    };
  }

  const api = { normalizeNumber, calculateCharge, calculateTrip };
  globalScope.EviaCalculations = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
