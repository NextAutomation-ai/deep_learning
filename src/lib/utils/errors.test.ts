import { describe, it, expect } from "vitest";
import {
  AppError,
  AuthError,
  NotFoundError,
  ValidationError,
  safeJsonParse,
} from "./errors";

describe("AppError", () => {
  it("has correct name, message, and default statusCode", () => {
    const err = new AppError("something broke");
    expect(err.name).toBe("AppError");
    expect(err.message).toBe("something broke");
    expect(err.statusCode).toBe(500);
  });

  it("accepts a custom statusCode and code", () => {
    const err = new AppError("bad", 503, "SERVICE_DOWN");
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe("SERVICE_DOWN");
  });

  it("is an instance of Error", () => {
    expect(new AppError("x")).toBeInstanceOf(Error);
  });
});

describe("AuthError", () => {
  it("has default message and 401 status", () => {
    const err = new AuthError();
    expect(err.name).toBe("AuthError");
    expect(err.message).toBe("Unauthorized");
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("AUTH_ERROR");
  });

  it("accepts a custom message", () => {
    const err = new AuthError("Token expired");
    expect(err.message).toBe("Token expired");
  });

  it("is an instance of AppError and Error", () => {
    const err = new AuthError();
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe("NotFoundError", () => {
  it("has correct message with default resource", () => {
    const err = new NotFoundError();
    expect(err.name).toBe("NotFoundError");
    expect(err.message).toBe("Resource not found");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("includes resource name in message", () => {
    const err = new NotFoundError("Content");
    expect(err.message).toBe("Content not found");
  });
});

describe("ValidationError", () => {
  it("has correct fields", () => {
    const err = new ValidationError("Invalid email");
    expect(err.name).toBe("ValidationError");
    expect(err.message).toBe("Invalid email");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
  });
});

describe("safeJsonParse", () => {
  it("parses valid JSON", () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
  });

  it("parses JSON array", () => {
    expect(safeJsonParse("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("returns null for invalid JSON", () => {
    expect(safeJsonParse("not json")).toBeNull();
  });

  it("strips markdown code fences with json tag", () => {
    const text = '```json\n{"key":"value"}\n```';
    expect(safeJsonParse(text)).toEqual({ key: "value" });
  });

  it("strips markdown code fences without language tag", () => {
    const text = '```\n{"key":"value"}\n```';
    expect(safeJsonParse(text)).toEqual({ key: "value" });
  });

  it("returns null for completely empty input", () => {
    expect(safeJsonParse("")).toBeNull();
  });

  it("uses generic type parameter", () => {
    const result = safeJsonParse<{ x: number }>('{"x":42}');
    expect(result?.x).toBe(42);
  });
});
