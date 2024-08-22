import redisClient from "../redis";

type User = {
  id: string;
  name: string;
};

export class UserService {
  private readonly userPrefix = "user:";

  async createUser(user: User) {
    try {
      const result = await redisClient.set(
        `${this.userPrefix}${user.name}`,
        user.id
      );
      return result;
    } catch (e) {
      throw new Error("Failed to create user");
    }
  }

  async getUser(username: string) {
    try {
      const result = await redisClient.get(`${this.userPrefix}${username}`);
      return result;
    } catch (e) {
      throw new Error("Failed to get user");
    }
  }
}
