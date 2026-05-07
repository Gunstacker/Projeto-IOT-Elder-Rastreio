import { useEffect, useState } from "react";
import { LocateFixed } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

const markerIcon = L.divIcon({
  className: "map-marker",
  html: "<span></span>",
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

function MapUpdater({ center, focusRequest }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  useEffect(() => {
    if (focusRequest > 0) {
      map.setView(center, 18, { animate: true });
    }
  }, [center, focusRequest, map]);

  return null;
}

export default function MapView({ elder }) {
  const [focusRequest, setFocusRequest] = useState(0);
  const hasLocation = Number.isFinite(Number(elder?.lastLatitude)) && Number.isFinite(Number(elder?.lastLongitude));
  const lat = hasLocation ? Number(elder.lastLatitude) : -16.686891;
  const lng = hasLocation ? Number(elder.lastLongitude) : -49.264794;
  const center = [lat, lng];

  return (
    <section className="card map-card">
      <div className="section-heading">
        <div>
          <h2>Localizacao do idoso</h2>
          <span>{elder?.lastLocationSource || "rota simulada"}</span>
        </div>
        <button
          className="button button-secondary button-small"
          onClick={() => setFocusRequest((count) => count + 1)}
          disabled={!hasLocation}
        >
          <LocateFixed size={16} /> Focar idoso
        </button>
      </div>
      <MapContainer center={center} zoom={16} scrollWheelZoom={false} className="map-container">
        <MapUpdater center={center} focusRequest={focusRequest} />
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasLocation ? (
          <Marker position={center} icon={markerIcon}>
            <Popup>
              <strong>{elder?.name || "Idoso monitorado"}</strong>
              <br />
              Latitude: {lat.toFixed(6)}
              <br />
              Longitude: {lng.toFixed(6)}
              <br />
              Fonte: {elder?.lastLocationSource || "GPS"}
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>
      {!hasLocation ? <p className="empty-state">Aguardando GPS real do celular.</p> : null}
    </section>
  );
}
