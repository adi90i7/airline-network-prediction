FROM mhart/alpine-node:12
COPY . ./application
WORKDIR /application
RUN npm install
RUN npm run build:ssr
EXPOSE 8084
CMD [ "node", "dist/network-predict/server/main.js" ]
