export type User = { id: string };

export type UserRedisModel = {
  email: string;
  created_at: Date;
  password?: string;
};

export type UserModel = User & UserRedisModel;
