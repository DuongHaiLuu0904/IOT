const mqtt = require('mqtt');
const SensorModel = require('../models/SensorModel');
const ActionModel = require('../models/ActionModel');

class MqttService {
    constructor(socketService) {
        this.client = null;
        this.socketService = socketService;
        this.topics = {
            sensorData: 'iot/sensors/data',
            deviceStatus: {
                light: 'iot/led/light/status',
                fan: 'iot/led/fan/status', 
                ac: 'iot/led/ac/status'
            },
            deviceControl: {
                light: 'iot/led/light/command',
                fan: 'iot/led/fan/command',
                ac: 'iot/led/ac/command'
            }
        };
        this.deviceStates = {
            light: false,
            fan: false,
            ac: false
        };
    }

    // Kết nối tới MQTT broker và thiết lập event handlers
    async connect() {
        try {
            const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
            const clientId = process.env.MQTT_CLIENT_ID || 'iot_web_client';
            
            const connectionOptions = {
                clientId: clientId + ' ' + Math.random().toString(16).substr(2, 8),
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000,
            };

            if (process.env.MQTT_USERNAME) {
                connectionOptions.username = process.env.MQTT_USERNAME;
            }
            if (process.env.MQTT_PASSWORD) {
                connectionOptions.password = process.env.MQTT_PASSWORD;
            }
            
            this.client = mqtt.connect(brokerUrl, connectionOptions);

            this.client.on('connect', () => {
                console.log('MQTT connected to broker');
                this.subscribeToTopics();
            });

            this.client.on('message', (topic, message) => {
                this.handleMessage(topic, message);
            });

            this.client.on('error', (error) => {
                console.error('MQTT connection error:', error.message);
            });

            this.client.on('offline', () => {
                console.log('MQTT client is offline');
            });

            this.client.on('reconnect', () => {
                console.log('MQTT reconnecting...');
            });

        } catch (error) {
            console.error('MQTT connection failed:', error.message);
        }
    }

    // Đăng ký theo dõi tất cả các topics cần thiết
    subscribeToTopics() {
        const allTopics = [
            this.topics.sensorData,
            ...Object.values(this.topics.deviceStatus)
        ];

        allTopics.forEach(topic => {
            this.client.subscribe(topic, (err) => {
                if (err) {
                    console.error(`Failed to subscribe to ${topic}:`, err.message);
                } else {
                    console.log(`Subscribed to ${topic}`);
                }
            });
        });
    }

    // Xử lý tin nhắn MQTT nhận được từ các topics
    async handleMessage(topic, message) {
        try {
            const messageStr = message.toString();
            
            if (topic === this.topics.sensorData) {
                const data = JSON.parse(messageStr);
                await this.handleSensorData(data);
            } else if (Object.values(this.topics.deviceStatus).includes(topic)) {
                let data;
                try {
                    data = JSON.parse(messageStr);
                } catch (e) {
                    // Nếu không phải JSON, xử lý như văn bản trạng thái thường
                    data = { status: messageStr };
                }
                await this.handleDeviceStatus(topic, data);
            }
        } catch (error) {
            console.error('❌ Error handling MQTT message:', error.message);
        }
    }

    // lưu DB và phát tới clients
    async handleSensorData(data) {
        try {
            // kiểm tra undefined/null, không loại trừ giá trị 0
            if (data.temperature === undefined || data.temperature === null ||
                data.humidity === undefined || data.humidity === null ||
                data.light === undefined || data.light === null) {
                console.error('Invalid sensor data received:', data);
                return;
            }

            // Lưu vào cơ sở dữ liệu
            await SensorModel.create({
                temperature: parseFloat(data.temperature),
                humidity: parseFloat(data.humidity),
                light: parseInt(data.light)
            });

            // Phát sóng đến các client đã kết nối
            this.socketService.broadcastSensorData({
                temperature: data.temperature,
                humidity: data.humidity,
                light: data.light,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error handling sensor data:', error.message);
        }
    }

    // Xử lý trạng thái thiết bị
    async handleDeviceStatus(topic, data) {
        try {
            let device = '';
            
            // Xác định loại thiết bị từ topic
            if (topic.includes('light')) device = 'Light';
            else if (topic.includes('fan')) device = 'Fan';
            else if (topic.includes('ac')) device = 'Air condition';

            if (device && data.status) {
                // Cập nhật trạng thái thiết bị
                let deviceKey = device.toLowerCase().replace(' ', '');
                if (deviceKey === 'aircondition') deviceKey = 'ac';
                
                this.deviceStates[deviceKey] = data.status === 'on';

                // Lưu hành động vào cơ sở dữ liệu
                await ActionModel.create({
                    device: device,
                    action: data.status
                });

                // Phát sóng đến các client đã kết nối
                this.socketService.broadcastDeviceStatus({
                    device: device,
                    status: data.status,
                    timestamp: new Date().toISOString()
                });

            }
        } catch (error) {
            console.error(' Error handling device status:', error.message);
        }
    }

    // Gửi lệnh điều khiển thiết bị qua MQTT
    async controlDevice(device, action) {
        try {
            const deviceMap = {
                'light': this.topics.deviceControl.light,
                'fan': this.topics.deviceControl.fan,
                'ac': this.topics.deviceControl.ac
            };

            const topic = deviceMap[device.toLowerCase()];
            
            if (!topic) {
                throw new Error(`Unknown device: ${device}`);
            }

            this.client.publish(topic, action);

            return true;
        } catch (error) {
            console.error('Error controlling device:', error.message);
            return false;
        }
    }

    // Lấy trạng thái hiện tại của tất cả thiết bị
    getCurrentDeviceStates() {
        return this.deviceStates;
    }

    // Ngắt kết nối MQTT broker
    async disconnect() {
        if (this.client) {
            await this.client.endAsync();
            console.log('MQTT disconnected');
        }
    }
}

module.exports = MqttService;