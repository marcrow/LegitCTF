#!/bin/bash

# This script is one of the 4 main script used to configure the ctf environment
# It is used to build docker containers and start them

# Set dir variable to the script directory
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Load styles.sh
source "${dir}/styles.sh"

cd "${dir}/.."

# Build the docker containers
title "Build & Start containers"
title1 "Clean docker containers"
warning "This operation will stop and remove all the ctf containers"
info "All your data inside these containers will be lost"
ask "Do you want to continue? (y/n) "
title2 "Stop docker containers"
docker compose down -v
title2 "Try to remove older docker containers"
docker compose rm 
title2 "Build the docker containers"
info "This operation may take a few minutes, please wait until the end..."
docker compose build --no-cache
if [ $? -ne 0 ]; then
    error "An error occurred while building the docker containers."
fi

success "The docker containers have been built successfully."

title2 "Start the docker containers"
info "This operation may take a few minutes, please wait until the end..."
docker compose up -d
if [ $? -ne 0 ]; then
    error "An error occurred while starting the docker containers."
fi
success "The docker containers have been started successfully."

containers=$(docker compose images)
success "The following containers have been started: "
echo "${containers}"

db_container=$(echo "$containers" | cut -d " " -f1 | grep db)
app_container=$(echo "$containers" | cut -d " " -f1 | grep app)
# Test if the db_container and app_container are set
if [ -z "$db_container" ] || [ -z "$app_container" ]; then
    error "The db_container or app_container is not set"
fi

title1 "Add docker container names to the ansible configuration"


ansible_docker_inventory="${dir}/../ansible/inventory/group_vars/all.yml"
# Test if the file exists
if [ ! -f $ansible_docker_inventory ]; then
    error "The file $ansible_docker_inventory does not exist"
fi

# test if the db_container and app_container are set in the file
if ! grep -q "db_container_name: " "$ansible_docker_inventory"; then
    echo "db_container_name: $db_container" >> "$ansible_docker_inventory"
else
    sed -i "s#\(db_container_name: \).*#\1$db_container#" "$ansible_docker_inventory"
fi
if ! grep -q "app_container_name: " "$ansible_docker_inventory"; then

    echo "app_container_name: $app_container" >> "$ansible_docker_inventory"
else
    sed -i "s#\(app_container_name: \).*#\1$app_container#" "$ansible_docker_inventory"
fi

success "The docker container names have been added to the ansible configuration"


