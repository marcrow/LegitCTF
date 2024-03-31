#!/bin/bash

# This script is used to create machine for a ctf
# Machines are challenges. A machine can have multiple instances. So, a VM is an instance of a machine, not a machine itself.


# Set dir variable to the script directory
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Load styles.sh
source "${dir}/styles.sh"

title "Create machine / Challenges"
# If not passed as argument, select the ctf
if [ -z "$1" ]; then
    select_ctf
else
    ctf_id=$1
fi


title2 "List of machines/challenges"
sql="SELECT machine_name FROM ctfs_machines WHERE ctf_id = $ctf_id;"
sql_request "${sql}"
result=$(echo $result | cut -d ' ' -f2- | tr " " "\n")
echo "$result"


ask "did you want to create a new machine/challenge (y/n)"
while [ "$response" == "y" ]; do
    title1 "Create a new machine/challenge"
    machine=""
    while [ -z "$machine" ]; do
        ask "Enter the machine/challenge name: "
        machine=$response
    done
    # ask "Enter difficulty level (easy, medium, hard): "
    # difficulty=$response

    #generate default password
    
    default_password=$(openssl rand -base64 12)
    #test if the password is not empty
    if [ $? -ne 0 ]; then
        error "An error occurred while generating the default password"
    else 
        success "The default password has been generated successfully"
    fi
    sql="INSERT INTO ctfs_machines (ctf_id, machine_name, nb_point, difficulty, default_password) VALUES ('$ctf_id', '$machine', 50, 'medium','$default_password');"
    sql_request "${sql}"
    if [ $? -ne 0 ]; then
        error "An error occurred while creating the machine"
    else 
        success "The machine has been created successfully"
    fi
    ask "did you want to add another machine/challenge (y/n)"
done

echo "Ok, as you want..."
info "If you want to add a machine/challenge later, you can run the createMachine.sh script"




