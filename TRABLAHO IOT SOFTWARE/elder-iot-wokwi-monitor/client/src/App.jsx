import { useEffect, useMemo, useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Elders from "./pages/Elders";
import Devices from "./pages/Devices";
import Notifications from "./pages/Notifications";
import PhoneGps from "./pages/PhoneGps";
import LocalFallbackSimulator from "./pages/LocalFallbackSimulator";
import ToastCenter from "./components/ToastCenter";
import { api } from "./api/apiClient";
import { createSocketClient } from "./socket/socketClient";
import { eventMeta } from "./constants/monitoring";

const routeMap = {
  "/dashboard": Dashboard,
  "/events": Events,
  "/elders": Elders,
  "/devices": Devices,
  "/notifications": Notifications,
  "/phone-gps": PhoneGps,
  "/local-simulator": LocalFallbackSimulator
};

function normalizePath(pathname) {
  if (pathname === "/") {
    return "/dashboard";
  }
  return routeMap[pathname] ? pathname : "/dashboard";
}

function initialSelectedElderId() {
  const fromUrl = new URLSearchParams(window.location.search).get("elderId");
  const fromStorage = window.localStorage.getItem("selectedElderId");
  const selected = Number(fromUrl || fromStorage);
  return Number.isInteger(selected) && selected > 0 ? selected : null;
}

function isSmartphoneDevice(device) {
  return String(device?.deviceType || "").toUpperCase().includes("SMARTPHONE");
}

export default function App() {
  const [path, setPath] = useState(normalizePath(window.location.pathname));
  const [health, setHealth] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [elders, setElders] = useState([]);
  const [devices, setDevices] = useState([]);
  const [readings, setReadings] = useState([]);
  const [events, setEvents] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isBooting, setIsBooting] = useState(true);
  const [selectedElderId, setSelectedElderId] = useState(initialSelectedElderId);

  const activePage = routeMap[path] || Dashboard;

  function navigate(nextPath) {
    const normalized = normalizePath(nextPath);
    window.history.pushState({}, "", normalized);
    setPath(normalized);
  }

  async function loadInitialData() {
    try {
      const [healthData, eldersData, devicesData, readingsData, eventsData] =
        await Promise.all([
          api.health(),
          api.elders(),
          api.devices(),
          api.readings(100),
          api.events("?limit=100")
        ]);

      setHealth(healthData);
      setElders(eldersData.data || []);
      setDevices(devicesData.data || []);
      setReadings(readingsData.data || []);
      setEvents(eventsData.data || []);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsBooting(false);
    }
  }

  function pushToast(event) {
    const meta = eventMeta(event.eventType);
    const id = `${event.id || event.eventType}-${Date.now()}`;
    setToasts((current) => [
      {
        id,
        eventType: event.eventType,
        title: meta.label,
        message: event.message || meta.description,
        tone: meta.tone,
        createdAt: event.createdAt
      },
      ...current
    ].slice(0, 4));

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 7000);
  }

  useEffect(() => {
    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", "/dashboard");
    }

    loadInitialData();

    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!elders.length) {
      return;
    }

    const selectedExists = elders.some((elder) => elder.id === selectedElderId);
    if (!selectedElderId || !selectedExists) {
      setSelectedElderId(elders[0].id);
    }
  }, [elders, selectedElderId]);

  useEffect(() => {
    if (selectedElderId) {
      window.localStorage.setItem("selectedElderId", String(selectedElderId));
    }
  }, [selectedElderId]);

  useEffect(() => {
    const socket = createSocketClient();

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("server:heartbeat", setHealth);
    socket.on("reading:new", (reading) => {
      setReadings((current) => [reading, ...current.filter((item) => item.id !== reading.id)].slice(0, 100));
    });
    socket.on("event:new", (event) => {
      setEvents((current) => [event, ...current.filter((item) => item.id !== event.id)].slice(0, 100));
      pushToast(event);
    });
    socket.on("device:status", (device) => {
      setDevices((current) => {
        const exists = current.some((item) => item.deviceId === device.deviceId);
        return exists
          ? current.map((item) => (item.deviceId === device.deviceId ? { ...item, ...device } : item))
          : [device, ...current];
      });
    });
    socket.on("elder:status", (elder) => {
      setElders((current) => {
        const exists = current.some((item) => item.id === elder.id);
        return exists
          ? current.map((item) => (item.id === elder.id ? { ...item, ...elder } : item))
          : [elder, ...current];
      });
    });
    socket.on("location:updated", (location) => {
      setElders((current) =>
        current.map((elder) =>
          elder.id === location.elderId
            ? {
                ...elder,
                lastLatitude: location.latitude,
                lastLongitude: location.longitude,
                lastLocationSource: location.source,
                lastSeenAt: location.createdAt
              }
            : elder
        )
      );
    });
    socket.on("alert:emergency", setEmergencyAlert);

    return () => socket.disconnect();
  }, []);

  async function resolveEvent(id, notes = "Contato realizado com o idoso.") {
    const response = await api.resolveEvent(id, {
      resolvedBy: "Responsavel",
      notes
    });
    setEvents((current) =>
      current.map((item) => (item.id === response.data.id ? response.data : item))
    );
    if (emergencyAlert?.eventId === response.data.id) {
      setEmergencyAlert(null);
    }
  }

  const selectedElder = useMemo(
    () => elders.find((elder) => elder.id === selectedElderId) || elders[0] || null,
    [elders, selectedElderId]
  );
  const activeElderId = selectedElder?.id || null;
  const activeDevices = useMemo(
    () => activeElderId ? devices.filter((device) => device.elderId === activeElderId) : devices,
    [devices, activeElderId]
  );
  const activePhoneDevice = useMemo(
    () =>
      activeDevices.find((device) => isSmartphoneDevice(device) && device.status === "ONLINE") || null,
    [activeDevices]
  );
  const filteredReadings = useMemo(
    () => activeElderId ? readings.filter((reading) => reading.elderId === activeElderId) : readings,
    [readings, activeElderId]
  );
  const displayReadings = useMemo(
    () => activePhoneDevice
      ? filteredReadings.filter((reading) => reading.deviceId === activePhoneDevice.deviceId)
      : filteredReadings,
    [activePhoneDevice, filteredReadings]
  );
  const filteredEvents = useMemo(
    () => activeElderId ? events.filter((event) => event.elderId === activeElderId) : events,
    [events, activeElderId]
  );
  const latestReading = displayReadings[0] || filteredReadings[0] || null;
  const selectedDevice = useMemo(
    () =>
      activePhoneDevice ||
      devices.find((device) => device.deviceId === latestReading?.deviceId) ||
      devices.find((device) => device.elderId === activeElderId) ||
      null,
    [activePhoneDevice, devices, latestReading?.deviceId, activeElderId]
  );
  const Page = activePage;

  return (
    <Layout
      path={path}
      navigate={navigate}
      health={health}
      socketConnected={socketConnected}
      loadError={loadError}
      devices={devices}
      readings={readings}
      events={events}
      isBooting={isBooting}
      elders={elders}
      selectedElderId={activeElderId}
      onSelectedElderChange={setSelectedElderId}
    >
      <Page
        health={health}
        socketConnected={socketConnected}
        elders={elders}
        setElders={setElders}
        devices={devices}
        setDevices={setDevices}
        readings={displayReadings}
        events={filteredEvents}
        setEvents={setEvents}
        latestReading={latestReading}
        selectedElder={selectedElder}
        selectedDevice={selectedDevice}
        emergencyAlert={emergencyAlert}
        setEmergencyAlert={setEmergencyAlert}
        resolveEvent={resolveEvent}
        reload={loadInitialData}
      />
      <ToastCenter
        toasts={toasts}
        onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))}
      />
    </Layout>
  );
}
