const express = require('express');
const router = express.Router();
const SensorModel = require('../models/SensorModel');
const ActionModel = require('../models/ActionModel');

// API: Lấy dữ liệu dashboard
router.get('/dashboard', async (req, res) => {
    try {
        // Lấy dữ liệu mới nhất cho dashboard
        const latestSensor = await SensorModel.getLatest();
        const deviceStates = await ActionModel.getLatestForAllDevices();
        const chartData = await SensorModel.getChartData(20);

        const devices = {
            light: false,
            fan: false,
            ac: false
        };

        deviceStates.forEach(device => {
            const key = device.device.toLowerCase().replace(' ', '');
            const finalKey = key === 'aircondition' ? 'ac' : key;
            devices[finalKey] = device.action === 'on';
        });

        res.json({
            success: true,
            data: {
                sensorData: latestSensor || {
                    temperature: 0,
                    humidity: 0,
                    light: 0,
                    created_at: new Date()
                },
                devices: devices,
                chartData: chartData
            }
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Unable to load dashboard data',
                details: error.message
            }
        });
    }
});

// API: Lấy dữ liệu sensors với phân trang và tìm kiếm
router.get('/data-sensors', async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy || 'created_at',
            sortOrder: req.query.sortOrder || 'DESC',
            search: req.query.search || '',
            searchField: req.query.searchField || 'all'
        };

        const result = await SensorModel.getList(options);

        res.json({
            success: true,
            data: result,
            query: req.query
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Unable to load sensor data',
                details: error.message
            }
        });
    }
});

// API: Lấy lịch sử hành động với phân trang và filter
router.get('/action-history', async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy || 'created_at',
            sortOrder: req.query.sortOrder || 'DESC',
            search: req.query.search || '',
            searchField: req.query.searchField || 'all',
            deviceFilter: req.query.deviceFilter || 'all',
            actionFilter: req.query.actionFilter || 'all'
        };

        const result = await ActionModel.getList(options);

        res.json({
            success: true,
            data: result,
            query: req.query
        });
    } 
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Unable to load action history',
                details: error.message
            }
        });
    }
});

// API: Lấy thông tin profile
router.get('/profile', (req, res) => {
    res.json({
        success: true,
        data: {
            profile: {
                name: 'Dương Hải Lưu',
                studentId: 'B22DCCN513',
                class: 'D22HTTT05',
                phone: '0347424675',
                email: 'LuuDH.B22CN513@stu.ptit.edu.vn'
            }
        }
    });
});

module.exports = router;