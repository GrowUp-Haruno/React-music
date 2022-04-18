import {
  ChakraProvider,
  theme,
} from "@chakra-ui/react"
// import { Oscillator } from "./learning/Oscillator"
import { OscillatorLoop } from "./learning/OscillatorLoop"

export const App = () => (
  <ChakraProvider theme={theme}>
    {/* <Oscillator /> */}
    <OscillatorLoop />
  </ChakraProvider>
)
