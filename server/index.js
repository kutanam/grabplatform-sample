/**
 * Copyright 2019 Grabtaxi Holdings PTE LTE (GRAB), All rights reserved.
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 */
const cors = require("cors");
const connectRedis = require("connect-redis");
const dotenv = require("dotenv");
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const https = require("https");
const { createClient: createRedisClient } = require("redis");
const tls = require("tls");

dotenv.config();

const app = express();
const { createDBClient, createHTTPClient } = require("./client");
const configuration = require("./handler/configuration");
const grabid = require("./handler/grabid");
const identity = require("./handler/identity");
const loyalty = require("./handler/loyalty");
const payment = require("./handler/payment");
const messaging = require("./handler/messaging");
const port = 8000;

function requireTruthy(key, object) {
  if (!object) {
    throw new Error(`Value ${key} is not truthy`);
  }

  return object;
}

async function initialize() {
  /** Reference: https://stackoverflow.com/questions/14262986/node-js-hostname-ip-doesnt-match-certificates-altnames/16311147 */
  tls.checkServerIdentity = function() {
    return undefined;
  };

  const redisClient = await createRedisClient({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, undefined) || undefined,
    url: process.env.REDIS_URL
  });

  const dbClient = await createDBClient(redisClient);
  const SessionRedis = connectRedis(session);
  const sessionRedis = new SessionRedis({ client: redisClient });
  const { CLIENT_URL, NODE_ENV } = process.env;

  const httpClient = await createHTTPClient({
    env: requireTruthy("NODE_ENV", NODE_ENV)
  });

  const corsOptions = {
    origin:
      NODE_ENV !== "production" ? "*" : requireTruthy("CLIENT_URL", CLIENT_URL),
    credentials: true
  };

  app.options("*", cors(corsOptions));
  app.use(cors(corsOptions));
  app.use(express.json());

  app.use(
    session({
      resave: true,
      saveUninitialized: true,
      secret: requireTruthy("SESSION_SECRET", process.env.SESSION_SECRET),
      store: sessionRedis
    })
  );

  app.get("/", ({ session }, res) => {
    res
      .status(200)
      .json(`Never should have come here: ${JSON.stringify(session)}`);
  });
  app.get("/configuration", configuration.getConfiguration(dbClient));
  app.post("/configuration", configuration.setConfiguration(dbClient));
  app.post("/grabid/payment/authorize", async ({ body, session }, res) => {
    const { authorizeURL } = await grabid.utils.authorize(
      session,
      httpClient,
      body
    );

    res.status(200).json({ authorizeURL });
  });
  app.post("/grabid/token", grabid.requestToken(dbClient, httpClient));
  app.get("/identity/basic-profile", identity.basicProfile(httpClient));
  app.get("/loyalty/rewards-tier", loyalty.rewardsTier(httpClient));
  app.post("/messaging/inbox", messaging.inbox(dbClient, httpClient));
  app.post("/messaging/push", messaging.push(dbClient, httpClient));
  app.post(
    "/payment/one-time-charge/init",
    payment.oneTimeCharge.init(dbClient, httpClient)
  );
  app.post(
    "/payment/one-time-charge/confirm",
    payment.oneTimeCharge.confirm(dbClient, httpClient)
  );
  app.post(
    "/payment/recurring-charge/bind",
    payment.recurringCharge.bind(dbClient, httpClient)
  );
  app.post(
    "/payment/recurring-charge/wallet",
    payment.checkWallet(dbClient, httpClient)
  );
  app.post(
    "/payment/recurring-charge/charge",
    payment.recurringCharge.charge(dbClient, httpClient)
  );
  app.post(
    "/payment/recurring-charge/unbind",
    payment.recurringCharge.unbind(dbClient, httpClient)
  );
  app.get("/payment/home-currency", payment.homeCurrency(httpClient));

  if (process.env.USE_SELF_SIGNED_CERT !== "false") {
    https
      .createServer(
        {
          key: fs.readFileSync("server/server.key"),
          cert: fs.readFileSync("server/server.cert")
        },
        app
      )
      .listen(port, () => console.log(`Listening at ${port}`));
  } else {
    app.listen(port, () => console.log(`Listening at ${port}`));
  }
}

initialize();
