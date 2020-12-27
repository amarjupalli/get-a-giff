import React, { useState, useEffect, useCallback } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import './App.css';

const ffmpeg = createFFmpeg({
  logger: (log) => console.log('FFMPEG', log.message),
});

function App() {
  const [loaded, setLoaded] = useState(false);
  const [video, setVideo] = useState();
  const [gif, setGif] = useState();
  const [processing, setProcessing] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);

  const load = async () => {
    try {
      await ffmpeg.load();
      setLoaded(true);
    } catch (error) {
      setLoaded(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateProgress = useCallback(
    ({ ratio }) => setProgressPercentage(Math.ceil(ratio * 100)),
    [],
  );

  const convert = async () => {
    setProcessing(true);
    const videoFile = await fetchFile(video);
    ffmpeg.setProgress(updateProgress);
    ffmpeg.FS('writeFile', 'temp.mp4', videoFile);

    await ffmpeg.run(
      '-i',
      'temp.mp4',
      '-t', // duration
      '2.5', // default to 2.5s
      '-ss', // offset
      '0.0', // default offset to 0s
      '-f',
      'gif',
      'temp.gif',
    );

    const data = ffmpeg.FS('readFile', 'temp.gif');
    const dataBlob = new Blob([data.buffer], { type: 'image/gif' });
    const url = URL.createObjectURL(dataBlob);

    setGif(url);
    setProcessing(false);
  };

  return loaded ? (
    <div className="App">
      {video && (
        <video controls width="250px" src={URL.createObjectURL(video)} />
      )}
      <div>
        <input
          type="file"
          onChange={(e) => setVideo(e.target.files?.item(0))}
        />
        <div>
          <button onClick={convert}>Convert</button>
        </div>
      </div>
      <hr />
      <div style={{ height: '100px' }}>
        {processing && (
          <div>Converting...please wait. {`${progressPercentage}%`}</div>
        )}
      </div>
      {gif && (
        <div>
          <img src={gif} alt="Converted gif" width="250" />
        </div>
      )}
    </div>
  ) : (
    <div>Loading...</div>
  );
}

export default App;
