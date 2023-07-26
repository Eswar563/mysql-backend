CREATE TABLE user (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(500),
    name VARCHAR(500),
    password VARCHAR(255),
    gender VARCHAR(10),
    location VARCHAR(500)
);