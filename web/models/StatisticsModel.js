const { pool } = require('../config/database');

class StatisticsModel {
    static async getSensorThresholdStats(thresholds = {}, timeFilter = {}) {
        try {
            const {
                temperatureMax = 35,
                humidityMax = 80,
                lightMax = 800
            } = thresholds;

            const {
                startDate = null,
                endDate = null
            } = timeFilter;

            let timeCondition = '';
            if (startDate && endDate) {
                timeCondition = `AND created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)`;
            } else {
                timeCondition = `AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`;
            }

            const query = `
                SELECT 
                    'temperature' AS sensor_type,
                    'Nhiệt độ' AS sensor_name,
                    COUNT(*) AS violation_count,
                    ? AS threshold_value
                FROM sensors_data
                WHERE temperature > ?
                ${timeCondition}
                
                UNION ALL
                
                SELECT 
                    'humidity' AS sensor_type,
                    'Độ ẩm' AS sensor_name,
                    COUNT(*) AS violation_count,
                    ? AS threshold_value
                FROM sensors_data
                WHERE humidity > ?
                ${timeCondition}
                
                UNION ALL
                
                SELECT 
                    'light' AS sensor_type,
                    'Ánh sáng' AS sensor_name,
                    COUNT(*) AS violation_count,
                    ? AS threshold_value
                FROM sensors_data
                WHERE light > ?
                ${timeCondition}
            `;

            // Tham số query
            let params;
            if (startDate && endDate) {
                params = [
                    temperatureMax, temperatureMax, startDate, endDate,
                    humidityMax, humidityMax, startDate, endDate,
                    lightMax, lightMax, startDate, endDate
                ];
            } else {
                params = [
                    temperatureMax, temperatureMax,
                    humidityMax, humidityMax,
                    lightMax, lightMax
                ];
            }

            const [rows] = await pool.execute(query, params);

            return rows;
        } catch (error) {
            throw new Error(`Failed to get sensor threshold stats: ${error.message}`);
        }
    }

    static async getDeviceActivationStats(timeFilter = {}) {
        try {
            const {
                startDate = null,
                endDate = null
            } = timeFilter;

            let timeCondition = '';
            let params = [];
            
            if (startDate && endDate) {
                timeCondition = `WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)`;
                params = [startDate, endDate];
            } else {
                timeCondition = `WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`;
            }

            const query = `
                SELECT 
                    device,
                    SUM(CASE WHEN action = 'on' THEN 1 ELSE 0 END) AS on_count
                FROM action_history
                ${timeCondition}
                GROUP BY device
                ORDER BY on_count DESC
            `;

            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Failed to get device activation stats: ${error.message}`);
        }
    }
}

module.exports = StatisticsModel;
