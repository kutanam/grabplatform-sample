/**
 * Copyright 2019 Grabtaxi Holdings PTE LTE (GRAB), All rights reserved.
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 */
import {
  handleErrorHOC,
  handleMessageHOC,
  stageSwitcherHOC
} from "component/customHOC";
import { GrabIDLogin } from "component/GrabID/component";
import StageSwitch from "component/StageSwitcher/component";
import React from "react";
import { compose, withProps, withState } from "recompose";
import { CommonMessages } from "redux/action/common";
import { makeHTTPRequest } from "utils";
import "./style.scss";

function PrivateBasicProfile({
  basicProfile,
  currentStage,
  getBasicProfile,
  setCurrentStage
}) {
  return (
    <div className="basic-profile-container">
      <StageSwitch
        currentStage={currentStage}
        setStage={setCurrentStage}
        stageCount={2}
      />

      {currentStage === 0 && (
        <GrabIDLogin currentProductStageFlow={1} scopes={["profile.read"]} />
      )}

      {currentStage === 1 && (
        <div className="main-container">
          <div className="intro-title">Stage 2: Basic profile</div>
          <div className="title">Endpoint</div>
          <input disabled readOnly value={"GET /grabid/v1/oauth2/userinfo"} />
          <div className="title">Profile information</div>

          <div className="info-container">
            {!!basicProfile && !!Object.keys(basicProfile).length
              ? Object.entries(basicProfile)
                  .map(([key, value]) => [
                    key,
                    <>
                      <b>{key}</b>: {`${value}`}
                    </>
                  ])
                  .map(([key, info]) => (
                    <div className="info" key={key}>
                      {info}
                    </div>
                  ))
              : "No profile information yet"}
          </div>

          <div className="get-profile" onClick={getBasicProfile}>
            Get basic profile
          </div>
        </div>
      )}
    </div>
  );
}

export default compose(
  handleMessageHOC(),
  handleErrorHOC(),
  stageSwitcherHOC(),
  withState("basicProfile", "setBasicProfile", {}),
  withProps(({ handleError, handleMessage, setBasicProfile }) => ({
    getBasicProfile: handleError(async () => {
      const profile = await makeHTTPRequest({
        method: "GET",
        path: "/identity/basic-profile"
      });

      setBasicProfile(profile);
      handleMessage(CommonMessages.identity.basicProfile);
    })
  }))
)(PrivateBasicProfile);
