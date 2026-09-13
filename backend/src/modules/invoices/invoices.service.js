const { Op } = require('sequelize');
const { Invoice, InvoicePayment, STATUSES } = require('./invoices.model');
const { Client } = require('../clients/clients.model');
const { Project } = require('../projects/projects.model');
const { Quotation } = require('../quotations/quotations.model');
const { escapeLike } = require('../../utils/escapeLike');
const { buildOrder } = require('../../utils/listQuery');

const MANUAL_STATUSES = ['draft', 'issued', 'unpaid', 'partially_paid', 'paid', 'cancelled'];
const SORTABLE_FIELDS = ['invoiceNumber', 'amount', 'status', 'issuedDate', 'dueDate', 'createdAt'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.expose = true;
  return err;
}

function notFound(message = 'Invoice tidak ditemukan.') {
  const err = new Error(message);
  err.status = 404;
  err.expose = true;
  return err;
}


function deriveDisplayStatus(invoice) {
  const { status, dueDate } = invoice;
  if (['paid', 'cancelled', 'draft'].includes(status)) return status;
  if (dueDate && new Date(dueDate) < new Date(new Date().toDateString())) {
    return 'overdue';
  }
  return status;
}

function sumPayments(payments = []) {
  return payments.reduce((total, p) => total + Number(p.amount), 0);
}

function serialize(invoice) {
  const plain = invoice.toJSON ? invoice.toJSON() : invoice;
  const paidAmount = sumPayments(plain.payments);
  const outstandingAmount = Math.max(Number(plain.amount) - paidAmount, 0);

  return {
    id: plain.id,
    invoiceNumber: plain.invoiceNumber,
    quotationId: plain.quotationId ?? null,
    quotationNumber: plain.quotation?.number ?? undefined,
    projectId: plain.projectId != null ? String(plain.projectId) : '-',
    amount: Number(plain.amount),
    status: deriveDisplayStatus(plain),
    issuedDate: plain.issuedDate,
    dueDate: plain.dueDate,
    notes: plain.notes,
    clientId: plain.clientId,
    clientName: plain.client?.name ?? '-',
    paidAmount,
    outstandingAmount,
    payments: (plain.payments || [])
      .slice()
      .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
      .map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paidDate: p.paidDate,
        method: p.method,
        note: p.note,
      })),
  };
}

const defaultInclude = [
  { model: Client, as: 'client', attributes: ['id', 'name'] },
  { model: InvoicePayment, as: 'payments' },
  { model: Quotation, as: 'quotation', attributes: ['id', 'number'] },
];

async function list({ search, status, projectId, quotationId, sortBy = 'issuedDate', sortDir = 'desc' } = {}) {
  const where = {};

  if (projectId) where.projectId = projectId;
  if (quotationId) where.quotationId = quotationId;

  if (search) {
    where[Op.or] = [
      { invoiceNumber: { [Op.like]: `%${escapeLike(search)}%` } },
    ];
  }

  const invoices = await Invoice.findAll({
    where,
    include: defaultInclude,
    order: buildOrder(sortBy, sortDir, SORTABLE_FIELDS, 'issuedDate'),
  });

  const serialized = invoices.map(serialize);

  // Filter status dilakukan setelah serialize karena 'overdue' adalah
  // status turunan (derived), bukan kolom di database.
  if (status && STATUSES.concat('overdue').includes(status)) {
    return serialized.filter((inv) => inv.status === status);
  }

  return serialized;
}

async function getById(id) {
  const invoice = await Invoice.findByPk(id, { include: defaultInclude });
  if (!invoice) throw notFound();
  return serialize(invoice);
}

function validateInput(body, { partial = false } = {}) {
  const { clientId, projectId, quotationId, amount, status, issuedDate, dueDate, notes } = body;

  if (!partial || clientId !== undefined) {
    if (!clientId) throw badRequest('clientId wajib diisi.');
  }
  if (!partial || amount !== undefined) {
    if (amount === undefined || amount === null || Number.isNaN(Number(amount)) || Number(amount) < 0) {
      throw badRequest('amount wajib diisi dan harus angka >= 0.');
    }
  }
  if (!partial || issuedDate !== undefined) {
    if (!issuedDate) throw badRequest('issuedDate wajib diisi.');
  }
  if (status !== undefined && !MANUAL_STATUSES.includes(status)) {
    throw badRequest(`status harus salah satu dari: ${MANUAL_STATUSES.join(', ')}. Status 'overdue' dihitung otomatis dari dueDate.`);
  }
  if (dueDate !== undefined && dueDate !== null && issuedDate && new Date(dueDate) < new Date(issuedDate)) {
    throw badRequest('dueDate tidak boleh lebih awal dari issuedDate.');
  }

  return {
    ...(clientId !== undefined && { clientId }),
    ...(projectId !== undefined && { projectId: projectId ?? null }),
    ...(quotationId !== undefined && { quotationId: quotationId ?? null }),
    ...(amount !== undefined && { amount: Number(amount) }),
    ...(status !== undefined && { status }),
    ...(issuedDate !== undefined && { issuedDate }),
    ...(dueDate !== undefined && { dueDate: dueDate ?? null }),
    ...(notes !== undefined && { notes: notes ?? null }),
  };
}

async function create(body) {
  const payload = validateInput(body);

  const client = await Client.findByPk(payload.clientId);
  if (!client) throw badRequest('clientId tidak valid — klien tidak ditemukan.');

  if (payload.projectId) {
    const project = await Project.findByPk(payload.projectId);
    if (!project) throw badRequest('projectId tidak valid — proyek tidak ditemukan.');
  }

  if (payload.quotationId) {
    const quotation = await Quotation.findByPk(payload.quotationId);
    if (!quotation) throw badRequest('quotationId tidak valid — penawaran tidak ditemukan.');
    const existing = await Invoice.findOne({ where: { quotationId: payload.quotationId } });
    if (existing) throw badRequest(`Penawaran ini sudah punya invoice (${existing.invoiceNumber}).`);
  }

  const invoice = await Invoice.create({
    invoiceNumber: `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'draft',
    ...payload,
  });

  const year = new Date().getFullYear();
  invoice.invoiceNumber = `INV/${year}/${String(invoice.id).padStart(6, '0')}`;
  await invoice.save();

  return getById(invoice.id);
}

async function update(id, body) {
  const invoice = await Invoice.findByPk(id);
  if (!invoice) throw notFound();

  const payload = validateInput(body, { partial: true });

  if (payload.clientId !== undefined) {
    const client = await Client.findByPk(payload.clientId);
    if (!client) throw badRequest('clientId tidak valid — klien tidak ditemukan.');
  }

  if (payload.projectId) {
    const project = await Project.findByPk(payload.projectId);
    if (!project) throw badRequest('projectId tidak valid — proyek tidak ditemukan.');
  }

  // Status manual tidak boleh diset mundur ke belakang dari status yang
  // sudah final. Paid dan cancelled adalah status akhir.
  if (payload.status !== undefined && ['paid', 'cancelled'].includes(invoice.status)) {
    throw badRequest(`Invoice berstatus '${invoice.status}' tidak dapat diubah statusnya lagi.`);
  }

  await invoice.update(payload);
  return getById(invoice.id);
}

async function remove(id) {
  const invoice = await Invoice.findByPk(id);
  if (!invoice) throw notFound();
  await invoice.destroy();
}


async function recordPayment(invoiceId, body, admin) {
  const invoice = await Invoice.findByPk(invoiceId, {
    include: [{ model: InvoicePayment, as: 'payments' }],
  });
  if (!invoice) throw notFound();

  if (['cancelled', 'draft'].includes(invoice.status)) {
    throw badRequest(`Invoice berstatus '${invoice.status}' belum bisa menerima pembayaran.`);
  }

  const { amount, paidDate, method, note } = body;

  if (amount === undefined || amount === null || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    throw badRequest('amount pembayaran wajib diisi dan harus lebih dari 0.');
  }
  if (!paidDate) throw badRequest('paidDate wajib diisi.');
  if (method && !['cash', 'bank_transfer', 'cheque', 'other'].includes(method)) {
    throw badRequest('method pembayaran tidak valid.');
  }

  const currentPaid = sumPayments(invoice.payments);
  const totalAfter = currentPaid + Number(amount);
  if (totalAfter > Number(invoice.amount)) {
    throw badRequest(
      `Total pembayaran (${totalAfter}) melebihi nilai invoice (${Number(invoice.amount)}). ` +
      `Sisa yang bisa dibayarkan: ${Number(invoice.amount) - currentPaid}.`,
    );
  }

  await InvoicePayment.create({
    invoiceId: invoice.id,
    amount: Number(amount),
    paidDate,
    method: method || 'bank_transfer',
    note: note ?? null,
    recordedByAdminId: admin?.id ?? null,
  });

  invoice.status = totalAfter >= Number(invoice.amount) ? 'paid' : 'partially_paid';
  await invoice.save();

  return getById(invoice.id);
}

async function removePayment(invoiceId, paymentId) {
  const invoice = await Invoice.findByPk(invoiceId, {
    include: [{ model: InvoicePayment, as: 'payments' }],
  });
  if (!invoice) throw notFound();

  const payment = invoice.payments.find((p) => p.id === Number(paymentId));
  if (!payment) throw notFound('Pembayaran tidak ditemukan.');

  await payment.destroy();

  const remaining = invoice.payments.filter((p) => p.id !== payment.id);
  const paidAfter = sumPayments(remaining);
  invoice.status = paidAfter <= 0 ? 'unpaid' : paidAfter >= Number(invoice.amount) ? 'paid' : 'partially_paid';
  await invoice.save();

  return getById(invoice.id);
}

async function createFromQuotation(quotationId) {
  const quotation = await Quotation.findByPk(quotationId);
  if (!quotation) throw notFound('Penawaran tidak ditemukan.');
  if (quotation.status !== 'accepted') {
    throw badRequest('Invoice hanya bisa dibuat dari penawaran berstatus accepted.');
  }
  if (!quotation.clientId) {
    throw badRequest('Penawaran ini belum terhubung ke klien terdaftar (clientId kosong) — pilih klien dari daftar saat membuat/mengedit penawaran terlebih dahulu.');
  }

  const existing = await Invoice.findOne({ where: { quotationId: quotation.id } });
  if (existing) throw badRequest(`Invoice untuk penawaran ini sudah pernah dibuat (${existing.invoiceNumber}).`);

  const invoice = await Invoice.create({
    invoiceNumber: `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'draft',
    clientId: quotation.clientId,
    projectId: quotation.projectId || null,
    quotationId: quotation.id,
    amount: Number(quotation.amount),
    issuedDate: new Date().toISOString().slice(0, 10),
  });

  const year = new Date().getFullYear();
  invoice.invoiceNumber = `INV/${year}/${String(invoice.id).padStart(6, '0')}`;
  await invoice.save();

  return getById(invoice.id);
}

module.exports = {
  list,
  getById,
  create,
  createFromQuotation,
  update,
  remove,
  recordPayment,
  removePayment,
  MANUAL_STATUSES,
};
