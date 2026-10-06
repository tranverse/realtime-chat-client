import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { appConfig } from "@/lib/config";
import { tokenStore } from "@/lib/tokens";
import { useAuth } from "@/features/auth/useAuth";
import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types/api";

export type ConnectionStatus = "connecting" | "connected" | "offline";
interface RealtimeContextValue {
  status: ConnectionStatus;
  subscribe: (
    destination: string,
    callback: (frame: IMessage) => void,
  ) => () => void;
  publish: (destination: string, body: unknown) => boolean;
}
const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const callbacks = useRef(new Map<string, Set<(frame: IMessage) => void>>());
  const subscriptions = useRef(new Map<string, StompSubscription>());
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  const attach = useCallback((client: Client, destination: string) => {
    if (!client.connected || subscriptions.current.has(destination)) return;
    subscriptions.current.set(
      destination,
      client.subscribe(destination, (frame) =>
        callbacks.current
          .get(destination)
          ?.forEach((callback) => callback(frame)),
      ),
    );
  }, []);

  useEffect(() => {
    const activeSubscriptions = subscriptions.current;
    if (authStatus !== "authenticated") {
      const current = clientRef.current;
      clientRef.current = null;
      subscriptions.current.clear();
      if (current) void current.deactivate();
      return;
    }
    const socketUrl = /^https?:\/\//.test(appConfig.wsUrl)
      ? appConfig.wsUrl
      : `${window.location.origin}${appConfig.wsUrl.startsWith("/") ? "" : "/"}${appConfig.wsUrl}`;
    let heartbeatTimer: number | undefined;
    let configRequest: AbortController | undefined;
    function stopHeartbeat() {
      window.clearInterval(heartbeatTimer);
      configRequest?.abort();
    }
    function beat() {
      if (clientRef.current === client && client.connected) {
        client.publish({ destination: '/app/presence/heartbeat', body: '{}' });
      }
    }
    async function startHeartbeat() {
      stopHeartbeat();
      configRequest = new AbortController();
      const signal = configRequest.signal;
      let interval = 25_000;
      try {
        const { data } = await apiClient.get<ApiResponse<{ heartbeatMillis: number }>>('/presence/config', { signal });
        if (data.data.heartbeatMillis >= 1_000) interval = data.data.heartbeatMillis;
      } catch { /* Default matches the server default if configuration retrieval fails. */ }
      if (signal.aborted || clientRef.current !== client || !client.connected) return;
      beat(); heartbeatTimer = window.setInterval(beat, interval);
    }
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 4_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      beforeConnect: async () => {
        if (clientRef.current !== client) return;
        client.connectHeaders = {
          Authorization: `Bearer ${tokenStore.getAccessToken() ?? ""}`,
        };
        setStatus("connecting");
      },
      onConnect: () => {
        if (clientRef.current !== client) return;
        subscriptions.current.clear();
        callbacks.current.forEach((_, destination) =>
          attach(client, destination),
        );
        setStatus("connected");
        void startHeartbeat();
      },
      onWebSocketClose: () => { stopHeartbeat(); if (clientRef.current === client) setStatus("offline"); },
      onStompError: () => { stopHeartbeat(); if (clientRef.current === client) setStatus("offline"); },
    });
    clientRef.current = client;
    client.activate();
    return () => {
      stopHeartbeat();
      clientRef.current = null;
      activeSubscriptions.clear();
      void client.deactivate();
    };
  }, [attach, authStatus, user?.id]);

  const subscribe = useCallback(
    (destination: string, callback: (frame: IMessage) => void) => {
      const set = callbacks.current.get(destination) ?? new Set();
      set.add(callback);
      callbacks.current.set(destination, set);
      const client = clientRef.current;
      if (client) attach(client, destination);
      return () => {
        const current = callbacks.current.get(destination);
        current?.delete(callback);
        if (current?.size) return;
        callbacks.current.delete(destination);
        subscriptions.current.get(destination)?.unsubscribe();
        subscriptions.current.delete(destination);
      };
    },
    [attach],
  );
  const publish = useCallback((destination: string, body: unknown) => {
    const client = clientRef.current;
    if (!client?.connected) return false;
    client.publish({ destination, body: JSON.stringify(body) });
    return true;
  }, []);
  const value = useMemo(
    () => ({ status, subscribe, publish }),
    [publish, status, subscribe],
  );
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const value = useContext(RealtimeContext);
  if (!value)
    throw new Error("useRealtime must be used inside RealtimeProvider");
  return value;
}
