#!/bin/bash

# Read username and password from user
read -p "Enter new admin username: " username
read -s -p "Enter password: " password
echo

# Concatenate username and password
concatenated="${username}${password}"

# Hash the concatenated string with sha512
hashed=$(echo -n "$concatenated" | sha512sum | awk '{print $1}')

# Create SQL request to create admin in the admin table
sql="INSERT INTO admin (username, password) VALUES ('$username', '$hashed');"

# Connect to the database and execute the SQL request
source ../myapp/.env
# mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST -D $DB_NAME -e "$sql"
docker exec -it ctf_esgi_db_1 mariadb -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e "${sql}"
echo "Return code $?"