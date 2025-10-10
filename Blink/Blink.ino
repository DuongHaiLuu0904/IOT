#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// cd "C:\Program Files\mosquitto"
// .\mosquitto.exe -c "C:\Program Files\mosquitto\mosquitto.conf"
// .\mosquitto_pub -h 192.168.95.22 -t "iot/led/light/command" -m "on" -u "user" -P "123"

// .\mosquitto_sub -h 192.168.22.22 -t "iot/led/light" -u "user" -P "123"cd "C:\Program Files\mosquitto"
// cd "C:\Program Files\mosquitto"
// .\mosquitto_pub -h 192.168.109.22 -t "iot/led/light" -m "on" -u "user" -P "123"

// .\mosquitto_sub -h 192.168.109.22 -t "iot/sensors/data" -u "user" -P "123"
// .\mosquitto_pub -h 192.168.109.22 -t "iot/sensors/data" -m '{"humidity":55,"temperature":28,"light":173}' -u "user" -P "123"


// Cấu hình WiFi
// const char* ssid = "P2511";
// const char* password = "0975166994";

const char* ssid = "realms c15";
const char* password = "123456789";

// const char* ssid = "IamHaiLuu";
// const char* password = "09042004";

// Cấu hình MQTT
const char* mqtt_server = "10.98.170.22";
const int mqtt_port = 1883;
const char* mqtt_user = "user";
const char* mqtt_password = "123";
const char* mqtt_client_id = "ESP32Client_1";

// Cấu hình Topic
const char* mqtt_publish_topic = "iot/sensors/data";
const char* mqtt_subscribe_topic_light = "iot/led/light/command";
const char* mqtt_status_topic_light = "iot/led/light/status";
const char* mqtt_subscribe_topic_fan = "iot/led/fan/command";
const char* mqtt_status_topic_fan = "iot/led/fan/status";
const char* mqtt_subscribe_topic_ac = "iot/led/ac/command";
const char* mqtt_status_topic_ac = "iot/led/ac/status";

// Cấu hình Chân cắm
#define DHTPIN 25
#define DHTTYPE DHT11
#define LDR_PIN 34
#define LED_LIGHT_PIN 13
#define FAN_PIN 14
#define AC_PIN 27

// Khởi tạo đối tượng
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);

unsigned long lastMsg = 0;
const int PUBLISH_INTERVAL = 1500;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

// Hàm xử lý khi nhận được thông điệp MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  String state = "";
  if (message == "on") {
    state = "on";
  } else if (message == "off") {
    state = "off";
  } else {
    return;
  }

  if (String(topic) == String(mqtt_subscribe_topic_light)) {
    digitalWrite(LED_LIGHT_PIN, (state == "on") ? HIGH : LOW);
    client.publish(mqtt_status_topic_light, state.c_str());
  } else if (String(topic) == String(mqtt_subscribe_topic_fan)) {
    digitalWrite(FAN_PIN, (state == "on") ? HIGH : LOW);
    client.publish(mqtt_status_topic_fan, state.c_str());
  } else if (String(topic) == String(mqtt_subscribe_topic_ac)) {
    digitalWrite(AC_PIN, (state == "on") ? HIGH : LOW);
    client.publish(mqtt_status_topic_ac, state.c_str());
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(mqtt_client_id, mqtt_user, mqtt_password)) {
      Serial.println("connected");
      // Đăng ký các topic để nhận lệnh điều khiển
      client.subscribe(mqtt_subscribe_topic_light);
      client.subscribe(mqtt_subscribe_topic_fan);
      client.subscribe(mqtt_subscribe_topic_ac);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_LIGHT_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(AC_PIN, OUTPUT);

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  dht.begin();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  unsigned long now = millis();
  if (now - lastMsg > PUBLISH_INTERVAL) {
    lastMsg = now;
    // Đọc dữ liệu từ cảm biến
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    int light = analogRead(LDR_PIN);
    light = map(light, 0, 4095, 1000, 0);
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }
    // Tạo JSON payload
    StaticJsonDocument<200> doc;
    doc["humidity"] = humidity;
    doc["temperature"] = temperature;
    doc["light"] = light;
    char jsonBuffer[200];
    serializeJson(doc, jsonBuffer);
    // Gửi dữ liệu lên MQTT broker
    client.publish(mqtt_publish_topic, jsonBuffer);
    Serial.print("Published message: ");
    Serial.println(jsonBuffer);
  }
}