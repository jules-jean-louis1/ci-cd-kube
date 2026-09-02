import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/modules/tasks/tasks.service.js", () => ({
  createTask: vi.fn(),
  getAllTasks: vi.fn(),
  getTasksByUser: vi.fn(),
  findTaskById: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock("../../src/utils/user.js", () => ({
  getUserIdFromContext: vi.fn(),
  USER_ROLE: { ADMIN: "admin" },
}));

import * as controller from "../../src/modules/tasks/tasks.controller.js";
import * as service from "../../src/modules/tasks/tasks.service.js";
import { getUserIdFromContext } from "../../src/utils/user.js";

describe("tasks.controller", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const jsonSpy = vi.fn((body: any, status?: number) => ({ body, status }));

  it("createTask returns 400 on invalid body", async () => {
    const c: any = { req: { json: async () => ({}) }, json: jsonSpy };
    await controller.createTask(c as any);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ error: expect.anything() }), 400);
  });

  it("createTask returns 401 when no user", async () => {
    (getUserIdFromContext as any).mockReturnValue(null);
    const c: any = { req: { json: async () => ({ title: "t" }) }, json: jsonSpy };
    await controller.createTask(c as any);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Unauthorized" }, 401);
  });

  it("createTask returns 201 on success and 500 on service error", async () => {
    (getUserIdFromContext as any).mockReturnValue("1");
    (service.createTask as any).mockResolvedValue({ id: 1, title: "t" });
    const cOk: any = { req: { json: async () => ({ title: "t" }) }, json: jsonSpy };
    await controller.createTask(cOk as any);
    expect(jsonSpy).toHaveBeenCalledWith({ id: 1, title: "t" }, 201);

    (service.createTask as any).mockRejectedValue(new Error("boom"));
    const cErr: any = { req: { json: async () => ({ title: "t" }) }, json: jsonSpy };
    await controller.createTask(cErr as any);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Internal server error" }, 500);
  });

  it("getTasks returns all for admin, unauthorized and user tasks", async () => {
    const adminCtx: any = { get: () => ({ role: "admin" }), json: jsonSpy };
    (service.getAllTasks as any).mockResolvedValue([{ id: 1 }]);
    await controller.getTasks(adminCtx as any);
    expect(jsonSpy).toHaveBeenCalledWith([{ id: 1 }]);

    (getUserIdFromContext as any).mockReturnValue(null);
    const unauthCtx: any = { get: () => undefined, json: jsonSpy };
    await controller.getTasks(unauthCtx as any);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Unauthorized" }, 401);

    (getUserIdFromContext as any).mockReturnValue("2");
    (service.getTasksByUser as any).mockResolvedValue([{ id: 2 }]);
    const userCtx: any = { get: () => undefined, json: jsonSpy };
    await controller.getTasks(userCtx as any);
    expect(jsonSpy).toHaveBeenCalledWith([{ id: 2 }]);
  });

  it("getTask returns 400/404/403/200 accordingly", async () => {
    // invalid id param -> TaskIdParamSchema accepts any string, so skip
    (service.findTaskById as any).mockResolvedValue(null);
    const cNotFound: any = { req: { param: () => "123" }, json: jsonSpy, get: () => undefined };
    await controller.getTask(cNotFound as any);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Task not found" }, 404);

    (service.findTaskById as any).mockResolvedValue({ id: 1, userId: "9" });
    (getUserIdFromContext as any).mockReturnValue("2");
    const cForbidden: any = { req: { param: () => "1" }, json: jsonSpy, get: () => undefined };
    await controller.getTask(cForbidden as any);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Forbidden" }, 403);

    (getUserIdFromContext as any).mockReturnValue("9");
    const cOk: any = { req: { param: () => "1" }, json: jsonSpy, get: () => undefined };
    await controller.getTask(cOk as any);
    expect(jsonSpy).toHaveBeenCalledWith({ id: 1, userId: "9" });
  });

  it("updateTask and deleteTask handle not found/forbidden/success and server error", async () => {
    // update: not found
    (service.findTaskById as any).mockResolvedValue(null);
    const cUpdateNF: any = { req: { param: () => "1", json: async () => ({ title: "x" }) }, json: jsonSpy, get: () => undefined };
    await controller.updateTask(cUpdateNF as any);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Task not found" }, 404);

    // update: forbidden
    (service.findTaskById as any).mockResolvedValue({ id: 1, userId: "9" });
    (getUserIdFromContext as any).mockReturnValue("2");
    const cUpdateF: any = { req: { param: () => "1", json: async () => ({ title: "x" }) }, json: jsonSpy, get: () => undefined };
    await controller.updateTask(cUpdateF as any);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Forbidden" }, 403);

    // update: success and service error
    (getUserIdFromContext as any).mockReturnValue("9");
    (service.updateTask as any).mockResolvedValue({ id: 1, title: "ok" });
    const cUpdateOk: any = { req: { param: () => "1", json: async () => ({ title: "x" }) }, json: jsonSpy, get: () => undefined };
    await controller.updateTask(cUpdateOk as any);
    expect(jsonSpy).toHaveBeenCalledWith({ id: 1, title: "ok" });

    (service.updateTask as any).mockRejectedValue(new Error("boom"));
    const cUpdateErr: any = { req: { param: () => "1", json: async () => ({ title: "x" }) }, json: jsonSpy, get: () => undefined };
    await controller.updateTask(cUpdateErr as any);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Internal server error" }, 500);

    // delete: not found
    (service.findTaskById as any).mockResolvedValue(null);
    const cDelNF: any = { req: { param: () => "1" }, json: jsonSpy, get: () => undefined };
    await controller.deleteTask(cDelNF as any);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Task not found" }, 404);

    // delete: forbidden
    (service.findTaskById as any).mockResolvedValue({ id: 1, userId: "9" });
    (getUserIdFromContext as any).mockReturnValue("2");
    const cDelF: any = { req: { param: () => "1" }, json: jsonSpy, get: () => undefined };
    await controller.deleteTask(cDelF as any);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Forbidden" }, 403);

    // delete: success and service error
    (getUserIdFromContext as any).mockReturnValue("9");
    (service.deleteTask as any).mockResolvedValue(undefined);
    const cDelOk: any = { req: { param: () => "1" }, json: jsonSpy, get: () => undefined };
    await controller.deleteTask(cDelOk as any);
    expect(jsonSpy).toHaveBeenCalledWith({ success: "Task deleted" });

    (service.deleteTask as any).mockRejectedValue(new Error("boom"));
    const cDelErr: any = { req: { param: () => "1" }, json: jsonSpy, get: () => undefined };
    await controller.deleteTask(cDelErr as any);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Internal server error" }, 500);
  });
});
