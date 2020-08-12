import { Box } from 'theme-ui'

const Variable = ({ v }) => {
  return <Box sx={{
    fontFamily: 'monospace',
    display: 'inline-block'
  }}>{v}</Box>
} 

export default Variable