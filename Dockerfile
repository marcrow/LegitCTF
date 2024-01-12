FROM node:14
WORKDIR /usr/src/app
COPY myapp/ ./
RUN npm install
EXPOSE 3000
# CMD ["node", "server.js"]
# Install SSH
RUN apt-get update && apt-get install -y openssh-server
RUN mkdir /var/run/sshd

# Set up user for SSH access (replace 'user' and 'pass' with your desired user and password)
RUN useradd -rm -d /home/ubuntu -s /bin/bash -g root -G sudo -u 3333 user
RUN  echo 'user:pass' | chpasswd
RUN  echo 'root:pass' | chpasswd


# Expose the port node.js is reachable on
#EXPOSE 3000

# Expose SSH port
EXPOSE 22

# Start SSH service
CMD /usr/sbin/sshd -D & node server.js