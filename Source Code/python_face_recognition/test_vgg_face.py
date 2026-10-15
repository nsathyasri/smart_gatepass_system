"""
test_vgg_face.py
Purpose: Standalone Webcam & OpenCV Tester for testing camera hardware and VGG-Face recognition
Run via: python test_vgg_face.py
Press 'c' to capture & test face embedding
Press 'q' to quit
"""

import cv2
import sys
from face_engine import extract_vgg_embedding, SIMILARITY_THRESHOLD

def run_webcam_test():
    print("=================================================================")
    print("  AUTOMATED SMART GATE PASS - WEBCAM & VGG-FACE DIAGNOSTIC TEST  ")
    print("=================================================================")
    print("Initializing camera feed...")
    
    # 0 is usually the default FaceTime / USB webcam on macOS
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("[ERROR] Could not access webcam. Please check camera permissions in macOS System Settings.")
        sys.exit(1)

    print("[SUCCESS] Camera initialized successfully!")
    print("Controls:")
    print(" -> Press 'c' to capture frame and test VGG-Face feature extraction")
    print(" -> Press 'q' to close tester")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARNING] Failed to grab frame from camera")
            break

        # Display instructions on screen
        display_frame = frame.copy()
        cv2.putText(display_frame, "Smart GPS Face Cam: Press 'C' to Test, 'Q' to Quit",
                    (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 120, 0), 2)

        cv2.imshow("Campus Gate Terminal - Camera Test", display_frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('c'):
            print("\n[Processing] Analyzing captured frame with VGG-Face...")
            temp_filename = "temp_webcam_test.jpg"
            cv2.imwrite(temp_filename, frame)
            
            emb = extract_vgg_embedding(temp_filename)
            if emb:
                print(f"[SUCCESS] Face Detected & VGG Embedding Extracted! ({len(emb)} feature dimensions)")
            else:
                print("[NOTICE] No face detected or feature extraction returned empty. Ensure good lighting.")

    cap.release()
    cv2.destroyAllWindows()
    print("Camera diagnostic test ended.")

if __name__ == '__main__':
    run_webcam_test()
