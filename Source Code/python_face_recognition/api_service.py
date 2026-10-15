"""
api_service.py
Purpose: Flask microservice running on port 5001 for VGG-Face Biometric Processing
Integrates directly with Node.js Express backend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import base64
import cv2
import tempfile
import os
from face_engine import (
    extract_vgg_embedding,
    calculate_cosine_similarity,
    verify_student_identity,
    SIMILARITY_THRESHOLD
)

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ONLINE",
        "service": "VGG-Face Microservice",
        "port": 5001,
        "model": "VGG-Face (DeepFace + OpenCV)"
    }), 200

@app.route('/extract_embedding', methods=['POST'])
def extract_embedding():
    data = request.get_json(force=True)
    image_data = data.get('image') # Base64 or image path

    if not image_data:
        return jsonify({"error": "No image provided"}), 400

    temp_path = None
    try:
        # If Base64 string is received
        if image_data.startswith('data:image') or ';base64,' in image_data:
            header, encoded = image_data.split(';base64,')
            decoded = base64.b64decode(encoded)
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
                f.write(decoded)
                temp_path = f.name
            target_image = temp_path
        else:
            target_image = image_data

        embedding = extract_vgg_embedding(target_image)
        return jsonify({
            "success": True,
            "embedding": embedding,
            "dimensions": len(embedding)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

@app.route('/compare_embeddings', methods=['POST'])
def compare_embeddings():
    data = request.get_json(force=True)
    embedding_a = data.get('embeddingA', [])
    embedding_b = data.get('embeddingB', [])
    threshold = data.get('threshold', SIMILARITY_THRESHOLD)

    if not embedding_a or not embedding_b:
        return jsonify({"error": "Both embeddingA and embeddingB are required"}), 400

    result = verify_student_identity(embedding_a, embedding_b, threshold=threshold)
    return jsonify(result), 200

if __name__ == '__main__':
    print("[Python Microservice] Starting VGG-Face Flask Service on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)
