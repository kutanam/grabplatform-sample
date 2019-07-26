/**
 * Copyright 2019 Grabtaxi Holdings PTE LTE (GRAB), All rights reserved.
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 */
import {
  copyToClipboardHOC,
  handleErrorHOC,
  handleMessageHOC
} from "component/customHOC";
import Markdown from "component/Markdown/component";
import { parse } from "querystring";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { compose, lifecycle, mapProps, withProps, withState } from "recompose";
import { CommonMessages } from "redux/action/common";
import "./style.scss";

// ############################## GRABID AUTH ##############################

const grabidDescription = `
The normal GrabID flow is as follows:
- Authorize with user's consent for permission to access user information. A
browser popup will appear with the authentication/consent screens.
- Handle authorize result with a redirect page. GrabID will give back 
**code** and **state**.
- Use **code** and **state** to perform token request. Depending on whether the 
access token POP is required, this call can be from client (no need for 
**clientSecret**) or server (need for **clientSecret**).

In the case of partners, upon redirection to partner website (after user is
shown the consent screen and has given consent), the partner will receive an
**id_token**, which is a JSON Web Token (JWT) containing information of the
logged in user. This **id_token** can then be used to request the 
authorization token like so:

${"```javascript"}
grabIDClient.makeAuthorizationRequest(null, id_token)
${"```"}
`;

function PrivateGrabIDLogin({
  accessToken,
  copyToClipboard,
  currentProductStageFlow,
  idToken,
  popRequired,
  scopes,
  stageDescription,
  state,
  makeAuthorizationRequest,
  makeTokenRequest
}) {
  return (
    <div className="grabid-container">
      <div className="intro-title">{`Stage ${currentProductStageFlow}: GrabID`}</div>

      <div className="stage-description">
        <Markdown className="source-code" source={grabidDescription} />
        {!!stageDescription && stageDescription}
      </div>

      <>
        <div className="divider" />
        <div className="title">Requested scopes</div>

        <div className="scope-container">
          {["openid"]
            .concat(scopes)
            .filter(scope => !!scope)
            .map(scope => (
              <div className="scope" key={scope}>
                <div className="internal">{scope}</div>
              </div>
            ))}
        </div>

        <div className="authorize" onClick={makeAuthorizationRequest}>
          Authorize
        </div>
      </>

      <>
        <div className="divider" />
        <div className="title">State</div>
        <input disabled spellCheck={false} readOnly value={state} />
      </>

      {!popRequired && (
        <>
          <div className="title">Access token</div>

          <div
            className="long-content"
            onClick={() => copyToClipboard(accessToken)}
          >
            {accessToken}
          </div>

          <div className="title">ID token</div>

          <div
            className="long-content"
            onClick={() => copyToClipboard(idToken)}
          >
            {idToken}
          </div>
        </>
      )}

      <>
        <div className="request-token" onClick={makeTokenRequest}>
          Request token
        </div>
      </>
    </div>
  );
}

export const GrabIDLogin = compose(
  handleMessageHOC(),
  handleErrorHOC(),
  copyToClipboardHOC(),
  connect(
    ({
      configuration,
      repository: {
        grabid: {
          nonPOP: { authorize, requestToken },
          getGrabIDResult
        },
        navigation: { reloadPage }
      }
    }) => ({
      configuration,
      authorize,
      getGrabIDResult,
      reloadPage,
      requestToken
    })
  ),
  withProps(
    ({
      configuration: { clientID, countryCode },
      authorize,
      handleError,
      handleMessage,
      reloadPage,
      requestToken,
      makeAuthorizationRequest = handleError(async scopes => {
        await authorize({ clientID, countryCode, scopes });
      }),
      makeTokenRequest = handleError(async scopes => {
        await requestToken({ clientID, countryCode, scopes });
        await reloadPage();
        handleMessage(CommonMessages.grabid.requestToken);
      })
    }) => ({ makeAuthorizationRequest, makeTokenRequest })
  ),
  withProps(({ scopes, makeAuthorizationRequest, makeTokenRequest }) => ({
    makeAuthorizationRequest: () => makeAuthorizationRequest(scopes),
    makeTokenRequest: () => makeTokenRequest(scopes)
  })),
  withState("accessToken", "setAccessToken", ""),
  withState("idToken", "setIDToken", ""),
  withState("state", "setState", ""),
  lifecycle({
    async componentDidMount() {
      const {
        getGrabIDResult,
        setAccessToken,
        setIDToken,
        setState
      } = this.props;

      const { accessToken, idToken, state } = await getGrabIDResult();
      setAccessToken(accessToken || "");
      setIDToken(idToken || "");
      setState(state || "");
    }
  })
)(PrivateGrabIDLogin);

// ############################# GRABID REDIRECT #############################

function PrivateGrabIDRedirect({ returnURI }) {
  return (
    <div className="grabid-redirect-container">
      You are being redirected...
      {!!returnURI && <Redirect to={returnURI} />}
    </div>
  );
}

export const GrabIDRedirect = compose(
  mapProps(({ location: { search } }) => parse(search.slice(1))),
  handleErrorHOC(),
  connect(
    ({
      repository: {
        grabid: { getLoginReturnURI, handleAuthorizationCodeFlowResponse }
      }
    }) => ({ getLoginReturnURI, handleAuthorizationCodeFlowResponse })
  ),
  withProps(({ handleAuthorizationCodeFlowResponse, handleError }) => ({
    handleAuthorizationCodeFlowResponse: handleError(
      handleAuthorizationCodeFlowResponse
    )
  })),
  withState("returnURI", "setReturnURI", ""),
  lifecycle({
    async componentDidMount() {
      const {
        getLoginReturnURI,
        handleAuthorizationCodeFlowResponse,
        setReturnURI
      } = this.props;

      await handleAuthorizationCodeFlowResponse();
      const returnURI = await getLoginReturnURI();
      setReturnURI(returnURI);
    }
  })
)(PrivateGrabIDRedirect);
