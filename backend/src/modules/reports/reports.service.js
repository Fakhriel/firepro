const { Op } = require('sequelize');
const { CostEntry } = require('./report.model');
const { Invoice } = require('../invoices/invoices.model');
const { Project } = require('../projects/projects.model');
const { Client } = require('../clients/clients.model');

const CATEGORIES = ['material', 'labor', 'service', 'equipment', 'other'];
const CATEGORY_LABELS = {
  material: 'Material',
  labor: 'Tenaga Kerja',
  service: 'Jasa',
  equipment: 'Peralatan',
  other: 'Lain-lain',
};

// Status invoice yang dihitung sebagai "sudah masuk / revenue tercapai"
// untuk laporan. Draft belum resmi terbit, cancelled bukan pendapatan.
const REVENUE_STATUSES = ['issued', 'unpaid', 'partially_paid', 'paid', 'overdue'];
const PAID_STATUS = 'paid';
const OUTSTANDING_STATUSES = ['issued', 'unpaid', 'partially_paid', 'overdue'];

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
    projectId: plain.projectId ?? null,
  };
}

async function listCosts({ period, projectId } = {}) {
  const { start, end } = resolveRange(period);
  const where = {};
  if (start && end) {
    where.date = { [Op.between]: [toDateOnly(start), toDateOnly(end)] };
  }
  if (projectId) {
    where.projectId = projectId;
  }

  const entries = await CostEntry.findAll({ where, order: [['date', 'DESC'], ['id', 'DESC']] });
  return entries.map(serializeCost);
}

function validateCostInput(body) {
  const { category, amount, projectId } = body;
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
    projectId: projectId ?? null,
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
        projectId: body.projectId ?? null,
      });
    }
  }
  if (entries.length === 0) {
    throw badRequest('Isi minimal 1 kategori biaya dengan nilai > 0.');
  }
  const created = await CostEntry.bulkCreate(entries);
  return created.map(serializeCost);
}


function computeRoi(contractValue, cost) {
  const profit = contractValue - cost;
  const roi = cost > 0 ? (profit / cost) * 100 : 0;
  return { profit, roi: Math.round(roi * 100) / 100 };
}

async function getSummary({ period } = {}) {
  const { start, end } = resolveRange(period);

  const invoiceDateWhere = start && end ? { issuedDate: { [Op.between]: [toDateOnly(start), toDateOnly(end)] } } : {};
  const costDateWhere = start && end ? { date: { [Op.between]: [toDateOnly(start), toDateOnly(end)] } } : {};

  // Contract Value: total nilai invoice yang sudah resmi terbit (bukan draft/cancelled).
  const contractValue = Number(
    (await Invoice.sum('amount', { where: { ...invoiceDateWhere, status: { [Op.in]: REVENUE_STATUSES } } })) ?? 0,
  );
  const paidRevenue = Number(
    (await Invoice.sum('amount', { where: { ...invoiceDateWhere, status: PAID_STATUS } })) ?? 0,
  );
  const outstandingRevenue = Number(
    (await Invoice.sum('amount', { where: { ...invoiceDateWhere, status: { [Op.in]: OUTSTANDING_STATUSES } } })) ?? 0,
  );
  const totalInvoiceCount = await Invoice.count({ where: { ...invoiceDateWhere, status: { [Op.in]: REVENUE_STATUSES.concat(PAID_STATUS) } } });
  const paidInvoiceCount = await Invoice.count({ where: { ...invoiceDateWhere, status: PAID_STATUS } });

  const totalCost = Number((await CostEntry.sum('amount', { where: costDateWhere })) ?? 0);

  const { profit, roi } = computeRoi(contractValue, totalCost);

  const totalProjects = await Project.count();
  const activeProjects = await Project.count({ where: { status: { [Op.in]: ['planning', 'in_progress'] } } });
  const completedProjects = await Project.count({ where: { status: 'completed' } });

  const costByCategoryRaw = await CostEntry.findAll({
    where: costDateWhere,
    attributes: ['category', [CostEntry.sequelize.fn('SUM', CostEntry.sequelize.col('amount')), 'total']],
    group: ['category'],
    raw: true,
  });
  const costByCategory = CATEGORIES.map((category) => {
    const row = costByCategoryRaw.find((r) => r.category === category);
    return { category, categoryLabel: CATEGORY_LABELS[category], amount: Number(row?.total ?? 0) };
  });

  return {
    period: period || 'this_month',
    kpi: {
      totalProjects,
      activeProjects,
      completedProjects,
      contractValue,
      totalInvoices: totalInvoiceCount,
      paidInvoices: paidInvoiceCount,
      outstandingInvoiceAmount: outstandingRevenue,
      paidRevenue,
      totalCost,
      estimatedProfit: profit,
      roi,
    },
    charts: {
      costByCategory,
      contractValueVsCost: [
        { label: 'Contract Value', amount: contractValue },
        { label: 'Total Cost', amount: totalCost },
      ],
      invoiceStatus: [
        { label: 'Paid', amount: paidRevenue },
        { label: 'Outstanding', amount: outstandingRevenue },
      ],
    },
  };
}


async function getProjectRoi(projectId) {
  const project = await Project.findByPk(projectId);
  if (!project) {
    const err = new Error('Proyek tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }

  const contractValue = Number(
    (await Invoice.sum('amount', { where: { projectId, status: { [Op.in]: REVENUE_STATUSES.concat(PAID_STATUS) } } })) ?? 0,
  );
  const totalCost = Number((await CostEntry.sum('amount', { where: { projectId } })) ?? 0);
  const { profit, roi } = computeRoi(contractValue, totalCost);

  return {
    projectId: project.id,
    projectName: project.name,
    contractValue,
    totalCost,
    estimatedProfit: profit,
    roi,
  };
}

async function listProjectsRoi() {
  const projects = await Project.findAll({
    include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });

  const results = [];
  for (const project of projects) {
    const contractValue = Number(
      (await Invoice.sum('amount', { where: { projectId: project.id, status: { [Op.in]: REVENUE_STATUSES.concat(PAID_STATUS) } } })) ?? 0,
    );
    const totalCost = Number((await CostEntry.sum('amount', { where: { projectId: project.id } })) ?? 0);
    const { profit, roi } = computeRoi(contractValue, totalCost);
    const margin = contractValue > 0 ? Math.round((profit / contractValue) * 10000) / 100 : 0;

    results.push({
      projectId: project.id,
      projectName: project.name,
      clientName: project.client?.name ?? '-',
      contractValue,
      totalCost,
      estimatedProfit: profit,
      margin,
      roi,
    });
  }
  return results;
}

module.exports = { listCosts, createCost, createCostBreakdown, getSummary, getProjectRoi, listProjectsRoi };
