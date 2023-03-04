import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;
let token: string;
let statementId: string;

describe("Authenticate User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    await request(app).post("/api/v1/users").send({
      name: "User Name",
      email: "user@email.com",
      password: "123456",
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to authenticate an user", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "user@email.com",
      password: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  it("should not be able to authenticate unexistent user", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "unexistent_user@email.com",
      password: "123456",
    });

    expect(response.status).toBe(401);
  });

  it("should not be able to authenticate with incorrect credentials", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "user@email.com",
      password: "12345",
    });

    expect(response.status).toBe(401);
  });
});
