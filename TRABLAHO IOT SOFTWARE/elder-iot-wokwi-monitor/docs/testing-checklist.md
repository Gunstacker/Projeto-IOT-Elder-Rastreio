# Checklist de testes

```text
[ ] Node.js LTS instalado.
[ ] Dependencias instaladas com npm run install:all.
[ ] Backend roda na porta 3000.
[ ] Frontend roda na porta 5173.
[ ] PostgreSQL instalado ou container iniciado com docker compose up -d postgres.
[ ] Banco elder_iot_monitor criado.
[ ] Tabelas PostgreSQL criadas automaticamente na primeira execucao.
[ ] Dados iniciais inseridos automaticamente.
[ ] GET /api/health retorna status ok.
[ ] ngrok ativo com ngrok http 3000.
[ ] URL HTTPS colada no sketch.ino.
[ ] Wokwi compila o sketch.ino.
[ ] Wokwi conecta no Wi-Fi Wokwi-GUEST.
[ ] Wokwi envia POST para /api/iot/readings.
[ ] Backend calcula magnitude de aceleracao.
[ ] Backend calcula magnitude de giroscopio.
[ ] Backend detecta FALL_IMPACT_DETECTED.
[ ] Dashboard atualiza via Socket.IO.
[ ] Mapa mostra localizacao.
[ ] Eventos aparecem no historico.
[ ] Evento pode ser marcado como atendido.
[ ] Comando o marca dispositivo como OFFLINE.
[ ] /phone-gps envia GPS real ou simulado.
[ ] /local-simulator envia payload de fallback.
```

## Teste manual rapido

```bash
curl http://localhost:3000/api/health
```

Queda por curl:

```bash
curl -X POST http://localhost:3000/api/iot/readings \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"ESP32_WOKWI_001","deviceType":"ESP32_WOKWI_SIMULATED","firmwareVersion":"1.0.0","elderId":1,"network":{"ssid":"Wokwi-GUEST","rssi":-60,"ip":"10.10.0.2"},"battery":{"level":87,"charging":false,"voltage":3.91},"sensors":{"mpu6050":{"accelerometer":{"x":2.8,"y":1.6,"z":3.4,"unit":"g"},"gyroscope":{"x":180,"y":95,"z":40,"unit":"deg/s"},"temperature":31.2},"gps":{"latitude":-16.686891,"longitude":-49.264794,"accuracy":8.5,"source":"TEST"}},"simulation":{"source":"CURL","mode":"FALL_IMPACT","isSimulated":true}}'
```
