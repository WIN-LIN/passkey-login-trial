import { Request, Response } from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { rpID, rpName } from "../utils/constants";
import { RegistrationResponseJSON } from "@simplewebauthn/types";
import { userService } from "../services/userService";

export const createRegistrationOptions = async (
  req: Request,
  res: Response
) => {
  const { userName } = req.body;

  if (!userName) {
    res.status(400).json({ error: "userName is required" });
    return;
  }
  try {
    const user = await userService.getUserInfo(userName);
    if (user) {
      res.status(400).json({ error: "user already exists" });
      return;
    }

    await userService.createUser(userName);

    const credentialOption = await generateRegistrationOptions({
      rpName,
      rpID,
      userName,
      timeout: 600000,
      attestationType: "direct",
    });

    console.log("publicKeyCredentialCreationOptions", credentialOption);

    req.session.name = userName;
    req.session.currentChallenge = credentialOption.challenge;

    res.status(200).json(credentialOption);
  } catch (error) {
    req.session.destroy;
    res.status(500).json(error);
  }
};

export const verifyRegistration = async (req: Request, res: Response) => {
  const { name, currentChallenge } = req.session;

  if (!name || !currentChallenge) {
    res.status(400).json({ error: "Invalid session" });
    return;
  }

  try {
    console.log("credential to be verified", req.body);
    const verification = await verifyRegistrationResponse({
      response: req.body as RegistrationResponseJSON,
      expectedChallenge: currentChallenge,
      expectedOrigin: "http://localhost:3000",
    });

    console.log("verification", verification);

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter } =
        verification.registrationInfo;
      await userService.saveCredential({
        userName: name,
        credentialID,
        credentialPublicKey,
        counter,
      });

      req.session.isLoggedIn = true;
      req.session.name = name;

      res.status(200).json({ message: "registration succeed!" });
    } else {
      res.status(400).json({ message: "registration failed!" });
    }
  } catch (error) {
    req.session.destroy;
    console.log("error", error);
    res.status(500).json({ error });
  }
};
