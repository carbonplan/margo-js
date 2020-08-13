import { useState } from 'react'
import { Styled, Box, Text, Grid, Slider, Divider } from 'theme-ui'
import { Model } from '../..'
import Chart from './chart'
import DoubleChart from './double-chart'
import Variable from './variable'

const opts = {
  time: {
    tmin: 2020,
    tmax: 2200,
    dt: 1,
  },
  baseline: {
    form: 'ramp',
    q0: 5,
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
    B: 1.13,
    Cd: 106,
    x: 0.73,
    T0: 1.1,
    A: 0,
  },
  economics: {},
  controls: null,
}

const m = Model(opts)

function Tutorial() {
  const [B, setB] = useState(1.13)
  const [q0, setq0] = useState(5)
  const [q0mult, setq0mult] = useState(3)
  const [t1, sett1] = useState(2100)
  const [mitigate, setMitigate] = useState(0.0)
  const [remove, setRemove] = useState(0.0)

  m.physics = { B: B }

  m.baseline = {
    form: 'ramp',
    q0: q0,
    q0mult: q0mult,
    t1: t1,
    t2: 2150,
  }

  m.controls = {
    mitigate: Array(m.n).fill(0).map((v,i) => (i / m.n) * mitigate),
    remove: Array(m.n).fill(0).map((v,i) => (i / m.n) * remove)
  }

  return (
    <Box>
      <Text sx={{ fontSize: [3] }}>
        We first show baseline emissions and concentrations as a function of
        parameters that control their values, such as{' '}
        <Styled.inlineCode>q0</Styled.inlineCode>=
        <Variable v={q0.toFixed(2)} /> and{' '}
        <Styled.inlineCode>q0mult</Styled.inlineCode>=
        <Variable v={q0mult.toFixed(2)} /> and{' '}
        <Styled.inlineCode>t1</Styled.inlineCode>=
        <Variable v={t1.toFixed(0)} />
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
              color: 'blue',
            }}
          />
          <Chart
            x={m.t()}
            y={m.concentration()}
            scales={{
              x: [2020, 2200],
              y: [500, 1400],
              title: 'CONCENTRATION (ppm)',
              color: 'blue',
            }}
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
              BASELINE
            </Text>
            <Text
              sx={{
                fontFamily: 'monospace',
                letterSpacing: 'monospace',
                fontSize: [2],
                mt: [3],
              }}
            >
              q0mult
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={q0mult}
              onChange={(e) => setq0mult(parseFloat(e.target.value))}
              min='1.0'
              max='5.0'
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
              q0
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={q0}
              onChange={(e) => setq0(parseFloat(e.target.value))}
              min='2'
              max='7'
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
              t1
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={t1}
              onChange={(e) => sett1(parseFloat(e.target.value))}
              min='2021'
              max='2150'
              step='1'
            ></Slider>
          </Box>
        </Box>
      </Grid>
      <Divider sx={{ mb: [4] }} />
      <Text sx={{ fontSize: [3] }}>
        Next we can look at radiative forcing and temperature. These
        depend on the setting of several physical parameters, such as{' '}
        <Styled.inlineCode>B</Styled.inlineCode>=
        <Variable v={B.toFixed(2)} />, which itself determines the equilibrium
        climate sensitivity <Styled.inlineCode>ECS</Styled.inlineCode>=
        <Variable v={m.ecs().toFixed(2)} />. (Note that this entire document is
        interactive, so changing parameters in either section will
        update all of the charts!)
      </Text>
      <Grid gap={[5]} columns={['500px 1fr']} sx={{ mt: [4] }}>
        <Box>
          <Divider />
          <Chart
            x={m.t()}
            y={m.forcing()}
            scales={{
              x: [2020, 2200],
              y: [0, 10],
              title: 'RADIATIVE FORCING (W/m^2)',
              color: 'blue',
            }}
          />
          <Chart
            x={m.t()}
            y={m.temperature()}
            scales={{
              x: [2020, 2200],
              y: [0, 5],
              padding: 7,
              title: 'TEMPERATURE (ºC)',
              color: 'blue',
            }}
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
              PHYSICS
            </Text>
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
        </Box>
      </Grid>
      <Divider sx={{ mb: [4] }}/>
      <Text sx={{ fontSize: [3] }}>
        We can also specify values for the controls.
        In this case, we specify simple ramp functions for 
        mitigation and removal, and look at the corresponding consequences
        on temperature.
      </Text>
      <Grid gap={[5]} columns={['500px 1fr']} sx={{ mt: [4] }}>
        <Box>
          <Divider />
          <DoubleChart
            x={m.t()}
            y={m.mitigate()}
            x2={m.t()}
            y2={m.remove()}
            scales={{
              x: [2020, 2200],
              y: [-0.1, 1],
              title: 'MITIGATION (% deployment)',
              color: 'yellow',
            }}
            scales2={{
              x: [2020, 2200],
              y: [-0.1, 1],
              title: 'REMOVAL (% deployment)',
              color: 'green',
            }}
          />
          <Chart
            x={m.t()}
            y={m.temperature()}
            scales={{
              x: [2020, 2200],
              y: [0, 5],
              padding: 7,
              title: 'TEMPERATURE (ºC)',
              color: 'blue',
            }}
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
              Mitigate
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={mitigate}
              onChange={(e) => setMitigate(parseFloat(e.target.value))}
              min='0.0'
              max='1.0'
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
              Remove
            </Text>
            <Slider
              sx={{ width: '200px' }}
              value={remove}
              onChange={(e) => setRemove(parseFloat(e.target.value))}
              min='0.0'
              max='1.0'
              step='0.01'
            ></Slider>
          </Box>
        </Box>
      </Grid>
      <Divider sx={{ mb: [4] }}/>
    </Box>
  )
}

export default Tutorial
