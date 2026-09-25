import julian from '~/data/gpx/nejc-ursic/julian-alps-trail-run.json'
import dolomiti from '~/data/gpx/nejc-ursic/dolomiti-di-sesto.json'
import verbier from '~/data/gpx/nejc-ursic/verbier-trail.json'

export const runnerGpxRoutes = {
  'nejc-ursic': [
    { id: 'julian-alps-trail-run', title: 'Julian Alps Trail Run 2021', date: '25. 9. 2021', dateIso: '2021-09-25', location: 'Planina pod Golico', description: 'Moja prva trail tekma.', distanceKm: 33.2, elevationGain: 1650, preview: julian },
    { id: 'dolomiti-di-sesto', title: 'Dolomiti di Sesto', date: '9. 7. 2022', dateIso: '2022-07-09', location: 'Dolomiti', description: 'Prvič v Dolomitih. Lepa tura na Monte Paterno, okrog Treh Cim in po ferati Via degli Alpini nazaj v Val Fiscalino.', distanceKm: 33.7, elevationGain: 2640, preview: dolomiti },
    { id: 'verbier-trail', title: 'Trail Verbier St-Bernard', date: '12. 7. 2025', dateIso: '2025-07-12', location: 'Verbier', description: 'Moj prvi ultra trail, ki sem ga povezal z izletom v prelepo Švico.', distanceKm: 76, elevationGain: 5040, preview: verbier }
  ]
}
