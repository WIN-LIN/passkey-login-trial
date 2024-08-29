import express from "express";
import {
  createRegistrationOptions,
  verifyRegistration,
} from "./controllers/registration";
import { signData, verifySignData } from "./controllers/authentication";
import { checkLogin, logout } from "./controllers/loginStatus";

const router = express.Router();

router.use((req, _, next) => {
  console.log("session", req.session);
  next();
});

router.post("/registration/start", createRegistrationOptions);
router.post("/registration/finish", verifyRegistration);
router.post("/login/start", signData);
router.post("/login/finish", verifySignData);

router.get("/check-login", checkLogin);
router.post("/logout", logout);

export { router };
