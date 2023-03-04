import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;
let token: string;
let statementId: string;

describe("Show User Profile Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    await request(app).post("/api/v1/users").send({
      name: "User Name",
      email: "user@email.com",
      password: "123456",
    });

    token = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "user@email.com",
        password: "123456",
      })
      .then((response) => response.body.token);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to show user profile", async () => {
    const response = await request(app)
      .get("/api/v1/profile")
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
  });

  it("should not be able to show profile of unexistent user", async () => {
    const response = await request(app)
      .get("/api/v1/profile")
      .set({ Authorization: "Bearer eyJhbGciOiJIUzI1NiI" });

    expect(response.status).toBe(401);
  });
});
