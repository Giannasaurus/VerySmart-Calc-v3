const result = document.getElementById('result')
const kDigitResult = document.getElementById('kDigitResult')
const absoluteErrorResult = document.getElementById('absoluteErrorResult')
const relativeErrorResult = document.getElementById('relativeErrorResult')
const maximumErrorResult = document.getElementById('maximumErrorResult')
const significantDigitsResult = document.getElementById('significantDigitsResult')

math.config({number: 'BigNumber', precision: 64});

const computeBtn = document.getElementById('computeBtn')

let p;
let rawResult;

computeBtn.addEventListener('click', () => {
    const expression = document.getElementById('polynomialFunction').value.trim();
    const rawX = document.getElementById('polynomialVariable').value;
    const xValue = rawX === '' ? undefined : parseFloat(rawX);

    if (!expression) {
        alert('Please enter an expression to compute');
        return;
    }

    const scope = {};
    if (!isNaN(xValue)) {
        scope.x = math.bignumber(xValue);
    }

    p = evalPolynomial(expression, scope);
    if (typeof p === 'string' && p.startsWith('Error:')) {
        alert(p);
        return;
    }

    rawResult = p;
    result.value = p.toString();
    kDigitResult.value = '';
    absoluteErrorResult.value = '';
    relativeErrorResult.value = '';
    maximumErrorResult.value = '';
    significantDigitsResult.value = '';
});

const applyChopRoundBtn = document.getElementById('applyChopRoundBtn')
applyChopRoundBtn.addEventListener('click', () => {
    if (rawResult === undefined) {
        alert('Please calculate a result first')
        return
    }
    
    let selectedMethod = document.querySelector('input[name="method"]:checked')
    if (!selectedMethod) {
        alert('Please select chop or round')
        return
    }
    selectedMethod = selectedMethod.value
    
    let significantValue = parseInt(document.getElementById('significantDigits').value)
    if (isNaN(significantValue) || significantValue < 1) {
        alert('Please enter a positive integer for significant digits')
        return
    }
    
    if (selectedMethod == "chop") {
        p = chopNums(rawResult, significantValue)
    } else {
        p = roundNums(rawResult, significantValue)
    }
    
    displayResultWithErrors(p, rawResult, significantValue, selectedMethod)
})



function evalPolynomial(expr, scope) {
    try {
        return math.evaluate(expr, scope);
    } catch (err) {
        return 'Error: ' + err.message;
    }
}
// Chop a number to k significant digits
// Chop a number to k significant digits (BigNumber safe)
function chopNums(p, k) {
    if (math.equal(p, 0)) return math.bignumber(0);

    const sign = math.sign(p);
    const abs = math.abs(p);

    const exponent = math.floor(math.log10(abs));          // BigNumber safe
    const factor = math.pow(10, math.subtract(exponent, k - 1)); // BigNumber safe
    const rescaled = math.floor(math.divide(abs, factor));
    const result = math.multiply(rescaled, factor);

    return math.multiply(sign, result);
}

// Round a number to k significant digits (BigNumber safe)
function roundNums(p, k) {
    if (math.equal(p, 0)) return math.bignumber(0);

    const sign = math.sign(p);
    const abs = math.abs(p);

    const exponent = math.floor(math.log10(abs));          // BigNumber safe
    const factor = math.pow(10, math.subtract(exponent, k - 1)); // BigNumber safe
    const rescaled = math.round(math.divide(abs, factor));
    const result = math.multiply(rescaled, factor);

    return math.multiply(sign, result);
}


function absoluteError(p, pe) {
    return math.abs(math.subtract(p, pe));
}


function relativeError(p, pe) {
    if (math.equal(p, 0)) return math.bignumber(Infinity);
    return math.divide(absoluteError(p, pe), math.abs(p));
}

// --- Maximum absolute error ---
function maximumAbsoluteError(P, t, method) {
    if (math.equal(P, 0)) return math.bignumber(0);

    const absP = math.abs(P);
    const exponent = math.floor(math.log10(absP));
    const factor = math.pow(10, math.subtract(exponent, t - 1));

    return method === 'chop' ? factor : math.multiply(0.5, factor);
}

function displayResultWithErrors(processedResult, rawResult, significantDigits, method) {
    result.value = processedResult.toString();

    const absErr = absoluteError(rawResult, processedResult);
    const relErr = relativeError(rawResult, processedResult);
    const maxErr = maximumAbsoluteError(rawResult, significantDigits, method);

    absoluteErrorResult.value = absErr.toString();
    relativeErrorResult.value = relErr.toExponential(4);
    maximumErrorResult.value = maxErr.toExponential(4);
    significantDigitsResult.value = significantDigits;
}


const kDigitBtn = document.getElementById('evaluateKDigitBtn')


kDigitBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const expression = document.getElementById('polynomialFunction').value.trim();
    const rawX = document.getElementById('polynomialVariable').value;
    const xValue = rawX === '' ? undefined : parseFloat(rawX);
    const kDigits = parseInt(document.getElementById('kDigits').value);
    const methodElement = document.querySelector('input[name="kMethod"]:checked');

    if (!methodElement) {
        alert('Please select chop or round for K-digit arithmetic');
        return;
    }
    const method = methodElement.value;

    if (!expression) {
        alert('Please enter an expression to evaluate using K-digit arithmetic');
        return;
    }
    if (isNaN(kDigits) || kDigits <= 0) {
        alert('Please enter a positive number of significant digits for K-digit arithmetic');
        return;
    }

    // Create scope with xValue
    const scope = {};
    if (xValue !== undefined) {
        scope.x = math.bignumber(xValue);
    }

    // Use the node-by-node evaluation (forces chop/round at every step)
    let kResult;
    try {
        kResult = evaluateExpressionKDigit(expression, scope, kDigits, method);
    } catch (err) {
        alert('Error: ' + err.message);
        return;
    }

    kDigitResult.value = kResult.toString();
});

// Section 4: evaluate errors given P and P*
const extraBtn = document.getElementById('extraBtn');
extraBtn.addEventListener('click', () => {
    let pVal, pStarVal;
    try {
        pVal = math.bignumber(document.getElementById('pValue').value);
        pStarVal = math.bignumber(document.getElementById('pStarValue').value);
    } catch (e) {
        alert('Please enter valid numbers for P and P*');
        return;
    }
    const sigDigits = parseInt(document.getElementById('extraSignificantDigits').value);

    if (isNaN(sigDigits)) {
        alert('Please enter number of significant digits');
        return;
    }

    // compute errors
    const absErr = absoluteError(pVal, pStarVal);
    const relErr = relativeError(pVal, pStarVal);
    const absP = math.abs(pVal);
    let maxErr;
    if (math.equal(absP, 0)) {
        maxErr = math.bignumber(0);
    } else {
        const exponent = math.floor(math.log10(absP));
        maxErr = math.multiply(math.bignumber(0.5), math.pow(10, math.add(exponent, math.subtract(1, sigDigits))));
    }

    // update UI
    document.getElementById('extraPStar').value = pStarVal.toString();
    document.getElementById('extraAbsoluteError').value = absErr.toString();
    document.getElementById('extraRelativeError').value = relErr.toExponential(4);
    document.getElementById('extraMaximumError').value = maxErr.toExponential(4);
    document.getElementById('extraSignificantDigitsResult').value = sigDigits;
});

document.getElementById('decToBinBtn').addEventListener('click', () => {
    convertDecToBin();
});

document.getElementById('binToDecBtn').addEventListener('click', () => {
    const bin = document.getElementById('binaryInput').value;
    const mode = document.querySelector('input[name="binMode"]:checked').value;

    if (!bin) return;

    let result;

    if (mode === 'ieee32' || mode === 'ieee64') {
        result = binaryToIEEE(bin, mode);
    } else {
        // plain binary
        result = parseInt(bin, 2);
    }

    document.getElementById('binaryDecimalResult').value = result;
});

// Section 5: Binary conversion
const decToBinBtn = document.getElementById('decToBinBtn');
const binToDecBtn = document.getElementById('binToDecBtn');

decToBinBtn.addEventListener('click', () => {
    const decimalVal = parseFloat(document.getElementById('decimalInput').value);
    
    if (isNaN(decimalVal)) {
        alert('Please enter a valid decimal number');
        return;
    }
    
    // Split into integer and fractional parts
    const intPart = Math.floor(Math.abs(decimalVal));
    const fracPart = Math.abs(decimalVal) - intPart;
    
    // Convert integer part to binary
    let binaryVal = intPart.toString(2);
    
    // Convert fractional part to binary (up to 20 digits for precision)
    if (fracPart > 0) {
        binaryVal += '.';
        let frac = fracPart;
        for (let i = 0; i < 20 && frac > 0; i++) {
            frac *= 2;
            binaryVal += Math.floor(frac);
            frac -= Math.floor(frac);
        }
    }
    
    // Handle negative numbers
    if (decimalVal < 0) {
        binaryVal = '-' + binaryVal;
    }
    
    document.getElementById('binaryBinaryResult').value = binaryVal;
    document.getElementById('binaryDecimalResult').value = decimalVal;
});

binToDecBtn.addEventListener('click', () => {
    const binaryVal = document.getElementById('binaryInput').value.trim();
    const mode = document.querySelector('input[name="binMode"]:checked').value;

    if (!binaryVal) {
        alert('Please enter a binary value');
        return;
    }

    let decimalVal;
    let ieeeText = '';

    if (mode === 'plain') {
        try {
            decimalVal = plainBinaryToDecimal(binaryVal);
            ieeeText = "Plain Binary";
        } catch (e) {
            alert(e.message);
            return;
        }
    } else {
        const bitCount = mode === 'ieee32' ? 32 : 64;
        const normalized = binaryVal.replace(/\s+/g, '');

        if (normalized.length !== bitCount) {
            alert(`Please enter exactly ${bitCount} bits (Current: ${normalized.length})`);
            return;
        }

        try {
            decimalVal = binaryToIEEE(normalized, mode);
            
            // Provide visual feedback of the breakdown
            const signBit = normalized[0];
            const expBits = mode === 'ieee32' ? normalized.slice(1,9) : normalized.slice(1,12);
            ieeeText = `Sign: ${signBit} | Exp: ${expBits} | Mode: ${mode.toUpperCase()}`;
        } catch (err) {
            alert('Error: ' + err.message);
            return;
        }
    }

    // Update the UI fields
    document.getElementById('binaryDecimalResult').value = decimalVal;
    document.getElementById('binaryBinaryResult').value = binaryVal;
    document.getElementById('binaryIEEEResult').value = ieeeText; 
});

// --- Convert binary string to decimal (plain binary with optional fraction) ---
function plainBinaryToDecimal(binStr) {
    if (!/^[01]+(\.[01]+)?$/.test(binStr)) throw new Error("Invalid plain binary");

    let [intPart, fracPart] = binStr.split('.');
    let result = 0;

    // Integer part
    if (intPart) {
        result += parseInt(intPart, 2);
    }

    // Fractional part
    if (fracPart) {
        for (let i = 0; i < fracPart.length; i++) {
            if (fracPart[i] === '1') {
                result += Math.pow(2, -(i + 1));
            }
        }
    }

    return result;
}

// --- Convert IEEE binary to decimal ---
/*
========================================
IEEE 754 CONVERSION (BOTH DIRECTIONS)
========================================
*/

// ==========================
// DECIMAL → IEEE 754
// ==========================

// Core logic reused
function decimalToIEEE(val, mode) {
    const buffer = new ArrayBuffer(mode === 'ieee32' ? 4 : 8);
    const view = new DataView(buffer);

    if (mode === 'ieee32') {
        view.setFloat32(0, val, false);
    } else {
        view.setFloat64(0, val, false);
    }

    let binaryStr = "";
    const bytes = mode === 'ieee32' ? 4 : 8;

    for (let i = 0; i < bytes; i++) {
        binaryStr += view.getUint8(i).toString(2).padStart(8, '0');
    }

    return binaryStr;
}


// ==========================
// IEEE 754 → DECIMAL
// ==========================
// Recursively evaluate a math.js node with K-digit arithmetic
function evalNodeKDigit(node, scope, k, method) {
    const process = (x) => (method === 'chop' ? chopNums(x, k) : roundNums(x, k));

    switch (node.type) {
        case 'ConstantNode':
            // Constants (literal numbers in the expression) are chopped/rounded
            return process(math.bignumber(node.value));

        case 'SymbolNode':
            // Variable values (e.g. x) are used as-is — do NOT pre-chop
            if (scope[node.name] !== undefined) return math.bignumber(scope[node.name]);
            throw new Error(`Undefined variable: ${node.name}`);

        case 'OperatorNode': {
            const args = node.args.map(arg => evalNodeKDigit(arg, scope, k, method));
            let res;
            switch (node.op) {
                case '+': res = math.add(args[0], args[1]); break;
                case '-': res = math.subtract(args[0], args[1]); break;
                case '*': res = math.multiply(args[0], args[1]); break;
                case '/': res = math.divide(args[0], args[1]); break;
                case '^': res = math.pow(args[0], args[1]); break;
                default: throw new Error(`Unsupported operator: ${node.op}`);
            }
            return process(res); // chop/round after each operation
        }

        case 'ParenthesisNode':
            return evalNodeKDigit(node.content, scope, k, method);

        default:
            throw new Error(`Unsupported node type: ${node.type}`);
    }
}

// Evaluate an expression string with K-digit arithmetic
function evaluateExpressionKDigit(expr, scope, k, method) {
    const node = math.parse(expr);
    return evalNodeKDigit(node, scope, k, method);
}
document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('decToBinBtn').addEventListener('click', convertDecToBin);

});

function convertDecToBin() {
    const val = parseFloat(document.getElementById('decimalInput').value);

    if (isNaN(val)) {
        alert("Enter a valid decimal number.");
        return;
    }

    const isDouble = document.getElementById('binIEEE64').checked;

    const buffer = new ArrayBuffer(isDouble ? 8 : 4);
    const view = new DataView(buffer);

    if (isDouble) {
        view.setFloat64(0, val, false);
    } else {
        view.setFloat32(0, val, false);
    }

    let binaryStr = "";
    const bytes = isDouble ? 8 : 4;

    for (let i = 0; i < bytes; i++) {
        binaryStr += view.getUint8(i).toString(2).padStart(8, '0');
    }

    // OUTPUT (THIS WAS MISSING)
    document.getElementById('binaryBinaryResult').value = binaryStr;
    document.getElementById('binaryIEEEResult').value = binaryStr;
}
function binaryToIEEE(bin, mode) {
    const expLen = mode === 'ieee32' ? 8 : 11;
    const bias = mode === 'ieee32' ? 127 : 1023;

    const sign = bin[0] === '1' ? -1 : 1;
    const exponentRaw = bin.slice(1, 1 + expLen);
    const fractionRaw = bin.slice(1 + expLen);

    const exponentInt = parseInt(exponentRaw, 2);

    // ZERO / SUBNORMAL
    if (exponentInt === 0) {
        let fraction = 0;
        for (let i = 0; i < fractionRaw.length; i++) {
            if (fractionRaw[i] === '1') {
                fraction += Math.pow(2, -(i + 1));
            }
        }
        return sign * fraction * Math.pow(2, 1 - bias);
    }

    // INFINITY / NaN
    if (exponentInt === Math.pow(2, expLen) - 1) {
        return fractionRaw.includes('1') ? NaN : sign * Infinity;
    }

    // NORMALIZED
    let fraction = 1;
    for (let i = 0; i < fractionRaw.length; i++) {
        if (fractionRaw[i] === '1') {
            fraction += Math.pow(2, -(i + 1));
        }
    }

    return sign * fraction * Math.pow(2, exponentInt - bias);
}