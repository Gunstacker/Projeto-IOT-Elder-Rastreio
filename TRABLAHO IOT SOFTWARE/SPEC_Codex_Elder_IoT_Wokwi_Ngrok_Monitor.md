# SPEC Codex — Elder IoT Monitor com Wokwi + ESP32 + MPU6050 + ngrok + Dashboard Local

## 0. Resumo executivo

Criar um sistema web completo de monitoramento de idosos com arquitetura IoT simulada de forma realista.

A arquitetura oficial do projeto será:

```text
[Wokwi]
ESP32 + MPU6050 simulados
        |
        | HTTP POST via ngrok
        v
[Notebook]
Backend + Dashboard + Banco local
        ^
        |
[Celular opcional]
GPS real ou painel de apoio
```

A ideia central é que o **Wokwi** simule a camada embarcada/hardware: um **ESP32** conectado via I2C a um **MPU6050**. O firmware do ESP32 deve ler acelerômetro, giroscópio e temperatura, empacotar os dados em JSON e enviar para uma API local rodando no notebook, exposta temporariamente para a internet por meio do **ngrok**.

O notebook roda:

- Backend Node.js + Express;
- WebSocket com Socket.IO;
- Banco PostgreSQL local;
- Dashboard web em React;
- Histórico de eventos;
- Algoritmo de detecção de queda;
- Mapa com localização simulada ou enviada pelo celular.

O celular é opcional e pode ser usado para:

- enviar GPS real;
- abrir um painel auxiliar;
- demonstrar o idoso/responsável em outro dispositivo;
- servir como plano B caso o Wokwi/ngrok falhe durante a apresentação.

---

# 1. Objetivo acadêmico

O objetivo do sistema é demonstrar um software de monitoramento remoto de idosos baseado em conceitos de IoT.

O sistema deve monitorar:

- movimento;
- aceleração;
- rotação;
- possível queda;
- inatividade pós-queda;
- localização;
- bateria do dispositivo;
- perda de comunicação;
- histórico de alertas;
- status do idoso em tempo real.

O sistema não possui hardware físico, mas deve usar uma simulação realista via Wokwi para representar o ESP32 e o MPU6050.

---

# 2. Justificativa da simulação

Texto para colocar no trabalho acadêmico:

> Devido à indisponibilidade física dos componentes ESP32 e MPU6050 durante o desenvolvimento do protótipo, foi utilizado o simulador Wokwi para representar a camada embarcada do sistema. No Wokwi, foi montado um circuito virtual composto por um ESP32 conectado a um MPU6050 via barramento I2C. O firmware executado no ESP32 simulado realiza a leitura dos dados de acelerômetro, giroscópio e temperatura, enviando-os por HTTP para a API do sistema. Dessa forma, o protótipo preserva a arquitetura IoT proposta, permitindo validar a comunicação dispositivo-servidor, o processamento dos dados e a geração de alertas no dashboard de monitoramento.

---

# 3. Decisão arquitetural principal

A professora está cobrando sensores/hardware. Portanto, o sistema NÃO deve depender apenas de botões fake.

O fluxo principal precisa ser:

```text
ESP32 simulado no Wokwi
lê MPU6050 simulado
envia dados brutos para API
backend interpreta os dados
dashboard exibe status em tempo real
```

O backend deve inferir queda com base nos valores brutos:

```text
ax, ay, az
gx, gy, gz
```

Não aceitar como solução principal:

```json
{
  "fallDetected": true
}
```

Isso pode até existir como campo calculado, mas não deve ser a fonte da verdade. A fonte da verdade são os dados do sensor.

---

# 4. Componentes obrigatórios

## 4.1 Wokwi

Deve conter:

- ESP32 DevKit;
- MPU6050;
- conexão I2C;
- firmware Arduino/C++ lendo o sensor;
- Wi-Fi Wokwi;
- HTTP POST para URL pública do ngrok;
- Serial Monitor para controlar os modos de simulação;
- payload JSON compatível com o backend.

## 4.2 Backend

Deve conter:

- Express;
- Socket.IO;
- PostgreSQL;
- endpoints REST;
- algoritmo de classificação de sensores;
- armazenamento de leituras e eventos;
- monitoramento de dispositivo offline;
- suporte a múltiplas fontes:
  - Wokwi;
  - celular GPS opcional;
  - simulador local opcional para plano B.

## 4.3 Frontend Dashboard

Deve conter:

- React + Vite;
- tela principal de monitoramento;
- mapa Leaflet;
- cards de status;
- painel de sensores;
- gráfico simples ou lista de leituras;
- timeline/histórico de eventos;
- alerta visual forte para queda;
- tela de configuração/ajuda para ngrok e Wokwi;
- página opcional para celular enviar GPS.

## 4.4 Celular opcional

Deve conter:

- rota `/phone-gps`;
- botão para iniciar envio de GPS real;
- fallback para GPS simulado;
- envio para backend local do notebook;
- não deve ser obrigatório para o fluxo principal do Wokwi.

---

# 5. Stack técnica recomendada

## Backend

- Node.js;
- Express;
- Socket.IO;
- pg;
- cors;
- dotenv;
- nodemon para desenvolvimento.

## Frontend

- React;
- Vite;
- Socket.IO Client;
- Leaflet;
- React Leaflet, se quiser simplificar;
- CSS puro, Tailwind ou CSS Modules.

## Wokwi

- Arduino framework;
- ESP32;
- Adafruit MPU6050;
- Adafruit Unified Sensor;
- ArduinoJson;
- HTTPClient;
- WiFi;
- WiFiClientSecure para HTTPS do ngrok.

---

# 6. Estrutura de pastas exigida

Gerar o projeto com estrutura clara:

```text
elder-iot-wokwi-monitor/
├── README.md
├── package.json
├── .env.example
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── config.js
│   │   ├── socket.js
│   │   ├── routes/
│   │   │   ├── health.routes.js
│   │   │   ├── readings.routes.js
│   │   │   ├── elders.routes.js
│   │   │   ├── devices.routes.js
│   │   │   ├── events.routes.js
│   │   │   ├── phoneLocation.routes.js
│   │   │   └── simulation.routes.js
│   │   ├── services/
│   │   │   ├── sensorClassifier.js
│   │   │   ├── eventService.js
│   │   │   ├── deviceService.js
│   │   │   ├── readingService.js
│   │   │   └── offlineMonitor.js
│   │   ├── utils/
│   │   │   ├── network.js
│   │   │   ├── validation.js
│   │   │   └── time.js
│   │   └── seed/
│   │       └── seedDefaultData.js
│   └── PostgreSQL: elder_iot_monitor
├── client/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       │   └── apiClient.js
│       ├── socket/
│       │   └── socketClient.js
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Events.jsx
│       │   ├── Elders.jsx
│       │   ├── Devices.jsx
│       │   ├── WokwiSetup.jsx
│       │   ├── PhoneGps.jsx
│       │   └── LocalFallbackSimulator.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── StatusCard.jsx
│       │   ├── AlertBanner.jsx
│       │   ├── SensorPanel.jsx
│       │   ├── MagnitudePanel.jsx
│       │   ├── DeviceStatusCard.jsx
│       │   ├── ElderProfileCard.jsx
│       │   ├── EventTimeline.jsx
│       │   ├── MapView.jsx
│       │   ├── ReadingTable.jsx
│       │   ├── ConnectionHelp.jsx
│       │   └── ScenarioLegend.jsx
│       └── styles/
│           └── global.css
├── wokwi/
│   ├── README.md
│   ├── sketch.ino
│   ├── diagram.json
│   └── libraries.txt
└── docs/
    ├── architecture.md
    ├── presentation-script.md
    ├── teacher-defense.md
    ├── testing-checklist.md
    └── future-real-hardware.md
```

---

# 7. Fluxo de comunicação

## 7.1 Fluxo principal

```text
Wokwi ESP32
  |
  | Wi-Fi Wokwi-GUEST
  |
  | HTTP POST
  v
ngrok public URL
  |
  v
localhost:3000 no notebook
  |
  v
Express API
  |
  v
PostgreSQL + Sensor Classifier
  |
  v
Socket.IO
  |
  v
Dashboard React
```

## 7.2 Exemplo de URL

Backend local:

```text
http://localhost:3000
```

ngrok:

```bash
ngrok http 3000
```

URL gerada:

```text
https://abc123.ngrok-free.app
```

ESP32 no Wokwi envia para:

```text
https://abc123.ngrok-free.app/api/iot/readings
```

---

# 8. Importante: por que usar ngrok

O Wokwi normalmente consegue acessar a internet pelo Public Gateway, mas não acessa diretamente a rede local do notebook.

Então isto geralmente NÃO funciona:

```text
http://localhost:3000/api/iot/readings
```

E isto também geralmente NÃO funciona:

```text
http://192.168.0.15:3000/api/iot/readings
```

O ngrok resolve isso criando uma URL pública que encaminha as requisições para o backend local:

```text
Wokwi -> URL pública ngrok -> localhost:3000
```

O README deve explicar isso claramente.

---

# 9. Modos de demonstração

O sistema deve ter 3 modos, para reduzir risco na apresentação.

## 9.1 Modo principal — Wokwi + ngrok

Este é o modo oficial.

```text
Wokwi envia dados reais/simulados de ESP32 + MPU6050 para backend via ngrok.
```

## 9.2 Modo complementar — Celular GPS

Celular envia localização real ou simulada para o mesmo idoso.

```text
Celular -> /api/location/phone -> backend -> dashboard
```

## 9.3 Modo emergência — Simulador local

Caso o Wokwi ou ngrok falhe, o dashboard deve ter uma tela `/local-simulator` que envia payloads parecidos com os do Wokwi.

Esse modo deve ser tratado como plano B, não como arquitetura principal.

---

# 10. Payload oficial do ESP32/Wokwi

O firmware do ESP32 deve enviar este JSON:

```json
{
  "deviceId": "ESP32_WOKWI_001",
  "deviceType": "ESP32_WOKWI_SIMULATED",
  "firmwareVersion": "1.0.0",
  "elderId": 1,
  "timestamp": "2026-05-05T18:30:00.000Z",
  "uptimeMs": 152000,
  "network": {
    "ssid": "Wokwi-GUEST",
    "rssi": -61,
    "ip": "10.10.0.2",
    "transport": "HTTP_OVER_NGROK"
  },
  "battery": {
    "level": 87,
    "charging": false,
    "voltage": 3.91
  },
  "sensors": {
    "mpu6050": {
      "accelerometer": {
        "x": 0.12,
        "y": 0.04,
        "z": 1.02,
        "unit": "g"
      },
      "gyroscope": {
        "x": 1.4,
        "y": 0.8,
        "z": 0.3,
        "unit": "deg/s"
      },
      "temperature": 31.2
    },
    "gps": {
      "latitude": -16.686891,
      "longitude": -49.264794,
      "accuracy": 8.5,
      "speed": 0.4,
      "source": "WOKWI_SIMULATED_ROUTE"
    }
  },
  "simulation": {
    "source": "WOKWI",
    "mode": "WALKING",
    "isSimulated": true,
    "scenario": "NORMAL_MOVEMENT"
  }
}
```

---

# 11. Dados que o backend deve calcular

O backend deve receber dados brutos e calcular:

```text
accMagnitude
gyroMagnitude
classificationStatus
eventType
severity
riskScore
```

## 11.1 Magnitude da aceleração

```js
accMagnitude = Math.sqrt(ax * ax + ay * ay + az * az)
```

Unidade: g.

## 11.2 Magnitude do giroscópio

```js
gyroMagnitude = Math.sqrt(gx * gx + gy * gy + gz * gz)
```

Unidade: graus por segundo.

## 11.3 Classificação

Possíveis status:

```text
NORMAL
WARNING
EMERGENCY
OFFLINE
```

Possíveis eventos:

```text
NORMAL_READING
WALKING
RESTING
FALL_IMPACT_DETECTED
POST_FALL_INACTIVITY
INACTIVITY
LOW_BATTERY
DEVICE_OFFLINE
DEVICE_ONLINE
PHONE_GPS_UPDATED
```

---

# 12. Algoritmo de detecção de queda

Criar serviço:

```text
server/src/services/sensorClassifier.js
```

## 12.1 Regras mínimas

### Queda por impacto

```text
Se accMagnitude >= 3.0g
E gyroMagnitude >= 120 deg/s
Então evento FALL_IMPACT_DETECTED.
```

### Pós-queda

```text
Se uma queda foi detectada nos últimos 15 segundos
E accMagnitude está entre 0.7g e 1.3g
E gyroMagnitude < 10 deg/s
E orientação indica deitado ou baixa movimentação
Então evento POST_FALL_INACTIVITY.
```

### Inatividade

Para apresentação, usar tempo menor:

```text
Se gyroMagnitude < 1.0 deg/s
E variação da aceleração for baixa
Por mais de 30 segundos
Então evento INACTIVITY.
```

### Bateria baixa

```text
Se battery.level <= 15
Então LOW_BATTERY.
```

### Dispositivo offline

```text
Se nenhum dado recebido há mais de 10 segundos
Então DEVICE_OFFLINE.
```

---

# 13. Código esperado do classificador

Implementar função parecida com:

```js
function calculateAccelerationMagnitude(acc) {
  return Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
}

function calculateGyroMagnitude(gyro) {
  return Math.sqrt(gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z);
}

function classifyReading(reading, previousDeviceState) {
  const acc = reading.sensors.mpu6050.accelerometer;
  const gyro = reading.sensors.mpu6050.gyroscope;
  const batteryLevel = reading.battery?.level ?? 100;

  const accMagnitude = calculateAccelerationMagnitude(acc);
  const gyroMagnitude = calculateGyroMagnitude(gyro);

  const now = Date.now();
  const recentFall =
    previousDeviceState?.lastFallAt &&
    now - new Date(previousDeviceState.lastFallAt).getTime() <= 15000;

  if (batteryLevel <= 15) {
    return {
      status: "WARNING",
      eventType: "LOW_BATTERY",
      severity: "LOW",
      riskScore: 35,
      accMagnitude,
      gyroMagnitude,
      message: "Bateria baixa no dispositivo ESP32 simulado."
    };
  }

  if (accMagnitude >= 3.0 && gyroMagnitude >= 120) {
    return {
      status: "EMERGENCY",
      eventType: "FALL_IMPACT_DETECTED",
      severity: "HIGH",
      riskScore: 95,
      accMagnitude,
      gyroMagnitude,
      message: "Impacto brusco compatível com possível queda detectado."
    };
  }

  if (recentFall && accMagnitude >= 0.7 && accMagnitude <= 1.3 && gyroMagnitude < 10) {
    return {
      status: "EMERGENCY",
      eventType: "POST_FALL_INACTIVITY",
      severity: "HIGH",
      riskScore: 90,
      accMagnitude,
      gyroMagnitude,
      message: "Usuário permanece com baixa movimentação após possível queda."
    };
  }

  if (gyroMagnitude < 1.0 && accMagnitude >= 0.8 && accMagnitude <= 1.2) {
    return {
      status: "NORMAL",
      eventType: "RESTING",
      severity: "LOW",
      riskScore: 10,
      accMagnitude,
      gyroMagnitude,
      message: "Usuário em repouso."
    };
  }

  return {
    status: "NORMAL",
    eventType: "NORMAL_READING",
    severity: "LOW",
    riskScore: 5,
    accMagnitude,
    gyroMagnitude,
    message: "Leitura dentro do padrão esperado."
  };
}

module.exports = {
  calculateAccelerationMagnitude,
  calculateGyroMagnitude,
  classifyReading
};
```

---

# 14. Backend — endpoints obrigatórios

## 14.1 Health check

```http
GET /api/health
```

Resposta:

```json
{
  "status": "ok",
  "serverTime": "2026-05-05T18:30:00.000Z",
  "localIpHints": ["192.168.0.15"],
  "message": "Elder IoT Monitor API running"
}
```

## 14.2 Receber leitura do Wokwi/ESP32

```http
POST /api/iot/readings
```

Responsabilidades:

1. Validar payload.
2. Normalizar dados.
3. Calcular magnitudes.
4. Classificar leitura.
5. Salvar leitura no banco.
6. Criar evento se necessário.
7. Atualizar status do dispositivo.
8. Emitir Socket.IO:
   - `reading:new`;
   - `device:status`;
   - `elder:status`;
   - `event:new`, se houver evento;
   - `alert:emergency`, se for emergência.
9. Retornar resposta para o ESP32.

Resposta esperada:

```json
{
  "success": true,
  "received": true,
  "classification": {
    "status": "EMERGENCY",
    "eventType": "FALL_IMPACT_DETECTED",
    "severity": "HIGH",
    "riskScore": 95,
    "message": "Impacto brusco compatível com possível queda detectado.",
    "accMagnitude": 4.65,
    "gyroMagnitude": 207.1
  }
}
```

## 14.3 Listar últimas leituras

```http
GET /api/iot/readings?elderId=1&limit=100
```

## 14.4 Listar dispositivos

```http
GET /api/devices
```

## 14.5 Status do dispositivo

```http
GET /api/devices/:deviceId/status
```

## 14.6 Listar idosos

```http
GET /api/elders
```

## 14.7 Criar idoso

```http
POST /api/elders
```

## 14.8 Atualizar idoso

```http
PUT /api/elders/:id
```

## 14.9 Listar eventos

```http
GET /api/events
```

Filtros:

```text
?elderId=1
?severity=HIGH
?resolved=false
?limit=100
```

## 14.10 Marcar evento como atendido

```http
PATCH /api/events/:id/resolve
```

Body:

```json
{
  "resolvedBy": "Responsável",
  "notes": "Contato realizado com o idoso."
}
```

## 14.11 Receber GPS do celular opcional

```http
POST /api/location/phone
```

Payload:

```json
{
  "elderId": 1,
  "source": "PHONE_GPS",
  "latitude": -16.686891,
  "longitude": -49.264794,
  "accuracy": 12,
  "timestamp": "2026-05-05T18:30:00.000Z"
}
```

## 14.12 Simulador local fallback

```http
POST /api/simulation/local-reading
```

Esse endpoint é plano B.

---

# 15. WebSocket — eventos obrigatórios

Usar Socket.IO.

## 15.1 Backend emite

```text
reading:new
event:new
device:status
elder:status
alert:emergency
location:updated
server:heartbeat
```

## 15.2 Frontend escuta

```js
socket.on("reading:new", handleNewReading);
socket.on("event:new", handleNewEvent);
socket.on("device:status", handleDeviceStatus);
socket.on("elder:status", handleElderStatus);
socket.on("alert:emergency", handleEmergencyAlert);
socket.on("location:updated", handleLocationUpdated);
```

## 15.3 Conteúdo do evento `alert:emergency`

```json
{
  "elderId": 1,
  "elderName": "Maria Aparecida",
  "deviceId": "ESP32_WOKWI_001",
  "eventType": "FALL_IMPACT_DETECTED",
  "severity": "HIGH",
  "message": "Impacto brusco compatível com possível queda detectado.",
  "latitude": -16.686891,
  "longitude": -49.264794,
  "createdAt": "2026-05-05T18:30:00.000Z"
}
```

---

# 16. Banco de dados PostgreSQL

Criar banco local:

```bash
createdb elder_iot_monitor
```

Configurar o backend com:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elder_iot_monitor
PGSSL=false
```

## 16.1 Tabela elders

```sql
CREATE TABLE IF NOT EXISTS elders (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  responsibleName TEXT,
  responsiblePhone TEXT,
  emergencyContact TEXT,
  medicalNotes TEXT,
  currentStatus TEXT DEFAULT 'NORMAL',
  lastLatitude DOUBLE PRECISION,
  lastLongitude DOUBLE PRECISION,
  lastLocationSource TEXT,
  lastSeenAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ NOT NULL,
  updatedAt TIMESTAMPTZ NOT NULL
);
```

## 16.2 Tabela devices

```sql
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  deviceId TEXT UNIQUE NOT NULL,
  elderId INTEGER NOT NULL,
  deviceType TEXT,
  firmwareVersion TEXT,
  status TEXT DEFAULT 'OFFLINE',
  batteryLevel INTEGER,
  batteryVoltage DOUBLE PRECISION,
  rssi INTEGER,
  ip TEXT,
  lastSeenAt TIMESTAMPTZ,
  lastFallAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ NOT NULL,
  updatedAt TIMESTAMPTZ NOT NULL
);
```

## 16.3 Tabela readings

```sql
CREATE TABLE IF NOT EXISTS readings (
  id SERIAL PRIMARY KEY,
  deviceId TEXT NOT NULL,
  elderId INTEGER NOT NULL,
  timestamp TIMESTAMPTZ,
  source TEXT,
  simulationMode TEXT,
  scenario TEXT,
  accX DOUBLE PRECISION,
  accY DOUBLE PRECISION,
  accZ DOUBLE PRECISION,
  gyroX DOUBLE PRECISION,
  gyroY DOUBLE PRECISION,
  gyroZ DOUBLE PRECISION,
  accMagnitude DOUBLE PRECISION,
  gyroMagnitude DOUBLE PRECISION,
  temperature DOUBLE PRECISION,
  batteryLevel INTEGER,
  batteryVoltage DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  gpsAccuracy DOUBLE PRECISION,
  gpsSource TEXT,
  rssi INTEGER,
  classificationStatus TEXT,
  eventType TEXT,
  severity TEXT,
  riskScore INTEGER,
  rawJson JSONB,
  createdAt TIMESTAMPTZ NOT NULL
);
```

## 16.4 Tabela events

```sql
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  elderId INTEGER NOT NULL,
  deviceId TEXT,
  eventType TEXT NOT NULL,
  status TEXT NOT NULL,
  severity TEXT NOT NULL,
  riskScore INTEGER,
  message TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  source TEXT,
  resolved BOOLEAN DEFAULT false,
  resolvedBy TEXT,
  resolvedNotes TEXT,
  resolvedAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ NOT NULL
);
```

## 16.5 Tabela phone_locations

```sql
CREATE TABLE IF NOT EXISTS phone_locations (
  id SERIAL PRIMARY KEY,
  elderId INTEGER NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  source TEXT,
  timestamp TIMESTAMPTZ,
  createdAt TIMESTAMPTZ NOT NULL
);
```

---

# 17. Dados iniciais

Ao iniciar o backend pela primeira vez, inserir:

## 17.1 Idoso padrão

```json
{
  "id": 1,
  "name": "Maria Aparecida",
  "age": 78,
  "responsibleName": "Carlos Silva",
  "responsiblePhone": "(62) 99999-9999",
  "emergencyContact": "(62) 98888-8888",
  "medicalNotes": "Hipertensão, histórico de tontura e risco de queda."
}
```

## 17.2 Dispositivo padrão

```json
{
  "deviceId": "ESP32_WOKWI_001",
  "elderId": 1,
  "deviceType": "ESP32_WOKWI_SIMULATED",
  "firmwareVersion": "1.0.0"
}
```

---

# 18. Frontend — rotas

Criar estas rotas:

```text
/dashboard
/events
/elders
/devices
/wokwi-setup
/phone-gps
/local-simulator
```

A rota `/` deve redirecionar para `/dashboard`.

---

# 19. Dashboard

## 19.1 Layout

O dashboard deve parecer uma central de monitoramento.

Áreas:

```text
Topo:
  Título do sistema
  Status do servidor
  Status do WebSocket

Linha 1:
  Card do idoso
  Card do dispositivo
  Card de risco atual
  Card de bateria

Linha 2:
  Painel de sensores
  Magnitudes calculadas
  Mapa

Linha 3:
  Timeline de eventos
  Últimas leituras
```

## 19.2 Cards obrigatórios

### Card: Idoso

Exibir:

```text
Nome
Idade
Responsável
Contato
Observações médicas
Status atual
Última atualização
```

### Card: Dispositivo

Exibir:

```text
Device ID
Tipo
Firmware
Status online/offline
RSSI
Bateria
Último sinal
Fonte: Wokwi
```

### Card: Risco atual

Exibir:

```text
Status: NORMAL/WARNING/EMERGENCY/OFFLINE
Risk Score
Mensagem
```

### Card: Sensores

Exibir:

```text
Acelerômetro
ax
ay
az

Giroscópio
gx
gy
gz

Temperatura
Modo de simulação
```

### Card: Magnitudes

Exibir:

```text
Magnitude aceleração
Magnitude giroscópio
Threshold queda
Threshold rotação
```

### Mapa

Exibir marcador com:

```text
Nome do idoso
Latitude
Longitude
Fonte da localização
Última atualização
```

## 19.3 Alerta de emergência

Quando o backend emitir `alert:emergency`, mostrar banner vermelho:

```text
🚨 POSSÍVEL QUEDA DETECTADA

Idoso: Maria Aparecida
Dispositivo: ESP32_WOKWI_001
Mensagem: Impacto brusco compatível com possível queda detectado.
Localização: -16.686891, -49.264794
Horário: 18:30

[Marcar como atendido]
```

O alerta deve ser chamativo para apresentação.

---

# 20. Tela Events

Rota:

```text
/events
```

Tabela com:

```text
Data/Hora
Idoso
Dispositivo
Evento
Status
Gravidade
Risk Score
Mensagem
Localização
Resolvido
Ação
```

Filtros:

```text
Todos
Emergência
Atenção
Normal
Não resolvidos
Resolvidos
```

Botão:

```text
Marcar como atendido
```

---

# 21. Tela Devices

Rota:

```text
/devices
```

Mostrar dispositivos cadastrados:

```text
ESP32_WOKWI_001
Tipo
Firmware
Idoso vinculado
Status
Bateria
Último sinal
Última queda
```

---

# 22. Tela Elders

Rota:

```text
/elders
```

CRUD simples:

Campos:

```text
Nome
Idade
Responsável
Telefone responsável
Contato emergência
Observações médicas
```

---

# 23. Tela Wokwi Setup

Rota:

```text
/wokwi-setup
```

Essa tela é muito importante para o grupo entender como apresentar.

Ela deve mostrar:

## 23.1 Checklist

```text
1. Rode o backend: npm run dev:server
2. Rode o frontend: npm run dev:client
3. Rode o ngrok: ngrok http 3000
4. Copie a URL HTTPS do ngrok
5. Cole a URL no sketch.ino do Wokwi
6. Inicie a simulação no Wokwi
7. Abra o dashboard
```

## 23.2 Campo para URL do ngrok

Exibir:

```text
URL atual do ngrok:
https://SEU-NGROK.ngrok-free.app
```

## 23.3 Endpoint final

Gerar visualmente:

```text
https://SEU-NGROK.ngrok-free.app/api/iot/readings
```

## 23.4 Comandos do Serial Monitor do Wokwi

Mostrar:

```text
n = modo normal/parado
w = modo caminhada
s = modo sentado
l = modo deitado
f = simular queda completa
i = simular inatividade
b = simular bateria baixa
o = simular perda de sinal temporária
r = restaurar bateria e modo normal
```

---

# 24. Tela Phone GPS opcional

Rota:

```text
/phone-gps
```

Essa tela deve funcionar no celular.

## 24.1 Objetivo

Permitir que o celular envie GPS real ou simulado para complementar o Wokwi.

## 24.2 Campos

```text
Status do GPS
Latitude
Longitude
Accuracy
Fonte: REAL_GPS ou SIMULATED_GPS
Último envio
Resposta da API
```

## 24.3 Botões

```text
Usar GPS real
Usar GPS simulado
Enviar localização agora
Iniciar envio automático
Parar envio automático
```

## 24.4 Importante

Se `navigator.geolocation` falhar, usar GPS simulado.

Mensagem:

```text
GPS real indisponível. Usando localização simulada para demonstração.
```

---

# 25. Simulador local fallback

Rota:

```text
/local-simulator
```

Essa rota deve gerar os mesmos payloads do Wokwi.

Uso:

- plano B;
- testes sem abrir Wokwi;
- desenvolvimento rápido.

Mas a tela deve deixar claro:

```text
Este é um simulador local de fallback. O fluxo principal da apresentação usa Wokwi + ESP32 + MPU6050.
```

---

# 26. Wokwi — arquivos obrigatórios

Criar pasta:

```text
wokwi/
```

Com:

```text
sketch.ino
diagram.json
libraries.txt
README.md
```

---

# 27. Wokwi — libraries.txt

Arquivo:

```text
wokwi/libraries.txt
```

Conteúdo:

```text
Adafruit MPU6050
Adafruit Unified Sensor
ArduinoJson
```

---

# 28. Wokwi — diagram.json

Arquivo:

```json
{
  "version": 1,
  "author": "Elder IoT Monitor",
  "editor": "wokwi",
  "parts": [
    {
      "type": "board-esp32-devkit-c-v4",
      "id": "esp",
      "top": 0,
      "left": 0,
      "attrs": {}
    },
    {
      "type": "wokwi-mpu6050",
      "id": "imu1",
      "top": -120,
      "left": 220,
      "attrs": {
        "accelX": "0",
        "accelY": "0",
        "accelZ": "1",
        "rotationX": "0",
        "rotationY": "0",
        "rotationZ": "0",
        "temperature": "31"
      }
    }
  ],
  "connections": [
    [ "esp:3V3", "imu1:VCC", "red", [] ],
    [ "esp:GND.1", "imu1:GND", "black", [] ],
    [ "esp:22", "imu1:SCL", "green", [] ],
    [ "esp:21", "imu1:SDA", "blue", [] ]
  ],
  "dependencies": {}
}
```

---

# 29. Wokwi — sketch.ino

Gerar o firmware completo abaixo e ajustar somente a URL do ngrok.

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>

Adafruit_MPU6050 mpu;

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// IMPORTANTE:
// Trocar pela URL do ngrok gerada no notebook.
// Exemplo:
// const char* API_URL = "https://abc123.ngrok-free.app/api/iot/readings";
const char* API_URL = "https://SEU-NGROK.ngrok-free.app/api/iot/readings";

const char* DEVICE_ID = "ESP32_WOKWI_001";
const char* DEVICE_TYPE = "ESP32_WOKWI_SIMULATED";
const char* FIRMWARE_VERSION = "1.0.0";
const int ELDER_ID = 1;

String currentMode = "STANDING";
String currentScenario = "NORMAL_READING";

unsigned long lastPostAt = 0;
unsigned long postIntervalMs = 2000;

unsigned long fallSequenceStartedAt = 0;
bool fallSequenceActive = false;

float batteryLevel = 92.0;
float batteryVoltage = 4.05;

int routeIndex = 0;

struct LocationPoint {
  float lat;
  float lng;
};

LocationPoint route[] = {
  {-16.686891, -49.264794},
  {-16.686840, -49.264730},
  {-16.686790, -49.264690},
  {-16.686740, -49.264650},
  {-16.686700, -49.264610},
  {-16.686680, -49.264570},
  {-16.686650, -49.264540}
};

const int routeSize = sizeof(route) / sizeof(route[0]);

float noise(float base, float variation) {
  float randomValue = random(-1000, 1000) / 1000.0;
  return base + (randomValue * variation);
}

void connectWiFi() {
  Serial.println();
  Serial.println("Conectando ao Wi-Fi Wokwi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 6);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi conectado.");
  Serial.print("IP simulado: ");
  Serial.println(WiFi.localIP());
}

void setupMpu() {
  Serial.println("Iniciando MPU6050...");

  if (!mpu.begin()) {
    Serial.println("ERRO: MPU6050 não encontrado.");
    while (true) {
      delay(1000);
    }
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("MPU6050 iniciado com sucesso.");
}

void printHelp() {
  Serial.println();
  Serial.println("=== Elder IoT Monitor - Comandos ===");
  Serial.println("n = normal/parado");
  Serial.println("w = caminhada");
  Serial.println("s = sentado");
  Serial.println("l = deitado");
  Serial.println("f = queda completa");
  Serial.println("i = inatividade");
  Serial.println("b = bateria baixa");
  Serial.println("o = simular perda de sinal por 15s");
  Serial.println("r = resetar para normal");
  Serial.println("h = ajuda");
  Serial.println("====================================");
  Serial.println();
}

void handleSerialCommands() {
  if (!Serial.available()) {
    return;
  }

  char command = Serial.read();

  switch (command) {
    case 'n':
      currentMode = "STANDING";
      currentScenario = "NORMAL_READING";
      fallSequenceActive = false;
      Serial.println("Modo alterado para STANDING.");
      break;

    case 'w':
      currentMode = "WALKING";
      currentScenario = "NORMAL_MOVEMENT";
      fallSequenceActive = false;
      Serial.println("Modo alterado para WALKING.");
      break;

    case 's':
      currentMode = "SITTING";
      currentScenario = "RESTING";
      fallSequenceActive = false;
      Serial.println("Modo alterado para SITTING.");
      break;

    case 'l':
      currentMode = "LYING";
      currentScenario = "RESTING";
      fallSequenceActive = false;
      Serial.println("Modo alterado para LYING.");
      break;

    case 'f':
      currentMode = "FALL_SEQUENCE";
      currentScenario = "FALL_SEQUENCE";
      fallSequenceActive = true;
      fallSequenceStartedAt = millis();
      Serial.println("Sequência de queda iniciada.");
      break;

    case 'i':
      currentMode = "INACTIVE";
      currentScenario = "INACTIVITY";
      fallSequenceActive = false;
      Serial.println("Modo alterado para INACTIVE.");
      break;

    case 'b':
      batteryLevel = 10.0;
      batteryVoltage = 3.45;
      currentScenario = "LOW_BATTERY";
      Serial.println("Bateria baixa simulada.");
      break;

    case 'o':
      Serial.println("Simulando perda de sinal por 15 segundos...");
      delay(15000);
      Serial.println("Sinal restaurado.");
      break;

    case 'r':
      currentMode = "STANDING";
      currentScenario = "NORMAL_READING";
      fallSequenceActive = false;
      batteryLevel = 92.0;
      batteryVoltage = 4.05;
      Serial.println("Reset para estado normal.");
      break;

    case 'h':
      printHelp();
      break;
  }
}

String getFallSequenceMode() {
  if (!fallSequenceActive) {
    return currentMode;
  }

  unsigned long elapsed = millis() - fallSequenceStartedAt;

  if (elapsed < 3000) {
    return "WALKING";
  }

  if (elapsed < 4500) {
    return "FALL_IMPACT";
  }

  if (elapsed < 14000) {
    return "POST_FALL";
  }

  return "INACTIVE";
}

void generateVirtualMpuValues(
  String mode,
  float baseAx,
  float baseAy,
  float baseAz,
  float baseGx,
  float baseGy,
  float baseGz,
  float &ax,
  float &ay,
  float &az,
  float &gx,
  float &gy,
  float &gz
) {
  // O firmware lê o MPU6050 do Wokwi, mas aplica perfis de cenário para
  // representar movimentos do idoso. Isso permite demonstrar caminhada,
  // queda e inatividade de forma controlável na apresentação.

  if (mode == "STANDING") {
    ax = noise(0.02, 0.03);
    ay = noise(0.01, 0.03);
    az = noise(1.00, 0.05);
    gx = noise(0.3, 0.2);
    gy = noise(0.2, 0.2);
    gz = noise(0.1, 0.2);
    currentScenario = "NORMAL_READING";
    return;
  }

  if (mode == "WALKING") {
    ax = noise(0.28, 0.15);
    ay = noise(0.14, 0.10);
    az = noise(1.12, 0.20);
    gx = noise(4.5, 2.0);
    gy = noise(2.1, 1.2);
    gz = noise(1.8, 1.0);
    currentScenario = "NORMAL_MOVEMENT";
    return;
  }

  if (mode == "SITTING") {
    ax = noise(0.05, 0.03);
    ay = noise(0.10, 0.03);
    az = noise(0.96, 0.04);
    gx = noise(0.2, 0.1);
    gy = noise(0.2, 0.1);
    gz = noise(0.1, 0.1);
    currentScenario = "RESTING";
    return;
  }

  if (mode == "LYING") {
    ax = noise(0.95, 0.04);
    ay = noise(0.08, 0.03);
    az = noise(0.20, 0.04);
    gx = noise(0.1, 0.1);
    gy = noise(0.1, 0.1);
    gz = noise(0.1, 0.1);
    currentScenario = "RESTING";
    return;
  }

  if (mode == "FALL_IMPACT") {
    ax = noise(2.8, 0.5);
    ay = noise(1.6, 0.4);
    az = noise(3.4, 0.6);
    gx = noise(180.0, 30.0);
    gy = noise(95.0, 25.0);
    gz = noise(40.0, 15.0);
    currentScenario = "FALL_IMPACT";
    return;
  }

  if (mode == "POST_FALL") {
    ax = noise(0.88, 0.04);
    ay = noise(0.14, 0.03);
    az = noise(0.23, 0.04);
    gx = noise(0.4, 0.3);
    gy = noise(0.3, 0.2);
    gz = noise(0.2, 0.2);
    currentScenario = "POST_FALL";
    return;
  }

  if (mode == "INACTIVE") {
    ax = noise(0.01, 0.01);
    ay = noise(0.01, 0.01);
    az = noise(0.99, 0.02);
    gx = noise(0.05, 0.03);
    gy = noise(0.04, 0.03);
    gz = noise(0.03, 0.03);
    currentScenario = "INACTIVITY";
    return;
  }

  // Fallback: usar leitura base do MPU.
  ax = baseAx;
  ay = baseAy;
  az = baseAz;
  gx = baseGx;
  gy = baseGy;
  gz = baseGz;
  currentScenario = "RAW_MPU_READING";
}

void updateBattery() {
  if (batteryLevel > 0) {
    batteryLevel -= 0.02;
  }

  if (batteryLevel < 0) {
    batteryLevel = 0;
  }

  if (batteryLevel > 15) {
    batteryVoltage = 3.55 + (batteryLevel / 100.0) * 0.65;
  }
}

LocationPoint getNextLocation() {
  LocationPoint point = route[routeIndex];

  routeIndex++;
  if (routeIndex >= routeSize) {
    routeIndex = 0;
  }

  point.lat += noise(0.0, 0.00003);
  point.lng += noise(0.0, 0.00003);

  return point;
}

bool sendReading() {
  sensors_event_t accelEvent;
  sensors_event_t gyroEvent;
  sensors_event_t tempEvent;

  mpu.getEvent(&accelEvent, &gyroEvent, &tempEvent);

  // Adafruit retorna aceleração em m/s². Converter para g.
  float baseAx = accelEvent.acceleration.x / 9.80665;
  float baseAy = accelEvent.acceleration.y / 9.80665;
  float baseAz = accelEvent.acceleration.z / 9.80665;

  // Adafruit costuma retornar giroscópio em rad/s. Converter para graus/s.
  float baseGx = gyroEvent.gyro.x * 57.2958;
  float baseGy = gyroEvent.gyro.y * 57.2958;
  float baseGz = gyroEvent.gyro.z * 57.2958;

  String effectiveMode = getFallSequenceMode();

  float ax, ay, az, gx, gy, gz;

  generateVirtualMpuValues(
    effectiveMode,
    baseAx,
    baseAy,
    baseAz,
    baseGx,
    baseGy,
    baseGz,
    ax,
    ay,
    az,
    gx,
    gy,
    gz
  );

  updateBattery();
  LocationPoint location = getNextLocation();

  StaticJsonDocument<2048> doc;

  doc["deviceId"] = DEVICE_ID;
  doc["deviceType"] = DEVICE_TYPE;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["elderId"] = ELDER_ID;
  doc["uptimeMs"] = millis();

  JsonObject network = doc.createNestedObject("network");
  network["ssid"] = WIFI_SSID;
  network["rssi"] = WiFi.RSSI();
  network["ip"] = WiFi.localIP().toString();
  network["transport"] = "HTTP_OVER_NGROK";

  JsonObject battery = doc.createNestedObject("battery");
  battery["level"] = (int)batteryLevel;
  battery["charging"] = false;
  battery["voltage"] = batteryVoltage;

  JsonObject sensors = doc.createNestedObject("sensors");
  JsonObject mpuObj = sensors.createNestedObject("mpu6050");

  JsonObject accelerometer = mpuObj.createNestedObject("accelerometer");
  accelerometer["x"] = ax;
  accelerometer["y"] = ay;
  accelerometer["z"] = az;
  accelerometer["unit"] = "g";

  JsonObject gyroscope = mpuObj.createNestedObject("gyroscope");
  gyroscope["x"] = gx;
  gyroscope["y"] = gy;
  gyroscope["z"] = gz;
  gyroscope["unit"] = "deg/s";

  mpuObj["temperature"] = tempEvent.temperature;

  JsonObject gps = sensors.createNestedObject("gps");
  gps["latitude"] = location.lat;
  gps["longitude"] = location.lng;
  gps["accuracy"] = 8.5;
  gps["speed"] = effectiveMode == "WALKING" ? 0.6 : 0.0;
  gps["source"] = "WOKWI_SIMULATED_ROUTE";

  JsonObject simulation = doc.createNestedObject("simulation");
  simulation["source"] = "WOKWI";
  simulation["mode"] = effectiveMode;
  simulation["isSimulated"] = true;
  simulation["scenario"] = currentScenario;

  String payload;
  serializeJson(doc, payload);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi desconectado. Tentando reconectar...");
    connectWiFi();
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;

  Serial.println();
  Serial.println("Enviando payload para API:");
  Serial.println(payload);

  if (!http.begin(client, API_URL)) {
    Serial.println("Falha ao iniciar HTTPClient.");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-Wokwi-ElderMonitor/1.0");
  http.addHeader("ngrok-skip-browser-warning", "true");

  int httpCode = http.POST(payload);

  Serial.print("HTTP status: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Resposta da API:");
    Serial.println(response);
  } else {
    Serial.print("Erro HTTP: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();

  return httpCode >= 200 && httpCode < 300;
}

void setup() {
  Serial.begin(115200);
  delay(500);

  randomSeed(analogRead(0));

  Serial.println("Elder IoT Monitor - ESP32 Wokwi Firmware");
  Serial.println("Inicializando...");

  connectWiFi();
  setupMpu();
  printHelp();
}

void loop() {
  handleSerialCommands();

  unsigned long now = millis();

  if (now - lastPostAt >= postIntervalMs) {
    lastPostAt = now;
    sendReading();
  }
}
```

---

# 30. Observação técnica sobre o firmware

O firmware deve sempre ler o MPU6050 real do Wokwi:

```cpp
mpu.getEvent(&accelEvent, &gyroEvent, &tempEvent);
```

Mas, para demonstrar cenários como queda, caminhada e inatividade de forma controlável, ele usa perfis de simulação por cima da leitura base.

Isso deve ser explicado assim:

> O ESP32 simulado mantém a leitura do MPU6050 via I2C. Para fins de demonstração, o firmware possui perfis de movimento que representam padrões típicos de caminhada, queda, repouso e inatividade, gerando dados compatíveis com o comportamento esperado de um sensor físico em uso real.

---

# 31. Como controlar a simulação no Wokwi

No Serial Monitor do Wokwi:

```text
w
```

Ativa caminhada.

```text
f
```

Ativa queda completa.

```text
i
```

Ativa inatividade.

```text
b
```

Simula bateria baixa.

```text
o
```

Simula perda de sinal.

---

# 32. Ngrok — instruções

## 32.1 Instalar

Baixar e configurar ngrok conforme documentação oficial.

## 32.2 Rodar backend

```bash
cd server
npm install
npm run dev
```

Backend deve aparecer:

```text
API running on http://localhost:3000
```

## 32.3 Rodar ngrok

Em outro terminal:

```bash
ngrok http 3000
```

Copiar URL HTTPS:

```text
https://abc123.ngrok-free.app
```

## 32.4 Colar no Wokwi

No `sketch.ino`:

```cpp
const char* API_URL = "https://abc123.ngrok-free.app/api/iot/readings";
```

Reiniciar simulação.

---

# 33. Frontend — instruções de execução

```bash
cd client
npm install
npm run dev
```

Abrir no notebook:

```text
http://localhost:5173
```

O Vite deve escutar em:

```js
server: {
  host: "0.0.0.0",
  port: 5173
}
```

---

# 34. Raiz — package.json

Criar um `package.json` na raiz para simplificar:

```json
{
  "name": "elder-iot-wokwi-monitor",
  "version": "1.0.0",
  "scripts": {
    "install:all": "npm install && cd server && npm install && cd ../client && npm install",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "start:server": "cd server && npm start",
    "build:client": "cd client && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

---

# 35. Backend — package.json

```json
{
  "name": "elder-iot-monitor-server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "pg": "^8.12.0",
    "socket.io": "^4.7.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

---

# 36. Client — package.json

```json
{
  "name": "elder-iot-monitor-client",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5173",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.5",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {}
}
```

---

# 37. Validação de payload

O backend deve validar:

```text
deviceId existe
elderId existe
sensors.mpu6050.accelerometer.x/y/z existem
sensors.mpu6050.gyroscope.x/y/z existem
battery.level existe
```

Se inválido:

```json
{
  "success": false,
  "error": "Payload inválido: acelerômetro ausente"
}
```

---

# 38. Normalização de unidade

O backend deve assumir:

```text
Acelerômetro em g
Giroscópio em deg/s
```

Mas se vier:

```json
"unit": "rad/s"
```

Converter para graus/s:

```js
deg = rad * 57.2958
```

---

# 39. Criação de eventos

Nem toda leitura normal precisa criar evento na tabela events.

Criar evento apenas para:

```text
FALL_IMPACT_DETECTED
POST_FALL_INACTIVITY
INACTIVITY
LOW_BATTERY
DEVICE_OFFLINE
DEVICE_ONLINE
PHONE_GPS_UPDATED
```

Para `NORMAL_READING`, salvar apenas em `readings`.

---

# 40. Antispam de eventos

Não criar 500 eventos iguais.

Implementar regra:

```text
Não criar o mesmo tipo de evento para o mesmo dispositivo se já existe evento igual nos últimos 10 segundos.
```

Exceção:

```text
FALL_IMPACT_DETECTED pode criar evento imediatamente se não houve queda nos últimos 30 segundos.
```

---

# 41. Offline monitor

Criar serviço:

```text
server/src/services/offlineMonitor.js
```

A cada 5 segundos:

1. Buscar dispositivos online.
2. Verificar `lastSeenAt`.
3. Se diferença > 10 segundos:
   - marcar OFFLINE;
   - criar evento DEVICE_OFFLINE;
   - emitir Socket.IO.

Quando dispositivo voltar:

- marcar ONLINE;
- criar evento DEVICE_ONLINE;
- emitir Socket.IO.

---

# 42. Visual do dashboard

Cores:

```text
NORMAL: verde
WARNING: amarelo/laranja
EMERGENCY: vermelho
OFFLINE: cinza
```

Sugestão:

```css
:root {
  --normal: #16a34a;
  --warning: #f59e0b;
  --emergency: #dc2626;
  --offline: #6b7280;
  --background: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
}
```

O dashboard deve ser bonito e apresentável.

---

# 43. Critérios de aceite

O sistema só está pronto se:

```text
[ ] Backend roda na porta 3000.
[ ] Frontend roda na porta 5173.
[ ] Banco PostgreSQL elder_iot_monitor existe.
[ ] Tabelas PostgreSQL são criadas automaticamente.
[ ] Dados iniciais são inseridos automaticamente.
[ ] Wokwi compila o sketch.ino.
[ ] Wokwi conecta ao Wi-Fi Wokwi-GUEST.
[ ] Wokwi envia HTTP POST para ngrok.
[ ] Backend recebe payload do Wokwi.
[ ] Backend calcula magnitude de aceleração.
[ ] Backend calcula magnitude de giroscópio.
[ ] Backend detecta queda por threshold.
[ ] Dashboard atualiza em tempo real via Socket.IO.
[ ] Mapa mostra localização.
[ ] Eventos são salvos no histórico.
[ ] Evento pode ser marcado como atendido.
[ ] Dispositivo offline é detectado.
[ ] Celular opcional consegue enviar GPS ou GPS simulado.
[ ] README explica Wokwi + ngrok.
[ ] Existe plano B com simulador local.
```

---

# 44. Testes manuais

## 44.1 Teste backend

```bash
curl http://localhost:3000/api/health
```

## 44.2 Teste POST manual

```bash
curl -X POST http://localhost:3000/api/iot/readings \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ESP32_WOKWI_001",
    "deviceType": "ESP32_WOKWI_SIMULATED",
    "firmwareVersion": "1.0.0",
    "elderId": 1,
    "network": {"ssid": "Wokwi-GUEST", "rssi": -60, "ip": "10.10.0.2"},
    "battery": {"level": 87, "charging": false, "voltage": 3.91},
    "sensors": {
      "mpu6050": {
        "accelerometer": {"x": 2.8, "y": 1.6, "z": 3.4, "unit": "g"},
        "gyroscope": {"x": 180, "y": 95, "z": 40, "unit": "deg/s"},
        "temperature": 31.2
      },
      "gps": {
        "latitude": -16.686891,
        "longitude": -49.264794,
        "accuracy": 8.5,
        "source": "TEST"
      }
    },
    "simulation": {"source": "CURL", "mode": "FALL_IMPACT", "isSimulated": true}
  }'
```

Resultado esperado:

```text
FALL_IMPACT_DETECTED
```

---

# 45. Roteiro de apresentação

## 45.1 Preparação

Antes da aula:

1. Rodar backend.
2. Rodar frontend.
3. Rodar ngrok.
4. Copiar URL no Wokwi.
5. Testar POST.
6. Testar queda.
7. Deixar dashboard aberto.

## 45.2 Fala de abertura

> Este é um sistema de monitoramento de idosos baseado em IoT. A camada embarcada foi simulada no Wokwi com um ESP32 conectado a um MPU6050 via I2C. O ESP32 executa um firmware que lê acelerômetro, giroscópio e temperatura, e envia essas leituras para uma API local exposta via ngrok. O notebook processa os dados, identifica padrões de risco e atualiza o dashboard em tempo real.

## 45.3 Demonstração normal

No Wokwi Serial Monitor, digitar:

```text
w
```

Explicar:

> Agora o ESP32 simulado está enviando leituras compatíveis com caminhada. O dashboard mostra movimento normal, magnitudes dentro do padrão e dispositivo online.

## 45.4 Demonstração de queda

No Wokwi Serial Monitor, digitar:

```text
f
```

Explicar:

> Agora o firmware simula uma sequência de queda: caminhada, impacto e baixa movimentação após o impacto. O backend não recebe simplesmente um botão de alerta; ele recebe dados brutos de acelerômetro e giroscópio, calcula as magnitudes e identifica a possível queda.

## 45.5 Demonstração de histórico

Mostrar evento salvo:

```text
FALL_IMPACT_DETECTED
POST_FALL_INACTIVITY
```

Clicar:

```text
Marcar como atendido
```

## 45.6 Demonstração offline

No Wokwi Serial Monitor:

```text
o
```

Esperar 10 segundos.

Mostrar:

```text
Dispositivo offline
```

## 45.7 Fechamento

> A arquitetura foi pensada para permitir a troca futura do Wokwi por um ESP32 físico sem alterar o backend. O hardware físico enviaria o mesmo JSON para a mesma API.

---

# 46. Texto para defender para a professora

> Professora, a simulação não é apenas uma tela fake. O sistema usa o Wokwi como camada embarcada, com um ESP32 virtual conectado a um MPU6050 virtual por I2C. O firmware lê o sensor, gera dados de aceleração, rotação, temperatura, bateria, sinal e localização simulada, e transmite essas informações para o backend usando HTTP, como um dispositivo IoT faria. O backend interpreta as leituras, calcula magnitudes vetoriais e detecta eventos críticos como queda, inatividade e perda de sinal.

---

# 47. Limitações assumidas

Documentar:

```text
- O ESP32 é simulado no Wokwi.
- O MPU6050 é simulado no Wokwi.
- A localização pode ser simulada por rota ou enviada pelo celular.
- O ngrok é usado para permitir que o Wokwi acesse o backend local.
- O protótipo não deve ser usado em situação médica real.
```

---

# 48. Evolução futura com hardware real

Explicar:

```text
Para substituir a simulação por hardware físico, seria necessário:
1. Gravar o firmware em um ESP32 real.
2. Conectar um MPU6050 real aos pinos I2C.
3. Conectar o ESP32 ao Wi-Fi.
4. Alterar a URL da API para o servidor real.
5. Adicionar bateria física ou leitura analógica.
6. Adicionar GPS real, como NEO-6M, ou parear com celular.
```

Como o payload já está definido, o backend não precisaria mudar muito.

---

# 49. README obrigatório

O README deve conter:

```text
1. Nome do projeto
2. Objetivo
3. Arquitetura
4. Tecnologias
5. Como instalar
6. Como rodar backend
7. Como rodar frontend
8. Como rodar ngrok
9. Como configurar Wokwi
10. Como usar Serial Monitor
11. Como conectar celular opcional
12. Como testar queda
13. Como testar offline
14. Como apresentar
15. Limitações
16. Próximos passos com hardware físico
```

---

# 50. Prompt final para o Codex

Use este comando principal no Codex:

```text
Crie um sistema completo chamado "Elder IoT Wokwi Monitor" seguindo integralmente esta especificação.

A arquitetura principal deve usar Wokwi simulando um ESP32 conectado a um MPU6050. O firmware do ESP32 deve ler o MPU6050, gerar leituras de acelerômetro, giroscópio, temperatura, bateria, Wi-Fi e localização simulada, e enviar esses dados por HTTP POST para uma API Node.js local exposta via ngrok.

O notebook deve rodar o backend Express, Socket.IO, PostgreSQL e o dashboard React. O dashboard deve atualizar em tempo real, exibir os dados brutos do sensor, magnitudes calculadas, status do idoso, mapa, dispositivo, bateria, eventos e alertas de emergência.

O backend deve inferir queda a partir de dados brutos do acelerômetro e giroscópio. Não deve depender de um campo fallDetected enviado pelo simulador.

Crie também uma página opcional para celular enviar GPS real ou simulado, uma tela de setup do Wokwi/ngrok e um simulador local de fallback.

Inclua:
- backend completo;
- frontend completo;
- banco PostgreSQL;
- WebSocket;
- classificador de sensores;
- detecção de queda;
- detecção de offline;
- histórico de eventos;
- tela de idosos;
- tela de dispositivos;
- mapa Leaflet;
- sketch.ino para Wokwi;
- diagram.json para Wokwi;
- libraries.txt;
- README detalhado;
- roteiro de apresentação.

O sistema deve ser apresentável para uma professora exigente, deixando claro que a camada de hardware foi simulada de forma realista no Wokwi.
```

---

# 51. Checklist final da apresentação

Antes de apresentar, validar:

```text
[ ] Backend local funcionando.
[ ] Frontend funcionando.
[ ] ngrok ativo.
[ ] URL ngrok colada no Wokwi.
[ ] Wokwi conectado ao Wi-Fi.
[ ] Wokwi enviando dados.
[ ] Dashboard recebendo dados.
[ ] Comando w mostra caminhada.
[ ] Comando f mostra queda.
[ ] Evento de queda aparece no histórico.
[ ] Mapa atualiza localização.
[ ] Comando o mostra offline.
[ ] Simulador local fallback funciona.
[ ] Celular opcional funciona, se for usado.
```

---

# 52. Frase final para documentação

> O projeto demonstra uma arquitetura IoT completa, na qual um nó embarcado simulado no Wokwi coleta dados de movimento por meio de um MPU6050 virtual e os transmite para uma aplicação web. A aplicação processa os dados recebidos, identifica padrões de risco e disponibiliza o monitoramento em tempo real para o responsável, permitindo validar o funcionamento do sistema mesmo sem os componentes físicos.
