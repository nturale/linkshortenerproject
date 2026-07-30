/**
 * @fileoverview Mathematical utility functions for common numeric operations.
 *
 * This module provides a collection of pure utility functions for performing
 * arithmetic and statistical calculations, including summation, square roots,
 * modulus, averages, and factorials. All functions are stateless and operate
 * solely on their inputs.
 * Each function includes detailed documentation on its parameters, return values,
 * and potential errors, making it easy for developers to understand and use them
 * effectively in various applications.
 * @module math
 */

/**
 * Calculates the sum of all numbers in an array.
 * 
 * @param arr - An array of numbers to sum
 * @returns The sum of all numbers in the array. Returns 0 if the array is empty.
 * 
 * @example
 * sum([1, 2, 3, 4]); // returns 10
 * sum([]); // returns 0
 */
export function sum(arr: number[]): number {
    return arr.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculates the square root of a number.
 *
 * @param num - The number to calculate the square root of
 * @returns The square root of the given number
 * @throws {Error} If `num` is negative
 *
 * @example
 * squareRoot(9);  // returns 3
 * squareRoot(-1); // throws Error
 */
export function squareRoot(num: number): number {
    if (num < 0) {
        throw new Error("Cannot calculate square root of a negative number.");
    } else {
        return Math.sqrt(num);
    }
}
/**
 * Calculates the remainder of dividing `a` by `b`.
 *
 * @param a - The dividend
 * @param b - The divisor
 * @returns The remainder of `a` divided by `b`
 * @throws {Error} If `b` is zero
 *
 * @example
 * modulas(10, 3); // returns 1
 * modulas(5, 0);  // throws Error
 */
export function modulas(a: number, b: number): number {
    if (b === 0) {
        throw new Error("Cannot perform modulus operation with a divisor of zero.");
    } else {
        return a % b;
    }
}
/**
 * Calculates the arithmetic mean of an array of numbers.
 *
 * @param numbers - An array of numbers to average
 * @returns The arithmetic mean of the provided numbers
 * @throws {Error} If `numbers` is empty
 *
 * @example
 * average([1, 2, 3, 4]); // returns 2.5
 * average([]);            // throws Error
 */
export function average(numbers: number[]): number {
    if (numbers.length === 0) {
        throw new Error("Cannot calculate average of an empty array.");
    }
    const total = numbers.reduce((sum, num) => sum + num, 0);
    return total / numbers.length;
}
/**
 * Calculates the factorial of a non-negative integer.
 *
 * @param n - A non-negative integer
 * @returns The factorial of `n` (n!)
 * @throws {Error} If `n` is negative or not an integer
 *
 * @example
 * factorial(5); // returns 120
 * factorial(0); // returns 1
 * factorial(-1); // throws Error
 */
export function factorial(n: number): number {
    if (!Number.isInteger(n)) throw new Error("Input must be an integer.");
    if (n < 0) throw new Error("Cannot calculate factorial of a negative number.");
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
/**
 * Asynchronously adds two numbers together with a simulated delay.
 *
 * @param a - The first number
 * @param b - The second number
 * @returns A promise that resolves to the sum of `a` and `b` after a 1-second delay
 *
 * @example
 * const result = await asyncAdd(3, 4); // resolves to 7 after ~1 second
 */
export async function asyncAdd(a: number, b: number): Promise<number> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(a + b);
        }, 1000); //simulate async operation with a delay of 1 second
    });
}