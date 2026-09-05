export interface BarChartSeries {
  label: string;
  value: number;
  color?: string;
}

/**
 * Render bar chart SVG sederhana (vertikal) ke dalam elemen container.
 * Tidak pakai library eksternal — cukup untuk perbandingan beberapa nilai.
 */
export function renderBarChart(
  container: HTMLElement,
  series: BarChartSeries[],
  formatValue: (n: number) => string
): void {
  const width = 600;
  const height = 240;
  const paddingBottom = 40;
  const paddingTop = 20;
  const barAreaHeight = height - paddingBottom - paddingTop;
  const maxValue = Math.max(...series.map((s) => Math.abs(s.value)), 1);
  const barWidth = width / series.length;
  const defaultColors = ["#c22a1f", "#14181c", "#7a746a"];

  const bars = series
    .map((s, i) => {
      const barHeight = (Math.abs(s.value) / maxValue) * barAreaHeight;
      const x = i * barWidth + barWidth * 0.2;
      const y = paddingTop + (barAreaHeight - barHeight);
      const w = barWidth * 0.6;
      const color = s.color ?? defaultColors[i % defaultColors.length];
      return `
        <rect x="${x}" y="${y}" width="${w}" height="${barHeight}" fill="${color}" />
        <text x="${x + w / 2}" y="${y - 8}" text-anchor="middle" font-size="12" font-family="monospace" fill="#14181c">${formatValue(s.value)}</text>
        <text x="${x + w / 2}" y="${height - paddingBottom + 18}" text-anchor="middle" font-size="11" font-family="monospace" fill="#7a746a" text-transform="uppercase">${s.label}</text>
      `;
    })
    .join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto" role="img" aria-label="Grafik perbandingan nilai">
      <line x1="0" y1="${height - paddingBottom}" x2="${width}" y2="${height - paddingBottom}" stroke="#e5e0d8" stroke-width="1" />
      ${bars}
    </svg>
  `;
}

export interface LineChartPoint {
  label: string;
  value: number;
}

/**
 * Render line chart SVG sederhana untuk tren beberapa titik waktu
 * (mis. omzet per bulan, 6 bulan terakhir).
 */
export function renderLineChart(
  container: HTMLElement,
  seriesList: { name: string; color: string; points: LineChartPoint[] }[],
  formatValue: (n: number) => string
): void {
  const width = 600;
  const height = 240;
  const paddingBottom = 30;
  const paddingTop = 20;
  const paddingX = 10;
  const plotHeight = height - paddingBottom - paddingTop;
  const pointCount = seriesList[0]?.points.length ?? 0;
  const maxValue = Math.max(...seriesList.flatMap((s) => s.points.map((p) => p.value)), 1);
  const stepX = pointCount > 1 ? (width - paddingX * 2) / (pointCount - 1) : 0;

  function toXY(index: number, value: number): [number, number] {
    const x = paddingX + index * stepX;
    const y = paddingTop + (plotHeight - (value / maxValue) * plotHeight);
    return [x, y];
  }

  const lines = seriesList
    .map((s) => {
      const pathD = s.points
        .map((p, i) => {
          const [x, y] = toXY(i, p.value);
          return `${i === 0 ? "M" : "L"}${x},${y}`;
        })
        .join(" ");
      const dots = s.points
        .map((p, i) => {
          const [x, y] = toXY(i, p.value);
          return `<circle cx="${x}" cy="${y}" r="3" fill="${s.color}" />`;
        })
        .join("");
      return `<path d="${pathD}" fill="none" stroke="${s.color}" stroke-width="2" />${dots}`;
    })
    .join("");

  const labels = (seriesList[0]?.points ?? [])
    .map((p, i) => {
      const [x] = toXY(i, 0);
      return `<text x="${x}" y="${height - paddingBottom + 16}" text-anchor="middle" font-size="10" font-family="monospace" fill="#7a746a">${p.label}</text>`;
    })
    .join("");

  const legend = seriesList
    .map(
      (s, i) =>
        `<span class="inline-flex items-center gap-1.5 mr-4"><span class="w-2.5 h-2.5 inline-block" style="background:${s.color}"></span><span class="font-mono text-[10px] text-charcoal">${s.name}</span></span>`
    )
    .join("");

  container.innerHTML = `
    <div class="flex flex-wrap mb-2">${legend}</div>
    <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto" role="img" aria-label="Grafik tren">
      <line x1="0" y1="${height - paddingBottom}" x2="${width}" y2="${height - paddingBottom}" stroke="#e5e0d8" stroke-width="1" />
      ${lines}
      ${labels}
    </svg>
  `;
}
