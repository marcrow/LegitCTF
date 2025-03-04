#!/bin/bash

# This script is used to create machine for a ctf
# Machines are challenges. A machine can have multiple instances. So, a VM is an instance of a machine, not a machine itself.


# Set dir variable to the script directory
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Load styles.sh
source "${dir}/styles.sh"

title "Retrieve machine default password "
# If not passed as argument, select the ctf
if [ -z "$1" ]; then
    select_ctf
else
    ctf_id=$1
fi


select_machine


title2 "The default password of $machine challenge is:"
sql="SELECT default_password FROM ctfs_machines WHERE ctf_id = $ctf_id and machine_name ='$machine';"
sql_request "${sql}"
result=$(echo $result | cut -d ' ' -f2- | tr " " "\n")
echo "$result"




