"""PROTOTIPO descartable para #11: tres variantes de la salida para Calidad, conmutables con ?variant=A|B|C.

Genera un único HTML local con agregados reales del CSV. El HTML no se versiona ni se publica:
contiene tasas por código de catálogo. No incluye VIN reales ni el resultado de los elegidos.
El puntaje es ilustrativo (tasa reciente del código, suavizada); no es la alternativa que elija #10.
"""
import argparse
import collections
import html
import json
import math
from pathlib import Path
import random
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "research"))
from audit_dataset import MISSING, day, fingerprint  # noqa: E402
from validation_partitions import CUTOFF, records, vin_days  # noqa: E402

VALIDATION = (155, 194)  # Only the validation span; the final test (>=200) is not touched (#7).
MARGIN = 5  # Día ≤ t−5: result known 5 days after the Día del VIN (#6, #7).
WINDOW = 60  # Illustrative window, taken from the exploratory experiments; not chosen here.
PRIOR = 20  # Illustrative smoothing weight toward the window's overall rate.
MIN_N_LOW = 50  # Minimum VIN per code to list it among codes that are rarely calibrated.
SEED = 11


def wilson(k, n, z=1.96):
    if n == 0:
        return None, None
    p = k / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return max(0.0, centre - half), min(1.0, centre + half)


def build(path, target_day):
    rows = list(records(path))
    days = vin_days(rows)
    info = {}
    for r in rows:
        vin = info.setdefault(r["VIN"], {"code": r["Código de Catálogo"], "events": 0, "repairs": 0,
                                         "component": r["Componente Auditoría Adicional"].strip()})
        vin["events"] += 1
        vin["repairs"] += r["Fecha Reparación"].strip() not in MISSING and day(r["Fecha Reparación"]) is not None
    main = {v: (first, last, label) for v, (first, last, label) in days.items() if first is not None and first <= CUTOFF}

    lo, hi = target_day - MARGIN - WINDOW, target_day - MARGIN
    window = [v for v, (_, d, _) in main.items() if lo <= d <= hi]
    by_code = collections.defaultdict(lambda: [0, 0])
    components = collections.defaultdict(collections.Counter)
    for v in window:
        stats = by_code[info[v]["code"]]
        stats[0] += 1
        if main[v][2] == "CALIBRADA":
            stats[1] += 1
            components[info[v]["code"]][info[v]["component"] or "(sin dato)"] += 1
    n_window = len(window)
    cal_window = sum(main[v][2] == "CALIBRADA" for v in window)
    base = cal_window / n_window

    def code_view(code):
        n, k = by_code.get(code, (0, 0))
        low, high = wilson(k, n)
        score = (k + PRIOR * base) / (n + PRIOR)
        return {"code": code, "n": n, "cal": k, "rate": k / n if n else None, "low": low, "high": high,
                "score": score, "times": score / base,
                "components": [{"name": c, "count": m, "share": m / k}
                               for c, m in components[code].most_common(3)] if k else []}

    candidates = [v for v, (_, d, _) in main.items() if d == target_day]
    k_cupo = max(1, int(0.05 * len(candidates)))
    rng = random.Random(SEED)
    tiebreak = {v: rng.random() for v in sorted(candidates)}
    ranked = sorted(candidates, key=lambda v: (-code_view(info[v]["code"])["score"], tiebreak[v]))

    units = []
    for position, v in enumerate(ranked, 1):
        first, last, _ = main[v]
        units.append({"id": f"U-{position:03d}", "position": position, "in_cupo": position <= k_cupo,
                      "code": info[v]["code"], "events": info[v]["events"], "repairs": info[v]["repairs"],
                      "span": last - first})

    codes_today = sorted({u["code"] for u in units})
    ranking, cumulative = [], 0
    for code in sorted(codes_today, key=lambda c: -code_view(c)["score"]):
        today = sum(u["code"] == code for u in units)
        cumulative += today
        ranking.append({"code": code, "today": today, "cumulative": cumulative, "cum_share": cumulative / len(units)})
    low_codes = sorted((code_view(c) for c, (n, _) in by_code.items() if n >= MIN_N_LOW), key=lambda c: c["rate"])[:5]
    return {
        "source": {"name": path.name, "sha256": fingerprint(path)},
        "day": target_day, "window": [lo, hi], "window_n": n_window, "window_cal": cal_window, "base": base,
        "candidates": len(candidates), "k": k_cupo, "prior": PRIOR, "seed": SEED, "min_n_low": MIN_N_LOW,
        "units": units[:k_cupo + 8],
        "codes": {c: code_view(c) for c in codes_today}, "ranking": ranking,
        "low_codes": low_codes,
    }


PAGE = """<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prototipo salida Calidad</title>
<style>
:root{--bg:#f6f7f9;--panel:#fff;--ink:#1c2230;--muted:#5b6475;--line:#dde1e8;--accent:#1f5fbf;--accent-soft:#e3ecfa;
--warn:#8a5a00;--warn-soft:#fff3d6;--ok:#1d7a4a;--ok-soft:#e1f4ea;--bad:#a3322a;--bad-soft:#fbe6e4}
@media (prefers-color-scheme:dark){:root{--bg:#12151c;--panel:#1b2029;--ink:#e6e9ef;--muted:#9aa3b5;--line:#2c3340;
--accent:#7aa7ff;--accent-soft:#1f2c47;--warn:#f0c46a;--warn-soft:#3a2f14;--ok:#6fd39d;--ok-soft:#173326;--bad:#ff8f86;--bad-soft:#3b1d1b}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,-apple-system,Segoe UI,sans-serif}
.proto{background:var(--warn-soft);color:var(--warn);padding:8px 16px;font-size:13px;border-bottom:1px solid var(--line)}
main{max-width:1100px;margin:0 auto;padding:20px 16px 96px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:24px 0 8px}
.muted{color:var(--muted)}.small{font-size:13px}.panel{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px}
table{width:100%;border-collapse:collapse;background:var(--panel)}th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{font-size:12px;text-transform:uppercase;letter-spacing:.03em;color:var(--muted)}.num{text-align:right;font-variant-numeric:tabular-nums}
.tag{display:inline-block;padding:1px 7px;border-radius:99px;font-size:12px;background:var(--accent-soft);color:var(--accent)}
.tag.ctx{background:var(--line);color:var(--muted)}.btn{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:6px;padding:4px 10px;cursor:pointer;font:inherit;font-size:13px}
.btn.yes{border-color:var(--ok);color:var(--ok)}.btn.no{border-color:var(--bad);color:var(--bad)}
tr.confirmed td{background:var(--ok-soft)}tr.discarded td{background:var(--bad-soft);text-decoration:line-through;color:var(--muted)}
.evidence{border-left:4px solid var(--accent);background:var(--accent-soft);padding:12px 14px;border-radius:6px}
.bar{position:relative;height:18px;background:var(--line);border-radius:4px}.bar .rng{position:absolute;top:6px;height:6px;background:var(--accent);opacity:.35;border-radius:3px}
.bar .pt{position:absolute;top:2px;width:3px;height:14px;background:var(--accent)}.bar .base{position:absolute;top:0;width:2px;height:18px;background:var(--ink);opacity:.6}
.grid{display:grid;grid-template-columns:260px 1fr;gap:16px}.list button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:none;color:var(--ink);padding:9px 10px;cursor:pointer;font:inherit}
.list button.sel{background:var(--accent-soft)}.big{font-size:34px;font-weight:650}.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
.kv div{border:1px solid var(--line);border-radius:8px;padding:10px}ul{padding-left:18px}.wrap{overflow-x:auto}
@media (max-width:720px){.grid{grid-template-columns:1fr}.hide-sm{display:none}}
@media print{.switcher,.proto{display:none}body{background:#fff}}
.switcher{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;background:#111;color:#fff;
padding:8px 12px;border-radius:99px;box-shadow:0 6px 24px rgba(0,0,0,.35);font-size:14px;z-index:9}
.switcher button{background:#333;color:#fff;border:0;border-radius:99px;width:30px;height:30px;cursor:pointer;font-size:16px}
</style></head><body>
<div class="proto">PROTOTIPO descartable (#11) · base ficticia · tramo de validación, Día del VIN __DAY__ · puntaje ilustrativo, no es la alternativa elegida · unidades con seudónimo</div>
<main id="app"></main>
<div class="switcher"><button id="prev" aria-label="Variante anterior">←</button><span id="label"></span><button id="next" aria-label="Variante siguiente">→</button></div>
<script>
const D = __DATA__;
const pct = x => x == null ? "—" : (100 * x).toFixed(1).replace(".", ",") + " %";
const per100 = x => (100 * x).toFixed(1).replace(".", ",");
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const cupo = D.units.filter(u => u.in_cupo), reserve = D.units.filter(u => !u.in_cupo);
const C = code => D.codes[code];
const windowTxt = `días ${D.window[0]}–${D.window[1]}`;
const reason = u => { const c = C(u.code);
  return `Código ${esc(u.code)}: se calibró en ${pct(c.rate)} de ${c.n} VIN auditados (${windowTxt}), ${c.times.toFixed(2).replace(".", ",")} veces la tasa general de ${pct(D.base)}.`; };
const rangeTxt = c => c.n ? `rango 95 %: ${pct(c.low)} – ${pct(c.high)} (n = ${c.n})` : "sin historial: usa la tasa general";
const evidence = `<div class="evidence"><b>Evaluación (pendiente de la prueba final):</b> sobre la base ficticia, en la prueba temporal, de cada 100 elegidos se calibrarían <b>X</b>, contra <b>Y</b> al azar (rango del 95 %: <b>[a; b]</b>): <b>mejora / inconcluso / peor</b>.
<div class="small muted" style="margin-top:6px">Hoy, al azar, en esta ventana se calibran ~${per100(D.base)} de cada 100 auditados.</div></div>`;
const limits = `<ul class="small">
<li>El tramo de prueba ya se había explorado; la cifra puede ser optimista.</li>
<li>Que los auditados se eligieron al azar es un supuesto de Ford.</li>
<li>En planta solo se conocería el resultado de las unidades que se eligen auditar.</li>
<li>El Día del VIN aproxima el día de auditoría; no es una fecha de calendario.</li>
<li>No indica impacto ni ahorro en planta, menos calibraciones, validez para no auditados ni causas.</li></ul>`;
const summary = `${D.candidates} unidades disponibles · cupo del 5 %: <b>${D.k}</b>`;

function variantA() {
  const state = {};
  const render = () => {
    const done = Object.values(state).filter(s => s === "yes").length;
    const dropped = Object.values(state).filter(s => s === "no").length;
    const nextUp = reserve.slice(0, dropped);
    document.getElementById("app").innerHTML = `
<h1>Recomendación de auditoría · Día ${D.day}</h1><p class="muted">${summary} · confirmadas <b>${done}</b> de ${D.k}</p>
<div class="wrap"><table><thead><tr><th>#</th><th>Unidad</th><th>Código</th><th>Motivo</th><th class="hide-sm">Confianza</th><th>Acción</th></tr></thead><tbody>
${cupo.map(u => `<tr class="${state[u.id] === "yes" ? "confirmed" : state[u.id] === "no" ? "discarded" : ""}"><td class="num">${u.position}</td><td><b>${u.id}</b></td><td>${esc(u.code)}</td>
<td class="small">${reason(u)}</td><td class="small hide-sm">${rangeTxt(C(u.code))}</td>
<td><button class="btn yes" data-id="${u.id}" data-v="yes">Confirmar</button> <button class="btn no" data-id="${u.id}" data-v="no">Descartar</button></td></tr>`).join("")}
${nextUp.map(u => `<tr><td class="num">${u.position}</td><td><b>${u.id}</b> <span class="tag">reemplazo</span></td><td>${esc(u.code)}</td><td class="small">${reason(u)}</td><td class="small hide-sm">${rangeTxt(C(u.code))}</td><td class="small muted">entra por un descarte</td></tr>`).join("")}
</tbody></table></div>
<details style="margin-top:16px"><summary>Qué significa y qué no</summary><p class="small">El orden sale de la tasa reciente de calibración del código de catálogo. No es la probabilidad de que esta unidad se calibre. El historial de eventos no se usa.</p>${evidence}${limits}</details>`;
    document.querySelectorAll("button[data-id]").forEach(b => b.onclick = () => { state[b.dataset.id] = state[b.dataset.id] === b.dataset.v ? undefined : b.dataset.v; render(); });
  };
  render();
}

function bar(c) {
  const max = Math.max(0.35, ...Object.values(D.codes).map(x => x.high || 0));
  const x = v => (100 * v / max).toFixed(1) + "%";
  return `<div class="bar">${c.n ? `<div class="rng" style="left:${x(c.low)};width:calc(${x(c.high)} - ${x(c.low)})"></div><div class="pt" style="left:${x(c.rate)}"></div>` : ""}<div class="base" style="left:${x(D.base)}"></div></div>`;
}

function variantB() {
  const groups = {};
  cupo.forEach(u => (groups[u.code] = groups[u.code] || []).push(u));
  const codes = Object.keys(groups).sort((a, b) => C(b).score - C(a).score);
  document.getElementById("app").innerHTML = `
<h1>Reporte de priorización · Día ${D.day}</h1><p class="muted">${summary} · fuente ${esc(D.source.name)} (SHA-256 ${D.source.sha256.slice(0, 8)}…) · ventana ${windowTxt}</p>
${evidence}
<h2>Unidades recomendadas, agrupadas por código</h2>
<div class="wrap"><table><thead><tr><th>Código</th><th>Unidades</th><th class="num">Tasa reciente</th><th style="width:35%">Rango 95 % <span class="muted">(línea: tasa general)</span></th></tr></thead><tbody>
${codes.map(code => { const c = C(code); return `<tr><td><b>${esc(code)}</b></td><td>${groups[code].map(u => u.id).join(", ")}</td><td class="num">${pct(c.rate)}<div class="small muted">n = ${c.n}</div></td><td>${bar(c)}</td></tr>`; }).join("")}
</tbody></table></div>
<h2>Códigos que casi no se calibran</h2>
<p class="small muted">Asociación en la ventana reciente, con al menos ${D.min_n_low} VIN por código. No indica causa ni buenas prácticas por sí sola.</p>
<div class="wrap"><table><thead><tr><th>Código</th><th class="num">VIN</th><th class="num">CALIBRADA</th><th class="num">Tasa</th><th class="num">Rango 95 %</th></tr></thead><tbody>
${D.low_codes.map(c => `<tr><td>${esc(c.code)}</td><td class="num">${c.n}</td><td class="num">${c.cal}</td><td class="num">${pct(c.rate)}</td><td class="num">${pct(c.low)} – ${pct(c.high)}</td></tr>`).join("")}
</tbody></table></div>
<h2>Cómo leerlo</h2><p class="small">El orden sale de la tasa reciente de calibración del código de catálogo, suavizada hacia la tasa general (peso ${D.prior}). No es una probabilidad por unidad. Calidad confirma la selección.</p>${limits}`;
}

function variantC() {
  let sel = cupo[0].id;
  const render = () => {
    const u = D.units.find(x => x.id === sel), c = C(u.code);
    document.getElementById("app").innerHTML = `
<h1>Ficha de unidad</h1><p class="muted">Día ${D.day} · ${summary}</p>
<div class="grid"><div class="panel list" style="padding:0">${cupo.map(x => `<button class="${x.id === sel ? "sel" : ""}" data-id="${x.id}"><b>${x.id}</b> · ${esc(x.code)}<div class="small muted">puesto ${x.position} de ${D.candidates}</div></button>`).join("")}</div>
<div class="panel">
<div class="kv"><div><div class="small muted">Posición</div><div class="big">${u.position}<span class="small muted"> / ${D.k} del cupo</span></div></div>
<div><div class="small muted">Tasa reciente del código</div><div class="big">${pct(c.rate)}</div><div class="small muted">${rangeTxt(c)}</div></div>
<div><div class="small muted">Frente a la tasa general</div><div class="big">${c.times.toFixed(2).replace(".", ",")}×</div><div class="small muted">general: ${pct(D.base)}</div></div></div>
<h2>Por qué está priorizada</h2><p>${reason(u)}</p><p class="small muted">Es la tasa de su versión y mercado, no una probabilidad calibrada de esta unidad.</p>
<h2>Historial <span class="tag ctx">contexto, no usado en el puntaje</span></h2>
<p>${u.events} eventos de inspección · ${u.repairs} con reparación · ${u.span} días entre el primer y el último evento.</p>
<h2>Componentes calibrados en este código <span class="tag ctx">descriptivo, no predicción</span></h2>
${c.components.length ? `<ul>${c.components.map(x => `<li>${esc(x.name)}: ${x.count} de ${c.cal} calibradas (${pct(x.share)})</li>`).join("")}</ul>` : `<p class="muted">Sin calibraciones del código en la ventana.</p>`}
<h2>Acción esperada</h2><p>Derivar a Auditoría Adicional si Calidad lo confirma. Si se descarta, entra la unidad siguiente del ranking (${reserve[0] ? reserve[0].id : "—"}).</p>
<details><summary>Límites</summary>${evidence}${limits}</details></div></div>`;
    document.querySelectorAll(".list button").forEach(b => b.onclick = () => { sel = b.dataset.id; render(); });
  };
  render();
}

function variantD() {
  const k5 = D.k;
  let marked = false;
  const rows = D.ranking.map((r, i) => {
    const c = C(r.code);
    const crosses = !marked && r.cumulative >= k5;
    if (crosses) marked = true;
    const line = crosses ? `<tr><td colspan="6" class="small" style="border-bottom:2px solid var(--accent);color:var(--accent)">▲ Capacidad actual: ${k5} vehículos (5 % de ${D.candidates}): único tramo con cifra evaluada. Más abajo, sin cifra evaluada.</td></tr>` : "";
    return `<tr><td class="num">${i + 1}</td><td><b>${esc(r.code)}</b></td><td class="num">${r.today}</td><td class="num">${r.cumulative} <span class="small muted">(${pct(r.cum_share)})</span></td>
<td class="num">${pct(c.rate)}<div class="small muted">n = ${c.n}</div></td><td style="width:30%">${bar(c)}<div class="small muted">${c.n ? pct(c.low) + " – " + pct(c.high) : "sin historial: tasa general"}</div></td></tr>${line}`;
  }).join("");
  document.getElementById("app").innerHTML = `
<h1>Hoja diaria de códigos prioritarios · Día ${D.day}</h1>
<p class="muted">Para el responsable de la selección en Gate Release · ${D.candidates} vehículos programados · fuente ${esc(D.source.name)} (SHA-256 ${D.source.sha256.slice(0, 8)}…) · ventana ${windowTxt}</p>
${evidence}
<h2>Cómo se usa</h2>
<ol class="small"><li>Antes del turno, fijar la capacidad del día y ver en el acumulado hasta qué código alcanza.</li><li>En Gate Release, derivar a Auditoría Adicional todo vehículo de esos códigos mientras quede capacidad.</li><li>Si al final del día no se llenó, completar al azar, como hoy.</li></ol>
<p class="small muted">Dentro de un código los vehículos son equivalentes. La tasa es la de su versión y mercado en la ventana, no una probabilidad del vehículo. Supuesto del equipo, a confirmar con planta.</p>
<h2>Códigos priorizados</h2>
<div class="wrap"><table><thead><tr><th>#</th><th>Código</th><th class="num">Programados hoy</th><th class="num">Acumulado</th><th class="num">Tasa reciente</th><th>Rango 95 % <span class="muted">(línea: tasa general ${pct(D.base)})</span></th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>Códigos que casi no se calibran</h2>
<p class="small muted">Asociación en la ventana reciente, con al menos ${D.min_n_low} VIN por código. No es causa. Se presenta como hallazgo solo si se sostiene en la prueba final.</p>
<div class="wrap"><table><thead><tr><th>Código</th><th class="num">VIN</th><th class="num">CALIBRADA</th><th class="num">Tasa</th><th class="num">Rango 95 %</th></tr></thead><tbody>
${D.low_codes.map(c => `<tr><td>${esc(c.code)}</td><td class="num">${c.n}</td><td class="num">${c.cal}</td><td class="num">${pct(c.rate)}</td><td class="num">${pct(c.low)} – ${pct(c.high)}</td></tr>`).join("")}
</tbody></table></div>
<h2>Límites</h2>${limits}
<p class="small muted">Prototipo: «programados hoy» usa los auditados de la base con ese Día del VIN; en planta saldría del programa de producción.</p>`;
}

const VARIANTS = {A: ["Lista del turno", variantA], B: ["Reporte imprimible", variantB], C: ["Ficha por unidad", variantC], D: ["Acordada", variantD]};
const keys = Object.keys(VARIANTS);
function show(key) {
  const params = new URLSearchParams(location.search); params.set("variant", key);
  history.replaceState(null, "", "?" + params);
  document.getElementById("label").textContent = `${key} (${VARIANTS[key][0]})`;
  VARIANTS[key][1](); window.scrollTo(0, 0);
}
const current = () => { const v = new URLSearchParams(location.search).get("variant"); return keys.includes(v) ? v : "A"; };
const step = d => show(keys[(keys.indexOf(current()) + d + keys.length) % keys.length]);
document.getElementById("prev").onclick = () => step(-1);
document.getElementById("next").onclick = () => step(1);
document.addEventListener("keydown", e => { if (e.target.closest("input,textarea,[contenteditable]")) return;
  if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); });
show(current());
</script></body></html>
"""


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--dia", type=int, default=190, help="Día del VIN dentro de la validación (155–194)")
    parser.add_argument("--out", type=Path, required=True, help="HTML de salida, fuera del repositorio")
    args = parser.parse_args()
    assert VALIDATION[0] <= args.dia <= VALIDATION[1], "Usar un día de la validación; la prueba final no se toca"
    repo = Path(__file__).resolve().parents[2]
    assert repo not in args.out.resolve().parents, "El HTML contiene agregados reales: generarlo fuera del repo"
    data = build(args.source, args.dia)
    page = PAGE.replace("__DAY__", html.escape(str(args.dia))).replace("__DATA__", json.dumps(data, ensure_ascii=False))
    args.out.write_text(page, encoding="utf-8")
    print(json.dumps({"out": str(args.out), "sha256": data["source"]["sha256"], "day": args.dia,
                      "candidates": data["candidates"], "k": data["k"], "window": data["window"],
                      "window_n": data["window_n"], "base_pct": round(100 * data["base"], 2)}, ensure_ascii=False))
