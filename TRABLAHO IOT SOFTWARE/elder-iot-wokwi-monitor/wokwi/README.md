# Wokwi - ESP32 + MPU6050

Esta pasta contem a camada embarcada simulada do projeto.

Arquivos:

- `sketch.ino`: firmware do ESP32 simulado.
- `diagram.json`: ESP32 DevKit ligado ao MPU6050 via I2C.
- `libraries.txt`: bibliotecas Arduino necessarias no Wokwi.

## Configurar URL da API

1. Rode o backend local em `http://localhost:3000`.
2. Rode `ngrok http 3000`.
3. Copie a URL HTTPS gerada.
4. No `sketch.ino`, altere:

```cpp
const char* API_URL = "https://SEU-NGROK.ngrok-free.app/api/iot/readings";
```

## Comandos no Serial Monitor

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

O firmware sempre chama `mpu.getEvent(...)` para ler o MPU6050 virtual. Para demonstracao, ele aplica perfis de movimento sobre a leitura base para representar caminhada, queda, repouso e inatividade.
