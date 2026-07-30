import {asyncAdd} from './MathUtils';

(async () => {
    const result = await asyncAdd(5, 10);
    console.log(`Result of asyncAdd(5, 10): ${result}`);
})();