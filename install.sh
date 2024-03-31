#!/bin/bash

# Set dir variable to the script directory
maindir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Styles used by ctf scripts
source "${maindir}/bin/styles.sh"

echo ""
echo "Welcome to the CTF environment configuration script"
echo "Setting everything up for (with) you..."
echo ""
info "Please run this script only if you are sure to erase all the previous configuration"
echo "If this is your first install, you can ignore all the warnings :)"

# Load firstInit.sh
source "${maindir}/bin/firstInit.sh"
if [ $? -ne 0 ]; then
    error "An error occurred while executing the firstInit.sh script."
fi

# Load startDocker.sh
source "${maindir}/bin/startDocker.sh"
if [ $? -ne 0 ]; then
    error "An error occurred while executing the startDocker.sh script."
fi

# Load createAdmin.sh
source "${maindir}/bin/createAdmin.sh"
if [ $? -ne 0 ]; then
    error "An error occurred while executing the createAdmin.sh script."
fi

# Create a CTF
ask "Do you want to create a CTF? (y/n) "
if [ "$response" == "n" ]; then
    echo "Ok, as you want..."
    info "If you want to create a CTF later, you can run the createCtf.sh script"
else
    source "${maindir}/bin/createCtf.sh"
    if [ $? -ne 0 ]; then
        error "An error occurred while executing the createCtf.sh script."
    fi
fi

