import express from "express";
import session from "express-session";
import cors from "cors";
import { router } from "./routes";

const app = express();
export const PORT = process.env.PORT || 8080;

declare module "express-session" {
  interface SessionData {
    name?: string;
    currentChallenge?: string;
    isLoggedIn?: boolean;
  }
}

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(
  session({
    name: "passkey-login",
    secret: "passkey-session",
    resave: true,
    saveUninitialized: false,
    cookie: {
      secure: false, // Allow HTTP
      sameSite: "lax",
      httpOnly: true,
      maxAge: 1 * 60 * 60 * 1000, // 1 hr
    },
  })
);

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
