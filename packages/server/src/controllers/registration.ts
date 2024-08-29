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
    const user = await userService.getUserInfo(name);
    if (!user) {
      res.status(400).json({ error: "User not registered" });
      return;
    }
    console.log("credential to be verified", req.body);
    const verification = await verifyRegistrationResponse({
      response: req.body as RegistrationResponseJSON,
      expectedChallenge: currentChallenge, // clientDataObj
      expectedOrigin: "http://localhost:3000", // FE
      // requireUserVerification: true,
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

      res.status(200).json({ message: "registration succeed!" });
    } else {
      res.status(400).json({ message: "registration failed!" });
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error });
  } finally {
    req.session.name = undefined;
    req.session.currentChallenge = undefined;
  }
};
