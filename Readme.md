# Mad CTF

A simple project to create your own ctf locally. Working on docker it is easy to deploy and custom.
The main idea behind this project is to stop to use common ctf flag, because it is easy for player to share it with their firends.
To avoid this, a password is provided for each participant. When a participant compromises a machine, he can execute the flag.sh script on the target to validate the machine's. 
He will then be asked for his password to authenticate it. The database is then updated, as are the graphs on the front end.


## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Installation
### CTF server side
As it works on docker you should install docker on your machine. You should install Ansible to manage your ctf machines.
1. I use ssh to develop quickly my container. If you deploy it on prod environment remove it in the Dockerfile
2. In the docker-compose change MYSQL_ROOT_PASSWORD and MARIADB_PASSWORD password. Set a strong password
3. In myapp/.env set the correct password in DB_PASSWORD
4. Create your own init.sql to populate your db (may i will create a script to do it)
5. Create your own certificate for ssl.
To generate self signed certificate on linux :
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365 -nodes -subj "/C=XX/ST=StateName/L=CityName/O=CompanyName/OU=CompanySectionName/CN=ctf"
6. Place these files is myapp/certs/
mv key.pem myapp/certs
mv cert.pem myapp/certs
7. Set correct rights 
chmod 600 myapp/certs/*.pem


### Vulnerable machine
1. Add the content of vm_client directory on your machines.
2. On your vm add in your /etc/hosts add the CN set in the openssl 
for example 127.0.0.1 ctf
3. Use ansible playbook or set manually variable in flag.conf
4. Authenticate your vm to your CTF server via the command
chmod +x flag.sh
./flag.sh -f




## Usage

Examples and instructions on how to use the project.

## Contributing

Guidelines for contributing to the project.

## License

Information about the project's license.

## List of js package 
npm install moment chart.js chartjs-adapter-moment
