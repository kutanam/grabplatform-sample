/**
 * Copyright 2019 Grabtaxi Holdings PTE LTE (GRAB), All rights reserved.
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 */
import { combineReducers } from "redux";
import { GrabIDActions } from "./action/grabid";
import { GrabPayActions } from "./action/grabpay";
import { IdentityActions } from "./action/identity";
import { LoyaltyActions } from "./action/loyalty";

function grabid(state = {}, { type, payload }) {
  switch (type) {
    case GrabIDActions.CLEAR_CREDENTIALS:
      return {
        ...state,
        accessToken: "",
        code: "",
        codeVerifier: "",
        idToken: "",
        scopes: "",
        state: "",
        returnPath: ""
      };

    case GrabIDActions.SET_ACCESS_TOKEN:
      return { ...state, accessToken: payload };

    case GrabIDActions.SET_CLIENT_ID:
      return { ...state, clientID: payload };

    case GrabIDActions.SET_CLIENT_SECRET:
      return { ...state, clientSecret: payload };

    case GrabIDActions.SET_CODE:
      return { ...state, code: payload };

    case GrabIDActions.SET_CODE_VERIFIER:
      return { ...state, codeVerifier: payload };

    case GrabIDActions.SET_COUNTRY_CODE:
      return { ...state, countryCode: payload };

    case GrabIDActions.SET_ID_TOKEN:
      return { ...state, idToken: payload };

    case GrabIDActions.SET_RETURN_PATH:
      return { ...state, returnPath: payload };

    case GrabIDActions.SET_SCOPES:
      return { ...state, scopes: payload };

    case GrabIDActions.SET_STATE:
      return { ...state, state: payload };

    default:
      return { ...state };
  }
}

function grabpay(state = {}, { type, payload }) {
  switch (type) {
    case GrabPayActions.CLEAR_CREDENTIALS:
      return {
        ...state,
        request: "",
        wallet: {},
        partnerTxID: "",
        transaction: { ...state.transaction, status: "" }
      };

    case GrabPayActions.SET_CURRENCY:
      return { ...state, currency: payload };

    case GrabPayActions.SET_MERCHANT_ID:
      return { ...state, merchantID: payload };

    case GrabPayActions.SET_PARTNER_HMAC_SECRET:
      return { ...state, partnerHMACSecret: payload };

    case GrabPayActions.SET_PARTNER_ID:
      return { ...state, partnerID: payload };

    case GrabPayActions.SET_REQUEST:
      return { ...state, request: payload };

    case GrabPayActions.SET_WALLET:
      return { ...state, wallet: payload };

    case GrabPayActions.Transaction.SET_AMOUNT:
      return {
        ...state,
        transaction: { ...state.transaction, amount: payload }
      };

    case GrabPayActions.Transaction.SET_DESCRIPTION:
      return {
        ...state,
        transaction: { ...state.transaction, description: payload }
      };

    case GrabPayActions.Transaction.SET_PARTNER_GROUP_TRANSACTION_ID:
      return {
        ...state,
        transaction: { ...state.transaction, partnerGroupTxID: payload }
      };

    case GrabPayActions.Transaction.SET_PARTNER_TRANSACTION_ID:
      return {
        ...state,
        transaction: { ...state.transaction, partnerTxID: payload }
      };

    case GrabPayActions.Transaction.SET_TRANSACTION_STATUS:
      return {
        ...state,
        transaction: { ...state.transaction, status: payload }
      };

    default:
      return { ...state };
  }
}

function identity(state = {}, { type, payload }) {
  switch (type) {
    case IdentityActions.SET_BASIC_PROFILE:
      return { ...state, basicProfile: payload };

    default:
      return { ...state };
  }
}

function loyalty(state = {}, { type, payload }) {
  switch (type) {
    case LoyaltyActions.SET_REWARDS_TIER:
      return { ...state, rewardsTier: payload };

    default:
      return { ...state };
  }
}

export default combineReducers({ identity, grabid, grabpay, loyalty });