
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeftIcon } from './icons';
import Spinner from './Spinner';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let mediaStream: MediaStream;
    
    const enableStream = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }, // Prefer front-facing camera
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        if (err instanceof Error) {
            switch (err.name) {
                case 'NotAllowedError':
                case 'PermissionDeniedError':
                    setError('Camera permission was denied. Please click the lock icon in your browser address bar to allow camera access, then refresh the page.');
                    break;
                case 'NotFoundError':
                case 'DevicesNotFoundError':
                    setError('No camera found on this device. Please connect a camera and try again.');
                    break;
                case 'NotReadableError':
                case 'TrackStartError':
                    setError('Could not access the camera. It might be in use by another application. Please close any other apps using the camera and try again.');
                    break;
                case 'OverconstrainedError':
                case 'ConstraintNotSatisfiedError':
                     setError('The camera on your device does not support the required settings.');
                     break;
                case 'SecurityError':
                    setError('Camera access is only available on secure (HTTPS) connections. Please check your connection.');
                    break;
                default:
                    setError('Could not access the camera due to an unexpected error. Please try again.');
            }
        } else {
            setError('An unknown error occurred while accessing the camera.');
        }
      }
    };

    enableStream();

    return () => {
      mediaStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleCaptureClick = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');

      if (context) {
        // Flip the image horizontally for a mirror effect, which is more intuitive for selfies.
        context.translate(video.videoWidth, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        canvas.toBlob(blob => {
          if (blob) {
            onCapture(blob);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center gap-8 h-full">
        <div className="w-full max-w-md aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden relative shadow-2xl">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror the preview for a selfie-like experience
            />
            {!stream && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                    <Spinner />
                    <p className="mt-4">Starting camera...</p>
                </div>
            )}
            {error && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
                    <p className="font-semibold">Camera Error</p>
                    <p className="text-sm mt-2">{error}</p>
                    <button
                        onClick={onCancel}
                        className="mt-6 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/30"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Go Back
                    </button>
                 </div>
            )}
        </div>
        <div className="flex items-center justify-center gap-8 w-full max-w-md">
            <button
                onClick={onCancel}
                className="text-gray-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleCaptureClick}
                disabled={!!error}
                className="w-20 h-20 bg-white rounded-full border-[6px] border-gray-300/80 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-gray-400 focus:ring-offset-2 transition-all active:scale-95"
                aria-label="Capture photo"
            />
            <div className="w-[8.5rem]" /> {/* Spacer to balance cancel button */}
        </div>

        <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
