/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentRunner from "../agentRunner.js";
import type * as articles from "../articles.js";
import type * as bankr from "../bankr.js";
import type * as chat from "../chat.js";
import type * as coingecko from "../coingecko.js";
import type * as moltbook from "../moltbook.js";
import type * as moralis from "../moralis.js";
import type * as news from "../news.js";
import type * as privy from "../privy.js";
import type * as quicknode from "../quicknode.js";
import type * as thegraph from "../thegraph.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentRunner: typeof agentRunner;
  articles: typeof articles;
  bankr: typeof bankr;
  chat: typeof chat;
  coingecko: typeof coingecko;
  moltbook: typeof moltbook;
  moralis: typeof moralis;
  news: typeof news;
  privy: typeof privy;
  quicknode: typeof quicknode;
  thegraph: typeof thegraph;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
