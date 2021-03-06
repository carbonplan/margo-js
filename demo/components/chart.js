import { useEffect, useState } from 'react'
import { Vega } from 'react-vega'
import { useThemeUI, Box } from 'theme-ui'

var vegaLite = require('vega-lite')

const Chart = ({ x, y, color, scales, height }) => {
  const [spec, setSpec] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const context = useThemeUI()
  const theme = context.theme

  const data = x.map((v, i) => {
    return {
      x: v,
      y: y[i],
    }
  })

  useEffect(() => {
    const config = {
      background: null,
      padding: {
        left: scales.padding ? scales.padding : 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
      axis: {
        grid: false,
        labelFontSize: theme.fontSizes[1],
        labelFont: theme.fonts.monospace,
        labelColor: theme.colors.text,
        titleFont: theme.fonts.monospace,
        titleFontSize: theme.fontSizes[1],
        titleColor: theme.colors.text,
        domain: true,
        tickOffset: 0,
        labelPadding: 5,
        titlePadding: 10,
      },
      view: {
        stroke: 'none',
      },
    }

    const spec = {
      data: {
        name: 'values',
      },
      mark: {
        type: 'line',
        clip: true,
        color: theme.colors[color],
        interpolate: 'monotone',
        strokeWidth: 3,
      },
      encoding: {
        x: {
          field: 'x',
          type: 'quantitative',
          scale: {
            domain: scales.x,
            nice: false,
            padding: 0,
          },
          axis: {
            title: null,
            offset: 6,
            format: '.0f',
          },
        },
        y: {
          field: 'y',
          type: 'quantitative',
          scale: {
            domain: scales.y,
            padding: 0,
            nice: false,
          },
          axis: {
            title: scales.title,
            orient: 'left',
            padding: 0,
            offset: 5,
          },
        },
      },
    }
    setSpec(vegaLite.compile(spec, { config: config }).spec)
    setLoaded(true)
  }, [context])

  const width = 350

  return (
    <Box sx={{ py: [3] }}>
      {loaded && (
        <Vega
          width={width}
          height={height}
          data={{ values: data }}
          renderer={'svg'}
          actions={false}
          spec={spec}
        />
      )}
      {!loaded && <Box sx={{ height: height + 41 }}></Box>}
    </Box>
  )
}

export default Chart
