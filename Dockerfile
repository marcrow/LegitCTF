FROM node:14
WORKDIR /usr/src/app
COPY myapp/ ./
RUN npm install
EXPOSE 3000

# Start SSH service
CMD /usr/sbin/sshd -D & node server.js