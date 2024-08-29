import { Request, Response } from "express";

export const checkLogin = async (req: Request, res: Response) => {
  if (req.session.name) {
    res.status(200).json({ name: req.session.name });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const logout = async (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
    } else {
      res.status(200).json({ message: "Logged out" });
    }
  });
};
