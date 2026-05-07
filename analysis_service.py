"""
PrepWise Face Detection & Emotion Analysis Service
====================================================
Uses OpenCV + DeepFace to analyse a candidate's facial expressions
in real-time during mock interviews.

Usage:
    pip install flask flask-cors opencv-python deepface tf-keras
    python analysis_service.py

Listens on: http://localhost:5001
"""

import base64
import io
import json
import time
import traceback

import cv2
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

# DeepFace import is lazy (first call triggers model download)
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    print("[WARN] DeepFace not installed. Falling back to OpenCV face detection only.")
    DEEPFACE_AVAILABLE = False

app = Flask(__name__)
CORS(app)  # Allow requests from Next.js (localhost:3000)

# ── OpenCV Haar Cascade (fast fallback & face detection) ─────────────────────
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def decode_base64_image(b64_string: str) -> np.ndarray:
    """Convert a base64 data URL or raw base64 string to a numpy BGR image."""
    # Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    img_bytes = base64.b64decode(b64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


def analyse_with_opencv(img: np.ndarray) -> dict:
    """
    Lightweight face detection using OpenCV Haar Cascades.
    Returns whether a face was found and approximate head position.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
    )

    face_detected = len(faces) > 0
    result = {
        "face_detected": face_detected,
        "face_count": int(len(faces)),
        "emotion": "unknown",
        "dominant_emotion": "unknown",
        "emotions": {},
        "eye_contact": False,
        "confidence_score": 0,
        "analysis_level": "opencv_only",
    }

    if face_detected:
        x, y, w, h = faces[0]
        img_h, img_w = img.shape[:2]
        cx = x + w / 2
        cy = y + h / 2
        # Rough eye-contact heuristic: face is centered horizontally
        result["eye_contact"] = (img_w * 0.25 < cx < img_w * 0.75) and (cy < img_h * 0.6)
        result["confidence_score"] = 60  # base score for just face detected

    return result


def analyse_with_deepface(img: np.ndarray) -> dict:
    """
    Deep facial attribute analysis using DeepFace.
    Detects: emotions, age, gender, eye contact estimation.
    """
    try:
        results = DeepFace.analyze(
            img_path=img,
            actions=["emotion", "age", "gender"],
            enforce_detection=False,   # Don't crash if face is unclear
            silent=True,
        )

        # DeepFace can return a list or dict depending on face count
        result_data = results[0] if isinstance(results, list) else results

        dominant_emotion = result_data.get("dominant_emotion", "neutral")
        emotions = result_data.get("emotion", {})

        # Map DeepFace emotion to interview-relevant signals
        positive_signals = {"happy", "neutral", "surprise"}
        negative_signals = {"angry", "disgust", "fear", "sad"}

        confidence_score = 50  # default
        if dominant_emotion in positive_signals:
            confidence_score = 75 + int(emotions.get(dominant_emotion, 50) * 0.25)
        elif dominant_emotion in negative_signals:
            confidence_score = 30 + int(emotions.get("neutral", 30) * 0.3)

        confidence_score = min(100, max(0, confidence_score))

        # Eye contact: if face region is roughly centered (deepface gives bounding box)
        region = result_data.get("region", {})
        face_x = region.get("x", 0)
        face_w = region.get("w", 0)
        img_w = img.shape[1]
        face_cx = face_x + face_w / 2
        eye_contact = img_w * 0.2 < face_cx < img_w * 0.8 if img_w > 0 else False

        return {
            "face_detected": True,
            "face_count": 1,
            "dominant_emotion": dominant_emotion,
            "emotion": dominant_emotion,
            "emotions": {k: round(v, 1) for k, v in emotions.items()},
            "age": result_data.get("age", "unknown"),
            "gender": result_data.get("dominant_gender", "unknown"),
            "eye_contact": eye_contact,
            "confidence_score": confidence_score,
            "analysis_level": "deepface",
        }

    except Exception as e:
        print(f"[DeepFace Error] {e}")
        return analyse_with_opencv(img)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Quick health check endpoint."""
    return jsonify({
        "status": "ok",
        "deepface_available": DEEPFACE_AVAILABLE,
        "timestamp": int(time.time()),
    })


@app.route("/analyse-frame", methods=["POST"])
def analyse_frame():
    """
    Receive a base64 image frame and return facial analysis.
    
    Body: { "frame": "<base64 string>" }
    Returns: { face_detected, dominant_emotion, emotions, eye_contact,
               confidence_score, analysis_level, ... }
    """
    try:
        body = request.get_json(force=True)
        if not body or "frame" not in body:
            return jsonify({"error": "Missing 'frame' field in request body"}), 400

        img = decode_base64_image(body["frame"])
        if img is None:
            return jsonify({"error": "Invalid image data"}), 400

        # Use DeepFace if available, otherwise fall back to OpenCV
        if DEEPFACE_AVAILABLE:
            analysis = analyse_with_deepface(img)
        else:
            analysis = analyse_with_opencv(img)

        # Derive human-readable feedback string
        emotion = analysis.get("dominant_emotion", "neutral")
        eye = analysis.get("eye_contact", False)
        conf = analysis.get("confidence_score", 0)
        face_ok = analysis.get("face_detected", False)

        if not face_ok:
            feedback_text = "No face detected — please make sure you're visible on camera."
        elif conf >= 70:
            feedback_text = f"You appear confident and engaged ({emotion})."
        elif conf >= 50:
            feedback_text = f"Moderate engagement detected ({emotion}). Try to maintain eye contact."
        else:
            feedback_text = f"Low confidence signals detected ({emotion}). Relax and look at the camera."

        analysis["feedback_text"] = feedback_text
        return jsonify(analysis)

    except Exception:
        print("[ERROR] /analyse-frame crashed:")
        traceback.print_exc()
        return jsonify({"error": "Internal analysis error", "face_detected": False}), 500


@app.route("/summarise-session", methods=["POST"])
def summarise_session():
    """
    Receive a list of per-frame analysis results and produce a
    session-level body language summary.
    
    Body: { "frames": [ ...analysis objects... ] }
    """
    try:
        body = request.get_json(force=True)
        frames = body.get("frames", [])
        if not frames:
            return jsonify({"summary": "No visual data collected.", "avg_confidence": 0})

        face_frames = [f for f in frames if f.get("face_detected")]
        total = len(frames)
        visible = len(face_frames)
        presence_pct = round((visible / total) * 100) if total > 0 else 0

        avg_conf = round(
            sum(f.get("confidence_score", 0) for f in face_frames) / visible
        ) if visible > 0 else 0

        eye_pct = round(
            (sum(1 for f in face_frames if f.get("eye_contact")) / visible) * 100
        ) if visible > 0 else 0

        # Dominant emotion across session
        emotion_counts: dict = {}
        for f in face_frames:
            em = f.get("dominant_emotion", "neutral")
            emotion_counts[em] = emotion_counts.get(em, 0) + 1
        dominant_session_emotion = max(emotion_counts, key=emotion_counts.get) if emotion_counts else "neutral"

        # Build summary text
        parts = []
        if presence_pct < 70:
            parts.append(f"Face was visible for only {presence_pct}% of the interview — try to stay in frame.")
        elif presence_pct >= 90:
            parts.append(f"Excellent camera presence — face detected {presence_pct}% of the time.")
        else:
            parts.append(f"Good camera presence ({presence_pct}% of the interview).")

        if avg_conf >= 70:
            parts.append(f"Overall confidence appeared high (avg score: {avg_conf}/100).")
        elif avg_conf >= 50:
            parts.append(f"Moderate confidence throughout (avg score: {avg_conf}/100). Body language could be more assertive.")
        else:
            parts.append(f"Low confidence signals detected (avg score: {avg_conf}/100). Work on composure and posture.")

        parts.append(f"Dominant emotion: {dominant_session_emotion}.")

        if eye_pct >= 70:
            parts.append("Eye contact with the camera was strong.")
        else:
            parts.append(f"Eye contact could be improved (detected {eye_pct}% of the time).")

        return jsonify({
            "summary": " ".join(parts),
            "avg_confidence": avg_conf,
            "presence_percentage": presence_pct,
            "eye_contact_percentage": eye_pct,
            "dominant_emotion": dominant_session_emotion,
            "frames_analysed": total,
        })

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Failed to summarise session"}), 500


if __name__ == "__main__":
    print("=" * 60)
    print("  PrepWise Face Detection Service")
    print(f"  DeepFace: {'✓ Loaded' if DEEPFACE_AVAILABLE else '✗ Not installed (using OpenCV only)'}")
    print("  Listening on http://localhost:5001")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5001, debug=False)
