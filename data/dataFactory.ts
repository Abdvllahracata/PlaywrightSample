import { capitalize, randomDigits, randomString } from '../utils/helpers';

/**
 * Dynamic data generators. Data is regenerated for every test to avoid conflicts during parallel execution.
 * Specific fields can be set through the overrides parameter.
 */

export interface Customer {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/** Random customer data for the checkout form. */
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

/** Random payload for creating a post through the API. */
export function buildPost(overrides: Partial<PostPayload> = {}): PostPayload {
  return {
    title: `QA post ${randomString()}`,
    body: `Dibuat oleh automation ${new Date().toISOString()}`,
    userId: 1,
    ...overrides,
  };
}

/** A product row read from the cart page. */
export interface CartItem {
  name: string;
  price: string;
}

export type OrderPayload = {
  title: string;
  userId: number;
  items: CartItem[];
};

/** Payload for saving the cart contents through the API as an order record. */
export function buildOrder(items: CartItem[], overrides: Partial<OrderPayload> = {}): OrderPayload {
  return {
    title: `QA order ${randomString()}`,
    userId: 1,
    items,
    ...overrides,
  };
}
