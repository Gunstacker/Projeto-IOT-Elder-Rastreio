# Apresentacao completa do projeto Elder IoT Wokwi Monitor

## 1. Resumo do projeto

O Elder IoT Wokwi Monitor e um prototipo academico de monitoramento remoto de idosos usando uma arquitetura IoT simulada. A ideia principal e acompanhar sinais de movimento, queda, inatividade, bateria, comunicacao e localizacao de uma pessoa idosa, exibindo tudo em um dashboard web em tempo real.

O projeto simula um dispositivo embarcado com ESP32 e MPU6050 no Wokwi. Esse dispositivo envia dados para uma API Node.js, que processa as leituras, classifica o risco, salva o historico no PostgreSQL e atualiza o frontend React por Socket.IO.

Em uma frase:

> O sistema simula um dispositivo IoT vestivel para idosos, detecta situacoes de risco por dados de acelerometro e giroscopio, registra eventos e mostra alertas em tempo real para um responsavel.

## 2. Problema que o projeto tenta resolver

Idosos podem sofrer quedas, ficar muito tempo sem movimentacao ou perder contato com familiares/responsaveis. Em muitos casos, a demora para perceber uma emergencia aumenta o risco.

O projeto propõe uma solucao de monitoramento que:

- acompanha o status do idoso em tempo real;
- detecta possivel queda por impacto;
- identifica baixa movimentacao apos uma possivel queda;
- alerta sobre inatividade prolongada;
- mostra bateria baixa do dispositivo;
- detecta perda de comunicacao do dispositivo;
- exibe localizacao no mapa;
- guarda historico de eventos para acompanhamento.

## 3. Visao geral da arquitetura

```text
Wokwi
ESP32 simulado + MPU6050 simulado
        |
        | HTTP POST com JSON de sensores
        v
Tunel publico HTTPS
ngrok ou Tunnelmole
        |
        v
Backend local
Node.js + Express + PostgreSQL + Socket.IO
        |
        | eventos em tempo real
        v
Frontend
React + Vite + dashboard web
```

O Wokwi nao acessa diretamente `localhost` da maquina. Por isso usamos um tunel publico HTTPS, como ngrok ou Tunnelmole, para encaminhar as requisicoes do simulador para a API local.

## 4. Tecnologias usadas

Backend:

- Node.js;
- Express;
- PostgreSQL;
- biblioteca `pg`;
- Socket.IO;
- dotenv;
- cors.

Frontend:

- React;
- Vite;
- Socket.IO Client;
- Leaflet e React Leaflet para mapa;
- lucide-react para icones.

Dispositivo simulado:

- Wokwi;
- ESP32;
- MPU6050;
- Arduino/C++;
- ArduinoJson;
- HTTPClient;
- WiFiClientSecure.

Infraestrutura local:

- PostgreSQL local ou Docker;
- ngrok ou Tunnelmole para expor a API local;
- Node.js LTS.

## 5. O que esta rodando no projeto

### Backend

O backend roda na porta `3000` e fornece a API principal do sistema.

Funcoes do backend:

- recebe leituras do dispositivo em `/api/iot/readings`;
- valida o payload recebido;
- normaliza os dados;
- calcula magnitude de aceleracao;
- calcula magnitude de giroscopio;
- classifica o evento;
- cria registros no banco;
- atualiza o status do idoso e do dispositivo;
- gera eventos como queda, bateria baixa e offline;
- envia atualizacoes em tempo real via Socket.IO.

### Frontend

O frontend roda na porta `5173` e exibe o dashboard.

Telas principais:

- `/dashboard`: painel principal com status, sensores, mapa, eventos e leituras;
- `/events`: historico de eventos;
- `/elders`: cadastro/listagem de idosos;
- `/devices`: dispositivos vinculados;
- `/phone-gps`: uso do celular como fonte de GPS e movimento;
- `/local-simulator`: simulador local de fallback.

### Banco de dados

O projeto usa PostgreSQL. O banco precisa existir antes de iniciar a API, mas as tabelas sao criadas automaticamente na primeira execucao.

Banco esperado:

```text
elder_iot_monitor
```

Tabelas principais:

- `elders`: dados do idoso monitorado;
- `devices`: dispositivos vinculados ao idoso;
- `readings`: leituras brutas e classificadas dos sensores;
- `events`: eventos importantes, alertas e resolucoes;
- `phone_locations`: historico de localizacao enviada pelo celular.

### Wokwi

O Wokwi simula a camada embarcada do projeto.

Arquivos principais:

- `wokwi/sketch.ino`: firmware do ESP32 simulado;
- `wokwi/diagram.json`: circuito ESP32 + MPU6050;
- `wokwi/libraries.txt`: bibliotecas usadas no Wokwi;
- `wokwi/README.md`: instrucoes do simulador.

O firmware conecta no Wi-Fi do Wokwi, le o MPU6050 virtual, monta um JSON e envia para a API.

## 6. Fluxo dos dados

1. O ESP32 simulado no Wokwi le acelerometro, giroscopio e temperatura do MPU6050.
2. O firmware adiciona dados de bateria, rede, localizacao simulada e modo atual.
3. O ESP32 envia um `POST` para `/api/iot/readings`.
4. O backend valida o JSON.
5. O backend calcula:

```text
accMagnitude = sqrt(ax^2 + ay^2 + az^2)
gyroMagnitude = sqrt(gx^2 + gy^2 + gz^2)
```

6. O classificador decide se a leitura representa normalidade, caminhada, repouso, queda, inatividade ou bateria baixa.
7. O PostgreSQL salva leitura e eventos relevantes.
8. O Socket.IO atualiza o dashboard em tempo real.
9. O frontend mostra status, mapa, tabela de leituras, historico e alerta visual.

## 7. Payload enviado pelo dispositivo

O dispositivo envia um JSON com este tipo de estrutura:

```json
{
  "deviceId": "ESP32_WOKWI_001",
  "deviceType": "ESP32_WOKWI_SIMULATED",
  "firmwareVersion": "1.0.0",
  "elderId": 1,
  "timestamp": "2026-05-10T00:00:00Z",
  "network": {
    "ssid": "Wokwi-GUEST",
    "rssi": -60,
    "ip": "10.10.0.2",
    "transport": "HTTP_OVER_NGROK"
  },
  "battery": {
    "level": 92,
    "charging": false,
    "voltage": 4.05
  },
  "sensors": {
    "mpu6050": {
      "accelerometer": {
        "x": 2.8,
        "y": 1.6,
        "z": 3.4,
        "unit": "g"
      },
      "gyroscope": {
        "x": 180,
        "y": 95,
        "z": 40,
        "unit": "deg/s"
      },
      "temperature": 31.2
    },
    "gps": {
      "latitude": -16.686891,
      "longitude": -49.264794,
      "accuracy": 8.5,
      "source": "WOKWI_SIMULATED_ROUTE"
    }
  },
  "simulation": {
    "source": "WOKWI",
    "mode": "FALL_IMPACT",
    "isSimulated": true,
    "scenario": "FALL_IMPACT"
  }
}
```

Ponto importante para explicar:

> O backend nao recebe simplesmente "caiu" ou "nao caiu". Ele recebe valores brutos de aceleracao e rotacao, calcula as magnitudes e entao classifica o evento.

## 8. Classificacao de risco

O backend classifica cada leitura usando acelerometro, giroscopio, bateria e estado anterior do dispositivo.

Eventos principais:

- `NORMAL_READING`: leitura normal;
- `WALKING`: movimento compativel com caminhada;
- `RESTING`: repouso;
- `FALL_IMPACT_DETECTED`: impacto brusco compativel com queda;
- `POST_FALL_INACTIVITY`: baixa movimentacao apos possivel queda;
- `INACTIVITY`: baixa movimentacao por tempo prolongado;
- `LOW_BATTERY`: bateria baixa;
- `DEVICE_OFFLINE`: dispositivo ficou sem enviar dados;
- `DEVICE_ONLINE`: dispositivo voltou a enviar dados;
- `PHONE_GPS_UPDATED`: localizacao atualizada pelo celular.

Para queda no Wokwi/ESP32, o backend considera:

- aceleracao muito alta; ou
- aceleracao elevada combinada com rotacao alta.

Para celular, os limites sao mais rigidos para reduzir falso positivo, porque o celular pode gerar picos quando e pego na mao, virado ou sacudido.

## 9. Como a deteccao de queda funciona

A queda e detectada quando a leitura tem comportamento parecido com impacto:

- pico de aceleracao;
- pico de rotacao;
- mudanca brusca de movimento;
- possivel baixa movimentacao depois do impacto.

No Wokwi, o comando `f` inicia uma sequencia completa:

1. caminhada;
2. impacto de queda;
3. estado pos-queda;
4. inatividade.

Isso permite mostrar que o sistema nao detecta apenas um clique de botao. Ele recebe uma sequencia de leituras que simulam o comportamento esperado de uma queda.

## 10. Monitoramento offline

O backend possui um monitor de offline.

Regra atual:

- se um dispositivo online fica mais de 10 segundos sem enviar leitura, ele e marcado como `OFFLINE`;
- o sistema cria um evento `DEVICE_OFFLINE`;
- o status do idoso tambem e atualizado;
- o dashboard recebe a mudanca via Socket.IO.

No Wokwi, o comando `o` pausa o envio por 15 segundos para demonstrar a perda de comunicacao.

## 11. Celular como apoio

A tela `/phone-gps` permite usar o celular como fonte complementar de dados.

O celular pode fornecer:

- GPS real pelo navegador;
- aceleracao e rotacao por `DeviceMotionEvent`, quando o navegador permite;
- bateria, quando disponivel;
- envio automatico para o backend.

Importante:

> O celular nao substitui o ESP32 no conceito do projeto. Ele e uma fonte alternativa de dados reais do navegador, reaproveitando o mesmo contrato JSON do backend.

## 12. Simulador local de fallback

A tela `/local-simulator` e um plano B para apresentacao.

Ela permite enviar payloads equivalentes aos do Wokwi diretamente pelo frontend, passando pelo mesmo backend, mesmo banco, mesmo classificador e mesmo dashboard.

Modos disponiveis:

- normal/parado;
- caminhada;
- impacto de queda;
- pos-queda;
- inatividade;
- bateria baixa.

Como explicar:

> O fluxo principal e Wokwi + ESP32 + MPU6050. O simulador local existe apenas para reduzir risco de apresentacao se o tunel publico, a internet ou o Wokwi falharem no dia.

## 13. Como rodar o projeto

### 13.1. Banco

Com Docker:

```bash
docker compose up -d postgres
```

Ou com PostgreSQL instalado localmente:

```bash
createdb elder_iot_monitor
```

Arquivo de ambiente esperado em `server/.env`:

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgres://USUARIO:SENHA@localhost:5432/elder_iot_monitor
PGSSL=false
OFFLINE_AFTER_SECONDS=10
OFFLINE_CHECK_INTERVAL_MS=5000
```

Observacao importante:

> O arquivo `.env.example` e apenas exemplo. O backend carrega `server/.env`.

### 13.2. Dependencias

```bash
npm run install:all
```

### 13.3. Backend e frontend juntos

```bash
npm run dev
```

Enderecos:

```text
Backend:  http://localhost:3000
Frontend: http://localhost:5173
```

### 13.4. Health check

```bash
curl http://localhost:3000/api/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "message": "Elder IoT Monitor API running"
}
```

## 14. Como configurar o Wokwi

1. Rodar backend e frontend.
2. Rodar o tunel publico para a porta `3000`.
3. Copiar a URL HTTPS gerada.
4. Colar no `wokwi/sketch.ino`:

```cpp
const char* API_URL = "https://SUA-URL-PUBLICA/api/iot/readings";
```

5. Abrir o Wokwi.
6. Iniciar a simulacao.
7. Abrir o Serial Monitor.
8. Enviar comandos para mudar o comportamento do dispositivo.

Comandos do Serial Monitor:

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

## 15. Roteiro sugerido para apresentacao

### Abertura

"Nosso projeto e um sistema de monitoramento remoto de idosos usando uma arquitetura IoT. Como o hardware fisico nao foi usado nesta etapa, simulamos a camada embarcada no Wokwi com ESP32 e MPU6050, mas mantivemos o fluxo realista: sensor, firmware, rede, API, banco, classificacao e dashboard em tempo real."

### Mostrar arquitetura

Explicar o fluxo:

```text
ESP32 simulado -> tunel publico -> API Node.js -> PostgreSQL -> Socket.IO -> React
```

Destacar:

- Wokwi representa o dispositivo;
- backend processa os dados;
- dashboard apenas mostra o resultado;
- historico fica persistido no PostgreSQL.

### Demonstracao 1: leitura normal

No Wokwi, enviar:

```text
n
```

Mostrar no dashboard:

- status normal;
- dispositivo online;
- bateria;
- leitura dos sensores;
- mapa.

### Demonstracao 2: caminhada

No Wokwi, enviar:

```text
w
```

Explicar:

"Agora o ESP32 esta enviando leituras compativeis com caminhada. O backend identifica isso como movimento normal, nao como emergencia."

### Demonstracao 3: queda

No Wokwi, enviar:

```text
f
```

Mostrar:

- evento `FALL_IMPACT_DETECTED`;
- alerta de emergencia;
- risk score alto;
- historico de eventos;
- leitura com magnitudes elevadas.

Explicar:

"A queda foi detectada porque houve pico de aceleracao e rotacao. O backend calcula a magnitude vetorial, classifica o risco e gera o alerta."

### Demonstracao 4: atendimento do evento

No dashboard, marcar o evento como atendido.

Explicar:

"O sistema tambem registra o ciclo de atendimento, entao o responsavel pode sinalizar que verificou o alerta."

### Demonstracao 5: offline

No Wokwi, enviar:

```text
o
```

Aguardar mais de 10 segundos.

Mostrar:

- dispositivo offline;
- evento `DEVICE_OFFLINE`;
- alteracao de status no dashboard.

Explicar:

"Se o dispositivo parar de enviar dados, o sistema entende que houve perda de comunicacao. Isso tambem e importante, porque em IoT a ausencia de dados pode ser um problema."

### Fechamento

"Mesmo sem o hardware fisico nesta etapa, o projeto ja tem o contrato de dados definido, backend funcional, banco, dashboard em tempo real e firmware preparado para ESP32. A troca para hardware real exigiria principalmente gravar o firmware em uma placa real, conectar o MPU6050 fisico e calibrar os limites com testes reais."

## 16. Como responder sobre a ausencia de hardware fisico

Nao e recomendado tentar esconder a ausencia do hardware. A melhor defesa e assumir a limitacao e mostrar que ela foi tratada tecnicamente.

Resposta curta:

> Nesta etapa, o hardware fisico foi substituido por simulacao no Wokwi. A simulacao nao e apenas visual: existe um firmware Arduino/C++ rodando em um ESP32 virtual, lendo um MPU6050 virtual, montando JSON e enviando para a API como um dispositivo IoT faria.

Resposta completa:

> A ausencia do hardware fisico foi uma limitacao do projeto, principalmente por custo, disponibilidade de componentes, risco de montagem e tempo de calibracao. Para nao transformar isso em uma tela fake, usamos o Wokwi para simular a camada embarcada. Assim mantivemos o comportamento essencial: leitura de sensor, comunicacao pela rede, payload JSON, backend, classificacao, persistencia e dashboard em tempo real. O backend foi feito para receber dados por contrato, entao um ESP32 real poderia substituir o Wokwi mantendo praticamente o mesmo formato de envio.

Se a professora perguntar "mas isso funciona na vida real?":

> O prototipo prova a arquitetura e o software. Para uso real, ainda faltaria testar com ESP32 e MPU6050 fisicos, calibrar os thresholds com movimentos reais e validar confiabilidade em diferentes pessoas. A parte de software ja esta preparada para receber esses dados, mas nao afirmamos que esta pronto para uso medico real.

Se ela perguntar "entao a queda e fake?":

> A queda e simulada no hardware virtual, mas o processamento nao e fake. O backend recebe valores de aceleracao e giroscopio, calcula magnitudes e classifica o risco. O botao do Wokwi apenas muda o perfil de movimento do sensor simulado para gerar uma sequencia controlada de apresentacao.

Se ela perguntar "por que nao usaram um botao simples de emergencia?":

> Porque o objetivo era simular uma deteccao automatica. Um botao dependeria do idoso conseguir acionar. Aqui a proposta e identificar sinais de risco por movimento, mesmo que a pessoa nao consiga pedir ajuda.

Se ela perguntar "qual a diferenca entre simulador local e Wokwi?":

> O Wokwi e o fluxo principal porque simula a camada embarcada, com ESP32, firmware e sensor. O simulador local e apenas contingencia para apresentacao, caso internet, tunel ou Wokwi falhem. Ambos usam o mesmo backend e o mesmo classificador.

Se ela perguntar "qual seria o trabalho para ir para hardware real?":

> A arquitetura ja esta pronta para isso. O proximo passo seria gravar o firmware em um ESP32 real, conectar o MPU6050 nos pinos I2C, configurar Wi-Fi, apontar para uma API publica e calibrar os limites com testes reais. O backend e o dashboard podem continuar quase iguais.

## 17. Como lidar com perguntas dificeis

### "O sistema pode ser usado em um idoso real hoje?"

Resposta:

> Nao como produto medico pronto. Ele e um prototipo academico funcional. Para uso real seriam necessarios testes com hardware fisico, calibracao, validacao com usuarios, seguranca, disponibilidade de servidor e tratamento de falsos positivos e falsos negativos.

### "Como voces evitam falso positivo?"

Resposta:

> O classificador nao usa apenas uma leitura isolada de aceleracao. Ele combina magnitude de aceleracao, magnitude de rotacao, estado anterior, baixa movimentacao e tipo de dispositivo. No celular, os limites sao mais rigidos porque o aparelho gera picos facilmente quando e manuseado.

### "Como voces evitam falso negativo?"

Resposta:

> O prototipo ainda nao elimina falso negativo. Esse e exatamente um ponto de evolucao. Em hardware real, seria necessario coletar dados de varios movimentos, ajustar thresholds e talvez evoluir para um modelo mais robusto. O projeto atual demonstra a arquitetura e a primeira regra de classificacao.

### "Por que usar PostgreSQL?"

Resposta:

> Porque precisamos persistir historico de leituras, eventos, dispositivos, status do idoso e resolucao de alertas. PostgreSQL e adequado para dados estruturados e consultas historicas.

### "Por que usar Socket.IO?"

Resposta:

> Porque o dashboard precisa atualizar em tempo real sem ficar fazendo refresh. Quando o backend recebe uma leitura ou cria um evento, ele emite a atualizacao para o frontend imediatamente.

### "Por que usar tunel publico?"

Resposta:

> O Wokwi roda fora da maquina local e nao consegue acessar `localhost:3000` diretamente. O tunel cria uma URL HTTPS publica que encaminha para a API local.

### "O que acontece se a internet cair?"

Resposta:

> No prototipo, a comunicacao para. O backend detecta offline se parar de receber dados. Em uma versao real, seria ideal adicionar fila local no dispositivo, reconexao automatica e servidor hospedado em nuvem.

### "Onde esta a parte de IoT?"

Resposta:

> Esta no fluxo sensor-dispositivo-rede-servidor. O ESP32 simulado le sensor, envia dados pela rede, o servidor processa e o dashboard acompanha em tempo real. A simulacao substitui o hardware fisico, mas preserva a arquitetura IoT.

## 18. Pontos fortes do projeto

- Fluxo completo de ponta a ponta.
- Backend cria tabelas automaticamente.
- Dados persistidos em PostgreSQL.
- Dashboard em tempo real com Socket.IO.
- Simulacao realista com Wokwi.
- Firmware Arduino/C++ separado do backend.
- Contrato JSON preparado para hardware real.
- Mapa com localizacao.
- Historico de eventos.
- Resolucao de alertas.
- Deteccao de offline.
- Plano B local para apresentacao.
- Celular como fonte adicional de GPS e movimento.

## 19. Limitacoes assumidas

- ESP32 e MPU6050 sao simulados no Wokwi.
- A localizacao do Wokwi e simulada por rota.
- O celular depende de permissoes do navegador.
- O tunel publico depende da internet.
- Os thresholds de queda precisam de calibracao com hardware real.
- O sistema nao deve ser usado como solucao medica real.
- Nao ha autenticacao de usuario nesta versao.
- Nao ha envio real de SMS/WhatsApp nesta versao.
- Nao ha deploy em nuvem nesta etapa.

## 20. Evolucao para hardware real

Para transformar em uma versao fisica:

1. Comprar ou usar um ESP32 real.
2. Conectar um MPU6050 real via I2C.
3. Usar 3V3, GND, SDA e SCL.
4. Gravar o firmware no ESP32.
5. Configurar Wi-Fi real.
6. Apontar `API_URL` para servidor publico.
7. Adicionar leitura real de bateria.
8. Adicionar GPS real, como NEO-6M, ou manter celular como fonte de GPS.
9. Fazer testes com movimentos reais.
10. Calibrar limites de queda.
11. Adicionar autenticacao e seguranca.
12. Hospedar backend e banco em ambiente confiavel.
13. Adicionar notificacoes reais para responsaveis.

## 21. Sugestao de divisao de falas

Pessoa 1: problema e objetivo.

- explicar risco de queda em idosos;
- apresentar proposta geral;
- mostrar arquitetura em alto nivel.

Pessoa 2: hardware simulado e Wokwi.

- explicar ESP32;
- explicar MPU6050;
- mostrar comandos do Serial Monitor;
- explicar por que foi usado Wokwi.

Pessoa 3: backend e banco.

- explicar API;
- explicar PostgreSQL;
- explicar classificacao;
- explicar eventos e offline.

Pessoa 4: frontend e demonstracao.

- mostrar dashboard;
- mostrar queda;
- mostrar historico;
- mostrar mapa;
- mostrar atendimento do evento.

Pessoa 5: limitacoes e evolucao.

- assumir ausencia de hardware fisico;
- defender simulacao;
- explicar como migrar para hardware real;
- falar dos proximos passos.

## 22. Checklist antes de apresentar

```text
[ ] PostgreSQL rodando.
[ ] Banco elder_iot_monitor criado.
[ ] server/.env configurado.
[ ] npm run dev funcionando.
[ ] Backend em http://localhost:3000.
[ ] Frontend em http://localhost:5173.
[ ] /api/health retornando ok.
[ ] Tunel publico rodando para porta 3000.
[ ] URL HTTPS colada no wokwi/sketch.ino.
[ ] Wokwi compilando.
[ ] Serial Monitor aberto.
[ ] Dashboard aberto.
[ ] Teste do comando n feito.
[ ] Teste do comando w feito.
[ ] Teste do comando f feito.
[ ] Teste do comando o feito.
[ ] Simulador local testado como plano B.
```

## 23. Plano B no dia da apresentacao

Se o Wokwi falhar:

- abrir `/local-simulator`;
- enviar os mesmos cenarios por ali;
- explicar que e uma contingencia, nao o fluxo principal.

Se o tunel publico falhar:

- testar se o backend responde em `/api/health`;
- gerar nova URL do ngrok ou Tunnelmole;
- colar a nova URL no `sketch.ino`;
- reiniciar simulacao.

Se o banco falhar:

- confirmar se PostgreSQL esta rodando;
- confirmar `server/.env`;
- testar usuario, senha e nome do banco;
- lembrar que `.env.example` nao e carregado automaticamente.

Se o frontend mostrar erro 500:

- olhar o terminal do backend;
- normalmente o erro real aparece ali;
- se for `28P01`, e senha do PostgreSQL;
- se for `ECONNREFUSED`, o banco nao esta rodando ou a porta esta errada.

## 24. Frases prontas para defesa

"A simulacao foi uma escolha de engenharia para reduzir risco de hardware e focar na arquitetura completa."

"Nao criamos apenas uma interface visual. Existe firmware, payload, API, banco e tempo real."

"O Wokwi substitui a bancada fisica, mas nao substitui o fluxo IoT."

"O backend nao sabe se o dado veio de um ESP32 fisico ou simulado; ele recebe um contrato JSON. Isso facilita migrar para hardware real."

"O projeto nao esta sendo apresentado como produto medico, e sim como prototipo funcional e evolutivo."

"A ausencia de hardware real e uma limitacao assumida, mas o software foi construido pensando nessa futura troca."

"O simulador local e apenas plano B. A demonstracao principal e Wokwi com ESP32 e MPU6050."

## 25. Conclusao

O projeto entrega um fluxo IoT completo em nivel de prototipo:

- sensor simulado;
- firmware;
- envio HTTP;
- API;
- classificacao;
- banco de dados;
- eventos;
- dashboard em tempo real;
- mapa;
- historico;
- monitoramento offline;
- fallback de apresentacao.

A principal limitacao e a ausencia de hardware fisico, mas ela foi tratada com Wokwi, celular e simulador local. A arquitetura foi feita para permitir evolucao para ESP32 real com MPU6050 fisico, mantendo o backend e o dashboard praticamente iguais.

