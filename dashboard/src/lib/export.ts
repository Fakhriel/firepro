// PDF export utility — pakai browser print API (no external library needed).
// Bisa diganti dengan jsPDF / Puppeteer

export interface ExportOptions {
  title: string;
  subtitle?: string;
  filename?: string;
}

export function exportTableToPDF(tableId: string, opts: ExportOptions): void {
  const table = document.getElementById(tableId);
  if (!table) {
    console.error(`[exportTableToPDF] element #${tableId} not found`);
    return;
  }

  const filename = opts.filename ?? opts.title.toLowerCase().replace(/\s+/g, "-");
  const date = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  const tableHTML = table.outerHTML;

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>${opts.title} — FIREPRO Dashboard</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

    * { margin:0; padding:0; box-sizing:border-box; }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: #17140f;
      background: #f0efe9;
      padding: 2rem;
    }

    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #17140f;
    }

    .pdf-brand {
      font-family: 'Anton', sans-serif;
      font-size: 2rem;
      line-height: 1;
    }

    .pdf-meta {
      text-align: right;
    }

    .pdf-meta h1 {
      font-family: 'Anton', sans-serif;
      font-size: 1rem;
      line-height: 1.2;
    }

    .pdf-meta p {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      color: #857e73;
      margin-top: 0.25rem;
    }

    .pdf-subtitle {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #857e73;
      margin-bottom: 1rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }

    th {
      padding: 0.5rem 0.75rem;
      text-align: left;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      background: #17140f;
      color: #f0efe9;
      font-weight: 600;
    }

    td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #d9d4c6;
    }

    tr:nth-child(even) td {
      background: rgba(217,212,198,0.25);
    }

    .pdf-footer {
      margin-top: 1.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid #d9d4c6;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6rem;
      color: #857e73;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      body { background: white; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div class="pdf-brand">FIREPRO</div>
    <div class="pdf-meta">
      <h1>${opts.title}</h1>
      <p>Admin Dashboard • ${date}</p>
    </div>
  </div>
  ${opts.subtitle ? `<p class="pdf-subtitle">${opts.subtitle}</p>` : ""}
  ${tableHTML}
  <div class="pdf-footer">
    <span>FIREPRO — Panel Kontrol</span>
    <span>Digenerate: ${new Date().toLocaleString("id-ID")}</span>
  </div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>
  `);

  printWindow.document.close();
}

// Format currency IDR
export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

// Format percent
export function formatPct(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

// ─── Invoice individual print/PDF ────────────────────────────────
// Beda dari exportTableToPDF: ini merender SATU dokumen invoice utuh
// (header klien, rincian, total, riwayat pembayaran), bukan sekadar
// nge-print elemen <table> yang sudah ada di halaman.

export interface InvoiceDocumentPayment {
  amount: number;
  paidDate: string;
  method: string;
  note?: string | null;
}

export interface InvoiceDocumentData {
  invoiceNumber: string;
  clientName: string;
  projectName?: string | null;
  issuedDate: string;
  dueDate?: string | null;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  statusLabel: string;
  notes?: string | null;
  payments: InvoiceDocumentPayment[];
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Tunai",
  bank_transfer: "Transfer Bank",
  cheque: "Cek/Giro",
  other: "Lainnya",
};

function formatDateID(iso?: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export function exportInvoiceDocument(invoice: InvoiceDocumentData, action: "print" | "download" = "print"): void {
  const printWindow = window.open("", "_blank", "width=850,height=1000");
  if (!printWindow) return;

  const paymentsRows = invoice.payments.length
    ? invoice.payments
        .map(
          (p) => `
          <tr>
            <td>${formatDateID(p.paidDate)}</td>
            <td>${PAYMENT_METHOD_LABELS[p.method] ?? p.method}</td>
            <td>${p.note ?? "-"}</td>
            <td style="text-align:right;">${formatIDR(p.amount)}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="4" style="text-align:center; color:#857e73;">Belum ada pembayaran tercatat</td></tr>`;

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>${invoice.invoiceNumber} — FIREPRO</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; font-size:12px; color:#17140f; background:#fff; padding:2.5rem; }
    .doc-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #17140f; padding-bottom:1.25rem; margin-bottom:1.5rem; }
    .doc-brand { font-family:'Anton',sans-serif; font-size:2.25rem; line-height:1; }
    .doc-brand-sub { font-family:'JetBrains Mono',monospace; font-size:0.6rem; color:#857e73; margin-top:0.25rem; letter-spacing:0.06em; }
    .doc-meta { text-align:right; }
    .doc-meta h1 { font-family:'Anton',sans-serif; font-size:1.5rem; }
    .doc-meta p { font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:#857e73; margin-top:0.2rem; }
    .status-pill { display:inline-block; margin-top:0.5rem; padding:0.2rem 0.6rem; border:2px solid #17140f; font-family:'JetBrains Mono',monospace; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.06em; }
    .doc-grid { display:flex; justify-content:space-between; margin-bottom:1.75rem; gap:2rem; }
    .doc-grid-block h3 { font-family:'JetBrains Mono',monospace; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.08em; color:#857e73; margin-bottom:0.35rem; }
    .doc-grid-block p { font-size:0.85rem; }
    table { width:100%; border-collapse:collapse; font-size:0.75rem; margin-bottom:1.25rem; }
    th { text-align:left; padding:0.5rem 0.6rem; background:#17140f; color:#f0efe9; font-family:'JetBrains Mono',monospace; font-size:0.6rem; text-transform:uppercase; letter-spacing:0.06em; }
    td { padding:0.5rem 0.6rem; border-bottom:1px solid #d9d4c6; }
    .totals { margin-left:auto; width:280px; }
    .totals-row { display:flex; justify-content:space-between; padding:0.4rem 0; font-family:'JetBrains Mono',monospace; font-size:0.8rem; }
    .totals-row.grand { border-top:2px solid #17140f; margin-top:0.3rem; padding-top:0.6rem; font-weight:700; font-size:0.95rem; }
    .doc-notes { margin-top:1.5rem; padding-top:1rem; border-top:1px solid #d9d4c6; font-size:0.75rem; color:#3a352c; }
    .doc-footer { margin-top:2.5rem; padding-top:1rem; border-top:1px solid #d9d4c6; font-family:'JetBrains Mono',monospace; font-size:0.6rem; color:#857e73; display:flex; justify-content:space-between; }
    @media print { @page { margin: 1.5cm; } }
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="doc-brand">FIREPRO</div>
      <p class="doc-brand-sub">Fire Safety Contractor Solutions</p>
    </div>
    <div class="doc-meta">
      <h1>INVOICE</h1>
      <p>${invoice.invoiceNumber}</p>
      <span class="status-pill">${invoice.statusLabel}</span>
    </div>
  </div>

  <div class="doc-grid">
    <div class="doc-grid-block">
      <h3>Ditagihkan Kepada</h3>
      <p><strong>${invoice.clientName}</strong></p>
      ${invoice.projectName ? `<p>${invoice.projectName}</p>` : ""}
    </div>
    <div class="doc-grid-block">
      <h3>Tanggal Terbit</h3>
      <p>${formatDateID(invoice.issuedDate)}</p>
    </div>
    <div class="doc-grid-block">
      <h3>Jatuh Tempo</h3>
      <p>${formatDateID(invoice.dueDate)}</p>
    </div>
  </div>

  <table>
    <thead><tr><th>Deskripsi</th><th style="text-align:right;">Jumlah</th></tr></thead>
    <tbody>
      <tr><td>Tagihan sesuai invoice ${invoice.invoiceNumber}</td><td style="text-align:right;">${formatIDR(invoice.amount)}</td></tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Total Tagihan</span><span>${formatIDR(invoice.amount)}</span></div>
    <div class="totals-row"><span>Sudah Dibayar</span><span>${formatIDR(invoice.paidAmount)}</span></div>
    <div class="totals-row grand"><span>Sisa Tagihan</span><span>${formatIDR(invoice.outstandingAmount)}</span></div>
  </div>

  <h3 style="font-family:'JetBrains Mono',monospace; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.08em; color:#857e73; margin-bottom:0.5rem;">Riwayat Pembayaran</h3>
  <table>
    <thead><tr><th>Tanggal</th><th>Metode</th><th>Catatan</th><th style="text-align:right;">Jumlah</th></tr></thead>
    <tbody>${paymentsRows}</tbody>
  </table>

  ${invoice.notes ? `<div class="doc-notes"><strong>Catatan:</strong> ${invoice.notes}</div>` : ""}

  <div class="doc-footer">
    <span>FIREPRO — Dokumen ini digenerate otomatis dari sistem</span>
    <span>Dicetak: ${new Date().toLocaleString("id-ID")}</span>
  </div>

  <script>
    window.onload = function() {
      ${action === "print" ? "window.print();" : "window.print();"}
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>
  `);

  printWindow.document.close();
}
