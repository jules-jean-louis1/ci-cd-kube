import { describe, expect, it, beforeAll } from "vitest";
import app from "../../src/index.js";
import { prisma } from "../../src/utils/prisma.js";

describe("Tasks API", () => {
  const testUser = {
    email: "tasks.user@example.com",
    password: "Password123!",
    firstname: "Task",
    lastname: "User",
    phone: "0102030406",
    date_of_birth: "1992-02-02",
  };

  beforeAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.task.deleteMany();
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  it("should register, login and manage tasks lifecycle", async () => {
    // register
    const reg = await app.request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    expect(reg.status).toBe(201);

    // login
    const loginRes = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody).toHaveProperty("token");
    const token = loginBody.token as string;

    // create task
    const createRes = await app.request("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Ma tâche", description: "desc" }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created).toHaveProperty("id");
    const taskId = created.id;

    // list tasks
    const listRes = await app.request("/tasks", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(Array.isArray(list)).toBe(true);

    // get task
    const getRes = await app.request(`/tasks/${taskId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getRes.status).toBe(200);

    // update task
    const patchRes = await app.request(`/tasks/${taskId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.completed).toBe(true);

    // delete task
    const delRes = await app.request(`/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delRes.status).toBe(200);
    const delBody = await delRes.json();
    expect(delBody).toHaveProperty("success");
  });
});
