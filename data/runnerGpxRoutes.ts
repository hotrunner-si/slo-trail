import julian from '~/data/gpx/nejc-ursic/julian-alps-trail-run.json'
import dolomiti from '~/data/gpx/nejc-ursic/dolomiti-di-sesto.json'
import verbier from '~/data/gpx/nejc-ursic/verbier-trail.json'
import klaraJatr from '~/data/gpx/klara-velepec/jatr-25km-2026.json'
import klaraSellaRonda from '~/data/gpx/klara-velepec/sella-ronda-skimo.json'
import klaraUtvv from '~/data/gpx/klara-velepec/utvv.json'
import klemenMonteRosa from '~/data/gpx/klemen-spanring/monte-rosa-skymarathon.json'
import klemenPohorskiKerlc from '~/data/gpx/klemen-spanring/pohorski-kerlc.json'
import klemenUtvv from '~/data/gpx/klemen-spanring/utvv.json'
import type { RunnerGpxRoute } from '~/types/gpx'

export const runnerGpxRoutes: Record<string, RunnerGpxRoute[]> = {
  'nejc-ursic': [
    {
      id: 'julian-alps-trail-run',
      title: 'Julian Alps Trail Run 2021',
      dateIso: '2021-09-25',
      location: 'Planina pod Golico',
      description: 'Moja prva trail tekma.',
      distanceKm: 33.2,
      elevationGain: 1650,
      preview: julian,
    },
    {
      id: 'dolomiti-di-sesto',
      title: 'Dolomiti di Sesto',
      dateIso: '2022-07-09',
      location: 'Dolomiti',
      description:
        'Prvič v Dolomitih. Lepa tura na Monte Paterno, okrog Treh Cim in po ferati Via degli Alpini nazaj v Val Fiscalino.',
      distanceKm: 33.7,
      elevationGain: 2640,
      preview: dolomiti,
    },
    {
      id: 'verbier-trail',
      title: 'Trail Verbier St-Bernard',
      dateIso: '2025-07-12',
      location: 'Verbier',
      description: 'Moj prvi ultra trail, ki sem ga povezal z izletom v prelepo Švico.',
      distanceKm: 76,
      elevationGain: 5040,
      preview: verbier,
    },
  ],
  'klemen-spanring': [
    {
      id: 'monte-rosa-skymarathon',
      title: 'Monte Rosa Skymarathon',
      dateIso: '2025-06-14',
      location: 'Monte Rosa',
      description: 'Gorska trasa Monte Rosa Skymarathon.',
      distanceKm: klemenMonteRosa.distanceKm,
      elevationGain: klemenMonteRosa.elevationGain,
      preview: klemenMonteRosa,
    },
    {
      id: 'pohorski-kerlc',
      title: 'Pohorski Kerlc',
      dateIso: '2026-04-05',
      location: 'Pohorje',
      description: 'Kratka strma trasa Pohorskega Kerlca.',
      distanceKm: klemenPohorskiKerlc.distanceKm,
      elevationGain: klemenPohorskiKerlc.elevationGain,
      preview: klemenPohorskiKerlc,
    },
    {
      id: 'utvv',
      title: 'Ultra Trail Vipava Valley',
      dateIso: '2026-04-25',
      location: 'Vipavska dolina',
      description: 'GPX sled teka po Vipavski dolini.',
      distanceKm: klemenUtvv.distanceKm,
      elevationGain: klemenUtvv.elevationGain,
      preview: klemenUtvv,
    },
  ],
  'klara-velepec': [
    {
      id: 'jatr-25km-2026',
      title: 'Julian Alps Trail Run 25 km',
      dateIso: '2026-09-21',
      location: 'Julijske Alpe',
      description: 'GPX sled trase Julian Alps Trail Run 2026.',
      distanceKm: klaraJatr.distanceKm,
      elevationGain: klaraJatr.elevationGain,
      preview: klaraJatr,
    },
    {
      id: 'sella-ronda-skimo',
      title: 'Sella Ronda Skimo',
      dateIso: '2026-03-20',
      location: 'Dolomiti',
      description: 'Turnosmučarska trasa Sella Ronda Skimo.',
      distanceKm: klaraSellaRonda.distanceKm,
      elevationGain: klaraSellaRonda.elevationGain,
      preview: klaraSellaRonda,
    },
    {
      id: 'utvv',
      title: 'Ultra Trail Vipava Valley',
      dateIso: '2026-04-25',
      location: 'Vipavska dolina',
      description: 'GPX sled teka po Vipavski dolini.',
      distanceKm: klaraUtvv.distanceKm,
      elevationGain: klaraUtvv.elevationGain,
      preview: klaraUtvv,
    },
  ],
}
