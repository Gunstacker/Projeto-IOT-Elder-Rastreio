# Arquitetura

```text
[Wokwi]
ESP32 + MPU6050 simulados
        |
        | HTTP POST HTTPS
        v
[ngrok]
URL publica temporaria
        |
        v
[Notebook]
Express + Socket.IO + PostgreSQL + React
```

## Backend

O backend recebe leituras em `/api/iot/readings`, valida o payload, normaliza unidades, calcula magnitudes e classifica risco usando dados brutos:

```js
accMagnitude = sqrt(ax^2 + ay^2 + az^2)
gyroMagnitude = sqrt(gx^2 + gy^2 + gz^2)
```

Ele salva leituras em PostgreSQL, cria eventos relevantes e emite atualizacoes em tempo real via Socket.IO.

## Banco de dados

O backend usa o pacote `pg` e le a conexao por `DATABASE_URL`.

Exemplo local:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/elder_iot_monitor
PGSSL=false
```

O banco precisa existir antes de iniciar a API. As tabelas e indices sao criados automaticamente na primeira execucao.

O projeto inclui `docker-compose.yml` com um servico Postgres local opcional:

```bash
docker compose up -d postgres
```

## Frontend

O frontend exibe central de monitoramento com status do idoso, dispositivo, sensores, magnitudes, mapa, historico e alerta visual de emergencia.

## Wokwi

O firmware le o MPU6050 virtual via I2C com `mpu.getEvent(...)`. Para demonstracao, aplica perfis controlados de caminhada, queda, repouso e inatividade, preservando o formato de dados que um ESP32 fisico enviaria.
