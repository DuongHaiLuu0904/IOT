const { pool } = require('../config/database');

class SensorModel {
    // Tạo bản ghi sensor data mới
    static async create(data) {
        try {
            const query = `
                INSERT INTO sensors_data (temperature, humidity, light, created_at)
                VALUES (?, ?, ?, NOW())
            `;
            const [result] = await pool.execute(query, [
                data.temperature,
                data.humidity,
                data.light
            ]);
            return result.insertId;
        } catch (error) {
            throw new Error(`Failed to create sensor data: ${error.message}`);
        }
    }

    // Lấy dữ liệu sensor mới nhất
    static async getLatest() {
        try {
            if (!pool) {
                throw new Error('Database pool not available');
            }
            
            const query = `
                SELECT * FROM sensors_data 
                ORDER BY created_at DESC 
                LIMIT 1
            `;
            const [rows] = await pool.query(query);
            return rows[0] || null;
        } catch (error) {
            console.error('Error in getLatest:', error);
            return null;
        }
    }

    // Lấy danh sách sensor data với pagination, sorting và search
    static async getList(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'created_at',
                sortOrder = 'DESC',
                search = '',
                searchField = 'all'
            } = options;

            // Đảm bảo page và limit là số hợp lệ
            const pageInt = parseInt(page) || 1;
            const limitInt = parseInt(limit) || 10;
            const offset = (pageInt - 1) * limitInt;
            
            const validSortColumns = ['id', 'temperature', 'humidity', 'light', 'created_at'];
            const validSortOrders = ['ASC', 'DESC'];
            const validSearchFields = ['all', 'id', 'temperature', 'humidity', 'light', 'created_at'];
            
            // Xác thực các tham số sắp xếp
            const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
            const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
            const finalSearchField = validSearchFields.includes(searchField) ? searchField : 'all';

            let whereClause = '';
            let queryParams = [];
            let searchPattern = '';

            // Thêm chức năng tìm kiếm theo trường
            if (search && search.trim()) {
                searchPattern = `%${search.trim()}%`;
                
                if (finalSearchField === 'all') {
                    whereClause = `
                        WHERE temperature LIKE ? 
                        OR humidity LIKE ? 
                        OR light LIKE ? 
                        OR DATE_FORMAT(created_at, '%Y/%m/%d %H:%i:%s') LIKE ?
                        OR DATE_FORMAT(created_at, '%Y/%m/%d') LIKE ?
                    `;
                    queryParams = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];
                } else if (finalSearchField === 'id') {
                    whereClause = `WHERE id LIKE ?`;
                    queryParams = [searchPattern];
                } else if (finalSearchField === 'temperature') {
                    whereClause = `WHERE temperature LIKE ?`;
                    queryParams = [searchPattern];
                } else if (finalSearchField === 'humidity') {
                    whereClause = `WHERE humidity LIKE ?`;
                    queryParams = [searchPattern];
                } else if (finalSearchField === 'light') {
                    whereClause = `WHERE light LIKE ?`;
                    queryParams = [searchPattern];
                } else if (finalSearchField === 'created_at') {
                    // Hỗ trợ search theo cả định dạng đầy đủ (2025/10/03 01:43:32) và chỉ ngày (2025/10/03)
                    whereClause = `
                        WHERE DATE_FORMAT(created_at, '%Y/%m/%d %H:%i:%s') LIKE ?
                        OR DATE_FORMAT(created_at, '%Y/%m/%d') LIKE ?
                        OR DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') LIKE ?
                        OR DATE_FORMAT(created_at, '%Y-%m-%d') LIKE ?
                    `;
                    queryParams = [searchPattern, searchPattern, searchPattern, searchPattern];
                }
            }

            // Truy vấn chính với SQL 
            const query = `
                SELECT id, temperature, humidity, light, created_at
                FROM sensors_data 
                ${whereClause}
                ORDER BY ${finalSortBy} ${finalSortOrder}
                LIMIT ${limitInt} OFFSET ${offset}
            `;

            // Truy vấn đếm cho phân trang
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM sensors_data 
                ${whereClause}
            `;
            const countParams = queryParams; // Sử dụng cùng params với query chính

            // Thực hiện cả hai truy vấn
            const [rows] = await pool.execute(query, queryParams);
            const [countResult] = await pool.execute(countQuery, countParams);
            
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limitInt);

            return {
                data: rows,
                pagination: {
                    currentPage: pageInt,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limitInt,
                    limit: limitInt,
                    hasNext: pageInt < totalPages,
                    hasPrev: pageInt > 1
                },
                sorting: {
                    sortBy: finalSortBy,
                    sortOrder: finalSortOrder
                }
            };
        } catch (error) {
            throw new Error(`Failed to get sensor list: ${error.message}`);
        }
    }

    // Lấy dữ liệu cho biểu đồ (last N records)
    static async getChartData(limit = 50) {
        try {
            // Đảm bảo limit là số nguyên
            const limitInt = parseInt(limit) || 50;
            
            // Kiểm tra kết nối pool trước
            if (!pool) {
                throw new Error('Database pool not available');
            }
            
            // Sử dụng truy vấn trực tiếp 
            const query = `
                SELECT temperature, humidity, light, created_at
                FROM sensors_data 
                ORDER BY created_at DESC
                LIMIT ${limitInt}
            `;
            
            const [rows] = await pool.query(query);
            
            // Reverse để có thứ tự thời gian tăng dần cho biểu đồ
            return rows.reverse();
        } catch (error) {
            console.error('Detailed error in getChartData:', error);
            // Trả về mảng rỗng làm phương án dự phòng
            return [];
        }
    }
}

module.exports = SensorModel;