import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { google } from "googleapis";

dotenv.config();

const _filename = typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : (typeof __filename !== "undefined" ? __filename : "");
const _dirname = typeof __dirname !== "undefined" ? __dirname : (typeof _filename === "string" && _filename ? path.dirname(_filename) : "");

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

async function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): Promise<string[]> {
  const files = await readdir(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const fileName = path.basename(fullPath);
    
    // Skip large or unnecessary directories
    if (["node_modules", ".next", "dist", ".git", ".aistudio", ".DS_Store", "package-lock.json"].includes(fileName)) {
      continue;
    }

    if ((await stat(fullPath)).isDirectory()) {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(express.json());

  // Google OAuth Configuration
  const APP_URL = process.env.APP_URL || "http://localhost:3000";

  const getRedirectUri = (req?: express.Request) => {
    if (!req) return `${APP_URL}/api/auth/google/callback`;
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const cleanHost = String(host).split(",")[0].trim();
    const cleanProto = String(proto).split(",")[0].trim();
    return `${cleanProto}://${cleanHost}/api/auth/google/callback`;
  };

  const getOAuth2Client = (req?: express.Request) => {
    const redirectUri = getRedirectUri(req);
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    if (tokens) {
      client.setCredentials(tokens);
    }
    return client;
  };

  if (!process.env.APP_URL) {
    console.warn("⚠️ APP_URL is not set in .env. Falling back to localhost:3000 for OAuth callback.");
  }

  const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

  // Path to store token (in a real app, use a database)
  const TOKEN_PATH = path.join(process.cwd(), "google_tokens.json");

  // Load saved tokens
  let tokens: any = null;
  if (fs.existsSync(TOKEN_PATH)) {
    tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
  }

  app.get("/api/auth/google", (req, res) => {
    try {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in server environment variables.");
        return res.status(400).json({ 
          error: "서버에 Google OAuth Client ID와 Client Secret이 설정되어 있지 않습니다. AI Studio 우측 상단의 'Settings' > 'Environment Variables' 메뉴에서 GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET을 등록해 주세요." 
        });
      }

      const client = getOAuth2Client(req);
      const url = client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent select_account"
      });
      res.json({ url });
    } catch (error: any) {
      console.error("Failed to generate Google Auth URL:", error);
      res.status(500).json({ error: error.message || "구글 로그인 링크 생성 중 서버에서 오류가 발생했습니다." });
    }
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const client = getOAuth2Client(req);
      const { tokens: newTokens } = await client.getToken(code as string);
      client.setCredentials(newTokens);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(newTokens));
      tokens = newTokens;
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Google Calendar connected successfully! You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Google Auth Callback Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/google/status", (req, res) => {
    res.json({ connected: !!tokens });
  });

  app.post("/api/auth/google/reset", (req, res) => {
    try {
      if (fs.existsSync(TOKEN_PATH)) {
        fs.unlinkSync(TOKEN_PATH);
      }
      tokens = null;
      res.json({ success: true });
    } catch (error) {
      console.error("Reset tokens error:", error);
      res.status(500).json({ error: "Failed to reset connection." });
    }
  });

  app.post("/api/consultation", async (req, res) => {
    try {
      const { name, phone, message, date, time } = req.body;

      if (!tokens) {
        console.warn("No Google Calendar tokens found. Skipping calendar sync.");
        return res.json({ success: true, warning: "Calendar not connected" });
      }

      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      const calendar = google.calendar({ version: "v3", auth: getOAuth2Client() });
      const calRes = await calendar.events.insert({
        calendarId: "primary",
        sendUpdates: "all",
        requestBody: {
          summary: `[상담신청] ${name}님`,
          description: `연락처: ${phone}\n메시지: ${message}`,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: "Asia/Seoul",
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: "Asia/Seoul",
          },
          attendees: [
            { email: "wootaengboy@daum.net" },
            { email: "wootaengboy@gmail.com" }
          ]
        },
      });

      console.log("Google Calendar Event created with attendees:", calRes.data.id);
      res.json({ success: true, calendarEventId: calRes.data.id });
    } catch (error) {
      console.error("Failed to create calendar event:", error);
      res.status(500).json({ error: "Failed to process consultation request" });
    }
  });

  // API for downloading all source code as a single file
  app.get("/api/download-source", async (req, res) => {
    try {
      const rootDir = process.cwd();
      const files = await getAllFiles(rootDir);
      let combinedContent = "";

      for (const file of files) {
        const relativePath = path.relative(rootDir, file);
        const content = await readFile(file, "utf8");
        combinedContent += `\n\n// =========================================================================\n`;
        combinedContent += `// FILE: ${relativePath}\n`;
        combinedContent += `// =========================================================================\n\n`;
        combinedContent += content;
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=full_codebase.txt");
      res.send(combinedContent);
    } catch (error) {
      console.error("Download source error:", error);
      res.status(500).json({ error: "Failed to generate source bundle." });
    }
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on("join_admin", () => {
      socket.join("admin_room");
      console.log(`Admin ${socket.id} joined admin_room`);
    });

    socket.on("send_message", (data) => {
      // Broadcast to the specific room
      io.to(data.room).emit("receive_message", data);
      // Also broadcast to the admin room so admins can see all incoming messages
      io.to("admin_room").emit("receive_message", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API Routes
  app.post("/api/subscribe", async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "이메일 주소를 입력해주세요." });
    }

    try {
      // 1. Send to Google Apps Script (if configured)
      if (process.env.GOOGLE_SCRIPT_URL) {
        try {
          await fetch(process.env.GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, date: new Date().toISOString() })
          });
        } catch (err) {
          console.error("Google Script error:", err);
          // Continue anyway to at least try other methods if any
        }
      }

      // Note: We return success even if Google Script fails, 
      // as long as the request was valid.
      res.json({ success: true });
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ error: "구독 신청 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/contact", async (req, res) => {
    const { name, contact, story, date, time } = req.body;

    if (!name || !contact || !story) {
      return res.status(400).json({ error: "모든 필드를 입력해주세요." });
    }

    // Consultation Card HTML Template
    const htmlContent = `
      <div style="font-family: 'serif', 'Georgia', serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #FFB6C1; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #111827; letter-spacing: -0.02em;">CHEOTOL Consultation Card</h1>
          <p style="margin-top: 8px; font-size: 14px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.2em;">The Journey to Your First Love</p>
        </div>
        <div style="padding: 40px; background-color: #fcfaf7;">
          <div style="margin-bottom: 32px;">
            <label style="display: block; font-size: 12px; font-weight: bold; color: #FFB6C1; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Name</label>
            <p style="margin: 0; font-size: 18px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">${name}</p>
          </div>
          <div style="margin-bottom: 32px;">
            <label style="display: block; font-size: 12px; font-weight: bold; color: #FFB6C1; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Contact Info</label>
            <p style="margin: 0; font-size: 18px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">${contact}</p>
          </div>
          ${date ? `
          <div style="margin-bottom: 32px;">
            <label style="display: block; font-size: 12px; font-weight: bold; color: #FFB6C1; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Scheduled Date & Time</label>
            <p style="margin: 0; font-size: 18px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">${date} ${time}</p>
          </div>
          ` : ''}
          <div style="margin-bottom: 32px;">
            <label style="display: block; font-size: 12px; font-weight: bold; color: #FFB6C1; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your Story</label>
            <div style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6; background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6;">
              ${story.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #d1d5db;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2026 CHEOTOL. All rights reserved.</p>
            <p style="font-size: 10px; color: #d1d5db; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.3em;">First Love Until Forever</p>
          </div>
        </div>
      </div>
    `;

    try {
      let calendarEventId = "";
      // 1. Create Google Calendar Event
      if (tokens && date && time) {
        try {
          const calendar = google.calendar({ version: "v3", auth: getOAuth2Client() });
          const startDateTime = new Date(`${date}T${time}:00`);
          const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

          const calRes = await calendar.events.insert({
            calendarId: "primary",
            sendUpdates: "all",
            requestBody: {
              summary: `[상담] ${name}님`,
              description: `연락처: ${contact}\n내용: ${story}`,
              start: { dateTime: startDateTime.toISOString() },
              end: { dateTime: endDateTime.toISOString() },
              attendees: [
                { email: "wootaengboy@daum.net" },
                { email: "wootaengboy@gmail.com" }
              ]
            },
          });
          calendarEventId = calRes.data.id || "";
          console.log("Google Calendar Event created with attendees:", calendarEventId);
        } catch (calErr) {
          console.error("Google Calendar Error:", calErr);
        }
      }

      // 2. Send Email via SMTP if credentials are configured
      let emailSent = false;
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.daum.net",
            port: parseInt(process.env.SMTP_PORT || "465"),
            secure: true, // true for 465, false for other ports
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: `"CHEOTOL Consultation" <${process.env.SMTP_USER}>`,
            to: "wootaengboy@daum.net",
            subject: `[상담신청] ${name}님의 여정 시작하기`,
            html: htmlContent,
          });
          emailSent = true;
          console.log("SMTP Email sent successfully.");
        } catch (mailErr) {
          console.error("Nodemailer SMTP email sending error:", mailErr);
        }
      } else {
        console.warn("SMTP_USER and SMTP_PASS are not configured in environment variables. Skipped sending custom SMTP mail.");
      }

      // We return success true since we registered it in Google Calendar, and on the frontend it is saved to Firestore.
      res.json({ 
        success: true, 
        emailSent, 
        calendarSynced: !!tokens,
        calendarEventId
      });
    } catch (error) {
      console.error("Email sending flow error:", error);
      // Return success even if email module fails because we secured the data in database
      res.json({ 
        success: true, 
        error: "이메일 발송에 실패했지만, 상담 카드가 안전하게 접수되었습니다." 
      });
    }
  });

  // API to delete a calendar event when a consultation request is deleted
  app.post("/api/calendar/event/delete", async (req, res) => {
    try {
      const { calendarEventId } = req.body;
      if (!calendarEventId) {
        return res.status(400).json({ error: "No calendarEventId provided" });
      }
      if (!tokens) {
        console.warn("No Google Calendar tokens found. Skipped calendar deletion.");
        return res.json({ success: false, error: "Calendar not connected" });
      }
      const calendar = google.calendar({ version: "v3", auth: getOAuth2Client() });
      await calendar.events.delete({
        calendarId: "primary",
        eventId: calendarEventId,
        sendUpdates: "all"
      });
      console.log(`Google Calendar Event ${calendarEventId} deleted.`);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete calendar event:", error);
      res.status(500).json({ error: "Failed to delete calendar event" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
