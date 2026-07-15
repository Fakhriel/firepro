const { Op } = require('sequelize');
const { CostEntry } = require('./report.model');
const { Invoice } = require('../invoices/invoices.model');

const CATEGORIES = ['hpp', 'ads', 'shipping', 'ops', 'other'];
const CATEGORY_LABELS = {
  hpp: 'HPP / Harga Pokok',
  ads: 'Iklan',
  shipping: 'Pengiriman',
  ops: 'Operasional',
  other: 'Lain-lain',
};

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}


function resolveRange(period) {
  const now = new Date();
  const startOfMonth = (y, m) => new Date(y, m, 1);
  const endOfMonth = (y, m) => new Date(y, m + 1, 0);

  switch (period) {
    case 'last_month': {
      const m = now.getMonth() - 1;
      const y = m < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const month = (m + 12) % 12;
      return { start: startOfMonth(y, month), end: endOfMonth(y, month) };
    }
    case 'this_year':
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
    case 'all_time':
    case 'custom':
      return { start: null, end: null };
    case 'this_month':
    default:
      return { start: startOfMonth(now.getFullYear(), now.getMonth()), end: endOfMonth(now.getFullYear(), now.getMonth()) };
  }
}

function toDateOnly(d) {

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function serializeCost(entry) {
  const plain = entry.toJSON ? entry.toJSON() : entry;
  return {
    id: String(plain.id),
    date: plain.date,
    category: plain.category,
    categoryLabel: CATEGORY_LABELS[plain.category] ?? plain.category,
    amount: Number(plain.amount),
    note: plain.note ?? '',
  };
}

async function listCosts({ period } = {}) {
  const { start, end } = resolveRange(period);
  const where = {};
  if (start && end) {
    where.date = { [Op.between]: [toDateOnly(start), toDateOnly(end)] };
  }

  const entries = await CostEntry.findAll({ where, order: [['date', 'DESC'], ['id', 'DESC']] });
  return entries.map(serializeCost);
}

function validateCostInput(body) {
  const { category, amount } = body;
  if (!category || !CATEGORIES.includes(category)) {
    throw badRequest(`category harus salah satu dari: ${CATEGORIES.join(', ')}.`);
  }
  if (amount === undefined || amount === null || Number.isNaN(Number(amount)) || Number(amount) < 0) {
    throw badRequest('amount wajib diisi dan harus angka >= 0.');
  }
  return {
    date: body.date || toDateOnly(new Date()),
    category,
    amount: Number(amount),
    note: body.note ? String(body.note).trim() : null,
  };
}

async function createCost(body) {
  const payload = validateCostInput(body);
  const entry = await CostEntry.create(payload);
  return serializeCost(entry);
}


async function createCostBreakdown(body) {
  const entries = [];
  for (const category of CATEGORIES) {
    const amount = Number(body[category]);
    if (amount > 0) {
      entries.push({
        date: toDateOnly(new Date()),
        category,
        amount,
        note: `Input rincian biaya (${CATEGORY_LABELS[category]})`,
      });
    }
  }
  if (entries.length === 0) {
    throw badRequest('Isi minimal 1 kategori biaya dengan nilai > 0.');
  }
  const created = await CostEntry.bulkCreate(entries);
  return created.map(serializeCost);
}

async function getSummary({ period } = {}) {
  const { start, end } = resolveRange(period);

  const invoiceWhere = { status: 'paid' };
  if (start && end) {
    invoiceWhere.issuedDate = { [Op.between]: [toDateOnly(start), toDateOnly(end)] };
  }
  const revenue = Number((await Invoice.sum('amount', { where: invoiceWhere })) ?? 0);

  const costWhere = {};
  if (start && end) {
    costWhere.date = { [Op.between]: [toDateOnly(start), toDateOnly(end)] };
  }
  const totalCost = Number((await CostEntry.sum('amount', { where: costWhere })) ?? 0);

  const grossProfit = revenue - totalCost;
  const roi = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

  return {
    period: period || 'this_month',
    revenue,
    totalCost,
    grossProfit,
    roi: Math.round(roi * 100) / 100,
  };
}

module.exports = { listCosts, createCost, createCostBreakdown, getSummary };