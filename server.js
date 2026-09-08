import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { loadDb } from "./src/db.js";
import authRoutes from "./src/routes/auth.js";
import contactsRoutes from "./src/routes/contacts.js";
import messagesRoutes from "./src/routes/messages.js";
import { attachSocket } from "./src/socket.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/contacts", contactsRoutes);
app.use("/messages", messagesRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
attachSocket(io);

const PORT = process.env.PORT || 4000;

loadDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Karachi Wale server running on http://localhost:${PORT}`);
  });
});
