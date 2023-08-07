CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id CHAR(36) UNIQUE,
  title VARCHAR(255),
  summary VARCHAR(1000),
  cover VARCHAR(255),
  published BOOLEAN,
  author VARCHAR(100),
  category VARCHAR(100),
  posted_at TIMESTAMP,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  post_slug VARCHAR(255)
);
