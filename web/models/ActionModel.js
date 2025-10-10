const { pool } = require('../config/database');

class ActionModel {
    // Tạo bản ghi action history mới
    static async create(data) {
        try {
            const query = `
                INSERT INTO action_history (device, action, created_at)
                VALUES (?, ?, NOW())
            `;
            const [result] = await pool.execute(query, [
                data.device,
                data.action
            ]);
            return result.insertId;
        } catch (error) {
            throw new Error(`Failed to create action record: ${error.message}`);
        }
    }

    // Lấy danh sách action history với pagination, sorting, search và filter
    static async getList(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'created_at',
                sortOrder = 'DESC',
                search = '',
                searchField = 'all',
                deviceFilter = 'all',
                actionFilter = 'all'
            } = options;

            // Đảm bảo page và limit là số hợp lệ
            const pageInt = parseInt(page) || 1;
            const limitInt = parseInt(limit) || 10;
            const offset = (pageInt - 1) * limitInt;
            
            const validSortColumns = ['id', 'device', 'action', 'created_at'];
            const validSortOrders = ['ASC', 'DESC'];
            const validSearchFields = ['all', 'id', 'device', 'action', 'created_at'];
            
            // Xác thực các tham số sắp xếp
            const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
            const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
            const finalSearchField = validSearchFields.includes(searchField) ? searchField : 'all';

            let whereClause = '';
            let queryParams = [];
            let searchPattern = '';
            let whereParts = [];

            // Chức năng lọc theo thiết bị
            if (deviceFilter && deviceFilter !== 'all') {
                whereParts.push('device = ?');
                queryParams.push(deviceFilter);
            }

            // Chức năng lọc theo hành động
            if (actionFilter && actionFilter !== 'all') {
                whereParts.push('action = ?');
                queryParams.push(actionFilter);
            }

            // chức năng tìm kiếm theo trường
            if (search && search.trim()) {
                searchPattern = `%${search.trim()}%`;
                
                if (finalSearchField === 'all') {
                    whereParts.push(`(
                        device LIKE ? 
                        OR action LIKE ?    
                        OR DATE_FORMAT(created_at, '%Y/%m/%d %H:%i:%s') LIKE ?
                        OR DATE_FORMAT(created_at, '%Y/%m/%d') LIKE ?
                        OR DATE_FORMAT(created_at, '%Y/%m/%d %h:%i:%s %p') LIKE ?
                    )`);
                    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
                } else if (finalSearchField === 'id') {
                    whereParts.push('id LIKE ?');
                    queryParams.push(searchPattern);
                } else if (finalSearchField === 'device') {
                    whereParts.push('device LIKE ?');
                    queryParams.push(searchPattern);
                } else if (finalSearchField === 'action') {
                    whereParts.push('action LIKE ?');
                    queryParams.push(searchPattern);
                } else if (finalSearchField === 'created_at') {
                    whereParts.push(`(
                        DATE_FORMAT(created_at, '%Y/%m/%d %H:%i:%s') LIKE ?
                        OR DATE_FORMAT(created_at, '%Y/%m/%d') LIKE ?
                        OR DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') LIKE ?
                        OR DATE_FORMAT(created_at, '%Y-%m-%d') LIKE ?
                        OR DATE_FORMAT(created_at, '%d/%m/%Y') LIKE ?
                        OR DATE_FORMAT(created_at, '%H:%i:%s') LIKE ?
                        OR DATE_FORMAT(created_at, '%Y/%m/%d %h:%i:%s %p') LIKE ?
                        OR DATE_FORMAT(created_at, '%h:%i:%s %p') LIKE ?
                    )`);
                    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
                }
                
            }

            // Kết hợp tất cả điều kiện WHERE
            if (whereParts.length > 0) {
                whereClause = 'WHERE ' + whereParts.join(' AND ');
            }

            // Truy vấn chính 
            const query = `
                SELECT id, device, action, created_at
                FROM action_history 
                ${whereClause}
                ORDER BY ${finalSortBy} ${finalSortOrder}
                LIMIT ${limitInt} OFFSET ${offset}
            `;

            // Truy vấn đếm cho phân trang
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM action_history 
                ${whereClause}
            `;
            const countParams = queryParams; 

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
            throw new Error(`Failed to get action history list: ${error.message}`);
        }
    }

    // Lấy action mới nhất cho từng thiết bị
    static async getLatestForAllDevices() {
        try {
            const query = `
                SELECT DISTINCT
                    device,
                    action,
                    created_at
                FROM action_history a1
                WHERE a1.created_at = (
                    SELECT MAX(a2.created_at)
                    FROM action_history a2
                    WHERE a2.device = a1.device
                )
                ORDER BY device
            `;
            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            throw new Error(`Failed to get latest actions: ${error.message}`);
        }
    }

}

module.exports = ActionModel;