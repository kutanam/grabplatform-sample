/**
 * Copyright 2019 Grabtaxi Holdings PTE LTE (GRAB), All rights reserved.
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 */
import { grabidPaymentHOC, grabpayTransactionHOC } from "component/customHOC";
import { GrabIDLogin } from "component/GrabID/component";
import {
  grabidDescription,
  hmacDescription,
  partnerTxIDDescription,
  xgidAuthPOPDescription
} from "component/Payment/description";
import Transaction from "component/Payment/Transaction/component";
import React from "react";
import Markdown from "react-markdown";
import { connect } from "react-redux";
import { compose, withProps, withState } from "recompose";
import { CommonMessages } from "redux/action/common";
import { GrabPayActionCreators } from "redux/action/grabpay";
import "./style.scss";

const bindDescription = `
We first need to generate a partner transaction ID (partnerTxID):

${partnerTxIDDescription}

Authorization is HMAC:

${hmacDescription}

Then the bind endpoint is invoked like so (notice the request body used to
generate the HMAC):

${"```javascript"}
async (
  { body: { countryCode, partnerHMACSecret, partnerID } },
  res
) => {
  const partnerTxID = await generatePartnerTransactionID();
  const requestBody = { countryCode, partnerTxID };
  const timestamp = new Date().toUTCString();

  const hmacDigest = await generateHMACSignature({
    httpMethod: "POST",
    contentType: "application/json",
    partnerHMACSecret,
    requestBody,
    requestURL: "/grabpay/partner/v2/bind",
    timestamp
  });

  const { data, status } = await client.post(
    "/grabpay/partner/v2/bind",
    requestBody,
    {
      "Content-Type": "application/json",
      Authorization: ${"`"}${"$"}{partnerID}:${"$"}{hmacDigest}${"`"},
      Date: timestamp
    }
  );

  res.status(status).json({ ...data, partnerTxID });
}
${"```"}
            
This call will give us back:
- **request**: The request body that will need to be passed to GrabID to authorize the charge.

Please store the partnerTxID somewhere because you will need it later to charge
the user.
`;

const chargeDescription = `
After we get the OAuth access token from GrabID, we need to generate another
HMAC with it:

${xgidAuthPOPDescription}

This HMAC will be used as an extra header for the charge:

${"```javascript"}
async (
  {
    body: {
      amount,
      clientSecret,
      currency,
      description,
      merchantID,
      partnerGroupTxID,
      partnerTxID
    },
    headers: { authorization }
  },
  res
) => {
  const requestBody = {
    partnerGroupTxID,
    partnerTxID,
    currency,
    amount,
    description,
    merchantID
  };

  const date = new Date();

  const hmac = await generateHMACForXGIDAUXPOP({
    authorization,
    clientSecret,
    date
  });

  const { data, status } = await client.post(
    "/grabpay/partner/v2/charge",
    requestBody,
    {
      "Content-Type": "application/json",
      "X-GID-AUX-POP": hmac,
      Authorization: authorization,
      Date: date.toUTCString()
    }
  );

  res.status(status).json(data);
}
${"```"}

The wallet check only works after you've done the binding:

${"```javascript"}
async (
  { body: { clientSecret, currency }, headers: { authorization } },
  res
) => {
  const date = new Date();

  const hmac = await generateHMACForXGIDAUXPOP({
    authorization,
    clientSecret,
    date
  });

  const { data, status } = await client.get(
    ${"`"}/grabpay/partner/v2/wallet/info?currency=${"$"}{currency}${"`"},
    {
      Authorization: authorization,
      "X-GID-AUX-POP": hmac,
      Date: date.toUTCString()
    }
  );

  res.status(status).json(data);
}
${"```"}
`;

const unbindDescription = `
There is no **unbind** endpoint - to unbind, you simply fire a DELETE request
to the bind endpoint with the necessary credentials:

${"```javascript"}
async (
  { body: { clientSecret, partnerTxID }, headers: { authorization } },
  res
) => {
  const date = new Date();

  const hmac = await generateHMACForXGIDAUXPOP({
    authorization,
    clientSecret,
    date
  });

  const { status } = await client.delete(
    "/grabpay/partner/v2/bind",
    { partnerTxID },
    {
      "Content-Type": "application/json",
      "X-GID-AUX-POP": hmac,
      Authorization: authorization,
      Date: date.toUTCString()
    }
  );

  res.status(status).json({});
}
${"```"}
`;

function RecurringCharge({
  balance,
  cardImage,
  currency,
  request,
  status,
  bindCharge,
  chargeUser,
  checkWallet,
  makeAuthorizationRequest,
  makeTokenRequest,
  unbindCharge
}) {
  return (
    <div className="recurring-charge-container">
      <div className="bind-container">
        <div className="intro-title">Stage 1: Bind</div>

        <div className="stage-description">
          <Markdown className="source-code" source={bindDescription} />
        </div>

        <div className="divider" />
        <div className="title">Endpoint</div>
        <input disabled readOnly value={"POST /grabpay/partner/v2/bind"} />

        {!!request && (
          <>
            <div className="title">Charge request</div>
            <input disabled readOnly spellCheck={false} value={request} />
          </>
        )}

        <div className="bind-charge" onClick={bindCharge}>
          Bind
        </div>
      </div>

      <GrabIDLogin
        currentProductStageFlow={2}
        makeAuthorizationRequest={makeAuthorizationRequest}
        makeTokenRequest={makeTokenRequest}
        popRequired
        scopes={["payment.recurring_charge", "payment.online_acceptance"]}
        stageDescription={
          <Markdown className="source-code" source={grabidDescription} />
        }
      />

      <div className="charge-container">
        <div className="intro-title">Stage 3: Charge user</div>

        <div className="stage-description">
          <Markdown className="source-code" source={chargeDescription} />
        </div>

        <div className="divider" />

        <div className="title">Endpoint</div>

        <input
          disabled
          readOnly
          value={"GET /grabpay/partner/v2/wallet/info?currency=currency"}
        />

        {!!balance && !!cardImage && (
          <>
            <div className="title">Balance</div>
            <input disabled readOnly value={balance} />
            <div className="title">currency</div>
            <input disabled readOnly value={currency} />
          </>
        )}

        <div className="check-wallet" onClick={checkWallet}>
          Check wallet
        </div>

        <div className="divider" />
        <div className="title">Endpoint</div>

        <input
          disabled
          readOnly
          value={"POST /grabpay/partner/v2/wallet/info"}
        />

        <Transaction />
        <div className="title">Transaction status</div>

        <div className="transaction-status">
          <b>{status || "unconfirmed"}</b>
        </div>

        <div className="confirm-charge" onClick={chargeUser}>
          Charge user
        </div>
      </div>

      <div className="unbind-container">
        <div className="intro-title">Stage 5: Unbind charge</div>

        <div className="stage-description">
          <Markdown className="source-code" source={unbindDescription} />
        </div>

        <div className="divider" />
        <div className="title">Endpoint</div>
        <input disabled readOnly value={"DELETE /grabpay/partner/v2/bind"} />

        <div className="unbind-charge" onClick={unbindCharge}>
          Unbind
        </div>
      </div>
    </div>
  );
}

export default compose(
  grabidPaymentHOC(),
  grabpayTransactionHOC(),
  connect(
    ({
      configuration,
      grabpay: {
        transaction: { status },
        wallet: { balance, cardImage, currency }
      },
      repository: {
        grabpay: {
          recurringCharge: {
            bind: bindCharge,
            charge: chargeUser,
            checkWallet,
            unbind: unbindCharge
          }
        }
      }
    }) => ({
      balance,
      cardImage,
      configuration,
      currency,
      status,
      bindCharge,
      chargeUser,
      checkWallet,
      unbindCharge
    }),
    dispatch => ({
      checkWallet: () => dispatch(GrabPayActionCreators.triggerCheckWallet()),
      unbindCharge: () =>
        dispatch(GrabPayActionCreators.RecurringCharge.triggerUnbind())
    })
  ),
  withState("status", "setStatus", ""),
  withProps(
    ({
      configuration: {
        clientSecret,
        countryCode,
        currency,
        merchantID,
        partnerHMACSecret,
        partnerID,
        transaction: { amount, description, partnerGroupTxID }
      },
      partnerTxID,
      bindCharge,
      chargeUser,
      handleError,
      handleMessage,
      persistChargeRequest,
      persistPartnerTxID,
      setPartnerTxID,
      setRequest,
      setStatus
    }) => ({
      bindCharge: handleError(async () => {
        const { partnerTxID, request } = await bindCharge({
          countryCode,
          partnerHMACSecret,
          partnerID
        });

        await persistChargeRequest(request);
        await persistPartnerTxID(partnerTxID);
        setPartnerTxID(partnerTxID);
        setRequest(request);
        handleMessage(CommonMessages.grabpay.recurringCharge.bind);
      }),
      chargeUser: handleError(async () => {
        const { status } = await chargeUser({
          amount,
          clientSecret,
          currency,
          description,
          merchantID,
          partnerGroupTxID,
          partnerTxID
        });

        setStatus(status);
        handleMessage(CommonMessages.grabpay.recurringCharge.charge);
      })
    })
  )
)(RecurringCharge);
