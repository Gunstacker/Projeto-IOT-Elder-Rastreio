# Hardware simulado, celular e Wokwi

## Onde esta o hardware simulado

O hardware simulado principal esta na pasta `wokwi/`.

- `wokwi/diagram.json`: define o circuito do ESP32 ligado ao MPU6050.
- `wokwi/sketch.ino`: firmware Arduino/C++ executado no ESP32 simulado.
- `wokwi/libraries.txt`: bibliotecas usadas pelo Wokwi.
- `wokwi/README.md`: comandos e configuracao da URL publica da API.

Esse fluxo simula um dispositivo IoT real: o ESP32 le acelerometro, giroscopio e temperatura do MPU6050 virtual, monta um JSON e envia para o backend em `/api/iot/readings`.

## Como o Wokwi funciona no projeto

No Wokwi, o ESP32 e o MPU6050 nao existem fisicamente na bancada, mas o firmware executa como se estivesse em uma placa real. O codigo chama `mpu.getEvent(...)` para ler o sensor virtual e depois aplica perfis controlados de apresentacao:

- `n`: parado/normal.
- `w`: caminhada.
- `s`: sentado.
- `l`: deitado.
- `f`: sequencia completa de queda.
- `i`: inatividade.
- `b`: bateria baixa.
- `o`: perda de sinal.

Assim, se for solicitado demonstrar o hardware simulado, o Wokwi faz exatamente o que o projeto precisa: gera leituras de aceleracao, rotacao, bateria, localizacao simulada e cenarios de queda/offline no mesmo formato que um ESP32 fisico enviaria.

## O celular e um hardware simulado?

Nao. Na tela `/phone-gps`, o celular nao vira um ESP32 simulado dentro do Wokwi. Ele funciona como uma fonte real de dados do navegador:

- GPS real via `navigator.geolocation`.
- Movimento real via `DeviceMotionEvent`, usando acelerometro e rotacao do proprio aparelho quando o navegador permite.
- Bateria quando o navegador disponibiliza essa informacao.

Para reaproveitar o mesmo backend, o celular envia os dados no mesmo contrato JSON usado pelo dispositivo IoT. Por isso o backend recebe um `deviceType` como `SMARTPHONE_BROWSER`, mas o formato interno continua parecido com `mpu6050.accelerometer`, `mpu6050.gyroscope` e `gps`.

## Por que usamos celular e simulacao em vez de hardware real

O objetivo do projeto e demonstrar o fluxo IoT completo com confiabilidade durante a apresentacao: leitura de sensores, envio pela rede, classificacao no backend, historico, mapa e alerta em tempo real.

Usar ESP32, MPU6050, bateria e modulo GPS fisicos exigiria compra, montagem, solda ou protoboard, cabos, alimentacao, calibracao e testes de estabilidade de rede. Esses fatores aumentariam o risco de falha na apresentacao sem mudar o contrato principal do sistema.

Com Wokwi e celular, conseguimos validar a parte essencial do software:

- payload de sensor no formato esperado;
- calculo de magnitude de aceleracao e giroscopio;
- classificacao de queda, repouso, caminhada, inatividade e bateria baixa;
- persistencia em banco;
- eventos e alertas em tempo real;
- localizacao no mapa.

Mesmo sem hardware fisico, o projeto ja foi preparado para evoluir para uma placa real. O backend pode continuar praticamente igual, porque o contrato JSON ja esta definido.

## Ajuste de sensibilidade de queda no celular

A deteccao do celular foi ajustada para reduzir falsos positivos ao pegar ou mexer levemente no aparelho.

Antes, uma leitura com aceleracao alta podia ser suficiente para virar alerta. Agora o celular precisa confirmar um padrao mais proximo de queda real:

- aceleracao forte;
- rotacao alta no mesmo movimento;
- repeticao do impacto dentro de uma janela curta;
- ignorar os primeiros instantes apos liberar os sensores, porque o navegador pode gerar leituras instaveis.

No backend, a regra do celular tambem ficou separada da regra do Wokwi/ESP32. Isso evita que um pico isolado do acelerometro do celular seja classificado como queda sem rotacao compativel.

## Simulador local de fallback

Tambem existe um simulador local em `/local-simulator`, ligado a `server/src/routes/simulation.routes.js`. Ele nao substitui o Wokwi como fluxo principal, mas serve como plano B se a conexao externa, tunel publico ou ambiente Wokwi falhar.

Esse fallback gera payloads equivalentes aos do Wokwi e passa pelo mesmo backend, classificador, banco e dashboard.
