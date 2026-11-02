import { capitalize, randomDigits, randomString } from './helpers';

// Data dinamis: dibuat baru tiap test supaya tidak bentrok saat jalan paralel

export interface Customer {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export function buildCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    firstName: capitalize(randomString(6)),
    lastName: capitalize(randomString(8)),
    postalCode: randomDigits(5),
    ...overrides,
  };
}

export type PostPayload = {
  title: string;
  body: string;
  userId: number;
};

export function buildPost(overrides: Partial<PostPayload> = {}): PostPayload {
  return {
    title: `QA post ${randomString()}`,
    body: `Dibuat oleh automation ${new Date().toISOString()}`,
    userId: 1,
    ...overrides,
  };
}
