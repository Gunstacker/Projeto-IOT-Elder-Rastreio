# Defesa para professora

Professora, a simulacao nao e apenas uma tela fake. O sistema usa o Wokwi como camada embarcada, com um ESP32 virtual conectado a um MPU6050 virtual por I2C.

O firmware le o sensor, gera dados de aceleracao, rotacao, temperatura, bateria, sinal e localizacao simulada, e transmite essas informacoes para o backend usando HTTP, como um dispositivo IoT faria.

O backend interpreta leituras brutas, calcula magnitudes vetoriais e detecta eventos criticos como queda, inatividade e perda de sinal. O dashboard apenas exibe o resultado em tempo real; a fonte da verdade sao os dados do sensor.

Limitacoes assumidas:

- ESP32 simulado no Wokwi.
- MPU6050 simulado no Wokwi.
- Localizacao simulada ou enviada pelo celular.
- ngrok usado para permitir acesso externo ao backend local.
- Prototipo academico, nao indicado para uso medico real.
