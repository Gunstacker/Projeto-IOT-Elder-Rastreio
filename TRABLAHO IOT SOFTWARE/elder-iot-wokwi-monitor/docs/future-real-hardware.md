# Evolucao para hardware real

Para substituir a simulacao por hardware fisico:

1. Gravar o firmware em um ESP32 real.
2. Conectar um MPU6050 real aos pinos I2C.
3. Usar 3V3, GND, SCL no GPIO 22 e SDA no GPIO 21.
4. Conectar o ESP32 ao Wi-Fi real.
5. Alterar `API_URL` para uma URL publica ou servidor real.
6. Adicionar leitura de bateria fisica por divisor resistivo e entrada analogica.
7. Adicionar GPS real, como NEO-6M, ou continuar usando celular como fonte de localizacao.
8. Ajustar calibracao de thresholds com testes reais.

O backend pode permanecer praticamente igual, porque o contrato JSON ja foi definido.
