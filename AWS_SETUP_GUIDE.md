# New AWS Account Deployment Guide (নতুন AWS অ্যাকাউন্টে ডিপ্লয়মেন্ট গাইড)

এই গাইডটি অনুসরণ করে আপনি আপনার **নতুন AWS অ্যাকাউন্টে** একদম নতুন IAM নাম, নতুন S3 Bucket নাম এবং নতুন EC2 Instance নাম দিয়ে **DocVault (Student Academic Document Management System)** সম্পূর্ণ ফ্রেশ ভাবে ডিপ্লয় করতে পারবেন।

---

## 🏗️ Architecture Overview

```
[ Student / User Browser ]
           │
           ▼ (HTTP Port 80)
┌─────────────────────────────────────────────────────────────┐
│ AWS EC2 (Ubuntu 24.04 / 22.04 LTS)                          │
│ Custom Instance Name: e.g. "docvault-prod-server"           │
│ IAM Role Attached: e.g. "DocVault-EC2-Role"                 │
│                                                             │
│  ┌────────────────────────┐                                 │
│  │ Frontend (Nginx)       │ :80                             │
│  └───────────┬────────────┘                                 │
│              │ /api proxy                                   │
│              ▼                                              │
│  ┌────────────────────────┐                                 │
│  │ Backend (Node/Express) │ :5000 (Internal)                │
│  └─────┬──────────────┬───┘                                 │
│        │              │                                     │
│        ▼              ▼                                     │
│  ┌───────────┐  [ AWS S3 Private Bucket ]                   │
│  │Postgres DB│  Name: e.g. "my-docvault-bucket-2026"        │
│  └───────────┘  (Presigned Temporary URLs)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## ধাপ ১: নতুন AWS S3 Bucket তৈরি করুন

1. আপনার নতুন AWS Management Console-এ লগইন করুন এবং **S3** সার্ভিসে যান।
2. **Create bucket** বাটনে ক্লিক করুন।
3. **Bucket name**: আপনার পছন্দমতো সম্পূর্ণ ইউনিক একটি নাম দিন।
   - *উদাহরণ:* `student-vault-2026-bucket` অথবা `docvault-storage-xyz` (এই নামটি মনে রাখুন বা লিখে রাখুন)।
4. **AWS Region**: আপনার পছন্দের রিজিয়ন সিলেক্ট করুন (যেমন: `ap-south-1` মুম্বাই অথবা `us-east-1` নর্থ ভার্জিনিয়া)।
5. **Block Public Access settings for this bucket**:
   - **"Block all public access" ENABLED (Checked)** রাখুন। S3 তে কোনো ফাইল পাবলিক হবে না, সব ফাইল প্রেসাইন্ড (Presigned) সিকিউর URL দিয়ে নিরাপদ থাকবে।
6. বাকি সব সেটিংস ডিফল্ট রেখে নিচে **Create bucket** বাটনে ক্লিক করুন।

### ⚙️ S3 Bucket CORS কনফিগারেশন:
1. তৈরি করা বাকেটের নামের উপর ক্লিক করুন ➔ **Permissions** ট্যাবে যান।
2. নিচে স্ক্রোল করে **Cross-origin resource sharing (CORS)** সেকশনে যান ➔ **Edit** বাটনে ক্লিক করুন।
3. নিচের JSON কোডটি পেস্ট করুন এবং **Save changes** দিন:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## ধাপ ২: নতুন IAM Role তৈরি করুন (সর্বাধিক নিরাপদ ও রেকমেন্ডেড)

EC2 Instance-এ কোনো হার্ডকোডেড সিক্রেট কি (Secret Access Key) ছাড়াই সরাসরি S3 অ্যাক্সেস দেওয়ার জন্য IAM Role ব্যবহার করাই হলো AWS বেস্ট প্র্যাকটিস।

### ২.১: IAM Policy তৈরি:
1. AWS Console-এ সার্চবারে লিখুন **IAM** ➔ **Policies**-এ যান ➔ **Create policy** বাটনে ক্লিক করুন।
2. **JSON** ট্যাব সিলেক্ট করুন এবং নিচের পলিসিটি পেস্ট করুন (*আপনার নতুন বাকেটের নাম দিয়ে `YOUR_NEW_BUCKET_NAME` পরিবর্তন করুন*):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_NEW_BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::YOUR_NEW_BUCKET_NAME"
    }
  ]
}
```
3. **Next** বাটনে ক্লিক করুন।
4. **Policy name**: আপনার ইচ্ছামতো নাম দিন, যেমন: `DocVault-S3-Policy`।
5. **Create policy** বাটনে ক্লিক করুন।

### ২.২: IAM Role তৈরি:
1. বাম পাশের মেনু থেকে **Roles** ➔ **Create role** বাটনে ক্লিক করুন।
2. **Trusted entity type**: সিলেক্ট করুন `AWS service` ➔ Use case: সিলেক্ট করুন `EC2` ➔ **Next**।
3. ফিল্টারে একটু আগে বানানো পলিসির নাম (`DocVault-S3-Policy`) লিখে সার্চ করে সিলেক্ট করুন ➔ **Next**।
4. **Role name**: দিন `DocVault-EC2-Role` (অথবা আপনার পছন্দমতো নাম)।
5. **Create role** বাটনে ক্লিক করুন।

> *(বিকল্প: আপনি যদি IAM User এবং Access Key ব্যবহার করতে চান, তবে IAM ➔ Users ➔ Create User দিয়ে `DocVault-S3-Policy` অ্যাটাচ করে Access Key তৈরি করতে পারেন)।*

---

## ধাপ ৩: নতুন EC2 Instance তৈরি করুন

1. AWS Console-এ **EC2** ড্যাশবোর্ডে যান ➔ **Launch Instance** বাটনে ক্লিক করুন।
2. **Name**: আপনার নতুন নাম দিন, যেমন: `docvault-server`।
3. **Application and OS Images (AMI)**: **Ubuntu Server 24.04 LTS** বা **22.04 LTS** (64-bit x86)।
4. **Instance type**: `t2.micro` অথবা `t3.micro` (Free tier eligible)।
5. **Key pair (login)**:
   - **Create new key pair** বাটনে ক্লিক করুন।
   - নাম দিন: `docvault-key` ➔ `.pem` ফরম্যাট সিলেক্ট করে **Create key pair** দিন এবং ফাইলটি আপনার কম্পিউটারে সেভ রাখুন।
6. **Network settings / Security Group**:
   - Create security group দিন:
     - ✅ **Allow SSH traffic from Anywhere (`0.0.0.0/0`)** বা My IP (Port 22)
     - ✅ **Allow HTTP traffic from the internet (Port 80)**
     - ✅ **Allow HTTPS traffic from the internet (Port 443)**
7. **Configure storage**: 15 GB বা 20 GB (gp3)।
8. **Advanced details** (খুব গুরুত্বপূর্ণ):
   - নিচে স্ক্রোল করে **IAM instance profile** অপশনে যান।
   - ধাপ ২.২-এ বানানো রোলটি সিলেক্ট করুন: **`DocVault-EC2-Role`**।
9. **Launch instance** বাটনে ক্লিক করুন।

---

## ধাপ ৪: EC2-তে কানেক্ট ও প্রজেক্ট ডিপ্লয়

### ৪.১: SSH দিয়ে সার্ভারে প্রবেশ করুন:
আপনার কম্পিউটারের টার্মিনাল বা PowerShell খুলে যে ফোল্ডারে আপনার `.pem` ফাইলটি আছে সেখানে যান:

```bash
# লিনাক্স বা ম্যাক ইউজারদের জন্য পারমিশন ফিক্স:
chmod 400 docvault-key.pem

# EC2-তে লগইন (YOUR_EC2_PUBLIC_IP এর জায়গায় আপনার নতুন EC2-এর পাবলিক আইপি দিন):
ssh -i "docvault-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```
*(অথবা AWS কনসোলে Instance সিলেক্ট করে সরাসরি **Connect ➔ EC2 Instance Connect** দিয়েও ব্রাউজার টার্মিনাল খুলতে পারেন)।*

### ৪.২: প্রজেক্ট কোড EC2-তে নেওয়া:
আপনার গিট রিপোজিটরি ক্লোন করুন (অথবা `scp` দিয়ে ফাইল পাঠান):
```bash
git clone <YOUR_GIT_REPO_URL> student-doc-system
cd student-doc-system
```

### ৪.৩: পারমিশন সেট করুন এবং ডিপ্লয়মেন্ট রান করুন:
```bash
chmod +x deploy-ec2.sh update-ec2.sh
./deploy-ec2.sh
```

**স্ক্রিপ্টটি স্বয়ংক্রিয়ভাবে করবে:**
- t2.micro মেমরি ক্র্যাশ ঠেকাতে 2GB Swap Memory তৈরি করবে।
- Docker এবং Docker Compose ইনস্টল করবে।
- আপনার সার্ভারের Public IP স্বয়ংক্রিয়ভাবে ডিটেক্ট করে `.env.production` কনফিগার করবে।
- আপনার কাছে S3 Bucket Name জানতে চাইলে আপনার তৈরি করা বাকেটের নাম টাইপ করে এন্টার চাপুন।
- ডাটাবেস ও কনটেইনারগুলো বিল্ড করে চালু করবে।

---

## ধাপ ৫: ওয়েবসাইট ভিজিট ও টেস্ট করুন

1. আপনার ব্রাউজারে যান:
   ```
   http://YOUR_EC2_PUBLIC_IP
   ```
2. আপনি একদম নতুন স্টাইলের **DocVault** আধুনিক ইন্টারফেস দেখতে পাবেন!
3. **Create new account**-এ গিয়ে একটি নতুন স্টুডেন্ট অ্যাকাউন্ট রেজিস্টার করুন।
4. ড্যাশবোর্ডে গিয়ে **Upload Document** বাটনে ক্লিক করে একটি টেস্ট PDF বা ইমেজ ফাইল আপলোড করুন।
5. ভিউ, ফিল্টারিং, এবং ডাউনলোড করে দেখে নিন সবকিছু ১০০% ঠিকঠাক কাজ করছে কিনা।

---

## দরকারী কমান্ড (Useful Commands)

```bash
# সব কন্টেইনারের রানিং স্ট্যাটাস দেখতে:
sudo docker compose ps

# ব্যাকএন্ডের লাইভ লগ দেখতে:
sudo docker compose logs -f backend

# ফ্রন্টএন্ড/Nginx এর লগ দেখতে:
sudo docker compose logs -f frontend

# ভবিষ্যতে কোনো কোড আপডেট করতে:
./update-ec2.sh

# সিস্টেম সম্পূর্ণ রিস্টার্ট দিতে:
sudo docker compose restart
```
