#!/bin/bash

# Generate a pair of SSH keys used by ansible to connect to the vm

# Set dir variable to the script directory
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cert_dir="${dir}/../ansible/secrets"

# Load styles.sh
source "${dir}/styles.sh"


title1 "Generate a pair of SSH keys"

skey="${cert_dir}/ctf"
pkey="${cert_dir}/ctf.pub"

# Test if the skey exists
if [ -f $skey ]; then
    warning "The private key already exists. "
    ask "Do you want to overwrite it? (y/n) "
    if [ "$response" != "y" ]; then
        error "The script has been stopped by the user."
    fi
fi


#Generate ssh keys
#ssh-keygen -t rsa -b 4096 -f "${cert_dir}/ctf" -N "" 2>/dev/null
ssh-keygen -t ed25519 -f "${cert_dir}/ctf" -N "" 2>/dev/null




if [ $? -ne 0 ]; then
    error "Error while generating the certificate."
    exit 1
fi

success "The certificate has been generated successfully."
echo "Restrict the access to the private key file."
chmod 600 $skey
echo "Restrict the access to the certificate file."
chmod 644 $pkey
success "Done - The certificate is available in the following directory: ${cert_dir}"
