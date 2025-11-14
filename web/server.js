require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const MqttService = require('./services/mqttService');
const SocketService = require('./services/socketService');


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.locals.moment = require('moment');


const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');

app.use('/', webRoutes);
app.use('/api', apiRoutes);


let mqttService;
let socketService;

async function initializeServices() {
    try {
        socketService = new SocketService(io);
        
        mqttService = new MqttService(socketService);
        await mqttService.connect();

        // Thiết lập MQTT service cho socket service
        socketService.setMqttService(mqttService);

        app.locals.mqttService = mqttService;
        app.locals.socketService = socketService;

    } catch (error) {
        console.error('Service initialization failed:', error.message);
    }
}

server.listen(process.env.PORT, async () => {
    console.log(`IoT Web Server started on port ${process.env.PORT}`);

    await initializeServices();
});

module.exports = { app, server, io };