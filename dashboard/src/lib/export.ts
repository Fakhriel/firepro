// PDF export utility — pakai browser print API (no external library needed).
// Bisa diganti dengan jsPDF / Puppeteer endpoint setelah backend tersambung.

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