import { useState } from 'react'
import { Styled, Box, Text, Grid, Slider, Divider } from 'theme-ui'
import { Model } from '../../lib/margo-js'
import Chart from '../chart'
import DoubleChart from '../double-chart'
import Variable from '../variable'
import Temperature from './temperature'

const m = Model()

function Core() {
  const [B, setB] = useState(1.13)
  const [r, setr] = useState(0.015)
  const [td, settd] = useState(2100)

  m.physics = { B: B }

  m.baseline = {
    form: 'capped',
    f0: 5.54,
    r: r,
    m: 0.03,
    td: td,
  }

  return (
    <Box>
      <Text sx={{ fontSize: [3] }}>
        Here we highlight key parameters that control these relationships, such
        as <Styled.inlineCode>r</Styled.inlineCode>=
        <Variable v={r.toFixed(3)} /> and{' '}
        <Styled.inlineCode>td</Styled.inlineCode>=
        <Variable v={td.toFixed(0)} /> which parameterize a capped emissions
        ramp with minimal mitigation, and the feedback parameter
        <Styled.inlineCode>B</Styled.inlineCode>=
        <Variable v={B.toFixed(2)} />, which determines the equilibrium climate
        sensitivity <Styled.inlineCode>ECS</Styled.inlineCode>=
        <Variable v={m.ecs().toFixed(2)} />. Notice how{' '}
        <Styled.inlineCode>B</Styled.inlineCode>
        only affects the temperature and not the other model components.
      </Text>
      <Grid gap={[5]} columns={['500px 1fr']} sx={{ mt: [4] }}>
        <Box>
          <Divider />
          <Chart
            x={m.t()}
            y={m.emissions({ units: 'CO2e' })}
            scales={{
              x: [2020, 2200],
              y: [-1, 190],
              padding: 17,
              title: 'EMISSIONS (Gt CO2e)',
            }}
            color={'blue'}
            height={100}
          />
          <Chart
            x={m.t()}
            y={m.concentration()}
            scales={{
              x: [2020, 2200],
              y: [500, 1400],
              padding: 0,
              title: 'CONCENTRATION (ppm)',
            }}
            color={'blue'}
            height={100}
          />
          <Chart
            x={m.t()}
            y={m.temperature()}
            scales={{
              x: [2020, 2200],
              y: [-0.1, 5],
              padding: 28,
              title: 'TEMPERATURE ANAMOLY (ºC)',
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
              CAUSAL MODEL
            </Text>
            <Text
              sx={{
                fontFamily: 'monospace',
                letterSpacing: 'monospace',
                fontSize: [2],
                mt: [3],
              }}
            >
              r
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={r}
              onChange={(e) => setr(parseFloat(e.target.value))}
              min='0.009'
              max='0.015'
              step='0.0001'
            ></Slider>
            <Text
              sx={{
                fontFamily: 'monospace',
                letterSpacing: 'monospace',
                fontSize: [2],
                mt: [3],
              }}
            >
              td
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={td}
              onChange={(e) => settd(parseFloat(e.target.value))}
              min='2100'
              max='2150'
              step='0.1'
            ></Slider>
            <Text
              sx={{
                fontFamily: 'monospace',
                letterSpacing: 'monospace',
                fontSize: [2],
                mt: [3],
              }}
            >
              B
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={B}
              onChange={(e) => setB(parseFloat(e.target.value))}
              min='1.0'
              max='1.5'
              step='0.01'
            ></Slider>
          </Box>
          <Temperature model={m} />
        </Box>
      </Grid>
      <Divider sx={{ mb: [4] }} />
    </Box>
  )
}

export default Core
