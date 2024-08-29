import redisClient from "../redis";

type Credential = {
  userName: string;
  credentialID: string;
  credentialPublicKey: Uint8Array;
  counter: number;
};

export class UserService {
  private readonly userPrefix = "user:";

  async createUser(name: string) {
    try {
      await redisClient.hset(`${this.userPrefix}${name}`, "username", name);
      console.log("createUser success", name);
    } catch (e) {
      throw new Error("Failed to create user");
    }
  }

  // user with credentialID means officially registered.
  async getUserInfo(name: string) {
    try {
      const result = await redisClient.hgetall(`${this.userPrefix}${name}`);
      if (Object.keys(result).length === 0 || !result.credentialID) {
        return null;
      }
      return result;
    } catch (e) {
      throw new Error("Failed to get user");
    }
  }

  async saveCredential(credential: Credential) {
    try {
      await redisClient.hset(
        `${this.userPrefix}${credential.userName}`,
        "credentialID",
        credential.credentialID,
        "credentialPublicKey",
        Buffer.from(credential.credentialPublicKey).toString("base64"),
        "counter",
        credential.counter
      );
    } catch (e) {
      console.log("error", e);
    }
  }

  async getCredential(userName: string) {
    try {
      const rawCredential = await redisClient.hgetall(
        `${this.userPrefix}${userName}`
      );
      const credential: Credential = {
        userName,
        credentialID: rawCredential.credentialID,
        credentialPublicKey: Uint8Array.from(
          Buffer.from(rawCredential.credentialPublicKey, "base64")
        ),
        counter: parseInt(rawCredential.counter),
      };

      return credential;
    } catch (e) {
      throw new Error("Failed to get credential");
    }
  }
}

export const userService = new UserService();
