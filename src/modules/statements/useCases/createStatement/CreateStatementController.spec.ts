import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;
let token: string;
let statementId: string;

describe("Create Statement Controller", () => {
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

  it("should be able to create statements", async () => {
    const deposit = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        type: "deposit",
        amount: 100,
        description: "deposit",
      })
      .set({ Authorization: `Bearer ${token}` });

    const withdraw = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        type: "withdraw",
        amount: 80,
        description: "withdraw",
      })
      .set({ Authorization: `Bearer ${token}` });

    expect(deposit.status).toBe(201);
    expect(deposit.body.type).toEqual("deposit");
    expect(deposit.body.amount).toBe(100);
    expect(withdraw.status).toBe(201);
    expect(withdraw.body.type).toEqual("withdraw");
    expect(withdraw.body.amount).toBe(80);
  });

  it("should not be able to create statements for an unexistent user", async () => {
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        type: "deposit",
        amount: 100,
        description: "deposit",
      })
      .set({ Authorization: "Bearer eyJhbGciOiJIUzI1NiI" });

    expect(response.status).toBe(401);
  });

  it("should not be able to make an withdraw if there are insufficient funds", async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        type: "withdraw",
        amount: 80,
        description: "withdraw",
      })
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(400);
  });
});
