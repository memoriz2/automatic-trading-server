
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model TradeLog
 * 
 */
export type TradeLog = $Result.DefaultSelection<Prisma.$TradeLogPayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Cryptocurrency
 * 
 */
export type Cryptocurrency = $Result.DefaultSelection<Prisma.$CryptocurrencyPayload>
/**
 * Model Exchange
 * 
 */
export type Exchange = $Result.DefaultSelection<Prisma.$ExchangePayload>
/**
 * Model KimchiPremium
 * 
 */
export type KimchiPremium = $Result.DefaultSelection<Prisma.$KimchiPremiumPayload>
/**
 * Model PerformanceStat
 * 
 */
export type PerformanceStat = $Result.DefaultSelection<Prisma.$PerformanceStatPayload>
/**
 * Model Position
 * 
 */
export type Position = $Result.DefaultSelection<Prisma.$PositionPayload>
/**
 * Model Session
 * 
 */
export type Session = $Result.DefaultSelection<Prisma.$SessionPayload>
/**
 * Model SystemAlert
 * 
 */
export type SystemAlert = $Result.DefaultSelection<Prisma.$SystemAlertPayload>
/**
 * Model Trade
 * 
 */
export type Trade = $Result.DefaultSelection<Prisma.$TradePayload>
/**
 * Model TradingSetting
 * 
 */
export type TradingSetting = $Result.DefaultSelection<Prisma.$TradingSettingPayload>
/**
 * Model TradingStrategy
 * 
 */
export type TradingStrategy = $Result.DefaultSelection<Prisma.$TradingStrategyPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more TradeLogs
 * const tradeLogs = await prisma.tradeLog.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more TradeLogs
   * const tradeLogs = await prisma.tradeLog.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.tradeLog`: Exposes CRUD operations for the **TradeLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TradeLogs
    * const tradeLogs = await prisma.tradeLog.findMany()
    * ```
    */
  get tradeLog(): Prisma.TradeLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.cryptocurrency`: Exposes CRUD operations for the **Cryptocurrency** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Cryptocurrencies
    * const cryptocurrencies = await prisma.cryptocurrency.findMany()
    * ```
    */
  get cryptocurrency(): Prisma.CryptocurrencyDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.exchange`: Exposes CRUD operations for the **Exchange** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Exchanges
    * const exchanges = await prisma.exchange.findMany()
    * ```
    */
  get exchange(): Prisma.ExchangeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.kimchiPremium`: Exposes CRUD operations for the **KimchiPremium** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more KimchiPremiums
    * const kimchiPremiums = await prisma.kimchiPremium.findMany()
    * ```
    */
  get kimchiPremium(): Prisma.KimchiPremiumDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.performanceStat`: Exposes CRUD operations for the **PerformanceStat** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PerformanceStats
    * const performanceStats = await prisma.performanceStat.findMany()
    * ```
    */
  get performanceStat(): Prisma.PerformanceStatDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.position`: Exposes CRUD operations for the **Position** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Positions
    * const positions = await prisma.position.findMany()
    * ```
    */
  get position(): Prisma.PositionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.session`: Exposes CRUD operations for the **Session** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sessions
    * const sessions = await prisma.session.findMany()
    * ```
    */
  get session(): Prisma.SessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.systemAlert`: Exposes CRUD operations for the **SystemAlert** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SystemAlerts
    * const systemAlerts = await prisma.systemAlert.findMany()
    * ```
    */
  get systemAlert(): Prisma.SystemAlertDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.trade`: Exposes CRUD operations for the **Trade** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Trades
    * const trades = await prisma.trade.findMany()
    * ```
    */
  get trade(): Prisma.TradeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tradingSetting`: Exposes CRUD operations for the **TradingSetting** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TradingSettings
    * const tradingSettings = await prisma.tradingSetting.findMany()
    * ```
    */
  get tradingSetting(): Prisma.TradingSettingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tradingStrategy`: Exposes CRUD operations for the **TradingStrategy** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TradingStrategies
    * const tradingStrategies = await prisma.tradingStrategy.findMany()
    * ```
    */
  get tradingStrategy(): Prisma.TradingStrategyDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.15.0
   * Query Engine version: 85179d7826409ee107a6ba334b5e305ae3fba9fb
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    TradeLog: 'TradeLog',
    User: 'User',
    Cryptocurrency: 'Cryptocurrency',
    Exchange: 'Exchange',
    KimchiPremium: 'KimchiPremium',
    PerformanceStat: 'PerformanceStat',
    Position: 'Position',
    Session: 'Session',
    SystemAlert: 'SystemAlert',
    Trade: 'Trade',
    TradingSetting: 'TradingSetting',
    TradingStrategy: 'TradingStrategy'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "tradeLog" | "user" | "cryptocurrency" | "exchange" | "kimchiPremium" | "performanceStat" | "position" | "session" | "systemAlert" | "trade" | "tradingSetting" | "tradingStrategy"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      TradeLog: {
        payload: Prisma.$TradeLogPayload<ExtArgs>
        fields: Prisma.TradeLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TradeLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradeLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TradeLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradeLogPayload>
          }
          findFirst: {
            args: Prisma.TradeLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradeLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TradeLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradeLogPayload>
          }
          findMany: {
            args: Prisma.TradeLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradeLogPayload>[]
          }
          create: {
            args: Prisma.TradeLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradeLogPayload>
          }
          createMany: {
            args: Prisma.TradeLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TradeLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradeLogPayload>[]
          }
          delete: {
            args: Prisma.TradeLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradeLogPayload>
          }
          update: {
            args: Prisma.TradeLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradeLogPayload>
          }
          deleteMany: {
            args: Prisma.TradeLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TradeLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TradeLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradeLogPayload>[]
          }
          upsert: {
            args: Prisma.TradeLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradeLogPayload>
          }
          aggregate: {
            args: Prisma.TradeLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTradeLog>
          }
          groupBy: {
            args: Prisma.TradeLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<TradeLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.TradeLogCountArgs<ExtArgs>
            result: $Utils.Optional<TradeLogCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Cryptocurrency: {
        payload: Prisma.$CryptocurrencyPayload<ExtArgs>
        fields: Prisma.CryptocurrencyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CryptocurrencyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CryptocurrencyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CryptocurrencyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CryptocurrencyPayload>
          }
          findFirst: {
            args: Prisma.CryptocurrencyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CryptocurrencyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CryptocurrencyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CryptocurrencyPayload>
          }
          findMany: {
            args: Prisma.CryptocurrencyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CryptocurrencyPayload>[]
          }
          create: {
            args: Prisma.CryptocurrencyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CryptocurrencyPayload>
          }
          createMany: {
            args: Prisma.CryptocurrencyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CryptocurrencyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CryptocurrencyPayload>[]
          }
          delete: {
            args: Prisma.CryptocurrencyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CryptocurrencyPayload>
          }
          update: {
            args: Prisma.CryptocurrencyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CryptocurrencyPayload>
          }
          deleteMany: {
            args: Prisma.CryptocurrencyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CryptocurrencyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CryptocurrencyUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CryptocurrencyPayload>[]
          }
          upsert: {
            args: Prisma.CryptocurrencyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CryptocurrencyPayload>
          }
          aggregate: {
            args: Prisma.CryptocurrencyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCryptocurrency>
          }
          groupBy: {
            args: Prisma.CryptocurrencyGroupByArgs<ExtArgs>
            result: $Utils.Optional<CryptocurrencyGroupByOutputType>[]
          }
          count: {
            args: Prisma.CryptocurrencyCountArgs<ExtArgs>
            result: $Utils.Optional<CryptocurrencyCountAggregateOutputType> | number
          }
        }
      }
      Exchange: {
        payload: Prisma.$ExchangePayload<ExtArgs>
        fields: Prisma.ExchangeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ExchangeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ExchangeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangePayload>
          }
          findFirst: {
            args: Prisma.ExchangeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ExchangeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangePayload>
          }
          findMany: {
            args: Prisma.ExchangeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangePayload>[]
          }
          create: {
            args: Prisma.ExchangeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangePayload>
          }
          createMany: {
            args: Prisma.ExchangeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ExchangeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangePayload>[]
          }
          delete: {
            args: Prisma.ExchangeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangePayload>
          }
          update: {
            args: Prisma.ExchangeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangePayload>
          }
          deleteMany: {
            args: Prisma.ExchangeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ExchangeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ExchangeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangePayload>[]
          }
          upsert: {
            args: Prisma.ExchangeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ExchangePayload>
          }
          aggregate: {
            args: Prisma.ExchangeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateExchange>
          }
          groupBy: {
            args: Prisma.ExchangeGroupByArgs<ExtArgs>
            result: $Utils.Optional<ExchangeGroupByOutputType>[]
          }
          count: {
            args: Prisma.ExchangeCountArgs<ExtArgs>
            result: $Utils.Optional<ExchangeCountAggregateOutputType> | number
          }
        }
      }
      KimchiPremium: {
        payload: Prisma.$KimchiPremiumPayload<ExtArgs>
        fields: Prisma.KimchiPremiumFieldRefs
        operations: {
          findUnique: {
            args: Prisma.KimchiPremiumFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KimchiPremiumPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.KimchiPremiumFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KimchiPremiumPayload>
          }
          findFirst: {
            args: Prisma.KimchiPremiumFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KimchiPremiumPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.KimchiPremiumFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KimchiPremiumPayload>
          }
          findMany: {
            args: Prisma.KimchiPremiumFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KimchiPremiumPayload>[]
          }
          create: {
            args: Prisma.KimchiPremiumCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KimchiPremiumPayload>
          }
          createMany: {
            args: Prisma.KimchiPremiumCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.KimchiPremiumCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KimchiPremiumPayload>[]
          }
          delete: {
            args: Prisma.KimchiPremiumDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KimchiPremiumPayload>
          }
          update: {
            args: Prisma.KimchiPremiumUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KimchiPremiumPayload>
          }
          deleteMany: {
            args: Prisma.KimchiPremiumDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.KimchiPremiumUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.KimchiPremiumUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KimchiPremiumPayload>[]
          }
          upsert: {
            args: Prisma.KimchiPremiumUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$KimchiPremiumPayload>
          }
          aggregate: {
            args: Prisma.KimchiPremiumAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateKimchiPremium>
          }
          groupBy: {
            args: Prisma.KimchiPremiumGroupByArgs<ExtArgs>
            result: $Utils.Optional<KimchiPremiumGroupByOutputType>[]
          }
          count: {
            args: Prisma.KimchiPremiumCountArgs<ExtArgs>
            result: $Utils.Optional<KimchiPremiumCountAggregateOutputType> | number
          }
        }
      }
      PerformanceStat: {
        payload: Prisma.$PerformanceStatPayload<ExtArgs>
        fields: Prisma.PerformanceStatFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PerformanceStatFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceStatPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PerformanceStatFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceStatPayload>
          }
          findFirst: {
            args: Prisma.PerformanceStatFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceStatPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PerformanceStatFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceStatPayload>
          }
          findMany: {
            args: Prisma.PerformanceStatFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceStatPayload>[]
          }
          create: {
            args: Prisma.PerformanceStatCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceStatPayload>
          }
          createMany: {
            args: Prisma.PerformanceStatCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PerformanceStatCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceStatPayload>[]
          }
          delete: {
            args: Prisma.PerformanceStatDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceStatPayload>
          }
          update: {
            args: Prisma.PerformanceStatUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceStatPayload>
          }
          deleteMany: {
            args: Prisma.PerformanceStatDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PerformanceStatUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PerformanceStatUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceStatPayload>[]
          }
          upsert: {
            args: Prisma.PerformanceStatUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceStatPayload>
          }
          aggregate: {
            args: Prisma.PerformanceStatAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePerformanceStat>
          }
          groupBy: {
            args: Prisma.PerformanceStatGroupByArgs<ExtArgs>
            result: $Utils.Optional<PerformanceStatGroupByOutputType>[]
          }
          count: {
            args: Prisma.PerformanceStatCountArgs<ExtArgs>
            result: $Utils.Optional<PerformanceStatCountAggregateOutputType> | number
          }
        }
      }
      Position: {
        payload: Prisma.$PositionPayload<ExtArgs>
        fields: Prisma.PositionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PositionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PositionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          findFirst: {
            args: Prisma.PositionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PositionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          findMany: {
            args: Prisma.PositionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>[]
          }
          create: {
            args: Prisma.PositionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          createMany: {
            args: Prisma.PositionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PositionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>[]
          }
          delete: {
            args: Prisma.PositionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          update: {
            args: Prisma.PositionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          deleteMany: {
            args: Prisma.PositionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PositionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PositionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>[]
          }
          upsert: {
            args: Prisma.PositionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          aggregate: {
            args: Prisma.PositionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePosition>
          }
          groupBy: {
            args: Prisma.PositionGroupByArgs<ExtArgs>
            result: $Utils.Optional<PositionGroupByOutputType>[]
          }
          count: {
            args: Prisma.PositionCountArgs<ExtArgs>
            result: $Utils.Optional<PositionCountAggregateOutputType> | number
          }
        }
      }
      Session: {
        payload: Prisma.$SessionPayload<ExtArgs>
        fields: Prisma.SessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findFirst: {
            args: Prisma.SessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findMany: {
            args: Prisma.SessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          create: {
            args: Prisma.SessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          createMany: {
            args: Prisma.SessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          delete: {
            args: Prisma.SessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          update: {
            args: Prisma.SessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          deleteMany: {
            args: Prisma.SessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          upsert: {
            args: Prisma.SessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          aggregate: {
            args: Prisma.SessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSession>
          }
          groupBy: {
            args: Prisma.SessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SessionCountArgs<ExtArgs>
            result: $Utils.Optional<SessionCountAggregateOutputType> | number
          }
        }
      }
      SystemAlert: {
        payload: Prisma.$SystemAlertPayload<ExtArgs>
        fields: Prisma.SystemAlertFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SystemAlertFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemAlertPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SystemAlertFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemAlertPayload>
          }
          findFirst: {
            args: Prisma.SystemAlertFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemAlertPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SystemAlertFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemAlertPayload>
          }
          findMany: {
            args: Prisma.SystemAlertFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemAlertPayload>[]
          }
          create: {
            args: Prisma.SystemAlertCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemAlertPayload>
          }
          createMany: {
            args: Prisma.SystemAlertCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SystemAlertCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemAlertPayload>[]
          }
          delete: {
            args: Prisma.SystemAlertDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemAlertPayload>
          }
          update: {
            args: Prisma.SystemAlertUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemAlertPayload>
          }
          deleteMany: {
            args: Prisma.SystemAlertDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SystemAlertUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SystemAlertUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemAlertPayload>[]
          }
          upsert: {
            args: Prisma.SystemAlertUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemAlertPayload>
          }
          aggregate: {
            args: Prisma.SystemAlertAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSystemAlert>
          }
          groupBy: {
            args: Prisma.SystemAlertGroupByArgs<ExtArgs>
            result: $Utils.Optional<SystemAlertGroupByOutputType>[]
          }
          count: {
            args: Prisma.SystemAlertCountArgs<ExtArgs>
            result: $Utils.Optional<SystemAlertCountAggregateOutputType> | number
          }
        }
      }
      Trade: {
        payload: Prisma.$TradePayload<ExtArgs>
        fields: Prisma.TradeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TradeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TradeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradePayload>
          }
          findFirst: {
            args: Prisma.TradeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TradeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradePayload>
          }
          findMany: {
            args: Prisma.TradeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradePayload>[]
          }
          create: {
            args: Prisma.TradeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradePayload>
          }
          createMany: {
            args: Prisma.TradeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TradeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradePayload>[]
          }
          delete: {
            args: Prisma.TradeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradePayload>
          }
          update: {
            args: Prisma.TradeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradePayload>
          }
          deleteMany: {
            args: Prisma.TradeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TradeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TradeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradePayload>[]
          }
          upsert: {
            args: Prisma.TradeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradePayload>
          }
          aggregate: {
            args: Prisma.TradeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTrade>
          }
          groupBy: {
            args: Prisma.TradeGroupByArgs<ExtArgs>
            result: $Utils.Optional<TradeGroupByOutputType>[]
          }
          count: {
            args: Prisma.TradeCountArgs<ExtArgs>
            result: $Utils.Optional<TradeCountAggregateOutputType> | number
          }
        }
      }
      TradingSetting: {
        payload: Prisma.$TradingSettingPayload<ExtArgs>
        fields: Prisma.TradingSettingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TradingSettingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingSettingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TradingSettingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingSettingPayload>
          }
          findFirst: {
            args: Prisma.TradingSettingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingSettingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TradingSettingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingSettingPayload>
          }
          findMany: {
            args: Prisma.TradingSettingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingSettingPayload>[]
          }
          create: {
            args: Prisma.TradingSettingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingSettingPayload>
          }
          createMany: {
            args: Prisma.TradingSettingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TradingSettingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingSettingPayload>[]
          }
          delete: {
            args: Prisma.TradingSettingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingSettingPayload>
          }
          update: {
            args: Prisma.TradingSettingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingSettingPayload>
          }
          deleteMany: {
            args: Prisma.TradingSettingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TradingSettingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TradingSettingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingSettingPayload>[]
          }
          upsert: {
            args: Prisma.TradingSettingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingSettingPayload>
          }
          aggregate: {
            args: Prisma.TradingSettingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTradingSetting>
          }
          groupBy: {
            args: Prisma.TradingSettingGroupByArgs<ExtArgs>
            result: $Utils.Optional<TradingSettingGroupByOutputType>[]
          }
          count: {
            args: Prisma.TradingSettingCountArgs<ExtArgs>
            result: $Utils.Optional<TradingSettingCountAggregateOutputType> | number
          }
        }
      }
      TradingStrategy: {
        payload: Prisma.$TradingStrategyPayload<ExtArgs>
        fields: Prisma.TradingStrategyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TradingStrategyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingStrategyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TradingStrategyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingStrategyPayload>
          }
          findFirst: {
            args: Prisma.TradingStrategyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingStrategyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TradingStrategyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingStrategyPayload>
          }
          findMany: {
            args: Prisma.TradingStrategyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingStrategyPayload>[]
          }
          create: {
            args: Prisma.TradingStrategyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingStrategyPayload>
          }
          createMany: {
            args: Prisma.TradingStrategyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TradingStrategyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingStrategyPayload>[]
          }
          delete: {
            args: Prisma.TradingStrategyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingStrategyPayload>
          }
          update: {
            args: Prisma.TradingStrategyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingStrategyPayload>
          }
          deleteMany: {
            args: Prisma.TradingStrategyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TradingStrategyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TradingStrategyUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingStrategyPayload>[]
          }
          upsert: {
            args: Prisma.TradingStrategyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TradingStrategyPayload>
          }
          aggregate: {
            args: Prisma.TradingStrategyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTradingStrategy>
          }
          groupBy: {
            args: Prisma.TradingStrategyGroupByArgs<ExtArgs>
            result: $Utils.Optional<TradingStrategyGroupByOutputType>[]
          }
          count: {
            args: Prisma.TradingStrategyCountArgs<ExtArgs>
            result: $Utils.Optional<TradingStrategyCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    tradeLog?: TradeLogOmit
    user?: UserOmit
    cryptocurrency?: CryptocurrencyOmit
    exchange?: ExchangeOmit
    kimchiPremium?: KimchiPremiumOmit
    performanceStat?: PerformanceStatOmit
    position?: PositionOmit
    session?: SessionOmit
    systemAlert?: SystemAlertOmit
    trade?: TradeOmit
    tradingSetting?: TradingSettingOmit
    tradingStrategy?: TradingStrategyOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model TradeLog
   */

  export type AggregateTradeLog = {
    _count: TradeLogCountAggregateOutputType | null
    _avg: TradeLogAvgAggregateOutputType | null
    _sum: TradeLogSumAggregateOutputType | null
    _min: TradeLogMinAggregateOutputType | null
    _max: TradeLogMaxAggregateOutputType | null
  }

  export type TradeLogAvgAggregateOutputType = {
    id: number | null
    kimp: number | null
    amount: number | null
  }

  export type TradeLogSumAggregateOutputType = {
    id: number | null
    kimp: number | null
    amount: number | null
  }

  export type TradeLogMinAggregateOutputType = {
    id: number | null
    timestamp: Date | null
    kimp: number | null
    action: string | null
    amount: number | null
    result: string | null
  }

  export type TradeLogMaxAggregateOutputType = {
    id: number | null
    timestamp: Date | null
    kimp: number | null
    action: string | null
    amount: number | null
    result: string | null
  }

  export type TradeLogCountAggregateOutputType = {
    id: number
    timestamp: number
    kimp: number
    action: number
    amount: number
    result: number
    _all: number
  }


  export type TradeLogAvgAggregateInputType = {
    id?: true
    kimp?: true
    amount?: true
  }

  export type TradeLogSumAggregateInputType = {
    id?: true
    kimp?: true
    amount?: true
  }

  export type TradeLogMinAggregateInputType = {
    id?: true
    timestamp?: true
    kimp?: true
    action?: true
    amount?: true
    result?: true
  }

  export type TradeLogMaxAggregateInputType = {
    id?: true
    timestamp?: true
    kimp?: true
    action?: true
    amount?: true
    result?: true
  }

  export type TradeLogCountAggregateInputType = {
    id?: true
    timestamp?: true
    kimp?: true
    action?: true
    amount?: true
    result?: true
    _all?: true
  }

  export type TradeLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TradeLog to aggregate.
     */
    where?: TradeLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradeLogs to fetch.
     */
    orderBy?: TradeLogOrderByWithRelationInput | TradeLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TradeLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradeLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradeLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TradeLogs
    **/
    _count?: true | TradeLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TradeLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TradeLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TradeLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TradeLogMaxAggregateInputType
  }

  export type GetTradeLogAggregateType<T extends TradeLogAggregateArgs> = {
        [P in keyof T & keyof AggregateTradeLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTradeLog[P]>
      : GetScalarType<T[P], AggregateTradeLog[P]>
  }




  export type TradeLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TradeLogWhereInput
    orderBy?: TradeLogOrderByWithAggregationInput | TradeLogOrderByWithAggregationInput[]
    by: TradeLogScalarFieldEnum[] | TradeLogScalarFieldEnum
    having?: TradeLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TradeLogCountAggregateInputType | true
    _avg?: TradeLogAvgAggregateInputType
    _sum?: TradeLogSumAggregateInputType
    _min?: TradeLogMinAggregateInputType
    _max?: TradeLogMaxAggregateInputType
  }

  export type TradeLogGroupByOutputType = {
    id: number
    timestamp: Date
    kimp: number
    action: string
    amount: number
    result: string
    _count: TradeLogCountAggregateOutputType | null
    _avg: TradeLogAvgAggregateOutputType | null
    _sum: TradeLogSumAggregateOutputType | null
    _min: TradeLogMinAggregateOutputType | null
    _max: TradeLogMaxAggregateOutputType | null
  }

  type GetTradeLogGroupByPayload<T extends TradeLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TradeLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TradeLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TradeLogGroupByOutputType[P]>
            : GetScalarType<T[P], TradeLogGroupByOutputType[P]>
        }
      >
    >


  export type TradeLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    kimp?: boolean
    action?: boolean
    amount?: boolean
    result?: boolean
  }, ExtArgs["result"]["tradeLog"]>

  export type TradeLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    kimp?: boolean
    action?: boolean
    amount?: boolean
    result?: boolean
  }, ExtArgs["result"]["tradeLog"]>

  export type TradeLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    kimp?: boolean
    action?: boolean
    amount?: boolean
    result?: boolean
  }, ExtArgs["result"]["tradeLog"]>

  export type TradeLogSelectScalar = {
    id?: boolean
    timestamp?: boolean
    kimp?: boolean
    action?: boolean
    amount?: boolean
    result?: boolean
  }

  export type TradeLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "timestamp" | "kimp" | "action" | "amount" | "result", ExtArgs["result"]["tradeLog"]>

  export type $TradeLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TradeLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      timestamp: Date
      kimp: number
      action: string
      amount: number
      result: string
    }, ExtArgs["result"]["tradeLog"]>
    composites: {}
  }

  type TradeLogGetPayload<S extends boolean | null | undefined | TradeLogDefaultArgs> = $Result.GetResult<Prisma.$TradeLogPayload, S>

  type TradeLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TradeLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TradeLogCountAggregateInputType | true
    }

  export interface TradeLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TradeLog'], meta: { name: 'TradeLog' } }
    /**
     * Find zero or one TradeLog that matches the filter.
     * @param {TradeLogFindUniqueArgs} args - Arguments to find a TradeLog
     * @example
     * // Get one TradeLog
     * const tradeLog = await prisma.tradeLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TradeLogFindUniqueArgs>(args: SelectSubset<T, TradeLogFindUniqueArgs<ExtArgs>>): Prisma__TradeLogClient<$Result.GetResult<Prisma.$TradeLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TradeLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TradeLogFindUniqueOrThrowArgs} args - Arguments to find a TradeLog
     * @example
     * // Get one TradeLog
     * const tradeLog = await prisma.tradeLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TradeLogFindUniqueOrThrowArgs>(args: SelectSubset<T, TradeLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TradeLogClient<$Result.GetResult<Prisma.$TradeLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TradeLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeLogFindFirstArgs} args - Arguments to find a TradeLog
     * @example
     * // Get one TradeLog
     * const tradeLog = await prisma.tradeLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TradeLogFindFirstArgs>(args?: SelectSubset<T, TradeLogFindFirstArgs<ExtArgs>>): Prisma__TradeLogClient<$Result.GetResult<Prisma.$TradeLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TradeLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeLogFindFirstOrThrowArgs} args - Arguments to find a TradeLog
     * @example
     * // Get one TradeLog
     * const tradeLog = await prisma.tradeLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TradeLogFindFirstOrThrowArgs>(args?: SelectSubset<T, TradeLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__TradeLogClient<$Result.GetResult<Prisma.$TradeLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TradeLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TradeLogs
     * const tradeLogs = await prisma.tradeLog.findMany()
     * 
     * // Get first 10 TradeLogs
     * const tradeLogs = await prisma.tradeLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tradeLogWithIdOnly = await prisma.tradeLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TradeLogFindManyArgs>(args?: SelectSubset<T, TradeLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradeLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TradeLog.
     * @param {TradeLogCreateArgs} args - Arguments to create a TradeLog.
     * @example
     * // Create one TradeLog
     * const TradeLog = await prisma.tradeLog.create({
     *   data: {
     *     // ... data to create a TradeLog
     *   }
     * })
     * 
     */
    create<T extends TradeLogCreateArgs>(args: SelectSubset<T, TradeLogCreateArgs<ExtArgs>>): Prisma__TradeLogClient<$Result.GetResult<Prisma.$TradeLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TradeLogs.
     * @param {TradeLogCreateManyArgs} args - Arguments to create many TradeLogs.
     * @example
     * // Create many TradeLogs
     * const tradeLog = await prisma.tradeLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TradeLogCreateManyArgs>(args?: SelectSubset<T, TradeLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TradeLogs and returns the data saved in the database.
     * @param {TradeLogCreateManyAndReturnArgs} args - Arguments to create many TradeLogs.
     * @example
     * // Create many TradeLogs
     * const tradeLog = await prisma.tradeLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TradeLogs and only return the `id`
     * const tradeLogWithIdOnly = await prisma.tradeLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TradeLogCreateManyAndReturnArgs>(args?: SelectSubset<T, TradeLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradeLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TradeLog.
     * @param {TradeLogDeleteArgs} args - Arguments to delete one TradeLog.
     * @example
     * // Delete one TradeLog
     * const TradeLog = await prisma.tradeLog.delete({
     *   where: {
     *     // ... filter to delete one TradeLog
     *   }
     * })
     * 
     */
    delete<T extends TradeLogDeleteArgs>(args: SelectSubset<T, TradeLogDeleteArgs<ExtArgs>>): Prisma__TradeLogClient<$Result.GetResult<Prisma.$TradeLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TradeLog.
     * @param {TradeLogUpdateArgs} args - Arguments to update one TradeLog.
     * @example
     * // Update one TradeLog
     * const tradeLog = await prisma.tradeLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TradeLogUpdateArgs>(args: SelectSubset<T, TradeLogUpdateArgs<ExtArgs>>): Prisma__TradeLogClient<$Result.GetResult<Prisma.$TradeLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TradeLogs.
     * @param {TradeLogDeleteManyArgs} args - Arguments to filter TradeLogs to delete.
     * @example
     * // Delete a few TradeLogs
     * const { count } = await prisma.tradeLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TradeLogDeleteManyArgs>(args?: SelectSubset<T, TradeLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TradeLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TradeLogs
     * const tradeLog = await prisma.tradeLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TradeLogUpdateManyArgs>(args: SelectSubset<T, TradeLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TradeLogs and returns the data updated in the database.
     * @param {TradeLogUpdateManyAndReturnArgs} args - Arguments to update many TradeLogs.
     * @example
     * // Update many TradeLogs
     * const tradeLog = await prisma.tradeLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TradeLogs and only return the `id`
     * const tradeLogWithIdOnly = await prisma.tradeLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TradeLogUpdateManyAndReturnArgs>(args: SelectSubset<T, TradeLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradeLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TradeLog.
     * @param {TradeLogUpsertArgs} args - Arguments to update or create a TradeLog.
     * @example
     * // Update or create a TradeLog
     * const tradeLog = await prisma.tradeLog.upsert({
     *   create: {
     *     // ... data to create a TradeLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TradeLog we want to update
     *   }
     * })
     */
    upsert<T extends TradeLogUpsertArgs>(args: SelectSubset<T, TradeLogUpsertArgs<ExtArgs>>): Prisma__TradeLogClient<$Result.GetResult<Prisma.$TradeLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TradeLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeLogCountArgs} args - Arguments to filter TradeLogs to count.
     * @example
     * // Count the number of TradeLogs
     * const count = await prisma.tradeLog.count({
     *   where: {
     *     // ... the filter for the TradeLogs we want to count
     *   }
     * })
    **/
    count<T extends TradeLogCountArgs>(
      args?: Subset<T, TradeLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TradeLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TradeLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TradeLogAggregateArgs>(args: Subset<T, TradeLogAggregateArgs>): Prisma.PrismaPromise<GetTradeLogAggregateType<T>>

    /**
     * Group by TradeLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TradeLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TradeLogGroupByArgs['orderBy'] }
        : { orderBy?: TradeLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TradeLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTradeLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TradeLog model
   */
  readonly fields: TradeLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TradeLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TradeLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TradeLog model
   */
  interface TradeLogFieldRefs {
    readonly id: FieldRef<"TradeLog", 'Int'>
    readonly timestamp: FieldRef<"TradeLog", 'DateTime'>
    readonly kimp: FieldRef<"TradeLog", 'Float'>
    readonly action: FieldRef<"TradeLog", 'String'>
    readonly amount: FieldRef<"TradeLog", 'Float'>
    readonly result: FieldRef<"TradeLog", 'String'>
  }
    

  // Custom InputTypes
  /**
   * TradeLog findUnique
   */
  export type TradeLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
    /**
     * Filter, which TradeLog to fetch.
     */
    where: TradeLogWhereUniqueInput
  }

  /**
   * TradeLog findUniqueOrThrow
   */
  export type TradeLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
    /**
     * Filter, which TradeLog to fetch.
     */
    where: TradeLogWhereUniqueInput
  }

  /**
   * TradeLog findFirst
   */
  export type TradeLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
    /**
     * Filter, which TradeLog to fetch.
     */
    where?: TradeLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradeLogs to fetch.
     */
    orderBy?: TradeLogOrderByWithRelationInput | TradeLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TradeLogs.
     */
    cursor?: TradeLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradeLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradeLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TradeLogs.
     */
    distinct?: TradeLogScalarFieldEnum | TradeLogScalarFieldEnum[]
  }

  /**
   * TradeLog findFirstOrThrow
   */
  export type TradeLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
    /**
     * Filter, which TradeLog to fetch.
     */
    where?: TradeLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradeLogs to fetch.
     */
    orderBy?: TradeLogOrderByWithRelationInput | TradeLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TradeLogs.
     */
    cursor?: TradeLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradeLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradeLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TradeLogs.
     */
    distinct?: TradeLogScalarFieldEnum | TradeLogScalarFieldEnum[]
  }

  /**
   * TradeLog findMany
   */
  export type TradeLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
    /**
     * Filter, which TradeLogs to fetch.
     */
    where?: TradeLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradeLogs to fetch.
     */
    orderBy?: TradeLogOrderByWithRelationInput | TradeLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TradeLogs.
     */
    cursor?: TradeLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradeLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradeLogs.
     */
    skip?: number
    distinct?: TradeLogScalarFieldEnum | TradeLogScalarFieldEnum[]
  }

  /**
   * TradeLog create
   */
  export type TradeLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
    /**
     * The data needed to create a TradeLog.
     */
    data: XOR<TradeLogCreateInput, TradeLogUncheckedCreateInput>
  }

  /**
   * TradeLog createMany
   */
  export type TradeLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TradeLogs.
     */
    data: TradeLogCreateManyInput | TradeLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TradeLog createManyAndReturn
   */
  export type TradeLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
    /**
     * The data used to create many TradeLogs.
     */
    data: TradeLogCreateManyInput | TradeLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TradeLog update
   */
  export type TradeLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
    /**
     * The data needed to update a TradeLog.
     */
    data: XOR<TradeLogUpdateInput, TradeLogUncheckedUpdateInput>
    /**
     * Choose, which TradeLog to update.
     */
    where: TradeLogWhereUniqueInput
  }

  /**
   * TradeLog updateMany
   */
  export type TradeLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TradeLogs.
     */
    data: XOR<TradeLogUpdateManyMutationInput, TradeLogUncheckedUpdateManyInput>
    /**
     * Filter which TradeLogs to update
     */
    where?: TradeLogWhereInput
    /**
     * Limit how many TradeLogs to update.
     */
    limit?: number
  }

  /**
   * TradeLog updateManyAndReturn
   */
  export type TradeLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
    /**
     * The data used to update TradeLogs.
     */
    data: XOR<TradeLogUpdateManyMutationInput, TradeLogUncheckedUpdateManyInput>
    /**
     * Filter which TradeLogs to update
     */
    where?: TradeLogWhereInput
    /**
     * Limit how many TradeLogs to update.
     */
    limit?: number
  }

  /**
   * TradeLog upsert
   */
  export type TradeLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
    /**
     * The filter to search for the TradeLog to update in case it exists.
     */
    where: TradeLogWhereUniqueInput
    /**
     * In case the TradeLog found by the `where` argument doesn't exist, create a new TradeLog with this data.
     */
    create: XOR<TradeLogCreateInput, TradeLogUncheckedCreateInput>
    /**
     * In case the TradeLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TradeLogUpdateInput, TradeLogUncheckedUpdateInput>
  }

  /**
   * TradeLog delete
   */
  export type TradeLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
    /**
     * Filter which TradeLog to delete.
     */
    where: TradeLogWhereUniqueInput
  }

  /**
   * TradeLog deleteMany
   */
  export type TradeLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TradeLogs to delete
     */
    where?: TradeLogWhereInput
    /**
     * Limit how many TradeLogs to delete.
     */
    limit?: number
  }

  /**
   * TradeLog without action
   */
  export type TradeLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradeLog
     */
    select?: TradeLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradeLog
     */
    omit?: TradeLogOmit<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    username: string | null
    role: string | null
    isActive: boolean | null
    lastLoginAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    passwordHash: string | null
    email: string | null
    firstName: string | null
    lastName: string | null
    profileImageUrl: string | null
    password: string | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    username: string | null
    role: string | null
    isActive: boolean | null
    lastLoginAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    passwordHash: string | null
    email: string | null
    firstName: string | null
    lastName: string | null
    profileImageUrl: string | null
    password: string | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    username: number
    role: number
    isActive: number
    lastLoginAt: number
    createdAt: number
    updatedAt: number
    passwordHash: number
    email: number
    firstName: number
    lastName: number
    profileImageUrl: number
    password: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    username?: true
    role?: true
    isActive?: true
    lastLoginAt?: true
    createdAt?: true
    updatedAt?: true
    passwordHash?: true
    email?: true
    firstName?: true
    lastName?: true
    profileImageUrl?: true
    password?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    username?: true
    role?: true
    isActive?: true
    lastLoginAt?: true
    createdAt?: true
    updatedAt?: true
    passwordHash?: true
    email?: true
    firstName?: true
    lastName?: true
    profileImageUrl?: true
    password?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    username?: true
    role?: true
    isActive?: true
    lastLoginAt?: true
    createdAt?: true
    updatedAt?: true
    passwordHash?: true
    email?: true
    firstName?: true
    lastName?: true
    profileImageUrl?: true
    password?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    username: string
    role: string
    isActive: boolean
    lastLoginAt: Date | null
    createdAt: Date
    updatedAt: Date
    passwordHash: string | null
    email: string | null
    firstName: string | null
    lastName: string | null
    profileImageUrl: string | null
    password: string
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    role?: boolean
    isActive?: boolean
    lastLoginAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    passwordHash?: boolean
    email?: boolean
    firstName?: boolean
    lastName?: boolean
    profileImageUrl?: boolean
    password?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    role?: boolean
    isActive?: boolean
    lastLoginAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    passwordHash?: boolean
    email?: boolean
    firstName?: boolean
    lastName?: boolean
    profileImageUrl?: boolean
    password?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    role?: boolean
    isActive?: boolean
    lastLoginAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    passwordHash?: boolean
    email?: boolean
    firstName?: boolean
    lastName?: boolean
    profileImageUrl?: boolean
    password?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    username?: boolean
    role?: boolean
    isActive?: boolean
    lastLoginAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    passwordHash?: boolean
    email?: boolean
    firstName?: boolean
    lastName?: boolean
    profileImageUrl?: boolean
    password?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "username" | "role" | "isActive" | "lastLoginAt" | "createdAt" | "updatedAt" | "passwordHash" | "email" | "firstName" | "lastName" | "profileImageUrl" | "password", ExtArgs["result"]["user"]>

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      username: string
      role: string
      isActive: boolean
      lastLoginAt: Date | null
      createdAt: Date
      updatedAt: Date
      passwordHash: string | null
      email: string | null
      firstName: string | null
      lastName: string | null
      profileImageUrl: string | null
      password: string
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly username: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'String'>
    readonly isActive: FieldRef<"User", 'Boolean'>
    readonly lastLoginAt: FieldRef<"User", 'DateTime'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly firstName: FieldRef<"User", 'String'>
    readonly lastName: FieldRef<"User", 'String'>
    readonly profileImageUrl: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
  }


  /**
   * Model Cryptocurrency
   */

  export type AggregateCryptocurrency = {
    _count: CryptocurrencyCountAggregateOutputType | null
    _avg: CryptocurrencyAvgAggregateOutputType | null
    _sum: CryptocurrencySumAggregateOutputType | null
    _min: CryptocurrencyMinAggregateOutputType | null
    _max: CryptocurrencyMaxAggregateOutputType | null
  }

  export type CryptocurrencyAvgAggregateOutputType = {
    id: number | null
    priority: number | null
  }

  export type CryptocurrencySumAggregateOutputType = {
    id: number | null
    priority: number | null
  }

  export type CryptocurrencyMinAggregateOutputType = {
    id: number | null
    symbol: string | null
    name: string | null
    isActive: boolean | null
    createdAt: Date | null
    upbitMarket: string | null
    binanceSymbol: string | null
    priority: number | null
  }

  export type CryptocurrencyMaxAggregateOutputType = {
    id: number | null
    symbol: string | null
    name: string | null
    isActive: boolean | null
    createdAt: Date | null
    upbitMarket: string | null
    binanceSymbol: string | null
    priority: number | null
  }

  export type CryptocurrencyCountAggregateOutputType = {
    id: number
    symbol: number
    name: number
    isActive: number
    createdAt: number
    upbitMarket: number
    binanceSymbol: number
    priority: number
    _all: number
  }


  export type CryptocurrencyAvgAggregateInputType = {
    id?: true
    priority?: true
  }

  export type CryptocurrencySumAggregateInputType = {
    id?: true
    priority?: true
  }

  export type CryptocurrencyMinAggregateInputType = {
    id?: true
    symbol?: true
    name?: true
    isActive?: true
    createdAt?: true
    upbitMarket?: true
    binanceSymbol?: true
    priority?: true
  }

  export type CryptocurrencyMaxAggregateInputType = {
    id?: true
    symbol?: true
    name?: true
    isActive?: true
    createdAt?: true
    upbitMarket?: true
    binanceSymbol?: true
    priority?: true
  }

  export type CryptocurrencyCountAggregateInputType = {
    id?: true
    symbol?: true
    name?: true
    isActive?: true
    createdAt?: true
    upbitMarket?: true
    binanceSymbol?: true
    priority?: true
    _all?: true
  }

  export type CryptocurrencyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Cryptocurrency to aggregate.
     */
    where?: CryptocurrencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cryptocurrencies to fetch.
     */
    orderBy?: CryptocurrencyOrderByWithRelationInput | CryptocurrencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CryptocurrencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cryptocurrencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cryptocurrencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Cryptocurrencies
    **/
    _count?: true | CryptocurrencyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CryptocurrencyAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CryptocurrencySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CryptocurrencyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CryptocurrencyMaxAggregateInputType
  }

  export type GetCryptocurrencyAggregateType<T extends CryptocurrencyAggregateArgs> = {
        [P in keyof T & keyof AggregateCryptocurrency]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCryptocurrency[P]>
      : GetScalarType<T[P], AggregateCryptocurrency[P]>
  }




  export type CryptocurrencyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CryptocurrencyWhereInput
    orderBy?: CryptocurrencyOrderByWithAggregationInput | CryptocurrencyOrderByWithAggregationInput[]
    by: CryptocurrencyScalarFieldEnum[] | CryptocurrencyScalarFieldEnum
    having?: CryptocurrencyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CryptocurrencyCountAggregateInputType | true
    _avg?: CryptocurrencyAvgAggregateInputType
    _sum?: CryptocurrencySumAggregateInputType
    _min?: CryptocurrencyMinAggregateInputType
    _max?: CryptocurrencyMaxAggregateInputType
  }

  export type CryptocurrencyGroupByOutputType = {
    id: number
    symbol: string
    name: string
    isActive: boolean
    createdAt: Date
    upbitMarket: string | null
    binanceSymbol: string | null
    priority: number
    _count: CryptocurrencyCountAggregateOutputType | null
    _avg: CryptocurrencyAvgAggregateOutputType | null
    _sum: CryptocurrencySumAggregateOutputType | null
    _min: CryptocurrencyMinAggregateOutputType | null
    _max: CryptocurrencyMaxAggregateOutputType | null
  }

  type GetCryptocurrencyGroupByPayload<T extends CryptocurrencyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CryptocurrencyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CryptocurrencyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CryptocurrencyGroupByOutputType[P]>
            : GetScalarType<T[P], CryptocurrencyGroupByOutputType[P]>
        }
      >
    >


  export type CryptocurrencySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    symbol?: boolean
    name?: boolean
    isActive?: boolean
    createdAt?: boolean
    upbitMarket?: boolean
    binanceSymbol?: boolean
    priority?: boolean
  }, ExtArgs["result"]["cryptocurrency"]>

  export type CryptocurrencySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    symbol?: boolean
    name?: boolean
    isActive?: boolean
    createdAt?: boolean
    upbitMarket?: boolean
    binanceSymbol?: boolean
    priority?: boolean
  }, ExtArgs["result"]["cryptocurrency"]>

  export type CryptocurrencySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    symbol?: boolean
    name?: boolean
    isActive?: boolean
    createdAt?: boolean
    upbitMarket?: boolean
    binanceSymbol?: boolean
    priority?: boolean
  }, ExtArgs["result"]["cryptocurrency"]>

  export type CryptocurrencySelectScalar = {
    id?: boolean
    symbol?: boolean
    name?: boolean
    isActive?: boolean
    createdAt?: boolean
    upbitMarket?: boolean
    binanceSymbol?: boolean
    priority?: boolean
  }

  export type CryptocurrencyOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "symbol" | "name" | "isActive" | "createdAt" | "upbitMarket" | "binanceSymbol" | "priority", ExtArgs["result"]["cryptocurrency"]>

  export type $CryptocurrencyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Cryptocurrency"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      symbol: string
      name: string
      isActive: boolean
      createdAt: Date
      upbitMarket: string | null
      binanceSymbol: string | null
      priority: number
    }, ExtArgs["result"]["cryptocurrency"]>
    composites: {}
  }

  type CryptocurrencyGetPayload<S extends boolean | null | undefined | CryptocurrencyDefaultArgs> = $Result.GetResult<Prisma.$CryptocurrencyPayload, S>

  type CryptocurrencyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CryptocurrencyFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CryptocurrencyCountAggregateInputType | true
    }

  export interface CryptocurrencyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Cryptocurrency'], meta: { name: 'Cryptocurrency' } }
    /**
     * Find zero or one Cryptocurrency that matches the filter.
     * @param {CryptocurrencyFindUniqueArgs} args - Arguments to find a Cryptocurrency
     * @example
     * // Get one Cryptocurrency
     * const cryptocurrency = await prisma.cryptocurrency.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CryptocurrencyFindUniqueArgs>(args: SelectSubset<T, CryptocurrencyFindUniqueArgs<ExtArgs>>): Prisma__CryptocurrencyClient<$Result.GetResult<Prisma.$CryptocurrencyPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Cryptocurrency that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CryptocurrencyFindUniqueOrThrowArgs} args - Arguments to find a Cryptocurrency
     * @example
     * // Get one Cryptocurrency
     * const cryptocurrency = await prisma.cryptocurrency.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CryptocurrencyFindUniqueOrThrowArgs>(args: SelectSubset<T, CryptocurrencyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CryptocurrencyClient<$Result.GetResult<Prisma.$CryptocurrencyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Cryptocurrency that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CryptocurrencyFindFirstArgs} args - Arguments to find a Cryptocurrency
     * @example
     * // Get one Cryptocurrency
     * const cryptocurrency = await prisma.cryptocurrency.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CryptocurrencyFindFirstArgs>(args?: SelectSubset<T, CryptocurrencyFindFirstArgs<ExtArgs>>): Prisma__CryptocurrencyClient<$Result.GetResult<Prisma.$CryptocurrencyPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Cryptocurrency that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CryptocurrencyFindFirstOrThrowArgs} args - Arguments to find a Cryptocurrency
     * @example
     * // Get one Cryptocurrency
     * const cryptocurrency = await prisma.cryptocurrency.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CryptocurrencyFindFirstOrThrowArgs>(args?: SelectSubset<T, CryptocurrencyFindFirstOrThrowArgs<ExtArgs>>): Prisma__CryptocurrencyClient<$Result.GetResult<Prisma.$CryptocurrencyPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Cryptocurrencies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CryptocurrencyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Cryptocurrencies
     * const cryptocurrencies = await prisma.cryptocurrency.findMany()
     * 
     * // Get first 10 Cryptocurrencies
     * const cryptocurrencies = await prisma.cryptocurrency.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const cryptocurrencyWithIdOnly = await prisma.cryptocurrency.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CryptocurrencyFindManyArgs>(args?: SelectSubset<T, CryptocurrencyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CryptocurrencyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Cryptocurrency.
     * @param {CryptocurrencyCreateArgs} args - Arguments to create a Cryptocurrency.
     * @example
     * // Create one Cryptocurrency
     * const Cryptocurrency = await prisma.cryptocurrency.create({
     *   data: {
     *     // ... data to create a Cryptocurrency
     *   }
     * })
     * 
     */
    create<T extends CryptocurrencyCreateArgs>(args: SelectSubset<T, CryptocurrencyCreateArgs<ExtArgs>>): Prisma__CryptocurrencyClient<$Result.GetResult<Prisma.$CryptocurrencyPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Cryptocurrencies.
     * @param {CryptocurrencyCreateManyArgs} args - Arguments to create many Cryptocurrencies.
     * @example
     * // Create many Cryptocurrencies
     * const cryptocurrency = await prisma.cryptocurrency.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CryptocurrencyCreateManyArgs>(args?: SelectSubset<T, CryptocurrencyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Cryptocurrencies and returns the data saved in the database.
     * @param {CryptocurrencyCreateManyAndReturnArgs} args - Arguments to create many Cryptocurrencies.
     * @example
     * // Create many Cryptocurrencies
     * const cryptocurrency = await prisma.cryptocurrency.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Cryptocurrencies and only return the `id`
     * const cryptocurrencyWithIdOnly = await prisma.cryptocurrency.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CryptocurrencyCreateManyAndReturnArgs>(args?: SelectSubset<T, CryptocurrencyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CryptocurrencyPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Cryptocurrency.
     * @param {CryptocurrencyDeleteArgs} args - Arguments to delete one Cryptocurrency.
     * @example
     * // Delete one Cryptocurrency
     * const Cryptocurrency = await prisma.cryptocurrency.delete({
     *   where: {
     *     // ... filter to delete one Cryptocurrency
     *   }
     * })
     * 
     */
    delete<T extends CryptocurrencyDeleteArgs>(args: SelectSubset<T, CryptocurrencyDeleteArgs<ExtArgs>>): Prisma__CryptocurrencyClient<$Result.GetResult<Prisma.$CryptocurrencyPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Cryptocurrency.
     * @param {CryptocurrencyUpdateArgs} args - Arguments to update one Cryptocurrency.
     * @example
     * // Update one Cryptocurrency
     * const cryptocurrency = await prisma.cryptocurrency.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CryptocurrencyUpdateArgs>(args: SelectSubset<T, CryptocurrencyUpdateArgs<ExtArgs>>): Prisma__CryptocurrencyClient<$Result.GetResult<Prisma.$CryptocurrencyPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Cryptocurrencies.
     * @param {CryptocurrencyDeleteManyArgs} args - Arguments to filter Cryptocurrencies to delete.
     * @example
     * // Delete a few Cryptocurrencies
     * const { count } = await prisma.cryptocurrency.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CryptocurrencyDeleteManyArgs>(args?: SelectSubset<T, CryptocurrencyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Cryptocurrencies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CryptocurrencyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Cryptocurrencies
     * const cryptocurrency = await prisma.cryptocurrency.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CryptocurrencyUpdateManyArgs>(args: SelectSubset<T, CryptocurrencyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Cryptocurrencies and returns the data updated in the database.
     * @param {CryptocurrencyUpdateManyAndReturnArgs} args - Arguments to update many Cryptocurrencies.
     * @example
     * // Update many Cryptocurrencies
     * const cryptocurrency = await prisma.cryptocurrency.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Cryptocurrencies and only return the `id`
     * const cryptocurrencyWithIdOnly = await prisma.cryptocurrency.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CryptocurrencyUpdateManyAndReturnArgs>(args: SelectSubset<T, CryptocurrencyUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CryptocurrencyPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Cryptocurrency.
     * @param {CryptocurrencyUpsertArgs} args - Arguments to update or create a Cryptocurrency.
     * @example
     * // Update or create a Cryptocurrency
     * const cryptocurrency = await prisma.cryptocurrency.upsert({
     *   create: {
     *     // ... data to create a Cryptocurrency
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Cryptocurrency we want to update
     *   }
     * })
     */
    upsert<T extends CryptocurrencyUpsertArgs>(args: SelectSubset<T, CryptocurrencyUpsertArgs<ExtArgs>>): Prisma__CryptocurrencyClient<$Result.GetResult<Prisma.$CryptocurrencyPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Cryptocurrencies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CryptocurrencyCountArgs} args - Arguments to filter Cryptocurrencies to count.
     * @example
     * // Count the number of Cryptocurrencies
     * const count = await prisma.cryptocurrency.count({
     *   where: {
     *     // ... the filter for the Cryptocurrencies we want to count
     *   }
     * })
    **/
    count<T extends CryptocurrencyCountArgs>(
      args?: Subset<T, CryptocurrencyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CryptocurrencyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Cryptocurrency.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CryptocurrencyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CryptocurrencyAggregateArgs>(args: Subset<T, CryptocurrencyAggregateArgs>): Prisma.PrismaPromise<GetCryptocurrencyAggregateType<T>>

    /**
     * Group by Cryptocurrency.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CryptocurrencyGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CryptocurrencyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CryptocurrencyGroupByArgs['orderBy'] }
        : { orderBy?: CryptocurrencyGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CryptocurrencyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCryptocurrencyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Cryptocurrency model
   */
  readonly fields: CryptocurrencyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Cryptocurrency.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CryptocurrencyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Cryptocurrency model
   */
  interface CryptocurrencyFieldRefs {
    readonly id: FieldRef<"Cryptocurrency", 'Int'>
    readonly symbol: FieldRef<"Cryptocurrency", 'String'>
    readonly name: FieldRef<"Cryptocurrency", 'String'>
    readonly isActive: FieldRef<"Cryptocurrency", 'Boolean'>
    readonly createdAt: FieldRef<"Cryptocurrency", 'DateTime'>
    readonly upbitMarket: FieldRef<"Cryptocurrency", 'String'>
    readonly binanceSymbol: FieldRef<"Cryptocurrency", 'String'>
    readonly priority: FieldRef<"Cryptocurrency", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Cryptocurrency findUnique
   */
  export type CryptocurrencyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
    /**
     * Filter, which Cryptocurrency to fetch.
     */
    where: CryptocurrencyWhereUniqueInput
  }

  /**
   * Cryptocurrency findUniqueOrThrow
   */
  export type CryptocurrencyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
    /**
     * Filter, which Cryptocurrency to fetch.
     */
    where: CryptocurrencyWhereUniqueInput
  }

  /**
   * Cryptocurrency findFirst
   */
  export type CryptocurrencyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
    /**
     * Filter, which Cryptocurrency to fetch.
     */
    where?: CryptocurrencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cryptocurrencies to fetch.
     */
    orderBy?: CryptocurrencyOrderByWithRelationInput | CryptocurrencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Cryptocurrencies.
     */
    cursor?: CryptocurrencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cryptocurrencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cryptocurrencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Cryptocurrencies.
     */
    distinct?: CryptocurrencyScalarFieldEnum | CryptocurrencyScalarFieldEnum[]
  }

  /**
   * Cryptocurrency findFirstOrThrow
   */
  export type CryptocurrencyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
    /**
     * Filter, which Cryptocurrency to fetch.
     */
    where?: CryptocurrencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cryptocurrencies to fetch.
     */
    orderBy?: CryptocurrencyOrderByWithRelationInput | CryptocurrencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Cryptocurrencies.
     */
    cursor?: CryptocurrencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cryptocurrencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cryptocurrencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Cryptocurrencies.
     */
    distinct?: CryptocurrencyScalarFieldEnum | CryptocurrencyScalarFieldEnum[]
  }

  /**
   * Cryptocurrency findMany
   */
  export type CryptocurrencyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
    /**
     * Filter, which Cryptocurrencies to fetch.
     */
    where?: CryptocurrencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Cryptocurrencies to fetch.
     */
    orderBy?: CryptocurrencyOrderByWithRelationInput | CryptocurrencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Cryptocurrencies.
     */
    cursor?: CryptocurrencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Cryptocurrencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Cryptocurrencies.
     */
    skip?: number
    distinct?: CryptocurrencyScalarFieldEnum | CryptocurrencyScalarFieldEnum[]
  }

  /**
   * Cryptocurrency create
   */
  export type CryptocurrencyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
    /**
     * The data needed to create a Cryptocurrency.
     */
    data: XOR<CryptocurrencyCreateInput, CryptocurrencyUncheckedCreateInput>
  }

  /**
   * Cryptocurrency createMany
   */
  export type CryptocurrencyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Cryptocurrencies.
     */
    data: CryptocurrencyCreateManyInput | CryptocurrencyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Cryptocurrency createManyAndReturn
   */
  export type CryptocurrencyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
    /**
     * The data used to create many Cryptocurrencies.
     */
    data: CryptocurrencyCreateManyInput | CryptocurrencyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Cryptocurrency update
   */
  export type CryptocurrencyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
    /**
     * The data needed to update a Cryptocurrency.
     */
    data: XOR<CryptocurrencyUpdateInput, CryptocurrencyUncheckedUpdateInput>
    /**
     * Choose, which Cryptocurrency to update.
     */
    where: CryptocurrencyWhereUniqueInput
  }

  /**
   * Cryptocurrency updateMany
   */
  export type CryptocurrencyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Cryptocurrencies.
     */
    data: XOR<CryptocurrencyUpdateManyMutationInput, CryptocurrencyUncheckedUpdateManyInput>
    /**
     * Filter which Cryptocurrencies to update
     */
    where?: CryptocurrencyWhereInput
    /**
     * Limit how many Cryptocurrencies to update.
     */
    limit?: number
  }

  /**
   * Cryptocurrency updateManyAndReturn
   */
  export type CryptocurrencyUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
    /**
     * The data used to update Cryptocurrencies.
     */
    data: XOR<CryptocurrencyUpdateManyMutationInput, CryptocurrencyUncheckedUpdateManyInput>
    /**
     * Filter which Cryptocurrencies to update
     */
    where?: CryptocurrencyWhereInput
    /**
     * Limit how many Cryptocurrencies to update.
     */
    limit?: number
  }

  /**
   * Cryptocurrency upsert
   */
  export type CryptocurrencyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
    /**
     * The filter to search for the Cryptocurrency to update in case it exists.
     */
    where: CryptocurrencyWhereUniqueInput
    /**
     * In case the Cryptocurrency found by the `where` argument doesn't exist, create a new Cryptocurrency with this data.
     */
    create: XOR<CryptocurrencyCreateInput, CryptocurrencyUncheckedCreateInput>
    /**
     * In case the Cryptocurrency was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CryptocurrencyUpdateInput, CryptocurrencyUncheckedUpdateInput>
  }

  /**
   * Cryptocurrency delete
   */
  export type CryptocurrencyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
    /**
     * Filter which Cryptocurrency to delete.
     */
    where: CryptocurrencyWhereUniqueInput
  }

  /**
   * Cryptocurrency deleteMany
   */
  export type CryptocurrencyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Cryptocurrencies to delete
     */
    where?: CryptocurrencyWhereInput
    /**
     * Limit how many Cryptocurrencies to delete.
     */
    limit?: number
  }

  /**
   * Cryptocurrency without action
   */
  export type CryptocurrencyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cryptocurrency
     */
    select?: CryptocurrencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cryptocurrency
     */
    omit?: CryptocurrencyOmit<ExtArgs> | null
  }


  /**
   * Model Exchange
   */

  export type AggregateExchange = {
    _count: ExchangeCountAggregateOutputType | null
    _avg: ExchangeAvgAggregateOutputType | null
    _sum: ExchangeSumAggregateOutputType | null
    _min: ExchangeMinAggregateOutputType | null
    _max: ExchangeMaxAggregateOutputType | null
  }

  export type ExchangeAvgAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type ExchangeSumAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type ExchangeMinAggregateOutputType = {
    id: number | null
    apiKey: string | null
    isActive: boolean | null
    userId: number | null
    exchange: string | null
    apiSecret: string | null
    passphrase: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ExchangeMaxAggregateOutputType = {
    id: number | null
    apiKey: string | null
    isActive: boolean | null
    userId: number | null
    exchange: string | null
    apiSecret: string | null
    passphrase: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ExchangeCountAggregateOutputType = {
    id: number
    apiKey: number
    isActive: number
    userId: number
    exchange: number
    apiSecret: number
    passphrase: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ExchangeAvgAggregateInputType = {
    id?: true
    userId?: true
  }

  export type ExchangeSumAggregateInputType = {
    id?: true
    userId?: true
  }

  export type ExchangeMinAggregateInputType = {
    id?: true
    apiKey?: true
    isActive?: true
    userId?: true
    exchange?: true
    apiSecret?: true
    passphrase?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ExchangeMaxAggregateInputType = {
    id?: true
    apiKey?: true
    isActive?: true
    userId?: true
    exchange?: true
    apiSecret?: true
    passphrase?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ExchangeCountAggregateInputType = {
    id?: true
    apiKey?: true
    isActive?: true
    userId?: true
    exchange?: true
    apiSecret?: true
    passphrase?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ExchangeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Exchange to aggregate.
     */
    where?: ExchangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Exchanges to fetch.
     */
    orderBy?: ExchangeOrderByWithRelationInput | ExchangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ExchangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Exchanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Exchanges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Exchanges
    **/
    _count?: true | ExchangeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ExchangeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ExchangeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ExchangeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ExchangeMaxAggregateInputType
  }

  export type GetExchangeAggregateType<T extends ExchangeAggregateArgs> = {
        [P in keyof T & keyof AggregateExchange]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateExchange[P]>
      : GetScalarType<T[P], AggregateExchange[P]>
  }




  export type ExchangeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ExchangeWhereInput
    orderBy?: ExchangeOrderByWithAggregationInput | ExchangeOrderByWithAggregationInput[]
    by: ExchangeScalarFieldEnum[] | ExchangeScalarFieldEnum
    having?: ExchangeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ExchangeCountAggregateInputType | true
    _avg?: ExchangeAvgAggregateInputType
    _sum?: ExchangeSumAggregateInputType
    _min?: ExchangeMinAggregateInputType
    _max?: ExchangeMaxAggregateInputType
  }

  export type ExchangeGroupByOutputType = {
    id: number
    apiKey: string
    isActive: boolean
    userId: number
    exchange: string
    apiSecret: string
    passphrase: string | null
    createdAt: Date
    updatedAt: Date
    _count: ExchangeCountAggregateOutputType | null
    _avg: ExchangeAvgAggregateOutputType | null
    _sum: ExchangeSumAggregateOutputType | null
    _min: ExchangeMinAggregateOutputType | null
    _max: ExchangeMaxAggregateOutputType | null
  }

  type GetExchangeGroupByPayload<T extends ExchangeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ExchangeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ExchangeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ExchangeGroupByOutputType[P]>
            : GetScalarType<T[P], ExchangeGroupByOutputType[P]>
        }
      >
    >


  export type ExchangeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    apiKey?: boolean
    isActive?: boolean
    userId?: boolean
    exchange?: boolean
    apiSecret?: boolean
    passphrase?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["exchange"]>

  export type ExchangeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    apiKey?: boolean
    isActive?: boolean
    userId?: boolean
    exchange?: boolean
    apiSecret?: boolean
    passphrase?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["exchange"]>

  export type ExchangeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    apiKey?: boolean
    isActive?: boolean
    userId?: boolean
    exchange?: boolean
    apiSecret?: boolean
    passphrase?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["exchange"]>

  export type ExchangeSelectScalar = {
    id?: boolean
    apiKey?: boolean
    isActive?: boolean
    userId?: boolean
    exchange?: boolean
    apiSecret?: boolean
    passphrase?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ExchangeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "apiKey" | "isActive" | "userId" | "exchange" | "apiSecret" | "passphrase" | "createdAt" | "updatedAt", ExtArgs["result"]["exchange"]>

  export type $ExchangePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Exchange"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      apiKey: string
      isActive: boolean
      userId: number
      exchange: string
      apiSecret: string
      passphrase: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["exchange"]>
    composites: {}
  }

  type ExchangeGetPayload<S extends boolean | null | undefined | ExchangeDefaultArgs> = $Result.GetResult<Prisma.$ExchangePayload, S>

  type ExchangeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ExchangeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ExchangeCountAggregateInputType | true
    }

  export interface ExchangeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Exchange'], meta: { name: 'Exchange' } }
    /**
     * Find zero or one Exchange that matches the filter.
     * @param {ExchangeFindUniqueArgs} args - Arguments to find a Exchange
     * @example
     * // Get one Exchange
     * const exchange = await prisma.exchange.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ExchangeFindUniqueArgs>(args: SelectSubset<T, ExchangeFindUniqueArgs<ExtArgs>>): Prisma__ExchangeClient<$Result.GetResult<Prisma.$ExchangePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Exchange that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ExchangeFindUniqueOrThrowArgs} args - Arguments to find a Exchange
     * @example
     * // Get one Exchange
     * const exchange = await prisma.exchange.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ExchangeFindUniqueOrThrowArgs>(args: SelectSubset<T, ExchangeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ExchangeClient<$Result.GetResult<Prisma.$ExchangePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Exchange that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeFindFirstArgs} args - Arguments to find a Exchange
     * @example
     * // Get one Exchange
     * const exchange = await prisma.exchange.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ExchangeFindFirstArgs>(args?: SelectSubset<T, ExchangeFindFirstArgs<ExtArgs>>): Prisma__ExchangeClient<$Result.GetResult<Prisma.$ExchangePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Exchange that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeFindFirstOrThrowArgs} args - Arguments to find a Exchange
     * @example
     * // Get one Exchange
     * const exchange = await prisma.exchange.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ExchangeFindFirstOrThrowArgs>(args?: SelectSubset<T, ExchangeFindFirstOrThrowArgs<ExtArgs>>): Prisma__ExchangeClient<$Result.GetResult<Prisma.$ExchangePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Exchanges that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Exchanges
     * const exchanges = await prisma.exchange.findMany()
     * 
     * // Get first 10 Exchanges
     * const exchanges = await prisma.exchange.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const exchangeWithIdOnly = await prisma.exchange.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ExchangeFindManyArgs>(args?: SelectSubset<T, ExchangeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExchangePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Exchange.
     * @param {ExchangeCreateArgs} args - Arguments to create a Exchange.
     * @example
     * // Create one Exchange
     * const Exchange = await prisma.exchange.create({
     *   data: {
     *     // ... data to create a Exchange
     *   }
     * })
     * 
     */
    create<T extends ExchangeCreateArgs>(args: SelectSubset<T, ExchangeCreateArgs<ExtArgs>>): Prisma__ExchangeClient<$Result.GetResult<Prisma.$ExchangePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Exchanges.
     * @param {ExchangeCreateManyArgs} args - Arguments to create many Exchanges.
     * @example
     * // Create many Exchanges
     * const exchange = await prisma.exchange.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ExchangeCreateManyArgs>(args?: SelectSubset<T, ExchangeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Exchanges and returns the data saved in the database.
     * @param {ExchangeCreateManyAndReturnArgs} args - Arguments to create many Exchanges.
     * @example
     * // Create many Exchanges
     * const exchange = await prisma.exchange.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Exchanges and only return the `id`
     * const exchangeWithIdOnly = await prisma.exchange.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ExchangeCreateManyAndReturnArgs>(args?: SelectSubset<T, ExchangeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExchangePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Exchange.
     * @param {ExchangeDeleteArgs} args - Arguments to delete one Exchange.
     * @example
     * // Delete one Exchange
     * const Exchange = await prisma.exchange.delete({
     *   where: {
     *     // ... filter to delete one Exchange
     *   }
     * })
     * 
     */
    delete<T extends ExchangeDeleteArgs>(args: SelectSubset<T, ExchangeDeleteArgs<ExtArgs>>): Prisma__ExchangeClient<$Result.GetResult<Prisma.$ExchangePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Exchange.
     * @param {ExchangeUpdateArgs} args - Arguments to update one Exchange.
     * @example
     * // Update one Exchange
     * const exchange = await prisma.exchange.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ExchangeUpdateArgs>(args: SelectSubset<T, ExchangeUpdateArgs<ExtArgs>>): Prisma__ExchangeClient<$Result.GetResult<Prisma.$ExchangePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Exchanges.
     * @param {ExchangeDeleteManyArgs} args - Arguments to filter Exchanges to delete.
     * @example
     * // Delete a few Exchanges
     * const { count } = await prisma.exchange.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ExchangeDeleteManyArgs>(args?: SelectSubset<T, ExchangeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Exchanges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Exchanges
     * const exchange = await prisma.exchange.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ExchangeUpdateManyArgs>(args: SelectSubset<T, ExchangeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Exchanges and returns the data updated in the database.
     * @param {ExchangeUpdateManyAndReturnArgs} args - Arguments to update many Exchanges.
     * @example
     * // Update many Exchanges
     * const exchange = await prisma.exchange.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Exchanges and only return the `id`
     * const exchangeWithIdOnly = await prisma.exchange.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ExchangeUpdateManyAndReturnArgs>(args: SelectSubset<T, ExchangeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ExchangePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Exchange.
     * @param {ExchangeUpsertArgs} args - Arguments to update or create a Exchange.
     * @example
     * // Update or create a Exchange
     * const exchange = await prisma.exchange.upsert({
     *   create: {
     *     // ... data to create a Exchange
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Exchange we want to update
     *   }
     * })
     */
    upsert<T extends ExchangeUpsertArgs>(args: SelectSubset<T, ExchangeUpsertArgs<ExtArgs>>): Prisma__ExchangeClient<$Result.GetResult<Prisma.$ExchangePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Exchanges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeCountArgs} args - Arguments to filter Exchanges to count.
     * @example
     * // Count the number of Exchanges
     * const count = await prisma.exchange.count({
     *   where: {
     *     // ... the filter for the Exchanges we want to count
     *   }
     * })
    **/
    count<T extends ExchangeCountArgs>(
      args?: Subset<T, ExchangeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ExchangeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Exchange.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ExchangeAggregateArgs>(args: Subset<T, ExchangeAggregateArgs>): Prisma.PrismaPromise<GetExchangeAggregateType<T>>

    /**
     * Group by Exchange.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExchangeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ExchangeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ExchangeGroupByArgs['orderBy'] }
        : { orderBy?: ExchangeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ExchangeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetExchangeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Exchange model
   */
  readonly fields: ExchangeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Exchange.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ExchangeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Exchange model
   */
  interface ExchangeFieldRefs {
    readonly id: FieldRef<"Exchange", 'Int'>
    readonly apiKey: FieldRef<"Exchange", 'String'>
    readonly isActive: FieldRef<"Exchange", 'Boolean'>
    readonly userId: FieldRef<"Exchange", 'Int'>
    readonly exchange: FieldRef<"Exchange", 'String'>
    readonly apiSecret: FieldRef<"Exchange", 'String'>
    readonly passphrase: FieldRef<"Exchange", 'String'>
    readonly createdAt: FieldRef<"Exchange", 'DateTime'>
    readonly updatedAt: FieldRef<"Exchange", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Exchange findUnique
   */
  export type ExchangeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
    /**
     * Filter, which Exchange to fetch.
     */
    where: ExchangeWhereUniqueInput
  }

  /**
   * Exchange findUniqueOrThrow
   */
  export type ExchangeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
    /**
     * Filter, which Exchange to fetch.
     */
    where: ExchangeWhereUniqueInput
  }

  /**
   * Exchange findFirst
   */
  export type ExchangeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
    /**
     * Filter, which Exchange to fetch.
     */
    where?: ExchangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Exchanges to fetch.
     */
    orderBy?: ExchangeOrderByWithRelationInput | ExchangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Exchanges.
     */
    cursor?: ExchangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Exchanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Exchanges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Exchanges.
     */
    distinct?: ExchangeScalarFieldEnum | ExchangeScalarFieldEnum[]
  }

  /**
   * Exchange findFirstOrThrow
   */
  export type ExchangeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
    /**
     * Filter, which Exchange to fetch.
     */
    where?: ExchangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Exchanges to fetch.
     */
    orderBy?: ExchangeOrderByWithRelationInput | ExchangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Exchanges.
     */
    cursor?: ExchangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Exchanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Exchanges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Exchanges.
     */
    distinct?: ExchangeScalarFieldEnum | ExchangeScalarFieldEnum[]
  }

  /**
   * Exchange findMany
   */
  export type ExchangeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
    /**
     * Filter, which Exchanges to fetch.
     */
    where?: ExchangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Exchanges to fetch.
     */
    orderBy?: ExchangeOrderByWithRelationInput | ExchangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Exchanges.
     */
    cursor?: ExchangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Exchanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Exchanges.
     */
    skip?: number
    distinct?: ExchangeScalarFieldEnum | ExchangeScalarFieldEnum[]
  }

  /**
   * Exchange create
   */
  export type ExchangeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
    /**
     * The data needed to create a Exchange.
     */
    data: XOR<ExchangeCreateInput, ExchangeUncheckedCreateInput>
  }

  /**
   * Exchange createMany
   */
  export type ExchangeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Exchanges.
     */
    data: ExchangeCreateManyInput | ExchangeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Exchange createManyAndReturn
   */
  export type ExchangeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
    /**
     * The data used to create many Exchanges.
     */
    data: ExchangeCreateManyInput | ExchangeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Exchange update
   */
  export type ExchangeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
    /**
     * The data needed to update a Exchange.
     */
    data: XOR<ExchangeUpdateInput, ExchangeUncheckedUpdateInput>
    /**
     * Choose, which Exchange to update.
     */
    where: ExchangeWhereUniqueInput
  }

  /**
   * Exchange updateMany
   */
  export type ExchangeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Exchanges.
     */
    data: XOR<ExchangeUpdateManyMutationInput, ExchangeUncheckedUpdateManyInput>
    /**
     * Filter which Exchanges to update
     */
    where?: ExchangeWhereInput
    /**
     * Limit how many Exchanges to update.
     */
    limit?: number
  }

  /**
   * Exchange updateManyAndReturn
   */
  export type ExchangeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
    /**
     * The data used to update Exchanges.
     */
    data: XOR<ExchangeUpdateManyMutationInput, ExchangeUncheckedUpdateManyInput>
    /**
     * Filter which Exchanges to update
     */
    where?: ExchangeWhereInput
    /**
     * Limit how many Exchanges to update.
     */
    limit?: number
  }

  /**
   * Exchange upsert
   */
  export type ExchangeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
    /**
     * The filter to search for the Exchange to update in case it exists.
     */
    where: ExchangeWhereUniqueInput
    /**
     * In case the Exchange found by the `where` argument doesn't exist, create a new Exchange with this data.
     */
    create: XOR<ExchangeCreateInput, ExchangeUncheckedCreateInput>
    /**
     * In case the Exchange was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ExchangeUpdateInput, ExchangeUncheckedUpdateInput>
  }

  /**
   * Exchange delete
   */
  export type ExchangeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
    /**
     * Filter which Exchange to delete.
     */
    where: ExchangeWhereUniqueInput
  }

  /**
   * Exchange deleteMany
   */
  export type ExchangeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Exchanges to delete
     */
    where?: ExchangeWhereInput
    /**
     * Limit how many Exchanges to delete.
     */
    limit?: number
  }

  /**
   * Exchange without action
   */
  export type ExchangeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Exchange
     */
    select?: ExchangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Exchange
     */
    omit?: ExchangeOmit<ExtArgs> | null
  }


  /**
   * Model KimchiPremium
   */

  export type AggregateKimchiPremium = {
    _count: KimchiPremiumCountAggregateOutputType | null
    _avg: KimchiPremiumAvgAggregateOutputType | null
    _sum: KimchiPremiumSumAggregateOutputType | null
    _min: KimchiPremiumMinAggregateOutputType | null
    _max: KimchiPremiumMaxAggregateOutputType | null
  }

  export type KimchiPremiumAvgAggregateOutputType = {
    id: number | null
    upbitPrice: Decimal | null
    binancePrice: Decimal | null
    premiumRate: Decimal | null
    exchangeRate: Decimal | null
    premiumAmount: Decimal | null
  }

  export type KimchiPremiumSumAggregateOutputType = {
    id: number | null
    upbitPrice: Decimal | null
    binancePrice: Decimal | null
    premiumRate: Decimal | null
    exchangeRate: Decimal | null
    premiumAmount: Decimal | null
  }

  export type KimchiPremiumMinAggregateOutputType = {
    id: number | null
    symbol: string | null
    upbitPrice: Decimal | null
    binancePrice: Decimal | null
    premiumRate: Decimal | null
    timestamp: Date | null
    exchangeRate: Decimal | null
    premiumAmount: Decimal | null
  }

  export type KimchiPremiumMaxAggregateOutputType = {
    id: number | null
    symbol: string | null
    upbitPrice: Decimal | null
    binancePrice: Decimal | null
    premiumRate: Decimal | null
    timestamp: Date | null
    exchangeRate: Decimal | null
    premiumAmount: Decimal | null
  }

  export type KimchiPremiumCountAggregateOutputType = {
    id: number
    symbol: number
    upbitPrice: number
    binancePrice: number
    premiumRate: number
    timestamp: number
    exchangeRate: number
    premiumAmount: number
    _all: number
  }


  export type KimchiPremiumAvgAggregateInputType = {
    id?: true
    upbitPrice?: true
    binancePrice?: true
    premiumRate?: true
    exchangeRate?: true
    premiumAmount?: true
  }

  export type KimchiPremiumSumAggregateInputType = {
    id?: true
    upbitPrice?: true
    binancePrice?: true
    premiumRate?: true
    exchangeRate?: true
    premiumAmount?: true
  }

  export type KimchiPremiumMinAggregateInputType = {
    id?: true
    symbol?: true
    upbitPrice?: true
    binancePrice?: true
    premiumRate?: true
    timestamp?: true
    exchangeRate?: true
    premiumAmount?: true
  }

  export type KimchiPremiumMaxAggregateInputType = {
    id?: true
    symbol?: true
    upbitPrice?: true
    binancePrice?: true
    premiumRate?: true
    timestamp?: true
    exchangeRate?: true
    premiumAmount?: true
  }

  export type KimchiPremiumCountAggregateInputType = {
    id?: true
    symbol?: true
    upbitPrice?: true
    binancePrice?: true
    premiumRate?: true
    timestamp?: true
    exchangeRate?: true
    premiumAmount?: true
    _all?: true
  }

  export type KimchiPremiumAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KimchiPremium to aggregate.
     */
    where?: KimchiPremiumWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KimchiPremiums to fetch.
     */
    orderBy?: KimchiPremiumOrderByWithRelationInput | KimchiPremiumOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: KimchiPremiumWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KimchiPremiums from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KimchiPremiums.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned KimchiPremiums
    **/
    _count?: true | KimchiPremiumCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: KimchiPremiumAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: KimchiPremiumSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: KimchiPremiumMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: KimchiPremiumMaxAggregateInputType
  }

  export type GetKimchiPremiumAggregateType<T extends KimchiPremiumAggregateArgs> = {
        [P in keyof T & keyof AggregateKimchiPremium]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateKimchiPremium[P]>
      : GetScalarType<T[P], AggregateKimchiPremium[P]>
  }




  export type KimchiPremiumGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: KimchiPremiumWhereInput
    orderBy?: KimchiPremiumOrderByWithAggregationInput | KimchiPremiumOrderByWithAggregationInput[]
    by: KimchiPremiumScalarFieldEnum[] | KimchiPremiumScalarFieldEnum
    having?: KimchiPremiumScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: KimchiPremiumCountAggregateInputType | true
    _avg?: KimchiPremiumAvgAggregateInputType
    _sum?: KimchiPremiumSumAggregateInputType
    _min?: KimchiPremiumMinAggregateInputType
    _max?: KimchiPremiumMaxAggregateInputType
  }

  export type KimchiPremiumGroupByOutputType = {
    id: number
    symbol: string
    upbitPrice: Decimal
    binancePrice: Decimal
    premiumRate: Decimal
    timestamp: Date
    exchangeRate: Decimal
    premiumAmount: Decimal
    _count: KimchiPremiumCountAggregateOutputType | null
    _avg: KimchiPremiumAvgAggregateOutputType | null
    _sum: KimchiPremiumSumAggregateOutputType | null
    _min: KimchiPremiumMinAggregateOutputType | null
    _max: KimchiPremiumMaxAggregateOutputType | null
  }

  type GetKimchiPremiumGroupByPayload<T extends KimchiPremiumGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<KimchiPremiumGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof KimchiPremiumGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], KimchiPremiumGroupByOutputType[P]>
            : GetScalarType<T[P], KimchiPremiumGroupByOutputType[P]>
        }
      >
    >


  export type KimchiPremiumSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    symbol?: boolean
    upbitPrice?: boolean
    binancePrice?: boolean
    premiumRate?: boolean
    timestamp?: boolean
    exchangeRate?: boolean
    premiumAmount?: boolean
  }, ExtArgs["result"]["kimchiPremium"]>

  export type KimchiPremiumSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    symbol?: boolean
    upbitPrice?: boolean
    binancePrice?: boolean
    premiumRate?: boolean
    timestamp?: boolean
    exchangeRate?: boolean
    premiumAmount?: boolean
  }, ExtArgs["result"]["kimchiPremium"]>

  export type KimchiPremiumSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    symbol?: boolean
    upbitPrice?: boolean
    binancePrice?: boolean
    premiumRate?: boolean
    timestamp?: boolean
    exchangeRate?: boolean
    premiumAmount?: boolean
  }, ExtArgs["result"]["kimchiPremium"]>

  export type KimchiPremiumSelectScalar = {
    id?: boolean
    symbol?: boolean
    upbitPrice?: boolean
    binancePrice?: boolean
    premiumRate?: boolean
    timestamp?: boolean
    exchangeRate?: boolean
    premiumAmount?: boolean
  }

  export type KimchiPremiumOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "symbol" | "upbitPrice" | "binancePrice" | "premiumRate" | "timestamp" | "exchangeRate" | "premiumAmount", ExtArgs["result"]["kimchiPremium"]>

  export type $KimchiPremiumPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "KimchiPremium"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      symbol: string
      upbitPrice: Prisma.Decimal
      binancePrice: Prisma.Decimal
      premiumRate: Prisma.Decimal
      timestamp: Date
      exchangeRate: Prisma.Decimal
      premiumAmount: Prisma.Decimal
    }, ExtArgs["result"]["kimchiPremium"]>
    composites: {}
  }

  type KimchiPremiumGetPayload<S extends boolean | null | undefined | KimchiPremiumDefaultArgs> = $Result.GetResult<Prisma.$KimchiPremiumPayload, S>

  type KimchiPremiumCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<KimchiPremiumFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: KimchiPremiumCountAggregateInputType | true
    }

  export interface KimchiPremiumDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['KimchiPremium'], meta: { name: 'KimchiPremium' } }
    /**
     * Find zero or one KimchiPremium that matches the filter.
     * @param {KimchiPremiumFindUniqueArgs} args - Arguments to find a KimchiPremium
     * @example
     * // Get one KimchiPremium
     * const kimchiPremium = await prisma.kimchiPremium.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends KimchiPremiumFindUniqueArgs>(args: SelectSubset<T, KimchiPremiumFindUniqueArgs<ExtArgs>>): Prisma__KimchiPremiumClient<$Result.GetResult<Prisma.$KimchiPremiumPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one KimchiPremium that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {KimchiPremiumFindUniqueOrThrowArgs} args - Arguments to find a KimchiPremium
     * @example
     * // Get one KimchiPremium
     * const kimchiPremium = await prisma.kimchiPremium.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends KimchiPremiumFindUniqueOrThrowArgs>(args: SelectSubset<T, KimchiPremiumFindUniqueOrThrowArgs<ExtArgs>>): Prisma__KimchiPremiumClient<$Result.GetResult<Prisma.$KimchiPremiumPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KimchiPremium that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KimchiPremiumFindFirstArgs} args - Arguments to find a KimchiPremium
     * @example
     * // Get one KimchiPremium
     * const kimchiPremium = await prisma.kimchiPremium.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends KimchiPremiumFindFirstArgs>(args?: SelectSubset<T, KimchiPremiumFindFirstArgs<ExtArgs>>): Prisma__KimchiPremiumClient<$Result.GetResult<Prisma.$KimchiPremiumPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first KimchiPremium that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KimchiPremiumFindFirstOrThrowArgs} args - Arguments to find a KimchiPremium
     * @example
     * // Get one KimchiPremium
     * const kimchiPremium = await prisma.kimchiPremium.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends KimchiPremiumFindFirstOrThrowArgs>(args?: SelectSubset<T, KimchiPremiumFindFirstOrThrowArgs<ExtArgs>>): Prisma__KimchiPremiumClient<$Result.GetResult<Prisma.$KimchiPremiumPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more KimchiPremiums that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KimchiPremiumFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all KimchiPremiums
     * const kimchiPremiums = await prisma.kimchiPremium.findMany()
     * 
     * // Get first 10 KimchiPremiums
     * const kimchiPremiums = await prisma.kimchiPremium.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const kimchiPremiumWithIdOnly = await prisma.kimchiPremium.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends KimchiPremiumFindManyArgs>(args?: SelectSubset<T, KimchiPremiumFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KimchiPremiumPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a KimchiPremium.
     * @param {KimchiPremiumCreateArgs} args - Arguments to create a KimchiPremium.
     * @example
     * // Create one KimchiPremium
     * const KimchiPremium = await prisma.kimchiPremium.create({
     *   data: {
     *     // ... data to create a KimchiPremium
     *   }
     * })
     * 
     */
    create<T extends KimchiPremiumCreateArgs>(args: SelectSubset<T, KimchiPremiumCreateArgs<ExtArgs>>): Prisma__KimchiPremiumClient<$Result.GetResult<Prisma.$KimchiPremiumPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many KimchiPremiums.
     * @param {KimchiPremiumCreateManyArgs} args - Arguments to create many KimchiPremiums.
     * @example
     * // Create many KimchiPremiums
     * const kimchiPremium = await prisma.kimchiPremium.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends KimchiPremiumCreateManyArgs>(args?: SelectSubset<T, KimchiPremiumCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many KimchiPremiums and returns the data saved in the database.
     * @param {KimchiPremiumCreateManyAndReturnArgs} args - Arguments to create many KimchiPremiums.
     * @example
     * // Create many KimchiPremiums
     * const kimchiPremium = await prisma.kimchiPremium.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many KimchiPremiums and only return the `id`
     * const kimchiPremiumWithIdOnly = await prisma.kimchiPremium.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends KimchiPremiumCreateManyAndReturnArgs>(args?: SelectSubset<T, KimchiPremiumCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KimchiPremiumPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a KimchiPremium.
     * @param {KimchiPremiumDeleteArgs} args - Arguments to delete one KimchiPremium.
     * @example
     * // Delete one KimchiPremium
     * const KimchiPremium = await prisma.kimchiPremium.delete({
     *   where: {
     *     // ... filter to delete one KimchiPremium
     *   }
     * })
     * 
     */
    delete<T extends KimchiPremiumDeleteArgs>(args: SelectSubset<T, KimchiPremiumDeleteArgs<ExtArgs>>): Prisma__KimchiPremiumClient<$Result.GetResult<Prisma.$KimchiPremiumPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one KimchiPremium.
     * @param {KimchiPremiumUpdateArgs} args - Arguments to update one KimchiPremium.
     * @example
     * // Update one KimchiPremium
     * const kimchiPremium = await prisma.kimchiPremium.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends KimchiPremiumUpdateArgs>(args: SelectSubset<T, KimchiPremiumUpdateArgs<ExtArgs>>): Prisma__KimchiPremiumClient<$Result.GetResult<Prisma.$KimchiPremiumPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more KimchiPremiums.
     * @param {KimchiPremiumDeleteManyArgs} args - Arguments to filter KimchiPremiums to delete.
     * @example
     * // Delete a few KimchiPremiums
     * const { count } = await prisma.kimchiPremium.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends KimchiPremiumDeleteManyArgs>(args?: SelectSubset<T, KimchiPremiumDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KimchiPremiums.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KimchiPremiumUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many KimchiPremiums
     * const kimchiPremium = await prisma.kimchiPremium.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends KimchiPremiumUpdateManyArgs>(args: SelectSubset<T, KimchiPremiumUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more KimchiPremiums and returns the data updated in the database.
     * @param {KimchiPremiumUpdateManyAndReturnArgs} args - Arguments to update many KimchiPremiums.
     * @example
     * // Update many KimchiPremiums
     * const kimchiPremium = await prisma.kimchiPremium.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more KimchiPremiums and only return the `id`
     * const kimchiPremiumWithIdOnly = await prisma.kimchiPremium.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends KimchiPremiumUpdateManyAndReturnArgs>(args: SelectSubset<T, KimchiPremiumUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$KimchiPremiumPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one KimchiPremium.
     * @param {KimchiPremiumUpsertArgs} args - Arguments to update or create a KimchiPremium.
     * @example
     * // Update or create a KimchiPremium
     * const kimchiPremium = await prisma.kimchiPremium.upsert({
     *   create: {
     *     // ... data to create a KimchiPremium
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the KimchiPremium we want to update
     *   }
     * })
     */
    upsert<T extends KimchiPremiumUpsertArgs>(args: SelectSubset<T, KimchiPremiumUpsertArgs<ExtArgs>>): Prisma__KimchiPremiumClient<$Result.GetResult<Prisma.$KimchiPremiumPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of KimchiPremiums.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KimchiPremiumCountArgs} args - Arguments to filter KimchiPremiums to count.
     * @example
     * // Count the number of KimchiPremiums
     * const count = await prisma.kimchiPremium.count({
     *   where: {
     *     // ... the filter for the KimchiPremiums we want to count
     *   }
     * })
    **/
    count<T extends KimchiPremiumCountArgs>(
      args?: Subset<T, KimchiPremiumCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], KimchiPremiumCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a KimchiPremium.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KimchiPremiumAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends KimchiPremiumAggregateArgs>(args: Subset<T, KimchiPremiumAggregateArgs>): Prisma.PrismaPromise<GetKimchiPremiumAggregateType<T>>

    /**
     * Group by KimchiPremium.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {KimchiPremiumGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends KimchiPremiumGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: KimchiPremiumGroupByArgs['orderBy'] }
        : { orderBy?: KimchiPremiumGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, KimchiPremiumGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetKimchiPremiumGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the KimchiPremium model
   */
  readonly fields: KimchiPremiumFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for KimchiPremium.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__KimchiPremiumClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the KimchiPremium model
   */
  interface KimchiPremiumFieldRefs {
    readonly id: FieldRef<"KimchiPremium", 'Int'>
    readonly symbol: FieldRef<"KimchiPremium", 'String'>
    readonly upbitPrice: FieldRef<"KimchiPremium", 'Decimal'>
    readonly binancePrice: FieldRef<"KimchiPremium", 'Decimal'>
    readonly premiumRate: FieldRef<"KimchiPremium", 'Decimal'>
    readonly timestamp: FieldRef<"KimchiPremium", 'DateTime'>
    readonly exchangeRate: FieldRef<"KimchiPremium", 'Decimal'>
    readonly premiumAmount: FieldRef<"KimchiPremium", 'Decimal'>
  }
    

  // Custom InputTypes
  /**
   * KimchiPremium findUnique
   */
  export type KimchiPremiumFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
    /**
     * Filter, which KimchiPremium to fetch.
     */
    where: KimchiPremiumWhereUniqueInput
  }

  /**
   * KimchiPremium findUniqueOrThrow
   */
  export type KimchiPremiumFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
    /**
     * Filter, which KimchiPremium to fetch.
     */
    where: KimchiPremiumWhereUniqueInput
  }

  /**
   * KimchiPremium findFirst
   */
  export type KimchiPremiumFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
    /**
     * Filter, which KimchiPremium to fetch.
     */
    where?: KimchiPremiumWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KimchiPremiums to fetch.
     */
    orderBy?: KimchiPremiumOrderByWithRelationInput | KimchiPremiumOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KimchiPremiums.
     */
    cursor?: KimchiPremiumWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KimchiPremiums from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KimchiPremiums.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KimchiPremiums.
     */
    distinct?: KimchiPremiumScalarFieldEnum | KimchiPremiumScalarFieldEnum[]
  }

  /**
   * KimchiPremium findFirstOrThrow
   */
  export type KimchiPremiumFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
    /**
     * Filter, which KimchiPremium to fetch.
     */
    where?: KimchiPremiumWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KimchiPremiums to fetch.
     */
    orderBy?: KimchiPremiumOrderByWithRelationInput | KimchiPremiumOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for KimchiPremiums.
     */
    cursor?: KimchiPremiumWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KimchiPremiums from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KimchiPremiums.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of KimchiPremiums.
     */
    distinct?: KimchiPremiumScalarFieldEnum | KimchiPremiumScalarFieldEnum[]
  }

  /**
   * KimchiPremium findMany
   */
  export type KimchiPremiumFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
    /**
     * Filter, which KimchiPremiums to fetch.
     */
    where?: KimchiPremiumWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of KimchiPremiums to fetch.
     */
    orderBy?: KimchiPremiumOrderByWithRelationInput | KimchiPremiumOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing KimchiPremiums.
     */
    cursor?: KimchiPremiumWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` KimchiPremiums from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` KimchiPremiums.
     */
    skip?: number
    distinct?: KimchiPremiumScalarFieldEnum | KimchiPremiumScalarFieldEnum[]
  }

  /**
   * KimchiPremium create
   */
  export type KimchiPremiumCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
    /**
     * The data needed to create a KimchiPremium.
     */
    data: XOR<KimchiPremiumCreateInput, KimchiPremiumUncheckedCreateInput>
  }

  /**
   * KimchiPremium createMany
   */
  export type KimchiPremiumCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many KimchiPremiums.
     */
    data: KimchiPremiumCreateManyInput | KimchiPremiumCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * KimchiPremium createManyAndReturn
   */
  export type KimchiPremiumCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
    /**
     * The data used to create many KimchiPremiums.
     */
    data: KimchiPremiumCreateManyInput | KimchiPremiumCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * KimchiPremium update
   */
  export type KimchiPremiumUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
    /**
     * The data needed to update a KimchiPremium.
     */
    data: XOR<KimchiPremiumUpdateInput, KimchiPremiumUncheckedUpdateInput>
    /**
     * Choose, which KimchiPremium to update.
     */
    where: KimchiPremiumWhereUniqueInput
  }

  /**
   * KimchiPremium updateMany
   */
  export type KimchiPremiumUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update KimchiPremiums.
     */
    data: XOR<KimchiPremiumUpdateManyMutationInput, KimchiPremiumUncheckedUpdateManyInput>
    /**
     * Filter which KimchiPremiums to update
     */
    where?: KimchiPremiumWhereInput
    /**
     * Limit how many KimchiPremiums to update.
     */
    limit?: number
  }

  /**
   * KimchiPremium updateManyAndReturn
   */
  export type KimchiPremiumUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
    /**
     * The data used to update KimchiPremiums.
     */
    data: XOR<KimchiPremiumUpdateManyMutationInput, KimchiPremiumUncheckedUpdateManyInput>
    /**
     * Filter which KimchiPremiums to update
     */
    where?: KimchiPremiumWhereInput
    /**
     * Limit how many KimchiPremiums to update.
     */
    limit?: number
  }

  /**
   * KimchiPremium upsert
   */
  export type KimchiPremiumUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
    /**
     * The filter to search for the KimchiPremium to update in case it exists.
     */
    where: KimchiPremiumWhereUniqueInput
    /**
     * In case the KimchiPremium found by the `where` argument doesn't exist, create a new KimchiPremium with this data.
     */
    create: XOR<KimchiPremiumCreateInput, KimchiPremiumUncheckedCreateInput>
    /**
     * In case the KimchiPremium was found with the provided `where` argument, update it with this data.
     */
    update: XOR<KimchiPremiumUpdateInput, KimchiPremiumUncheckedUpdateInput>
  }

  /**
   * KimchiPremium delete
   */
  export type KimchiPremiumDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
    /**
     * Filter which KimchiPremium to delete.
     */
    where: KimchiPremiumWhereUniqueInput
  }

  /**
   * KimchiPremium deleteMany
   */
  export type KimchiPremiumDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which KimchiPremiums to delete
     */
    where?: KimchiPremiumWhereInput
    /**
     * Limit how many KimchiPremiums to delete.
     */
    limit?: number
  }

  /**
   * KimchiPremium without action
   */
  export type KimchiPremiumDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the KimchiPremium
     */
    select?: KimchiPremiumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the KimchiPremium
     */
    omit?: KimchiPremiumOmit<ExtArgs> | null
  }


  /**
   * Model PerformanceStat
   */

  export type AggregatePerformanceStat = {
    _count: PerformanceStatCountAggregateOutputType | null
    _avg: PerformanceStatAvgAggregateOutputType | null
    _sum: PerformanceStatSumAggregateOutputType | null
    _min: PerformanceStatMinAggregateOutputType | null
    _max: PerformanceStatMaxAggregateOutputType | null
  }

  export type PerformanceStatAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    totalTrades: number | null
    successfulTrades: number | null
    dailyProfit: Decimal | null
    dailyVolume: Decimal | null
    winRate: Decimal | null
    avgProfitPerTrade: Decimal | null
    maxDrawdown: Decimal | null
  }

  export type PerformanceStatSumAggregateOutputType = {
    id: number | null
    userId: number | null
    totalTrades: number | null
    successfulTrades: number | null
    dailyProfit: Decimal | null
    dailyVolume: Decimal | null
    winRate: Decimal | null
    avgProfitPerTrade: Decimal | null
    maxDrawdown: Decimal | null
  }

  export type PerformanceStatMinAggregateOutputType = {
    id: number | null
    userId: number | null
    date: string | null
    totalTrades: number | null
    successfulTrades: number | null
    dailyProfit: Decimal | null
    dailyVolume: Decimal | null
    winRate: Decimal | null
    avgProfitPerTrade: Decimal | null
    maxDrawdown: Decimal | null
    createdAt: Date | null
  }

  export type PerformanceStatMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    date: string | null
    totalTrades: number | null
    successfulTrades: number | null
    dailyProfit: Decimal | null
    dailyVolume: Decimal | null
    winRate: Decimal | null
    avgProfitPerTrade: Decimal | null
    maxDrawdown: Decimal | null
    createdAt: Date | null
  }

  export type PerformanceStatCountAggregateOutputType = {
    id: number
    userId: number
    date: number
    totalTrades: number
    successfulTrades: number
    dailyProfit: number
    dailyVolume: number
    winRate: number
    avgProfitPerTrade: number
    maxDrawdown: number
    createdAt: number
    _all: number
  }


  export type PerformanceStatAvgAggregateInputType = {
    id?: true
    userId?: true
    totalTrades?: true
    successfulTrades?: true
    dailyProfit?: true
    dailyVolume?: true
    winRate?: true
    avgProfitPerTrade?: true
    maxDrawdown?: true
  }

  export type PerformanceStatSumAggregateInputType = {
    id?: true
    userId?: true
    totalTrades?: true
    successfulTrades?: true
    dailyProfit?: true
    dailyVolume?: true
    winRate?: true
    avgProfitPerTrade?: true
    maxDrawdown?: true
  }

  export type PerformanceStatMinAggregateInputType = {
    id?: true
    userId?: true
    date?: true
    totalTrades?: true
    successfulTrades?: true
    dailyProfit?: true
    dailyVolume?: true
    winRate?: true
    avgProfitPerTrade?: true
    maxDrawdown?: true
    createdAt?: true
  }

  export type PerformanceStatMaxAggregateInputType = {
    id?: true
    userId?: true
    date?: true
    totalTrades?: true
    successfulTrades?: true
    dailyProfit?: true
    dailyVolume?: true
    winRate?: true
    avgProfitPerTrade?: true
    maxDrawdown?: true
    createdAt?: true
  }

  export type PerformanceStatCountAggregateInputType = {
    id?: true
    userId?: true
    date?: true
    totalTrades?: true
    successfulTrades?: true
    dailyProfit?: true
    dailyVolume?: true
    winRate?: true
    avgProfitPerTrade?: true
    maxDrawdown?: true
    createdAt?: true
    _all?: true
  }

  export type PerformanceStatAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PerformanceStat to aggregate.
     */
    where?: PerformanceStatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PerformanceStats to fetch.
     */
    orderBy?: PerformanceStatOrderByWithRelationInput | PerformanceStatOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PerformanceStatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PerformanceStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PerformanceStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PerformanceStats
    **/
    _count?: true | PerformanceStatCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PerformanceStatAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PerformanceStatSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PerformanceStatMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PerformanceStatMaxAggregateInputType
  }

  export type GetPerformanceStatAggregateType<T extends PerformanceStatAggregateArgs> = {
        [P in keyof T & keyof AggregatePerformanceStat]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePerformanceStat[P]>
      : GetScalarType<T[P], AggregatePerformanceStat[P]>
  }




  export type PerformanceStatGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PerformanceStatWhereInput
    orderBy?: PerformanceStatOrderByWithAggregationInput | PerformanceStatOrderByWithAggregationInput[]
    by: PerformanceStatScalarFieldEnum[] | PerformanceStatScalarFieldEnum
    having?: PerformanceStatScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PerformanceStatCountAggregateInputType | true
    _avg?: PerformanceStatAvgAggregateInputType
    _sum?: PerformanceStatSumAggregateInputType
    _min?: PerformanceStatMinAggregateInputType
    _max?: PerformanceStatMaxAggregateInputType
  }

  export type PerformanceStatGroupByOutputType = {
    id: number
    userId: number
    date: string
    totalTrades: number
    successfulTrades: number
    dailyProfit: Decimal
    dailyVolume: Decimal
    winRate: Decimal
    avgProfitPerTrade: Decimal
    maxDrawdown: Decimal
    createdAt: Date
    _count: PerformanceStatCountAggregateOutputType | null
    _avg: PerformanceStatAvgAggregateOutputType | null
    _sum: PerformanceStatSumAggregateOutputType | null
    _min: PerformanceStatMinAggregateOutputType | null
    _max: PerformanceStatMaxAggregateOutputType | null
  }

  type GetPerformanceStatGroupByPayload<T extends PerformanceStatGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PerformanceStatGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PerformanceStatGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PerformanceStatGroupByOutputType[P]>
            : GetScalarType<T[P], PerformanceStatGroupByOutputType[P]>
        }
      >
    >


  export type PerformanceStatSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    date?: boolean
    totalTrades?: boolean
    successfulTrades?: boolean
    dailyProfit?: boolean
    dailyVolume?: boolean
    winRate?: boolean
    avgProfitPerTrade?: boolean
    maxDrawdown?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["performanceStat"]>

  export type PerformanceStatSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    date?: boolean
    totalTrades?: boolean
    successfulTrades?: boolean
    dailyProfit?: boolean
    dailyVolume?: boolean
    winRate?: boolean
    avgProfitPerTrade?: boolean
    maxDrawdown?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["performanceStat"]>

  export type PerformanceStatSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    date?: boolean
    totalTrades?: boolean
    successfulTrades?: boolean
    dailyProfit?: boolean
    dailyVolume?: boolean
    winRate?: boolean
    avgProfitPerTrade?: boolean
    maxDrawdown?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["performanceStat"]>

  export type PerformanceStatSelectScalar = {
    id?: boolean
    userId?: boolean
    date?: boolean
    totalTrades?: boolean
    successfulTrades?: boolean
    dailyProfit?: boolean
    dailyVolume?: boolean
    winRate?: boolean
    avgProfitPerTrade?: boolean
    maxDrawdown?: boolean
    createdAt?: boolean
  }

  export type PerformanceStatOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "date" | "totalTrades" | "successfulTrades" | "dailyProfit" | "dailyVolume" | "winRate" | "avgProfitPerTrade" | "maxDrawdown" | "createdAt", ExtArgs["result"]["performanceStat"]>

  export type $PerformanceStatPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PerformanceStat"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      date: string
      totalTrades: number
      successfulTrades: number
      dailyProfit: Prisma.Decimal
      dailyVolume: Prisma.Decimal
      winRate: Prisma.Decimal
      avgProfitPerTrade: Prisma.Decimal
      maxDrawdown: Prisma.Decimal
      createdAt: Date
    }, ExtArgs["result"]["performanceStat"]>
    composites: {}
  }

  type PerformanceStatGetPayload<S extends boolean | null | undefined | PerformanceStatDefaultArgs> = $Result.GetResult<Prisma.$PerformanceStatPayload, S>

  type PerformanceStatCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PerformanceStatFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PerformanceStatCountAggregateInputType | true
    }

  export interface PerformanceStatDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PerformanceStat'], meta: { name: 'PerformanceStat' } }
    /**
     * Find zero or one PerformanceStat that matches the filter.
     * @param {PerformanceStatFindUniqueArgs} args - Arguments to find a PerformanceStat
     * @example
     * // Get one PerformanceStat
     * const performanceStat = await prisma.performanceStat.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PerformanceStatFindUniqueArgs>(args: SelectSubset<T, PerformanceStatFindUniqueArgs<ExtArgs>>): Prisma__PerformanceStatClient<$Result.GetResult<Prisma.$PerformanceStatPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PerformanceStat that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PerformanceStatFindUniqueOrThrowArgs} args - Arguments to find a PerformanceStat
     * @example
     * // Get one PerformanceStat
     * const performanceStat = await prisma.performanceStat.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PerformanceStatFindUniqueOrThrowArgs>(args: SelectSubset<T, PerformanceStatFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PerformanceStatClient<$Result.GetResult<Prisma.$PerformanceStatPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PerformanceStat that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceStatFindFirstArgs} args - Arguments to find a PerformanceStat
     * @example
     * // Get one PerformanceStat
     * const performanceStat = await prisma.performanceStat.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PerformanceStatFindFirstArgs>(args?: SelectSubset<T, PerformanceStatFindFirstArgs<ExtArgs>>): Prisma__PerformanceStatClient<$Result.GetResult<Prisma.$PerformanceStatPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PerformanceStat that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceStatFindFirstOrThrowArgs} args - Arguments to find a PerformanceStat
     * @example
     * // Get one PerformanceStat
     * const performanceStat = await prisma.performanceStat.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PerformanceStatFindFirstOrThrowArgs>(args?: SelectSubset<T, PerformanceStatFindFirstOrThrowArgs<ExtArgs>>): Prisma__PerformanceStatClient<$Result.GetResult<Prisma.$PerformanceStatPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PerformanceStats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceStatFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PerformanceStats
     * const performanceStats = await prisma.performanceStat.findMany()
     * 
     * // Get first 10 PerformanceStats
     * const performanceStats = await prisma.performanceStat.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const performanceStatWithIdOnly = await prisma.performanceStat.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PerformanceStatFindManyArgs>(args?: SelectSubset<T, PerformanceStatFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PerformanceStatPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PerformanceStat.
     * @param {PerformanceStatCreateArgs} args - Arguments to create a PerformanceStat.
     * @example
     * // Create one PerformanceStat
     * const PerformanceStat = await prisma.performanceStat.create({
     *   data: {
     *     // ... data to create a PerformanceStat
     *   }
     * })
     * 
     */
    create<T extends PerformanceStatCreateArgs>(args: SelectSubset<T, PerformanceStatCreateArgs<ExtArgs>>): Prisma__PerformanceStatClient<$Result.GetResult<Prisma.$PerformanceStatPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PerformanceStats.
     * @param {PerformanceStatCreateManyArgs} args - Arguments to create many PerformanceStats.
     * @example
     * // Create many PerformanceStats
     * const performanceStat = await prisma.performanceStat.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PerformanceStatCreateManyArgs>(args?: SelectSubset<T, PerformanceStatCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PerformanceStats and returns the data saved in the database.
     * @param {PerformanceStatCreateManyAndReturnArgs} args - Arguments to create many PerformanceStats.
     * @example
     * // Create many PerformanceStats
     * const performanceStat = await prisma.performanceStat.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PerformanceStats and only return the `id`
     * const performanceStatWithIdOnly = await prisma.performanceStat.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PerformanceStatCreateManyAndReturnArgs>(args?: SelectSubset<T, PerformanceStatCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PerformanceStatPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PerformanceStat.
     * @param {PerformanceStatDeleteArgs} args - Arguments to delete one PerformanceStat.
     * @example
     * // Delete one PerformanceStat
     * const PerformanceStat = await prisma.performanceStat.delete({
     *   where: {
     *     // ... filter to delete one PerformanceStat
     *   }
     * })
     * 
     */
    delete<T extends PerformanceStatDeleteArgs>(args: SelectSubset<T, PerformanceStatDeleteArgs<ExtArgs>>): Prisma__PerformanceStatClient<$Result.GetResult<Prisma.$PerformanceStatPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PerformanceStat.
     * @param {PerformanceStatUpdateArgs} args - Arguments to update one PerformanceStat.
     * @example
     * // Update one PerformanceStat
     * const performanceStat = await prisma.performanceStat.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PerformanceStatUpdateArgs>(args: SelectSubset<T, PerformanceStatUpdateArgs<ExtArgs>>): Prisma__PerformanceStatClient<$Result.GetResult<Prisma.$PerformanceStatPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PerformanceStats.
     * @param {PerformanceStatDeleteManyArgs} args - Arguments to filter PerformanceStats to delete.
     * @example
     * // Delete a few PerformanceStats
     * const { count } = await prisma.performanceStat.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PerformanceStatDeleteManyArgs>(args?: SelectSubset<T, PerformanceStatDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PerformanceStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceStatUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PerformanceStats
     * const performanceStat = await prisma.performanceStat.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PerformanceStatUpdateManyArgs>(args: SelectSubset<T, PerformanceStatUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PerformanceStats and returns the data updated in the database.
     * @param {PerformanceStatUpdateManyAndReturnArgs} args - Arguments to update many PerformanceStats.
     * @example
     * // Update many PerformanceStats
     * const performanceStat = await prisma.performanceStat.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PerformanceStats and only return the `id`
     * const performanceStatWithIdOnly = await prisma.performanceStat.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PerformanceStatUpdateManyAndReturnArgs>(args: SelectSubset<T, PerformanceStatUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PerformanceStatPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PerformanceStat.
     * @param {PerformanceStatUpsertArgs} args - Arguments to update or create a PerformanceStat.
     * @example
     * // Update or create a PerformanceStat
     * const performanceStat = await prisma.performanceStat.upsert({
     *   create: {
     *     // ... data to create a PerformanceStat
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PerformanceStat we want to update
     *   }
     * })
     */
    upsert<T extends PerformanceStatUpsertArgs>(args: SelectSubset<T, PerformanceStatUpsertArgs<ExtArgs>>): Prisma__PerformanceStatClient<$Result.GetResult<Prisma.$PerformanceStatPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PerformanceStats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceStatCountArgs} args - Arguments to filter PerformanceStats to count.
     * @example
     * // Count the number of PerformanceStats
     * const count = await prisma.performanceStat.count({
     *   where: {
     *     // ... the filter for the PerformanceStats we want to count
     *   }
     * })
    **/
    count<T extends PerformanceStatCountArgs>(
      args?: Subset<T, PerformanceStatCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PerformanceStatCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PerformanceStat.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceStatAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PerformanceStatAggregateArgs>(args: Subset<T, PerformanceStatAggregateArgs>): Prisma.PrismaPromise<GetPerformanceStatAggregateType<T>>

    /**
     * Group by PerformanceStat.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceStatGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PerformanceStatGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PerformanceStatGroupByArgs['orderBy'] }
        : { orderBy?: PerformanceStatGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PerformanceStatGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPerformanceStatGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PerformanceStat model
   */
  readonly fields: PerformanceStatFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PerformanceStat.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PerformanceStatClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PerformanceStat model
   */
  interface PerformanceStatFieldRefs {
    readonly id: FieldRef<"PerformanceStat", 'Int'>
    readonly userId: FieldRef<"PerformanceStat", 'Int'>
    readonly date: FieldRef<"PerformanceStat", 'String'>
    readonly totalTrades: FieldRef<"PerformanceStat", 'Int'>
    readonly successfulTrades: FieldRef<"PerformanceStat", 'Int'>
    readonly dailyProfit: FieldRef<"PerformanceStat", 'Decimal'>
    readonly dailyVolume: FieldRef<"PerformanceStat", 'Decimal'>
    readonly winRate: FieldRef<"PerformanceStat", 'Decimal'>
    readonly avgProfitPerTrade: FieldRef<"PerformanceStat", 'Decimal'>
    readonly maxDrawdown: FieldRef<"PerformanceStat", 'Decimal'>
    readonly createdAt: FieldRef<"PerformanceStat", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PerformanceStat findUnique
   */
  export type PerformanceStatFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
    /**
     * Filter, which PerformanceStat to fetch.
     */
    where: PerformanceStatWhereUniqueInput
  }

  /**
   * PerformanceStat findUniqueOrThrow
   */
  export type PerformanceStatFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
    /**
     * Filter, which PerformanceStat to fetch.
     */
    where: PerformanceStatWhereUniqueInput
  }

  /**
   * PerformanceStat findFirst
   */
  export type PerformanceStatFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
    /**
     * Filter, which PerformanceStat to fetch.
     */
    where?: PerformanceStatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PerformanceStats to fetch.
     */
    orderBy?: PerformanceStatOrderByWithRelationInput | PerformanceStatOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PerformanceStats.
     */
    cursor?: PerformanceStatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PerformanceStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PerformanceStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PerformanceStats.
     */
    distinct?: PerformanceStatScalarFieldEnum | PerformanceStatScalarFieldEnum[]
  }

  /**
   * PerformanceStat findFirstOrThrow
   */
  export type PerformanceStatFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
    /**
     * Filter, which PerformanceStat to fetch.
     */
    where?: PerformanceStatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PerformanceStats to fetch.
     */
    orderBy?: PerformanceStatOrderByWithRelationInput | PerformanceStatOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PerformanceStats.
     */
    cursor?: PerformanceStatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PerformanceStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PerformanceStats.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PerformanceStats.
     */
    distinct?: PerformanceStatScalarFieldEnum | PerformanceStatScalarFieldEnum[]
  }

  /**
   * PerformanceStat findMany
   */
  export type PerformanceStatFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
    /**
     * Filter, which PerformanceStats to fetch.
     */
    where?: PerformanceStatWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PerformanceStats to fetch.
     */
    orderBy?: PerformanceStatOrderByWithRelationInput | PerformanceStatOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PerformanceStats.
     */
    cursor?: PerformanceStatWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PerformanceStats from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PerformanceStats.
     */
    skip?: number
    distinct?: PerformanceStatScalarFieldEnum | PerformanceStatScalarFieldEnum[]
  }

  /**
   * PerformanceStat create
   */
  export type PerformanceStatCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
    /**
     * The data needed to create a PerformanceStat.
     */
    data: XOR<PerformanceStatCreateInput, PerformanceStatUncheckedCreateInput>
  }

  /**
   * PerformanceStat createMany
   */
  export type PerformanceStatCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PerformanceStats.
     */
    data: PerformanceStatCreateManyInput | PerformanceStatCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PerformanceStat createManyAndReturn
   */
  export type PerformanceStatCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
    /**
     * The data used to create many PerformanceStats.
     */
    data: PerformanceStatCreateManyInput | PerformanceStatCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PerformanceStat update
   */
  export type PerformanceStatUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
    /**
     * The data needed to update a PerformanceStat.
     */
    data: XOR<PerformanceStatUpdateInput, PerformanceStatUncheckedUpdateInput>
    /**
     * Choose, which PerformanceStat to update.
     */
    where: PerformanceStatWhereUniqueInput
  }

  /**
   * PerformanceStat updateMany
   */
  export type PerformanceStatUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PerformanceStats.
     */
    data: XOR<PerformanceStatUpdateManyMutationInput, PerformanceStatUncheckedUpdateManyInput>
    /**
     * Filter which PerformanceStats to update
     */
    where?: PerformanceStatWhereInput
    /**
     * Limit how many PerformanceStats to update.
     */
    limit?: number
  }

  /**
   * PerformanceStat updateManyAndReturn
   */
  export type PerformanceStatUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
    /**
     * The data used to update PerformanceStats.
     */
    data: XOR<PerformanceStatUpdateManyMutationInput, PerformanceStatUncheckedUpdateManyInput>
    /**
     * Filter which PerformanceStats to update
     */
    where?: PerformanceStatWhereInput
    /**
     * Limit how many PerformanceStats to update.
     */
    limit?: number
  }

  /**
   * PerformanceStat upsert
   */
  export type PerformanceStatUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
    /**
     * The filter to search for the PerformanceStat to update in case it exists.
     */
    where: PerformanceStatWhereUniqueInput
    /**
     * In case the PerformanceStat found by the `where` argument doesn't exist, create a new PerformanceStat with this data.
     */
    create: XOR<PerformanceStatCreateInput, PerformanceStatUncheckedCreateInput>
    /**
     * In case the PerformanceStat was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PerformanceStatUpdateInput, PerformanceStatUncheckedUpdateInput>
  }

  /**
   * PerformanceStat delete
   */
  export type PerformanceStatDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
    /**
     * Filter which PerformanceStat to delete.
     */
    where: PerformanceStatWhereUniqueInput
  }

  /**
   * PerformanceStat deleteMany
   */
  export type PerformanceStatDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PerformanceStats to delete
     */
    where?: PerformanceStatWhereInput
    /**
     * Limit how many PerformanceStats to delete.
     */
    limit?: number
  }

  /**
   * PerformanceStat without action
   */
  export type PerformanceStatDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceStat
     */
    select?: PerformanceStatSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceStat
     */
    omit?: PerformanceStatOmit<ExtArgs> | null
  }


  /**
   * Model Position
   */

  export type AggregatePosition = {
    _count: PositionCountAggregateOutputType | null
    _avg: PositionAvgAggregateOutputType | null
    _sum: PositionSumAggregateOutputType | null
    _min: PositionMinAggregateOutputType | null
    _max: PositionMaxAggregateOutputType | null
  }

  export type PositionAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    strategyId: number | null
    entryPrice: Decimal | null
    currentPrice: Decimal | null
    quantity: Decimal | null
    entryPremiumRate: Decimal | null
    currentPremiumRate: Decimal | null
    exitPrice: Decimal | null
    exitPremiumRate: Decimal | null
    unrealizedPnl: Decimal | null
    realizedPnl: Decimal | null
  }

  export type PositionSumAggregateOutputType = {
    id: number | null
    userId: number | null
    strategyId: number | null
    entryPrice: Decimal | null
    currentPrice: Decimal | null
    quantity: Decimal | null
    entryPremiumRate: Decimal | null
    currentPremiumRate: Decimal | null
    exitPrice: Decimal | null
    exitPremiumRate: Decimal | null
    unrealizedPnl: Decimal | null
    realizedPnl: Decimal | null
  }

  export type PositionMinAggregateOutputType = {
    id: number | null
    userId: number | null
    strategyId: number | null
    symbol: string | null
    type: string | null
    entryPrice: Decimal | null
    currentPrice: Decimal | null
    quantity: Decimal | null
    entryPremiumRate: Decimal | null
    currentPremiumRate: Decimal | null
    status: string | null
    entryTime: Date | null
    exitTime: Date | null
    upbitOrderId: string | null
    binanceOrderId: string | null
    side: string | null
    exitPrice: Decimal | null
    exitPremiumRate: Decimal | null
    unrealizedPnl: Decimal | null
    realizedPnl: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PositionMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    strategyId: number | null
    symbol: string | null
    type: string | null
    entryPrice: Decimal | null
    currentPrice: Decimal | null
    quantity: Decimal | null
    entryPremiumRate: Decimal | null
    currentPremiumRate: Decimal | null
    status: string | null
    entryTime: Date | null
    exitTime: Date | null
    upbitOrderId: string | null
    binanceOrderId: string | null
    side: string | null
    exitPrice: Decimal | null
    exitPremiumRate: Decimal | null
    unrealizedPnl: Decimal | null
    realizedPnl: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PositionCountAggregateOutputType = {
    id: number
    userId: number
    strategyId: number
    symbol: number
    type: number
    entryPrice: number
    currentPrice: number
    quantity: number
    entryPremiumRate: number
    currentPremiumRate: number
    status: number
    entryTime: number
    exitTime: number
    upbitOrderId: number
    binanceOrderId: number
    side: number
    exitPrice: number
    exitPremiumRate: number
    unrealizedPnl: number
    realizedPnl: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PositionAvgAggregateInputType = {
    id?: true
    userId?: true
    strategyId?: true
    entryPrice?: true
    currentPrice?: true
    quantity?: true
    entryPremiumRate?: true
    currentPremiumRate?: true
    exitPrice?: true
    exitPremiumRate?: true
    unrealizedPnl?: true
    realizedPnl?: true
  }

  export type PositionSumAggregateInputType = {
    id?: true
    userId?: true
    strategyId?: true
    entryPrice?: true
    currentPrice?: true
    quantity?: true
    entryPremiumRate?: true
    currentPremiumRate?: true
    exitPrice?: true
    exitPremiumRate?: true
    unrealizedPnl?: true
    realizedPnl?: true
  }

  export type PositionMinAggregateInputType = {
    id?: true
    userId?: true
    strategyId?: true
    symbol?: true
    type?: true
    entryPrice?: true
    currentPrice?: true
    quantity?: true
    entryPremiumRate?: true
    currentPremiumRate?: true
    status?: true
    entryTime?: true
    exitTime?: true
    upbitOrderId?: true
    binanceOrderId?: true
    side?: true
    exitPrice?: true
    exitPremiumRate?: true
    unrealizedPnl?: true
    realizedPnl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PositionMaxAggregateInputType = {
    id?: true
    userId?: true
    strategyId?: true
    symbol?: true
    type?: true
    entryPrice?: true
    currentPrice?: true
    quantity?: true
    entryPremiumRate?: true
    currentPremiumRate?: true
    status?: true
    entryTime?: true
    exitTime?: true
    upbitOrderId?: true
    binanceOrderId?: true
    side?: true
    exitPrice?: true
    exitPremiumRate?: true
    unrealizedPnl?: true
    realizedPnl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PositionCountAggregateInputType = {
    id?: true
    userId?: true
    strategyId?: true
    symbol?: true
    type?: true
    entryPrice?: true
    currentPrice?: true
    quantity?: true
    entryPremiumRate?: true
    currentPremiumRate?: true
    status?: true
    entryTime?: true
    exitTime?: true
    upbitOrderId?: true
    binanceOrderId?: true
    side?: true
    exitPrice?: true
    exitPremiumRate?: true
    unrealizedPnl?: true
    realizedPnl?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PositionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Position to aggregate.
     */
    where?: PositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Positions to fetch.
     */
    orderBy?: PositionOrderByWithRelationInput | PositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Positions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Positions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Positions
    **/
    _count?: true | PositionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PositionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PositionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PositionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PositionMaxAggregateInputType
  }

  export type GetPositionAggregateType<T extends PositionAggregateArgs> = {
        [P in keyof T & keyof AggregatePosition]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePosition[P]>
      : GetScalarType<T[P], AggregatePosition[P]>
  }




  export type PositionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PositionWhereInput
    orderBy?: PositionOrderByWithAggregationInput | PositionOrderByWithAggregationInput[]
    by: PositionScalarFieldEnum[] | PositionScalarFieldEnum
    having?: PositionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PositionCountAggregateInputType | true
    _avg?: PositionAvgAggregateInputType
    _sum?: PositionSumAggregateInputType
    _min?: PositionMinAggregateInputType
    _max?: PositionMaxAggregateInputType
  }

  export type PositionGroupByOutputType = {
    id: number
    userId: number
    strategyId: number | null
    symbol: string
    type: string
    entryPrice: Decimal
    currentPrice: Decimal | null
    quantity: Decimal
    entryPremiumRate: Decimal
    currentPremiumRate: Decimal | null
    status: string
    entryTime: Date
    exitTime: Date | null
    upbitOrderId: string | null
    binanceOrderId: string | null
    side: string
    exitPrice: Decimal | null
    exitPremiumRate: Decimal | null
    unrealizedPnl: Decimal | null
    realizedPnl: Decimal | null
    createdAt: Date
    updatedAt: Date
    _count: PositionCountAggregateOutputType | null
    _avg: PositionAvgAggregateOutputType | null
    _sum: PositionSumAggregateOutputType | null
    _min: PositionMinAggregateOutputType | null
    _max: PositionMaxAggregateOutputType | null
  }

  type GetPositionGroupByPayload<T extends PositionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PositionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PositionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PositionGroupByOutputType[P]>
            : GetScalarType<T[P], PositionGroupByOutputType[P]>
        }
      >
    >


  export type PositionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    strategyId?: boolean
    symbol?: boolean
    type?: boolean
    entryPrice?: boolean
    currentPrice?: boolean
    quantity?: boolean
    entryPremiumRate?: boolean
    currentPremiumRate?: boolean
    status?: boolean
    entryTime?: boolean
    exitTime?: boolean
    upbitOrderId?: boolean
    binanceOrderId?: boolean
    side?: boolean
    exitPrice?: boolean
    exitPremiumRate?: boolean
    unrealizedPnl?: boolean
    realizedPnl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["position"]>

  export type PositionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    strategyId?: boolean
    symbol?: boolean
    type?: boolean
    entryPrice?: boolean
    currentPrice?: boolean
    quantity?: boolean
    entryPremiumRate?: boolean
    currentPremiumRate?: boolean
    status?: boolean
    entryTime?: boolean
    exitTime?: boolean
    upbitOrderId?: boolean
    binanceOrderId?: boolean
    side?: boolean
    exitPrice?: boolean
    exitPremiumRate?: boolean
    unrealizedPnl?: boolean
    realizedPnl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["position"]>

  export type PositionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    strategyId?: boolean
    symbol?: boolean
    type?: boolean
    entryPrice?: boolean
    currentPrice?: boolean
    quantity?: boolean
    entryPremiumRate?: boolean
    currentPremiumRate?: boolean
    status?: boolean
    entryTime?: boolean
    exitTime?: boolean
    upbitOrderId?: boolean
    binanceOrderId?: boolean
    side?: boolean
    exitPrice?: boolean
    exitPremiumRate?: boolean
    unrealizedPnl?: boolean
    realizedPnl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["position"]>

  export type PositionSelectScalar = {
    id?: boolean
    userId?: boolean
    strategyId?: boolean
    symbol?: boolean
    type?: boolean
    entryPrice?: boolean
    currentPrice?: boolean
    quantity?: boolean
    entryPremiumRate?: boolean
    currentPremiumRate?: boolean
    status?: boolean
    entryTime?: boolean
    exitTime?: boolean
    upbitOrderId?: boolean
    binanceOrderId?: boolean
    side?: boolean
    exitPrice?: boolean
    exitPremiumRate?: boolean
    unrealizedPnl?: boolean
    realizedPnl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PositionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "strategyId" | "symbol" | "type" | "entryPrice" | "currentPrice" | "quantity" | "entryPremiumRate" | "currentPremiumRate" | "status" | "entryTime" | "exitTime" | "upbitOrderId" | "binanceOrderId" | "side" | "exitPrice" | "exitPremiumRate" | "unrealizedPnl" | "realizedPnl" | "createdAt" | "updatedAt", ExtArgs["result"]["position"]>

  export type $PositionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Position"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      strategyId: number | null
      symbol: string
      type: string
      entryPrice: Prisma.Decimal
      currentPrice: Prisma.Decimal | null
      quantity: Prisma.Decimal
      entryPremiumRate: Prisma.Decimal
      currentPremiumRate: Prisma.Decimal | null
      status: string
      entryTime: Date
      exitTime: Date | null
      upbitOrderId: string | null
      binanceOrderId: string | null
      side: string
      exitPrice: Prisma.Decimal | null
      exitPremiumRate: Prisma.Decimal | null
      unrealizedPnl: Prisma.Decimal | null
      realizedPnl: Prisma.Decimal | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["position"]>
    composites: {}
  }

  type PositionGetPayload<S extends boolean | null | undefined | PositionDefaultArgs> = $Result.GetResult<Prisma.$PositionPayload, S>

  type PositionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PositionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PositionCountAggregateInputType | true
    }

  export interface PositionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Position'], meta: { name: 'Position' } }
    /**
     * Find zero or one Position that matches the filter.
     * @param {PositionFindUniqueArgs} args - Arguments to find a Position
     * @example
     * // Get one Position
     * const position = await prisma.position.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PositionFindUniqueArgs>(args: SelectSubset<T, PositionFindUniqueArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Position that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PositionFindUniqueOrThrowArgs} args - Arguments to find a Position
     * @example
     * // Get one Position
     * const position = await prisma.position.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PositionFindUniqueOrThrowArgs>(args: SelectSubset<T, PositionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Position that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionFindFirstArgs} args - Arguments to find a Position
     * @example
     * // Get one Position
     * const position = await prisma.position.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PositionFindFirstArgs>(args?: SelectSubset<T, PositionFindFirstArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Position that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionFindFirstOrThrowArgs} args - Arguments to find a Position
     * @example
     * // Get one Position
     * const position = await prisma.position.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PositionFindFirstOrThrowArgs>(args?: SelectSubset<T, PositionFindFirstOrThrowArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Positions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Positions
     * const positions = await prisma.position.findMany()
     * 
     * // Get first 10 Positions
     * const positions = await prisma.position.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const positionWithIdOnly = await prisma.position.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PositionFindManyArgs>(args?: SelectSubset<T, PositionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Position.
     * @param {PositionCreateArgs} args - Arguments to create a Position.
     * @example
     * // Create one Position
     * const Position = await prisma.position.create({
     *   data: {
     *     // ... data to create a Position
     *   }
     * })
     * 
     */
    create<T extends PositionCreateArgs>(args: SelectSubset<T, PositionCreateArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Positions.
     * @param {PositionCreateManyArgs} args - Arguments to create many Positions.
     * @example
     * // Create many Positions
     * const position = await prisma.position.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PositionCreateManyArgs>(args?: SelectSubset<T, PositionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Positions and returns the data saved in the database.
     * @param {PositionCreateManyAndReturnArgs} args - Arguments to create many Positions.
     * @example
     * // Create many Positions
     * const position = await prisma.position.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Positions and only return the `id`
     * const positionWithIdOnly = await prisma.position.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PositionCreateManyAndReturnArgs>(args?: SelectSubset<T, PositionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Position.
     * @param {PositionDeleteArgs} args - Arguments to delete one Position.
     * @example
     * // Delete one Position
     * const Position = await prisma.position.delete({
     *   where: {
     *     // ... filter to delete one Position
     *   }
     * })
     * 
     */
    delete<T extends PositionDeleteArgs>(args: SelectSubset<T, PositionDeleteArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Position.
     * @param {PositionUpdateArgs} args - Arguments to update one Position.
     * @example
     * // Update one Position
     * const position = await prisma.position.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PositionUpdateArgs>(args: SelectSubset<T, PositionUpdateArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Positions.
     * @param {PositionDeleteManyArgs} args - Arguments to filter Positions to delete.
     * @example
     * // Delete a few Positions
     * const { count } = await prisma.position.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PositionDeleteManyArgs>(args?: SelectSubset<T, PositionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Positions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Positions
     * const position = await prisma.position.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PositionUpdateManyArgs>(args: SelectSubset<T, PositionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Positions and returns the data updated in the database.
     * @param {PositionUpdateManyAndReturnArgs} args - Arguments to update many Positions.
     * @example
     * // Update many Positions
     * const position = await prisma.position.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Positions and only return the `id`
     * const positionWithIdOnly = await prisma.position.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PositionUpdateManyAndReturnArgs>(args: SelectSubset<T, PositionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Position.
     * @param {PositionUpsertArgs} args - Arguments to update or create a Position.
     * @example
     * // Update or create a Position
     * const position = await prisma.position.upsert({
     *   create: {
     *     // ... data to create a Position
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Position we want to update
     *   }
     * })
     */
    upsert<T extends PositionUpsertArgs>(args: SelectSubset<T, PositionUpsertArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Positions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionCountArgs} args - Arguments to filter Positions to count.
     * @example
     * // Count the number of Positions
     * const count = await prisma.position.count({
     *   where: {
     *     // ... the filter for the Positions we want to count
     *   }
     * })
    **/
    count<T extends PositionCountArgs>(
      args?: Subset<T, PositionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PositionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Position.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PositionAggregateArgs>(args: Subset<T, PositionAggregateArgs>): Prisma.PrismaPromise<GetPositionAggregateType<T>>

    /**
     * Group by Position.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PositionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PositionGroupByArgs['orderBy'] }
        : { orderBy?: PositionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PositionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPositionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Position model
   */
  readonly fields: PositionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Position.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PositionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Position model
   */
  interface PositionFieldRefs {
    readonly id: FieldRef<"Position", 'Int'>
    readonly userId: FieldRef<"Position", 'Int'>
    readonly strategyId: FieldRef<"Position", 'Int'>
    readonly symbol: FieldRef<"Position", 'String'>
    readonly type: FieldRef<"Position", 'String'>
    readonly entryPrice: FieldRef<"Position", 'Decimal'>
    readonly currentPrice: FieldRef<"Position", 'Decimal'>
    readonly quantity: FieldRef<"Position", 'Decimal'>
    readonly entryPremiumRate: FieldRef<"Position", 'Decimal'>
    readonly currentPremiumRate: FieldRef<"Position", 'Decimal'>
    readonly status: FieldRef<"Position", 'String'>
    readonly entryTime: FieldRef<"Position", 'DateTime'>
    readonly exitTime: FieldRef<"Position", 'DateTime'>
    readonly upbitOrderId: FieldRef<"Position", 'String'>
    readonly binanceOrderId: FieldRef<"Position", 'String'>
    readonly side: FieldRef<"Position", 'String'>
    readonly exitPrice: FieldRef<"Position", 'Decimal'>
    readonly exitPremiumRate: FieldRef<"Position", 'Decimal'>
    readonly unrealizedPnl: FieldRef<"Position", 'Decimal'>
    readonly realizedPnl: FieldRef<"Position", 'Decimal'>
    readonly createdAt: FieldRef<"Position", 'DateTime'>
    readonly updatedAt: FieldRef<"Position", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Position findUnique
   */
  export type PositionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
    /**
     * Filter, which Position to fetch.
     */
    where: PositionWhereUniqueInput
  }

  /**
   * Position findUniqueOrThrow
   */
  export type PositionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
    /**
     * Filter, which Position to fetch.
     */
    where: PositionWhereUniqueInput
  }

  /**
   * Position findFirst
   */
  export type PositionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
    /**
     * Filter, which Position to fetch.
     */
    where?: PositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Positions to fetch.
     */
    orderBy?: PositionOrderByWithRelationInput | PositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Positions.
     */
    cursor?: PositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Positions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Positions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Positions.
     */
    distinct?: PositionScalarFieldEnum | PositionScalarFieldEnum[]
  }

  /**
   * Position findFirstOrThrow
   */
  export type PositionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
    /**
     * Filter, which Position to fetch.
     */
    where?: PositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Positions to fetch.
     */
    orderBy?: PositionOrderByWithRelationInput | PositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Positions.
     */
    cursor?: PositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Positions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Positions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Positions.
     */
    distinct?: PositionScalarFieldEnum | PositionScalarFieldEnum[]
  }

  /**
   * Position findMany
   */
  export type PositionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
    /**
     * Filter, which Positions to fetch.
     */
    where?: PositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Positions to fetch.
     */
    orderBy?: PositionOrderByWithRelationInput | PositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Positions.
     */
    cursor?: PositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Positions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Positions.
     */
    skip?: number
    distinct?: PositionScalarFieldEnum | PositionScalarFieldEnum[]
  }

  /**
   * Position create
   */
  export type PositionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
    /**
     * The data needed to create a Position.
     */
    data: XOR<PositionCreateInput, PositionUncheckedCreateInput>
  }

  /**
   * Position createMany
   */
  export type PositionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Positions.
     */
    data: PositionCreateManyInput | PositionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Position createManyAndReturn
   */
  export type PositionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
    /**
     * The data used to create many Positions.
     */
    data: PositionCreateManyInput | PositionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Position update
   */
  export type PositionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
    /**
     * The data needed to update a Position.
     */
    data: XOR<PositionUpdateInput, PositionUncheckedUpdateInput>
    /**
     * Choose, which Position to update.
     */
    where: PositionWhereUniqueInput
  }

  /**
   * Position updateMany
   */
  export type PositionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Positions.
     */
    data: XOR<PositionUpdateManyMutationInput, PositionUncheckedUpdateManyInput>
    /**
     * Filter which Positions to update
     */
    where?: PositionWhereInput
    /**
     * Limit how many Positions to update.
     */
    limit?: number
  }

  /**
   * Position updateManyAndReturn
   */
  export type PositionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
    /**
     * The data used to update Positions.
     */
    data: XOR<PositionUpdateManyMutationInput, PositionUncheckedUpdateManyInput>
    /**
     * Filter which Positions to update
     */
    where?: PositionWhereInput
    /**
     * Limit how many Positions to update.
     */
    limit?: number
  }

  /**
   * Position upsert
   */
  export type PositionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
    /**
     * The filter to search for the Position to update in case it exists.
     */
    where: PositionWhereUniqueInput
    /**
     * In case the Position found by the `where` argument doesn't exist, create a new Position with this data.
     */
    create: XOR<PositionCreateInput, PositionUncheckedCreateInput>
    /**
     * In case the Position was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PositionUpdateInput, PositionUncheckedUpdateInput>
  }

  /**
   * Position delete
   */
  export type PositionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
    /**
     * Filter which Position to delete.
     */
    where: PositionWhereUniqueInput
  }

  /**
   * Position deleteMany
   */
  export type PositionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Positions to delete
     */
    where?: PositionWhereInput
    /**
     * Limit how many Positions to delete.
     */
    limit?: number
  }

  /**
   * Position without action
   */
  export type PositionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Position
     */
    omit?: PositionOmit<ExtArgs> | null
  }


  /**
   * Model Session
   */

  export type AggregateSession = {
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  export type SessionMinAggregateOutputType = {
    sid: string | null
    expire: Date | null
  }

  export type SessionMaxAggregateOutputType = {
    sid: string | null
    expire: Date | null
  }

  export type SessionCountAggregateOutputType = {
    sid: number
    sess: number
    expire: number
    _all: number
  }


  export type SessionMinAggregateInputType = {
    sid?: true
    expire?: true
  }

  export type SessionMaxAggregateInputType = {
    sid?: true
    expire?: true
  }

  export type SessionCountAggregateInputType = {
    sid?: true
    sess?: true
    expire?: true
    _all?: true
  }

  export type SessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Session to aggregate.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Sessions
    **/
    _count?: true | SessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SessionMaxAggregateInputType
  }

  export type GetSessionAggregateType<T extends SessionAggregateArgs> = {
        [P in keyof T & keyof AggregateSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSession[P]>
      : GetScalarType<T[P], AggregateSession[P]>
  }




  export type SessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithAggregationInput | SessionOrderByWithAggregationInput[]
    by: SessionScalarFieldEnum[] | SessionScalarFieldEnum
    having?: SessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SessionCountAggregateInputType | true
    _min?: SessionMinAggregateInputType
    _max?: SessionMaxAggregateInputType
  }

  export type SessionGroupByOutputType = {
    sid: string
    sess: JsonValue
    expire: Date
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  type GetSessionGroupByPayload<T extends SessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SessionGroupByOutputType[P]>
            : GetScalarType<T[P], SessionGroupByOutputType[P]>
        }
      >
    >


  export type SessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    sid?: boolean
    sess?: boolean
    expire?: boolean
  }, ExtArgs["result"]["session"]>

  export type SessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    sid?: boolean
    sess?: boolean
    expire?: boolean
  }, ExtArgs["result"]["session"]>

  export type SessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    sid?: boolean
    sess?: boolean
    expire?: boolean
  }, ExtArgs["result"]["session"]>

  export type SessionSelectScalar = {
    sid?: boolean
    sess?: boolean
    expire?: boolean
  }

  export type SessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"sid" | "sess" | "expire", ExtArgs["result"]["session"]>

  export type $SessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Session"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      sid: string
      sess: Prisma.JsonValue
      expire: Date
    }, ExtArgs["result"]["session"]>
    composites: {}
  }

  type SessionGetPayload<S extends boolean | null | undefined | SessionDefaultArgs> = $Result.GetResult<Prisma.$SessionPayload, S>

  type SessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SessionCountAggregateInputType | true
    }

  export interface SessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Session'], meta: { name: 'Session' } }
    /**
     * Find zero or one Session that matches the filter.
     * @param {SessionFindUniqueArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SessionFindUniqueArgs>(args: SelectSubset<T, SessionFindUniqueArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Session that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SessionFindUniqueOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SessionFindUniqueOrThrowArgs>(args: SelectSubset<T, SessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SessionFindFirstArgs>(args?: SelectSubset<T, SessionFindFirstArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SessionFindFirstOrThrowArgs>(args?: SelectSubset<T, SessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sessions
     * const sessions = await prisma.session.findMany()
     * 
     * // Get first 10 Sessions
     * const sessions = await prisma.session.findMany({ take: 10 })
     * 
     * // Only select the `sid`
     * const sessionWithSidOnly = await prisma.session.findMany({ select: { sid: true } })
     * 
     */
    findMany<T extends SessionFindManyArgs>(args?: SelectSubset<T, SessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Session.
     * @param {SessionCreateArgs} args - Arguments to create a Session.
     * @example
     * // Create one Session
     * const Session = await prisma.session.create({
     *   data: {
     *     // ... data to create a Session
     *   }
     * })
     * 
     */
    create<T extends SessionCreateArgs>(args: SelectSubset<T, SessionCreateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sessions.
     * @param {SessionCreateManyArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SessionCreateManyArgs>(args?: SelectSubset<T, SessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sessions and returns the data saved in the database.
     * @param {SessionCreateManyAndReturnArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sessions and only return the `sid`
     * const sessionWithSidOnly = await prisma.session.createManyAndReturn({
     *   select: { sid: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SessionCreateManyAndReturnArgs>(args?: SelectSubset<T, SessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Session.
     * @param {SessionDeleteArgs} args - Arguments to delete one Session.
     * @example
     * // Delete one Session
     * const Session = await prisma.session.delete({
     *   where: {
     *     // ... filter to delete one Session
     *   }
     * })
     * 
     */
    delete<T extends SessionDeleteArgs>(args: SelectSubset<T, SessionDeleteArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Session.
     * @param {SessionUpdateArgs} args - Arguments to update one Session.
     * @example
     * // Update one Session
     * const session = await prisma.session.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SessionUpdateArgs>(args: SelectSubset<T, SessionUpdateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sessions.
     * @param {SessionDeleteManyArgs} args - Arguments to filter Sessions to delete.
     * @example
     * // Delete a few Sessions
     * const { count } = await prisma.session.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SessionDeleteManyArgs>(args?: SelectSubset<T, SessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SessionUpdateManyArgs>(args: SelectSubset<T, SessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions and returns the data updated in the database.
     * @param {SessionUpdateManyAndReturnArgs} args - Arguments to update many Sessions.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sessions and only return the `sid`
     * const sessionWithSidOnly = await prisma.session.updateManyAndReturn({
     *   select: { sid: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SessionUpdateManyAndReturnArgs>(args: SelectSubset<T, SessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Session.
     * @param {SessionUpsertArgs} args - Arguments to update or create a Session.
     * @example
     * // Update or create a Session
     * const session = await prisma.session.upsert({
     *   create: {
     *     // ... data to create a Session
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Session we want to update
     *   }
     * })
     */
    upsert<T extends SessionUpsertArgs>(args: SelectSubset<T, SessionUpsertArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionCountArgs} args - Arguments to filter Sessions to count.
     * @example
     * // Count the number of Sessions
     * const count = await prisma.session.count({
     *   where: {
     *     // ... the filter for the Sessions we want to count
     *   }
     * })
    **/
    count<T extends SessionCountArgs>(
      args?: Subset<T, SessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SessionAggregateArgs>(args: Subset<T, SessionAggregateArgs>): Prisma.PrismaPromise<GetSessionAggregateType<T>>

    /**
     * Group by Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SessionGroupByArgs['orderBy'] }
        : { orderBy?: SessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Session model
   */
  readonly fields: SessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Session.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Session model
   */
  interface SessionFieldRefs {
    readonly sid: FieldRef<"Session", 'String'>
    readonly sess: FieldRef<"Session", 'Json'>
    readonly expire: FieldRef<"Session", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Session findUnique
   */
  export type SessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findUniqueOrThrow
   */
  export type SessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findFirst
   */
  export type SessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findFirstOrThrow
   */
  export type SessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findMany
   */
  export type SessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Filter, which Sessions to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session create
   */
  export type SessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data needed to create a Session.
     */
    data: XOR<SessionCreateInput, SessionUncheckedCreateInput>
  }

  /**
   * Session createMany
   */
  export type SessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Session createManyAndReturn
   */
  export type SessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Session update
   */
  export type SessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data needed to update a Session.
     */
    data: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
    /**
     * Choose, which Session to update.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session updateMany
   */
  export type SessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to update.
     */
    limit?: number
  }

  /**
   * Session updateManyAndReturn
   */
  export type SessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to update.
     */
    limit?: number
  }

  /**
   * Session upsert
   */
  export type SessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The filter to search for the Session to update in case it exists.
     */
    where: SessionWhereUniqueInput
    /**
     * In case the Session found by the `where` argument doesn't exist, create a new Session with this data.
     */
    create: XOR<SessionCreateInput, SessionUncheckedCreateInput>
    /**
     * In case the Session was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
  }

  /**
   * Session delete
   */
  export type SessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Filter which Session to delete.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session deleteMany
   */
  export type SessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Sessions to delete
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to delete.
     */
    limit?: number
  }

  /**
   * Session without action
   */
  export type SessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
  }


  /**
   * Model SystemAlert
   */

  export type AggregateSystemAlert = {
    _count: SystemAlertCountAggregateOutputType | null
    _avg: SystemAlertAvgAggregateOutputType | null
    _sum: SystemAlertSumAggregateOutputType | null
    _min: SystemAlertMinAggregateOutputType | null
    _max: SystemAlertMaxAggregateOutputType | null
  }

  export type SystemAlertAvgAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type SystemAlertSumAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type SystemAlertMinAggregateOutputType = {
    id: number | null
    type: string | null
    title: string | null
    message: string | null
    isRead: boolean | null
    userId: number | null
    priority: string | null
    createdAt: Date | null
  }

  export type SystemAlertMaxAggregateOutputType = {
    id: number | null
    type: string | null
    title: string | null
    message: string | null
    isRead: boolean | null
    userId: number | null
    priority: string | null
    createdAt: Date | null
  }

  export type SystemAlertCountAggregateOutputType = {
    id: number
    type: number
    title: number
    message: number
    isRead: number
    userId: number
    data: number
    priority: number
    createdAt: number
    _all: number
  }


  export type SystemAlertAvgAggregateInputType = {
    id?: true
    userId?: true
  }

  export type SystemAlertSumAggregateInputType = {
    id?: true
    userId?: true
  }

  export type SystemAlertMinAggregateInputType = {
    id?: true
    type?: true
    title?: true
    message?: true
    isRead?: true
    userId?: true
    priority?: true
    createdAt?: true
  }

  export type SystemAlertMaxAggregateInputType = {
    id?: true
    type?: true
    title?: true
    message?: true
    isRead?: true
    userId?: true
    priority?: true
    createdAt?: true
  }

  export type SystemAlertCountAggregateInputType = {
    id?: true
    type?: true
    title?: true
    message?: true
    isRead?: true
    userId?: true
    data?: true
    priority?: true
    createdAt?: true
    _all?: true
  }

  export type SystemAlertAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SystemAlert to aggregate.
     */
    where?: SystemAlertWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SystemAlerts to fetch.
     */
    orderBy?: SystemAlertOrderByWithRelationInput | SystemAlertOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SystemAlertWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SystemAlerts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SystemAlerts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SystemAlerts
    **/
    _count?: true | SystemAlertCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SystemAlertAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SystemAlertSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SystemAlertMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SystemAlertMaxAggregateInputType
  }

  export type GetSystemAlertAggregateType<T extends SystemAlertAggregateArgs> = {
        [P in keyof T & keyof AggregateSystemAlert]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSystemAlert[P]>
      : GetScalarType<T[P], AggregateSystemAlert[P]>
  }




  export type SystemAlertGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SystemAlertWhereInput
    orderBy?: SystemAlertOrderByWithAggregationInput | SystemAlertOrderByWithAggregationInput[]
    by: SystemAlertScalarFieldEnum[] | SystemAlertScalarFieldEnum
    having?: SystemAlertScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SystemAlertCountAggregateInputType | true
    _avg?: SystemAlertAvgAggregateInputType
    _sum?: SystemAlertSumAggregateInputType
    _min?: SystemAlertMinAggregateInputType
    _max?: SystemAlertMaxAggregateInputType
  }

  export type SystemAlertGroupByOutputType = {
    id: number
    type: string
    title: string
    message: string
    isRead: boolean
    userId: number | null
    data: JsonValue | null
    priority: string
    createdAt: Date
    _count: SystemAlertCountAggregateOutputType | null
    _avg: SystemAlertAvgAggregateOutputType | null
    _sum: SystemAlertSumAggregateOutputType | null
    _min: SystemAlertMinAggregateOutputType | null
    _max: SystemAlertMaxAggregateOutputType | null
  }

  type GetSystemAlertGroupByPayload<T extends SystemAlertGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SystemAlertGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SystemAlertGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SystemAlertGroupByOutputType[P]>
            : GetScalarType<T[P], SystemAlertGroupByOutputType[P]>
        }
      >
    >


  export type SystemAlertSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    title?: boolean
    message?: boolean
    isRead?: boolean
    userId?: boolean
    data?: boolean
    priority?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["systemAlert"]>

  export type SystemAlertSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    title?: boolean
    message?: boolean
    isRead?: boolean
    userId?: boolean
    data?: boolean
    priority?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["systemAlert"]>

  export type SystemAlertSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    title?: boolean
    message?: boolean
    isRead?: boolean
    userId?: boolean
    data?: boolean
    priority?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["systemAlert"]>

  export type SystemAlertSelectScalar = {
    id?: boolean
    type?: boolean
    title?: boolean
    message?: boolean
    isRead?: boolean
    userId?: boolean
    data?: boolean
    priority?: boolean
    createdAt?: boolean
  }

  export type SystemAlertOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "type" | "title" | "message" | "isRead" | "userId" | "data" | "priority" | "createdAt", ExtArgs["result"]["systemAlert"]>

  export type $SystemAlertPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SystemAlert"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      type: string
      title: string
      message: string
      isRead: boolean
      userId: number | null
      data: Prisma.JsonValue | null
      priority: string
      createdAt: Date
    }, ExtArgs["result"]["systemAlert"]>
    composites: {}
  }

  type SystemAlertGetPayload<S extends boolean | null | undefined | SystemAlertDefaultArgs> = $Result.GetResult<Prisma.$SystemAlertPayload, S>

  type SystemAlertCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SystemAlertFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SystemAlertCountAggregateInputType | true
    }

  export interface SystemAlertDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SystemAlert'], meta: { name: 'SystemAlert' } }
    /**
     * Find zero or one SystemAlert that matches the filter.
     * @param {SystemAlertFindUniqueArgs} args - Arguments to find a SystemAlert
     * @example
     * // Get one SystemAlert
     * const systemAlert = await prisma.systemAlert.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SystemAlertFindUniqueArgs>(args: SelectSubset<T, SystemAlertFindUniqueArgs<ExtArgs>>): Prisma__SystemAlertClient<$Result.GetResult<Prisma.$SystemAlertPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SystemAlert that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SystemAlertFindUniqueOrThrowArgs} args - Arguments to find a SystemAlert
     * @example
     * // Get one SystemAlert
     * const systemAlert = await prisma.systemAlert.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SystemAlertFindUniqueOrThrowArgs>(args: SelectSubset<T, SystemAlertFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SystemAlertClient<$Result.GetResult<Prisma.$SystemAlertPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SystemAlert that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemAlertFindFirstArgs} args - Arguments to find a SystemAlert
     * @example
     * // Get one SystemAlert
     * const systemAlert = await prisma.systemAlert.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SystemAlertFindFirstArgs>(args?: SelectSubset<T, SystemAlertFindFirstArgs<ExtArgs>>): Prisma__SystemAlertClient<$Result.GetResult<Prisma.$SystemAlertPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SystemAlert that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemAlertFindFirstOrThrowArgs} args - Arguments to find a SystemAlert
     * @example
     * // Get one SystemAlert
     * const systemAlert = await prisma.systemAlert.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SystemAlertFindFirstOrThrowArgs>(args?: SelectSubset<T, SystemAlertFindFirstOrThrowArgs<ExtArgs>>): Prisma__SystemAlertClient<$Result.GetResult<Prisma.$SystemAlertPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SystemAlerts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemAlertFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SystemAlerts
     * const systemAlerts = await prisma.systemAlert.findMany()
     * 
     * // Get first 10 SystemAlerts
     * const systemAlerts = await prisma.systemAlert.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const systemAlertWithIdOnly = await prisma.systemAlert.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SystemAlertFindManyArgs>(args?: SelectSubset<T, SystemAlertFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SystemAlertPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SystemAlert.
     * @param {SystemAlertCreateArgs} args - Arguments to create a SystemAlert.
     * @example
     * // Create one SystemAlert
     * const SystemAlert = await prisma.systemAlert.create({
     *   data: {
     *     // ... data to create a SystemAlert
     *   }
     * })
     * 
     */
    create<T extends SystemAlertCreateArgs>(args: SelectSubset<T, SystemAlertCreateArgs<ExtArgs>>): Prisma__SystemAlertClient<$Result.GetResult<Prisma.$SystemAlertPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SystemAlerts.
     * @param {SystemAlertCreateManyArgs} args - Arguments to create many SystemAlerts.
     * @example
     * // Create many SystemAlerts
     * const systemAlert = await prisma.systemAlert.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SystemAlertCreateManyArgs>(args?: SelectSubset<T, SystemAlertCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SystemAlerts and returns the data saved in the database.
     * @param {SystemAlertCreateManyAndReturnArgs} args - Arguments to create many SystemAlerts.
     * @example
     * // Create many SystemAlerts
     * const systemAlert = await prisma.systemAlert.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SystemAlerts and only return the `id`
     * const systemAlertWithIdOnly = await prisma.systemAlert.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SystemAlertCreateManyAndReturnArgs>(args?: SelectSubset<T, SystemAlertCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SystemAlertPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SystemAlert.
     * @param {SystemAlertDeleteArgs} args - Arguments to delete one SystemAlert.
     * @example
     * // Delete one SystemAlert
     * const SystemAlert = await prisma.systemAlert.delete({
     *   where: {
     *     // ... filter to delete one SystemAlert
     *   }
     * })
     * 
     */
    delete<T extends SystemAlertDeleteArgs>(args: SelectSubset<T, SystemAlertDeleteArgs<ExtArgs>>): Prisma__SystemAlertClient<$Result.GetResult<Prisma.$SystemAlertPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SystemAlert.
     * @param {SystemAlertUpdateArgs} args - Arguments to update one SystemAlert.
     * @example
     * // Update one SystemAlert
     * const systemAlert = await prisma.systemAlert.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SystemAlertUpdateArgs>(args: SelectSubset<T, SystemAlertUpdateArgs<ExtArgs>>): Prisma__SystemAlertClient<$Result.GetResult<Prisma.$SystemAlertPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SystemAlerts.
     * @param {SystemAlertDeleteManyArgs} args - Arguments to filter SystemAlerts to delete.
     * @example
     * // Delete a few SystemAlerts
     * const { count } = await prisma.systemAlert.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SystemAlertDeleteManyArgs>(args?: SelectSubset<T, SystemAlertDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SystemAlerts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemAlertUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SystemAlerts
     * const systemAlert = await prisma.systemAlert.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SystemAlertUpdateManyArgs>(args: SelectSubset<T, SystemAlertUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SystemAlerts and returns the data updated in the database.
     * @param {SystemAlertUpdateManyAndReturnArgs} args - Arguments to update many SystemAlerts.
     * @example
     * // Update many SystemAlerts
     * const systemAlert = await prisma.systemAlert.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SystemAlerts and only return the `id`
     * const systemAlertWithIdOnly = await prisma.systemAlert.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SystemAlertUpdateManyAndReturnArgs>(args: SelectSubset<T, SystemAlertUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SystemAlertPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SystemAlert.
     * @param {SystemAlertUpsertArgs} args - Arguments to update or create a SystemAlert.
     * @example
     * // Update or create a SystemAlert
     * const systemAlert = await prisma.systemAlert.upsert({
     *   create: {
     *     // ... data to create a SystemAlert
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SystemAlert we want to update
     *   }
     * })
     */
    upsert<T extends SystemAlertUpsertArgs>(args: SelectSubset<T, SystemAlertUpsertArgs<ExtArgs>>): Prisma__SystemAlertClient<$Result.GetResult<Prisma.$SystemAlertPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SystemAlerts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemAlertCountArgs} args - Arguments to filter SystemAlerts to count.
     * @example
     * // Count the number of SystemAlerts
     * const count = await prisma.systemAlert.count({
     *   where: {
     *     // ... the filter for the SystemAlerts we want to count
     *   }
     * })
    **/
    count<T extends SystemAlertCountArgs>(
      args?: Subset<T, SystemAlertCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SystemAlertCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SystemAlert.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemAlertAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SystemAlertAggregateArgs>(args: Subset<T, SystemAlertAggregateArgs>): Prisma.PrismaPromise<GetSystemAlertAggregateType<T>>

    /**
     * Group by SystemAlert.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemAlertGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SystemAlertGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SystemAlertGroupByArgs['orderBy'] }
        : { orderBy?: SystemAlertGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SystemAlertGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSystemAlertGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SystemAlert model
   */
  readonly fields: SystemAlertFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SystemAlert.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SystemAlertClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SystemAlert model
   */
  interface SystemAlertFieldRefs {
    readonly id: FieldRef<"SystemAlert", 'Int'>
    readonly type: FieldRef<"SystemAlert", 'String'>
    readonly title: FieldRef<"SystemAlert", 'String'>
    readonly message: FieldRef<"SystemAlert", 'String'>
    readonly isRead: FieldRef<"SystemAlert", 'Boolean'>
    readonly userId: FieldRef<"SystemAlert", 'Int'>
    readonly data: FieldRef<"SystemAlert", 'Json'>
    readonly priority: FieldRef<"SystemAlert", 'String'>
    readonly createdAt: FieldRef<"SystemAlert", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SystemAlert findUnique
   */
  export type SystemAlertFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
    /**
     * Filter, which SystemAlert to fetch.
     */
    where: SystemAlertWhereUniqueInput
  }

  /**
   * SystemAlert findUniqueOrThrow
   */
  export type SystemAlertFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
    /**
     * Filter, which SystemAlert to fetch.
     */
    where: SystemAlertWhereUniqueInput
  }

  /**
   * SystemAlert findFirst
   */
  export type SystemAlertFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
    /**
     * Filter, which SystemAlert to fetch.
     */
    where?: SystemAlertWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SystemAlerts to fetch.
     */
    orderBy?: SystemAlertOrderByWithRelationInput | SystemAlertOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SystemAlerts.
     */
    cursor?: SystemAlertWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SystemAlerts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SystemAlerts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SystemAlerts.
     */
    distinct?: SystemAlertScalarFieldEnum | SystemAlertScalarFieldEnum[]
  }

  /**
   * SystemAlert findFirstOrThrow
   */
  export type SystemAlertFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
    /**
     * Filter, which SystemAlert to fetch.
     */
    where?: SystemAlertWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SystemAlerts to fetch.
     */
    orderBy?: SystemAlertOrderByWithRelationInput | SystemAlertOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SystemAlerts.
     */
    cursor?: SystemAlertWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SystemAlerts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SystemAlerts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SystemAlerts.
     */
    distinct?: SystemAlertScalarFieldEnum | SystemAlertScalarFieldEnum[]
  }

  /**
   * SystemAlert findMany
   */
  export type SystemAlertFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
    /**
     * Filter, which SystemAlerts to fetch.
     */
    where?: SystemAlertWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SystemAlerts to fetch.
     */
    orderBy?: SystemAlertOrderByWithRelationInput | SystemAlertOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SystemAlerts.
     */
    cursor?: SystemAlertWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SystemAlerts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SystemAlerts.
     */
    skip?: number
    distinct?: SystemAlertScalarFieldEnum | SystemAlertScalarFieldEnum[]
  }

  /**
   * SystemAlert create
   */
  export type SystemAlertCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
    /**
     * The data needed to create a SystemAlert.
     */
    data: XOR<SystemAlertCreateInput, SystemAlertUncheckedCreateInput>
  }

  /**
   * SystemAlert createMany
   */
  export type SystemAlertCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SystemAlerts.
     */
    data: SystemAlertCreateManyInput | SystemAlertCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SystemAlert createManyAndReturn
   */
  export type SystemAlertCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
    /**
     * The data used to create many SystemAlerts.
     */
    data: SystemAlertCreateManyInput | SystemAlertCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SystemAlert update
   */
  export type SystemAlertUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
    /**
     * The data needed to update a SystemAlert.
     */
    data: XOR<SystemAlertUpdateInput, SystemAlertUncheckedUpdateInput>
    /**
     * Choose, which SystemAlert to update.
     */
    where: SystemAlertWhereUniqueInput
  }

  /**
   * SystemAlert updateMany
   */
  export type SystemAlertUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SystemAlerts.
     */
    data: XOR<SystemAlertUpdateManyMutationInput, SystemAlertUncheckedUpdateManyInput>
    /**
     * Filter which SystemAlerts to update
     */
    where?: SystemAlertWhereInput
    /**
     * Limit how many SystemAlerts to update.
     */
    limit?: number
  }

  /**
   * SystemAlert updateManyAndReturn
   */
  export type SystemAlertUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
    /**
     * The data used to update SystemAlerts.
     */
    data: XOR<SystemAlertUpdateManyMutationInput, SystemAlertUncheckedUpdateManyInput>
    /**
     * Filter which SystemAlerts to update
     */
    where?: SystemAlertWhereInput
    /**
     * Limit how many SystemAlerts to update.
     */
    limit?: number
  }

  /**
   * SystemAlert upsert
   */
  export type SystemAlertUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
    /**
     * The filter to search for the SystemAlert to update in case it exists.
     */
    where: SystemAlertWhereUniqueInput
    /**
     * In case the SystemAlert found by the `where` argument doesn't exist, create a new SystemAlert with this data.
     */
    create: XOR<SystemAlertCreateInput, SystemAlertUncheckedCreateInput>
    /**
     * In case the SystemAlert was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SystemAlertUpdateInput, SystemAlertUncheckedUpdateInput>
  }

  /**
   * SystemAlert delete
   */
  export type SystemAlertDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
    /**
     * Filter which SystemAlert to delete.
     */
    where: SystemAlertWhereUniqueInput
  }

  /**
   * SystemAlert deleteMany
   */
  export type SystemAlertDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SystemAlerts to delete
     */
    where?: SystemAlertWhereInput
    /**
     * Limit how many SystemAlerts to delete.
     */
    limit?: number
  }

  /**
   * SystemAlert without action
   */
  export type SystemAlertDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SystemAlert
     */
    select?: SystemAlertSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SystemAlert
     */
    omit?: SystemAlertOmit<ExtArgs> | null
  }


  /**
   * Model Trade
   */

  export type AggregateTrade = {
    _count: TradeCountAggregateOutputType | null
    _avg: TradeAvgAggregateOutputType | null
    _sum: TradeSumAggregateOutputType | null
    _min: TradeMinAggregateOutputType | null
    _max: TradeMaxAggregateOutputType | null
  }

  export type TradeAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    positionId: number | null
    quantity: Decimal | null
    price: Decimal | null
    fee: Decimal | null
  }

  export type TradeSumAggregateOutputType = {
    id: number | null
    userId: number | null
    positionId: number | null
    quantity: Decimal | null
    price: Decimal | null
    fee: Decimal | null
  }

  export type TradeMinAggregateOutputType = {
    id: number | null
    userId: number | null
    positionId: number | null
    symbol: string | null
    side: string | null
    exchange: string | null
    quantity: Decimal | null
    price: Decimal | null
    fee: Decimal | null
    orderType: string | null
    exchangeOrderId: string | null
    exchangeTradeId: string | null
    executedAt: Date | null
    createdAt: Date | null
  }

  export type TradeMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    positionId: number | null
    symbol: string | null
    side: string | null
    exchange: string | null
    quantity: Decimal | null
    price: Decimal | null
    fee: Decimal | null
    orderType: string | null
    exchangeOrderId: string | null
    exchangeTradeId: string | null
    executedAt: Date | null
    createdAt: Date | null
  }

  export type TradeCountAggregateOutputType = {
    id: number
    userId: number
    positionId: number
    symbol: number
    side: number
    exchange: number
    quantity: number
    price: number
    fee: number
    orderType: number
    exchangeOrderId: number
    exchangeTradeId: number
    executedAt: number
    createdAt: number
    _all: number
  }


  export type TradeAvgAggregateInputType = {
    id?: true
    userId?: true
    positionId?: true
    quantity?: true
    price?: true
    fee?: true
  }

  export type TradeSumAggregateInputType = {
    id?: true
    userId?: true
    positionId?: true
    quantity?: true
    price?: true
    fee?: true
  }

  export type TradeMinAggregateInputType = {
    id?: true
    userId?: true
    positionId?: true
    symbol?: true
    side?: true
    exchange?: true
    quantity?: true
    price?: true
    fee?: true
    orderType?: true
    exchangeOrderId?: true
    exchangeTradeId?: true
    executedAt?: true
    createdAt?: true
  }

  export type TradeMaxAggregateInputType = {
    id?: true
    userId?: true
    positionId?: true
    symbol?: true
    side?: true
    exchange?: true
    quantity?: true
    price?: true
    fee?: true
    orderType?: true
    exchangeOrderId?: true
    exchangeTradeId?: true
    executedAt?: true
    createdAt?: true
  }

  export type TradeCountAggregateInputType = {
    id?: true
    userId?: true
    positionId?: true
    symbol?: true
    side?: true
    exchange?: true
    quantity?: true
    price?: true
    fee?: true
    orderType?: true
    exchangeOrderId?: true
    exchangeTradeId?: true
    executedAt?: true
    createdAt?: true
    _all?: true
  }

  export type TradeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Trade to aggregate.
     */
    where?: TradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Trades to fetch.
     */
    orderBy?: TradeOrderByWithRelationInput | TradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Trades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Trades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Trades
    **/
    _count?: true | TradeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TradeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TradeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TradeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TradeMaxAggregateInputType
  }

  export type GetTradeAggregateType<T extends TradeAggregateArgs> = {
        [P in keyof T & keyof AggregateTrade]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTrade[P]>
      : GetScalarType<T[P], AggregateTrade[P]>
  }




  export type TradeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TradeWhereInput
    orderBy?: TradeOrderByWithAggregationInput | TradeOrderByWithAggregationInput[]
    by: TradeScalarFieldEnum[] | TradeScalarFieldEnum
    having?: TradeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TradeCountAggregateInputType | true
    _avg?: TradeAvgAggregateInputType
    _sum?: TradeSumAggregateInputType
    _min?: TradeMinAggregateInputType
    _max?: TradeMaxAggregateInputType
  }

  export type TradeGroupByOutputType = {
    id: number
    userId: number
    positionId: number | null
    symbol: string
    side: string
    exchange: string
    quantity: Decimal
    price: Decimal
    fee: Decimal
    orderType: string
    exchangeOrderId: string | null
    exchangeTradeId: string | null
    executedAt: Date
    createdAt: Date
    _count: TradeCountAggregateOutputType | null
    _avg: TradeAvgAggregateOutputType | null
    _sum: TradeSumAggregateOutputType | null
    _min: TradeMinAggregateOutputType | null
    _max: TradeMaxAggregateOutputType | null
  }

  type GetTradeGroupByPayload<T extends TradeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TradeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TradeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TradeGroupByOutputType[P]>
            : GetScalarType<T[P], TradeGroupByOutputType[P]>
        }
      >
    >


  export type TradeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    positionId?: boolean
    symbol?: boolean
    side?: boolean
    exchange?: boolean
    quantity?: boolean
    price?: boolean
    fee?: boolean
    orderType?: boolean
    exchangeOrderId?: boolean
    exchangeTradeId?: boolean
    executedAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["trade"]>

  export type TradeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    positionId?: boolean
    symbol?: boolean
    side?: boolean
    exchange?: boolean
    quantity?: boolean
    price?: boolean
    fee?: boolean
    orderType?: boolean
    exchangeOrderId?: boolean
    exchangeTradeId?: boolean
    executedAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["trade"]>

  export type TradeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    positionId?: boolean
    symbol?: boolean
    side?: boolean
    exchange?: boolean
    quantity?: boolean
    price?: boolean
    fee?: boolean
    orderType?: boolean
    exchangeOrderId?: boolean
    exchangeTradeId?: boolean
    executedAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["trade"]>

  export type TradeSelectScalar = {
    id?: boolean
    userId?: boolean
    positionId?: boolean
    symbol?: boolean
    side?: boolean
    exchange?: boolean
    quantity?: boolean
    price?: boolean
    fee?: boolean
    orderType?: boolean
    exchangeOrderId?: boolean
    exchangeTradeId?: boolean
    executedAt?: boolean
    createdAt?: boolean
  }

  export type TradeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "positionId" | "symbol" | "side" | "exchange" | "quantity" | "price" | "fee" | "orderType" | "exchangeOrderId" | "exchangeTradeId" | "executedAt" | "createdAt", ExtArgs["result"]["trade"]>

  export type $TradePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Trade"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      positionId: number | null
      symbol: string
      side: string
      exchange: string
      quantity: Prisma.Decimal
      price: Prisma.Decimal
      fee: Prisma.Decimal
      orderType: string
      exchangeOrderId: string | null
      exchangeTradeId: string | null
      executedAt: Date
      createdAt: Date
    }, ExtArgs["result"]["trade"]>
    composites: {}
  }

  type TradeGetPayload<S extends boolean | null | undefined | TradeDefaultArgs> = $Result.GetResult<Prisma.$TradePayload, S>

  type TradeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TradeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TradeCountAggregateInputType | true
    }

  export interface TradeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Trade'], meta: { name: 'Trade' } }
    /**
     * Find zero or one Trade that matches the filter.
     * @param {TradeFindUniqueArgs} args - Arguments to find a Trade
     * @example
     * // Get one Trade
     * const trade = await prisma.trade.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TradeFindUniqueArgs>(args: SelectSubset<T, TradeFindUniqueArgs<ExtArgs>>): Prisma__TradeClient<$Result.GetResult<Prisma.$TradePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Trade that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TradeFindUniqueOrThrowArgs} args - Arguments to find a Trade
     * @example
     * // Get one Trade
     * const trade = await prisma.trade.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TradeFindUniqueOrThrowArgs>(args: SelectSubset<T, TradeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TradeClient<$Result.GetResult<Prisma.$TradePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Trade that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeFindFirstArgs} args - Arguments to find a Trade
     * @example
     * // Get one Trade
     * const trade = await prisma.trade.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TradeFindFirstArgs>(args?: SelectSubset<T, TradeFindFirstArgs<ExtArgs>>): Prisma__TradeClient<$Result.GetResult<Prisma.$TradePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Trade that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeFindFirstOrThrowArgs} args - Arguments to find a Trade
     * @example
     * // Get one Trade
     * const trade = await prisma.trade.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TradeFindFirstOrThrowArgs>(args?: SelectSubset<T, TradeFindFirstOrThrowArgs<ExtArgs>>): Prisma__TradeClient<$Result.GetResult<Prisma.$TradePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Trades that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Trades
     * const trades = await prisma.trade.findMany()
     * 
     * // Get first 10 Trades
     * const trades = await prisma.trade.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tradeWithIdOnly = await prisma.trade.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TradeFindManyArgs>(args?: SelectSubset<T, TradeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Trade.
     * @param {TradeCreateArgs} args - Arguments to create a Trade.
     * @example
     * // Create one Trade
     * const Trade = await prisma.trade.create({
     *   data: {
     *     // ... data to create a Trade
     *   }
     * })
     * 
     */
    create<T extends TradeCreateArgs>(args: SelectSubset<T, TradeCreateArgs<ExtArgs>>): Prisma__TradeClient<$Result.GetResult<Prisma.$TradePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Trades.
     * @param {TradeCreateManyArgs} args - Arguments to create many Trades.
     * @example
     * // Create many Trades
     * const trade = await prisma.trade.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TradeCreateManyArgs>(args?: SelectSubset<T, TradeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Trades and returns the data saved in the database.
     * @param {TradeCreateManyAndReturnArgs} args - Arguments to create many Trades.
     * @example
     * // Create many Trades
     * const trade = await prisma.trade.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Trades and only return the `id`
     * const tradeWithIdOnly = await prisma.trade.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TradeCreateManyAndReturnArgs>(args?: SelectSubset<T, TradeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Trade.
     * @param {TradeDeleteArgs} args - Arguments to delete one Trade.
     * @example
     * // Delete one Trade
     * const Trade = await prisma.trade.delete({
     *   where: {
     *     // ... filter to delete one Trade
     *   }
     * })
     * 
     */
    delete<T extends TradeDeleteArgs>(args: SelectSubset<T, TradeDeleteArgs<ExtArgs>>): Prisma__TradeClient<$Result.GetResult<Prisma.$TradePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Trade.
     * @param {TradeUpdateArgs} args - Arguments to update one Trade.
     * @example
     * // Update one Trade
     * const trade = await prisma.trade.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TradeUpdateArgs>(args: SelectSubset<T, TradeUpdateArgs<ExtArgs>>): Prisma__TradeClient<$Result.GetResult<Prisma.$TradePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Trades.
     * @param {TradeDeleteManyArgs} args - Arguments to filter Trades to delete.
     * @example
     * // Delete a few Trades
     * const { count } = await prisma.trade.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TradeDeleteManyArgs>(args?: SelectSubset<T, TradeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Trades.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Trades
     * const trade = await prisma.trade.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TradeUpdateManyArgs>(args: SelectSubset<T, TradeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Trades and returns the data updated in the database.
     * @param {TradeUpdateManyAndReturnArgs} args - Arguments to update many Trades.
     * @example
     * // Update many Trades
     * const trade = await prisma.trade.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Trades and only return the `id`
     * const tradeWithIdOnly = await prisma.trade.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TradeUpdateManyAndReturnArgs>(args: SelectSubset<T, TradeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Trade.
     * @param {TradeUpsertArgs} args - Arguments to update or create a Trade.
     * @example
     * // Update or create a Trade
     * const trade = await prisma.trade.upsert({
     *   create: {
     *     // ... data to create a Trade
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Trade we want to update
     *   }
     * })
     */
    upsert<T extends TradeUpsertArgs>(args: SelectSubset<T, TradeUpsertArgs<ExtArgs>>): Prisma__TradeClient<$Result.GetResult<Prisma.$TradePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Trades.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeCountArgs} args - Arguments to filter Trades to count.
     * @example
     * // Count the number of Trades
     * const count = await prisma.trade.count({
     *   where: {
     *     // ... the filter for the Trades we want to count
     *   }
     * })
    **/
    count<T extends TradeCountArgs>(
      args?: Subset<T, TradeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TradeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Trade.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TradeAggregateArgs>(args: Subset<T, TradeAggregateArgs>): Prisma.PrismaPromise<GetTradeAggregateType<T>>

    /**
     * Group by Trade.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TradeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TradeGroupByArgs['orderBy'] }
        : { orderBy?: TradeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TradeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTradeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Trade model
   */
  readonly fields: TradeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Trade.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TradeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Trade model
   */
  interface TradeFieldRefs {
    readonly id: FieldRef<"Trade", 'Int'>
    readonly userId: FieldRef<"Trade", 'Int'>
    readonly positionId: FieldRef<"Trade", 'Int'>
    readonly symbol: FieldRef<"Trade", 'String'>
    readonly side: FieldRef<"Trade", 'String'>
    readonly exchange: FieldRef<"Trade", 'String'>
    readonly quantity: FieldRef<"Trade", 'Decimal'>
    readonly price: FieldRef<"Trade", 'Decimal'>
    readonly fee: FieldRef<"Trade", 'Decimal'>
    readonly orderType: FieldRef<"Trade", 'String'>
    readonly exchangeOrderId: FieldRef<"Trade", 'String'>
    readonly exchangeTradeId: FieldRef<"Trade", 'String'>
    readonly executedAt: FieldRef<"Trade", 'DateTime'>
    readonly createdAt: FieldRef<"Trade", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Trade findUnique
   */
  export type TradeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
    /**
     * Filter, which Trade to fetch.
     */
    where: TradeWhereUniqueInput
  }

  /**
   * Trade findUniqueOrThrow
   */
  export type TradeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
    /**
     * Filter, which Trade to fetch.
     */
    where: TradeWhereUniqueInput
  }

  /**
   * Trade findFirst
   */
  export type TradeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
    /**
     * Filter, which Trade to fetch.
     */
    where?: TradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Trades to fetch.
     */
    orderBy?: TradeOrderByWithRelationInput | TradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Trades.
     */
    cursor?: TradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Trades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Trades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Trades.
     */
    distinct?: TradeScalarFieldEnum | TradeScalarFieldEnum[]
  }

  /**
   * Trade findFirstOrThrow
   */
  export type TradeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
    /**
     * Filter, which Trade to fetch.
     */
    where?: TradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Trades to fetch.
     */
    orderBy?: TradeOrderByWithRelationInput | TradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Trades.
     */
    cursor?: TradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Trades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Trades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Trades.
     */
    distinct?: TradeScalarFieldEnum | TradeScalarFieldEnum[]
  }

  /**
   * Trade findMany
   */
  export type TradeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
    /**
     * Filter, which Trades to fetch.
     */
    where?: TradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Trades to fetch.
     */
    orderBy?: TradeOrderByWithRelationInput | TradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Trades.
     */
    cursor?: TradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Trades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Trades.
     */
    skip?: number
    distinct?: TradeScalarFieldEnum | TradeScalarFieldEnum[]
  }

  /**
   * Trade create
   */
  export type TradeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
    /**
     * The data needed to create a Trade.
     */
    data: XOR<TradeCreateInput, TradeUncheckedCreateInput>
  }

  /**
   * Trade createMany
   */
  export type TradeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Trades.
     */
    data: TradeCreateManyInput | TradeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Trade createManyAndReturn
   */
  export type TradeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
    /**
     * The data used to create many Trades.
     */
    data: TradeCreateManyInput | TradeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Trade update
   */
  export type TradeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
    /**
     * The data needed to update a Trade.
     */
    data: XOR<TradeUpdateInput, TradeUncheckedUpdateInput>
    /**
     * Choose, which Trade to update.
     */
    where: TradeWhereUniqueInput
  }

  /**
   * Trade updateMany
   */
  export type TradeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Trades.
     */
    data: XOR<TradeUpdateManyMutationInput, TradeUncheckedUpdateManyInput>
    /**
     * Filter which Trades to update
     */
    where?: TradeWhereInput
    /**
     * Limit how many Trades to update.
     */
    limit?: number
  }

  /**
   * Trade updateManyAndReturn
   */
  export type TradeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
    /**
     * The data used to update Trades.
     */
    data: XOR<TradeUpdateManyMutationInput, TradeUncheckedUpdateManyInput>
    /**
     * Filter which Trades to update
     */
    where?: TradeWhereInput
    /**
     * Limit how many Trades to update.
     */
    limit?: number
  }

  /**
   * Trade upsert
   */
  export type TradeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
    /**
     * The filter to search for the Trade to update in case it exists.
     */
    where: TradeWhereUniqueInput
    /**
     * In case the Trade found by the `where` argument doesn't exist, create a new Trade with this data.
     */
    create: XOR<TradeCreateInput, TradeUncheckedCreateInput>
    /**
     * In case the Trade was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TradeUpdateInput, TradeUncheckedUpdateInput>
  }

  /**
   * Trade delete
   */
  export type TradeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
    /**
     * Filter which Trade to delete.
     */
    where: TradeWhereUniqueInput
  }

  /**
   * Trade deleteMany
   */
  export type TradeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Trades to delete
     */
    where?: TradeWhereInput
    /**
     * Limit how many Trades to delete.
     */
    limit?: number
  }

  /**
   * Trade without action
   */
  export type TradeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Trade
     */
    select?: TradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Trade
     */
    omit?: TradeOmit<ExtArgs> | null
  }


  /**
   * Model TradingSetting
   */

  export type AggregateTradingSetting = {
    _count: TradingSettingCountAggregateOutputType | null
    _avg: TradingSettingAvgAggregateOutputType | null
    _sum: TradingSettingSumAggregateOutputType | null
    _min: TradingSettingMinAggregateOutputType | null
    _max: TradingSettingMaxAggregateOutputType | null
  }

  export type TradingSettingAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    entryPremiumRate: Decimal | null
    exitPremiumRate: Decimal | null
    stopLossRate: Decimal | null
    maxPositions: number | null
    maxInvestmentAmount: Decimal | null
    kimchiEntryRate: Decimal | null
    kimchiExitRate: Decimal | null
    kimchiToleranceRate: Decimal | null
    binanceLeverage: number | null
    upbitEntryAmount: Decimal | null
    dailyLossLimit: Decimal | null
    maxPositionSize: Decimal | null
  }

  export type TradingSettingSumAggregateOutputType = {
    id: number | null
    userId: number | null
    entryPremiumRate: Decimal | null
    exitPremiumRate: Decimal | null
    stopLossRate: Decimal | null
    maxPositions: number | null
    maxInvestmentAmount: Decimal | null
    kimchiEntryRate: Decimal | null
    kimchiExitRate: Decimal | null
    kimchiToleranceRate: Decimal | null
    binanceLeverage: number | null
    upbitEntryAmount: Decimal | null
    dailyLossLimit: Decimal | null
    maxPositionSize: Decimal | null
  }

  export type TradingSettingMinAggregateOutputType = {
    id: number | null
    userId: number | null
    entryPremiumRate: Decimal | null
    exitPremiumRate: Decimal | null
    stopLossRate: Decimal | null
    maxPositions: number | null
    isAutoTrading: boolean | null
    maxInvestmentAmount: Decimal | null
    kimchiEntryRate: Decimal | null
    kimchiExitRate: Decimal | null
    kimchiToleranceRate: Decimal | null
    binanceLeverage: number | null
    upbitEntryAmount: Decimal | null
    dailyLossLimit: Decimal | null
    maxPositionSize: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TradingSettingMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    entryPremiumRate: Decimal | null
    exitPremiumRate: Decimal | null
    stopLossRate: Decimal | null
    maxPositions: number | null
    isAutoTrading: boolean | null
    maxInvestmentAmount: Decimal | null
    kimchiEntryRate: Decimal | null
    kimchiExitRate: Decimal | null
    kimchiToleranceRate: Decimal | null
    binanceLeverage: number | null
    upbitEntryAmount: Decimal | null
    dailyLossLimit: Decimal | null
    maxPositionSize: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TradingSettingCountAggregateOutputType = {
    id: number
    userId: number
    entryPremiumRate: number
    exitPremiumRate: number
    stopLossRate: number
    maxPositions: number
    isAutoTrading: number
    maxInvestmentAmount: number
    kimchiEntryRate: number
    kimchiExitRate: number
    kimchiToleranceRate: number
    binanceLeverage: number
    upbitEntryAmount: number
    dailyLossLimit: number
    maxPositionSize: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TradingSettingAvgAggregateInputType = {
    id?: true
    userId?: true
    entryPremiumRate?: true
    exitPremiumRate?: true
    stopLossRate?: true
    maxPositions?: true
    maxInvestmentAmount?: true
    kimchiEntryRate?: true
    kimchiExitRate?: true
    kimchiToleranceRate?: true
    binanceLeverage?: true
    upbitEntryAmount?: true
    dailyLossLimit?: true
    maxPositionSize?: true
  }

  export type TradingSettingSumAggregateInputType = {
    id?: true
    userId?: true
    entryPremiumRate?: true
    exitPremiumRate?: true
    stopLossRate?: true
    maxPositions?: true
    maxInvestmentAmount?: true
    kimchiEntryRate?: true
    kimchiExitRate?: true
    kimchiToleranceRate?: true
    binanceLeverage?: true
    upbitEntryAmount?: true
    dailyLossLimit?: true
    maxPositionSize?: true
  }

  export type TradingSettingMinAggregateInputType = {
    id?: true
    userId?: true
    entryPremiumRate?: true
    exitPremiumRate?: true
    stopLossRate?: true
    maxPositions?: true
    isAutoTrading?: true
    maxInvestmentAmount?: true
    kimchiEntryRate?: true
    kimchiExitRate?: true
    kimchiToleranceRate?: true
    binanceLeverage?: true
    upbitEntryAmount?: true
    dailyLossLimit?: true
    maxPositionSize?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TradingSettingMaxAggregateInputType = {
    id?: true
    userId?: true
    entryPremiumRate?: true
    exitPremiumRate?: true
    stopLossRate?: true
    maxPositions?: true
    isAutoTrading?: true
    maxInvestmentAmount?: true
    kimchiEntryRate?: true
    kimchiExitRate?: true
    kimchiToleranceRate?: true
    binanceLeverage?: true
    upbitEntryAmount?: true
    dailyLossLimit?: true
    maxPositionSize?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TradingSettingCountAggregateInputType = {
    id?: true
    userId?: true
    entryPremiumRate?: true
    exitPremiumRate?: true
    stopLossRate?: true
    maxPositions?: true
    isAutoTrading?: true
    maxInvestmentAmount?: true
    kimchiEntryRate?: true
    kimchiExitRate?: true
    kimchiToleranceRate?: true
    binanceLeverage?: true
    upbitEntryAmount?: true
    dailyLossLimit?: true
    maxPositionSize?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TradingSettingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TradingSetting to aggregate.
     */
    where?: TradingSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradingSettings to fetch.
     */
    orderBy?: TradingSettingOrderByWithRelationInput | TradingSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TradingSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradingSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradingSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TradingSettings
    **/
    _count?: true | TradingSettingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TradingSettingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TradingSettingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TradingSettingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TradingSettingMaxAggregateInputType
  }

  export type GetTradingSettingAggregateType<T extends TradingSettingAggregateArgs> = {
        [P in keyof T & keyof AggregateTradingSetting]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTradingSetting[P]>
      : GetScalarType<T[P], AggregateTradingSetting[P]>
  }




  export type TradingSettingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TradingSettingWhereInput
    orderBy?: TradingSettingOrderByWithAggregationInput | TradingSettingOrderByWithAggregationInput[]
    by: TradingSettingScalarFieldEnum[] | TradingSettingScalarFieldEnum
    having?: TradingSettingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TradingSettingCountAggregateInputType | true
    _avg?: TradingSettingAvgAggregateInputType
    _sum?: TradingSettingSumAggregateInputType
    _min?: TradingSettingMinAggregateInputType
    _max?: TradingSettingMaxAggregateInputType
  }

  export type TradingSettingGroupByOutputType = {
    id: number
    userId: number
    entryPremiumRate: Decimal
    exitPremiumRate: Decimal
    stopLossRate: Decimal
    maxPositions: number
    isAutoTrading: boolean
    maxInvestmentAmount: Decimal
    kimchiEntryRate: Decimal
    kimchiExitRate: Decimal
    kimchiToleranceRate: Decimal
    binanceLeverage: number
    upbitEntryAmount: Decimal
    dailyLossLimit: Decimal
    maxPositionSize: Decimal
    createdAt: Date
    updatedAt: Date
    _count: TradingSettingCountAggregateOutputType | null
    _avg: TradingSettingAvgAggregateOutputType | null
    _sum: TradingSettingSumAggregateOutputType | null
    _min: TradingSettingMinAggregateOutputType | null
    _max: TradingSettingMaxAggregateOutputType | null
  }

  type GetTradingSettingGroupByPayload<T extends TradingSettingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TradingSettingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TradingSettingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TradingSettingGroupByOutputType[P]>
            : GetScalarType<T[P], TradingSettingGroupByOutputType[P]>
        }
      >
    >


  export type TradingSettingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    entryPremiumRate?: boolean
    exitPremiumRate?: boolean
    stopLossRate?: boolean
    maxPositions?: boolean
    isAutoTrading?: boolean
    maxInvestmentAmount?: boolean
    kimchiEntryRate?: boolean
    kimchiExitRate?: boolean
    kimchiToleranceRate?: boolean
    binanceLeverage?: boolean
    upbitEntryAmount?: boolean
    dailyLossLimit?: boolean
    maxPositionSize?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["tradingSetting"]>

  export type TradingSettingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    entryPremiumRate?: boolean
    exitPremiumRate?: boolean
    stopLossRate?: boolean
    maxPositions?: boolean
    isAutoTrading?: boolean
    maxInvestmentAmount?: boolean
    kimchiEntryRate?: boolean
    kimchiExitRate?: boolean
    kimchiToleranceRate?: boolean
    binanceLeverage?: boolean
    upbitEntryAmount?: boolean
    dailyLossLimit?: boolean
    maxPositionSize?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["tradingSetting"]>

  export type TradingSettingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    entryPremiumRate?: boolean
    exitPremiumRate?: boolean
    stopLossRate?: boolean
    maxPositions?: boolean
    isAutoTrading?: boolean
    maxInvestmentAmount?: boolean
    kimchiEntryRate?: boolean
    kimchiExitRate?: boolean
    kimchiToleranceRate?: boolean
    binanceLeverage?: boolean
    upbitEntryAmount?: boolean
    dailyLossLimit?: boolean
    maxPositionSize?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["tradingSetting"]>

  export type TradingSettingSelectScalar = {
    id?: boolean
    userId?: boolean
    entryPremiumRate?: boolean
    exitPremiumRate?: boolean
    stopLossRate?: boolean
    maxPositions?: boolean
    isAutoTrading?: boolean
    maxInvestmentAmount?: boolean
    kimchiEntryRate?: boolean
    kimchiExitRate?: boolean
    kimchiToleranceRate?: boolean
    binanceLeverage?: boolean
    upbitEntryAmount?: boolean
    dailyLossLimit?: boolean
    maxPositionSize?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TradingSettingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "entryPremiumRate" | "exitPremiumRate" | "stopLossRate" | "maxPositions" | "isAutoTrading" | "maxInvestmentAmount" | "kimchiEntryRate" | "kimchiExitRate" | "kimchiToleranceRate" | "binanceLeverage" | "upbitEntryAmount" | "dailyLossLimit" | "maxPositionSize" | "createdAt" | "updatedAt", ExtArgs["result"]["tradingSetting"]>

  export type $TradingSettingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TradingSetting"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      entryPremiumRate: Prisma.Decimal
      exitPremiumRate: Prisma.Decimal
      stopLossRate: Prisma.Decimal
      maxPositions: number
      isAutoTrading: boolean
      maxInvestmentAmount: Prisma.Decimal
      kimchiEntryRate: Prisma.Decimal
      kimchiExitRate: Prisma.Decimal
      kimchiToleranceRate: Prisma.Decimal
      binanceLeverage: number
      upbitEntryAmount: Prisma.Decimal
      dailyLossLimit: Prisma.Decimal
      maxPositionSize: Prisma.Decimal
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["tradingSetting"]>
    composites: {}
  }

  type TradingSettingGetPayload<S extends boolean | null | undefined | TradingSettingDefaultArgs> = $Result.GetResult<Prisma.$TradingSettingPayload, S>

  type TradingSettingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TradingSettingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TradingSettingCountAggregateInputType | true
    }

  export interface TradingSettingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TradingSetting'], meta: { name: 'TradingSetting' } }
    /**
     * Find zero or one TradingSetting that matches the filter.
     * @param {TradingSettingFindUniqueArgs} args - Arguments to find a TradingSetting
     * @example
     * // Get one TradingSetting
     * const tradingSetting = await prisma.tradingSetting.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TradingSettingFindUniqueArgs>(args: SelectSubset<T, TradingSettingFindUniqueArgs<ExtArgs>>): Prisma__TradingSettingClient<$Result.GetResult<Prisma.$TradingSettingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TradingSetting that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TradingSettingFindUniqueOrThrowArgs} args - Arguments to find a TradingSetting
     * @example
     * // Get one TradingSetting
     * const tradingSetting = await prisma.tradingSetting.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TradingSettingFindUniqueOrThrowArgs>(args: SelectSubset<T, TradingSettingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TradingSettingClient<$Result.GetResult<Prisma.$TradingSettingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TradingSetting that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingSettingFindFirstArgs} args - Arguments to find a TradingSetting
     * @example
     * // Get one TradingSetting
     * const tradingSetting = await prisma.tradingSetting.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TradingSettingFindFirstArgs>(args?: SelectSubset<T, TradingSettingFindFirstArgs<ExtArgs>>): Prisma__TradingSettingClient<$Result.GetResult<Prisma.$TradingSettingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TradingSetting that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingSettingFindFirstOrThrowArgs} args - Arguments to find a TradingSetting
     * @example
     * // Get one TradingSetting
     * const tradingSetting = await prisma.tradingSetting.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TradingSettingFindFirstOrThrowArgs>(args?: SelectSubset<T, TradingSettingFindFirstOrThrowArgs<ExtArgs>>): Prisma__TradingSettingClient<$Result.GetResult<Prisma.$TradingSettingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TradingSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingSettingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TradingSettings
     * const tradingSettings = await prisma.tradingSetting.findMany()
     * 
     * // Get first 10 TradingSettings
     * const tradingSettings = await prisma.tradingSetting.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tradingSettingWithIdOnly = await prisma.tradingSetting.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TradingSettingFindManyArgs>(args?: SelectSubset<T, TradingSettingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradingSettingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TradingSetting.
     * @param {TradingSettingCreateArgs} args - Arguments to create a TradingSetting.
     * @example
     * // Create one TradingSetting
     * const TradingSetting = await prisma.tradingSetting.create({
     *   data: {
     *     // ... data to create a TradingSetting
     *   }
     * })
     * 
     */
    create<T extends TradingSettingCreateArgs>(args: SelectSubset<T, TradingSettingCreateArgs<ExtArgs>>): Prisma__TradingSettingClient<$Result.GetResult<Prisma.$TradingSettingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TradingSettings.
     * @param {TradingSettingCreateManyArgs} args - Arguments to create many TradingSettings.
     * @example
     * // Create many TradingSettings
     * const tradingSetting = await prisma.tradingSetting.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TradingSettingCreateManyArgs>(args?: SelectSubset<T, TradingSettingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TradingSettings and returns the data saved in the database.
     * @param {TradingSettingCreateManyAndReturnArgs} args - Arguments to create many TradingSettings.
     * @example
     * // Create many TradingSettings
     * const tradingSetting = await prisma.tradingSetting.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TradingSettings and only return the `id`
     * const tradingSettingWithIdOnly = await prisma.tradingSetting.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TradingSettingCreateManyAndReturnArgs>(args?: SelectSubset<T, TradingSettingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradingSettingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TradingSetting.
     * @param {TradingSettingDeleteArgs} args - Arguments to delete one TradingSetting.
     * @example
     * // Delete one TradingSetting
     * const TradingSetting = await prisma.tradingSetting.delete({
     *   where: {
     *     // ... filter to delete one TradingSetting
     *   }
     * })
     * 
     */
    delete<T extends TradingSettingDeleteArgs>(args: SelectSubset<T, TradingSettingDeleteArgs<ExtArgs>>): Prisma__TradingSettingClient<$Result.GetResult<Prisma.$TradingSettingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TradingSetting.
     * @param {TradingSettingUpdateArgs} args - Arguments to update one TradingSetting.
     * @example
     * // Update one TradingSetting
     * const tradingSetting = await prisma.tradingSetting.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TradingSettingUpdateArgs>(args: SelectSubset<T, TradingSettingUpdateArgs<ExtArgs>>): Prisma__TradingSettingClient<$Result.GetResult<Prisma.$TradingSettingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TradingSettings.
     * @param {TradingSettingDeleteManyArgs} args - Arguments to filter TradingSettings to delete.
     * @example
     * // Delete a few TradingSettings
     * const { count } = await prisma.tradingSetting.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TradingSettingDeleteManyArgs>(args?: SelectSubset<T, TradingSettingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TradingSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingSettingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TradingSettings
     * const tradingSetting = await prisma.tradingSetting.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TradingSettingUpdateManyArgs>(args: SelectSubset<T, TradingSettingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TradingSettings and returns the data updated in the database.
     * @param {TradingSettingUpdateManyAndReturnArgs} args - Arguments to update many TradingSettings.
     * @example
     * // Update many TradingSettings
     * const tradingSetting = await prisma.tradingSetting.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TradingSettings and only return the `id`
     * const tradingSettingWithIdOnly = await prisma.tradingSetting.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TradingSettingUpdateManyAndReturnArgs>(args: SelectSubset<T, TradingSettingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradingSettingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TradingSetting.
     * @param {TradingSettingUpsertArgs} args - Arguments to update or create a TradingSetting.
     * @example
     * // Update or create a TradingSetting
     * const tradingSetting = await prisma.tradingSetting.upsert({
     *   create: {
     *     // ... data to create a TradingSetting
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TradingSetting we want to update
     *   }
     * })
     */
    upsert<T extends TradingSettingUpsertArgs>(args: SelectSubset<T, TradingSettingUpsertArgs<ExtArgs>>): Prisma__TradingSettingClient<$Result.GetResult<Prisma.$TradingSettingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TradingSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingSettingCountArgs} args - Arguments to filter TradingSettings to count.
     * @example
     * // Count the number of TradingSettings
     * const count = await prisma.tradingSetting.count({
     *   where: {
     *     // ... the filter for the TradingSettings we want to count
     *   }
     * })
    **/
    count<T extends TradingSettingCountArgs>(
      args?: Subset<T, TradingSettingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TradingSettingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TradingSetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingSettingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TradingSettingAggregateArgs>(args: Subset<T, TradingSettingAggregateArgs>): Prisma.PrismaPromise<GetTradingSettingAggregateType<T>>

    /**
     * Group by TradingSetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingSettingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TradingSettingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TradingSettingGroupByArgs['orderBy'] }
        : { orderBy?: TradingSettingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TradingSettingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTradingSettingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TradingSetting model
   */
  readonly fields: TradingSettingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TradingSetting.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TradingSettingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TradingSetting model
   */
  interface TradingSettingFieldRefs {
    readonly id: FieldRef<"TradingSetting", 'Int'>
    readonly userId: FieldRef<"TradingSetting", 'Int'>
    readonly entryPremiumRate: FieldRef<"TradingSetting", 'Decimal'>
    readonly exitPremiumRate: FieldRef<"TradingSetting", 'Decimal'>
    readonly stopLossRate: FieldRef<"TradingSetting", 'Decimal'>
    readonly maxPositions: FieldRef<"TradingSetting", 'Int'>
    readonly isAutoTrading: FieldRef<"TradingSetting", 'Boolean'>
    readonly maxInvestmentAmount: FieldRef<"TradingSetting", 'Decimal'>
    readonly kimchiEntryRate: FieldRef<"TradingSetting", 'Decimal'>
    readonly kimchiExitRate: FieldRef<"TradingSetting", 'Decimal'>
    readonly kimchiToleranceRate: FieldRef<"TradingSetting", 'Decimal'>
    readonly binanceLeverage: FieldRef<"TradingSetting", 'Int'>
    readonly upbitEntryAmount: FieldRef<"TradingSetting", 'Decimal'>
    readonly dailyLossLimit: FieldRef<"TradingSetting", 'Decimal'>
    readonly maxPositionSize: FieldRef<"TradingSetting", 'Decimal'>
    readonly createdAt: FieldRef<"TradingSetting", 'DateTime'>
    readonly updatedAt: FieldRef<"TradingSetting", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TradingSetting findUnique
   */
  export type TradingSettingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
    /**
     * Filter, which TradingSetting to fetch.
     */
    where: TradingSettingWhereUniqueInput
  }

  /**
   * TradingSetting findUniqueOrThrow
   */
  export type TradingSettingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
    /**
     * Filter, which TradingSetting to fetch.
     */
    where: TradingSettingWhereUniqueInput
  }

  /**
   * TradingSetting findFirst
   */
  export type TradingSettingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
    /**
     * Filter, which TradingSetting to fetch.
     */
    where?: TradingSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradingSettings to fetch.
     */
    orderBy?: TradingSettingOrderByWithRelationInput | TradingSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TradingSettings.
     */
    cursor?: TradingSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradingSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradingSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TradingSettings.
     */
    distinct?: TradingSettingScalarFieldEnum | TradingSettingScalarFieldEnum[]
  }

  /**
   * TradingSetting findFirstOrThrow
   */
  export type TradingSettingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
    /**
     * Filter, which TradingSetting to fetch.
     */
    where?: TradingSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradingSettings to fetch.
     */
    orderBy?: TradingSettingOrderByWithRelationInput | TradingSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TradingSettings.
     */
    cursor?: TradingSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradingSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradingSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TradingSettings.
     */
    distinct?: TradingSettingScalarFieldEnum | TradingSettingScalarFieldEnum[]
  }

  /**
   * TradingSetting findMany
   */
  export type TradingSettingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
    /**
     * Filter, which TradingSettings to fetch.
     */
    where?: TradingSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradingSettings to fetch.
     */
    orderBy?: TradingSettingOrderByWithRelationInput | TradingSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TradingSettings.
     */
    cursor?: TradingSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradingSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradingSettings.
     */
    skip?: number
    distinct?: TradingSettingScalarFieldEnum | TradingSettingScalarFieldEnum[]
  }

  /**
   * TradingSetting create
   */
  export type TradingSettingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
    /**
     * The data needed to create a TradingSetting.
     */
    data: XOR<TradingSettingCreateInput, TradingSettingUncheckedCreateInput>
  }

  /**
   * TradingSetting createMany
   */
  export type TradingSettingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TradingSettings.
     */
    data: TradingSettingCreateManyInput | TradingSettingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TradingSetting createManyAndReturn
   */
  export type TradingSettingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
    /**
     * The data used to create many TradingSettings.
     */
    data: TradingSettingCreateManyInput | TradingSettingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TradingSetting update
   */
  export type TradingSettingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
    /**
     * The data needed to update a TradingSetting.
     */
    data: XOR<TradingSettingUpdateInput, TradingSettingUncheckedUpdateInput>
    /**
     * Choose, which TradingSetting to update.
     */
    where: TradingSettingWhereUniqueInput
  }

  /**
   * TradingSetting updateMany
   */
  export type TradingSettingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TradingSettings.
     */
    data: XOR<TradingSettingUpdateManyMutationInput, TradingSettingUncheckedUpdateManyInput>
    /**
     * Filter which TradingSettings to update
     */
    where?: TradingSettingWhereInput
    /**
     * Limit how many TradingSettings to update.
     */
    limit?: number
  }

  /**
   * TradingSetting updateManyAndReturn
   */
  export type TradingSettingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
    /**
     * The data used to update TradingSettings.
     */
    data: XOR<TradingSettingUpdateManyMutationInput, TradingSettingUncheckedUpdateManyInput>
    /**
     * Filter which TradingSettings to update
     */
    where?: TradingSettingWhereInput
    /**
     * Limit how many TradingSettings to update.
     */
    limit?: number
  }

  /**
   * TradingSetting upsert
   */
  export type TradingSettingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
    /**
     * The filter to search for the TradingSetting to update in case it exists.
     */
    where: TradingSettingWhereUniqueInput
    /**
     * In case the TradingSetting found by the `where` argument doesn't exist, create a new TradingSetting with this data.
     */
    create: XOR<TradingSettingCreateInput, TradingSettingUncheckedCreateInput>
    /**
     * In case the TradingSetting was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TradingSettingUpdateInput, TradingSettingUncheckedUpdateInput>
  }

  /**
   * TradingSetting delete
   */
  export type TradingSettingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
    /**
     * Filter which TradingSetting to delete.
     */
    where: TradingSettingWhereUniqueInput
  }

  /**
   * TradingSetting deleteMany
   */
  export type TradingSettingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TradingSettings to delete
     */
    where?: TradingSettingWhereInput
    /**
     * Limit how many TradingSettings to delete.
     */
    limit?: number
  }

  /**
   * TradingSetting without action
   */
  export type TradingSettingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingSetting
     */
    select?: TradingSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingSetting
     */
    omit?: TradingSettingOmit<ExtArgs> | null
  }


  /**
   * Model TradingStrategy
   */

  export type AggregateTradingStrategy = {
    _count: TradingStrategyCountAggregateOutputType | null
    _avg: TradingStrategyAvgAggregateOutputType | null
    _sum: TradingStrategySumAggregateOutputType | null
    _min: TradingStrategyMinAggregateOutputType | null
    _max: TradingStrategyMaxAggregateOutputType | null
  }

  export type TradingStrategyAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    entryRate: Decimal | null
    exitRate: Decimal | null
    leverage: number | null
    investmentAmount: Decimal | null
    tolerance: Decimal | null
    totalTrades: number | null
    successfulTrades: number | null
    totalProfit: Decimal | null
    toleranceRate: Decimal | null
  }

  export type TradingStrategySumAggregateOutputType = {
    id: number | null
    userId: number | null
    entryRate: Decimal | null
    exitRate: Decimal | null
    leverage: number | null
    investmentAmount: Decimal | null
    tolerance: Decimal | null
    totalTrades: number | null
    successfulTrades: number | null
    totalProfit: Decimal | null
    toleranceRate: Decimal | null
  }

  export type TradingStrategyMinAggregateOutputType = {
    id: number | null
    userId: number | null
    name: string | null
    entryRate: Decimal | null
    exitRate: Decimal | null
    leverage: number | null
    investmentAmount: Decimal | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    symbol: string | null
    tolerance: Decimal | null
    isAutoTrading: boolean | null
    totalTrades: number | null
    successfulTrades: number | null
    totalProfit: Decimal | null
    strategyType: string | null
    toleranceRate: Decimal | null
  }

  export type TradingStrategyMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    name: string | null
    entryRate: Decimal | null
    exitRate: Decimal | null
    leverage: number | null
    investmentAmount: Decimal | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    symbol: string | null
    tolerance: Decimal | null
    isAutoTrading: boolean | null
    totalTrades: number | null
    successfulTrades: number | null
    totalProfit: Decimal | null
    strategyType: string | null
    toleranceRate: Decimal | null
  }

  export type TradingStrategyCountAggregateOutputType = {
    id: number
    userId: number
    name: number
    entryRate: number
    exitRate: number
    leverage: number
    investmentAmount: number
    isActive: number
    createdAt: number
    updatedAt: number
    symbol: number
    tolerance: number
    isAutoTrading: number
    totalTrades: number
    successfulTrades: number
    totalProfit: number
    strategyType: number
    toleranceRate: number
    _all: number
  }


  export type TradingStrategyAvgAggregateInputType = {
    id?: true
    userId?: true
    entryRate?: true
    exitRate?: true
    leverage?: true
    investmentAmount?: true
    tolerance?: true
    totalTrades?: true
    successfulTrades?: true
    totalProfit?: true
    toleranceRate?: true
  }

  export type TradingStrategySumAggregateInputType = {
    id?: true
    userId?: true
    entryRate?: true
    exitRate?: true
    leverage?: true
    investmentAmount?: true
    tolerance?: true
    totalTrades?: true
    successfulTrades?: true
    totalProfit?: true
    toleranceRate?: true
  }

  export type TradingStrategyMinAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    entryRate?: true
    exitRate?: true
    leverage?: true
    investmentAmount?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    symbol?: true
    tolerance?: true
    isAutoTrading?: true
    totalTrades?: true
    successfulTrades?: true
    totalProfit?: true
    strategyType?: true
    toleranceRate?: true
  }

  export type TradingStrategyMaxAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    entryRate?: true
    exitRate?: true
    leverage?: true
    investmentAmount?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    symbol?: true
    tolerance?: true
    isAutoTrading?: true
    totalTrades?: true
    successfulTrades?: true
    totalProfit?: true
    strategyType?: true
    toleranceRate?: true
  }

  export type TradingStrategyCountAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    entryRate?: true
    exitRate?: true
    leverage?: true
    investmentAmount?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    symbol?: true
    tolerance?: true
    isAutoTrading?: true
    totalTrades?: true
    successfulTrades?: true
    totalProfit?: true
    strategyType?: true
    toleranceRate?: true
    _all?: true
  }

  export type TradingStrategyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TradingStrategy to aggregate.
     */
    where?: TradingStrategyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradingStrategies to fetch.
     */
    orderBy?: TradingStrategyOrderByWithRelationInput | TradingStrategyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TradingStrategyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradingStrategies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradingStrategies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TradingStrategies
    **/
    _count?: true | TradingStrategyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TradingStrategyAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TradingStrategySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TradingStrategyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TradingStrategyMaxAggregateInputType
  }

  export type GetTradingStrategyAggregateType<T extends TradingStrategyAggregateArgs> = {
        [P in keyof T & keyof AggregateTradingStrategy]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTradingStrategy[P]>
      : GetScalarType<T[P], AggregateTradingStrategy[P]>
  }




  export type TradingStrategyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TradingStrategyWhereInput
    orderBy?: TradingStrategyOrderByWithAggregationInput | TradingStrategyOrderByWithAggregationInput[]
    by: TradingStrategyScalarFieldEnum[] | TradingStrategyScalarFieldEnum
    having?: TradingStrategyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TradingStrategyCountAggregateInputType | true
    _avg?: TradingStrategyAvgAggregateInputType
    _sum?: TradingStrategySumAggregateInputType
    _min?: TradingStrategyMinAggregateInputType
    _max?: TradingStrategyMaxAggregateInputType
  }

  export type TradingStrategyGroupByOutputType = {
    id: number
    userId: number
    name: string
    entryRate: Decimal
    exitRate: Decimal
    leverage: number
    investmentAmount: Decimal
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    symbol: string
    tolerance: Decimal
    isAutoTrading: boolean
    totalTrades: number
    successfulTrades: number
    totalProfit: Decimal
    strategyType: string
    toleranceRate: Decimal
    _count: TradingStrategyCountAggregateOutputType | null
    _avg: TradingStrategyAvgAggregateOutputType | null
    _sum: TradingStrategySumAggregateOutputType | null
    _min: TradingStrategyMinAggregateOutputType | null
    _max: TradingStrategyMaxAggregateOutputType | null
  }

  type GetTradingStrategyGroupByPayload<T extends TradingStrategyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TradingStrategyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TradingStrategyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TradingStrategyGroupByOutputType[P]>
            : GetScalarType<T[P], TradingStrategyGroupByOutputType[P]>
        }
      >
    >


  export type TradingStrategySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    name?: boolean
    entryRate?: boolean
    exitRate?: boolean
    leverage?: boolean
    investmentAmount?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    symbol?: boolean
    tolerance?: boolean
    isAutoTrading?: boolean
    totalTrades?: boolean
    successfulTrades?: boolean
    totalProfit?: boolean
    strategyType?: boolean
    toleranceRate?: boolean
  }, ExtArgs["result"]["tradingStrategy"]>

  export type TradingStrategySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    name?: boolean
    entryRate?: boolean
    exitRate?: boolean
    leverage?: boolean
    investmentAmount?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    symbol?: boolean
    tolerance?: boolean
    isAutoTrading?: boolean
    totalTrades?: boolean
    successfulTrades?: boolean
    totalProfit?: boolean
    strategyType?: boolean
    toleranceRate?: boolean
  }, ExtArgs["result"]["tradingStrategy"]>

  export type TradingStrategySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    name?: boolean
    entryRate?: boolean
    exitRate?: boolean
    leverage?: boolean
    investmentAmount?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    symbol?: boolean
    tolerance?: boolean
    isAutoTrading?: boolean
    totalTrades?: boolean
    successfulTrades?: boolean
    totalProfit?: boolean
    strategyType?: boolean
    toleranceRate?: boolean
  }, ExtArgs["result"]["tradingStrategy"]>

  export type TradingStrategySelectScalar = {
    id?: boolean
    userId?: boolean
    name?: boolean
    entryRate?: boolean
    exitRate?: boolean
    leverage?: boolean
    investmentAmount?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    symbol?: boolean
    tolerance?: boolean
    isAutoTrading?: boolean
    totalTrades?: boolean
    successfulTrades?: boolean
    totalProfit?: boolean
    strategyType?: boolean
    toleranceRate?: boolean
  }

  export type TradingStrategyOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "name" | "entryRate" | "exitRate" | "leverage" | "investmentAmount" | "isActive" | "createdAt" | "updatedAt" | "symbol" | "tolerance" | "isAutoTrading" | "totalTrades" | "successfulTrades" | "totalProfit" | "strategyType" | "toleranceRate", ExtArgs["result"]["tradingStrategy"]>

  export type $TradingStrategyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TradingStrategy"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      name: string
      entryRate: Prisma.Decimal
      exitRate: Prisma.Decimal
      leverage: number
      investmentAmount: Prisma.Decimal
      isActive: boolean
      createdAt: Date
      updatedAt: Date
      symbol: string
      tolerance: Prisma.Decimal
      isAutoTrading: boolean
      totalTrades: number
      successfulTrades: number
      totalProfit: Prisma.Decimal
      strategyType: string
      toleranceRate: Prisma.Decimal
    }, ExtArgs["result"]["tradingStrategy"]>
    composites: {}
  }

  type TradingStrategyGetPayload<S extends boolean | null | undefined | TradingStrategyDefaultArgs> = $Result.GetResult<Prisma.$TradingStrategyPayload, S>

  type TradingStrategyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TradingStrategyFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TradingStrategyCountAggregateInputType | true
    }

  export interface TradingStrategyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TradingStrategy'], meta: { name: 'TradingStrategy' } }
    /**
     * Find zero or one TradingStrategy that matches the filter.
     * @param {TradingStrategyFindUniqueArgs} args - Arguments to find a TradingStrategy
     * @example
     * // Get one TradingStrategy
     * const tradingStrategy = await prisma.tradingStrategy.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TradingStrategyFindUniqueArgs>(args: SelectSubset<T, TradingStrategyFindUniqueArgs<ExtArgs>>): Prisma__TradingStrategyClient<$Result.GetResult<Prisma.$TradingStrategyPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TradingStrategy that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TradingStrategyFindUniqueOrThrowArgs} args - Arguments to find a TradingStrategy
     * @example
     * // Get one TradingStrategy
     * const tradingStrategy = await prisma.tradingStrategy.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TradingStrategyFindUniqueOrThrowArgs>(args: SelectSubset<T, TradingStrategyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TradingStrategyClient<$Result.GetResult<Prisma.$TradingStrategyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TradingStrategy that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingStrategyFindFirstArgs} args - Arguments to find a TradingStrategy
     * @example
     * // Get one TradingStrategy
     * const tradingStrategy = await prisma.tradingStrategy.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TradingStrategyFindFirstArgs>(args?: SelectSubset<T, TradingStrategyFindFirstArgs<ExtArgs>>): Prisma__TradingStrategyClient<$Result.GetResult<Prisma.$TradingStrategyPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TradingStrategy that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingStrategyFindFirstOrThrowArgs} args - Arguments to find a TradingStrategy
     * @example
     * // Get one TradingStrategy
     * const tradingStrategy = await prisma.tradingStrategy.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TradingStrategyFindFirstOrThrowArgs>(args?: SelectSubset<T, TradingStrategyFindFirstOrThrowArgs<ExtArgs>>): Prisma__TradingStrategyClient<$Result.GetResult<Prisma.$TradingStrategyPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TradingStrategies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingStrategyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TradingStrategies
     * const tradingStrategies = await prisma.tradingStrategy.findMany()
     * 
     * // Get first 10 TradingStrategies
     * const tradingStrategies = await prisma.tradingStrategy.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tradingStrategyWithIdOnly = await prisma.tradingStrategy.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TradingStrategyFindManyArgs>(args?: SelectSubset<T, TradingStrategyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradingStrategyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TradingStrategy.
     * @param {TradingStrategyCreateArgs} args - Arguments to create a TradingStrategy.
     * @example
     * // Create one TradingStrategy
     * const TradingStrategy = await prisma.tradingStrategy.create({
     *   data: {
     *     // ... data to create a TradingStrategy
     *   }
     * })
     * 
     */
    create<T extends TradingStrategyCreateArgs>(args: SelectSubset<T, TradingStrategyCreateArgs<ExtArgs>>): Prisma__TradingStrategyClient<$Result.GetResult<Prisma.$TradingStrategyPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TradingStrategies.
     * @param {TradingStrategyCreateManyArgs} args - Arguments to create many TradingStrategies.
     * @example
     * // Create many TradingStrategies
     * const tradingStrategy = await prisma.tradingStrategy.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TradingStrategyCreateManyArgs>(args?: SelectSubset<T, TradingStrategyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TradingStrategies and returns the data saved in the database.
     * @param {TradingStrategyCreateManyAndReturnArgs} args - Arguments to create many TradingStrategies.
     * @example
     * // Create many TradingStrategies
     * const tradingStrategy = await prisma.tradingStrategy.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TradingStrategies and only return the `id`
     * const tradingStrategyWithIdOnly = await prisma.tradingStrategy.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TradingStrategyCreateManyAndReturnArgs>(args?: SelectSubset<T, TradingStrategyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradingStrategyPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TradingStrategy.
     * @param {TradingStrategyDeleteArgs} args - Arguments to delete one TradingStrategy.
     * @example
     * // Delete one TradingStrategy
     * const TradingStrategy = await prisma.tradingStrategy.delete({
     *   where: {
     *     // ... filter to delete one TradingStrategy
     *   }
     * })
     * 
     */
    delete<T extends TradingStrategyDeleteArgs>(args: SelectSubset<T, TradingStrategyDeleteArgs<ExtArgs>>): Prisma__TradingStrategyClient<$Result.GetResult<Prisma.$TradingStrategyPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TradingStrategy.
     * @param {TradingStrategyUpdateArgs} args - Arguments to update one TradingStrategy.
     * @example
     * // Update one TradingStrategy
     * const tradingStrategy = await prisma.tradingStrategy.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TradingStrategyUpdateArgs>(args: SelectSubset<T, TradingStrategyUpdateArgs<ExtArgs>>): Prisma__TradingStrategyClient<$Result.GetResult<Prisma.$TradingStrategyPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TradingStrategies.
     * @param {TradingStrategyDeleteManyArgs} args - Arguments to filter TradingStrategies to delete.
     * @example
     * // Delete a few TradingStrategies
     * const { count } = await prisma.tradingStrategy.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TradingStrategyDeleteManyArgs>(args?: SelectSubset<T, TradingStrategyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TradingStrategies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingStrategyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TradingStrategies
     * const tradingStrategy = await prisma.tradingStrategy.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TradingStrategyUpdateManyArgs>(args: SelectSubset<T, TradingStrategyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TradingStrategies and returns the data updated in the database.
     * @param {TradingStrategyUpdateManyAndReturnArgs} args - Arguments to update many TradingStrategies.
     * @example
     * // Update many TradingStrategies
     * const tradingStrategy = await prisma.tradingStrategy.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TradingStrategies and only return the `id`
     * const tradingStrategyWithIdOnly = await prisma.tradingStrategy.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TradingStrategyUpdateManyAndReturnArgs>(args: SelectSubset<T, TradingStrategyUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TradingStrategyPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TradingStrategy.
     * @param {TradingStrategyUpsertArgs} args - Arguments to update or create a TradingStrategy.
     * @example
     * // Update or create a TradingStrategy
     * const tradingStrategy = await prisma.tradingStrategy.upsert({
     *   create: {
     *     // ... data to create a TradingStrategy
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TradingStrategy we want to update
     *   }
     * })
     */
    upsert<T extends TradingStrategyUpsertArgs>(args: SelectSubset<T, TradingStrategyUpsertArgs<ExtArgs>>): Prisma__TradingStrategyClient<$Result.GetResult<Prisma.$TradingStrategyPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TradingStrategies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingStrategyCountArgs} args - Arguments to filter TradingStrategies to count.
     * @example
     * // Count the number of TradingStrategies
     * const count = await prisma.tradingStrategy.count({
     *   where: {
     *     // ... the filter for the TradingStrategies we want to count
     *   }
     * })
    **/
    count<T extends TradingStrategyCountArgs>(
      args?: Subset<T, TradingStrategyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TradingStrategyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TradingStrategy.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingStrategyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TradingStrategyAggregateArgs>(args: Subset<T, TradingStrategyAggregateArgs>): Prisma.PrismaPromise<GetTradingStrategyAggregateType<T>>

    /**
     * Group by TradingStrategy.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TradingStrategyGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TradingStrategyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TradingStrategyGroupByArgs['orderBy'] }
        : { orderBy?: TradingStrategyGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TradingStrategyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTradingStrategyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TradingStrategy model
   */
  readonly fields: TradingStrategyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TradingStrategy.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TradingStrategyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TradingStrategy model
   */
  interface TradingStrategyFieldRefs {
    readonly id: FieldRef<"TradingStrategy", 'Int'>
    readonly userId: FieldRef<"TradingStrategy", 'Int'>
    readonly name: FieldRef<"TradingStrategy", 'String'>
    readonly entryRate: FieldRef<"TradingStrategy", 'Decimal'>
    readonly exitRate: FieldRef<"TradingStrategy", 'Decimal'>
    readonly leverage: FieldRef<"TradingStrategy", 'Int'>
    readonly investmentAmount: FieldRef<"TradingStrategy", 'Decimal'>
    readonly isActive: FieldRef<"TradingStrategy", 'Boolean'>
    readonly createdAt: FieldRef<"TradingStrategy", 'DateTime'>
    readonly updatedAt: FieldRef<"TradingStrategy", 'DateTime'>
    readonly symbol: FieldRef<"TradingStrategy", 'String'>
    readonly tolerance: FieldRef<"TradingStrategy", 'Decimal'>
    readonly isAutoTrading: FieldRef<"TradingStrategy", 'Boolean'>
    readonly totalTrades: FieldRef<"TradingStrategy", 'Int'>
    readonly successfulTrades: FieldRef<"TradingStrategy", 'Int'>
    readonly totalProfit: FieldRef<"TradingStrategy", 'Decimal'>
    readonly strategyType: FieldRef<"TradingStrategy", 'String'>
    readonly toleranceRate: FieldRef<"TradingStrategy", 'Decimal'>
  }
    

  // Custom InputTypes
  /**
   * TradingStrategy findUnique
   */
  export type TradingStrategyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
    /**
     * Filter, which TradingStrategy to fetch.
     */
    where: TradingStrategyWhereUniqueInput
  }

  /**
   * TradingStrategy findUniqueOrThrow
   */
  export type TradingStrategyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
    /**
     * Filter, which TradingStrategy to fetch.
     */
    where: TradingStrategyWhereUniqueInput
  }

  /**
   * TradingStrategy findFirst
   */
  export type TradingStrategyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
    /**
     * Filter, which TradingStrategy to fetch.
     */
    where?: TradingStrategyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradingStrategies to fetch.
     */
    orderBy?: TradingStrategyOrderByWithRelationInput | TradingStrategyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TradingStrategies.
     */
    cursor?: TradingStrategyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradingStrategies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradingStrategies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TradingStrategies.
     */
    distinct?: TradingStrategyScalarFieldEnum | TradingStrategyScalarFieldEnum[]
  }

  /**
   * TradingStrategy findFirstOrThrow
   */
  export type TradingStrategyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
    /**
     * Filter, which TradingStrategy to fetch.
     */
    where?: TradingStrategyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradingStrategies to fetch.
     */
    orderBy?: TradingStrategyOrderByWithRelationInput | TradingStrategyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TradingStrategies.
     */
    cursor?: TradingStrategyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradingStrategies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradingStrategies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TradingStrategies.
     */
    distinct?: TradingStrategyScalarFieldEnum | TradingStrategyScalarFieldEnum[]
  }

  /**
   * TradingStrategy findMany
   */
  export type TradingStrategyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
    /**
     * Filter, which TradingStrategies to fetch.
     */
    where?: TradingStrategyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TradingStrategies to fetch.
     */
    orderBy?: TradingStrategyOrderByWithRelationInput | TradingStrategyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TradingStrategies.
     */
    cursor?: TradingStrategyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TradingStrategies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TradingStrategies.
     */
    skip?: number
    distinct?: TradingStrategyScalarFieldEnum | TradingStrategyScalarFieldEnum[]
  }

  /**
   * TradingStrategy create
   */
  export type TradingStrategyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
    /**
     * The data needed to create a TradingStrategy.
     */
    data: XOR<TradingStrategyCreateInput, TradingStrategyUncheckedCreateInput>
  }

  /**
   * TradingStrategy createMany
   */
  export type TradingStrategyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TradingStrategies.
     */
    data: TradingStrategyCreateManyInput | TradingStrategyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TradingStrategy createManyAndReturn
   */
  export type TradingStrategyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
    /**
     * The data used to create many TradingStrategies.
     */
    data: TradingStrategyCreateManyInput | TradingStrategyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TradingStrategy update
   */
  export type TradingStrategyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
    /**
     * The data needed to update a TradingStrategy.
     */
    data: XOR<TradingStrategyUpdateInput, TradingStrategyUncheckedUpdateInput>
    /**
     * Choose, which TradingStrategy to update.
     */
    where: TradingStrategyWhereUniqueInput
  }

  /**
   * TradingStrategy updateMany
   */
  export type TradingStrategyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TradingStrategies.
     */
    data: XOR<TradingStrategyUpdateManyMutationInput, TradingStrategyUncheckedUpdateManyInput>
    /**
     * Filter which TradingStrategies to update
     */
    where?: TradingStrategyWhereInput
    /**
     * Limit how many TradingStrategies to update.
     */
    limit?: number
  }

  /**
   * TradingStrategy updateManyAndReturn
   */
  export type TradingStrategyUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
    /**
     * The data used to update TradingStrategies.
     */
    data: XOR<TradingStrategyUpdateManyMutationInput, TradingStrategyUncheckedUpdateManyInput>
    /**
     * Filter which TradingStrategies to update
     */
    where?: TradingStrategyWhereInput
    /**
     * Limit how many TradingStrategies to update.
     */
    limit?: number
  }

  /**
   * TradingStrategy upsert
   */
  export type TradingStrategyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
    /**
     * The filter to search for the TradingStrategy to update in case it exists.
     */
    where: TradingStrategyWhereUniqueInput
    /**
     * In case the TradingStrategy found by the `where` argument doesn't exist, create a new TradingStrategy with this data.
     */
    create: XOR<TradingStrategyCreateInput, TradingStrategyUncheckedCreateInput>
    /**
     * In case the TradingStrategy was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TradingStrategyUpdateInput, TradingStrategyUncheckedUpdateInput>
  }

  /**
   * TradingStrategy delete
   */
  export type TradingStrategyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
    /**
     * Filter which TradingStrategy to delete.
     */
    where: TradingStrategyWhereUniqueInput
  }

  /**
   * TradingStrategy deleteMany
   */
  export type TradingStrategyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TradingStrategies to delete
     */
    where?: TradingStrategyWhereInput
    /**
     * Limit how many TradingStrategies to delete.
     */
    limit?: number
  }

  /**
   * TradingStrategy without action
   */
  export type TradingStrategyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TradingStrategy
     */
    select?: TradingStrategySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TradingStrategy
     */
    omit?: TradingStrategyOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const TradeLogScalarFieldEnum: {
    id: 'id',
    timestamp: 'timestamp',
    kimp: 'kimp',
    action: 'action',
    amount: 'amount',
    result: 'result'
  };

  export type TradeLogScalarFieldEnum = (typeof TradeLogScalarFieldEnum)[keyof typeof TradeLogScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    username: 'username',
    role: 'role',
    isActive: 'isActive',
    lastLoginAt: 'lastLoginAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    passwordHash: 'passwordHash',
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    profileImageUrl: 'profileImageUrl',
    password: 'password'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const CryptocurrencyScalarFieldEnum: {
    id: 'id',
    symbol: 'symbol',
    name: 'name',
    isActive: 'isActive',
    createdAt: 'createdAt',
    upbitMarket: 'upbitMarket',
    binanceSymbol: 'binanceSymbol',
    priority: 'priority'
  };

  export type CryptocurrencyScalarFieldEnum = (typeof CryptocurrencyScalarFieldEnum)[keyof typeof CryptocurrencyScalarFieldEnum]


  export const ExchangeScalarFieldEnum: {
    id: 'id',
    apiKey: 'apiKey',
    isActive: 'isActive',
    userId: 'userId',
    exchange: 'exchange',
    apiSecret: 'apiSecret',
    passphrase: 'passphrase',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ExchangeScalarFieldEnum = (typeof ExchangeScalarFieldEnum)[keyof typeof ExchangeScalarFieldEnum]


  export const KimchiPremiumScalarFieldEnum: {
    id: 'id',
    symbol: 'symbol',
    upbitPrice: 'upbitPrice',
    binancePrice: 'binancePrice',
    premiumRate: 'premiumRate',
    timestamp: 'timestamp',
    exchangeRate: 'exchangeRate',
    premiumAmount: 'premiumAmount'
  };

  export type KimchiPremiumScalarFieldEnum = (typeof KimchiPremiumScalarFieldEnum)[keyof typeof KimchiPremiumScalarFieldEnum]


  export const PerformanceStatScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    date: 'date',
    totalTrades: 'totalTrades',
    successfulTrades: 'successfulTrades',
    dailyProfit: 'dailyProfit',
    dailyVolume: 'dailyVolume',
    winRate: 'winRate',
    avgProfitPerTrade: 'avgProfitPerTrade',
    maxDrawdown: 'maxDrawdown',
    createdAt: 'createdAt'
  };

  export type PerformanceStatScalarFieldEnum = (typeof PerformanceStatScalarFieldEnum)[keyof typeof PerformanceStatScalarFieldEnum]


  export const PositionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    strategyId: 'strategyId',
    symbol: 'symbol',
    type: 'type',
    entryPrice: 'entryPrice',
    currentPrice: 'currentPrice',
    quantity: 'quantity',
    entryPremiumRate: 'entryPremiumRate',
    currentPremiumRate: 'currentPremiumRate',
    status: 'status',
    entryTime: 'entryTime',
    exitTime: 'exitTime',
    upbitOrderId: 'upbitOrderId',
    binanceOrderId: 'binanceOrderId',
    side: 'side',
    exitPrice: 'exitPrice',
    exitPremiumRate: 'exitPremiumRate',
    unrealizedPnl: 'unrealizedPnl',
    realizedPnl: 'realizedPnl',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PositionScalarFieldEnum = (typeof PositionScalarFieldEnum)[keyof typeof PositionScalarFieldEnum]


  export const SessionScalarFieldEnum: {
    sid: 'sid',
    sess: 'sess',
    expire: 'expire'
  };

  export type SessionScalarFieldEnum = (typeof SessionScalarFieldEnum)[keyof typeof SessionScalarFieldEnum]


  export const SystemAlertScalarFieldEnum: {
    id: 'id',
    type: 'type',
    title: 'title',
    message: 'message',
    isRead: 'isRead',
    userId: 'userId',
    data: 'data',
    priority: 'priority',
    createdAt: 'createdAt'
  };

  export type SystemAlertScalarFieldEnum = (typeof SystemAlertScalarFieldEnum)[keyof typeof SystemAlertScalarFieldEnum]


  export const TradeScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    positionId: 'positionId',
    symbol: 'symbol',
    side: 'side',
    exchange: 'exchange',
    quantity: 'quantity',
    price: 'price',
    fee: 'fee',
    orderType: 'orderType',
    exchangeOrderId: 'exchangeOrderId',
    exchangeTradeId: 'exchangeTradeId',
    executedAt: 'executedAt',
    createdAt: 'createdAt'
  };

  export type TradeScalarFieldEnum = (typeof TradeScalarFieldEnum)[keyof typeof TradeScalarFieldEnum]


  export const TradingSettingScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    entryPremiumRate: 'entryPremiumRate',
    exitPremiumRate: 'exitPremiumRate',
    stopLossRate: 'stopLossRate',
    maxPositions: 'maxPositions',
    isAutoTrading: 'isAutoTrading',
    maxInvestmentAmount: 'maxInvestmentAmount',
    kimchiEntryRate: 'kimchiEntryRate',
    kimchiExitRate: 'kimchiExitRate',
    kimchiToleranceRate: 'kimchiToleranceRate',
    binanceLeverage: 'binanceLeverage',
    upbitEntryAmount: 'upbitEntryAmount',
    dailyLossLimit: 'dailyLossLimit',
    maxPositionSize: 'maxPositionSize',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TradingSettingScalarFieldEnum = (typeof TradingSettingScalarFieldEnum)[keyof typeof TradingSettingScalarFieldEnum]


  export const TradingStrategyScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    name: 'name',
    entryRate: 'entryRate',
    exitRate: 'exitRate',
    leverage: 'leverage',
    investmentAmount: 'investmentAmount',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    symbol: 'symbol',
    tolerance: 'tolerance',
    isAutoTrading: 'isAutoTrading',
    totalTrades: 'totalTrades',
    successfulTrades: 'successfulTrades',
    totalProfit: 'totalProfit',
    strategyType: 'strategyType',
    toleranceRate: 'toleranceRate'
  };

  export type TradingStrategyScalarFieldEnum = (typeof TradingStrategyScalarFieldEnum)[keyof typeof TradingStrategyScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    
  /**
   * Deep Input Types
   */


  export type TradeLogWhereInput = {
    AND?: TradeLogWhereInput | TradeLogWhereInput[]
    OR?: TradeLogWhereInput[]
    NOT?: TradeLogWhereInput | TradeLogWhereInput[]
    id?: IntFilter<"TradeLog"> | number
    timestamp?: DateTimeFilter<"TradeLog"> | Date | string
    kimp?: FloatFilter<"TradeLog"> | number
    action?: StringFilter<"TradeLog"> | string
    amount?: FloatFilter<"TradeLog"> | number
    result?: StringFilter<"TradeLog"> | string
  }

  export type TradeLogOrderByWithRelationInput = {
    id?: SortOrder
    timestamp?: SortOrder
    kimp?: SortOrder
    action?: SortOrder
    amount?: SortOrder
    result?: SortOrder
  }

  export type TradeLogWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: TradeLogWhereInput | TradeLogWhereInput[]
    OR?: TradeLogWhereInput[]
    NOT?: TradeLogWhereInput | TradeLogWhereInput[]
    timestamp?: DateTimeFilter<"TradeLog"> | Date | string
    kimp?: FloatFilter<"TradeLog"> | number
    action?: StringFilter<"TradeLog"> | string
    amount?: FloatFilter<"TradeLog"> | number
    result?: StringFilter<"TradeLog"> | string
  }, "id">

  export type TradeLogOrderByWithAggregationInput = {
    id?: SortOrder
    timestamp?: SortOrder
    kimp?: SortOrder
    action?: SortOrder
    amount?: SortOrder
    result?: SortOrder
    _count?: TradeLogCountOrderByAggregateInput
    _avg?: TradeLogAvgOrderByAggregateInput
    _max?: TradeLogMaxOrderByAggregateInput
    _min?: TradeLogMinOrderByAggregateInput
    _sum?: TradeLogSumOrderByAggregateInput
  }

  export type TradeLogScalarWhereWithAggregatesInput = {
    AND?: TradeLogScalarWhereWithAggregatesInput | TradeLogScalarWhereWithAggregatesInput[]
    OR?: TradeLogScalarWhereWithAggregatesInput[]
    NOT?: TradeLogScalarWhereWithAggregatesInput | TradeLogScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"TradeLog"> | number
    timestamp?: DateTimeWithAggregatesFilter<"TradeLog"> | Date | string
    kimp?: FloatWithAggregatesFilter<"TradeLog"> | number
    action?: StringWithAggregatesFilter<"TradeLog"> | string
    amount?: FloatWithAggregatesFilter<"TradeLog"> | number
    result?: StringWithAggregatesFilter<"TradeLog"> | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    username?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    isActive?: BoolFilter<"User"> | boolean
    lastLoginAt?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    passwordHash?: StringNullableFilter<"User"> | string | null
    email?: StringNullableFilter<"User"> | string | null
    firstName?: StringNullableFilter<"User"> | string | null
    lastName?: StringNullableFilter<"User"> | string | null
    profileImageUrl?: StringNullableFilter<"User"> | string | null
    password?: StringFilter<"User"> | string
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    username?: SortOrder
    role?: SortOrder
    isActive?: SortOrder
    lastLoginAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    passwordHash?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    profileImageUrl?: SortOrderInput | SortOrder
    password?: SortOrder
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    username?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    role?: StringFilter<"User"> | string
    isActive?: BoolFilter<"User"> | boolean
    lastLoginAt?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    passwordHash?: StringNullableFilter<"User"> | string | null
    firstName?: StringNullableFilter<"User"> | string | null
    lastName?: StringNullableFilter<"User"> | string | null
    profileImageUrl?: StringNullableFilter<"User"> | string | null
    password?: StringFilter<"User"> | string
  }, "id" | "username" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    username?: SortOrder
    role?: SortOrder
    isActive?: SortOrder
    lastLoginAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    passwordHash?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    profileImageUrl?: SortOrderInput | SortOrder
    password?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    username?: StringWithAggregatesFilter<"User"> | string
    role?: StringWithAggregatesFilter<"User"> | string
    isActive?: BoolWithAggregatesFilter<"User"> | boolean
    lastLoginAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    passwordHash?: StringNullableWithAggregatesFilter<"User"> | string | null
    email?: StringNullableWithAggregatesFilter<"User"> | string | null
    firstName?: StringNullableWithAggregatesFilter<"User"> | string | null
    lastName?: StringNullableWithAggregatesFilter<"User"> | string | null
    profileImageUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    password?: StringWithAggregatesFilter<"User"> | string
  }

  export type CryptocurrencyWhereInput = {
    AND?: CryptocurrencyWhereInput | CryptocurrencyWhereInput[]
    OR?: CryptocurrencyWhereInput[]
    NOT?: CryptocurrencyWhereInput | CryptocurrencyWhereInput[]
    id?: IntFilter<"Cryptocurrency"> | number
    symbol?: StringFilter<"Cryptocurrency"> | string
    name?: StringFilter<"Cryptocurrency"> | string
    isActive?: BoolFilter<"Cryptocurrency"> | boolean
    createdAt?: DateTimeFilter<"Cryptocurrency"> | Date | string
    upbitMarket?: StringNullableFilter<"Cryptocurrency"> | string | null
    binanceSymbol?: StringNullableFilter<"Cryptocurrency"> | string | null
    priority?: IntFilter<"Cryptocurrency"> | number
  }

  export type CryptocurrencyOrderByWithRelationInput = {
    id?: SortOrder
    symbol?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    upbitMarket?: SortOrderInput | SortOrder
    binanceSymbol?: SortOrderInput | SortOrder
    priority?: SortOrder
  }

  export type CryptocurrencyWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    symbol?: string
    AND?: CryptocurrencyWhereInput | CryptocurrencyWhereInput[]
    OR?: CryptocurrencyWhereInput[]
    NOT?: CryptocurrencyWhereInput | CryptocurrencyWhereInput[]
    name?: StringFilter<"Cryptocurrency"> | string
    isActive?: BoolFilter<"Cryptocurrency"> | boolean
    createdAt?: DateTimeFilter<"Cryptocurrency"> | Date | string
    upbitMarket?: StringNullableFilter<"Cryptocurrency"> | string | null
    binanceSymbol?: StringNullableFilter<"Cryptocurrency"> | string | null
    priority?: IntFilter<"Cryptocurrency"> | number
  }, "id" | "symbol">

  export type CryptocurrencyOrderByWithAggregationInput = {
    id?: SortOrder
    symbol?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    upbitMarket?: SortOrderInput | SortOrder
    binanceSymbol?: SortOrderInput | SortOrder
    priority?: SortOrder
    _count?: CryptocurrencyCountOrderByAggregateInput
    _avg?: CryptocurrencyAvgOrderByAggregateInput
    _max?: CryptocurrencyMaxOrderByAggregateInput
    _min?: CryptocurrencyMinOrderByAggregateInput
    _sum?: CryptocurrencySumOrderByAggregateInput
  }

  export type CryptocurrencyScalarWhereWithAggregatesInput = {
    AND?: CryptocurrencyScalarWhereWithAggregatesInput | CryptocurrencyScalarWhereWithAggregatesInput[]
    OR?: CryptocurrencyScalarWhereWithAggregatesInput[]
    NOT?: CryptocurrencyScalarWhereWithAggregatesInput | CryptocurrencyScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Cryptocurrency"> | number
    symbol?: StringWithAggregatesFilter<"Cryptocurrency"> | string
    name?: StringWithAggregatesFilter<"Cryptocurrency"> | string
    isActive?: BoolWithAggregatesFilter<"Cryptocurrency"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Cryptocurrency"> | Date | string
    upbitMarket?: StringNullableWithAggregatesFilter<"Cryptocurrency"> | string | null
    binanceSymbol?: StringNullableWithAggregatesFilter<"Cryptocurrency"> | string | null
    priority?: IntWithAggregatesFilter<"Cryptocurrency"> | number
  }

  export type ExchangeWhereInput = {
    AND?: ExchangeWhereInput | ExchangeWhereInput[]
    OR?: ExchangeWhereInput[]
    NOT?: ExchangeWhereInput | ExchangeWhereInput[]
    id?: IntFilter<"Exchange"> | number
    apiKey?: StringFilter<"Exchange"> | string
    isActive?: BoolFilter<"Exchange"> | boolean
    userId?: IntFilter<"Exchange"> | number
    exchange?: StringFilter<"Exchange"> | string
    apiSecret?: StringFilter<"Exchange"> | string
    passphrase?: StringNullableFilter<"Exchange"> | string | null
    createdAt?: DateTimeFilter<"Exchange"> | Date | string
    updatedAt?: DateTimeFilter<"Exchange"> | Date | string
  }

  export type ExchangeOrderByWithRelationInput = {
    id?: SortOrder
    apiKey?: SortOrder
    isActive?: SortOrder
    userId?: SortOrder
    exchange?: SortOrder
    apiSecret?: SortOrder
    passphrase?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExchangeWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: ExchangeWhereInput | ExchangeWhereInput[]
    OR?: ExchangeWhereInput[]
    NOT?: ExchangeWhereInput | ExchangeWhereInput[]
    apiKey?: StringFilter<"Exchange"> | string
    isActive?: BoolFilter<"Exchange"> | boolean
    userId?: IntFilter<"Exchange"> | number
    exchange?: StringFilter<"Exchange"> | string
    apiSecret?: StringFilter<"Exchange"> | string
    passphrase?: StringNullableFilter<"Exchange"> | string | null
    createdAt?: DateTimeFilter<"Exchange"> | Date | string
    updatedAt?: DateTimeFilter<"Exchange"> | Date | string
  }, "id">

  export type ExchangeOrderByWithAggregationInput = {
    id?: SortOrder
    apiKey?: SortOrder
    isActive?: SortOrder
    userId?: SortOrder
    exchange?: SortOrder
    apiSecret?: SortOrder
    passphrase?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ExchangeCountOrderByAggregateInput
    _avg?: ExchangeAvgOrderByAggregateInput
    _max?: ExchangeMaxOrderByAggregateInput
    _min?: ExchangeMinOrderByAggregateInput
    _sum?: ExchangeSumOrderByAggregateInput
  }

  export type ExchangeScalarWhereWithAggregatesInput = {
    AND?: ExchangeScalarWhereWithAggregatesInput | ExchangeScalarWhereWithAggregatesInput[]
    OR?: ExchangeScalarWhereWithAggregatesInput[]
    NOT?: ExchangeScalarWhereWithAggregatesInput | ExchangeScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Exchange"> | number
    apiKey?: StringWithAggregatesFilter<"Exchange"> | string
    isActive?: BoolWithAggregatesFilter<"Exchange"> | boolean
    userId?: IntWithAggregatesFilter<"Exchange"> | number
    exchange?: StringWithAggregatesFilter<"Exchange"> | string
    apiSecret?: StringWithAggregatesFilter<"Exchange"> | string
    passphrase?: StringNullableWithAggregatesFilter<"Exchange"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Exchange"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Exchange"> | Date | string
  }

  export type KimchiPremiumWhereInput = {
    AND?: KimchiPremiumWhereInput | KimchiPremiumWhereInput[]
    OR?: KimchiPremiumWhereInput[]
    NOT?: KimchiPremiumWhereInput | KimchiPremiumWhereInput[]
    id?: IntFilter<"KimchiPremium"> | number
    symbol?: StringFilter<"KimchiPremium"> | string
    upbitPrice?: DecimalFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    binancePrice?: DecimalFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    premiumRate?: DecimalFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    timestamp?: DateTimeFilter<"KimchiPremium"> | Date | string
    exchangeRate?: DecimalFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    premiumAmount?: DecimalFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
  }

  export type KimchiPremiumOrderByWithRelationInput = {
    id?: SortOrder
    symbol?: SortOrder
    upbitPrice?: SortOrder
    binancePrice?: SortOrder
    premiumRate?: SortOrder
    timestamp?: SortOrder
    exchangeRate?: SortOrder
    premiumAmount?: SortOrder
  }

  export type KimchiPremiumWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: KimchiPremiumWhereInput | KimchiPremiumWhereInput[]
    OR?: KimchiPremiumWhereInput[]
    NOT?: KimchiPremiumWhereInput | KimchiPremiumWhereInput[]
    symbol?: StringFilter<"KimchiPremium"> | string
    upbitPrice?: DecimalFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    binancePrice?: DecimalFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    premiumRate?: DecimalFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    timestamp?: DateTimeFilter<"KimchiPremium"> | Date | string
    exchangeRate?: DecimalFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    premiumAmount?: DecimalFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
  }, "id">

  export type KimchiPremiumOrderByWithAggregationInput = {
    id?: SortOrder
    symbol?: SortOrder
    upbitPrice?: SortOrder
    binancePrice?: SortOrder
    premiumRate?: SortOrder
    timestamp?: SortOrder
    exchangeRate?: SortOrder
    premiumAmount?: SortOrder
    _count?: KimchiPremiumCountOrderByAggregateInput
    _avg?: KimchiPremiumAvgOrderByAggregateInput
    _max?: KimchiPremiumMaxOrderByAggregateInput
    _min?: KimchiPremiumMinOrderByAggregateInput
    _sum?: KimchiPremiumSumOrderByAggregateInput
  }

  export type KimchiPremiumScalarWhereWithAggregatesInput = {
    AND?: KimchiPremiumScalarWhereWithAggregatesInput | KimchiPremiumScalarWhereWithAggregatesInput[]
    OR?: KimchiPremiumScalarWhereWithAggregatesInput[]
    NOT?: KimchiPremiumScalarWhereWithAggregatesInput | KimchiPremiumScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"KimchiPremium"> | number
    symbol?: StringWithAggregatesFilter<"KimchiPremium"> | string
    upbitPrice?: DecimalWithAggregatesFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    binancePrice?: DecimalWithAggregatesFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    premiumRate?: DecimalWithAggregatesFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    timestamp?: DateTimeWithAggregatesFilter<"KimchiPremium"> | Date | string
    exchangeRate?: DecimalWithAggregatesFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
    premiumAmount?: DecimalWithAggregatesFilter<"KimchiPremium"> | Decimal | DecimalJsLike | number | string
  }

  export type PerformanceStatWhereInput = {
    AND?: PerformanceStatWhereInput | PerformanceStatWhereInput[]
    OR?: PerformanceStatWhereInput[]
    NOT?: PerformanceStatWhereInput | PerformanceStatWhereInput[]
    id?: IntFilter<"PerformanceStat"> | number
    userId?: IntFilter<"PerformanceStat"> | number
    date?: StringFilter<"PerformanceStat"> | string
    totalTrades?: IntFilter<"PerformanceStat"> | number
    successfulTrades?: IntFilter<"PerformanceStat"> | number
    dailyProfit?: DecimalFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    dailyVolume?: DecimalFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    winRate?: DecimalFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    avgProfitPerTrade?: DecimalFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"PerformanceStat"> | Date | string
  }

  export type PerformanceStatOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    date?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    dailyProfit?: SortOrder
    dailyVolume?: SortOrder
    winRate?: SortOrder
    avgProfitPerTrade?: SortOrder
    maxDrawdown?: SortOrder
    createdAt?: SortOrder
  }

  export type PerformanceStatWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: PerformanceStatWhereInput | PerformanceStatWhereInput[]
    OR?: PerformanceStatWhereInput[]
    NOT?: PerformanceStatWhereInput | PerformanceStatWhereInput[]
    userId?: IntFilter<"PerformanceStat"> | number
    date?: StringFilter<"PerformanceStat"> | string
    totalTrades?: IntFilter<"PerformanceStat"> | number
    successfulTrades?: IntFilter<"PerformanceStat"> | number
    dailyProfit?: DecimalFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    dailyVolume?: DecimalFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    winRate?: DecimalFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    avgProfitPerTrade?: DecimalFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"PerformanceStat"> | Date | string
  }, "id">

  export type PerformanceStatOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    date?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    dailyProfit?: SortOrder
    dailyVolume?: SortOrder
    winRate?: SortOrder
    avgProfitPerTrade?: SortOrder
    maxDrawdown?: SortOrder
    createdAt?: SortOrder
    _count?: PerformanceStatCountOrderByAggregateInput
    _avg?: PerformanceStatAvgOrderByAggregateInput
    _max?: PerformanceStatMaxOrderByAggregateInput
    _min?: PerformanceStatMinOrderByAggregateInput
    _sum?: PerformanceStatSumOrderByAggregateInput
  }

  export type PerformanceStatScalarWhereWithAggregatesInput = {
    AND?: PerformanceStatScalarWhereWithAggregatesInput | PerformanceStatScalarWhereWithAggregatesInput[]
    OR?: PerformanceStatScalarWhereWithAggregatesInput[]
    NOT?: PerformanceStatScalarWhereWithAggregatesInput | PerformanceStatScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"PerformanceStat"> | number
    userId?: IntWithAggregatesFilter<"PerformanceStat"> | number
    date?: StringWithAggregatesFilter<"PerformanceStat"> | string
    totalTrades?: IntWithAggregatesFilter<"PerformanceStat"> | number
    successfulTrades?: IntWithAggregatesFilter<"PerformanceStat"> | number
    dailyProfit?: DecimalWithAggregatesFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    dailyVolume?: DecimalWithAggregatesFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    winRate?: DecimalWithAggregatesFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    avgProfitPerTrade?: DecimalWithAggregatesFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalWithAggregatesFilter<"PerformanceStat"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeWithAggregatesFilter<"PerformanceStat"> | Date | string
  }

  export type PositionWhereInput = {
    AND?: PositionWhereInput | PositionWhereInput[]
    OR?: PositionWhereInput[]
    NOT?: PositionWhereInput | PositionWhereInput[]
    id?: IntFilter<"Position"> | number
    userId?: IntFilter<"Position"> | number
    strategyId?: IntNullableFilter<"Position"> | number | null
    symbol?: StringFilter<"Position"> | string
    type?: StringFilter<"Position"> | string
    entryPrice?: DecimalFilter<"Position"> | Decimal | DecimalJsLike | number | string
    currentPrice?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    quantity?: DecimalFilter<"Position"> | Decimal | DecimalJsLike | number | string
    entryPremiumRate?: DecimalFilter<"Position"> | Decimal | DecimalJsLike | number | string
    currentPremiumRate?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    status?: StringFilter<"Position"> | string
    entryTime?: DateTimeFilter<"Position"> | Date | string
    exitTime?: DateTimeNullableFilter<"Position"> | Date | string | null
    upbitOrderId?: StringNullableFilter<"Position"> | string | null
    binanceOrderId?: StringNullableFilter<"Position"> | string | null
    side?: StringFilter<"Position"> | string
    exitPrice?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    exitPremiumRate?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    unrealizedPnl?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    realizedPnl?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFilter<"Position"> | Date | string
    updatedAt?: DateTimeFilter<"Position"> | Date | string
  }

  export type PositionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    strategyId?: SortOrderInput | SortOrder
    symbol?: SortOrder
    type?: SortOrder
    entryPrice?: SortOrder
    currentPrice?: SortOrderInput | SortOrder
    quantity?: SortOrder
    entryPremiumRate?: SortOrder
    currentPremiumRate?: SortOrderInput | SortOrder
    status?: SortOrder
    entryTime?: SortOrder
    exitTime?: SortOrderInput | SortOrder
    upbitOrderId?: SortOrderInput | SortOrder
    binanceOrderId?: SortOrderInput | SortOrder
    side?: SortOrder
    exitPrice?: SortOrderInput | SortOrder
    exitPremiumRate?: SortOrderInput | SortOrder
    unrealizedPnl?: SortOrderInput | SortOrder
    realizedPnl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PositionWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: PositionWhereInput | PositionWhereInput[]
    OR?: PositionWhereInput[]
    NOT?: PositionWhereInput | PositionWhereInput[]
    userId?: IntFilter<"Position"> | number
    strategyId?: IntNullableFilter<"Position"> | number | null
    symbol?: StringFilter<"Position"> | string
    type?: StringFilter<"Position"> | string
    entryPrice?: DecimalFilter<"Position"> | Decimal | DecimalJsLike | number | string
    currentPrice?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    quantity?: DecimalFilter<"Position"> | Decimal | DecimalJsLike | number | string
    entryPremiumRate?: DecimalFilter<"Position"> | Decimal | DecimalJsLike | number | string
    currentPremiumRate?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    status?: StringFilter<"Position"> | string
    entryTime?: DateTimeFilter<"Position"> | Date | string
    exitTime?: DateTimeNullableFilter<"Position"> | Date | string | null
    upbitOrderId?: StringNullableFilter<"Position"> | string | null
    binanceOrderId?: StringNullableFilter<"Position"> | string | null
    side?: StringFilter<"Position"> | string
    exitPrice?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    exitPremiumRate?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    unrealizedPnl?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    realizedPnl?: DecimalNullableFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFilter<"Position"> | Date | string
    updatedAt?: DateTimeFilter<"Position"> | Date | string
  }, "id">

  export type PositionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    strategyId?: SortOrderInput | SortOrder
    symbol?: SortOrder
    type?: SortOrder
    entryPrice?: SortOrder
    currentPrice?: SortOrderInput | SortOrder
    quantity?: SortOrder
    entryPremiumRate?: SortOrder
    currentPremiumRate?: SortOrderInput | SortOrder
    status?: SortOrder
    entryTime?: SortOrder
    exitTime?: SortOrderInput | SortOrder
    upbitOrderId?: SortOrderInput | SortOrder
    binanceOrderId?: SortOrderInput | SortOrder
    side?: SortOrder
    exitPrice?: SortOrderInput | SortOrder
    exitPremiumRate?: SortOrderInput | SortOrder
    unrealizedPnl?: SortOrderInput | SortOrder
    realizedPnl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PositionCountOrderByAggregateInput
    _avg?: PositionAvgOrderByAggregateInput
    _max?: PositionMaxOrderByAggregateInput
    _min?: PositionMinOrderByAggregateInput
    _sum?: PositionSumOrderByAggregateInput
  }

  export type PositionScalarWhereWithAggregatesInput = {
    AND?: PositionScalarWhereWithAggregatesInput | PositionScalarWhereWithAggregatesInput[]
    OR?: PositionScalarWhereWithAggregatesInput[]
    NOT?: PositionScalarWhereWithAggregatesInput | PositionScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Position"> | number
    userId?: IntWithAggregatesFilter<"Position"> | number
    strategyId?: IntNullableWithAggregatesFilter<"Position"> | number | null
    symbol?: StringWithAggregatesFilter<"Position"> | string
    type?: StringWithAggregatesFilter<"Position"> | string
    entryPrice?: DecimalWithAggregatesFilter<"Position"> | Decimal | DecimalJsLike | number | string
    currentPrice?: DecimalNullableWithAggregatesFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    quantity?: DecimalWithAggregatesFilter<"Position"> | Decimal | DecimalJsLike | number | string
    entryPremiumRate?: DecimalWithAggregatesFilter<"Position"> | Decimal | DecimalJsLike | number | string
    currentPremiumRate?: DecimalNullableWithAggregatesFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    status?: StringWithAggregatesFilter<"Position"> | string
    entryTime?: DateTimeWithAggregatesFilter<"Position"> | Date | string
    exitTime?: DateTimeNullableWithAggregatesFilter<"Position"> | Date | string | null
    upbitOrderId?: StringNullableWithAggregatesFilter<"Position"> | string | null
    binanceOrderId?: StringNullableWithAggregatesFilter<"Position"> | string | null
    side?: StringWithAggregatesFilter<"Position"> | string
    exitPrice?: DecimalNullableWithAggregatesFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    exitPremiumRate?: DecimalNullableWithAggregatesFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    unrealizedPnl?: DecimalNullableWithAggregatesFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    realizedPnl?: DecimalNullableWithAggregatesFilter<"Position"> | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Position"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Position"> | Date | string
  }

  export type SessionWhereInput = {
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    sid?: StringFilter<"Session"> | string
    sess?: JsonFilter<"Session">
    expire?: DateTimeFilter<"Session"> | Date | string
  }

  export type SessionOrderByWithRelationInput = {
    sid?: SortOrder
    sess?: SortOrder
    expire?: SortOrder
  }

  export type SessionWhereUniqueInput = Prisma.AtLeast<{
    sid?: string
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    sess?: JsonFilter<"Session">
    expire?: DateTimeFilter<"Session"> | Date | string
  }, "sid">

  export type SessionOrderByWithAggregationInput = {
    sid?: SortOrder
    sess?: SortOrder
    expire?: SortOrder
    _count?: SessionCountOrderByAggregateInput
    _max?: SessionMaxOrderByAggregateInput
    _min?: SessionMinOrderByAggregateInput
  }

  export type SessionScalarWhereWithAggregatesInput = {
    AND?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    OR?: SessionScalarWhereWithAggregatesInput[]
    NOT?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    sid?: StringWithAggregatesFilter<"Session"> | string
    sess?: JsonWithAggregatesFilter<"Session">
    expire?: DateTimeWithAggregatesFilter<"Session"> | Date | string
  }

  export type SystemAlertWhereInput = {
    AND?: SystemAlertWhereInput | SystemAlertWhereInput[]
    OR?: SystemAlertWhereInput[]
    NOT?: SystemAlertWhereInput | SystemAlertWhereInput[]
    id?: IntFilter<"SystemAlert"> | number
    type?: StringFilter<"SystemAlert"> | string
    title?: StringFilter<"SystemAlert"> | string
    message?: StringFilter<"SystemAlert"> | string
    isRead?: BoolFilter<"SystemAlert"> | boolean
    userId?: IntNullableFilter<"SystemAlert"> | number | null
    data?: JsonNullableFilter<"SystemAlert">
    priority?: StringFilter<"SystemAlert"> | string
    createdAt?: DateTimeFilter<"SystemAlert"> | Date | string
  }

  export type SystemAlertOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    isRead?: SortOrder
    userId?: SortOrderInput | SortOrder
    data?: SortOrderInput | SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
  }

  export type SystemAlertWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: SystemAlertWhereInput | SystemAlertWhereInput[]
    OR?: SystemAlertWhereInput[]
    NOT?: SystemAlertWhereInput | SystemAlertWhereInput[]
    type?: StringFilter<"SystemAlert"> | string
    title?: StringFilter<"SystemAlert"> | string
    message?: StringFilter<"SystemAlert"> | string
    isRead?: BoolFilter<"SystemAlert"> | boolean
    userId?: IntNullableFilter<"SystemAlert"> | number | null
    data?: JsonNullableFilter<"SystemAlert">
    priority?: StringFilter<"SystemAlert"> | string
    createdAt?: DateTimeFilter<"SystemAlert"> | Date | string
  }, "id">

  export type SystemAlertOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    isRead?: SortOrder
    userId?: SortOrderInput | SortOrder
    data?: SortOrderInput | SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
    _count?: SystemAlertCountOrderByAggregateInput
    _avg?: SystemAlertAvgOrderByAggregateInput
    _max?: SystemAlertMaxOrderByAggregateInput
    _min?: SystemAlertMinOrderByAggregateInput
    _sum?: SystemAlertSumOrderByAggregateInput
  }

  export type SystemAlertScalarWhereWithAggregatesInput = {
    AND?: SystemAlertScalarWhereWithAggregatesInput | SystemAlertScalarWhereWithAggregatesInput[]
    OR?: SystemAlertScalarWhereWithAggregatesInput[]
    NOT?: SystemAlertScalarWhereWithAggregatesInput | SystemAlertScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"SystemAlert"> | number
    type?: StringWithAggregatesFilter<"SystemAlert"> | string
    title?: StringWithAggregatesFilter<"SystemAlert"> | string
    message?: StringWithAggregatesFilter<"SystemAlert"> | string
    isRead?: BoolWithAggregatesFilter<"SystemAlert"> | boolean
    userId?: IntNullableWithAggregatesFilter<"SystemAlert"> | number | null
    data?: JsonNullableWithAggregatesFilter<"SystemAlert">
    priority?: StringWithAggregatesFilter<"SystemAlert"> | string
    createdAt?: DateTimeWithAggregatesFilter<"SystemAlert"> | Date | string
  }

  export type TradeWhereInput = {
    AND?: TradeWhereInput | TradeWhereInput[]
    OR?: TradeWhereInput[]
    NOT?: TradeWhereInput | TradeWhereInput[]
    id?: IntFilter<"Trade"> | number
    userId?: IntFilter<"Trade"> | number
    positionId?: IntNullableFilter<"Trade"> | number | null
    symbol?: StringFilter<"Trade"> | string
    side?: StringFilter<"Trade"> | string
    exchange?: StringFilter<"Trade"> | string
    quantity?: DecimalFilter<"Trade"> | Decimal | DecimalJsLike | number | string
    price?: DecimalFilter<"Trade"> | Decimal | DecimalJsLike | number | string
    fee?: DecimalFilter<"Trade"> | Decimal | DecimalJsLike | number | string
    orderType?: StringFilter<"Trade"> | string
    exchangeOrderId?: StringNullableFilter<"Trade"> | string | null
    exchangeTradeId?: StringNullableFilter<"Trade"> | string | null
    executedAt?: DateTimeFilter<"Trade"> | Date | string
    createdAt?: DateTimeFilter<"Trade"> | Date | string
  }

  export type TradeOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    positionId?: SortOrderInput | SortOrder
    symbol?: SortOrder
    side?: SortOrder
    exchange?: SortOrder
    quantity?: SortOrder
    price?: SortOrder
    fee?: SortOrder
    orderType?: SortOrder
    exchangeOrderId?: SortOrderInput | SortOrder
    exchangeTradeId?: SortOrderInput | SortOrder
    executedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type TradeWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: TradeWhereInput | TradeWhereInput[]
    OR?: TradeWhereInput[]
    NOT?: TradeWhereInput | TradeWhereInput[]
    userId?: IntFilter<"Trade"> | number
    positionId?: IntNullableFilter<"Trade"> | number | null
    symbol?: StringFilter<"Trade"> | string
    side?: StringFilter<"Trade"> | string
    exchange?: StringFilter<"Trade"> | string
    quantity?: DecimalFilter<"Trade"> | Decimal | DecimalJsLike | number | string
    price?: DecimalFilter<"Trade"> | Decimal | DecimalJsLike | number | string
    fee?: DecimalFilter<"Trade"> | Decimal | DecimalJsLike | number | string
    orderType?: StringFilter<"Trade"> | string
    exchangeOrderId?: StringNullableFilter<"Trade"> | string | null
    exchangeTradeId?: StringNullableFilter<"Trade"> | string | null
    executedAt?: DateTimeFilter<"Trade"> | Date | string
    createdAt?: DateTimeFilter<"Trade"> | Date | string
  }, "id">

  export type TradeOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    positionId?: SortOrderInput | SortOrder
    symbol?: SortOrder
    side?: SortOrder
    exchange?: SortOrder
    quantity?: SortOrder
    price?: SortOrder
    fee?: SortOrder
    orderType?: SortOrder
    exchangeOrderId?: SortOrderInput | SortOrder
    exchangeTradeId?: SortOrderInput | SortOrder
    executedAt?: SortOrder
    createdAt?: SortOrder
    _count?: TradeCountOrderByAggregateInput
    _avg?: TradeAvgOrderByAggregateInput
    _max?: TradeMaxOrderByAggregateInput
    _min?: TradeMinOrderByAggregateInput
    _sum?: TradeSumOrderByAggregateInput
  }

  export type TradeScalarWhereWithAggregatesInput = {
    AND?: TradeScalarWhereWithAggregatesInput | TradeScalarWhereWithAggregatesInput[]
    OR?: TradeScalarWhereWithAggregatesInput[]
    NOT?: TradeScalarWhereWithAggregatesInput | TradeScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Trade"> | number
    userId?: IntWithAggregatesFilter<"Trade"> | number
    positionId?: IntNullableWithAggregatesFilter<"Trade"> | number | null
    symbol?: StringWithAggregatesFilter<"Trade"> | string
    side?: StringWithAggregatesFilter<"Trade"> | string
    exchange?: StringWithAggregatesFilter<"Trade"> | string
    quantity?: DecimalWithAggregatesFilter<"Trade"> | Decimal | DecimalJsLike | number | string
    price?: DecimalWithAggregatesFilter<"Trade"> | Decimal | DecimalJsLike | number | string
    fee?: DecimalWithAggregatesFilter<"Trade"> | Decimal | DecimalJsLike | number | string
    orderType?: StringWithAggregatesFilter<"Trade"> | string
    exchangeOrderId?: StringNullableWithAggregatesFilter<"Trade"> | string | null
    exchangeTradeId?: StringNullableWithAggregatesFilter<"Trade"> | string | null
    executedAt?: DateTimeWithAggregatesFilter<"Trade"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"Trade"> | Date | string
  }

  export type TradingSettingWhereInput = {
    AND?: TradingSettingWhereInput | TradingSettingWhereInput[]
    OR?: TradingSettingWhereInput[]
    NOT?: TradingSettingWhereInput | TradingSettingWhereInput[]
    id?: IntFilter<"TradingSetting"> | number
    userId?: IntFilter<"TradingSetting"> | number
    entryPremiumRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    exitPremiumRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    stopLossRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    maxPositions?: IntFilter<"TradingSetting"> | number
    isAutoTrading?: BoolFilter<"TradingSetting"> | boolean
    maxInvestmentAmount?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    kimchiEntryRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    kimchiExitRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    kimchiToleranceRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    binanceLeverage?: IntFilter<"TradingSetting"> | number
    upbitEntryAmount?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    dailyLossLimit?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    maxPositionSize?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"TradingSetting"> | Date | string
    updatedAt?: DateTimeFilter<"TradingSetting"> | Date | string
  }

  export type TradingSettingOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    entryPremiumRate?: SortOrder
    exitPremiumRate?: SortOrder
    stopLossRate?: SortOrder
    maxPositions?: SortOrder
    isAutoTrading?: SortOrder
    maxInvestmentAmount?: SortOrder
    kimchiEntryRate?: SortOrder
    kimchiExitRate?: SortOrder
    kimchiToleranceRate?: SortOrder
    binanceLeverage?: SortOrder
    upbitEntryAmount?: SortOrder
    dailyLossLimit?: SortOrder
    maxPositionSize?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TradingSettingWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    userId?: number
    AND?: TradingSettingWhereInput | TradingSettingWhereInput[]
    OR?: TradingSettingWhereInput[]
    NOT?: TradingSettingWhereInput | TradingSettingWhereInput[]
    entryPremiumRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    exitPremiumRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    stopLossRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    maxPositions?: IntFilter<"TradingSetting"> | number
    isAutoTrading?: BoolFilter<"TradingSetting"> | boolean
    maxInvestmentAmount?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    kimchiEntryRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    kimchiExitRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    kimchiToleranceRate?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    binanceLeverage?: IntFilter<"TradingSetting"> | number
    upbitEntryAmount?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    dailyLossLimit?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    maxPositionSize?: DecimalFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"TradingSetting"> | Date | string
    updatedAt?: DateTimeFilter<"TradingSetting"> | Date | string
  }, "id" | "userId">

  export type TradingSettingOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    entryPremiumRate?: SortOrder
    exitPremiumRate?: SortOrder
    stopLossRate?: SortOrder
    maxPositions?: SortOrder
    isAutoTrading?: SortOrder
    maxInvestmentAmount?: SortOrder
    kimchiEntryRate?: SortOrder
    kimchiExitRate?: SortOrder
    kimchiToleranceRate?: SortOrder
    binanceLeverage?: SortOrder
    upbitEntryAmount?: SortOrder
    dailyLossLimit?: SortOrder
    maxPositionSize?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TradingSettingCountOrderByAggregateInput
    _avg?: TradingSettingAvgOrderByAggregateInput
    _max?: TradingSettingMaxOrderByAggregateInput
    _min?: TradingSettingMinOrderByAggregateInput
    _sum?: TradingSettingSumOrderByAggregateInput
  }

  export type TradingSettingScalarWhereWithAggregatesInput = {
    AND?: TradingSettingScalarWhereWithAggregatesInput | TradingSettingScalarWhereWithAggregatesInput[]
    OR?: TradingSettingScalarWhereWithAggregatesInput[]
    NOT?: TradingSettingScalarWhereWithAggregatesInput | TradingSettingScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"TradingSetting"> | number
    userId?: IntWithAggregatesFilter<"TradingSetting"> | number
    entryPremiumRate?: DecimalWithAggregatesFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    exitPremiumRate?: DecimalWithAggregatesFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    stopLossRate?: DecimalWithAggregatesFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    maxPositions?: IntWithAggregatesFilter<"TradingSetting"> | number
    isAutoTrading?: BoolWithAggregatesFilter<"TradingSetting"> | boolean
    maxInvestmentAmount?: DecimalWithAggregatesFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    kimchiEntryRate?: DecimalWithAggregatesFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    kimchiExitRate?: DecimalWithAggregatesFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    kimchiToleranceRate?: DecimalWithAggregatesFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    binanceLeverage?: IntWithAggregatesFilter<"TradingSetting"> | number
    upbitEntryAmount?: DecimalWithAggregatesFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    dailyLossLimit?: DecimalWithAggregatesFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    maxPositionSize?: DecimalWithAggregatesFilter<"TradingSetting"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeWithAggregatesFilter<"TradingSetting"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TradingSetting"> | Date | string
  }

  export type TradingStrategyWhereInput = {
    AND?: TradingStrategyWhereInput | TradingStrategyWhereInput[]
    OR?: TradingStrategyWhereInput[]
    NOT?: TradingStrategyWhereInput | TradingStrategyWhereInput[]
    id?: IntFilter<"TradingStrategy"> | number
    userId?: IntFilter<"TradingStrategy"> | number
    name?: StringFilter<"TradingStrategy"> | string
    entryRate?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    exitRate?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    leverage?: IntFilter<"TradingStrategy"> | number
    investmentAmount?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    isActive?: BoolFilter<"TradingStrategy"> | boolean
    createdAt?: DateTimeFilter<"TradingStrategy"> | Date | string
    updatedAt?: DateTimeFilter<"TradingStrategy"> | Date | string
    symbol?: StringFilter<"TradingStrategy"> | string
    tolerance?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    isAutoTrading?: BoolFilter<"TradingStrategy"> | boolean
    totalTrades?: IntFilter<"TradingStrategy"> | number
    successfulTrades?: IntFilter<"TradingStrategy"> | number
    totalProfit?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    strategyType?: StringFilter<"TradingStrategy"> | string
    toleranceRate?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
  }

  export type TradingStrategyOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    entryRate?: SortOrder
    exitRate?: SortOrder
    leverage?: SortOrder
    investmentAmount?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    symbol?: SortOrder
    tolerance?: SortOrder
    isAutoTrading?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    totalProfit?: SortOrder
    strategyType?: SortOrder
    toleranceRate?: SortOrder
  }

  export type TradingStrategyWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: TradingStrategyWhereInput | TradingStrategyWhereInput[]
    OR?: TradingStrategyWhereInput[]
    NOT?: TradingStrategyWhereInput | TradingStrategyWhereInput[]
    userId?: IntFilter<"TradingStrategy"> | number
    name?: StringFilter<"TradingStrategy"> | string
    entryRate?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    exitRate?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    leverage?: IntFilter<"TradingStrategy"> | number
    investmentAmount?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    isActive?: BoolFilter<"TradingStrategy"> | boolean
    createdAt?: DateTimeFilter<"TradingStrategy"> | Date | string
    updatedAt?: DateTimeFilter<"TradingStrategy"> | Date | string
    symbol?: StringFilter<"TradingStrategy"> | string
    tolerance?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    isAutoTrading?: BoolFilter<"TradingStrategy"> | boolean
    totalTrades?: IntFilter<"TradingStrategy"> | number
    successfulTrades?: IntFilter<"TradingStrategy"> | number
    totalProfit?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    strategyType?: StringFilter<"TradingStrategy"> | string
    toleranceRate?: DecimalFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
  }, "id">

  export type TradingStrategyOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    entryRate?: SortOrder
    exitRate?: SortOrder
    leverage?: SortOrder
    investmentAmount?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    symbol?: SortOrder
    tolerance?: SortOrder
    isAutoTrading?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    totalProfit?: SortOrder
    strategyType?: SortOrder
    toleranceRate?: SortOrder
    _count?: TradingStrategyCountOrderByAggregateInput
    _avg?: TradingStrategyAvgOrderByAggregateInput
    _max?: TradingStrategyMaxOrderByAggregateInput
    _min?: TradingStrategyMinOrderByAggregateInput
    _sum?: TradingStrategySumOrderByAggregateInput
  }

  export type TradingStrategyScalarWhereWithAggregatesInput = {
    AND?: TradingStrategyScalarWhereWithAggregatesInput | TradingStrategyScalarWhereWithAggregatesInput[]
    OR?: TradingStrategyScalarWhereWithAggregatesInput[]
    NOT?: TradingStrategyScalarWhereWithAggregatesInput | TradingStrategyScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"TradingStrategy"> | number
    userId?: IntWithAggregatesFilter<"TradingStrategy"> | number
    name?: StringWithAggregatesFilter<"TradingStrategy"> | string
    entryRate?: DecimalWithAggregatesFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    exitRate?: DecimalWithAggregatesFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    leverage?: IntWithAggregatesFilter<"TradingStrategy"> | number
    investmentAmount?: DecimalWithAggregatesFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    isActive?: BoolWithAggregatesFilter<"TradingStrategy"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"TradingStrategy"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TradingStrategy"> | Date | string
    symbol?: StringWithAggregatesFilter<"TradingStrategy"> | string
    tolerance?: DecimalWithAggregatesFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    isAutoTrading?: BoolWithAggregatesFilter<"TradingStrategy"> | boolean
    totalTrades?: IntWithAggregatesFilter<"TradingStrategy"> | number
    successfulTrades?: IntWithAggregatesFilter<"TradingStrategy"> | number
    totalProfit?: DecimalWithAggregatesFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
    strategyType?: StringWithAggregatesFilter<"TradingStrategy"> | string
    toleranceRate?: DecimalWithAggregatesFilter<"TradingStrategy"> | Decimal | DecimalJsLike | number | string
  }

  export type TradeLogCreateInput = {
    timestamp?: Date | string
    kimp: number
    action: string
    amount: number
    result: string
  }

  export type TradeLogUncheckedCreateInput = {
    id?: number
    timestamp?: Date | string
    kimp: number
    action: string
    amount: number
    result: string
  }

  export type TradeLogUpdateInput = {
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    kimp?: FloatFieldUpdateOperationsInput | number
    action?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    result?: StringFieldUpdateOperationsInput | string
  }

  export type TradeLogUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    kimp?: FloatFieldUpdateOperationsInput | number
    action?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    result?: StringFieldUpdateOperationsInput | string
  }

  export type TradeLogCreateManyInput = {
    id?: number
    timestamp?: Date | string
    kimp: number
    action: string
    amount: number
    result: string
  }

  export type TradeLogUpdateManyMutationInput = {
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    kimp?: FloatFieldUpdateOperationsInput | number
    action?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    result?: StringFieldUpdateOperationsInput | string
  }

  export type TradeLogUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    kimp?: FloatFieldUpdateOperationsInput | number
    action?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    result?: StringFieldUpdateOperationsInput | string
  }

  export type UserCreateInput = {
    username: string
    role?: string
    isActive?: boolean
    lastLoginAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    passwordHash?: string | null
    email?: string | null
    firstName?: string | null
    lastName?: string | null
    profileImageUrl?: string | null
    password: string
  }

  export type UserUncheckedCreateInput = {
    id?: number
    username: string
    role?: string
    isActive?: boolean
    lastLoginAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    passwordHash?: string | null
    email?: string | null
    firstName?: string | null
    lastName?: string | null
    profileImageUrl?: string | null
    password: string
  }

  export type UserUpdateInput = {
    username?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    profileImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    username?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    profileImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
  }

  export type UserCreateManyInput = {
    id?: number
    username: string
    role?: string
    isActive?: boolean
    lastLoginAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    passwordHash?: string | null
    email?: string | null
    firstName?: string | null
    lastName?: string | null
    profileImageUrl?: string | null
    password: string
  }

  export type UserUpdateManyMutationInput = {
    username?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    profileImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    username?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    profileImageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
  }

  export type CryptocurrencyCreateInput = {
    symbol: string
    name: string
    isActive?: boolean
    createdAt?: Date | string
    upbitMarket?: string | null
    binanceSymbol?: string | null
    priority?: number
  }

  export type CryptocurrencyUncheckedCreateInput = {
    id?: number
    symbol: string
    name: string
    isActive?: boolean
    createdAt?: Date | string
    upbitMarket?: string | null
    binanceSymbol?: string | null
    priority?: number
  }

  export type CryptocurrencyUpdateInput = {
    symbol?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    upbitMarket?: NullableStringFieldUpdateOperationsInput | string | null
    binanceSymbol?: NullableStringFieldUpdateOperationsInput | string | null
    priority?: IntFieldUpdateOperationsInput | number
  }

  export type CryptocurrencyUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    symbol?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    upbitMarket?: NullableStringFieldUpdateOperationsInput | string | null
    binanceSymbol?: NullableStringFieldUpdateOperationsInput | string | null
    priority?: IntFieldUpdateOperationsInput | number
  }

  export type CryptocurrencyCreateManyInput = {
    id?: number
    symbol: string
    name: string
    isActive?: boolean
    createdAt?: Date | string
    upbitMarket?: string | null
    binanceSymbol?: string | null
    priority?: number
  }

  export type CryptocurrencyUpdateManyMutationInput = {
    symbol?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    upbitMarket?: NullableStringFieldUpdateOperationsInput | string | null
    binanceSymbol?: NullableStringFieldUpdateOperationsInput | string | null
    priority?: IntFieldUpdateOperationsInput | number
  }

  export type CryptocurrencyUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    symbol?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    upbitMarket?: NullableStringFieldUpdateOperationsInput | string | null
    binanceSymbol?: NullableStringFieldUpdateOperationsInput | string | null
    priority?: IntFieldUpdateOperationsInput | number
  }

  export type ExchangeCreateInput = {
    apiKey: string
    isActive?: boolean
    userId: number
    exchange: string
    apiSecret: string
    passphrase?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExchangeUncheckedCreateInput = {
    id?: number
    apiKey: string
    isActive?: boolean
    userId: number
    exchange: string
    apiSecret: string
    passphrase?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExchangeUpdateInput = {
    apiKey?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    userId?: IntFieldUpdateOperationsInput | number
    exchange?: StringFieldUpdateOperationsInput | string
    apiSecret?: StringFieldUpdateOperationsInput | string
    passphrase?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExchangeUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    apiKey?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    userId?: IntFieldUpdateOperationsInput | number
    exchange?: StringFieldUpdateOperationsInput | string
    apiSecret?: StringFieldUpdateOperationsInput | string
    passphrase?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExchangeCreateManyInput = {
    id?: number
    apiKey: string
    isActive?: boolean
    userId: number
    exchange: string
    apiSecret: string
    passphrase?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ExchangeUpdateManyMutationInput = {
    apiKey?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    userId?: IntFieldUpdateOperationsInput | number
    exchange?: StringFieldUpdateOperationsInput | string
    apiSecret?: StringFieldUpdateOperationsInput | string
    passphrase?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ExchangeUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    apiKey?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    userId?: IntFieldUpdateOperationsInput | number
    exchange?: StringFieldUpdateOperationsInput | string
    apiSecret?: StringFieldUpdateOperationsInput | string
    passphrase?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type KimchiPremiumCreateInput = {
    symbol: string
    upbitPrice: Decimal | DecimalJsLike | number | string
    binancePrice: Decimal | DecimalJsLike | number | string
    premiumRate: Decimal | DecimalJsLike | number | string
    timestamp?: Date | string
    exchangeRate: Decimal | DecimalJsLike | number | string
    premiumAmount: Decimal | DecimalJsLike | number | string
  }

  export type KimchiPremiumUncheckedCreateInput = {
    id?: number
    symbol: string
    upbitPrice: Decimal | DecimalJsLike | number | string
    binancePrice: Decimal | DecimalJsLike | number | string
    premiumRate: Decimal | DecimalJsLike | number | string
    timestamp?: Date | string
    exchangeRate: Decimal | DecimalJsLike | number | string
    premiumAmount: Decimal | DecimalJsLike | number | string
  }

  export type KimchiPremiumUpdateInput = {
    symbol?: StringFieldUpdateOperationsInput | string
    upbitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    binancePrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    premiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    exchangeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    premiumAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type KimchiPremiumUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    symbol?: StringFieldUpdateOperationsInput | string
    upbitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    binancePrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    premiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    exchangeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    premiumAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type KimchiPremiumCreateManyInput = {
    id?: number
    symbol: string
    upbitPrice: Decimal | DecimalJsLike | number | string
    binancePrice: Decimal | DecimalJsLike | number | string
    premiumRate: Decimal | DecimalJsLike | number | string
    timestamp?: Date | string
    exchangeRate: Decimal | DecimalJsLike | number | string
    premiumAmount: Decimal | DecimalJsLike | number | string
  }

  export type KimchiPremiumUpdateManyMutationInput = {
    symbol?: StringFieldUpdateOperationsInput | string
    upbitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    binancePrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    premiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    exchangeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    premiumAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type KimchiPremiumUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    symbol?: StringFieldUpdateOperationsInput | string
    upbitPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    binancePrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    premiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    exchangeRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    premiumAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type PerformanceStatCreateInput = {
    userId: number
    date: string
    totalTrades?: number
    successfulTrades?: number
    dailyProfit?: Decimal | DecimalJsLike | number | string
    dailyVolume?: Decimal | DecimalJsLike | number | string
    winRate?: Decimal | DecimalJsLike | number | string
    avgProfitPerTrade?: Decimal | DecimalJsLike | number | string
    maxDrawdown?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type PerformanceStatUncheckedCreateInput = {
    id?: number
    userId: number
    date: string
    totalTrades?: number
    successfulTrades?: number
    dailyProfit?: Decimal | DecimalJsLike | number | string
    dailyVolume?: Decimal | DecimalJsLike | number | string
    winRate?: Decimal | DecimalJsLike | number | string
    avgProfitPerTrade?: Decimal | DecimalJsLike | number | string
    maxDrawdown?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type PerformanceStatUpdateInput = {
    userId?: IntFieldUpdateOperationsInput | number
    date?: StringFieldUpdateOperationsInput | string
    totalTrades?: IntFieldUpdateOperationsInput | number
    successfulTrades?: IntFieldUpdateOperationsInput | number
    dailyProfit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    winRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    avgProfitPerTrade?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PerformanceStatUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    date?: StringFieldUpdateOperationsInput | string
    totalTrades?: IntFieldUpdateOperationsInput | number
    successfulTrades?: IntFieldUpdateOperationsInput | number
    dailyProfit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    winRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    avgProfitPerTrade?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PerformanceStatCreateManyInput = {
    id?: number
    userId: number
    date: string
    totalTrades?: number
    successfulTrades?: number
    dailyProfit?: Decimal | DecimalJsLike | number | string
    dailyVolume?: Decimal | DecimalJsLike | number | string
    winRate?: Decimal | DecimalJsLike | number | string
    avgProfitPerTrade?: Decimal | DecimalJsLike | number | string
    maxDrawdown?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type PerformanceStatUpdateManyMutationInput = {
    userId?: IntFieldUpdateOperationsInput | number
    date?: StringFieldUpdateOperationsInput | string
    totalTrades?: IntFieldUpdateOperationsInput | number
    successfulTrades?: IntFieldUpdateOperationsInput | number
    dailyProfit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    winRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    avgProfitPerTrade?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PerformanceStatUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    date?: StringFieldUpdateOperationsInput | string
    totalTrades?: IntFieldUpdateOperationsInput | number
    successfulTrades?: IntFieldUpdateOperationsInput | number
    dailyProfit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyVolume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    winRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    avgProfitPerTrade?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxDrawdown?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PositionCreateInput = {
    userId: number
    strategyId?: number | null
    symbol: string
    type?: string
    entryPrice: Decimal | DecimalJsLike | number | string
    currentPrice?: Decimal | DecimalJsLike | number | string | null
    quantity: Decimal | DecimalJsLike | number | string
    entryPremiumRate: Decimal | DecimalJsLike | number | string
    currentPremiumRate?: Decimal | DecimalJsLike | number | string | null
    status?: string
    entryTime?: Date | string
    exitTime?: Date | string | null
    upbitOrderId?: string | null
    binanceOrderId?: string | null
    side: string
    exitPrice?: Decimal | DecimalJsLike | number | string | null
    exitPremiumRate?: Decimal | DecimalJsLike | number | string | null
    unrealizedPnl?: Decimal | DecimalJsLike | number | string | null
    realizedPnl?: Decimal | DecimalJsLike | number | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PositionUncheckedCreateInput = {
    id?: number
    userId: number
    strategyId?: number | null
    symbol: string
    type?: string
    entryPrice: Decimal | DecimalJsLike | number | string
    currentPrice?: Decimal | DecimalJsLike | number | string | null
    quantity: Decimal | DecimalJsLike | number | string
    entryPremiumRate: Decimal | DecimalJsLike | number | string
    currentPremiumRate?: Decimal | DecimalJsLike | number | string | null
    status?: string
    entryTime?: Date | string
    exitTime?: Date | string | null
    upbitOrderId?: string | null
    binanceOrderId?: string | null
    side: string
    exitPrice?: Decimal | DecimalJsLike | number | string | null
    exitPremiumRate?: Decimal | DecimalJsLike | number | string | null
    unrealizedPnl?: Decimal | DecimalJsLike | number | string | null
    realizedPnl?: Decimal | DecimalJsLike | number | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PositionUpdateInput = {
    userId?: IntFieldUpdateOperationsInput | number
    strategyId?: NullableIntFieldUpdateOperationsInput | number | null
    symbol?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    entryPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currentPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    entryPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currentPremiumRate?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    status?: StringFieldUpdateOperationsInput | string
    entryTime?: DateTimeFieldUpdateOperationsInput | Date | string
    exitTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    upbitOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    binanceOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    side?: StringFieldUpdateOperationsInput | string
    exitPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    exitPremiumRate?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    unrealizedPnl?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    realizedPnl?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PositionUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    strategyId?: NullableIntFieldUpdateOperationsInput | number | null
    symbol?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    entryPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currentPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    entryPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currentPremiumRate?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    status?: StringFieldUpdateOperationsInput | string
    entryTime?: DateTimeFieldUpdateOperationsInput | Date | string
    exitTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    upbitOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    binanceOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    side?: StringFieldUpdateOperationsInput | string
    exitPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    exitPremiumRate?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    unrealizedPnl?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    realizedPnl?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PositionCreateManyInput = {
    id?: number
    userId: number
    strategyId?: number | null
    symbol: string
    type?: string
    entryPrice: Decimal | DecimalJsLike | number | string
    currentPrice?: Decimal | DecimalJsLike | number | string | null
    quantity: Decimal | DecimalJsLike | number | string
    entryPremiumRate: Decimal | DecimalJsLike | number | string
    currentPremiumRate?: Decimal | DecimalJsLike | number | string | null
    status?: string
    entryTime?: Date | string
    exitTime?: Date | string | null
    upbitOrderId?: string | null
    binanceOrderId?: string | null
    side: string
    exitPrice?: Decimal | DecimalJsLike | number | string | null
    exitPremiumRate?: Decimal | DecimalJsLike | number | string | null
    unrealizedPnl?: Decimal | DecimalJsLike | number | string | null
    realizedPnl?: Decimal | DecimalJsLike | number | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PositionUpdateManyMutationInput = {
    userId?: IntFieldUpdateOperationsInput | number
    strategyId?: NullableIntFieldUpdateOperationsInput | number | null
    symbol?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    entryPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currentPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    entryPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currentPremiumRate?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    status?: StringFieldUpdateOperationsInput | string
    entryTime?: DateTimeFieldUpdateOperationsInput | Date | string
    exitTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    upbitOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    binanceOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    side?: StringFieldUpdateOperationsInput | string
    exitPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    exitPremiumRate?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    unrealizedPnl?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    realizedPnl?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PositionUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    strategyId?: NullableIntFieldUpdateOperationsInput | number | null
    symbol?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    entryPrice?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currentPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    entryPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currentPremiumRate?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    status?: StringFieldUpdateOperationsInput | string
    entryTime?: DateTimeFieldUpdateOperationsInput | Date | string
    exitTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    upbitOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    binanceOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    side?: StringFieldUpdateOperationsInput | string
    exitPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    exitPremiumRate?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    unrealizedPnl?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    realizedPnl?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionCreateInput = {
    sid: string
    sess: JsonNullValueInput | InputJsonValue
    expire: Date | string
  }

  export type SessionUncheckedCreateInput = {
    sid: string
    sess: JsonNullValueInput | InputJsonValue
    expire: Date | string
  }

  export type SessionUpdateInput = {
    sid?: StringFieldUpdateOperationsInput | string
    sess?: JsonNullValueInput | InputJsonValue
    expire?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateInput = {
    sid?: StringFieldUpdateOperationsInput | string
    sess?: JsonNullValueInput | InputJsonValue
    expire?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionCreateManyInput = {
    sid: string
    sess: JsonNullValueInput | InputJsonValue
    expire: Date | string
  }

  export type SessionUpdateManyMutationInput = {
    sid?: StringFieldUpdateOperationsInput | string
    sess?: JsonNullValueInput | InputJsonValue
    expire?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyInput = {
    sid?: StringFieldUpdateOperationsInput | string
    sess?: JsonNullValueInput | InputJsonValue
    expire?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SystemAlertCreateInput = {
    type: string
    title: string
    message: string
    isRead?: boolean
    userId?: number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    priority?: string
    createdAt?: Date | string
  }

  export type SystemAlertUncheckedCreateInput = {
    id?: number
    type: string
    title: string
    message: string
    isRead?: boolean
    userId?: number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    priority?: string
    createdAt?: Date | string
  }

  export type SystemAlertUpdateInput = {
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    priority?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SystemAlertUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    priority?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SystemAlertCreateManyInput = {
    id?: number
    type: string
    title: string
    message: string
    isRead?: boolean
    userId?: number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    priority?: string
    createdAt?: Date | string
  }

  export type SystemAlertUpdateManyMutationInput = {
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    priority?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SystemAlertUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    userId?: NullableIntFieldUpdateOperationsInput | number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    priority?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TradeCreateInput = {
    userId: number
    positionId?: number | null
    symbol: string
    side: string
    exchange: string
    quantity: Decimal | DecimalJsLike | number | string
    price: Decimal | DecimalJsLike | number | string
    fee?: Decimal | DecimalJsLike | number | string
    orderType?: string
    exchangeOrderId?: string | null
    exchangeTradeId?: string | null
    executedAt?: Date | string
    createdAt?: Date | string
  }

  export type TradeUncheckedCreateInput = {
    id?: number
    userId: number
    positionId?: number | null
    symbol: string
    side: string
    exchange: string
    quantity: Decimal | DecimalJsLike | number | string
    price: Decimal | DecimalJsLike | number | string
    fee?: Decimal | DecimalJsLike | number | string
    orderType?: string
    exchangeOrderId?: string | null
    exchangeTradeId?: string | null
    executedAt?: Date | string
    createdAt?: Date | string
  }

  export type TradeUpdateInput = {
    userId?: IntFieldUpdateOperationsInput | number
    positionId?: NullableIntFieldUpdateOperationsInput | number | null
    symbol?: StringFieldUpdateOperationsInput | string
    side?: StringFieldUpdateOperationsInput | string
    exchange?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    orderType?: StringFieldUpdateOperationsInput | string
    exchangeOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    exchangeTradeId?: NullableStringFieldUpdateOperationsInput | string | null
    executedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TradeUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    positionId?: NullableIntFieldUpdateOperationsInput | number | null
    symbol?: StringFieldUpdateOperationsInput | string
    side?: StringFieldUpdateOperationsInput | string
    exchange?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    orderType?: StringFieldUpdateOperationsInput | string
    exchangeOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    exchangeTradeId?: NullableStringFieldUpdateOperationsInput | string | null
    executedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TradeCreateManyInput = {
    id?: number
    userId: number
    positionId?: number | null
    symbol: string
    side: string
    exchange: string
    quantity: Decimal | DecimalJsLike | number | string
    price: Decimal | DecimalJsLike | number | string
    fee?: Decimal | DecimalJsLike | number | string
    orderType?: string
    exchangeOrderId?: string | null
    exchangeTradeId?: string | null
    executedAt?: Date | string
    createdAt?: Date | string
  }

  export type TradeUpdateManyMutationInput = {
    userId?: IntFieldUpdateOperationsInput | number
    positionId?: NullableIntFieldUpdateOperationsInput | number | null
    symbol?: StringFieldUpdateOperationsInput | string
    side?: StringFieldUpdateOperationsInput | string
    exchange?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    orderType?: StringFieldUpdateOperationsInput | string
    exchangeOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    exchangeTradeId?: NullableStringFieldUpdateOperationsInput | string | null
    executedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TradeUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    positionId?: NullableIntFieldUpdateOperationsInput | number | null
    symbol?: StringFieldUpdateOperationsInput | string
    side?: StringFieldUpdateOperationsInput | string
    exchange?: StringFieldUpdateOperationsInput | string
    quantity?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    orderType?: StringFieldUpdateOperationsInput | string
    exchangeOrderId?: NullableStringFieldUpdateOperationsInput | string | null
    exchangeTradeId?: NullableStringFieldUpdateOperationsInput | string | null
    executedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TradingSettingCreateInput = {
    userId: number
    entryPremiumRate?: Decimal | DecimalJsLike | number | string
    exitPremiumRate?: Decimal | DecimalJsLike | number | string
    stopLossRate?: Decimal | DecimalJsLike | number | string
    maxPositions?: number
    isAutoTrading?: boolean
    maxInvestmentAmount?: Decimal | DecimalJsLike | number | string
    kimchiEntryRate?: Decimal | DecimalJsLike | number | string
    kimchiExitRate?: Decimal | DecimalJsLike | number | string
    kimchiToleranceRate?: Decimal | DecimalJsLike | number | string
    binanceLeverage?: number
    upbitEntryAmount?: Decimal | DecimalJsLike | number | string
    dailyLossLimit?: Decimal | DecimalJsLike | number | string
    maxPositionSize?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TradingSettingUncheckedCreateInput = {
    id?: number
    userId: number
    entryPremiumRate?: Decimal | DecimalJsLike | number | string
    exitPremiumRate?: Decimal | DecimalJsLike | number | string
    stopLossRate?: Decimal | DecimalJsLike | number | string
    maxPositions?: number
    isAutoTrading?: boolean
    maxInvestmentAmount?: Decimal | DecimalJsLike | number | string
    kimchiEntryRate?: Decimal | DecimalJsLike | number | string
    kimchiExitRate?: Decimal | DecimalJsLike | number | string
    kimchiToleranceRate?: Decimal | DecimalJsLike | number | string
    binanceLeverage?: number
    upbitEntryAmount?: Decimal | DecimalJsLike | number | string
    dailyLossLimit?: Decimal | DecimalJsLike | number | string
    maxPositionSize?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TradingSettingUpdateInput = {
    userId?: IntFieldUpdateOperationsInput | number
    entryPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    exitPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stopLossRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxPositions?: IntFieldUpdateOperationsInput | number
    isAutoTrading?: BoolFieldUpdateOperationsInput | boolean
    maxInvestmentAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiEntryRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiExitRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiToleranceRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    binanceLeverage?: IntFieldUpdateOperationsInput | number
    upbitEntryAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyLossLimit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxPositionSize?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TradingSettingUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    entryPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    exitPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stopLossRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxPositions?: IntFieldUpdateOperationsInput | number
    isAutoTrading?: BoolFieldUpdateOperationsInput | boolean
    maxInvestmentAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiEntryRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiExitRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiToleranceRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    binanceLeverage?: IntFieldUpdateOperationsInput | number
    upbitEntryAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyLossLimit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxPositionSize?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TradingSettingCreateManyInput = {
    id?: number
    userId: number
    entryPremiumRate?: Decimal | DecimalJsLike | number | string
    exitPremiumRate?: Decimal | DecimalJsLike | number | string
    stopLossRate?: Decimal | DecimalJsLike | number | string
    maxPositions?: number
    isAutoTrading?: boolean
    maxInvestmentAmount?: Decimal | DecimalJsLike | number | string
    kimchiEntryRate?: Decimal | DecimalJsLike | number | string
    kimchiExitRate?: Decimal | DecimalJsLike | number | string
    kimchiToleranceRate?: Decimal | DecimalJsLike | number | string
    binanceLeverage?: number
    upbitEntryAmount?: Decimal | DecimalJsLike | number | string
    dailyLossLimit?: Decimal | DecimalJsLike | number | string
    maxPositionSize?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TradingSettingUpdateManyMutationInput = {
    userId?: IntFieldUpdateOperationsInput | number
    entryPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    exitPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stopLossRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxPositions?: IntFieldUpdateOperationsInput | number
    isAutoTrading?: BoolFieldUpdateOperationsInput | boolean
    maxInvestmentAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiEntryRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiExitRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiToleranceRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    binanceLeverage?: IntFieldUpdateOperationsInput | number
    upbitEntryAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyLossLimit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxPositionSize?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TradingSettingUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    entryPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    exitPremiumRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    stopLossRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxPositions?: IntFieldUpdateOperationsInput | number
    isAutoTrading?: BoolFieldUpdateOperationsInput | boolean
    maxInvestmentAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiEntryRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiExitRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    kimchiToleranceRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    binanceLeverage?: IntFieldUpdateOperationsInput | number
    upbitEntryAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dailyLossLimit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    maxPositionSize?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TradingStrategyCreateInput = {
    userId: number
    name: string
    entryRate: Decimal | DecimalJsLike | number | string
    exitRate: Decimal | DecimalJsLike | number | string
    leverage?: number
    investmentAmount: Decimal | DecimalJsLike | number | string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    symbol: string
    tolerance?: Decimal | DecimalJsLike | number | string
    isAutoTrading?: boolean
    totalTrades?: number
    successfulTrades?: number
    totalProfit?: Decimal | DecimalJsLike | number | string
    strategyType?: string
    toleranceRate?: Decimal | DecimalJsLike | number | string
  }

  export type TradingStrategyUncheckedCreateInput = {
    id?: number
    userId: number
    name: string
    entryRate: Decimal | DecimalJsLike | number | string
    exitRate: Decimal | DecimalJsLike | number | string
    leverage?: number
    investmentAmount: Decimal | DecimalJsLike | number | string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    symbol: string
    tolerance?: Decimal | DecimalJsLike | number | string
    isAutoTrading?: boolean
    totalTrades?: number
    successfulTrades?: number
    totalProfit?: Decimal | DecimalJsLike | number | string
    strategyType?: string
    toleranceRate?: Decimal | DecimalJsLike | number | string
  }

  export type TradingStrategyUpdateInput = {
    userId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    entryRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    exitRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    leverage?: IntFieldUpdateOperationsInput | number
    investmentAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    symbol?: StringFieldUpdateOperationsInput | string
    tolerance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isAutoTrading?: BoolFieldUpdateOperationsInput | boolean
    totalTrades?: IntFieldUpdateOperationsInput | number
    successfulTrades?: IntFieldUpdateOperationsInput | number
    totalProfit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    strategyType?: StringFieldUpdateOperationsInput | string
    toleranceRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type TradingStrategyUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    entryRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    exitRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    leverage?: IntFieldUpdateOperationsInput | number
    investmentAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    symbol?: StringFieldUpdateOperationsInput | string
    tolerance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isAutoTrading?: BoolFieldUpdateOperationsInput | boolean
    totalTrades?: IntFieldUpdateOperationsInput | number
    successfulTrades?: IntFieldUpdateOperationsInput | number
    totalProfit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    strategyType?: StringFieldUpdateOperationsInput | string
    toleranceRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type TradingStrategyCreateManyInput = {
    id?: number
    userId: number
    name: string
    entryRate: Decimal | DecimalJsLike | number | string
    exitRate: Decimal | DecimalJsLike | number | string
    leverage?: number
    investmentAmount: Decimal | DecimalJsLike | number | string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    symbol: string
    tolerance?: Decimal | DecimalJsLike | number | string
    isAutoTrading?: boolean
    totalTrades?: number
    successfulTrades?: number
    totalProfit?: Decimal | DecimalJsLike | number | string
    strategyType?: string
    toleranceRate?: Decimal | DecimalJsLike | number | string
  }

  export type TradingStrategyUpdateManyMutationInput = {
    userId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    entryRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    exitRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    leverage?: IntFieldUpdateOperationsInput | number
    investmentAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    symbol?: StringFieldUpdateOperationsInput | string
    tolerance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isAutoTrading?: BoolFieldUpdateOperationsInput | boolean
    totalTrades?: IntFieldUpdateOperationsInput | number
    successfulTrades?: IntFieldUpdateOperationsInput | number
    totalProfit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    strategyType?: StringFieldUpdateOperationsInput | string
    toleranceRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type TradingStrategyUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    entryRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    exitRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    leverage?: IntFieldUpdateOperationsInput | number
    investmentAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    symbol?: StringFieldUpdateOperationsInput | string
    tolerance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    isAutoTrading?: BoolFieldUpdateOperationsInput | boolean
    totalTrades?: IntFieldUpdateOperationsInput | number
    successfulTrades?: IntFieldUpdateOperationsInput | number
    totalProfit?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    strategyType?: StringFieldUpdateOperationsInput | string
    toleranceRate?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type TradeLogCountOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    kimp?: SortOrder
    action?: SortOrder
    amount?: SortOrder
    result?: SortOrder
  }

  export type TradeLogAvgOrderByAggregateInput = {
    id?: SortOrder
    kimp?: SortOrder
    amount?: SortOrder
  }

  export type TradeLogMaxOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    kimp?: SortOrder
    action?: SortOrder
    amount?: SortOrder
    result?: SortOrder
  }

  export type TradeLogMinOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    kimp?: SortOrder
    action?: SortOrder
    amount?: SortOrder
    result?: SortOrder
  }

  export type TradeLogSumOrderByAggregateInput = {
    id?: SortOrder
    kimp?: SortOrder
    amount?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    role?: SortOrder
    isActive?: SortOrder
    lastLoginAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    passwordHash?: SortOrder
    email?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    profileImageUrl?: SortOrder
    password?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    role?: SortOrder
    isActive?: SortOrder
    lastLoginAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    passwordHash?: SortOrder
    email?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    profileImageUrl?: SortOrder
    password?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    role?: SortOrder
    isActive?: SortOrder
    lastLoginAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    passwordHash?: SortOrder
    email?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    profileImageUrl?: SortOrder
    password?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type CryptocurrencyCountOrderByAggregateInput = {
    id?: SortOrder
    symbol?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    upbitMarket?: SortOrder
    binanceSymbol?: SortOrder
    priority?: SortOrder
  }

  export type CryptocurrencyAvgOrderByAggregateInput = {
    id?: SortOrder
    priority?: SortOrder
  }

  export type CryptocurrencyMaxOrderByAggregateInput = {
    id?: SortOrder
    symbol?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    upbitMarket?: SortOrder
    binanceSymbol?: SortOrder
    priority?: SortOrder
  }

  export type CryptocurrencyMinOrderByAggregateInput = {
    id?: SortOrder
    symbol?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    upbitMarket?: SortOrder
    binanceSymbol?: SortOrder
    priority?: SortOrder
  }

  export type CryptocurrencySumOrderByAggregateInput = {
    id?: SortOrder
    priority?: SortOrder
  }

  export type ExchangeCountOrderByAggregateInput = {
    id?: SortOrder
    apiKey?: SortOrder
    isActive?: SortOrder
    userId?: SortOrder
    exchange?: SortOrder
    apiSecret?: SortOrder
    passphrase?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExchangeAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type ExchangeMaxOrderByAggregateInput = {
    id?: SortOrder
    apiKey?: SortOrder
    isActive?: SortOrder
    userId?: SortOrder
    exchange?: SortOrder
    apiSecret?: SortOrder
    passphrase?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExchangeMinOrderByAggregateInput = {
    id?: SortOrder
    apiKey?: SortOrder
    isActive?: SortOrder
    userId?: SortOrder
    exchange?: SortOrder
    apiSecret?: SortOrder
    passphrase?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ExchangeSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type KimchiPremiumCountOrderByAggregateInput = {
    id?: SortOrder
    symbol?: SortOrder
    upbitPrice?: SortOrder
    binancePrice?: SortOrder
    premiumRate?: SortOrder
    timestamp?: SortOrder
    exchangeRate?: SortOrder
    premiumAmount?: SortOrder
  }

  export type KimchiPremiumAvgOrderByAggregateInput = {
    id?: SortOrder
    upbitPrice?: SortOrder
    binancePrice?: SortOrder
    premiumRate?: SortOrder
    exchangeRate?: SortOrder
    premiumAmount?: SortOrder
  }

  export type KimchiPremiumMaxOrderByAggregateInput = {
    id?: SortOrder
    symbol?: SortOrder
    upbitPrice?: SortOrder
    binancePrice?: SortOrder
    premiumRate?: SortOrder
    timestamp?: SortOrder
    exchangeRate?: SortOrder
    premiumAmount?: SortOrder
  }

  export type KimchiPremiumMinOrderByAggregateInput = {
    id?: SortOrder
    symbol?: SortOrder
    upbitPrice?: SortOrder
    binancePrice?: SortOrder
    premiumRate?: SortOrder
    timestamp?: SortOrder
    exchangeRate?: SortOrder
    premiumAmount?: SortOrder
  }

  export type KimchiPremiumSumOrderByAggregateInput = {
    id?: SortOrder
    upbitPrice?: SortOrder
    binancePrice?: SortOrder
    premiumRate?: SortOrder
    exchangeRate?: SortOrder
    premiumAmount?: SortOrder
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type PerformanceStatCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    date?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    dailyProfit?: SortOrder
    dailyVolume?: SortOrder
    winRate?: SortOrder
    avgProfitPerTrade?: SortOrder
    maxDrawdown?: SortOrder
    createdAt?: SortOrder
  }

  export type PerformanceStatAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    dailyProfit?: SortOrder
    dailyVolume?: SortOrder
    winRate?: SortOrder
    avgProfitPerTrade?: SortOrder
    maxDrawdown?: SortOrder
  }

  export type PerformanceStatMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    date?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    dailyProfit?: SortOrder
    dailyVolume?: SortOrder
    winRate?: SortOrder
    avgProfitPerTrade?: SortOrder
    maxDrawdown?: SortOrder
    createdAt?: SortOrder
  }

  export type PerformanceStatMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    date?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    dailyProfit?: SortOrder
    dailyVolume?: SortOrder
    winRate?: SortOrder
    avgProfitPerTrade?: SortOrder
    maxDrawdown?: SortOrder
    createdAt?: SortOrder
  }

  export type PerformanceStatSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    dailyProfit?: SortOrder
    dailyVolume?: SortOrder
    winRate?: SortOrder
    avgProfitPerTrade?: SortOrder
    maxDrawdown?: SortOrder
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type PositionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    strategyId?: SortOrder
    symbol?: SortOrder
    type?: SortOrder
    entryPrice?: SortOrder
    currentPrice?: SortOrder
    quantity?: SortOrder
    entryPremiumRate?: SortOrder
    currentPremiumRate?: SortOrder
    status?: SortOrder
    entryTime?: SortOrder
    exitTime?: SortOrder
    upbitOrderId?: SortOrder
    binanceOrderId?: SortOrder
    side?: SortOrder
    exitPrice?: SortOrder
    exitPremiumRate?: SortOrder
    unrealizedPnl?: SortOrder
    realizedPnl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PositionAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    strategyId?: SortOrder
    entryPrice?: SortOrder
    currentPrice?: SortOrder
    quantity?: SortOrder
    entryPremiumRate?: SortOrder
    currentPremiumRate?: SortOrder
    exitPrice?: SortOrder
    exitPremiumRate?: SortOrder
    unrealizedPnl?: SortOrder
    realizedPnl?: SortOrder
  }

  export type PositionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    strategyId?: SortOrder
    symbol?: SortOrder
    type?: SortOrder
    entryPrice?: SortOrder
    currentPrice?: SortOrder
    quantity?: SortOrder
    entryPremiumRate?: SortOrder
    currentPremiumRate?: SortOrder
    status?: SortOrder
    entryTime?: SortOrder
    exitTime?: SortOrder
    upbitOrderId?: SortOrder
    binanceOrderId?: SortOrder
    side?: SortOrder
    exitPrice?: SortOrder
    exitPremiumRate?: SortOrder
    unrealizedPnl?: SortOrder
    realizedPnl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PositionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    strategyId?: SortOrder
    symbol?: SortOrder
    type?: SortOrder
    entryPrice?: SortOrder
    currentPrice?: SortOrder
    quantity?: SortOrder
    entryPremiumRate?: SortOrder
    currentPremiumRate?: SortOrder
    status?: SortOrder
    entryTime?: SortOrder
    exitTime?: SortOrder
    upbitOrderId?: SortOrder
    binanceOrderId?: SortOrder
    side?: SortOrder
    exitPrice?: SortOrder
    exitPremiumRate?: SortOrder
    unrealizedPnl?: SortOrder
    realizedPnl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PositionSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    strategyId?: SortOrder
    entryPrice?: SortOrder
    currentPrice?: SortOrder
    quantity?: SortOrder
    entryPremiumRate?: SortOrder
    currentPremiumRate?: SortOrder
    exitPrice?: SortOrder
    exitPremiumRate?: SortOrder
    unrealizedPnl?: SortOrder
    realizedPnl?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type SessionCountOrderByAggregateInput = {
    sid?: SortOrder
    sess?: SortOrder
    expire?: SortOrder
  }

  export type SessionMaxOrderByAggregateInput = {
    sid?: SortOrder
    expire?: SortOrder
  }

  export type SessionMinOrderByAggregateInput = {
    sid?: SortOrder
    expire?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type SystemAlertCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    isRead?: SortOrder
    userId?: SortOrder
    data?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
  }

  export type SystemAlertAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type SystemAlertMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    isRead?: SortOrder
    userId?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
  }

  export type SystemAlertMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    isRead?: SortOrder
    userId?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
  }

  export type SystemAlertSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type TradeCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    positionId?: SortOrder
    symbol?: SortOrder
    side?: SortOrder
    exchange?: SortOrder
    quantity?: SortOrder
    price?: SortOrder
    fee?: SortOrder
    orderType?: SortOrder
    exchangeOrderId?: SortOrder
    exchangeTradeId?: SortOrder
    executedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type TradeAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    positionId?: SortOrder
    quantity?: SortOrder
    price?: SortOrder
    fee?: SortOrder
  }

  export type TradeMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    positionId?: SortOrder
    symbol?: SortOrder
    side?: SortOrder
    exchange?: SortOrder
    quantity?: SortOrder
    price?: SortOrder
    fee?: SortOrder
    orderType?: SortOrder
    exchangeOrderId?: SortOrder
    exchangeTradeId?: SortOrder
    executedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type TradeMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    positionId?: SortOrder
    symbol?: SortOrder
    side?: SortOrder
    exchange?: SortOrder
    quantity?: SortOrder
    price?: SortOrder
    fee?: SortOrder
    orderType?: SortOrder
    exchangeOrderId?: SortOrder
    exchangeTradeId?: SortOrder
    executedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type TradeSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    positionId?: SortOrder
    quantity?: SortOrder
    price?: SortOrder
    fee?: SortOrder
  }

  export type TradingSettingCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    entryPremiumRate?: SortOrder
    exitPremiumRate?: SortOrder
    stopLossRate?: SortOrder
    maxPositions?: SortOrder
    isAutoTrading?: SortOrder
    maxInvestmentAmount?: SortOrder
    kimchiEntryRate?: SortOrder
    kimchiExitRate?: SortOrder
    kimchiToleranceRate?: SortOrder
    binanceLeverage?: SortOrder
    upbitEntryAmount?: SortOrder
    dailyLossLimit?: SortOrder
    maxPositionSize?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TradingSettingAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    entryPremiumRate?: SortOrder
    exitPremiumRate?: SortOrder
    stopLossRate?: SortOrder
    maxPositions?: SortOrder
    maxInvestmentAmount?: SortOrder
    kimchiEntryRate?: SortOrder
    kimchiExitRate?: SortOrder
    kimchiToleranceRate?: SortOrder
    binanceLeverage?: SortOrder
    upbitEntryAmount?: SortOrder
    dailyLossLimit?: SortOrder
    maxPositionSize?: SortOrder
  }

  export type TradingSettingMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    entryPremiumRate?: SortOrder
    exitPremiumRate?: SortOrder
    stopLossRate?: SortOrder
    maxPositions?: SortOrder
    isAutoTrading?: SortOrder
    maxInvestmentAmount?: SortOrder
    kimchiEntryRate?: SortOrder
    kimchiExitRate?: SortOrder
    kimchiToleranceRate?: SortOrder
    binanceLeverage?: SortOrder
    upbitEntryAmount?: SortOrder
    dailyLossLimit?: SortOrder
    maxPositionSize?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TradingSettingMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    entryPremiumRate?: SortOrder
    exitPremiumRate?: SortOrder
    stopLossRate?: SortOrder
    maxPositions?: SortOrder
    isAutoTrading?: SortOrder
    maxInvestmentAmount?: SortOrder
    kimchiEntryRate?: SortOrder
    kimchiExitRate?: SortOrder
    kimchiToleranceRate?: SortOrder
    binanceLeverage?: SortOrder
    upbitEntryAmount?: SortOrder
    dailyLossLimit?: SortOrder
    maxPositionSize?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TradingSettingSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    entryPremiumRate?: SortOrder
    exitPremiumRate?: SortOrder
    stopLossRate?: SortOrder
    maxPositions?: SortOrder
    maxInvestmentAmount?: SortOrder
    kimchiEntryRate?: SortOrder
    kimchiExitRate?: SortOrder
    kimchiToleranceRate?: SortOrder
    binanceLeverage?: SortOrder
    upbitEntryAmount?: SortOrder
    dailyLossLimit?: SortOrder
    maxPositionSize?: SortOrder
  }

  export type TradingStrategyCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    entryRate?: SortOrder
    exitRate?: SortOrder
    leverage?: SortOrder
    investmentAmount?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    symbol?: SortOrder
    tolerance?: SortOrder
    isAutoTrading?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    totalProfit?: SortOrder
    strategyType?: SortOrder
    toleranceRate?: SortOrder
  }

  export type TradingStrategyAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    entryRate?: SortOrder
    exitRate?: SortOrder
    leverage?: SortOrder
    investmentAmount?: SortOrder
    tolerance?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    totalProfit?: SortOrder
    toleranceRate?: SortOrder
  }

  export type TradingStrategyMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    entryRate?: SortOrder
    exitRate?: SortOrder
    leverage?: SortOrder
    investmentAmount?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    symbol?: SortOrder
    tolerance?: SortOrder
    isAutoTrading?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    totalProfit?: SortOrder
    strategyType?: SortOrder
    toleranceRate?: SortOrder
  }

  export type TradingStrategyMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    entryRate?: SortOrder
    exitRate?: SortOrder
    leverage?: SortOrder
    investmentAmount?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    symbol?: SortOrder
    tolerance?: SortOrder
    isAutoTrading?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    totalProfit?: SortOrder
    strategyType?: SortOrder
    toleranceRate?: SortOrder
  }

  export type TradingStrategySumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    entryRate?: SortOrder
    exitRate?: SortOrder
    leverage?: SortOrder
    investmentAmount?: SortOrder
    tolerance?: SortOrder
    totalTrades?: SortOrder
    successfulTrades?: SortOrder
    totalProfit?: SortOrder
    toleranceRate?: SortOrder
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}