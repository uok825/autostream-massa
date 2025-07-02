// Basic AssemblyScript types for Massa compatibility
export type u8 = number;
export type u32 = number;
export type u64 = number;
export type i32 = number;
export type i64 = number;
export type bool = boolean;

// Mock StaticArray for development
export class StaticArray<T> {
  private data: T[] = [];
  
  constructor(length: number) {
    this.data = new Array(length);
  }
  
  get length(): number {
    return this.data.length;
  }
  
  @operator("[]")
  private __get(index: number): T {
    return this.data[index];
  }
  
  @operator("[]=")
  private __set(index: number, value: T): void {
    this.data[index] = value;
  }
}

// Assert function
export function assert(condition: bool, message: string = ""): void {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// Serializable decorator placeholder
export function serializable<T>(target: T): T {
  return target;
}

// Mock Massa SC types for development
export class Address {
  private value: string = '';
  
  constructor(addr: string = '') {
    this.value = addr;
  }
  
  toString(): string {
    return this.value;
  }
  
  equals(other: Address): bool {
    return this.value === other.value;
  }
  
  serialize(): StaticArray<u8> {
    // Mock serialization
    return new StaticArray<u8>(0);
  }
  
  static fromBytes(data: StaticArray<u8>): Address {
    return new Address();
  }
}

export class Coins {
  constructor(public amount: u64) {}
}

export class Context {
  static caller(): Address {
    return new Address('caller');
  }
  
  static callee(): Address {
    return new Address('callee');
  }
  
  static transferredCoins(): Coins {
    return new Coins(0);
  }
}

export class Storage {
  private static data: Map<string, StaticArray<u8>> = new Map();
  
  static set(key: string, value: StaticArray<u8>): void {
    this.data.set(key, value);
  }
  
  static get(key: string): StaticArray<u8> {
    const value = this.data.get(key);
    return value || new StaticArray<u8>(0);
  }
}

export class Time {
  static timestamp(): u64 {
    return Date.now() as u64;
  }
}

export function transferCoins(to: Address, amount: Coins): void {
  // Mock implementation
}

export function call(
  address: Address,
  function_name: string,
  args: StaticArray<u8>,
  coins: Coins,
  delay: u64 = 0
): void {
  // Mock implementation for deferred calls
}

export function createSC(bytecode: StaticArray<u8>): Address {
  return new Address('new_contract');
}

export function generateEvent(name: string, params: string[]): void {
  // Mock event generation
  console.log(`Event: ${name}, Params: ${params.join(', ')}`);
}

export class Args {
  private data: StaticArray<u8>;
  private position: i32 = 0;
  
  constructor(data: StaticArray<u8>) {
    this.data = data;
  }
  
  nextAddress(): Result<Address> {
    // Mock implementation
    return new Result<Address>(new Address('mock_address'), true);
  }
  
  nextU64(): Result<u64> {
    // Mock implementation
    return new Result<u64>(0, true);
  }
  
  nextU8(): Result<u8> {
    // Mock implementation
    return new Result<u8>(0, true);
  }
  
  nextString(): Result<string> {
    // Mock implementation
    return new Result<string>('mock_string', true);
  }
  
  add<T>(value: T): Args {
    // Mock implementation
    return this;
  }
  
  serialize(): StaticArray<u8> {
    return this.data;
  }
}

export class Result<T> {
  constructor(private value: T, private success: bool) {}
  
  isOk(): bool {
    return this.success;
  }
  
  isError(): bool {
    return !this.success;
  }
  
  unwrap(): T {
    if (!this.success) {
      throw new Error('Result is Error');
    }
    return this.value;
  }
  
  serialize(): StaticArray<u8> {
    // Mock serialization
    return new StaticArray<u8>(0);
  }
  
  static fromBytes<T>(data: StaticArray<u8>): Result<T> {
    // Mock deserialization
    return new Result<T>(changetype<T>(0), true);
  }
  
  static Ok<T>(value: T): Result<T> {
    return new Result<T>(value, true);
  }
  
  static Error<T>(message: string): Result<T> {
    return new Result<T>(changetype<T>(0), false);
  }
}

export interface Serializable {
  serialize(): StaticArray<u8>;
} 