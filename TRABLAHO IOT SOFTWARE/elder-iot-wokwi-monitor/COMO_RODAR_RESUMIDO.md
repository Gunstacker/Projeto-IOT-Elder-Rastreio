# Como rodar resumidamente

## 1. Criar banco PostgreSQL

```bash
docker compose up -d postgres
```

Ou, se estiver usando PostgreSQL instalado direto:

```bash
createdb elder_iot_monitor
```

Se precisar, crie `server/.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elder_iot_monitor
PGSSL=false
```

## 2. Instalar dependencias

```bash
cd elder-iot-wokwi-monitor
npm run install:all
```

## 3. Rodar backend e frontend

```bash
npm run dev
```

Ou separado:

```bash
npm run dev:server
npm run dev:client
```

## 4. Abrir dashboard

```text
http://localhost:5173
```

## 5. Rodar ngrok

```bash
ngrok http 3000
```

Copie a URL HTTPS e monte o endpoint:

```text
https://SUA-URL.ngrok-free.app/api/iot/readings
```

## 6. Configurar Wokwi

No `wokwi/sketch.ino`, troque:

```cpp
const char* API_URL = "https://SEU-NGROK.ngrok-free.app/api/iot/readings";
```

Inicie a simulacao no Wokwi.

## 7. Testar apresentacao

No Serial Monitor:

```text
w = caminhada
f = queda
i = inatividade
b = bateria baixa
o = offline
r = reset
```

Plano B:

```text
http://localhost:5173/local-simulator
```
