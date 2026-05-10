# Elder IoT Wokwi Monitor

Prototipo academico de monitoramento remoto de idosos com arquitetura IoT simulada.

O fluxo principal usa um ESP32 com MPU6050 no Wokwi. O dispositivo simulado envia leituras de acelerometro, giroscopio, bateria, rede e localizacao para uma API Node.js. O backend classifica risco, salva historico no PostgreSQL e atualiza um dashboard React em tempo real via Socket.IO.

> Este projeto e um prototipo educacional. Nao e um produto medico pronto para uso real.

## O Que O Sistema Faz

- Monitora leituras simuladas de movimento do idoso.
- Detecta possivel queda por impacto.
- Detecta baixa movimentacao apos queda.
- Detecta inatividade.
- Detecta bateria baixa.
- Detecta perda de comunicacao do dispositivo.
- Exibe status, sensores, mapa e historico no dashboard.
- Permite marcar eventos como atendidos.
- Tem fallback local caso Wokwi ou tunel publico falhem.

## Arquitetura

```text
Wokwi ESP32 + MPU6050
  -> HTTP POST HTTPS
  -> ngrok ou Tunnelmole
  -> API Node.js/Express
  -> PostgreSQL
  -> Socket.IO
  -> Dashboard React/Vite
```

## Stack

- Backend: Node.js, Express, PostgreSQL, Socket.IO.
- Frontend: React, Vite, Leaflet, Socket.IO Client.
- Simulacao IoT: Wokwi, ESP32, MPU6050, Arduino/C++.
- Exposicao local: ngrok ou Tunnelmole.

## Como Rodar

Siga a ordem. A maioria dos erros acontece por pular etapa de banco ou editar o arquivo errado.

### 1. Subir o banco

Com Docker:

```bash
docker compose up -d postgres
```

Ou usando PostgreSQL local:

```bash
createdb elder_iot_monitor
```

### 2. Configurar ambiente do backend

Crie `server/.env` a partir do exemplo:

```bash
cd server
cp .env.example .env
```

No Windows PowerShell:

```powershell
cd server
Copy-Item .env.example .env
```

Edite `server/.env`:

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgres://USUARIO:SENHA@localhost:5432/elder_iot_monitor
PGSSL=false
OFFLINE_AFTER_SECONDS=10
OFFLINE_CHECK_INTERVAL_MS=5000
```

Importante: `.env.example` e so exemplo. Quem e carregado pela aplicacao e `server/.env`.

### 3. Instalar dependencias

Na raiz do projeto:

```bash
npm run install:all
```

### 4. Rodar backend e frontend

```bash
npm run dev
```

URLs principais:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3000
Health:   http://localhost:3000/api/health
```

Na primeira execucao, o backend cria as tabelas e insere dados iniciais automaticamente.

## Como Usar O Wokwi

1. Rode backend, frontend e banco.
2. Abra um tunel para a porta `3000`:

```bash
ngrok http 3000
```

Ou use Tunnelmole, se esse for o tunel configurado na sua maquina.

3. Copie a URL HTTPS gerada.
4. No arquivo `wokwi/sketch.ino`, altere:

```cpp
const char* API_URL = "https://SUA-URL-PUBLICA/api/iot/readings";
```

5. Inicie a simulacao no Wokwi.
6. Use o Serial Monitor:

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

## Telas Do Sistema

- `/dashboard`: painel principal.
- `/events`: historico de eventos.
- `/elders`: idosos cadastrados.
- `/devices`: dispositivos monitorados.
- `/phone-gps`: celular como fonte auxiliar de GPS/movimento.
- `/local-simulator`: fallback local para demonstracao.

## Documentacao

Leia estes arquivos antes de apresentar ou alterar o projeto:

- [APRESENTACAO_PROJETO_COMPLETA.md](./APRESENTACAO_PROJETO_COMPLETA.md): roteiro completo para apresentacao.
- [COMO_RODAR_RESUMIDO.md](./COMO_RODAR_RESUMIDO.md): passo a passo curto.
- [docs/architecture.md](./docs/architecture.md): arquitetura do sistema.
- [docs/hardware-simulado-wokwi-e-celular.md](./docs/hardware-simulado-wokwi-e-celular.md): explicacao sobre Wokwi, celular e hardware simulado.
- [docs/future-real-hardware.md](./docs/future-real-hardware.md): caminho para ESP32 fisico.
- [docs/testing-checklist.md](./docs/testing-checklist.md): checklist de testes.
- [wokwi/README.md](./wokwi/README.md): configuracao especifica do Wokwi.

## Erros Comuns

### Backend caiu com `28P01`

Senha ou usuario do PostgreSQL incorreto no `server/.env`.

### Frontend abriu, mas API falha

Verifique se o backend esta rodando em `http://localhost:3000` e se `/api/health` responde.

### Wokwi nao envia dados

O Wokwi nao acessa `localhost` diretamente. Use uma URL HTTPS publica do ngrok/Tunnelmole e cole no `API_URL`.

### HTTP 500

Olhe o terminal do backend. O erro real aparece la. Normalmente e banco, senha, banco inexistente ou payload invalido.

## Limitacoes

- O ESP32 e o MPU6050 sao simulados no Wokwi.
- A localizacao do Wokwi e simulada por rota.
- O celular depende de permissoes do navegador.
- O projeto ainda precisa de calibracao com hardware real.
- Nao ha autenticacao, deploy em nuvem ou notificacao real por WhatsApp/SMS nesta versao.

## Proximos Passos

- Gravar o firmware em um ESP32 fisico.
- Conectar um MPU6050 real.
- Calibrar thresholds com testes reais.
- Hospedar backend e banco em nuvem.
- Adicionar autenticacao.
- Adicionar notificacoes reais para responsaveis.

