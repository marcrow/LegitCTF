FROM node:14
WORKDIR /usr/src/app
COPY myapp/ ./
RUN npm install
EXPOSE 8080

CMD ["node", "server.js"]