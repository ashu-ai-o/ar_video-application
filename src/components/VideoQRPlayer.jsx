import React, { useRef, useState } from "react";
import jsQR from "jsqr";

export default function VideoQRPlayer() {
  const videoRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);

  const defaultVideo = "https://aecbyte.github.io/video-hosting/HomeVideo (1).mp4";

  // QR frame scanning
  const scanFrame = () => {
    const video = cameraVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);

    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, width, height);
      if (code) {
        stopScanner();
        // QR video directly play
        setVideoSrc(code.data);
        setPlaying(true);
        return;
      }
    } catch (err) {
      console.error("QR decode error", err);
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  };

  const startScanner = async () => {
    if (scanning) return;
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      cameraVideoRef.current.srcObject = stream;
      await cameraVideoRef.current.play();
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      console.error("Camera error", err);
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const vid = cameraVideoRef.current;
    if (vid && vid.srcObject) {
      vid.srcObject.getTracks().forEach((t) => t.stop());
      vid.srcObject = null;
    }
    setScanning(false);
  };

  const playDefaultVideo = () => {
    setVideoSrc(defaultVideo);
    setPlaying(true);
  };

  return (
    <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white">
      {/* Video Player */}
      {playing && videoSrc ? (
        <div className="bg-gray-900 rounded-lg shadow-lg p-2">
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-[320px] h-[180px] object-cover rounded-md"
            loop
            playsInline
            muted
            autoPlay
          />
        </div>
      ) : (
        // Camera QR Scanner
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={cameraVideoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            autoPlay
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div className="absolute bottom-6 text-lg bg-black/50 px-4 py-2 rounded">
            Point QR code to camera
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="absolute bottom-4 flex gap-4">
        <button
          onClick={playDefaultVideo}
          className="px-6 py-2 bg-indigo-600 rounded-lg font-semibold shadow-md"
        >
          Play Default Video
        </button>
        <button
          onClick={startScanner}
          className="px-6 py-2 bg-green-600 rounded-lg font-semibold shadow-md"
        >
          Start QR Scanner
        </button>
      </div>
    </div>
  );
}