

-- Tạo bảng sensors_data
CREATE TABLE sensors_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(5,2) NOT NULL,
    humidity DECIMAL(5,2) NOT NULL,
    light INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
);

-- Tạo bảng action_history
CREATE TABLE action_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device VARCHAR(50) NOT NULL,
    action VARCHAR(10) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_device (device)
);

