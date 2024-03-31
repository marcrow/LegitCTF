#!/bin/bash

# This script is used to create vm instance inside ansible
# Ansible is responsible for creating the vm instance inside the ctf server

# Set dir variable to the script directory
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

instance_template="${dir}/resources/instance_template.yml"


# Load styles.sh
source "${dir}/styles.sh"

function get_new_ip() {
    if [ -z "$1" ]; then 
        #Determining the last ip address from ansible inventory
        last_ip=$(grep "ansible_host" ${dir}/../ansible/inventory/${ctf_name}_hosts.yml | cut -d ":" -f2 | tr -d ' ' | sort -n -t . -k 1,1 -k 2,2 -k 3,3 -k 4,4 | tail -n 1)
    else 
        #passing the last ip address as an argument
        last_ip="$1"
    fi
    if [ -z "$last_ip" ]; then
        #If no machine/challenge found in the ctf
        #extract vm network address from .env
        network=$(grep "NETWORK" ${dir}/../myapp/.env | cut -d "=" -f2)
        #Remove netmask from network
        network=$(echo $network | cut -d "/" -f1)
        #Add 10 to the last octet of the network address
        start_ip=$(echo $network | cut -d "." -f1-3)
        start_ip="$start_ip.$((${network##*.} + 10))"
    else
        #Add 1 to the last octet of the last ip address
        start_ip=$(echo $last_ip | cut -d "." -f1-3)
        start_ip="$start_ip.$((${last_ip##*.} + 1))"
    fi
}





title "Create VM Instance"
info "This script is used to create vm instance inside ansible"
info "Ansible is responsible for creating the vm instance inside the ctf server"
echo "Instance created by this script will not directly add inside the ctf server"
# If not passed as argument, select the ctf
if [[ -z "$1" || -z "$2" ]]; then
    select_ctf
else
    ctf_id=$1
    ctf_name=$2
fi


title2 "Select a machine/challenge"
select_machine


# # List all the instances from ansible/inventories/$ctf_hosts.yml
instances=$(grep -E "^\[.*\]$" ${dir}/../ansible/inventory/${ctf_name}_hosts.yml | sed 's/\[//g' | sed 's/\]//g')


response="y"
while [ "$response" == "y" ]; do
    title1 "Create a new instance for $machine"
    # Set variables ----------
    get_new_ip
    instance_ip="$start_ip"
    #get last octet of the start_ip

    ask "Enter the new instance IP (auto: $instance_ip): "
    if [ ! -z "$response" ]; then
        instance_ip=$response
    fi
    success "Instance IP: $instance_ip"

    last_octet=$(echo "$start_ip" | cut -d "." -f4)
    instance_name="${machine}_${last_octet}"
    ask "Enter the instance name (auto: $instance_name): "
    if [ ! -z "$response" ]; then
        instance_name=$response
    fi
    success "Instance name: $instance_name"

    ask "Enter the future flag location (default: /root): "
    flag_location=$response
    if [ -z "$flag" ]; then
        flag_location="/root"
    fi
    success "Flag location: $flag_location"

    # Add the instance to the ansible inventory
    title2 "Add the instance to the ansible inventory"
    tmp_instance=$(cat "$instance_template" | sed "s/\$instance_name/$instance_name/g" | sed "s/\$ip/$instance_ip/g" | sed "s/\$machine_name/$machine/g" | sed "s=\$flag_location=$flag_location=g")
    echo "$tmp_instance"
    echo "${dir}/../ansible/inventory/${ctf_name}_hosts.yml"
    echo "$tmp_instance" >> ${dir}/../ansible/inventory/${ctf_name}_hosts.yml
    # Test if the instance has been added
    if ! grep -q "$instance_name" ${dir}/../ansible/inventory/${ctf_name}_hosts.yml; then
        error "An error occurred while adding the instance to the ansible inventory"
    else
        success "The instance has been added to the ansible inventory"
    fi

    ask "continue to add instance for $machine (y/n)"
    if [ "$response" == "n" ]; then
        ask "did you want to add instance for another machine/challenge (y/n)"
        if [ "$response" == "y" ]; then
            select_machine
        fi
    fi
done
echo "Ok, as you want..."
info "If you want to add a machine/challenge later, you can run the createInstance.sh script"

    #   $instance_name:
    #     ansible_host: $ip
    #     machine_name: $machine_name
    #     flag_location: $flag_location