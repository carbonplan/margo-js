import { Box } from 'theme-ui'

const Variable = ({ v }) => {
  return (
    <Box
      sx={{
        fontFamily: 'monospace',
        display: 'inline-block',
        borderColor: 'text',
        borderWidth: '0px',
        borderBottomWidth: '2px',
        borderStyle: 'dotted',
        ml: [1]
      }}
    >
      {v}
    </Box>
  )
}

export default Variable
