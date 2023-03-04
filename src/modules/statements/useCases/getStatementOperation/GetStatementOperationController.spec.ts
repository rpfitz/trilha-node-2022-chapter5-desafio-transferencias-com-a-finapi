import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;
let token: string;
let statementId: string;

describe("Get Statement Operation Controller", () => {
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

    statementId = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        type: "deposit",
        amount: 100,
        description: "deposit",
      })
      .set({ Authorization: `Bearer ${token}` })
      .then((response) => response.body.id);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to get statement operation", async () => {
    const response = await request(app)
      .get(`/api/v1/statements/${statementId}`)
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
  });

  it("should not be able to get statement operation for an unexistent user", async () => {
    const response = await request(app)
    .get(`/api/v1/statements/${statementId}`)
    .set({ Authorization: "Bearer eyJhbGciOiJIUzI1NiI" });

  expect(response.status).toBe(401);
  });

  it("should not be able to get statement operation for an unexistent statement", async () => {
    const response = await request(app)
    .get("/api/v1/statements/sdiuhdf32784365")
    .set({ Authorization: `Bearer ${token}` });

  expect(response.status).toBe(500);
  });
});
