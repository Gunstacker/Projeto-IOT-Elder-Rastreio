# Roteiro de apresentacao

## Preparacao

1. Rodar backend.
2. Rodar frontend.
3. Rodar ngrok.
4. Copiar URL HTTPS no `wokwi/sketch.ino`.
5. Iniciar Wokwi.
6. Deixar dashboard aberto.

## Abertura

Este e um sistema de monitoramento de idosos baseado em IoT. A camada embarcada foi simulada no Wokwi com um ESP32 conectado a um MPU6050 via I2C. O ESP32 le acelerometro, giroscopio e temperatura, e envia essas leituras para uma API local exposta via ngrok. O notebook processa os dados, identifica padroes de risco e atualiza o dashboard em tempo real.

## Movimento normal

No Serial Monitor:

```text
w
```

Explicar que o ESP32 simulado esta enviando leituras compativeis com caminhada.

## Queda

No Serial Monitor:

```text
f
```

Explicar que o backend nao recebe um botao fake de queda. Ele recebe ax, ay, az, gx, gy e gz, calcula as magnitudes e classifica o evento por threshold.

## Historico

Mostrar:

```text
FALL_IMPACT_DETECTED
POST_FALL_INACTIVITY
```

Clicar em `Marcar como atendido`.

## Offline

No Serial Monitor:

```text
o
```

Aguardar mais de 10 segundos e mostrar o dispositivo offline.

## Fechamento

A arquitetura permite trocar o Wokwi por um ESP32 fisico mantendo o mesmo payload e a mesma API.
