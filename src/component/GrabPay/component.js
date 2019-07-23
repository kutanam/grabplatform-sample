/**
 * Copyright 2019 Grabtaxi Holdings PTE LTE (GRAB), All rights reserved.
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 */
import { parse } from "querystring";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { compose, lifecycle, mapProps, withState } from "recompose";
import { GrabIDActionCreators } from "redux/action/grabid";
import "./style.scss";

function PrivateGrabPayRedirect({ returnURI }) {
  return (
    <div className="grabpay-redirect-container">
      You are being redirected...
      {!!returnURI && <Redirect to={returnURI} />}
    </div>
  );
}

export const GrabPayRedirect = compose(
  mapProps(({ location: { search } }) => parse(search.slice(1))),
  connect(
    ({
      repository: {
        grabid: { getLoginReturnURI }
      }
    }) => ({ getLoginReturnURI }),
    dispatch => ({
      handleGrabPayRedirect: () =>
        dispatch(GrabIDActionCreators.triggerHandleGrabIDRedirect())
    })
  ),
  withState("returnURI", "setReturnURI", ""),
  lifecycle({
    async componentDidMount() {
      const {
        getLoginReturnURI,
        handleGrabPayRedirect,
        setReturnURI
      } = this.props;

      handleGrabPayRedirect();
      const returnURI = await getLoginReturnURI();
      setReturnURI(returnURI);
    }
  })
)(PrivateGrabPayRedirect);
