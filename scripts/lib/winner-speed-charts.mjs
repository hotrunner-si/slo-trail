import assert from 'node:assert/strict'

// Historical route families keep each edition's own nominal distance.
export function winnerSpeedCharts(routes, results) {
  const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
  const nf = n => new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 1 }).format(n)
  const years = [2021, 2022, 2023, 2024, 2025]
  function matches(route, result) {
    if (route.raceSlug !== result.event) return false
    const families = {
      'obala-trail-11km': [11, 12], 'obala-trail-17km': [17, 18],
      'obala-trail-35km': [33, 35], 'obala-ultra-trail-64km': [63, 64, 65],
      'obala-ultra-trail-108km': [87, 100, 108],
      'go-trim': [10], 'go-3v': [28], 'go-ultra': [64],
      duma: [9.9, 10], velikobukovska: [18, 18.2], republikanka: [30],
    }
    return families[route.id]?.includes(result.km)
  }
  const seen = new Set()
  const cards = routes.map((route, index) => {
    const rows = results.filter(row => matches(route, row))
    rows.forEach(row => {
      const key = `${row.event}:${row.year}:${row.route}:${row.gender}`
      assert.ok(!seen.has(key), 'A historical result must belong to one chart')
      seen.add(key)
    })
    const distances = [...new Set(rows.map(row => row.km))].sort((a,b) => a-b)
    const note = route.id === 'go-trim'
      ? 'Pretekla trasa: 10 km; letos 13,13 km.'
      : distances.length > 1 ? `Pretekle razdalje: ${distances.map(nf).join(' / ')} km.`
        : `Izračun po pretekli razdalji ${distances.map(nf).join(' / ')} km.`
    const y = speed => 136 - speed / 20 * 116
    const grid = [0, 5, 10, 15, 20].map(speed => `<line x1="30" y1="${y(speed)}" x2="286" y2="${y(speed)}" stroke="#e2e7df"/><text x="24" y="${y(speed)+3}" text-anchor="end">${speed}</text>`).join('')
    const bars = years.map((year, i) => {
      const center = 56 + i * 51
      return ['M','F'].map((gender, j) => {
        const row = rows.find(row => row.year === year && row.gender === gender)
        const x = center - 16 + j*17
        if (!row?.seconds) return `<text x="${x+7}" y="130" text-anchor="middle" fill="#9ba396"><title>${year}: ${gender==='M'?'moški':'ženske'} – čas ni potrjen</title>–</text>`
        const speed = row.km / (row.seconds/3600)
        assert.ok(speed > 0 && speed <= 20, 'Chart speed must fit the shared axis')
        const tooltip = `${year} · ${row.name} · ${row.time} · ${nf(row.km)} km · ${nf(speed)} km/h`
        return `<rect x="${x}" y="${y(speed).toFixed(2)}" width="14" height="${(136-y(speed)).toFixed(2)}" rx="2" fill="${gender==='M'?'#3b82f6':'#ec4899'}"><title>${esc(tooltip)}</title></rect><text x="${x+7}" y="${(y(speed)-4).toFixed(2)}" text-anchor="middle" class="speed-value">${nf(speed)}</text>`
      }).join('')+`<text x="${center}" y="154" text-anchor="middle">${year}</text>`
    }).join('')
    return `<figure class="winner-speed-card"><h3>${esc(route.raceName)} · ${esc(route.label)}</h3><p class="winner-speed-distance">${esc(note)}</p><svg viewBox="0 0 300 166" role="img" aria-labelledby="speed-title-${index} speed-desc-${index}"><title id="speed-title-${index}">${esc(route.raceName+' '+route.label)}: hitrost zmagovalcev 2021–2025</title><desc id="speed-desc-${index}">${esc(rows.filter(r=>r.seconds).map(r=>`${r.year}, ${r.gender==='M'?'moški':'ženske'}: ${nf(r.speedKmh)} km/h`).join('; '))}</desc><g font-family="Arial,sans-serif" font-size="9" fill="#52654c"><text x="30" y="11">km/h</text>${grid}${bars}</g></svg></figure>`
  })
  assert.equal(seen.size, results.length, 'Every historical result must be mapped to a chart')
  return `<section class="winner-speeds" aria-label="Hitrosti zmagovalcev po trasah"><div class="winner-speed-legend"><span><i style="background:#3b82f6"></i>Moški</span><span><i style="background:#ec4899"></i>Ženske</span></div><p class="winner-speed-note">Naslednji prikazi prikazujejo spreminjanje hitrosti zmagovalcev na posameznih trasah.</p><div class="winner-speed-grid">${cards.join('')}</div></section>`
}

export const winnerSpeedCss = `
.winner-speed-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.winner-speed-card{margin:0;height:252px;min-width:0;padding:12px;border:1px solid #d7dfce;border-radius:10px;background:#fbfcf8;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden}
.winner-speed-card h3{font:600 14px/1.3 Arial,sans-serif;margin:0 0 5px;min-height:36px}
.winner-speeds .winner-speed-card .winner-speed-distance{font:11px/1.35 Arial,sans-serif;margin:0 0 7px;color:#718168;min-height:30px}
.winner-speed-card svg{display:block;width:100%;min-height:0;flex:1}
.winner-speed-card .speed-value{font-size:8px}
.winner-speed-legend{display:flex;gap:20px;font:12px Arial,sans-serif;margin:20px 0 8px}
.winner-speed-legend span{display:flex;align-items:center;gap:7px}
.winner-speed-legend i{display:inline-block;width:10px;height:10px;border-radius:2px}
.winner-speeds p.winner-speed-note{font:12px/1.5 Arial,sans-serif;color:#63735b;margin:8px 0 20px}
@media(max-width:1099px){.winner-speed-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:799px){.winner-speed-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:419px){.winner-speed-grid{grid-template-columns:minmax(0,1fr)}}
`
