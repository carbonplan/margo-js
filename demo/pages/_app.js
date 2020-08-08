import { ThemeProvider } from 'theme-ui'
import { Style } from '@carbonplan/components'
import theme from '@carbonplan/theme'

const App = ({ Component, pageProps }) => {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
      <Style />
    </ThemeProvider>
  )
}

export default App
