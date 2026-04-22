/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as tasks from "../tasks.js";
import type * as test_j0 from "../test_j0.js";

import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server';

import type * as snapshots from '../snapshots.js';
import type * as tasks from '../tasks.js';

declare const fullApi: ApiFromModules<{
  snapshots: typeof snapshots;
  tasks: typeof tasks;
  test_j0: typeof test_j0;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, 'public'>>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, 'internal'>>;

export declare const components: {};
