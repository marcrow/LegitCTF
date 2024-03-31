#!/bin/bash

# This script is used to create an admin in the ctf database
# to be able to access the admin panel of the web application

# Set dir variable to the script directory
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cert_dir="${dir}/../ansible/secrets"

# Load styles.sh
source "${dir}/styles.sh"

title "Create an admin on the ctf web application"


# Read username and password from user
ask "Enter new admin username: " 
username=$response
askp

# Check if the username is not empty
if [ -z "$username" ]; then
    error "The username cannot be empty"
fi

# Check if the password is not empty
if [ -z "$password" ]; then
    error "The password cannot be empty"
fi


# Concatenate username and password
concatenated="${username}${password}"

# Hash the concatenated string with sha512
hashed=$(echo -n "$concatenated" | sha512sum | awk '{print $1}')

# Create SQL request to create admin in the admin table
sql="INSERT INTO admin (username, password) VALUES ('$username', '$hashed');"

# Connect to the database and execute the SQL request
source "${dir}/../myapp/.env"

cd "${dir}/.."
containers=$(docker-compose images)
db_container=$(echo "$containers" | cut -d " " -f1 | grep db)
app_container=$(echo "$containers" | cut -d " " -f1 | grep app)
# Test if the db_container and app_container are set
if [ -z "$db_container" ] || [ -z "$app_container" ]; then
    error "The db_container or app_container is not set"
fi

echo "docker exec -it $db_container mariadb -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e ${sql}"
# mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST -D $DB_NAME -e "$sql"
docker exec -it $db_container mariadb -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e "${sql}"

if [ $? -ne 0 ]; then
    error "An error occurred while creating the admin"
else 
    success "The admin has been created successfully"
fi
                                                            