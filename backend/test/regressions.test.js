import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import { inngest } from "../inngest/index.js";
import { createEmployee, updateEmployee, deleteEmployee, getEmployees } from "../controllers/employeeController.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { clockInOut } from "../controllers/attendanceController.js";
import { getDashboard } from "../controllers/dashboardController.js";

process.env.JWT_SECRET = randomBytes(32).toString("hex");
const { login } = await import("../controllers/authController.js");
const { protect, protectAdmin } = await import("../middleware/auth.js");
const { JWT_SECRET } = await import("../config/auth.js");

let database;
let passwordHash;
before(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(database.getUri());
  await Promise.all([User.init(), Employee.init(), Attendance.init()]);
  passwordHash = await bcrypt.hash("test-password", 4);
});
after(async () => {
  await mongoose.disconnect();
  await database?.stop();
});
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Employee.deleteMany({}), Attendance.deleteMany({})]);
});

const input = (overrides = {}) => ({
  firstName: "Test", lastName: "Employee", email: "test@example.test",
  phone: "5550100", position: "Developer", department: "Engineering",
  basicSalary: 5000, allowances: 200, deductions: 100,
  joinDate: "2026-01-01", password: "test-password", bio: "Original bio",
  ...overrides,
});
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});
const call = async (handler, req = {}) => {
  const res = response();
  await handler({ body: {}, params: {}, query: {}, ...req }, res);
  return res;
};
const fixture = async (overrides = {}) => {
  const values = input(overrides);
  const user = await User.create({ email: values.email, password: passwordHash, role: values.role });
  const employee = await Employee.create({ ...values, userId: user._id });
  return { user, employee };
};
const authorize = async (token, admin = false) => {
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = response();
  let authorized = false;
  await protect(req, res, () => {
    if (admin) protectAdmin(req, res, () => { authorized = true; });
    else authorized = true;
  });
  return { authorized, req, res };
};
const tokenFor = (user) => jwt.sign({ userId: String(user._id), role: user.role }, JWT_SECRET);

test("startup rejects missing, empty, and whitespace secrets before connecting or listening", () => {
  for (const secret of [undefined, "", "   "]) {
    const env = { ...process.env, DOTENV_CONFIG_PATH: "/nonexistent-test-env" };
    if (secret === undefined) delete env.JWT_SECRET;
    else env.JWT_SECRET = secret;
    const result = spawnSync(process.execPath, ["server.js"], {
      cwd: new URL("..", import.meta.url), env, encoding: "utf8", timeout: 10000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /JWT_SECRET must be configured/);
    assert.doesNotMatch(result.stdout, /Server is running|MongoDB Connected/);
  }
});

test("creation validates the complete input before any write", async (t) => {
  const save = t.mock.method(User.prototype, "save", () => { throw new Error("Unexpected write"); });
  for (const values of [
    { phone: undefined }, { position: undefined }, { joinDate: "bad-date" },
    { joinDate: undefined }, { department: "INVALID" }, { basicSalary: "invalid" },
    { allowances: null }, { deductions: false }, { role: "INVALID" },
    { employmentStatus: "INVALID" }, { password: "" }, { firstName: " " },
  ]) {
    const res = await call(createEmployee, { body: input(values) });
    assert.equal(res.statusCode, 400, JSON.stringify(values));
  }
  assert.equal(save.mock.callCount(), 0);
  assert.equal(await User.countDocuments(), 0);
  assert.equal(await Employee.countDocuments(), 0);
});

test("creation normalizes email, stores a password hash, and commits both records", async () => {
  const res = await call(createEmployee, { body: input({ email: "  Mixed@Example.Test  " }) });
  assert.equal(res.statusCode, 201);
  const user = await User.findOne({ email: " MIXED@EXAMPLE.TEST " });
  assert.equal(user.email, "mixed@example.test");
  assert.equal(await bcrypt.compare("test-password", user.password), true);
  assert.equal(res.body.employee.email, user.email);
  assert.equal(String(res.body.employee.userId), String(user._id));
});

test("a failed Employee insert rolls back the preceding User insert", async (t) => {
  t.mock.method(Employee.prototype, "save", () => { throw new Error("Injected insert failure"); });
  const res = await call(createEmployee, { body: input() });
  assert.equal(res.statusCode, 500);
  assert.equal(await User.countDocuments(), 0);
  assert.equal(await Employee.countDocuments(), 0);
});

test("employee lists are filtered, sorted newest first, and populated", async () => {
  const first = await fixture();
  const second = await fixture({ email: "second@example.test" });
  await Employee.updateOne({ _id: first.employee._id }, { createdAt: new Date("2025-01-01") }, { timestamps: false, overwriteImmutable: true });
  await fixture({ email: "sales@example.test", department: "Sales" });
  const res = await call(getEmployees, { query: { department: "Engineering" } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.map((emp) => emp.id), [String(second.employee._id), String(first.employee._id)]);
  assert.deepEqual(res.body[0].user, { email: second.user.email, role: "EMPLOYEE" });
});

test("partial updates preserve omissions and apply explicit zero and empty bio", async () => {
  const { employee } = await fixture({ employmentStatus: "INACTIVE" });
  const params = { id: employee._id };
  assert.equal((await call(updateEmployee, { params, body: { firstName: "Changed" } })).statusCode, 200);
  let updated = await Employee.findById(employee._id);
  for (const key of ["department", "basicSalary", "allowances", "deductions", "employmentStatus", "bio"]) {
    assert.equal(updated[key], employee[key], key);
  }
  assert.equal((await call(updateEmployee, { params, body: {
    department: "Sales", basicSalary: 0, allowances: "0", deductions: 0, bio: "", employmentStatus: "ACTIVE",
  } })).statusCode, 200);
  updated = await Employee.findById(employee._id);
  assert.equal(updated.department, "Sales");
  assert.equal(updated.basicSalary, 0);
  assert.equal(updated.allowances, 0);
  assert.equal(updated.deductions, 0);
  assert.equal(updated.bio, "");
  assert.equal(updated.employmentStatus, "ACTIVE");
});

test("invalid employee and user updates reject the whole change", async () => {
  const { user, employee } = await fixture();
  for (const changes of [
    { employmentStatus: "INVALID" }, { employmentStatus: null }, { role: "INVALID" },
    { role: null }, { department: "INVALID" }, { basicSalary: "bad" },
    { allowances: "" }, { bio: {} }, { firstName: "" },
  ]) {
    const res = await call(updateEmployee, { params: { id: employee._id }, body: { email: "changed@example.test", ...changes } });
    assert.equal(res.statusCode, 400, JSON.stringify(changes));
    assert.equal((await User.findById(user._id)).email, user.email);
    assert.equal((await Employee.findById(employee._id)).email, employee.email);
  }
});

test("a User duplicate-email failure rolls back Employee changes", async () => {
  const { user, employee } = await fixture();
  await fixture({ email: "taken@example.test" });
  const res = await call(updateEmployee, { params: { id: employee._id }, body: { email: "taken@example.test", firstName: "Changed" } });
  assert.equal(res.statusCode, 400);
  assert.equal((await User.findById(user._id)).email, user.email);
  const unchanged = await Employee.findById(employee._id);
  assert.equal(unchanged.email, employee.email);
  assert.equal(unchanged.firstName, employee.firstName);
});

test("login and verification share the validated secret; persisted role revokes admin access", async () => {
  const { user, employee } = await fixture({ role: "ADMIN" });
  const res = await call(login, { body: { email: " TEST@EXAMPLE.TEST ", password: "test-password", role_type: "admin" } });
  assert.equal(res.statusCode, 200);
  assert.equal((await authorize(res.body.token, true)).authorized, true);
  assert.equal(jwt.verify(res.body.token, JWT_SECRET).role, "ADMIN");
  const update = await call(updateEmployee, { params: { id: employee._id }, body: { role: "EMPLOYEE", email: " Changed@Example.Test " } });
  assert.equal(update.statusCode, 200);
  const denied = await authorize(res.body.token, true);
  assert.equal(denied.authorized, false);
  assert.equal(denied.res.statusCode, 403);
  assert.equal(denied.req.session.role, "EMPLOYEE");
  assert.equal(denied.req.session.email, "changed@example.test");
  assert.equal((await Employee.findById(employee._id)).email, "changed@example.test");
  assert.equal((await User.findById(user._id)).role, "EMPLOYEE");
});

test("deletion disables employees and admins, rejecting their existing tokens and new logins", async () => {
  for (const role of ["EMPLOYEE", "ADMIN"]) {
    const { user, employee } = await fixture({ email: `${role}@example.test`, role });
    const token = tokenFor(user);
    assert.equal((await authorize(token)).authorized, true);
    const res = await call(deleteEmployee, { params: { id: employee._id } });
    assert.equal(res.statusCode, 200);
    const deleted = await Employee.findById(employee._id);
    assert.equal(deleted.isDeleted, true);
    assert.equal(deleted.employmentStatus, "INACTIVE");
    assert.equal((await User.findById(user._id)).isDisabled, true);
    assert.equal((await authorize(token)).res.statusCode, 401);
    assert.equal((await call(login, { body: { email: user.email, password: "test-password" } })).statusCode, 401);
  }
});

test("a failed User disable rolls back employee deletion", async (t) => {
  const { user, employee } = await fixture();
  t.mock.method(User, "findByIdAndUpdate", () => { throw new Error("Injected disable failure"); });
  assert.equal((await call(deleteEmployee, { params: { id: employee._id } })).statusCode, 500);
  assert.equal((await Employee.findById(employee._id)).isDeleted, false);
  assert.equal((await User.findById(user._id)).isDisabled, false);
});

test("authentication rejects deleted users and a token alone cannot satisfy protectAdmin", async () => {
  const { user } = await fixture({ role: "ADMIN" });
  const token = tokenFor(user);
  await User.deleteOne({ _id: user._id });
  assert.equal((await authorize(token)).res.statusCode, 401);
  const res = response();
  protectAdmin({ session: { role: "ADMIN" } }, res, () => assert.fail("Untrusted role accepted"));
  assert.equal(res.statusCode, 403);
});

test("profiles reject deactivated employees and preserve the admin fallback", async () => {
  const { user, employee } = await fixture();
  const session = { userId: user._id, email: user.email };
  assert.equal((await call(getProfile, { session })).body.firstName, employee.firstName);
  assert.equal((await call(updateProfile, { session, body: { bio: { invalid: true } } })).statusCode, 400);
  assert.equal((await call(updateProfile, { session, body: { bio: "Updated" } })).statusCode, 200);
  assert.equal((await Employee.findById(employee._id)).bio, "Updated");
  await Employee.updateOne({ _id: employee._id }, { isDeleted: true });
  assert.equal((await call(getProfile, { session })).statusCode, 403);
  assert.equal((await call(updateProfile, { session, body: { bio: "Blocked" } })).statusCode, 403);
  const admin = await call(getProfile, { session: { userId: new mongoose.Types.ObjectId(), email: "admin@example.test" } });
  assert.deepEqual(admin.body, { firstName: "Admin", lastName: "", email: "admin@example.test" });
});

test("dashboard uses the authenticated session fields and counts attendance", async () => {
  const { user, employee } = await fixture();
  await Attendance.create({
    employeeId: employee._id,
    date: new Date(),
    checkIn: new Date(),
  });

  const admin = await call(getDashboard, { session: { role: "ADMIN" } });
  assert.equal(admin.statusCode, 200);
  assert.equal(admin.body.todayAttendance, 1);

  const employeeDashboard = await call(getDashboard, {
    session: { role: "EMPLOYEE", userId: user._id },
  });
  assert.equal(employeeDashboard.statusCode, 200);
  assert.equal(employeeDashboard.body.currentMonthAttendance, 1);
});

test("lateness includes later whole hours but leaves 9:00 on time", async (t) => {
  const { user } = await fixture();
  t.mock.method(inngest, "send", async () => {});
  for (const [hour, minute, status] of [[8, 59, "PRESENT"], [9, 0, "PRESENT"], [9, 1, "LATE"], [10, 0, "LATE"], [12, 0, "LATE"]]) {
    await Attendance.deleteMany({});
    const istTime = `2026-10-07T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:30`;
    t.mock.timers.enable({ apis: ["Date"], now: new Date(istTime) });
    try {
      const res = await call(clockInOut, { session: { userId: user._id } });
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.data.status, status, `${hour}:${minute}`);
      assert.equal(res.body.data.date.toISOString(), "2026-10-06T18:30:00.000Z");
    } finally {
      t.mock.timers.reset();
    }
  }
});

test("duplicate check-ins reuse an overnight open shift; only explicit check-out closes it", async (t) => {
  const { user, employee } = await fixture();
  const now = new Date(2026, 9, 7, 6, 0);
  t.mock.timers.enable({ apis: ["Date"], now });
  const original = await Attendance.create({
    employeeId: employee._id, date: new Date(2026, 9, 6), checkIn: new Date(2026, 9, 6, 22), status: "LATE",
  });
  // Even an existing current-day record must not hide the previous open shift.
  await Attendance.create({ employeeId: employee._id, date: new Date(2026, 9, 7), checkIn: new Date(2026, 9, 7, 0), checkOut: new Date(2026, 9, 7, 1) });
  const req = { session: { userId: user._id } };
  for (const body of [{}, { action: "CHECK_IN" }]) {
    const res = await call(clockInOut, { ...req, body });
    assert.equal(res.body.type, "CHECK_IN");
    assert.equal(String(res.body.data._id), String(original._id));
    assert.deepEqual((await Attendance.findById(original._id)).toObject(), original.toObject());
  }
  const res = await call(clockInOut, { ...req, body: { action: "CHECK_OUT" } });
  assert.equal(res.body.type, "CHECK_OUT");
  assert.equal(String(res.body.data._id), String(original._id));
  assert.equal(res.body.data.checkOut.getTime(), now.getTime());
  assert.equal(res.body.data.workingHours, 8);
  assert.equal(res.body.data.dayType, "Full Day");
  assert.equal(res.body.data.status, "LATE");
  assert.equal(await Attendance.countDocuments(), 2);
});

test("current-day closed records are reused and invalid or premature check-outs do not create records", async (t) => {
  t.mock.method(inngest, "send", async () => {});
  const { user } = await fixture();
  const req = { session: { userId: user._id } };
  assert.equal((await call(clockInOut, { ...req, body: { action: "UNKNOWN" } })).statusCode, 400);
  assert.equal((await call(clockInOut, { ...req, body: { action: "CHECK_OUT" } })).statusCode, 400);
  assert.equal(await Attendance.countDocuments(), 0);
  const first = await call(clockInOut, req);
  assert.equal(first.body.type, "CHECK_IN");
  const closed = await call(clockInOut, { ...req, body: { action: "CHECK_OUT" } });
  for (const action of ["CHECK_IN", "CHECK_OUT"]) {
    const repeat = await call(clockInOut, { ...req, body: { action } });
    assert.deepEqual(repeat.body.data.toObject(), closed.body.data.toObject());
  }
  assert.equal(await Attendance.countDocuments(), 1);
});

test("a shift just under eight hours is rounded for storage but remains a half day", async (t) => {
  const { user, employee } = await fixture();
  const now = new Date(2026, 9, 7, 17, 0);
  t.mock.timers.enable({ apis: ["Date"], now });
  try {
    await Attendance.create({
      employeeId: employee._id,
      date: new Date(2026, 9, 7),
      checkIn: new Date(now.getTime() - (8 * 60 * 60 * 1000 - 1000)),
    });

    const result = await call(clockInOut, {
      session: { userId: user._id },
      body: { action: "CHECK_OUT" },
    });

    assert.equal(result.body.data.workingHours, 8);
    assert.equal(result.body.data.dayType, "Half Day");
  } finally {
    t.mock.timers.reset();
  }
});
