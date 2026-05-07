#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <time.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>

Adafruit_MPU6050 mpu;

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// IMPORTANTE:
// Trocar pela URL HTTPS gerada pelo Tunnelmole no notebook.
// Exemplo:
// const char* API_URL = "https://abc123.tunnelmole.net/api/iot/readings";
const char* API_URL = "https://xnh6hz-ip-177-67-29-157.tunnelmole.net/api/iot/readings";

const char* DEVICE_ID = "ESP32_WOKWI_001";
const char* DEVICE_TYPE = "ESP32_WOKWI_SIMULATED";
const char* FIRMWARE_VERSION = "1.0.0";
const int ELDER_ID = 1;

String currentMode = "STANDING";
String currentScenario = "NORMAL_READING";

unsigned long lastPostAt = 0;
unsigned long postIntervalMs = 2000;

unsigned long fallSequenceStartedAt = 0;
bool fallSequenceActive = false;

float batteryLevel = 92.0;
float batteryVoltage = 4.05;

int routeIndex = 0;

struct LocationPoint {
  float lat;
  float lng;
};

LocationPoint route[] = {
  {-16.686891, -49.264794},
  {-16.686840, -49.264730},
  {-16.686790, -49.264690},
  {-16.686740, -49.264650},
  {-16.686700, -49.264610},
  {-16.686680, -49.264570},
  {-16.686650, -49.264540}
};

const int routeSize = sizeof(route) / sizeof(route[0]);

float noise(float base, float variation) {
  float randomValue = random(-1000, 1000) / 1000.0;
  return base + (randomValue * variation);
}

String currentIsoTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 200)) {
    return "";
  }

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}

void connectWiFi() {
  Serial.println();
  Serial.println("Conectando ao Wi-Fi Wokwi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 6);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi conectado.");
  Serial.print("IP simulado: ");
  Serial.println(WiFi.localIP());

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
}

void setupMpu() {
  Serial.println("Iniciando MPU6050...");

  if (!mpu.begin()) {
    Serial.println("ERRO: MPU6050 nao encontrado.");
    while (true) {
      delay(1000);
    }
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("MPU6050 iniciado com sucesso.");
}

void printHelp() {
  Serial.println();
  Serial.println("=== Elder IoT Monitor - Comandos ===");
  Serial.println("n = normal/parado");
  Serial.println("w = caminhada");
  Serial.println("s = sentado");
  Serial.println("l = deitado");
  Serial.println("f = queda completa");
  Serial.println("i = inatividade");
  Serial.println("b = bateria baixa");
  Serial.println("o = simular perda de sinal por 15s");
  Serial.println("r = resetar para normal");
  Serial.println("h = ajuda");
  Serial.println("====================================");
  Serial.println();
}

void handleSerialCommands() {
  if (!Serial.available()) {
    return;
  }

  char command = Serial.read();

  switch (command) {
    case 'n':
      currentMode = "STANDING";
      currentScenario = "NORMAL_READING";
      fallSequenceActive = false;
      Serial.println("Modo alterado para STANDING.");
      break;

    case 'w':
      currentMode = "WALKING";
      currentScenario = "NORMAL_MOVEMENT";
      fallSequenceActive = false;
      Serial.println("Modo alterado para WALKING.");
      break;

    case 's':
      currentMode = "SITTING";
      currentScenario = "RESTING";
      fallSequenceActive = false;
      Serial.println("Modo alterado para SITTING.");
      break;

    case 'l':
      currentMode = "LYING";
      currentScenario = "RESTING";
      fallSequenceActive = false;
      Serial.println("Modo alterado para LYING.");
      break;

    case 'f':
      currentMode = "FALL_SEQUENCE";
      currentScenario = "FALL_SEQUENCE";
      fallSequenceActive = true;
      fallSequenceStartedAt = millis();
      Serial.println("Sequencia de queda iniciada.");
      break;

    case 'i':
      currentMode = "INACTIVE";
      currentScenario = "INACTIVITY";
      fallSequenceActive = false;
      Serial.println("Modo alterado para INACTIVE.");
      break;

    case 'b':
      batteryLevel = 10.0;
      batteryVoltage = 3.45;
      currentScenario = "LOW_BATTERY";
      Serial.println("Bateria baixa simulada.");
      break;

    case 'o':
      Serial.println("Simulando perda de sinal por 15 segundos...");
      delay(15000);
      Serial.println("Sinal restaurado.");
      break;

    case 'r':
      currentMode = "STANDING";
      currentScenario = "NORMAL_READING";
      fallSequenceActive = false;
      batteryLevel = 92.0;
      batteryVoltage = 4.05;
      Serial.println("Reset para estado normal.");
      break;

    case 'h':
      printHelp();
      break;
  }
}

String getFallSequenceMode() {
  if (!fallSequenceActive) {
    return currentMode;
  }

  unsigned long elapsed = millis() - fallSequenceStartedAt;

  if (elapsed < 3000) {
    return "WALKING";
  }

  if (elapsed < 4500) {
    return "FALL_IMPACT";
  }

  if (elapsed < 14000) {
    return "POST_FALL";
  }

  return "INACTIVE";
}

void generateVirtualMpuValues(
  String mode,
  float baseAx,
  float baseAy,
  float baseAz,
  float baseGx,
  float baseGy,
  float baseGz,
  float &ax,
  float &ay,
  float &az,
  float &gx,
  float &gy,
  float &gz
) {
  // The firmware reads the real virtual MPU6050, then applies movement
  // profiles for controlled presentation scenarios.

  if (mode == "STANDING") {
    ax = noise(0.02, 0.03);
    ay = noise(0.01, 0.03);
    az = noise(1.00, 0.05);
    gx = noise(0.3, 0.2);
    gy = noise(0.2, 0.2);
    gz = noise(0.1, 0.2);
    currentScenario = "NORMAL_READING";
    return;
  }

  if (mode == "WALKING") {
    ax = noise(0.28, 0.15);
    ay = noise(0.14, 0.10);
    az = noise(1.12, 0.20);
    gx = noise(4.5, 2.0);
    gy = noise(2.1, 1.2);
    gz = noise(1.8, 1.0);
    currentScenario = "NORMAL_MOVEMENT";
    return;
  }

  if (mode == "SITTING") {
    ax = noise(0.05, 0.03);
    ay = noise(0.10, 0.03);
    az = noise(0.96, 0.04);
    gx = noise(0.2, 0.1);
    gy = noise(0.2, 0.1);
    gz = noise(0.1, 0.1);
    currentScenario = "RESTING";
    return;
  }

  if (mode == "LYING") {
    ax = noise(0.95, 0.04);
    ay = noise(0.08, 0.03);
    az = noise(0.20, 0.04);
    gx = noise(0.1, 0.1);
    gy = noise(0.1, 0.1);
    gz = noise(0.1, 0.1);
    currentScenario = "RESTING";
    return;
  }

  if (mode == "FALL_IMPACT") {
    ax = noise(2.8, 0.5);
    ay = noise(1.6, 0.4);
    az = noise(3.4, 0.6);
    gx = noise(180.0, 30.0);
    gy = noise(95.0, 25.0);
    gz = noise(40.0, 15.0);
    currentScenario = "FALL_IMPACT";
    return;
  }

  if (mode == "POST_FALL") {
    ax = noise(0.88, 0.04);
    ay = noise(0.14, 0.03);
    az = noise(0.23, 0.04);
    gx = noise(0.4, 0.3);
    gy = noise(0.3, 0.2);
    gz = noise(0.2, 0.2);
    currentScenario = "POST_FALL";
    return;
  }

  if (mode == "INACTIVE") {
    ax = noise(0.01, 0.01);
    ay = noise(0.01, 0.01);
    az = noise(0.99, 0.02);
    gx = noise(0.05, 0.03);
    gy = noise(0.04, 0.03);
    gz = noise(0.03, 0.03);
    currentScenario = "INACTIVITY";
    return;
  }

  ax = baseAx;
  ay = baseAy;
  az = baseAz;
  gx = baseGx;
  gy = baseGy;
  gz = baseGz;
  currentScenario = "RAW_MPU_READING";
}

void updateBattery() {
  if (batteryLevel > 0) {
    batteryLevel -= 0.02;
  }

  if (batteryLevel < 0) {
    batteryLevel = 0;
  }

  if (batteryLevel > 15) {
    batteryVoltage = 3.55 + (batteryLevel / 100.0) * 0.65;
  }
}

LocationPoint getNextLocation() {
  LocationPoint point = route[routeIndex];

  routeIndex++;
  if (routeIndex >= routeSize) {
    routeIndex = 0;
  }

  point.lat += noise(0.0, 0.00003);
  point.lng += noise(0.0, 0.00003);

  return point;
}

bool sendReading() {
  sensors_event_t accelEvent;
  sensors_event_t gyroEvent;
  sensors_event_t tempEvent;

  mpu.getEvent(&accelEvent, &gyroEvent, &tempEvent);

  float baseAx = accelEvent.acceleration.x / 9.80665;
  float baseAy = accelEvent.acceleration.y / 9.80665;
  float baseAz = accelEvent.acceleration.z / 9.80665;

  float baseGx = gyroEvent.gyro.x * 57.2958;
  float baseGy = gyroEvent.gyro.y * 57.2958;
  float baseGz = gyroEvent.gyro.z * 57.2958;

  String effectiveMode = getFallSequenceMode();

  float ax, ay, az, gx, gy, gz;

  generateVirtualMpuValues(
    effectiveMode,
    baseAx,
    baseAy,
    baseAz,
    baseGx,
    baseGy,
    baseGz,
    ax,
    ay,
    az,
    gx,
    gy,
    gz
  );

  updateBattery();
  LocationPoint location = getNextLocation();

  StaticJsonDocument<2048> doc;

  doc["deviceId"] = DEVICE_ID;
  doc["deviceType"] = DEVICE_TYPE;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["elderId"] = ELDER_ID;
  doc["timestamp"] = currentIsoTimestamp();
  doc["uptimeMs"] = millis();

  JsonObject network = doc.createNestedObject("network");
  network["ssid"] = WIFI_SSID;
  network["rssi"] = WiFi.RSSI();
  network["ip"] = WiFi.localIP().toString();
  network["transport"] = "HTTP_OVER_NGROK";

  JsonObject battery = doc.createNestedObject("battery");
  battery["level"] = (int)batteryLevel;
  battery["charging"] = false;
  battery["voltage"] = batteryVoltage;

  JsonObject sensors = doc.createNestedObject("sensors");
  JsonObject mpuObj = sensors.createNestedObject("mpu6050");

  JsonObject accelerometer = mpuObj.createNestedObject("accelerometer");
  accelerometer["x"] = ax;
  accelerometer["y"] = ay;
  accelerometer["z"] = az;
  accelerometer["unit"] = "g";

  JsonObject gyroscope = mpuObj.createNestedObject("gyroscope");
  gyroscope["x"] = gx;
  gyroscope["y"] = gy;
  gyroscope["z"] = gz;
  gyroscope["unit"] = "deg/s";

  mpuObj["temperature"] = tempEvent.temperature;

  JsonObject gps = sensors.createNestedObject("gps");
  gps["latitude"] = location.lat;
  gps["longitude"] = location.lng;
  gps["accuracy"] = 8.5;
  gps["speed"] = effectiveMode == "WALKING" ? 0.6 : 0.0;
  gps["source"] = "WOKWI_SIMULATED_ROUTE";

  JsonObject simulation = doc.createNestedObject("simulation");
  simulation["source"] = "WOKWI";
  simulation["mode"] = effectiveMode;
  simulation["isSimulated"] = true;
  simulation["scenario"] = currentScenario;

  String payload;
  serializeJson(doc, payload);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi desconectado. Tentando reconectar...");
    connectWiFi();
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;

  Serial.println();
  Serial.println("Enviando payload para API:");
  Serial.println(payload);

  if (!http.begin(client, API_URL)) {
    Serial.println("Falha ao iniciar HTTPClient.");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-Wokwi-ElderMonitor/1.0");
  http.addHeader("ngrok-skip-browser-warning", "true");

  int httpCode = http.POST(payload);

  Serial.print("HTTP status: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Resposta da API:");
    Serial.println(response);
  } else {
    Serial.print("Erro HTTP: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();

  return httpCode >= 200 && httpCode < 300;
}

void setup() {
  Serial.begin(115200);
  delay(500);

  randomSeed(analogRead(0));

  Serial.println("Elder IoT Monitor - ESP32 Wokwi Firmware");
  Serial.println("Inicializando...");

  connectWiFi();
  setupMpu();
  printHelp();
}

void loop() {
  handleSerialCommands();

  unsigned long now = millis();

  if (now - lastPostAt >= postIntervalMs) {
    lastPostAt = now;
    sendReading();
  }
}
