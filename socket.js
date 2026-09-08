import jwt from "jsonwebtoken";
import { db, conversationId } from "./db.js";

// phone -> Set of connected socket ids (a user could have multiple devices)
const onlineUsers = new Map();

export function attachSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
      socket.userPhone = payload.phone;
      next();
    } catch (e) {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const phone = socket.userPhone;
    if (!onlineUsers.has(phone)) onlineUsers.set(phone, new Set());
    onlineUsers.get(phone).add(socket.id);
    io.emit("presence", { phone, online: true });

    socket.on("send_message", async ({ to, text }, ack) => {
      if (!to || !text?.trim()) return ack?.({ ok: false, error: "Missing text." });

      const id = conversationId(phone, to);
      const message = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, from: phone, text: text.trim(), ts: Date.now() };

      db.data.conversations[id] ||= [];
      db.data.conversations[id].push(message);
      await db.write();

      // deliver to recipient's active sockets, if any
      const recipientSockets = onlineUsers.get(to);
      if (recipientSockets) {
        for (const sid of recipientSockets) {
          io.to(sid).emit("new_message", message);
        }
      }

      ack?.({ ok: true, message });
    });

    socket.on("disconnect", () => {
      const set = onlineUsers.get(phone);
      set?.delete(socket.id);
      if (set && set.size === 0) {
        onlineUsers.delete(phone);
        io.emit("presence", { phone, online: false });
      }
    });
  });
}

export function isOnline(phone) {
  return onlineUsers.has(phone);
}
