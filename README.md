# 🌐 Hệ Thống IoT Giám Sát và Điều Khiển Thiết Bị Thông Minh

## 📋 Mục Lục
- [Giới Thiệu](#giới-thiệu)
- [Tính Năng](#tính-năng)
- [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt](#cài-đặt)
- [Cấu Hình](#cấu-hình)
- [Sử Dụng](#sử-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [API Documentation](#api-documentation)
- [MQTT Topics](#mqtt-topics)
- [Troubleshooting](#troubleshooting)
- [Tác Giả](#tác-giả)

## 📖 Giới Thiệu

Đây là một hệ thống IoT hoàn chỉnh cho phép giám sát và điều khiển các thiết bị thông minh trong nhà thông qua giao thức MQTT. Hệ thống bao gồm:

- **ESP32 + Cảm biến**: Thu thập dữ liệu nhiệt độ, độ ẩm, ánh sáng và điều khiển các thiết bị
- **MQTT Broker**: Mosquitto làm trung gian truyền thông
- **Web Application**: Giao diện quản lý và giám sát dữ liệu realtime
- **Database**: MySQL lưu trữ dữ liệu cảm biến và lịch sử hành động

## ✨ Tính Năng

### 📊 Giám Sát Realtime
- Hiển thị dữ liệu nhiệt độ, độ ẩm, ánh sáng theo thời gian thực
- Biểu đồ trực quan hóa dữ liệu cảm biến
- Cập nhật tức thời thông qua WebSocket

### 🎛️ Điều Khiển Thiết Bị
- **Đèn (Light)**: Bật/tắt đèn chiếu sáng
- **Quạt (Fan)**: Điều khiển quạt làm mát
- **Điều Hòa (AC)**: Bật/tắt điều hòa không khí
- Phản hồi trạng thái thiết bị ngay lập tức

### 📈 Quản Lý Dữ Liệu
- Lưu trữ lịch sử dữ liệu cảm biến
- Lưu trữ lịch sử hành động điều khiển
- Phân trang và tìm kiếm dữ liệu
- Xuất dữ liệu theo khoảng thời gian

### 👤 Giao Diện Người Dùng
- Dashboard hiển thị tổng quan hệ thống
- Trang quản lý dữ liệu cảm biến
- Trang lịch sử hành động
- Giao diện responsive, thân thiện người dùng

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────┐
│   ESP32 Board   │
│  + DHT11        │
│  + LDR Sensor   │
│  + 3 Relays     │
└────────┬────────┘
         │ WiFi
         ↓
┌─────────────────┐
│ MQTT Broker     │
│  (Mosquitto)    │
└────────┬────────┘
         │ MQTT Protocol
         ↓
┌─────────────────┐       ┌──────────────┐
│  Web Server     │←─────→│   MySQL DB   │
│  (Node.js)      │       │              │
└────────┬────────┘       └──────────────┘
         │ HTTP/WebSocket
         ↓
┌─────────────────┐
│  Web Browser    │
│  (Dashboard)    │
└─────────────────┘
```

## 🛠️ Công Nghệ Sử Dụng

### Hardware
- **ESP32**: Vi điều khiển chính với WiFi tích hợp
- **DHT11**: Cảm biến nhiệt độ và độ ẩm
- **LDR (Light Dependent Resistor)**: Cảm biến ánh sáng

### Firmware (ESP32)
- **Arduino IDE**: Môi trường phát triển
- **WiFi.h**: Kết nối WiFi
- **PubSubClient**: Thư viện MQTT client
- **DHT.h**: Đọc dữ liệu cảm biến DHT11
- **ArduinoJson**: Xử lý dữ liệu JSON

### Backend
- **Node.js**: Nền tảng server-side
- **Express.js**: Web framework
- **MQTT.js**: MQTT client cho Node.js
- **Socket.IO**: WebSocket cho realtime communication
- **MySQL2**: Database driver
- **Pug**: Template engine
- **Moment.js**: Xử lý thời gian
- **dotenv**: Quản lý biến môi trường

### Frontend
- **HTML5/CSS3**: Giao diện người dùng
- **JavaScript (Vanilla)**: Xử lý logic client-side
- **Socket.IO Client**: Nhận dữ liệu realtime
- **Chart.js**: Vẽ biểu đồ (nếu có)

### Database
- **MySQL**: Hệ quản trị cơ sở dữ liệu quan hệ

### MQTT Broker
- **Eclipse Mosquitto**: MQTT message broker

## 💻 Yêu Cầu Hệ Thống

### Phần Cứng
- ESP32 Development Board
- DHT11 Temperature & Humidity Sensor
- LDR Light Sensor
- 3-Channel Relay Module
- Breadboard và dây jumper
- Nguồn cấp 5V cho ESP32

### Phần Mềm
- **Arduino IDE** 1.8.x hoặc cao hơn
- **Node.js** v14.x hoặc cao hơn
- **MySQL** 8.0 hoặc cao hơn
- **Mosquitto MQTT Broker** 2.x
- Trình duyệt web hiện đại (Chrome, Firefox, Edge)

## 📥 Cài Đặt

### 1. Cài Đặt Mosquitto MQTT Broker

#### Windows
```powershell
# Download từ: https://mosquitto.org/download/
# Hoặc sử dụng Chocolatey
choco install mosquitto
```

#### Linux
```bash
sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients
```

### 2. Cài Đặt MySQL Database

```sql
-- Tạo database
CREATE DATABASE iot_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo bảng sensor_data
CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    light INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Tạo bảng action_history
CREATE TABLE action_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device VARCHAR(50) NOT NULL,
    action VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device (device),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;
```

### 3. Clone và Cài Đặt Web Application

```powershell
# Clone repository
git clone https://github.com/DuongHaiLuu0904/IOT.git
cd IOT/web

# Cài đặt dependencies
npm install
```

### 4. Nạp Code Lên ESP32

1. Mở Arduino IDE
2. Cài đặt board ESP32:
   - File → Preferences → Additional Board Manager URLs
   - Thêm: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Tìm "ESP32" và cài đặt

3. Cài đặt thư viện cần thiết:
   - Sketch → Include Library → Manage Libraries
   - Cài đặt: `DHT sensor library`, `PubSubClient`, `ArduinoJson`

4. Mở file `Blink/Blink.ino`
5. Chọn board: Tools → Board → ESP32 Dev Module
6. Chọn COM port
7. Upload code

## ⚙️ Cấu Hình

### 1. Cấu Hình ESP32

Chỉnh sửa file `Blink/Blink.ino`:

```cpp
// Cấu hình WiFi
const char* ssid = "TÊN_WIFI_CỦA_BẠN";
const char* password = "MẬT_KHẨU_WIFI";

// Cấu hình MQTT
const char* mqtt_server = "ĐỊA_CHỈ_IP_MQTT_BROKER";
const int mqtt_port = 1883;
const char* mqtt_user = "user";
const char* mqtt_password = "123";

// Cấu hình chân GPIO
#define DHTPIN 25        // DHT11 data pin
#define LDR_PIN 34       // LDR analog pin
#define LED_LIGHT_PIN 13 // Relay đèn
#define FAN_PIN 14       // Relay quạt
#define AC_PIN 27        // Relay điều hòa
```

### 2. Cấu Hình Mosquitto

Chỉnh sửa file `mosquitto.conf`:

```conf
# Cho phép kết nối anonymous (development)
allow_anonymous true

# Hoặc sử dụng authentication
allow_anonymous false
password_file C:\Program Files\mosquitto\passwd

# Listener
listener 1883
protocol mqtt
```

Tạo user và password:
```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto_passwd -c passwd user
# Nhập password: 123
```

### 3. Cấu Hình Web Application

Tạo file `.env` trong thư mục `web/`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=iot_database
DB_PORT=3306

# MQTT Configuration
MQTT_BROKER=mqtt://localhost:1883
MQTT_CLIENT_ID=iot_web_client
MQTT_USERNAME=user
MQTT_PASSWORD=123
```

## 🚀 Sử Dụng

### 1. Khởi Động MQTT Broker

```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto.exe -c "C:\Program Files\mosquitto\mosquitto.conf" -v
```

### 2. Khởi Động Web Server

```powershell
cd web
npm start

# Hoặc chế độ development với auto-reload
npm run dev
```

### 3. Truy Cập Web Application

Mở trình duyệt và truy cập: `http://localhost:3000`

### 4. Test MQTT (Optional)

#### Subscribe to sensor data:
```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto_sub -h localhost -t "iot/sensors/data" -u "user" -P "123"
```

#### Publish control command:
```powershell
# Bật đèn
.\mosquitto_pub -h localhost -t "iot/led/light/command" -m "on" -u "user" -P "123"

# Tắt đèn
.\mosquitto_pub -h localhost -t "iot/led/light/command" -m "off" -u "user" -P "123"
```

## 📁 Cấu Trúc Dự Án

```
IOT/
├── Blink/                      # ESP32 Firmware
│   ├── Blink.ino              # Code chính cho ESP32
│   └── Blink.txt              # Ghi chú
├── web/                        # Web Application
│   ├── config/
│   │   └── database.js        # Cấu hình MySQL
│   ├── models/
│   │   ├── ActionModel.js     # Model lịch sử hành động
│   │   └── SensorModel.js     # Model dữ liệu cảm biến
│   ├── routes/
│   │   ├── api.js             # API routes
│   │   └── web.js             # Web routes
│   ├── services/
│   │   ├── mqttService.js     # MQTT service
│   │   └── socketService.js   # WebSocket service
│   ├── views/                  # Pug templates
│   │   ├── layout.pug         # Layout chung
│   │   ├── dashboard.pug      # Trang chủ
│   │   ├── data-sensors.pug   # Dữ liệu cảm biến
│   │   ├── action-history.pug # Lịch sử hành động
│   │   └── profile.pug        # Thông tin hệ thống
│   ├── public/                 # Static files
│   │   ├── css/               # Stylesheets
│   │   ├── js/                # JavaScript files
│   │   └── images/            # Hình ảnh
│   ├── server.js              # Entry point
│   ├── package.json           # Dependencies
│   └── .env                   # Environment variables
├── iot.jpg                     # Diagram hệ thống
└── README.md                   # Documentation
```

## 📡 API Documentation

### REST API Endpoints

#### 1. Get Sensor Data
```http
GET /api/sensors?page=1&limit=50
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "temperature": 28.5,
      "humidity": 65.2,
      "light": 450,
      "created_at": "2025-10-10T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalRecords": 500
  }
}
```

#### 2. Get Action History
```http
GET /api/actions?page=1&limit=50
```

#### 3. Control Device
```http
POST /api/device/control
Content-Type: application/json

{
  "device": "light",
  "action": "on"
}
```

#### 4. Get Latest Sensor Reading
```http
GET /api/sensors/latest
```

### WebSocket Events

#### Client → Server
- `control:device` - Điều khiển thiết bị
  ```javascript
  socket.emit('control:device', { device: 'light', action: 'on' });
  ```

#### Server → Client
- `sensor:data` - Dữ liệu cảm biến mới
- `device:status` - Cập nhật trạng thái thiết bị
- `connection:status` - Trạng thái kết nối MQTT

## 📨 MQTT Topics

### Published Topics (ESP32 → Broker)

| Topic | Payload | Mô Tả |
|-------|---------|-------|
| `iot/sensors/data` | `{"temperature":28.5,"humidity":65,"light":450}` | Dữ liệu cảm biến |
| `iot/led/light/status` | `on` hoặc `off` | Trạng thái đèn |
| `iot/led/fan/status` | `on` hoặc `off` | Trạng thái quạt |
| `iot/led/ac/status` | `on` hoặc `off` | Trạng thái điều hòa |

### Subscribed Topics (Broker → ESP32)

| Topic | Payload | Mô Tả |
|-------|---------|-------|
| `iot/led/light/command` | `on` hoặc `off` | Điều khiển đèn |
| `iot/led/fan/command` | `on` hoặc `off` | Điều khiển quạt |
| `iot/led/ac/command` | `on` hoặc `off` | Điều khiển điều hòa |

## 🔧 Troubleshooting

### ESP32 không kết nối được WiFi
- Kiểm tra SSID và password
- Đảm bảo WiFi là 2.4GHz (ESP32 không hỗ trợ 5GHz)
- Kiểm tra cường độ sín hiệu WiFi

### MQTT Connection Failed
- Kiểm tra Mosquitto broker đang chạy
- Xác nhận địa chỉ IP và port chính xác
- Kiểm tra username/password nếu có authentication

### Web Server không kết nối được Database
- Kiểm tra MySQL service đang chạy
- Xác nhận thông tin trong file `.env`
- Kiểm tra database và tables đã được tạo

### Dữ liệu không cập nhật realtime
- Kiểm tra WebSocket connection trong Developer Console
- Xác nhận MQTT service đã kết nối thành công
- Kiểm tra ESP32 đang publish dữ liệu (Serial Monitor)

### ESP32 báo "Failed to read from DHT sensor"
- Kiểm tra kết nối dây DHT11
- Đảm bảo có điện trở pull-up 10kΩ (một số module DHT11 đã có sẵn)
- Thử đổi chân GPIO khác

## 📊 Database Schema

### Table: sensor_data
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto increment |
| temperature | FLOAT | Nhiệt độ (°C) |
| humidity | FLOAT | Độ ẩm (%) |
| light | INT | Cường độ ánh sáng (0-1000) |
| created_at | TIMESTAMP | Thời gian ghi nhận |

### Table: action_history
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto increment |
| device | VARCHAR(50) | Tên thiết bị (light/fan/ac) |
| action | VARCHAR(10) | Hành động (on/off) |
| created_at | TIMESTAMP | Thời gian thực hiện |

## 🔐 Security Considerations

### Production Deployment
1. **MQTT Authentication**: Bật authentication và sử dụng mật khẩu mạnh
2. **SSL/TLS**: Sử dụng MQTTS (port 8883) thay vì MQTT
3. **Database**: Tạo user riêng với quyền hạn chế
4. **Environment Variables**: Không commit file `.env` lên Git
5. **Input Validation**: Validate tất cả input từ client
6. **Rate Limiting**: Giới hạn số lượng request API

## 🔮 Tính Năng Tương Lai

- [ ] Thêm authentication/authorization cho web app
- [ ] Push notification khi có cảnh báo
- [ ] Lập lịch tự động bật/tắt thiết bị
- [ ] Machine Learning để dự đoán và tối ưu năng lượng
- [ ] Mobile app (React Native/Flutter)
- [ ] Thêm nhiều loại cảm biến khác
- [ ] Dashboard analytics nâng cao
- [ ] Export dữ liệu ra CSV/Excel

## 📝 License

MIT License - Xem file LICENSE để biết thêm chi tiết

## 👨‍💻 Tác Giả

**Duong Hai Luu**
- GitHub: [@DuongHaiLuu0904](https://github.com/DuongHaiLuu0904)
- Email: duonghailuu0904@gmail.com

## 🙏 Acknowledgments

- [Arduino](https://www.arduino.cc/) - Platform phát triển ESP32
- [Eclipse Mosquitto](https://mosquitto.org/) - MQTT Broker
- [Node.js](https://nodejs.org/) - Runtime environment
- [Express.js](https://expressjs.com/) - Web framework
- [Socket.IO](https://socket.io/) - Realtime communication

## 📞 Hỗ Trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi, vui lòng:
1. Kiểm tra phần [Troubleshooting](#troubleshooting)
2. Tìm kiếm trong [Issues](https://github.com/DuongHaiLuu0904/IOT/issues)
3. Tạo issue mới nếu chưa có câu trả lời

---

⭐ Nếu dự án này hữu ích, hãy cho một star trên GitHub!
