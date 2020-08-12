import { Box, Container } from 'theme-ui'

const Layout = ({ children }) => {
  return (
    <Container sx={{ px: [4], mt: [3] }}>
      <Box sx={{ maxWidth: '800px' }}>{children}</Box>
    </Container>
  )
}

export default Layout
