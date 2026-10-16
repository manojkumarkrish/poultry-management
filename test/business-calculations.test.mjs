import { test } from 'node:test';
import assert from 'node:assert/strict';

// Helper formulas matching src/types/database.ts
const EGGS_PER_TRAY = 30;

function convertEggsToTrays(eggs) {
  const safeEggs = Math.max(0, eggs);
  const trays = Math.floor(safeEggs / EGGS_PER_TRAY);
  const loose = safeEggs % EGGS_PER_TRAY;
  return { trays, loose, total: safeEggs };
}

function calculateClosingBirds(opening, received, transIn, transOut, deaths, culls, sales, removals) {
  return opening + received + transIn - transOut - deaths - culls - sales - removals;
}

function calculateEggProductionPct(totalEggs, openingLayerBirds) {
  if (openingLayerBirds <= 0) return 0;
  return Number(((totalEggs / openingLayerBirds) * 100).toFixed(2));
}

test('Egg conversion: 3,125 eggs equals 104 trays and 5 loose eggs', () => {
  const result = convertEggsToTrays(3125);
  assert.equal(result.trays, 104);
  assert.equal(result.loose, 5);
  assert.equal(result.total, 3125);
});

test('Egg conversion: Exact tray multiples', () => {
  const result = convertEggsToTrays(15000);
  assert.equal(result.trays, 500);
  assert.equal(result.loose, 0);
});

test('Flock Reconciliation: Closing Birds Calculation', () => {
  // Opening: 18,000, Received: 0, TransIn: 500, TransOut: 0, Deaths: 12, Culls: 8, Sales: 200, Removals: 0
  const closing = calculateClosingBirds(18000, 0, 500, 0, 12, 8, 200, 0);
  assert.equal(closing, 18280);
});

test('Egg Laying Rate %: Calculated strictly against opening layer bird count', () => {
  // Total eggs: 16,200 from 17,600 opening layer birds
  const rate = calculateEggProductionPct(16200, 17600);
  assert.equal(rate, 92.05);
});

test('Recipe Formulations: Percentages must strictly sum to 100%', () => {
  const layerRecipe = [
    { name: 'Maize', percentage: 55 },
    { name: 'Soya DOC', percentage: 24 },
    { name: 'DORB', percentage: 8 },
    { name: 'Calcite', percentage: 9 },
    { name: 'DCP', percentage: 1.8 },
    { name: 'Premix', percentage: 1.8 },
    { name: 'Salt', percentage: 0.4 },
  ];
  const sum = layerRecipe.reduce((s, i) => s + i.percentage, 0);
  assert.equal(Number(sum.toFixed(1)), 100.0);
});

test('Feed Per Bird: 10,450 kg consumed by 99,850 birds', () => {
  const feedKg = 10450;
  const birds = 99850;
  const gramsPerBird = (feedKg * 1000) / birds;
  assert.equal(Number(gramsPerBird.toFixed(1)), 104.7);
});

test('Outstanding balance calculation on partial invoice payment', () => {
  const gross = 15000 * 5.2; // 78,000
  const discount = 1000;
  const net = gross - discount; // 77,000
  const paid = 50000;
  const outstanding = net - paid; // 27,000
  assert.equal(outstanding, 27000);
});
