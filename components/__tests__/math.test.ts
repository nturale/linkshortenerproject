import { describe, it, expect } from 'vitest';
import { factorial } from '../MathUtils';

describe('factorial', () => {
    it('returns 1 for factorial(0)', () => {
        expect(factorial(0)).toBe(1);
    });

    it('returns 1 for factorial(1)', () => {
        expect(factorial(1)).toBe(1);
    });

    it('returns 120 for factorial(5)', () => {
        expect(factorial(5)).toBe(120);
    });

    it('returns 720 for factorial(6)', () => {
        expect(factorial(6)).toBe(720);
    });

    it('returns 3628800 for factorial(10)', () => {
        expect(factorial(10)).toBe(3628800);
    });

    it('throws an error for negative numbers', () => {
        expect(() => factorial(-1)).toThrow('Cannot calculate factorial of a negative number.');
    });

    it('throws an error for any negative integer', () => {
        expect(() => factorial(-5)).toThrow(Error);
    });
});
