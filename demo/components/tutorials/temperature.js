import { Box, Text } from 'theme-ui'
import chroma from 'chroma-js'

const scale = chroma
  .scale(['#85A2F7', '#BC85D9', '#E587B6', '#F07071', '#EA9755', '#D4C05E'])
  .domain([-0.1, 4.1])

function Temperature({ model }) {
  const temperature = model.temperature()
  const finalTemp = temperature[temperature.length - 1]
  const color = scale(finalTemp).hex()

  return (
    <Box sx={{ mt: [4] }}>
      <Text
        sx={{
          fontFamily: 'heading',
          letterSpacing: 'wide',
          fontSize: [3],
        }}
      >
        WARMING BY 2200
      </Text>
      <Text
        sx={{
          fontFamily: 'monospace',
          letterSpacing: 'monospace',
          fontSize: [5],
          ml: '-5px',
        }}
      >
        <Text sx={{ color: 'secondary', mr: [2], display: 'inline-block' }}>
          {finalTemp.toFixed(2) < 0 ? '-' : '+'}
        </Text>
        <Text sx={{ color: color, display: 'inline-block' }}>
          {Math.abs(finalTemp).toFixed(2)}
        </Text>
      </Text>
    </Box>
  )
}

export default Temperature
