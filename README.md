# DocVault - Student Academic Document Management System

A modern, cloud-native full-stack application built for students to securely store, organize, view, and retrieve academic documents (marksheets, admit cards, registration certificates, ID proofs) using AWS S3 cloud storage.

---

## ✨ Features

- **Modern Glassmorphic UI**: Contemporary, clean interface with Plus Jakarta Sans typography, micro-interactions, responsive grids, and SVG illustrations.
- **Secure Authentication**: JWT-based authentication with bcrypt-hashed credentials (cost factor: 12) and automatic session handling.
- **Granular Document Categories**: Marksheet, Admin Card, Registration Certificate, ID Proof, and Other.
- **Multi-Format Support**: High-performance handling of PDF, JPEG, PNG, and WebP files (up to 10MB).
- **Private S3 Storage & User Isolation**: All documents are stored in private AWS S3 buckets. Document links use dynamic presigned URLs with 1-hour expiration. Each student only accesses their own documents.
- **Automated EC2 Deployment**: Single-command automated provisioning script (`deploy-ec2.sh`) with 2GB swap space to run smoothly on AWS Free Tier (`t2.micro` / `t3.micro`).

---

## 🛠️ Tech Stack

| Layer | Technology | Version / Notes |
|:---|:---|:---|
| **Frontend** | React 18, Vite 5, React Router 6 | Modern Single Page Application |
| **Styling** | Modern CSS Design System | Custom CSS variables, responsive grid, glassmorphism |
| **API Client** | Axios | Interceptors for Bearer token & 401 handling |
| **Backend** | Node.js, Express (ES Modules) | Node 20, REST API architecture |
| **Database** | PostgreSQL 15 | Managed via Prisma ORM |
| **Object Storage**| AWS S3 | Private bucket with `@aws-sdk/s3-request-presigner` |
| **Containerization**| Docker & Docker Compose | Multi-container setup behind Nginx reverse proxy |

---

## 📁 Project Structure

```
student-doc-system/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Prisma schema for User & Document models
│   ├── src/
│   │   ├── config/                 # DB and S3 configuration (IAM Role / Keys)
│   │   ├── controllers/            # Auth & Document business logic
│   │   ├── middleware/             # JWT auth & Express-validator
│   │   ├── routes/                 # API route definitions
│   │   ├── services/               # S3 SDK operations
│   │   └── index.js                # Express app entrypoint
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                    # Axios client & API endpoints
│   │   ├── components/             # Layout, ProtectedRoute, Toast
│   │   ├── context/                # AuthContext provider
│   │   ├── pages/                  # Dashboard, Upload, Login, Register
│   │   ├── App.jsx                 # Route manager
│   │   ├── main.jsx
│   │   └── styles.css              # Custom modern design system
│   ├── nginx.conf                  # Nginx reverse proxy & gzip configuration
│   ├── Dockerfile                  # Multi-stage production build
│   └── vite.config.js
├── docker-compose.yml              # PostgreSQL, Backend, Frontend orchestration
├── deploy-ec2.sh                   # Automated deployment script for AWS EC2
├── update-ec2.sh                   # Rolling update & image prune script
├── AWS_SETUP_GUIDE.md              # Step-by-step AWS account setup guide
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- AWS Account (for S3 storage)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Configure your DATABASE_URL and AWS S3 Bucket credentials in .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## ☁️ Production Deployment on AWS EC2

For complete step-by-step instructions for deploying to any **new AWS Account** (with custom IAM names, S3 bucket names, and EC2 instance names), see **[AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md)**.

### Quick Deploy:
```bash
# 1. Connect to your EC2 instance
ssh -i "your-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP

# 2. Clone repository & run deploy script
git clone <YOUR_GIT_REPO_URL> student-doc-system
cd student-doc-system
chmod +x deploy-ec2.sh update-ec2.sh
./deploy-ec2.sh
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create student account
- `POST /api/auth/login` - Authenticate and obtain JWT
- `GET /api/auth/profile` - Retrieve current user details

### Documents
- `GET /api/documents` - List student's documents (supports `?category=` filter)
- `GET /api/documents/categories` - Get category metadata
- `GET /api/documents/:id` - Fetch document details with fresh presigned view URL
- `POST /api/documents` - Upload document (`multipart/form-data`)
- `POST /api/documents/presigned-upload` - Generate presigned upload URL
- `DELETE /api/documents/:id` - Delete document from database and S3

---

## 🛡️ Security Highlights

- **Zero-Key Architecture via IAM Roles**: EC2 instances can access S3 securely through attached IAM instance roles without hardcoded AWS access keys.
- **Strict Tenant Isolation**: All queries enforce `WHERE userId = req.user.id`.
- **Pre-signed S3 URLs**: Bucket remains 100% private; clients access files through short-lived cryptographic URLs.
- **Nginx Reverse Proxy**: Shields the Node API from direct exposure on port 80.
- **Password Protection**: Salted hash using bcrypt with 12 rounds.

---

## 📄 License
MIT License.
