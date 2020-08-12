import { ThemeProvider } from 'theme-ui'
import { Style } from '@carbonplan/components'
import { MDXProvider } from '@mdx-js/react'
import theme from '@carbonplan/theme'

const App = ({ Component, pageProps }) => {
  return (
    <ThemeProvider theme={theme}>
      <MDXProvider>
        <Component {...pageProps} />
        <Style />
      </MDXProvider>
    </ThemeProvider>
  )
}

export default App
