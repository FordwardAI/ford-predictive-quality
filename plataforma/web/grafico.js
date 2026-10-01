// Gráfico de líneas acumuladas en SVG, sin dependencias (§9.3): serie principal en Skyview, la segunda en Ford Blue,
// el azar en Off-Black discontinuo y rótulos directos al final de cada línea (no depende solo del color).
const W = 960, H = 400, M = { izq: 56, der: 216, arr: 24, aba: 48 };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function marcas(max) {
  const paso = [1, 2, 5, 10, 20, 25, 50, 100].find((p) => max / p <= 6) || 200;
  const salida = [];
  for (let v = 0; v <= max; v += paso) salida.push(v);
  return salida;
}

// series: [{nombre, valores:[...], estilo:'principal'|'segunda'|'tercera'|'azar'}]; hasta: índice visible (incl.).
export function lineas({ dias, series, hasta = dias.length - 1, titulo, ejeY }) {
  const max = Math.max(1, ...series.flatMap((s) => s.valores)) * 1.08;
  const x = (i) => M.izq + (i / Math.max(1, dias.length - 1)) * (W - M.izq - M.der);
  const y = (v) => H - M.aba - (v / max) * (H - M.arr - M.aba);
  const estilos = {
    principal: 'stroke="var(--chart-main)" stroke-width="4"',
    segunda: 'stroke="var(--chart-second)" stroke-width="3"',
    tercera: 'stroke="var(--chart-second)" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"',
    azar: 'stroke="var(--chart-ref)" stroke-width="2" stroke-dasharray="8 6"',
  };
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(titulo)}">`;
  for (const v of marcas(max)) {
    svg += `<line x1="${M.izq}" x2="${W - M.der}" y1="${y(v)}" y2="${y(v)}" stroke="var(--ford-light-gray)" stroke-width="1"/>`;
    svg += `<text x="${M.izq - 8}" y="${y(v) + 5}" text-anchor="end">${v}</text>`;
  }
  dias.forEach((d, i) => {
    if (i === 0 || i === dias.length - 1 || d % 5 === 0) svg += `<text x="${x(i)}" y="${H - 16}" text-anchor="middle">${d}</text>`;
  });
  svg += `<text x="${M.izq}" y="16">${esc(ejeY)}</text>`;
  const fin = Math.min(hasta, dias.length - 1);
  const rotulos = [];
  for (const s of series) {
    const pts = s.valores.slice(0, fin + 1).map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    svg += `<polyline fill="none" stroke-linejoin="round" ${estilos[s.estilo]} points="${pts}"/>`;
    rotulos.push({ y: y(s.valores[fin]), x: x(fin), texto: `${s.nombre}: ${s.valores[fin].toLocaleString('es-AR', { maximumFractionDigits: 1 })}`, estilo: s.estilo });
  }
  // Rótulos directos, separados para que no se pisen.
  rotulos.sort((a, b) => a.y - b.y);
  for (let i = 1; i < rotulos.length; i++) rotulos[i].y = Math.max(rotulos[i].y, rotulos[i - 1].y + 22);
  for (const r of rotulos) {
    const peso = r.estilo === 'principal' ? ' font-weight="500"' : '';
    svg += `<text x="${r.x + 12}" y="${r.y + 5}"${peso}>${esc(r.texto)}</text>`;
  }
  return svg + '</svg>';
}
