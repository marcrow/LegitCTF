CREATE DATABASE IF NOT EXISTS esgi_db;
GRANT ALL ON esgi_db.* TO 'ctf-server'@'%';

USE esgi_db;


-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
    -- Add other user details here
);

-- CTFs Table
CREATE TABLE IF NOT EXISTS ctfs (
    ctf_id INT AUTO_INCREMENT PRIMARY KEY,
    ctf_name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    start_hour INT,  -- hour of the day 
    end_hour INT -- hour of the day
    -- Add other CTF details here
);

-- Users_CTFs Table
CREATE TABLE IF NOT EXISTS users_ctfs (
    user_id INT,
    ctf_id INT,
    attempt INT, 
    PRIMARY KEY (user_id, ctf_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (ctf_id) REFERENCES ctfs(ctf_id)
);



-- CTFs_Machines Table
CREATE TABLE IF NOT EXISTS ctfs_machines (
    ctf_id INT,
    machine_name VARCHAR(100) NOT NULL,
    nb_point INT,
    difficulty VARCHAR(30) NOT NULL,
    current_key VARCHAR(30) NOT NULL,
    old_key VARCHAR(30) NOT NULL,
    IP VARCHAR(15),  -- Added IP column to store IP address of the machine
    PRIMARY KEY (machine_name, ctf_id),
    FOREIGN KEY (ctf_id) REFERENCES ctfs(ctf_id)
);

-- Compromised_Machines Table
CREATE TABLE IF NOT EXISTS pwned (
    ctf_id INT,
    ctf_machine_name VARCHAR(100),
    user_id INT,
    compromise_time DATETIME,
    PRIMARY KEY (ctf_id, ctf_machine_name, user_id),
    FOREIGN KEY (ctf_machine_name, ctf_id) REFERENCES ctfs_machines(machine_name, ctf_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    -- Add other details for each compromise here
);

/*
    Inserting some dummy data for testing
*/      
INSERT INTO users (username, password) VALUES ('prof', 'ThisIsATestUser');
INSERT INTO users (username, password) VALUES ('prof1', 'ThisIsATestUser');
INSERT INTO users (username, password) VALUES ('prof2', 'ThisIsATestUser');

INSERT INTO ctfs (ctf_name, start_date, end_date, start_hour, end_hour)
VALUES ('Awesome CTF Challenge', '2024-01-10', '2024-01-12',8,18);
INSERT INTO ctfs (ctf_name, start_date, end_date, start_hour, end_hour)
VALUES ('Awesome CTF Challenge 2', '2024-01-10', '2024-01-11',9,17);


INSERT INTO users_ctfs (user_id, ctf_id, attempt)
VALUES (1, 1, 1); 
INSERT INTO users_ctfs (user_id, ctf_id, attempt)
VALUES (2, 1, 1); 
INSERT INTO users_ctfs (user_id, ctf_id, attempt)
VALUES (3, 1, 1); 

INSERT INTO ctfs_machines (ctf_id, machine_name, nb_point, difficulty, current_key, old_key)
VALUES (1, 'MachineAlpha', 50, 'Hard', 'key123', 'oldkey321');

INSERT INTO pwned (ctf_id, ctf_machine_name, user_id, compromise_time)
VALUES (1, 'MachineAlpha', 1, '2024-01-11 14:35:00'); 
INSERT INTO pwned (ctf_id, ctf_machine_name, user_id, compromise_time)
VALUES (1, 'MachineAlpha', 2, '2024-01-11 16:37:00'); 


INSERT INTO users_ctfs (user_id, ctf_id, attempt)
VALUES (1, 2, 1); 
INSERT INTO users_ctfs (user_id, ctf_id, attempt)
VALUES (2, 2, 1); 


INSERT INTO ctfs_machines (ctf_id, machine_name, nb_point, difficulty, current_key, old_key)
VALUES (2, 'MachineAlpha', 50, 'Hard', 'key123', 'oldkey321');
INSERT INTO ctfs_machines (ctf_id, machine_name, nb_point, difficulty, current_key, old_key)
VALUES (2, 'Rabbit', 50, 'Hard', 'key123', 'oldkey321');

INSERT INTO pwned (ctf_id, ctf_machine_name, user_id, compromise_time)
VALUES (2, 'MachineAlpha', 1, '2024-01-11 14:35:00'); 
INSERT INTO pwned (ctf_id, ctf_machine_name, user_id, compromise_time)
VALUES (2, 'MachineAlpha', 2, '2024-01-11 16:37:00'); 
INSERT INTO pwned (ctf_id, ctf_machine_name, user_id, compromise_time)
VALUES (2, 'Rabbit', 2, '2024-01-11 17:37:00'); 