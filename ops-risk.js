(function (global) {
  function parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (value == null) return false;
    var normalized = String(value).trim().toLowerCase();
    return ['true', 'yes', 'y', '1'].indexOf(normalized) >= 0;
  }

  function toNumber(value, fallback) {
    var num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function safeDate(value) {
    var d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function daysBetween(today, dueDate) {
    var msPerDay = 24 * 60 * 60 * 1000;
    var utc1 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    var utc2 = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    return Math.floor((utc2 - utc1) / msPerDay);
  }

  function computeRisk(record, nowDate) {
    var today = nowDate || new Date();
    var qtyRequired = Math.max(0, toNumber(record.qty_required, 0));
    var qtyOnHand = Math.max(0, toNumber(record.qty_on_hand, 0));
    var loadPct = Math.max(0, toNumber(record.work_center_load, 0));
    var dueDate = safeDate(record.due_date);

    var shortage = Math.max(0, qtyRequired - qtyOnHand);
    var shortageRatio = qtyRequired === 0 ? 0 : shortage / qtyRequired;

    var score = 0;
    var reasons = [];

    if (!parseBoolean(record.engineering_ready)) {
      score += 30;
      reasons.push('Engineering release missing (+30)');
    }

    if (!parseBoolean(record.supplier_confirmed)) {
      score += 25;
      reasons.push('Supplier confirmation missing (+25)');
    }

    if (shortageRatio > 0) {
      var shortageScore = Math.min(25, Math.round(shortageRatio * 25));
      score += shortageScore;
      reasons.push('Material shortage ratio ' + (shortageRatio * 100).toFixed(1) + '% (+' + shortageScore + ')');
    }

    if (dueDate) {
      var d = daysBetween(today, dueDate);
      if (d <= 3) {
        score += 20;
        reasons.push('Due date within 3 days (+20)');
      } else if (d <= 7) {
        score += 10;
        reasons.push('Due date within 7 days (+10)');
      }
    } else {
      score += 10;
      reasons.push('Due date invalid (+10)');
    }

    if (loadPct >= 120) {
      score += 15;
      reasons.push('Work center overloaded >=120% (+15)');
    } else if (loadPct >= 100) {
      score += 8;
      reasons.push('Work center above 100% load (+8)');
    }

    return {
      score: Math.min(100, score),
      reasons: reasons,
      shortage_qty: shortage,
      shortage_ratio: shortageRatio
    };
  }

  function classifyRisk(score) {
    if (score >= 70) return 'RED';
    if (score >= 40) return 'AMBER';
    return 'GREEN';
  }

  function parseCsv(text) {
    var rows = text
      .split(/\r?\n/)
      .map(function (r) { return r.trim(); })
      .filter(Boolean);

    if (rows.length === 0) return [];

    var headers = rows[0].split(',').map(function (h) { return h.trim(); });
    return rows.slice(1).map(function (row) {
      var cells = row.split(',').map(function (c) { return c.trim(); });
      var obj = {};
      headers.forEach(function (h, idx) { obj[h] = cells[idx] || ''; });
      return obj;
    });
  }

  function evaluateRecords(records, nowDate) {
    return records.map(function (r) {
      var analysis = computeRisk(r, nowDate);
      var riskBand = classifyRisk(analysis.score);
      return Object.assign({}, r, analysis, { risk_band: riskBand });
    }).sort(function (a, b) {
      return b.score - a.score;
    });
  }

  var api = {
    parseBoolean: parseBoolean,
    computeRisk: computeRisk,
    classifyRisk: classifyRisk,
    parseCsv: parseCsv,
    evaluateRecords: evaluateRecords
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.opsRisk = api;
})(typeof window !== 'undefined' ? window : globalThis);
