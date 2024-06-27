import type { DbClient } from "../../database/redis";
import type { HashPassword } from "../../utils/hash-password";
import type { UserModel } from "./user.model";
import type { Secrets } from "../../configs";

export type UserServiceType = ReturnType<typeof makeUserService>;

type DepsType = {
  dbClient: DbClient;
  hashPassword: HashPassword;
  generateId: () => string;
  secrets: Secrets;
};

export const makeUserService = ({ dbClient, hashPassword, generateId, secrets }: DepsType) => ({
  async createUser({ email, password }: { email: string; password: string }) {
    const user = {
      email,
      password: hashPassword(email, password, secrets.token_secret),
      id: generateId(),
      created_at: new Date().toISOString(),
    };

    const multi = dbClient.multi();
    // using hash set because of the flat object, json would be better if the data is more complex(nested)
    multi.hSet(`user:${user.id}`, user);
    // saving the email and ID to get the user via email too.
    multi.set(`email:${email}`, user.id);
    await multi.exec();

    return { email, id: user.id, created_at: user.created_at };
  },

  async getUserById(id: string): Promise<UserModel | null> {
    const user = await dbClient.hGetAll(`user:${id}`);
    return user as unknown as UserModel;
  },

  getUserIdByEmail(email: string) {
    return dbClient.get(`email:${email}`);
  },

  async isEmailExist(email: string) {
    return !!(await dbClient.exists(`email:${email}`));
  },

  async getUserByEmailPassword(email: string, password: string): Promise<UserModel | null> {
    const id = await this.getUserIdByEmail(email);
    if (!id) return null;

    const user = await this.getUserById(id);
    if (user === null) return null;

    const hashedPassword = hashPassword(email, password, secrets.token_secret);
    if (user.password !== hashedPassword) return null;

    return { ...user, id };
  },

  async deleteUserById(id: string) {
    const user = await this.getUserById(id);
    if (user === null) return null;

    const multi = dbClient.multi();
    multi.del(`user:${id}`);
    multi.del(`email:${user?.email}`);
    const res = await multi.exec();

    return res;
  },
});
