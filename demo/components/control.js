import { Text, Slider } from 'theme-ui'

const Control = ({ name, value, setValue, min, max, step }) => {
  min = min ? min : 0
  max = max ? max : 1
  step = step ? step : 0.1
  return (
    <>
      <Text
        sx={{
          fontFamily: 'monospace',
          letterSpacing: 'monospace',
          fontSize: [2],
          mt: [3],
        }}
      >
        {name}{' '}
        <Text sx={{ display: 'inline-block', color: 'secondary' }}>
          {value.toFixed(1)}
        </Text>
      </Text>
      <Slider
        sx={{ width: '200px' }}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
      ></Slider>
    </>
  )
}

export default Control
