import { useState } from 'react'
import { Styled, Box, Text, Grid, Slider, Divider } from 'theme-ui'
import { Model } from '../../lib/margo-js'
import Chart from '../chart'
import MutliChart from '../multi-chart'
import Variable from '../variable'
import Temperature from './temperature'

const m = Model({
  baseline: {
    form: 'capped',
    f0: 5.54,
    r: 0.015,
    m: 0.03,
    td: 2100,
  },
})

const logistic = (t, r, rd) => {
  const t0 = Math.log(1 / 0.01 - 1) / r + rd

  if (t < rd) {
    return 0.005
  }
  if (t >= rd) {
    return (1 / (1 + Math.exp(-r * (t - t0))))
  }
}

function Controls() {
  const [mitigate, setMitigate] = useState(2200)
  const [remove, setRemove] = useState(2200)
  const [adapt, setAdapt] = useState(2200)
  const [geoeng, setGeoeng] = useState(2200)

  m.controls = {
    mitigate: (t) => logistic(t, 0.1, mitigate),
    remove: (t) => logistic(t, 0.1, remove),
    adapt: (t) => logistic(t, 0.1, adapt),
    geoeng: (t) => logistic(t, 0.1, geoeng)
  }

  return (
    <Box>
      <Grid gap={[5]} columns={['500px 1fr']} sx={{ mt: [4] }}>
        <Box>
          <Divider />
          <MutliChart
            x={m.t()}
            y={{
              mitigate: m.mitigate(),
              remove: m.remove(),
              adapt: m.adapt(),
              geoeng: m.geoeng()
            }}
            scales={{
              x: [2020, 2200],
              y: [0, 1],
              padding: 0,
              title: 'MITIGATE (%)',
            }}
            colors={{
              mitigate: 'green', 
              remove: 'yellow',
              adapt: 'red', 
              geoeng: 'orange'
            }}
            height={100}
          />
          <Chart
            x={m.t()}
            y={m.temperature()}
            scales={{
              x: [2020, 2200],
              y: [-0.1, 5],
              padding: 20,
              title: 'TEMPERATURE (ºC)',
            }}
            color={'blue'}
            height={100}
          />
        </Box>
        <Box>
          <Divider />
          <Box sx={{ my: [3] }}>
            <Text
              sx={{
                fontFamily: 'heading',
                letterSpacing: 'wide',
                fontSize: [3],
              }}
            >
              CONTROLS
            </Text>
            <Text
              sx={{
                fontFamily: 'monospace',
                letterSpacing: 'monospace',
                fontSize: [2],
                mt: [3],
              }}
            >
              mitigate
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={mitigate}
              onChange={(e) => setMitigate(parseFloat(e.target.value))}
              min='2020'
              max='2200'
              step='0.01'
            ></Slider>
            <Text
              sx={{
                fontFamily: 'monospace',
                letterSpacing: 'monospace',
                fontSize: [2],
                mt: [3],
              }}
            >
              remove
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={remove}
              onChange={(e) => setRemove(parseFloat(e.target.value))}
              min='2020'
              max='2200'
              step='0.01'
            ></Slider>
            <Text
              sx={{
                fontFamily: 'monospace',
                letterSpacing: 'monospace',
                fontSize: [2],
                mt: [3],
              }}
            >
              geoeng
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={geoeng}
              onChange={(e) => setGeoeng(parseFloat(e.target.value))}
              min='2020'
              max='2200'
              step='0.01'
            ></Slider>
            <Text
              sx={{
                fontFamily: 'monospace',
                letterSpacing: 'monospace',
                fontSize: [2],
                mt: [3],
              }}
            >
              adapt
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={adapt}
              onChange={(e) => setAdapt(parseFloat(e.target.value))}
              min='2020'
              max='2200'
              step='0.01'
            ></Slider>
            <Temperature model={m} />
          </Box>
        </Box>
      </Grid>
      <Divider sx={{ mb: [4] }} />
    </Box>
  )
}

export default Controls
