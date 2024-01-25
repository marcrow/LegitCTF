#!/bin/bash

# return codes:
# 0 - success
# 1 - configuration file not found
# 2 - error during initial authentication
# 3 - error during pwn request
# 4 - cookie file not found
# 5 - password cannot be empty
# 6 - unknown error - unable to extract cookie

config_file="./flag.conf"

if [[ ! -f "$config_file" ]]; then
    echo "Configuration file not found!"
    exit 1
fi

# Function to retrieve parameters from flag.conf file
retrieve_parameters() {
    if [[ -f "$config_file" ]]; then
        ctf_server=$(grep "CTF_SERVER" "$config_file" | cut -d "=" -f 2)
        default_password=$(grep "DEFAULT_PASSWORD" "$config_file" | cut -d "=" -f 2)
        machine_name=$(grep "MACHINE_NAME" "$config_file" | cut -d "=" -f 2)
        ctf_id=$(grep "CTF_ID" "$config_file" | cut -d "=" -f 2)
        instance_id=$(grep "INSTANCE_ID" "$config_file" | cut -d "=" -f 2)
    else
        echo "Configuration file not found!"
        exit 1
    fi
}

remove_password() {
    if grep -q "^$1=" "$config_file"; then
        sed -i "s/^$1=.*/$1=/g" "$config_file"
    fi
}

retrieve_cookie() {
    if [[ -f "./cookie.txt" ]]; then
        cookie=$(cat ./cookie.txt)
    else
        echo "Cookie file not found!"
        exit 4
    fi
}


insert_parameters(){
    #$1 parameter name
    #$2 parameter value
    if grep -q "^$1=" "$config_file"; then
        sed -i "s/^$1=.*/$1=$2/g" "$config_file"
    else
        echo "$1=$2" >> "$config_file"
    fi
}


ask_for_password() {
    echo "Please enter your password to validate the machine:"
    read -s password
}

save_cookie() {
    cookie=$1
    if [[ $cookie == "" ]]; then
        echo "Unknown error - Unable to extract cookie!"
        echo "Response Body: $result"
        exit 6
    fi
    echo "$cookie" > cookie.txt
}

extract_cookie(){
    result=$1
    cookie=$(echo $result | cut -d '"' -f 4)
    save_cookie "$cookie"
}


# Function to perform initial authentication
first_auth() {
    # Add your code here
    echo "Performing initial authentication..."
    retrieve_parameters
    if [[ $default_password == "" ]]; then
        echo "Error: Default password cannot be empty!"
        exit 5
    fi
    result=$(curl -s --cacert ./cert.pem   --location "$ctf_server/machines/firstAuth" \
    --header 'Content-Type: application/json' \
    --data '{
        "ctf_id": "'"$ctf_id"'",
        "machine_name": "'"$machine_name"'",
        "ip": "'"$dest_ip"'",
        "default_password": "'"$default_password"'"
    }')
    status=$?
    
    if [[ $result == *"Error"* ]]; then
        echo "$result"
        exit 2
    fi
    if [[ $status -ne 0 ]]; then
        echo "Error: curl request failed"
        echo $result
        echo "Curl status: $status"
        exit 2
    fi
    cookie=$(echo $result | cut -d ":" -f 3 | cut -d '"' -f 2)
    instance=$(echo $result | cut -d ":" -f 2 | cut -d ',' -f 1)
    echo "Cookie: $cookie"
    echo "Instance: $instance"
    if [[ $cookie == "" ]]; then
        echo "Unknown error during initial authentication! No cookie found"
        echo "Response Body: $result"
        exit 2
    fi
    #------------------do not forget to uncomment the following lines------------------
    # remove_password "DEFAULT_PASSWORD"
    insert_parameters "INSTANCE_ID" $instance
    echo "$cookie" > cookie.txt
    echo "Response Body: $result"
}



# Function to exploit the system
pwned() {
    retrieve_parameters
    retrieve_cookie
    ask_for_password
    echo $password
    if [[ $password == "" ]]; then
        echo "Password cannot be empty!"
        exit 5
    fi

    echo '{
            "ctf_id": '"$ctf_id"',
            "instance_id": '"$instance_id"',
            "machine_name": "'"$machine_name"'",
            "password": "'"$password"'"
        }'

    result=$(curl -s --cacert cert.pem --location "$ctf_server/machines/pwn" \
        --header 'Content-Type: application/json' \
        --header "Cookie: Cookie_machine=$cookie" \
        --data '{
            "ctf_id": '"$ctf_id"',
            "instance_id": '"$instance_id"',
            "machine_name": "'"$machine_name"'",
            "password": "'"$password"'"
        }')
    status=$?
    if [[ $result == *"Error"* ]]; then
        echo "$result"
        exit 3
    fi    
    if [[ $? -ne 0 ]]; then
        echo "Error: curl request failed"
        exit 3
    fi
    echo "Response Body: $result"
    extract_cookie "$result"
}
    

# Check arguments and execute appropriate function
if [[ $1 == "-f" || $1 == "--first" ]]; then
    first_auth
    exit 0
elif [[ $1 == "-p" || $1 == "--pwned" || $# -eq 0 ]]; then
    pwned
    exit 0
else
    echo "Invalid argument provided!"
    exit 1
fi
