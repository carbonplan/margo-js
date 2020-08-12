/** @jsx jsx */
import { jsx, ThemeProvider } from 'theme-ui'
import { Style } from '@carbonplan/components'
import { MDXProvider } from '@mdx-js/react'
import Prism from '@theme-ui/prism'
import base from '@carbonplan/theme'
import { alpha } from '@theme-ui/color'

const theme = {
  ...base,
  styles: {
    ...base.styles,
    code: {
      px: [3],
      py: [3],
      fontFamily: 'monospace',
      fontSize: [2],
      backgroundColor: alpha('muted', 0.2),
      borderRadius: '2px',
      '.comment,.prolog,.doctype,.cdata,.punctuation,.operator,.entity,.url': {
        color: 'grey',
      },
      '.comment': {
        fontStyle: 'italic',
      },
      '.property, .tag, .boolean, .number, .constant, .symbol, .deleted, .function, .class-name, .regex, .important, .variable': {
        color: 'blue',
      },
      '.atrule, .attr-value, .keyword': {
        color: 'primary',
      },
      '.selector, .attr-name, .string, .char, .builtin, .inserted': {
        color: 'secondary',
      },
    },
    inlineCode: {
      px: [1],
      mx: [1],
      pt: [0],
      pb: [1],
      fontFamily: 'monospace',
      backgroundColor: alpha('muted', 0.2),
    },
  },
}

const components = {
  pre: ({ children }) => <>{children}</>,
  code: Prism,
}

const App = ({ Component, pageProps }) => {
  return (
    <ThemeProvider theme={theme} components={components}>
      <MDXProvider>
        <Component {...pageProps} />
        <Style />
      </MDXProvider>
    </ThemeProvider>
  )
}

export default App
