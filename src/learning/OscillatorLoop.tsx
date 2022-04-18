import {
  Box,
  Button,
  HStack,
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Text,
  UseSliderProps,
} from '@chakra-ui/react';
import {
  ChangeEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

const initialFreq = 440;
const initialLevel = 10;
const initilaFFTsize = 2048;

export const OscillatorLoop = () => {
  const audioCtx = useRef<AudioContext>();
  const oscillator = useRef<OscillatorNode>();
  const gain = useRef<GainNode>();
  const analyser = useRef<AnalyserNode>();
  const bufferLength = useRef<number>();
  const data = useRef<Uint8Array>();
  const dbData = useRef<Float32Array>();
  const startTime = useRef<Date>();
  const endTime = useRef<Date>();

  const reqRef = useRef<number>();

  const [freqValue, setFreqValue] = useState(initialFreq);
  const [playing, setPlaying] = useState(false);
  const [typeValue, setTypeValue] = useState<OscillatorType>('sine');
  const [levelValue, setLevelValue] = useState(initialLevel);

  const [maxFreq, setmaxFreq] = useState({ index: 0, data: 0 });

  const handleOnClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (playing) return;
    audioCtx.current = new AudioContext();
    oscillator.current = audioCtx.current.createOscillator();
    gain.current = audioCtx.current.createGain();

    if (oscillator.current !== undefined && audioCtx.current !== undefined) {
      oscillator.current.frequency.value = freqValue;
      oscillator.current.type = typeValue;
      gain.current.gain.value = levelValue / 100;
      oscillator.current.connect(gain.current);

      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = initilaFFTsize;
      bufferLength.current = analyser.current.frequencyBinCount;
      data.current = new Uint8Array(bufferLength.current);
      dbData.current = new Float32Array(bufferLength.current);

      gain.current.connect(analyser.current);
      analyser.current.connect(audioCtx.current.destination);

      oscillator.current.start();
      setPlaying(true);
    }
  };

  const handleFreqChange: UseSliderProps['onChange'] = (value) => {
    if (oscillator.current !== undefined) oscillator.current.frequency.value = Number(value);
    setFreqValue(value);
  };

  const handleLevelChange: UseSliderProps['onChange'] = (value) => {
    if (gain.current !== undefined) gain.current.gain.value = Number(value) / 100;
    setLevelValue(value);
  };

  const handleTypeSelect: ChangeEventHandler<HTMLSelectElement> = (event) => {
    if (oscillator.current !== undefined)
      oscillator.current.type = event.currentTarget.value as OscillatorType;
    setTypeValue(event.currentTarget.value as OscillatorType);
  };

  const loop = useCallback(() => {
    if (analyser.current && dbData.current) {
      analyser.current.getFloatFrequencyData(dbData.current);
      const dbMax = {
        index: 0,
        data: -Infinity,
      };
      for (let i = 0; i < dbData.current.length; i++) {
        if (dbData.current[i] > dbMax.data) {
          dbMax.index = i;
          dbMax.data = dbData.current[i];
        }
      }
      setmaxFreq(dbMax);
      if (dbMax.data > -25) {
        if (!startTime.current) startTime.current = new Date();
      }
      if (dbMax.data < -25) {
        if (startTime.current && !endTime.current) {
          endTime.current = new Date();
          
          console.log(startTime.current);
          console.log(endTime.current);

          startTime.current = undefined;
          endTime.current = undefined;
        }
      }
    }
    reqRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    loop();
    return () => {
      if (reqRef.current) {
        return cancelAnimationFrame(reqRef.current);
      }
    };
  }, [loop]);

  return (
    <Stack spacing={4}>
      <Button onClick={handleOnClick} w={20}>
        Play
      </Button>
      <Box>
        <Text>{`周波数：${(maxFreq.index * (44100 / initilaFFTsize)).toFixed(2)}[Hz]`}</Text>
        <Text>{`音量　：${maxFreq.data.toFixed(2)}[db]`}</Text>
      </Box>

      {/* 波形設定 */}
      <HStack>
        <Text w="68px">Type</Text>
        <Select w={200} onChange={handleTypeSelect} defaultValue={typeValue}>
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="sawtooth">SawTooth</option>
          <option value="triangle">Triangle</option>
        </Select>
      </HStack>

      {/* 周波数設定 */}
      <HStack spacing={4}>
        <Text w="68px">Freq[Hz]</Text>
        <Slider
          aria-label="slider-1"
          min={50}
          max={1000}
          w={200}
          defaultValue={freqValue}
          onChange={handleFreqChange}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb boxSize={4} bgColor="twitter.300" />
        </Slider>
        <Text>{freqValue}</Text>
      </HStack>

      {/* 音量設定 */}
      <HStack spacing={4}>
        <Text w="68px">Level</Text>
        <Slider
          aria-label="slider-1"
          min={0}
          max={100}
          w={200}
          defaultValue={levelValue}
          onChange={handleLevelChange}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb boxSize={4} bgColor="twitter.300" />
        </Slider>
        <Text>{levelValue / 100}</Text>
      </HStack>
    </Stack>
  );
};
