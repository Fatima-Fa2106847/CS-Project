
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  completeVerification,
  getDashboardPath,
  getPendingSession,
  type SessionRole,
} from "../../lib/sessions";

type FaceApiModule = typeof import("@vladmandic/face-api");

type FaceAccount = {
  userId: string;
  name: string;
  role: SessionRole;
  enrolled: boolean;
};

// Safely read server responses.
async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `The server returned an empty response (HTTP ${response.status}).`
    );
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

// Extract an error message from an API response.
function getResponseMessage(
  result: unknown,
  fallback: string
): string {
  if (
    typeof result === "object" &&
    result !== null &&
    "message" in result &&
    typeof result.message === "string"
  ) {
    return result.message;
  }

  return fallback;
}

export default function VerifyPage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<FaceApiModule | null>(null);
  const mountedRef = useRef(true);

  const [account, setAccount] = useState<FaceAccount | null>(null);

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [message, setMessage] = useState(
    "Preparing your secure face verification."
  );

  const [messageType, setMessageType] = useState<
    "info" | "success" | "error"
  >("info");

  // Stop the webcam and release its resources.
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraReady(false);
  }, []);

  // Check the pending login session and face registration.
  useEffect(() => {
    mountedRef.current = true;

    async function initialize() {
      try {
        const session = await getPendingSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        const response = await fetch("/api/auth/face", {
          method: "GET",
          cache: "no-store",
        });

        const result = await readResponse(response);

        if (!response.ok) {
          throw new Error(
            getResponseMessage(
              result,
              "Unable to check face registration."
            )
          );
        }

        if (
          typeof result !== "object" ||
          result === null ||
          !("enrolled" in result)
        ) {
          throw new Error("Invalid face registration response.");
        }

        if (!mountedRef.current) return;

        const enrolled = result.enrolled === true;

        setAccount({
          userId: session.userId,
          name: session.name,
          role: session.role,
          enrolled,
        });

        setMessage(
          enrolled
            ? "Your face is registered. Please verify your identity."
            : "Welcome! Register your face to secure your account."
        );

        setMessageType("info");
      } catch (error) {
        console.error("Verification initialization failed:", error);

        if (mountedRef.current) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to initialize verification."
          );

          setMessageType("error");
        }
      } finally {
        if (mountedRef.current) {
          setIsCheckingSession(false);
        }
      }
    }

    void initialize();

    return () => {
      mountedRef.current = false;

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    };
  }, [router]);

  // Load face recognition, landmarks and smile detection models.
  async function loadFaceModels() {
    if (faceApiRef.current) {
      return faceApiRef.current;
    }

    setIsLoadingModels(true);

    try {
      const faceapi = await import("@vladmandic/face-api");

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);

      faceApiRef.current = faceapi;

      return faceapi;
    } finally {
      setIsLoadingModels(false);
    }
  }

  // Start or restart the webcam.
  async function startCamera() {
    setMessage("Loading face recognition models...");
    setMessageType("info");

    try {
      await loadFaceModels();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is unavailable. Use localhost or HTTPS."
        );
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        throw new Error("Camera preview is unavailable.");
      }

      video.srcObject = stream;

      await video.play();

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      setIsCameraReady(true);

      setMessage(
        "Camera ready! Position your face in the center and look at the camera."
      );

      setMessageType("success");
    } catch (error) {
      console.error("Camera initialization failed:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start your camera."
      );

      setMessageType("error");

      stopCamera();
    }
  }

  // Detect a smile and capture the face descriptor.
  async function captureFaceAfterSmile(): Promise<number[]> {
    const faceapi = faceApiRef.current;
    const video = videoRef.current;

    if (!faceapi || !video || video.readyState < 2) {
      throw new Error(
        "Camera is not ready. Please start the camera again."
      );
    }

    const deadline = Date.now() + 30000;

    // Require three consecutive smile detections.
    let smileFrames = 0;

    const requiredSmileFrames = 3;

    // More forgiving smile confidence threshold.
    const smileThreshold = 0.60;

    const detectorOptions =
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.30,
      });

    setMessage(
      "Look directly at the camera. Get ready to smile!"
    );

    setMessageType("info");

    while (Date.now() < deadline) {
      if (!mountedRef.current) {
        throw new Error("Verification was interrupted.");
      }

      const detection = await faceapi
        .detectSingleFace(video, detectorOptions)
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detection) {
        smileFrames = 0;

        setMessage(
          "Face not detected. Move closer and face the camera."
        );

        await new Promise((resolve) => setTimeout(resolve, 180));

        continue;
      }

      const happyScore = detection.expressions.happy;

      // Check the smile confidence.
      if (happyScore >= smileThreshold) {
        smileFrames++;

        setMessage(
          `Smile detected! Hold your smile... ${smileFrames}/${requiredSmileFrames}`
        );

        setMessageType("success");
      } else {
        smileFrames = 0;

        setMessage(
          "Face detected! Please smile naturally at the camera."
        );

        setMessageType("info");
      }

      // Smile detected in three consecutive frames.
      if (smileFrames >= requiredSmileFrames) {
        setMessage("Smile detected! Capturing your face...");

        setMessageType("success");

        // Capture a fresh face descriptor.
        for (let attempt = 0; attempt < 3; attempt++) {
          const finalDetection = await faceapi
            .detectSingleFace(video, detectorOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (finalDetection) {
            return Array.from(finalDetection.descriptor);
          }

          await new Promise((resolve) => setTimeout(resolve, 150));
        }

        throw new Error(
          "Smile detected, but face capture failed. Please try again."
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 180));
    }

    throw new Error(
      "Smile was not detected within 30 seconds. Please try again."
    );
  }

  // Register a new face or verify an existing face.
  async function handleFaceVerification() {
    if (!account || isVerifying) return;

    if (!isCameraReady) {
      setMessage("Please start your camera first.");
      setMessageType("error");
      return;
    }

    setIsVerifying(true);

    setMessage("Preparing smile verification...");
    setMessageType("info");

    try {
      // First detect the smile and capture the face.
      const descriptor = await captureFaceAfterSmile();

      setMessage("Sending face data securely for recognition...");
      setMessageType("info");

      // Send the descriptor to the server.
      const response = await fetch("/api/auth/face", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          descriptor,
          livenessPassed: true,
        }),
      });

      const result = await readResponse(response);

      const responseMessage = getResponseMessage(
        result,
        "Face verification failed."
      );

      if (!response.ok) {
        throw new Error(responseMessage);
      }

      setMessage(
        "Face recognized! Activating your secure session..."
      );

      setMessageType("success");

      // Complete authentication for the account's actual role.
      await completeVerification(account.role);

      stopCamera();

      // Redirect to the correct dashboard.
      router.replace(getDashboardPath(account.role));
    } catch (error) {
      console.error("Face verification failed:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Face verification failed. Please try again."
      );

      setMessageType("error");
    } finally {
      if (mountedRef.current) {
        setIsVerifying(false);
      }
    }
  }

  // Loading screen.
  if (isCheckingSession) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h2>Checking your account...</h2>
          <p>Please wait.</p>
        </div>
      </main>
    );
  }

  // Invalid or expired session.
  if (!account) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h2>Verification unavailable</h2>

          <p>{message}</p>

          <Link href="/login" className="auth-back-link">
            Return to login
          </Link>
        </div>
      </main>
    );
  }

  // Main face verification page.
  return (
    <main className="auth-page">
      <div className="auth-card">

        {/* UniPortal branding */}
        <Link href="/" className="auth-brand">
          <span className="auth-brand-icon">U</span>
          <span>UniPortal</span>
        </Link>

        <div className="auth-divider" />

        {/* Verification heading */}
        <div className="auth-heading">
          <div className="auth-icon">😊</div>

          <h1>Face Verification</h1>

          <p>
            Welcome, {account.name}!
            <br />
            Account role: {account.role.toLowerCase()}
          </p>
        </div>

        {/* Camera preview */}
        <div className="auth-field">
          <label>Camera Preview</label>

          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="face-video"
            style={{
              width: "100%",
              maxHeight: "360px",
              objectFit: "cover",
              borderRadius: "12px",
              background: "#222",
              transform: "scaleX(-1)",
            }}
          />
        </div>

        {/* Verification status */}
        <div
          className={
            messageType === "error"
              ? "auth-error"
              : messageType === "success"
                ? "auth-success"
                : "auth-security-note"
          }
          role="status"
          aria-live="polite"
          style={{ marginTop: "16px" }}
        >
          {message}
        </div>

        {/* Camera and verification buttons */}
        <div className="auth-form">

          <button
            type="button"
            className="auth-submit-button"
            onClick={startCamera}
            disabled={isLoadingModels || isVerifying}
          >
            {isLoadingModels
              ? "Loading Models..."
              : isCameraReady
                ? "Restart Camera"
                : "Start Camera"}
          </button>

          <button
            type="button"
            className="auth-submit-button"
            onClick={handleFaceVerification}
            disabled={
              !isCameraReady ||
              isVerifying ||
              isLoadingModels
            }
          >
            {isVerifying
              ? "Verifying..."
              : account.enrolled
                ? "Verify My Face"
                : "Register My Face"}
          </button>

        </div>

        {/* Security information */}
        <p className="auth-security-note">
          🔒 Your face is checked against your registered account.
        </p>

        <Link href="/" className="auth-back-link">
          ← Back to Home
        </Link>

      </div>
    </main>
  );
}
