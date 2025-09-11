import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzePosture } from '../../services/geminiService';
import { PostureAnalysisResult } from '../../types';
import FooterDisclaimer from '../shared/FooterDisclaimer';

// Declare TensorFlow.js and pose-detection types in the global scope
declare const tf: any;
declare const poseDetection: any;
// Declare jsPDF global
declare const jspdf: any;

const PostureIQ: React.FC = () => {
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // For Gemini analysis
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<PostureAnalysisResult | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [timerDuration, setTimerDuration] = useState<number>(0); // 0 = no timer
    const [countdown, setCountdown] = useState<number | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const detectorRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number | null>(null);
    const countdownIntervalRef = useRef<any>(null);


    // Load MoveNet model, waiting for scripts to be ready
    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.setBackend('webgl');
                const model = poseDetection.SupportedModels.MoveNet;
                const detector = await poseDetection.createDetector(model);
                detectorRef.current = detector;
                setError(null);
            } catch (err) {
                console.error("Error loading model:", err);
                setError("Failed to load the posture analysis model. Please refresh the page.");
            } finally {
                setIsModelLoading(false);
            }
        };

        const intervalId = setInterval(() => {
            if (typeof tf !== 'undefined' && typeof poseDetection !== 'undefined' && typeof tf.loadGraphModel === 'function') {
                clearInterval(intervalId);
                loadModel();
            }
        }, 100);

        return () => clearInterval(intervalId);
    }, []);

    const drawPose = (pose: any) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !videoRef.current) return;

        // Set canvas dimensions to match video
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { keypoints } = pose;

        const findKeypoint = (name: string) => keypoints.find((kp: any) => kp.name === name);

        // Draw keypoints
        for (const kp of keypoints) {
            if (kp.score > 0.5) {
                ctx.beginPath();
                ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#00bfa5';
                ctx.fill();
            }
        }

        // Draw skeleton
        const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
        ctx.strokeStyle = '#00838f';
        ctx.lineWidth = 3;

        for (const [i, j] of adjacentPairs) {
            const kp1 = keypoints[i];
            const kp2 = keypoints[j];
            if (kp1.score > 0.5 && kp2.score > 0.5) {
                ctx.beginPath();
                ctx.moveTo(kp1.x, kp1.y);
                ctx.lineTo(kp2.x, kp2.y);
                ctx.stroke();
            }
        }
        
        // Draw tilt detection lines
        ctx.strokeStyle = '#ff9800'; // Orange color for tilt lines
        ctx.lineWidth = 4; // Thicker line

        const leftShoulder = findKeypoint('left_shoulder');
        const rightShoulder = findKeypoint('right_shoulder');
        const leftHip = findKeypoint('left_hip');
        const rightHip = findKeypoint('right_hip');

        // Draw shoulder tilt line
        if (leftShoulder && rightShoulder && leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
            ctx.beginPath();
            ctx.moveTo(leftShoulder.x, leftShoulder.y);
            ctx.lineTo(rightShoulder.x, rightShoulder.y);
            ctx.stroke();
        }

        // Draw hip tilt line
        if (leftHip && rightHip && leftHip.score > 0.5 && rightHip.score > 0.5) {
            ctx.beginPath();
            ctx.moveTo(leftHip.x, leftHip.y);
            ctx.lineTo(rightHip.x, rightHip.y);
            ctx.stroke();
        }
    };

    const detectPose = useCallback(async () => {
        if (detectorRef.current && videoRef.current && videoRef.current.readyState >= 3) {
            const poses = await detectorRef.current.estimatePoses(videoRef.current);
            if (poses && poses.length > 0) {
                drawPose(poses[0]);
            }
        }
        requestRef.current = requestAnimationFrame(detectPose);
    }, []);

    const startCamera = async () => {
        setError(null);
        setAnalysisResult(null);
        setCapturedImage(null);
        setCountdown(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsCameraOn(true);
                    detectPose();
                };
            }
        } catch (err: any) {
            console.error("Camera access error:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("Camera access was denied. Please allow camera permission in your browser settings to use this feature.");
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError("No camera found. Please ensure a camera is connected and enabled.");
            } else {
                setError("An error occurred while trying to access the camera.");
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setCountdown(null);
        setIsCameraOn(false);
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    const captureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        
        // Draw video frame onto canvas
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const base64String = canvas.toDataURL('image/jpeg').split(',')[1];
        setCapturedImage(canvas.toDataURL('image/jpeg'));
        
        stopCamera();
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        
        try {
            const result = await analyzePosture(base64String, 'image/jpeg');
            setAnalysisResult(result);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during analysis.");
        } finally {
            setIsLoading(false);
        }
    };

    const startCaptureProcess = () => {
        if (countdownIntervalRef.current) { // If countdown is active, cancel it
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            setCountdown(null);
            return;
        }

        if (timerDuration > 0) {
            setCountdown(timerDuration);
            countdownIntervalRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev === null || prev <= 1) {
                        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                        countdownIntervalRef.current = null;
                        captureAndAnalyze(); // Trigger capture when countdown finishes
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            captureAndAnalyze(); // Capture immediately if no timer
        }
    };

    const handleExportPDF = () => {
        if (!analysisResult || !capturedImage) return;

        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('Posture Analysis Report', 105, 20, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(10, 25, 200, 25);
        
        // Add captured image
        doc.addImage(capturedImage, 'JPEG', 15, 35, 180, 101); // A4 is 210mm wide

        let yPosition = 150; // Start position for text below image

        // Add Risk Level
        doc.setFontSize(16);
        doc.text('Overall Risk Level:', 15, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(analysisResult.riskLevel, 65, yPosition);
        yPosition += 10;

        // Add Deviations
        doc.setFont('helvetica', 'bold');
        doc.text('Identified Deviations:', 15, yPosition);
        yPosition += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        analysisResult.deviations.forEach(item => {
            const text = `- ${item.area}: ${item.deviation}`;
            doc.text(text, 20, yPosition);
            yPosition += 7;
        });

        yPosition += 5; // Add some space

        // Add Recommendations
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Recommendations & Exercises:', 15, yPosition);
        yPosition += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        
        const recommendationsText = analysisResult.recommendations.map(rec => `- ${rec}`);
        // Use splitTextToSize to handle line wrapping
        const splitText = doc.splitTextToSize(recommendationsText.join('\n'), 175);
        doc.text(splitText, 20, yPosition);

        doc.save('Posture_Analysis_Report.pdf');
    };

    const getRiskLevelColor = (riskLevel: 'Low' | 'Medium' | 'High') => {
        switch (riskLevel) {
            case 'Low': return 'bg-green-100 text-green-800 border-green-400';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
            case 'High': return 'bg-red-100 text-red-800 border-red-400';
            default: return 'bg-gray-100 text-gray-800 border-gray-400';
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-[#37474f] mb-4">Posture IQ - AI Posture Analysis</h2>
            <p className="text-[#78909c] mb-6">Use your camera for a live AI-powered posture analysis. Stand sideways for best results.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left side: Camera View & Capture */}
                <div>
                     <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                        <video ref={videoRef} className={`w-full h-full object-cover ${!isCameraOn && 'hidden'}`}></video>
                        <canvas ref={canvasRef} className={`absolute top-0 left-0 w-full h-full object-cover ${!isCameraOn && 'hidden'}`}></canvas>
                         {!isCameraOn && capturedImage && (
                            <img src={capturedImage} alt="Captured Posture" className="w-full h-full object-cover" />
                        )}
                        {!isCameraOn && !capturedImage && (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white">
                                <i className="fas fa-video text-5xl mb-4"></i>
                                <p>Camera feed will appear here</p>
                            </div>
                        )}
                        {countdown !== null && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 animate-fade-in-fast">
                                <p className="text-white text-9xl font-bold" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                                    {countdown}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {isCameraOn && (
                        <div className="my-4 text-center">
                            <label className="block text-[#78909c] text-sm font-bold mb-2">Capture Timer</label>
                            <div className="inline-flex rounded-lg shadow-sm">
                                {[0, 3, 5, 10].map(duration => (
                                    <button
                                        key={duration}
                                        onClick={() => setTimerDuration(duration)}
                                        disabled={countdown !== null}
                                        className={`px-4 py-2 text-sm font-medium border-y border-gray-200 transition-colors disabled:opacity-50
                                            ${timerDuration === duration ? 'bg-[#00838f] text-white' : 'bg-white text-gray-800 hover:bg-gray-50'}
                                            ${duration === 0 ? 'rounded-l-lg border-l' : ''}
                                            ${duration === 10 ? 'rounded-r-lg border-x' : 'border-l'}
                                        `}
                                    >
                                        {duration === 0 ? 'Off' : `${duration}s`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                    <div className="mt-4 flex gap-4">
                        {!isCameraOn ? (
                             <button
                                onClick={startCamera}
                                disabled={isModelLoading}
                                className="flex-1 bg-[#00838f] text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 disabled:bg-gray-400 transition-colors"
                            >
                                {isModelLoading ? 'Loading Model...' : <><i className="fas fa-camera mr-2"></i> Start Camera</>}
                            </button>
                        ) : (
                            <button
                                onClick={startCaptureProcess}
                                disabled={isLoading}
                                className={`flex-1 text-white font-bold py-3 px-4 rounded-lg transition-colors
                                    ${countdown !== null ? 'bg-red-600 hover:bg-red-700' : 'bg-[#00bfa5] hover:bg-[#00a794]'}
                                `}
                            >
                                {countdown !== null ? (
                                    <><i className="fas fa-times mr-2"></i> Cancel</>
                                ) : (
                                    <><i className="fas fa-camera-retro mr-2"></i> {timerDuration > 0 ? `Start ${timerDuration}s Timer` : 'Capture & Analyze'}</>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right side: Results */}
                <div>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-[#37474f]">Analysis Results</h3>
                        {analysisResult && (
                            <button
                                onClick={handleExportPDF}
                                className="bg-[#00838f] text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-800 transition-colors text-sm"
                            >
                                <i className="fas fa-file-pdf mr-2"></i> Export to PDF
                            </button>
                        )}
                    </div>
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{error}</div>}

                    {isLoading && (
                        <div className="text-center p-8">
                            <i className="fas fa-spinner fa-spin text-4xl text-[#00838f]"></i>
                            <p className="mt-2 text-[#78909c]">Analyzing your posture, please wait...</p>
                        </div>
                    )}

                    {analysisResult && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h4 className="font-semibold text-lg text-[#37474f]">Overall Risk Level</h4>
                                <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-bold border ${getRiskLevelColor(analysisResult.riskLevel)}`}>
                                    {analysisResult.riskLevel}
                                </span>
                            </div>
                             <div>
                                <h4 className="font-semibold text-lg text-[#37474f]">Identified Deviations</h4>
                                <ul className="mt-2 list-disc list-inside space-y-1">
                                    {analysisResult.deviations.map((item, index) => (
                                        <li key={index} className="text-[#37474f]"><span className="font-bold">{item.area}:</span> {item.deviation}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-lg text-[#37474f]">Recommendations & Exercises</h4>
                                <ul className="mt-2 list-disc list-inside space-y-1">
                                    {analysisResult.recommendations.map((rec, index) => (
                                        <li key={index} className="text-[#37474f]">{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {!isLoading && !analysisResult && !error && (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                            <p className="text-[#78909c]">Start the camera and capture your posture. The analysis will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
            <FooterDisclaimer />
        </div>
    );
};

export default PostureIQ;