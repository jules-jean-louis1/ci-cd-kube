import { Given, When, Then, BeforeAll, AfterAll } from '@cucumber/cucumber';
import fetch from 'node-fetch';
import { prisma } from '../../../src/utils/prisma.js';
import app from '../../../src/index.js';

let token = '';
let createdTaskId: number | null = null;
let tasksCount = 0;

BeforeAll(async () => {
  // ensure clean DB
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
});

AfterAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
});

Given('the test database is clean', async function () {
  // no-op: handled in BeforeAll
});

When('I register and login as a user', async function () {
  const testUser = {
    email: 'cuke@test.com',
    password: 'Password123!',
    firstname: 'Cuke',
    lastname: 'User',
    phone: '0102030405',
    date_of_birth: '1990-01-01'
  };

  await app.request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });

  const res = await app.request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  });

  const body = await res.json();
  token = body.token;
});

When('I create a task with title {string} and description {string}', async function (title: string, description: string) {
  const res = await app.request('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, description }),
  });
  const body = await res.json();
  createdTaskId = body.id;
});

Then('I should see {int} tasks', async function (count: number) {
  const res = await app.request('/tasks', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  tasksCount = body.length;
  if (tasksCount !== count) throw new Error(`Expected ${count} tasks, got ${tasksCount}`);
});

Then('I get the task by id', async function () {
  const res = await app.request(`/tasks/${createdTaskId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!body || body.id !== createdTaskId) throw new Error('Task not found by id');
});

When('I update the task title to {string}', async function (newTitle: string) {
  await app.request(`/tasks/${createdTaskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: newTitle }),
  });
});

Then('the task title should be {string}', async function (expectedTitle: string) {
  const res = await app.request(`/tasks/${createdTaskId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (body.title !== expectedTitle) throw new Error(`Expected title ${expectedTitle}, got ${body.title}`);
});

When('I delete the task', async function () {
  await app.request(`/tasks/${createdTaskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
});
