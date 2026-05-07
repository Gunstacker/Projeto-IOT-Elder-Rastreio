# Elder IoT Wokwi Monitor

Sistema web de monitoramento remoto de idosos com arquitetura IoT simulada de forma realista.

O fluxo principal usa Wokwi simulando um ESP32 conectado a um MPU6050. O ESP32 le acelerometro, giroscopio e temperatura, monta um JSON e envia para uma API Node.js local exposta na internet via ngrok. O backend calcula magnitudes, classifica risco, salva historico em PostgreSQL e atualiza o dashboard React em tempo real via Socket.IO.

## Objetivo

Demonstrar um prototipo academico de monitoramento de idosos com:

- movimento, aceleracao e rotacao;
- possivel queda por impacto;
- baixa movimentacao pos-queda;
- inatividade;
- bateria do dispositivo;
- perda de comunicacao;
- localizacao simulada ou enviada pelo celular;
- dashboard em tempo real;
- historico de eventos.

## Arquitetura

```text
Wokwi ESP32 + MPU6050
  -> HTTP POST HTTPS
  -> ngrok
  -> localhost:3000
  -> Express + PostgreSQL + classificador
  -> Socket.IO
  -> React dashboard em localhost:5173
```

O dashboard tambem tem:

- `/phone-gps`: celular envia GPS real ou simulado;
- `/local-simulator`: plano B local caso Wokwi ou ngrok falhe;
- `/wokwi-setup`: guia de configuracao da apresentacao.

## Tecnologias

- Backend: Node.js, Express, Socket.IO, PostgreSQL, pg, dotenv, cors.
- Frontend: React, Vite, Socket.IO Client, Leaflet, React Leaflet, lucide-react.
- Firmware: Arduino/C++, ESP32, Adafruit MPU6050, ArduinoJson, HTTPClient, WiFiClientSecure.
- Exposicao local: ngrok.

## Como instalar

Instale o Node.js LTS e o PostgreSQL. Se for usar Docker, suba o banco com:

```bash
docker compose up -d postgres
```

Se for usar PostgreSQL instalado diretamente na maquina, crie o banco local:

```bash
createdb elder_iot_monitor
```

Se seu usuario/senha forem diferentes, ajuste `server/.env` com:

```env
DATABASE_URL=postgres://USUARIO:SENHA@localhost:5432/elder_iot_monitor
PGSSL=false
```

Depois instale as dependencias:

```bash
cd elder-iot-wokwi-monitor
npm run install:all
```

## Como rodar backend

```bash
cd elder-iot-wokwi-monitor
npm run dev:server
```

API esperada:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Na primeira inicializacao, o backend cria automaticamente as tabelas no PostgreSQL e insere o idoso/dispositivo padrao.

## Como rodar frontend

```bash
cd elder-iot-wokwi-monitor
npm run dev:client
```

Abra:

```text
http://localhost:5173
```

## Como rodar tudo junto

```bash
cd elder-iot-wokwi-monitor
npm run dev
```

## Como rodar ngrok

Em outro terminal:

```bash
ngrok http 3000
```

Copie a URL HTTPS, por exemplo:

```text
https://abc123.ngrok-free.app
```

O endpoint final para o Wokwi sera:

```text
https://abc123.ngrok-free.app/api/iot/readings
```

## Por que usar ngrok

O Wokwi normalmente acessa a internet, mas nao consegue acessar diretamente o `localhost` do notebook.

Isto geralmente nao funciona no Wokwi:

```text
http://localhost:3000/api/iot/readings
```

O ngrok resolve criando uma URL publica HTTPS que encaminha para o backend local:

```text
Wokwi -> URL publica ngrok -> localhost:3000
```

## Como configurar Wokwi

1. Abra a pasta `wokwi/` no Wokwi.
2. Confirme que existem `sketch.ino`, `diagram.json` e `libraries.txt`.
3. Copie a URL HTTPS do ngrok.
4. No `sketch.ino`, altere:

```cpp
const char* API_URL = "https://SEU-NGROK.ngrok-free.app/api/iot/readings";
```

5. Inicie a simulacao.
6. Abra o Serial Monitor.

## Serial Monitor

```text
n = normal/parado
w = caminhada
s = sentado
l = deitado
f = queda completa
i = inatividade
b = bateria baixa
o = perda de sinal por 15 segundos
r = reset normal
h = ajuda
```

## Como testar queda

1. Backend rodando.
2. Frontend rodando.
3. ngrok ativo.
4. URL do ngrok colada no `sketch.ino`.
5. No Serial Monitor do Wokwi, digite:

```text
f
```

O backend deve receber dados brutos de acelerometro e giroscopio, calcular:

```text
accMagnitude >= 3.0g
gyroMagnitude >= 120 deg/s
```

E criar evento:

```text
FALL_IMPACT_DETECTED
```

## Como testar offline

No Serial Monitor do Wokwi:

```text
o
```

O firmware pausa o envio por 15 segundos. O backend marca o dispositivo como `OFFLINE` se ficar mais de 10 segundos sem leitura.

## Como testar por curl

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

## Celular opcional

Abra no celular:

```text
http://IP_DO_NOTEBOOK:5173/phone-gps
```

Use os botoes:

- Usar GPS real;
- Usar GPS simulado;
- Enviar localizacao agora;
- Iniciar envio automatico;
- Parar envio automatico.

## Plano B

Abra:

```text
http://localhost:5173/local-simulator
```

Essa tela envia payloads equivalentes aos do Wokwi para `/api/simulation/local-reading`. Ela deve ser usada apenas como fallback de apresentacao.

## Como apresentar

1. Rode backend.
2. Rode frontend.
3. Rode ngrok.
4. Cole a URL no Wokwi.
5. Mostre o dashboard recebendo leitura normal.
6. Digite `w` para caminhada.
7. Digite `f` para queda.
8. Mostre o evento salvo no historico.
9. Marque o evento como atendido.
10. Digite `o` e aguarde o offline.

## Limitacoes

- O ESP32 e o MPU6050 sao simulados no Wokwi.
- A localizacao pode ser simulada por rota ou enviada pelo celular.
- O ngrok e usado para permitir que o Wokwi acesse o backend local.
- Este prototipo nao deve ser usado em situacao medica real.

## Proximos passos com hardware real

1. Gravar o firmware em um ESP32 real.
2. Conectar um MPU6050 fisico nos pinos I2C.
3. Conectar o ESP32 ao Wi-Fi.
4. Alterar a URL da API para um servidor real.
5. Adicionar leitura fisica de bateria.
6. Adicionar GPS fisico, como NEO-6M, ou parear com celular.

Como o payload ja esta definido, o backend precisaria de poucas alteracoes.
