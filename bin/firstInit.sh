#!/bin/bash

# This script is one of the 4 main script used to configure the ctf environment
# It is by ctfInstall.sh to prepare the environment for the first use

# Set dir variable to the script directory
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Load styles.sh
source "${dir}/styles.sh"

title "First initialization of the environment"
warning "Execute this script will erase all the previous configuration"
ask "Do you want to continue? (y/n) "
if [ "$response" != "y" ]; then
    error "The script has been stopped by the user."
fi

echo "Ok, let's go!"

# Load createVariable.sh
source "${dir}/createVariable.sh"
if [ $? -ne 0 ]; then
    error "An error occurred while executing the createVariable.sh script."
fi

# Generate a pair of SSH keys used by ansible to connect to the vm
source "${dir}/createSSHKey.sh"
if [ $? -ne 0 ]; then
    error "An error occurred while executing the createSSHKey.sh script."
fi

# Generate a self-signed certificate used as default certificate for the web server
source "${dir}/createSSLCert.sh"
if [ $? -ne 0 ]; then
    error "An error occurred while executing the createSSLCert.sh script."
fi

success "The environment has been initialized successfully."
success "You need to build and start docker containers"
