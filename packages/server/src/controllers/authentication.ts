import { Request, Response } from "express";

import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { rpID } from "../utils/constants";
import { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { userService } from "../services/userService";

export const signData = async (req: Request, res: Response) => {
  const { userName } = req.body;
  if (!userName) {
    res.status(400).json({ error: "userName is required" });
    return;
  }
  try {
    const user = await userService.getUserInfo(userName);
    if (!user) {
      res.status(400).json({ error: "user not found" });
      return;
    }

    const credentialOption = await generateAuthenticationOptions({
      rpID,
      timeout: 600000,
    });
    console.log("credentialOption", credentialOption);
    req.session.name = userName;
    req.session.currentChallenge = credentialOption.challenge;

    res.status(200).json(credentialOption);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const verifySignData = async (req: Request, res: Response) => {
  const { name, currentChallenge } = req.session;

  if (!name || !currentChallenge) {
    res.status(400).json({ error: "Invalid session" });
    return;
  }

  try {
    const credential = await userService.getCredential(name);
    console.log("verifySignData credential", credential);
    if (!credential) {
      res.status(400).json({ error: "Credential not found" });
      return;
    }

    console.log("req.body", req.body);

    const verification = await verifyAuthenticationResponse({
      response: req.body as AuthenticationResponseJSON,
      expectedChallenge: currentChallenge, // clientDataObj
      expectedOrigin: `http://localhost:3000`,
      expectedRPID: rpID,
      authenticator: credential,
    });
    console.log("VerifiedAuthenticationResponse", verification);

    if (verification.verified) {
      res.status(200).json({ message: "login succeed!" });
    } else {
      res.status(400).json({ verified: false });
    }
  } catch (error) {
    console.error("verifySignData error", error);
    res.status(500).json({ error });
  } finally {
    req.session.name = undefined;
    req.session.currentChallenge = undefined;
  }
};
