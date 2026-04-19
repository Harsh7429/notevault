{
  "name": "notevault-backend",
  "version": "0.1.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "dev": "node --watch server.js",
    "start": "node server.js"
  },
  "dependencies": {
    "@cantoo/pdf-lib": "^2.6.5",
    "@supabase/supabase-js": "^2.49.8",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^4.21.2",
    "express-rate-limit": "^8.3.1",
    "helmet": "^8.1.0",
    "http-errors": "^2.0.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^2.0.0",
    "nodemailer": "^8.0.4",
    "pdf-lib": "^1.17.1",
    "pg": "^8.16.0",
    "razorpay": "^2.9.6",
    "resend": "^6.10.0"
  }
}
