const assert = require('assert');
const { parseBoolean, computeRisk, classifyRisk, parseCsv, evaluateRecords } = require('./ops-risk');

(function testParseBoolean() {
  assert.equal(parseBoolean('yes'), true);
  assert.equal(parseBoolean('0'), false);
  assert.equal(parseBoolean(undefined), false);
})();

(function testComputeRiskHigh() {
  const rec = {
    qty_required: 100,
    qty_on_hand: 0,
    engineering_ready: 'no',
    supplier_confirmed: 'no',
    due_date: '2026-04-20',
    work_center_load: 130
  };
  const result = computeRisk(rec, new Date('2026-04-19'));
  assert.equal(result.score, 100);
  assert.ok(result.reasons.length >= 4);
})();

(function testComputeRiskLow() {
  const rec = {
    qty_required: 50,
    qty_on_hand: 50,
    engineering_ready: 'yes',
    supplier_confirmed: 'yes',
    due_date: '2026-05-01',
    work_center_load: 70
  };
  const result = computeRisk(rec, new Date('2026-04-19'));
  assert.equal(result.score, 0);
  assert.equal(classifyRisk(result.score), 'GREEN');
})();

(function testParseCsv() {
  const csv = 'job_id,qty_required\nA,10\nB,20';
  const rows = parseCsv(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].job_id, 'B');
})();

(function testEvaluateSortAndBand() {
  const rows = [
    { job_id: 'J1', qty_required: 100, qty_on_hand: 0, engineering_ready: 'no', supplier_confirmed: 'no', due_date: '2026-04-20', work_center_load: 125 },
    { job_id: 'J2', qty_required: 10, qty_on_hand: 10, engineering_ready: 'yes', supplier_confirmed: 'yes', due_date: '2026-05-20', work_center_load: 80 }
  ];
  const result = evaluateRecords(rows, new Date('2026-04-19'));
  assert.equal(result[0].job_id, 'J1');
  assert.equal(result[0].risk_band, 'RED');
  assert.equal(result[1].risk_band, 'GREEN');
})();

console.log('All tests passed');
