import { Box, Button, Stack, Text } from '@chakra-ui/react';
import { MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';

const initilaFFTsize = 2048;

export const Mic = () => {
  const stream = useRef<MediaStream>();
  const mediaStreamSource = useRef<MediaStreamAudioSourceNode>();
  const audioCtx = useRef<AudioContext>();
  const analyser = useRef<AnalyserNode>();
  const bufferLength = useRef<number>();
  const data = useRef<Uint8Array>();
  const dbData = useRef<Float32Array>();
  const startTime = useRef<Date>();
  const endTime = useRef<Date>();
  const reqRef = useRef<number>();

  const [playing, setPlaying] = useState(false);
  const [maxFreq, setmaxFreq] = useState({ index: 0, data: 0 });
  const [maxTime, setMaxTime] = useState(0);

  const handleOnClick: MouseEventHandler<HTMLButtonElement> = async (event) => {
    try {
      if (playing) return;
      audioCtx.current = new AudioContext();
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamSource.current = audioCtx.current.createMediaStreamSource(stream.current);
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = initilaFFTsize;
      bufferLength.current = analyser.current.frequencyBinCount;
      data.current = new Uint8Array(bufferLength.current);
      dbData.current = new Float32Array(bufferLength.current);
      mediaStreamSource.current.connect(analyser.current);

      setPlaying(true);
    } catch (error) {
      console.log(error);
    }
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
      if (dbMax.data > -50) {
        if (!startTime.current) startTime.current = new Date();
      }
      if (dbMax.data < -50) {
        if (startTime.current && !endTime.current) {
          endTime.current = new Date();

          if (maxTime < endTime.current.getTime() - startTime.current.getTime())
            setMaxTime(endTime.current.getTime() - startTime.current.getTime());

          startTime.current = undefined;
          endTime.current = undefined;
        }
      }
    }
    reqRef.current = requestAnimationFrame(loop);
  }, [maxTime]);

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
      <Button onClick={handleOnClick} w={20} bg={'blue.100'}>
        Play
      </Button>
      <Box>
        <Text>{`周波数　　：${(maxFreq.index * (44100 / initilaFFTsize)).toFixed(2)}[Hz]`}</Text>
        <Text>{`音量　　　：${maxFreq.data.toFixed(2)}[db]`}</Text>
        <Text>{`最高記録　：${(maxTime / 1000).toFixed(2)}[s]`}</Text>
      </Box>
    </Stack>
  );
};
