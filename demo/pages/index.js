import { useState } from 'react'
import { Box, Text, Slider } from 'theme-ui'
import { Model } from '../..'
import Chart from '../components/chart'

function Index() {
  const [B, setB] = useState(1.13)
  const [q0, setq0] = useState(5)

  const opts = {
    time: {
      tmin: 2020,
      tmax: 2200,
      dt: 1,
    },
    baseline: {
      form: 'ramp',
      q0: q0,
      q0mult: 3,
      t1: 2100,
      t2: 2150,
    },
    physics: {
      r: 0.5,
      c0: 460,
      a: 6.9 / 2 / Math.log(2),
      Finf: 8.5,
      F0: 3,
      B: B,
      Cd: 106,
      x: 0.73,
      T0: 1.1,
    },
    economics: {},
    controls: null,
  }

  const m = Model(opts)

  return (
    <Box sx={{ ml: [6], mt: [6], fontFamily: 'monospace' }}>
      <Text sx={{ fontSize: [6] }}>MARGO-JS demo</Text>
      <Box sx={{ my: [3] }}>
        <Text sx={{ fontSize: [3] }}>B</Text>
        <Slider
          sx={{ width: '200px' }}
          value={B}
          onChange={(e) => setB(parseFloat(e.target.value))}
          min='1.0'
          max='2.0'
          step='0.01'
        ></Slider>
      </Box>
      <Box sx={{ my: [3] }}>
        <Text sx={{ fontSize: [3] }}>q0</Text>
        <Slider
          sx={{ width: '200px' }}
          value={q0}
          onChange={(e) => setq0(parseFloat(e.target.value))}
          min='2'
          max='7'
          step='0.1'
        ></Slider>
      </Box>
      <Chart
        x={m.t()}
        y={m.emissions({ units: 'CO2e' })}
        scales={{ x: [2020, 2200], y: [-1, 190] }}
      />
      <Chart
        x={m.t()}
        y={m.concentration()}
        scales={{ x: [2020, 2200], y: [500, 1400] }}
      />
      <Chart
        x={m.t()}
        y={m.forcing()}
        scales={{ x: [2020, 2200], y: [0, 10] }}
      />
      <Chart
        x={m.t()}
        y={m.temperature()}
        scales={{ x: [2020, 2200], y: [1, 5] }}
      />
    </Box>
  )
}

export default Index
