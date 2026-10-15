****Automated Smart Gate Pass and Identity Verification System for Secure Campus Access****

The Smart Gate Pass System is a web-based solution that digitises and secures the process of granting students permission to leave an educational campus. Traditional gate pass procedures rely on handwritten permissions, paper registers and manual checks at the gate. These methods are slow, difficult to audit, and open to misuse, impersonation and record loss. This project replaces them with a centralised, role-based platform that makes every exit request traceable from submission to verification.
The system follows a client-server architecture with four layers. The presentation layer provides separate portals for students, Heads of Department (HODs), security guards and administrators. The application layer is a Node.js backend that manages gate pass processing, authentication and communication between modules. MongoDB stores user profiles, gate pass requests and entry and exit records, and a cloud service manages facial images. A facial recognition layer uses the VGG-Face deep learning model to extract facial embeddings and confirm a student's identity at the gate.
The workflow runs in a clear sequence. A registered student submits a gate pass request, and the system notifies the parent for confirmation. The HOD then approves or rejects the request. At the gate, the security guard captures the student's live image, and the system compares it against the stored facial data. Access is allowed only if the pass is valid and the identity matches. Each entry or exit is automatically recorded, giving administrators a complete audit trail and reporting capability.
The report documents the system's design through architecture and UML diagrams (use case, class and sequence), together with its methodology, implementation and results. Screenshots of each portal show the working system, and a set of test cases covers registration, login, request approval and face verification. The report also includes a literature survey of existing facial recognition, RFID and digital pass systems. It identifies the research gap that none of them combines approval, parent confirmation and biometric verification in one process, and the proposed system addresses exactly that gap.
Overall, the project offers an efficient, transparent and scalable way to strengthen campus security, reduce paperwork and human error, and improve accountability.

**Student Registration**
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 42 PM" src="https://github.com/user-attachments/assets/a39c52f6-bb73-40de-af38-58187a8dc08e" />

**HOD Portal**
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 43 PM (1)" src="https://github.com/user-attachments/assets/a98cd45f-225e-4ff5-8540-56f86c98ac06" />

**Student request for Gate Pass**
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 44 PM (2)" src="https://github.com/user-attachments/assets/5b38cba7-c419-45e5-968d-26ea0886bb35" />

**HOD Approval**
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 45 PM (1)" src="https://github.com/user-attachments/assets/f5ec0a90-a55d-4711-a78a-3d9dd1c673c3" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 45 PM (2)" src="https://github.com/user-attachments/assets/ba0d42e9-88b5-4b39-a614-3448cd0fa85d" />

**Security Guard Portal**
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 45 PM (3)" src="https://github.com/user-attachments/assets/082fc8fc-6cad-431d-a24b-2f82f9cc17a0" />

**Face Scan of Student for Verification**
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 46 PM" src="https://github.com/user-attachments/assets/c54fd7e1-26e7-48c9-9f36-c5048a97b027" />
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 46 PM (1)" src="https://github.com/user-attachments/assets/a1713fb2-d556-478e-8611-eb5d3d063bc3" />

**Administrator Portal**
<img width="1600" height="1040" alt="WhatsApp Image 2026-10-15 at 8 55 47 PM" src="https://github.com/user-attachments/assets/88f35b51-6092-4984-8a5e-ac94cbca1d92" />

***Thankyou!!***
