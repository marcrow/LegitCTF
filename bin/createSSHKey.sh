#!/bin/bash
# Generate a self-signed certificate used as default certificate for the vm

# Set dir variable to the script directory
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cert_dir="${dir}/../ansible/secrets"

#Generate ssh keys
ssh-keygen -t rsa -b 4096 -f "${cert_dir}/ctf" -N "" 2>/dev/null

skey="${cert_dir}/ctf"
pkey="${cert_dir}/ctf.pub"




if [ $? -ne 0 ]; then
    echo "Error while generating the certificate."
    exit 1
fi

echo "The certificate has been generated successfully."
echo "Restrict the access to the private key file."
chmod 600 $skey
echo "Restrict the access to the certificate file."
chmod 644 $pkey
echo "Done - The certificate is available in the following directory: ${cert_dir}"

exit 0