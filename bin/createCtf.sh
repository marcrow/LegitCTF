#!/bin/bash

# This script is used to create a new ctf

# Set dir variable to the script directory
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

default_start_time=8
default_end_time=18

# Load styles.sh
source "${dir}/styles.sh"

#---------------------Functions---------------------#

function check_date() {
    valid_date=$1
    while [[ ! $(date -d"$valid_date" +%Y-%m-%d 2>/dev/null) == $valid_date ]]; do
        info "The date $valid_date is not a valid date"
        ask "Please enter a valid date (DD-MM-YYYY): "
        valid_date="$response"
    done
}

function check_time() {
    if [[ -z "$1" || $input_time -gt 24 ]]; then
        info "Use default time slot $default_start_time-$default_end_time"
        start_time="$default_start_time"
        end_time="$default_end_time"
    fi

    if ! date -d "$1" &>/dev/null; then
        info "The time $1 is not a valid time"
        start_time="$default_start_time"
        end_time="$default_end_time"
    fi
}

function check_hour() {
    if [ -z "$1" ]; then
        if [ "$2" == "start" ]; then
            info "Use default start hour $default_start_time"
            start_hour=$default_start_time
        else
            info "Use default end hour $default_end_time"
            end_hour=$default_end_time
        fi

    fi
    hour=$1

    # If hour start by 0, remove it
    if [[ "$1" =~ ^0[0-9]+$ ]]; then
            hour="${1:1}"
            if [ "$2" == "start" ]; then
                start_hour=$hour
            else
                end_hour=$hour
            fi
    fi

    if ! [[ "$hour" =~ ^([01]?[0-9]|2[0-3])$ ]]; then
        if [ "$2" == "start" ]; then
            info "The hour $hour is not a valid hour"
            info "Use default start hour $default_start_time"
            start_hour="$default_start_time"
        else
            info "The hour $hour is not a valid hour"
            info "Use default end hour $default_end_time"
            end_hour="$default_end_time"
        fi
    else
        if [ "$2" == "start" ]; then
            start_hour=$hour
        else
            end_hour=$hour
        fi
    fi
}


#---------------------Start of the script---------------------#

title "Create a new ctf"
title1 "Configure the ctf"


# Check if containers are up
containers_is_up

# Read ctf name from user
ask "Enter the ctf name: "
ctf_name=$response

# Check if the ctf name is not empty
if [ -z "$ctf_name" ]; then
    error "The ctf name cannot be empty"
fi


sql="SELECT ctf_name FROM ctfs WHERE ctf_name='$ctf_name';"
sql_request "$sql"
echo $result
overwrite=false
if [ ! -z "$result" ]; then
    info "The ctf name already exists"
    ask "Do you want to overwrite the ctf? (y/n) "
    if [ "$response" == "n" ]; then
        exit 0
    else
        overwrite=true
    fi
fi




ask "Ctf first day (YYYY-MM-DD): "
check_date "$response"
first_day=$valid_date


ask "Ctf last day (YYYY-MM-DD): "
check_date "$response"
last_day=$valid_date

ask "Start hour (HH) - default 8 :"
start_hour=$response
check_hour "$response" "start"


ask "End hour (HH) - default 18 :"
end_hour=$response
check_hour "$response" "end"

if $overwrite; then
    info "Overwrite the  $ctf_name ctf"
    sql="UPDATE ctfs SET start_date='$first_day', end_date='$last_day', start_hour='$start_hour', end_hour='$end_hour' WHERE ctf_name='$ctf_name';"
else 
    sql="INSERT INTO ctfs (ctf_name, start_date, end_date, start_hour, end_hour) VALUES ('$ctf_name', '$first_day', '$last_day', '$start_hour', '$end_hour');"
fi
# Create SQL request to create ctf in the ctf table


sql_request "${sql}"
echo $result

if [ $? -ne 0 ]; then
    error "An error occurred while creating the ctf"
else 
    if $overwrite; then
        success "The ctf has been updated successfully"
    else
        success "The ctf has been created successfully"
    fi
fi



# retrieve the ctf id
sql="SELECT ctf_id FROM ctfs WHERE ctf_name='$ctf_name';"
sql_request "${sql}"
result=$(echo $result | cut -d " " -f2)
ctf_id=$result
# test if the ctf_id is set
if [ -z "$ctf_id" ]; then
    error "The ctf_id is not set"
fi
# extract the ctf_id from the result
ctf_id=$(echo $ctf_id | cut -d " " -f2)
echo $ctf_id

# Create a new ansible hosts inventory file based on the ctf name
ansible_inventory="${dir}/../ansible/inventory/${ctf_name}_hosts.yml"
ansible_inventory_ansible="./inventory/${ctf_name}_hosts.yml"
ansible_template="${dir}/resources/hosts_template.yml"



if [ -f $ansible_inventory ]; then
    info "The file $ansible_inventory already exists"
    echo "Skip the creation of the ansible inventory file"
else 
    title1 "Add the ctf to ansible"
    # Test if the hosts template file exists
    if [ ! -f $ansible_template ]; then
        error "The file $ansible_template does not exist"
    fi

    # Copy the hosts template file to the new inventory file
    cp $ansible_template $ansible_inventory
    # Test if the file has been created
    if [ ! -f $ansible_inventory ]; then
        error "The file $ansible_inventory has not been created"
    fi

    # Replace the ctf_name in the inventory file
    sed -i "s/ctf: .*/ctf: $ctf_name/g" $ansible_inventory
    # Test if the ctf_name has been replaced
    if ! grep -q "ctf: ${ctf_name}" $ansible_inventory; then
        error "The ctf_name has not been replaced"
    fi

    # Replace the ctf_id in the inventory file
    sed -i "s/ctf_id: .*/ctf_id: $ctf_id/g" $ansible_inventory
    # Test if the ctf_id has been replaced
    if ! grep -q "ctf_id: ${ctf_id}" $ansible_inventory; then
        error "The ctf_id has not been replaced"
    fi

    source "${dir}/../myapp/.env"
    host=$(echo $MACHINE_NETWORK | cut -d "." -f1-3)
    host="$host.1"
    ask "Enter the vm host ip - used by vm to communicate with the ctf server (auto: $host): "
    if [ ! -z "$response" ]; then
        vm_host_ip=$response
    else
        vm_host_ip=$host
    fi
    sed -i "s/vm_host_ip: .*/vm_host_ip: $vm_host_ip/g" $ansible_inventory
    if ! grep -q "vm_host_ip: ${vm_host_ip}" $ansible_inventory; then
        error "The vm_host_ip has not been replaced"
    fi

    success "The ansible inventory ($ctf_name_hosts.yml) file has been created successfully"
fi


ask "Do you want to set this ctf as default ctf for ansible? (y/n) "
if [ "$response" == "y" ]; then
    # Update ansiblke.cfg file
    ansible_cfg="${dir}/../ansible/ansible.cfg"
    if [ ! -f $ansible_cfg ]; then
        error "The file $ansible_cfg does not exist"
    fi

    # Add the new inventory file to the ansible.cfg file
    sed -i "s#\(inventory = \).*#\1$ansible_inventory_ansible#" $ansible_cfg

    # Test if the inventory file has been added to the ansible.cfg file
    if ! grep -q "inventory = $ansible_inventory_ansible" $ansible_cfg; then
        error "The inventory file has not been added to the ansible.cfg file"
    fi
    success "The new ctf is set as default ctf for ansible"
    echo "If you want to change the default ctf, please update the ansible.cfg file"
fi

info "CTF creation is done, you can now start to create machines for this ctf"


# Create machines
ask "Do you want to create machines? (y/n) "
if [ "$response" == "n" ]; then
    echo "Ok, as you want..."
    info "If you want to create machines later, you can run the createMachine.sh script"
else
    ${dir}/createMachine.sh $ctf_id
    if [ $? -ne 0 ]; then
        error "An error occurred while executing the createMachine.sh script."
    fi
    ask "Do you want to create instances for the machines? (y/n) "
    if [ "$response" == "n" ]; then
        echo "Ok, as you want..."
        info "If you want to create instances later, you can run the createInstance.sh script"
    else
        ${dir}/createInstance.sh $ctf_id $ctf_name
        if [ $? -ne 0 ]; then
            error "An error occurred while executing the createInstance.sh script."
        fi
    fi
fi

title1 " Create participant for the ctf"
echo "Connect to the ctf platform as admin and create a new user"
source "${dir}/../myapp/.env"
echo "https://127.0.0.1:$PORT/admin" 