import supertest from "supertest";
import type { Express } from "express";

type Methods = "get" | "post" | "delete" | "put";

export const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

export const requestWithCookie = (server: Express, url: string, method: Methods, cookie: string[]) => {
  return supertest(server)[method](url).set("Content-Type", "application/json").set("Cookie", cookie);
};

export const requestWithHeaders = (server: Express, url: string, method: Methods, token: string) => {
  return supertest(server)[method](url).set("Content-Type", "application/json").set("authorization", token);
};

export const request = (server: Express, url: string, method: Methods) => {
  return supertest(server)[method](url).set("Content-Type", "application/json");
};
