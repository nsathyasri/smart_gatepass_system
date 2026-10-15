**Project Description: Automated Smart Gate Pass and Identity Verification System for Secure Campus Access**

The Smart Gate Pass System is a web-based solution that digitises and secures the process of granting students permission to leave an educational campus. Traditional gate pass procedures rely on handwritten permissions, paper registers and manual checks at the gate. These methods are slow, difficult to audit, and open to misuse, impersonation and record loss. This project replaces them with a centralised, role-based platform that makes every exit request traceable from submission to verification.

The system follows a client-server architecture with four layers. The presentation layer provides separate portals for students, Heads of Department (HODs), security guards and administrators. The application layer is a Node.js backend that manages gate pass processing, authentication and communication between modules. MongoDB stores user profiles, gate pass requests and entry and exit records, and a cloud service manages facial images. A facial recognition layer uses the VGG-Face deep learning model to extract facial embeddings and confirm a student's identity at the gate.

The workflow runs in a clear sequence. A registered student submits a gate pass request, and the system notifies the parent for confirmation. The HOD then approves or rejects the request. At the gate, the security guard captures the student's live image, and the system compares it against the stored facial data. Access is allowed only if the pass is valid and the identity matches. Each entry or exit is automatically recorded, giving administrators a complete audit trail and reporting capability.

The report documents the system's design through architecture and UML diagrams (use case, class and sequence), together with its methodology, implementation and results. Screenshots of each portal show the working system, and a set of test cases covers registration, login, request approval and face verification. The report also includes a literature survey of existing facial recognition, RFID and digital pass systems. It identifies the research gap that none of them combines approval, parent confirmation and biometric verification in one process, and the proposed system addresses exactly that gap.

Overall, the project offers an efficient, transparent and scalable way to strengthen campus security, reduce paperwork and human error, and improve accountability.<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 47 PM" src="https://github.com/user-attachments/assets/42eedbdf-57a9-4b84-bdc0-000980fe290d" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 46 PM" src="https://github.com/user-attachments/assets/97dd9f29-438a-4edb-a49b-c71f03ef3f0c" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 46 PM (2)" src="https://github.com/user-attachments/assets/c412b74e-41a9-44a1-8fc4-20fd8a8dcad1" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 46 PM (1)" src="https://github.com/user-attachments/assets/d7c6f242-8585-4c3e-88bf-55e4adb4dc05" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 45 PM" src="https://github.com/user-attachments/assets/b0c87e3d-568a-4844-8fa3-75d5ec47a7cf" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 45 PM (3)" src="https://github.com/user-attachments/assets/54a974aa-bfb0-4d88-9b46-431d1a7deded" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 45 PM (2)" src="https://github.com/user-attachments/assets/a887738a-391f-43fe-9ec9-963cdcd55d8f" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 45 PM (1)" src="https://github.com/user-attachments/assets/eb88c62d-4373-4d8c-aa4a-aed4ff71ea1a" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 44 PM" src="https://github.com/user-attachments/assets/8cd94433-20ca-438a-8a96-62aa5fcb2a19" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 44 PM (2)" src="https://github.com/user-attachments/assets/6efceeec-1d18-4be5-b18c-6a57ca6f1255" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 44 PM (1)" src="https://github.com/user-attachments/assets/7df5289d-5c57-40a8-87ad-45800b888053" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 43 PM" src="https://github.com/user-attachments/assets/04c592e3-ad7e-44a8-81ab-21c9ff6bf83a" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 43 PM (3)" src="https://github.com/user-attachments/assets/e8d015af-d03a-49a9-8fb4-9f32fa64c7ae" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 43 PM (2)" src="https://github.com/user-attachments/assets/ef7cbba2-d456-4283-96b6-6ae30909b06d" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 43 PM (1)" src="https://github.com/user-attachments/assets/8d3bee51-54a1-4b36-b477-962e1c35ea00" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 42 PM" src="https://github.com/user-attachments/assets/6acf9e59-eaf8-4fa4-b69c-1084e89b7bb6" />
