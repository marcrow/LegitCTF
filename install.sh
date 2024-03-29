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

# Load firstInit.sh²
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

