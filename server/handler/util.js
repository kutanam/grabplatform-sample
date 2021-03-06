/**
 * Copyright 2019 Grabtaxi Holdings PTE LTE (GRAB), All rights reserved.
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 */
const btoa = require("btoa");
const CryptoJS = require("crypto-js");

async function base64URLEncode(str) {
  return str
    .toString(CryptoJS.enc.Base64)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getRelativeURLPath(url) {
  let pathRegex = /.+?:\/\/.+?(\/.+?)(?:#|\?|$)/;
  let result = url.match(pathRegex);

  if (!result) {
    pathRegex = /\/.*/;
    result = url.match(pathRegex);
    return result && result.length === 1 ? result[0] : "";
  }

  return result && result.length > 1 ? result[1] : "";
}

function getUnixTimestamp(date) {
  return Math.round(date.getTime() / 1000);
}

exports.base64URLEncode = base64URLEncode;

exports.handleError = function(requestHandler) {
  return async (req, res) => {
    try {
      await requestHandler(req, res);
    } catch (e) {
      const {
        message: errorMessage,
        response: { data: { message = errorMessage }, status = 500 } = {
          data: {}
        }
      } = e;

      res.status(status).json({ message });
    }
  };
};

exports.generateRandomString = async function(length) {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};

exports.generateHMACSignature = async function({
  contentType,
  httpMethod,
  partnerHMACSecret,
  requestBody,
  requestURL,
  timestamp
}) {
  const rawRequestBody =
    typeof requestBody === "object" ? JSON.stringify(requestBody) : requestBody;

  const relativeURLPath = getRelativeURLPath(requestURL);

  const hashedRequestBody = CryptoJS.enc.Base64.stringify(
    CryptoJS.SHA256(rawRequestBody)
  );

  const requestData = [
    [
      httpMethod,
      contentType,
      timestamp,
      relativeURLPath,
      hashedRequestBody
    ].join("\n"),
    "\n"
  ].join("");

  const hmacDigest = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA256(requestData, partnerHMACSecret)
  );

  return hmacDigest;
};

exports.generateHMACForXGIDAUXPOP = async function({
  accessToken,
  clientSecret,
  date
}) {
  const timestamp = getUnixTimestamp(date);
  const message = timestamp + accessToken;

  const signature = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA256(message, clientSecret)
  );

  const payload = {
    time_since_epoch: timestamp,
    sig: await base64URLEncode(signature)
  };

  const payloadBytes = JSON.stringify(payload);
  return base64URLEncode(btoa(payloadBytes));
};
