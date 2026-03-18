CREATE DATABASE IF NOT EXISTS finalDB;
USE finalDB;


CREATE TABLE users (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    userName VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE convoys (
    convoyID INT AUTO_INCREMENT PRIMARY KEY,
    joinCode VARCHAR(12) NOT NULL UNIQUE,
    host_userID INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (host_userID) REFERENCES users(userID)
);

CREATE TABLE convoy_members (
    userID INT NOT NULL,
    convoyID INT NOT NULL,
    role ENUM('host','member') NOT NULL DEFAULT 'member',
    PRIMARY KEY (userID, convoyID),
    FOREIGN KEY (userID) REFERENCES users(userID),
    FOREIGN KEY (convoyID) REFERENCES convoys(convoyID)
);

CREATE TABLE gps (
    userID INT PRIMARY KEY,
    convoyID INT NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES users(userID),
    FOREIGN KEY (convoyID) REFERENCES convoys(convoyID)
);

CREATE TABLE communication (
    callID INT AUTO_INCREMENT PRIMARY KEY,
    convoyID INT NOT NULL,
    provider_call_id VARCHAR(100),
    status ENUM('active','ended') NOT NULL DEFAULT 'active',
    startedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    endedAt DATETIME NULL,
    FOREIGN KEY (convoyID) REFERENCES convoys(convoyID)
);

/* test users */
INSERT INTO users (userName, first_name, last_name, email, password)
VALUES 
('JMomen', 'Momen', 'Jaber', 'momen66572@gmail.com', 'Test123!'),
('TestUser2', 'Ali', 'Khan', 'ali@example.com', 'Test456!');

/* create convoy */
INSERT INTO convoys (joinCode, host_userID, name)
VALUES ('Test123', 1, 'Sunday Cruise');

/* put host in convoy */
INSERT INTO convoy_members (userID, convoyID, role)
VALUES (1, LAST_INSERT_ID(), 'host');

/* another user joins */
INSERT INTO convoy_members (userID, convoyID, role)
SELECT 2, convoyID, 'member'
FROM convoys
WHERE joinCode = 'Test123';

/* view members in convoy */
SELECT u.userName, cm.role
FROM convoy_members cm
JOIN users u ON u.userID = cm.userID
WHERE cm.convoyID = 1;

/* view all tables */
SELECT * FROM users;
SELECT * FROM convoys;
SELECT * FROM convoy_members;
SELECT * FROM gps;
SELECT * FROM communication;

USE userDB;
SELECT * FROM users;

