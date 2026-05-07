export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Erro HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  health: () => request("/api/health"),
  readings: (limit = 100) => request(`/api/iot/readings?limit=${limit}`),
  elders: () => request("/api/elders"),
  createElder: (payload) =>
    request("/api/elders", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateElder: (id, payload) =>
    request(`/api/elders/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  devices: () => request("/api/devices"),
  events: (query = "") => request(`/api/events${query}`),
  resolveEvent: (id, payload) =>
    request(`/api/events/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  sendPhoneLocation: (payload) =>
    request("/api/location/phone", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  registerPhone: (payload) =>
    request("/api/location/phone/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  sendPhoneSensorReading: (payload) =>
    request("/api/simulation/local-reading", {
      method: "POST",
      body: JSON.stringify({ payload })
    }),
  sendLocalSimulation: (payload) =>
    request("/api/simulation/local-reading", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
