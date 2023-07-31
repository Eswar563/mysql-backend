-- CREATE TABLE users (
--   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
--   user_id CHAR(36) UNIQUE,
--   full_name VARCHAR(255) NOT NULL,
--   email_address VARCHAR(255) UNIQUE NOT NULL,
--   password VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   last_logged_in TIMESTAMP,
--   isActive BOOLEAN DEFAULT FALSE,
--   address TEXT,
--   phone_number VARCHAR(20),
--   order_sum DECIMAL(10, 2) DEFAULT 0.00,
--   is_email_verified BOOLEAN DEFAULT FALSE,
--   is_phone_verified BOOLEAN DEFAULT FALSE,
--   is_admin BOOLEAN DEFAULT FALSE
-- );


ALTER TABLE users
ADD COLUMN gender VARCHAR(10);
