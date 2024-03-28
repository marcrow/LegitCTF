#!/bin/bash
# Generate a self-signed certificate used as default certificate for the web server

# Set dir variable to the script directory
dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cert_dir="${dir}/../myapp/certs"

# Generate a self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout "${cert_dir}/key.pem" -out "${cert_dir}/cert.pem" -days 365 -nodes -subj "/C=US/ST=CA/L=Toulouse/O=MyApp/OU=DevOps/CN=ctf.local"

if [ $? -ne 0 ]; then
    echo "Error while generating the certificate."
    exit 1
else 
    echo "The certificate has been generated successfully."
    echo "Done - The certificate is available in the following directory: ${cert_dir}"
    exit 0
fi


