import { useState, useEffect } from 'react'
import { Styled, Box, Text, Grid, Slider, Divider } from 'theme-ui'
import { Model, optimize } from '../../lib/margo-js'
import Chart from '../chart'
import MultiChart from '../multi-chart'
import Variable from '../variable'
import Temperature from './temperature'
import Control from '../control'

const m = Model({
  time: {
    dt: 20,
  },
})

function Optimization() {
  const [R, setR] = useState(1)
  const [M, setM] = useState(1)
  const [G, setG] = useState(0)
  const [Dt, setDt] = useState(20)
  const [res, setRes] = useState(m)
  const [status, setStatus] = useState('optimize')

  m.time = {
    dt: Dt,
  }

  const update = () => {
    const opts = {
      max: {
        mitigate: M,
        remove: R,
        geoeng: G,
        adapt: 0,
      },
      delay: {
        mitigate: 0,
        remove: 10,
        geoeng: 30,
        adapt: 0,
      },
    }
    const result = optimize(m, opts)
    if (result) {
      setRes(result)
    } else {
      setStatus('error try again')
      setTimeout(() => {
        setStatus('optimize')
      }, 500)
    }
  }

  return (
    <Box>
      <Grid gap={[5]} columns={['500px 1fr']} sx={{ mt: [4] }}>
        <Box>
          <Divider />
          <MultiChart
            x={res.t()}
            y={{
              mitigate: res.mitigate(),
              remove: res.remove(),
              geoeng: res.geoeng(),
            }}
            scales={{
              x: [2020, 2200],
              y: [0, 1.05],
              padding: 0,
              title: 'DEPLOYMENT (%)',
            }}
            colors={{
              mitigate: 'blue',
              remove: 'orange',
              geoeng: 'red',
            }}
            height={100}
          />
          <Chart
            x={res.t()}
            y={res.temperature()}
            scales={{
              x: [2020, 2200],
              y: [-0.1, 5],
              padding: 21,
              title: '∆TEMPERATURE (ºC)',
            }}
            color={'blue'}
            height={150}
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
              SETTINGS
            </Text>
            <Control
              name='dt'
              value={Dt}
              setValue={setDt}
              min={5}
              max={20}
              step={5}
            />
            <Text
              sx={{
                fontFamily: 'heading',
                letterSpacing: 'wide',
                fontSize: [3],
                mt: [4],
              }}
            >
              CONTROLS
            </Text>
            <Control name='mitigate' value={M} setValue={setM} />
            <Control name='remove' value={R} setValue={setR} />
            <Control name='geoeng' value={G} setValue={setG} />
            <Box
              onClick={update}
              sx={{
                fontFamily: 'monospace',
                display: 'inline-block',
                letterSpacing: 'monospace',
                textTransform: 'uppercase',
                fontSize: [2],
                bg: 'muted',
                borderRadius: '5px',
                px: [3],
                py: [2],
                mt: [4],
                cursor: 'pointer',
                opacity: status == 'error try again' ? 0.5 : 1,
                '&:active': {
                  opacity: 0.5,
                },
              }}
            >
              {status}
            </Box>
          </Box>
          <Temperature model={res} />
        </Box>
      </Grid>
      <Divider sx={{ mb: [4] }} />
    </Box>
  )
}

export default Optimization
