import {
  Box,
  ChakraProvider,
  Stack,
  theme,
} from "@chakra-ui/react"
import { Mic } from "./learning/Mic";
// import { Oscillator } from "./learning/Oscillator"
// import { OscillatorLoop } from "./learning/OscillatorLoop"

export const App = () => (
  <ChakraProvider theme={theme}>
    <Box h="100vh" p={4} bg={'gray.300'}>
      <Stack
        spacing={4}
        w={'full'}
        maxW={'md'}
        bg={'gray.50'}
        rounded={'xl'}
        boxShadow={'lg'}
        p={6}
      >
        {/* <Oscillator /> */}
        {/* <OscillatorLoop /> */}
        <Mic />
      </Stack>
    </Box>
  </ChakraProvider>
);
