import { Button, Divider, Stack, Text } from '@chakra-ui/react';
import { MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';

const initialMeasureResult = { time: 0, aveVolume: 0, sdVolume: 0 };
const initialSumMaxdb: number[] = [];
const initilaFFTsize = 2048;
const samplingRate = 100; // [ms]

export const Mic = () => {
  const stream = useRef<MediaStream>();
  const mediaStreamSource = useRef<MediaStreamAudioSourceNode>();
  const audioCtx = useRef<AudioContext>();
  const analyser = useRef<AnalyserNode>();
  const bufferLength = useRef<number>();
  // const data = useRef<Uint8Array>();
  const dbData = useRef<Float32Array>();
  const startTime = useRef<Date>();
  const tackTime = useRef<Date>();
  const endTime = useRef<Date>();
  const reqRef = useRef<number>();
  const sumMaxdb = useRef<number[]>(initialSumMaxdb);

  const [playing, setPlaying] = useState(false);
  const [maxFreq, setmaxFreq] = useState({ index: 0, data: 0 });
  const [measureResult, setMeasureResult] = useState(initialMeasureResult);

  // 収音開始
  const handlePlay: MouseEventHandler<HTMLButtonElement> = async (event) => {
    try {
      if (playing) return;
      audioCtx.current = new AudioContext();
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamSource.current = audioCtx.current.createMediaStreamSource(stream.current);
      analyser.current = audioCtx.current.createAnalyser();
      analyser.current.fftSize = initilaFFTsize;
      bufferLength.current = analyser.current.frequencyBinCount;
      // data.current = new Uint8Array(bufferLength.current);
      dbData.current = new Float32Array(bufferLength.current);
      mediaStreamSource.current.connect(analyser.current);

      setPlaying(true);
    } catch (error) {
      console.log(error);
    }
  };

  // 最大データをリセット
  const handleReset = () => {
    setMeasureResult(initialMeasureResult);
  };

  // 解析及び最高記録の計算処理
  const loop = useCallback(() => {
    if (analyser.current && dbData.current) {
      analyser.current.getFloatFrequencyData(dbData.current);
      const dbMax = {
        // 周波数(この値に(44100 / initilaFFTsize)を掛けると算出可能)
        index: 0,
        // 音量(0~1の不動小数点をdbに変換した値が入る)
        data: -Infinity,
      };

      // FFTデータの内、音量が最大となる周波数(dbData.index)と音量(dbMax.date)を取得する
      for (let i = 0; i < dbData.current.length; i++) {
        if (dbData.current[i] > dbMax.data) {
          dbMax.index = i;
          dbMax.data = dbData.current[i];
        }
      }

      // データ更新
      setmaxFreq(dbMax);

      // 測定開始処理
      if (dbMax.data > -50) {
        // 測定開始時刻を取得
        if (!startTime.current) startTime.current = new Date();

        // 測定中の最大音量の平均値を取得
        tackTime.current = new Date();
        if (
          tackTime.current.getTime() - startTime.current.getTime() >
          sumMaxdb.current.length * samplingRate
        ) {
          sumMaxdb.current.push(dbMax.data);
        }
      }

      // 測定終了処理
      if (dbMax.data < -50) {
        if (startTime.current && !endTime.current) {
          endTime.current = new Date();

          // 最大時間を更新したらmeasureResultを更新する
          if (measureResult.time < endTime.current.getTime() - startTime.current.getTime()) {
            const resultTime = endTime.current.getTime() - startTime.current.getTime();

            const resultAveVolume =
              sumMaxdb.current.reduce((prev, current) => prev + 10 ** (current / 20), 0) /
              sumMaxdb.current.length;

            const resultSdVolume = Math.sqrt(
              sumMaxdb.current.reduce(
                (prev, current) => prev + (10 ** (current / 20) - resultAveVolume) ** 2,
                0
              ) / sumMaxdb.current.length
            );

            setMeasureResult({
              time: resultTime,
              aveVolume: 20 * Math.log10(resultAveVolume),
              sdVolume: resultSdVolume,
            });
          }

          startTime.current = undefined;
          tackTime.current = undefined;
          endTime.current = undefined;
          sumMaxdb.current = initialSumMaxdb;
        }
      }
    }
    reqRef.current = requestAnimationFrame(loop);
  }, [measureResult]);

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
      <Stack spacing={2}>
        <Text>{`周波数：${(maxFreq.index * (44100 / initilaFFTsize)).toFixed(2)}[Hz]`}</Text>
        <Text>{`音量：${maxFreq.data.toFixed(2)}[db]`}</Text>
        <Divider />
        <Text>{`最高記録：${(measureResult.time / 1000).toFixed(2)}[s]`}</Text>
        <Text>{`最高記録時の平均音量：${measureResult.aveVolume.toFixed(2)}[dB]`}</Text>
        <Text>{`音量の標準偏差：${measureResult.sdVolume.toFixed(6)}`}</Text>
        <Text color="gray">{`音量の標準偏差は0に近いほどバラツキが少ない`}</Text>
      </Stack>

      {!playing ? (
        <Button onClick={handlePlay} w={20} colorScheme="blue">
          計測開始
        </Button>
      ) : (
        <Button onClick={handleReset} w={20} colorScheme="green">
          リセット
        </Button>
      )}
    </Stack>
  );
};
