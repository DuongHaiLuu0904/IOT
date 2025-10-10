class SocketService {
    // Khởi tạo dịch vụ Socket với cấu hình ban đầu
    constructor(io, mqttService = null) {
        this.io = io;
        this.mqttService = mqttService;
        this.clients = new Map();
        this.lastSensorLogTime = 0;
        this.sensorLogInterval = 30000; 
        this.setupEventHandlers();
    }

    // Thiết lập MQTT service (được gọi sau khi MQTT service khởi tạo)
    setMqttService(mqttService) {
        this.mqttService = mqttService;
    }

    // Thiết lập các event handler cho socket connections
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.clients.set(socket.id, {
                socket: socket,
                connectedAt: new Date()
            });

            // Xử lý các sự kiện của client
            socket.on('disconnect', () => {
                this.clients.delete(socket.id);
            });

            // Xử lý yêu cầu điều khiển thiết bị
            socket.on('device-control', async (data) => {
                console.log(`🎮 Device control received: ${data.device} -> ${data.action}`);
                
                try {
                    // Gửi lệnh điều khiển qua MQTT nếu service có sẵn
                    if (this.mqttService) {
                        const success = await this.mqttService.controlDevice(data.device, data.action);
                        
                        if (success) {
                            console.log(`📤 Command sent to device: ${data.device} -> ${data.action}`);
                            // Sẽ chờ feedback từ hardware thông qua MQTT
                        } else {
                            console.error(`❌ Failed to send command to device: ${data.device}`);
                            // Chỉ emit lỗi khi không gửi được lệnh
                            socket.emit('device-control-error', {
                                device: data.device,
                                action: data.action,
                                message: 'Failed to send command',
                                timestamp: new Date().toISOString()
                            });
                        }
                    } else {
                        console.warn('❌ MQTT service not available for device control');
                        socket.emit('device-control-error', {
                            device: data.device,
                            action: data.action,
                            message: 'MQTT service not available',
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error('❌ Error handling device control:', error.message);
                    socket.emit('device-control-error', {
                        device: data.device,
                        action: data.action,
                        message: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            // Gửi trạng thái hiện tại khi client kết nối
            this.sendInitialData(socket);
        });
    }

    // Gửi dữ liệu ban đầu cho client mới kết nối
    async sendInitialData(socket) {
        try {
            const SensorModel = require('../models/SensorModel');
            const ActionModel = require('../models/ActionModel');

            // Lấy dữ liệu cảm biến mới nhất
            const latestSensor = await SensorModel.getLatest();
            if (latestSensor) {
                socket.emit('sensor-data', {
                    temperature: latestSensor.temperature,
                    humidity: latestSensor.humidity,
                    light: latestSensor.light,
                    timestamp: latestSensor.created_at
                });
            }

            // Lấy trạng thái thiết bị mới nhất
            const latestActions = await ActionModel.getLatestForAllDevices();
            const deviceStates = {};
            
            latestActions.forEach(action => {
                let deviceKey = action.device.toLowerCase().replace(' ', '');
                if (deviceKey === 'aircondition') deviceKey = 'ac';
                deviceStates[deviceKey] = action.action === 'on';
            });

            socket.emit('device-states', deviceStates);

        } catch (error) {
            console.error('❌ Error sending initial data:', error.message);
        }
    }

    // Phát dữ liệu cảm biến tới tất cả client
    broadcastSensorData(data) {
        this.io.emit('sensor-data', data);
    }

    // Phát trạng thái thiết bị tới tất cả client
    broadcastDeviceStatus(data) {
        this.io.emit('device-status', data);
        // Giữ log trạng thái thiết bị vì chúng ít thường xuyên hơn và quan trọng hơn
        if (this.clients.size > 0) {
            console.log(`🎛️  Device ${data.device} ${data.status} - broadcasted to ${this.clients.size} client(s)`);
        }
    }

    // Gửi dữ liệu tới một room cụ thể
    broadcastToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }

    // Gửi dữ liệu tới một client cụ thể theo ID
    sendToClient(socketId, event, data) {
        const client = this.clients.get(socketId);
        if (client) {
            client.socket.emit(event, data);
        }
    }

    // Lấy số lượng client đang kết nối
    getConnectedClientsCount() {
        return this.clients.size;
    }

    // Lấy thông tin chi tiết của tất cả client
    getClientsInfo() {
        const clientsInfo = [];
        this.clients.forEach((client, socketId) => {
            clientsInfo.push({
                id: socketId,
                connectedAt: client.connectedAt
            });
        });
        return clientsInfo;
    }
}

module.exports = SocketService;