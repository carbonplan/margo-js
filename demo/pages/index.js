import { Box, Text } from 'theme-ui'
import { Model } from '../..'

function Index() {
  var opts = {
    time: {
      tmin: 2020,
      tmax: 2200,
      dt: 5
    },
    baseline: {
      form: 'ramp',
      q0: 7.5,
      q0mult: 3,
      t1: 2100,
      t2: 2150
    },
    physics: {
      r: 0.5,
      c0: 460,
      a: (6.9/2)/Math.log(2),
      Finf: 8.5,
      F0: 3,
      B: 1.13,
      Cd: 106,
      x: 0.73,
      T0: 1.1,
    },
    economics: {
    },
    controls: null
  }

  const m = Model(opts)

  return <Box sx={{ 
    ml: [5], 
    mt: [5], 
    fontSize: [6], 
    fontFamily: 'monospace' 
  }}>MARGO-JS demo</Box>
}

export default Index