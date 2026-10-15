"""
verify_face_fast.py
Purpose: Fast script to extract facial embeddings from image URL or base64 using VGG-Face
Used by Node.js child_process.spawnSync
"""

import sys
import json
import os

if len(sys.argv) < 2:
    print(json.dumps({"error": "Pass the scanned image file path or URL"}))
    sys.exit(1)

image_target = sys.argv[1]

try:
    # Attempt import of deepface
    from deepface import DeepFace

    # Extract embedding using VGG-Face model
    result = DeepFace.represent(
        img_path=image_target,
        model_name="VGG-Face",
        enforce_detection=False
    )
    
    if isinstance(result, list) and len(result) > 0:
        embedding = result[0]["embedding"]
    else:
        embedding = result.get("embedding", [])

    print(json.dumps({"embedding": embedding}))

except Exception as e:
    # Graceful error reporting in JSON for Node.js caller
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
