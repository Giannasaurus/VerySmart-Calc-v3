function formatValue(val, sigDigits, mode) {
    const num = Number(val);
    if (!Number.isFinite(num)) {
        return num;
    }

    if (!Number.isInteger(sigDigits) || sigDigits <= 0) {
        return num;
    }

    if (num === 0) {
        return 0;
    }

    const sign = Math.sign(num);
    const abs = Math.abs(num);
    const exponent = Math.floor(Math.log10(abs));
    const factor = Math.pow(10, sigDigits - 1 - exponent);
    const scaled = abs * factor;
    const processed = mode === 'chop' ? Math.trunc(scaled) : Math.round(scaled);

    return sign * processed / factor;
}

// BISECTION METHOD f: the function, a: start, b: end, sigs: digits, mode: 'round'/'chop', tol: tolerance
function runBisection(f, a, b, sigs, mode, tol) {
    let iterationTable = [];
    let fa = f(a);
    let fb = f(b);
    if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
        return { error: "Function must be finite at both interval endpoints." };
    }
    if (tol <= 0) {
        return { error: "Tolerance must be greater than zero." };
    }
    if (fa * fb >= 0) { //Checks if root exists or not
        return { error: "Signs are the same. No root guaranteed in this interval." };
    }
	let maxIterations = Math.ceil(Math.log2(Math.abs(b - a) / tol)); //checks how many interation for the system to load
    maxIterations = Math.max(1, Math.min(maxIterations, 1000));
    let currentA = a;
    let currentB = b;
    let root = 0;
    for (let i = 1; i <= maxIterations; i++) {
	let mid = (currentA + currentB) / 2; //finding midpoint
	let midFormatted = formatValue(mid, sigs, mode);
        let rawFMid = f(midFormatted);
        if (!Number.isFinite(rawFMid)) {
            return { error: "Function became non-finite during bisection.", table: iterationTable };
        }
        let fMid = formatValue(rawFMid, sigs, mode);
	iterationTable.push({
            iter: i,
            a: formatValue(currentA, sigs, mode),
            b: formatValue(currentB, sigs, mode),
            mid: midFormatted,
            fMid: fMid
        });
	if (fMid === 0 || (currentB - currentA) / 2 < tol) {
            root = midFormatted;
            break;
        }
	if (f(currentA) * fMid < 0) {
            currentB = midFormatted;
        } else {
            currentA = midFormatted;
        }
        root = midFormatted;
    }

    return {
        finalRoot: root,
        table: iterationTable,
        totalSteps: iterationTable.length
    };
}

// NEWTONS METHOD f: function, x0: initial guess, sigs: digits, mode: 'round'/'chop', stopVal: tolerance or iterations, stopType: 'tol' or 'iter'
function runNewton(f, x0, sigs, mode, stopVal, stopType) {
    let iterationTable = [];
    let x = x0;
    const h = 0.00000001; // Small number used to calculate the slope (derivative)
    if (!Number.isFinite(x)) {
        return { error: "Initial guess must be finite." };
    }
    if (stopVal <= 0) {
        return { error: "Stopping value must be greater than zero." };
    }
    
    // If they chose 'iter', we run that many times. If 'tol', we set a safety limit of 100.
    let maxLoop = (stopType === 'iter') ? Math.floor(stopVal) : 100;
    maxLoop = Math.max(1, Math.min(maxLoop, 1000));

    for (let i = 0; i <= maxLoop; i++) {
        let fx = f(x);
        if (!Number.isFinite(fx)) {
            return { error: "Function became non-finite during Newton iteration.", table: iterationTable };
        }
        let fxFormatted = formatValue(fx, sigs, mode);
        let xFormatted = formatValue(x, sigs, mode);
        iterationTable.push({
            iter: i,
            x: xFormatted,
            fx: fxFormatted
        });
        if (stopType === 'tol' && Math.abs(fx) < stopVal) {
            break;
        }

        // 1. Find the slope (Derivative) using the formula: [f(x + h) - f(x)] / h
        let slope = (f(x + h) - fx) / h;
		if (!Number.isFinite(slope) || Math.abs(slope) < Number.EPSILON) {
            return { error: "Slope is zero. The method cannot continue.", table: iterationTable };
        }

        // 2. The formula: nextX = x - f(x) / f'(x)
        x = x - (fx / slope);
        if (!Number.isFinite(x)) {
            return { error: "Newton iteration produced a non-finite value.", table: iterationTable };
        }
    }

    return {
        finalRoot: formatValue(x, sigs, mode),
        table: iterationTable
    };
}
