import express from "express";
import {
  createRegistrationOptions,
  verifyRegistration,
} from "./controllers/registration";

const router = express.Router();

router.post("/registration/start", createRegistrationOptions);
router.post("/registration/finish", verifyRegistration);

export { router };
