import { io } from "socket.io-client";
import { API_BASE_URL } from "../api/apiClient";

export function createSocketClient() {
  return io(API_BASE_URL || undefined, {
    path: "/socket.io",
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 20000
  });
}
