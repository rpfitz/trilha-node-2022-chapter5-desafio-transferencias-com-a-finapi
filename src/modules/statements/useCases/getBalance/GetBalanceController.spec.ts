import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;
let token: string;
let statementId: string;

describe("Get Balance Controller", () => {
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

    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        type: "deposit",
        amount: 100,
        description: "deposit",
      })
      .set({ Authorization: `Bearer ${token}` });

    await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        type: "withdraw",
        amount: 40,
        description: "withdraw",
      })
      .set({ Authorization: `Bearer ${token}` });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to show user's balance", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("balance");
    expect(response.body.balance).toBe(60);
    expect(response.body.statement.length).toBe(2);
  });

  it("should not be able to show balance of unexistent user", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({ Authorization: "Bearer eyJhbGciOiJIUzI1NiI" });

    expect(response.status).toBe(401);
  });
});
