"""
face_engine.py
Purpose: Core Face Recognition Engine using OpenCV and VGG-Face
Mathematical basis: Cosine Similarity on feature vectors extracted via VGG-Face CNN
Threshold: T = 0.40 (per project specification)
"""

import math
import numpy as np
import cv2
SIMILARITY_THRESHOLD = 0.40

def normalize_pixel_values(image_array):
    """
    Image preprocessing normalization:
    x' = x / 255.0
    """
    return image_array.astype(np.float32) / 255.0

def dot_product(vec_a, vec_b):
    """
    Dot Product: A · B = Σ(Ai × Bi)
    """
    length = min(len(vec_a), len(vec_b))
    return sum(vec_a[i] * vec_b[i] for i in range(length))

def magnitude(vec):
    """
    Vector Magnitude: |A| = √Σ(Ai²)
    """
    sum_sq = sum(val * val for val in vec)
    return math.sqrt(sum_sq) or 1e-9

def calculate_cosine_similarity(vec_a, vec_b):
    """
    Cosine Similarity = (A · B) / (|A| × |B|)
    Returns a float between -1.0 and 1.0 (matching faces are close to 1.0)
    """
    if not vec_a or not vec_b:
        return 0.0
    dp = dot_product(vec_a, vec_b)
    mag_a = magnitude(vec_a)
    mag_b = magnitude(vec_b)
    return float(dp / (mag_a * mag_b))

def extract_vgg_embedding(image_path_or_array):
    """
    Extracts deep numerical feature vector (embedding) using VGG-Face
    """
    try:
        from deepface import DeepFace
        result = DeepFace.represent(
            img_path=image_path_or_array,
            model_name="VGG-Face",
            enforce_detection=False
        )
        if isinstance(result, list) and len(result) > 0:
            return result[0]["embedding"]
        return result.get("embedding", [])
    except Exception as err:
        print(f"[FaceEngine] VGG-Face extraction note: {err}")
        return []

def verify_student_identity(scanned_embedding, registered_embedding, threshold=SIMILARITY_THRESHOLD):
    """
    Verifies if scanned face belongs to authorized student
    Rule: If Cosine Similarity >= Threshold => Match (True)
    """
    similarity = calculate_cosine_similarity(scanned_embedding, registered_embedding)
    is_match = similarity >= threshold
    confidence = max(0.0, min(100.0, round(similarity * 100, 2)))

    return {
        "match": is_match,
        "similarity": round(similarity, 4),
        "confidence_percentage": confidence,
        "threshold": threshold,
        "verdict": "ALLOW EXIT" if is_match else "DENY EXIT - BIOMETRIC MISMATCH"
    }
