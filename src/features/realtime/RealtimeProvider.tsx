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
  const { status: authStatus } = useAuth();
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
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 4_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      beforeConnect: async () => {
        client.connectHeaders = {
          Authorization: `Bearer ${tokenStore.getAccessToken() ?? ""}`,
        };
        setStatus("connecting");
      },
      onConnect: () => {
        subscriptions.current.clear();
        callbacks.current.forEach((_, destination) =>
          attach(client, destination),
        );
        setStatus("connected");
      },
      onWebSocketClose: () => setStatus("offline"),
      onStompError: () => setStatus("offline"),
    });
    clientRef.current = client;
    client.activate();
    return () => {
      clientRef.current = null;
      subscriptions.current.clear();
      void client.deactivate();
    };
  }, [attach, authStatus]);

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
