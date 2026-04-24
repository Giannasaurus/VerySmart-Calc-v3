function initializeLagrangeInterpolationCalculator() {
    document.getElementById('runLagrangeBtn').addEventListener('click', handleRunLagrangeInterpolation);
}

function handleRunLagrangeInterpolation() {
    const pointsInput = document.getElementById('lagrangePoints').value.trim();
    const xValueInput = document.getElementById('lagrangeXValue').value.trim();
    const polynomialResult = document.getElementById('lagrangePolynomialResult');
    const valueResult = document.getElementById('lagrangeValueResult');

    if (!pointsInput) {
        alert('Please enter at least two data points.');
        return;
    }

    try {
        const points = parseLagrangePoints(pointsInput);
        const polynomial = buildLagrangePolynomial(points);

        polynomialResult.value = polynomial.expression;
        valueResult.value = '';

        if (xValueInput !== '') {
            const xValue = Number(xValueInput);
            if (!Number.isFinite(xValue)) {
                throw new Error('Please enter a valid x value to evaluate.');
            }

            valueResult.value = polynomial.evaluate(xValue).toString();
        }
    } catch (err) {
        polynomialResult.value = '';
        valueResult.value = '';
        alert(err.message);
    }
}

function parseLagrangePoints(input) {
    const pairs = input.split(';').map((pair) => pair.trim()).filter(Boolean);

    if (pairs.length < 2) {
        throw new Error('Please enter at least two points separated by semicolons.');
    }

    const points = pairs.map((pair) => {
        const values = pair.split(',').map((value) => value.trim());
        if (values.length !== 2) {
            throw new Error('Each point must be in x,y format.');
        }

        const x = Number(values[0]);
        const y = Number(values[1]);

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            throw new Error('Each point must contain valid numeric x and y values.');
        }

        return {
            x: math.bignumber(x),
            y: math.bignumber(y)
        };
    });

    const uniqueXValues = new Set(points.map((point) => point.x.toString()));
    if (uniqueXValues.size !== points.length) {
        throw new Error('All x-values must be distinct for Lagrange interpolation.');
    }

    return points;
}

function buildLagrangePolynomial(points) {
    const terms = points.map((point, i) => {
        let denominator = math.bignumber(1);
        const numeratorFactors = [];

        points.forEach((otherPoint, j) => {
            if (i === j) {
                return;
            }

            denominator = math.multiply(denominator, math.subtract(point.x, otherPoint.x));
            numeratorFactors.push(formatLagrangeFactor(otherPoint.x));
        });

        const numerator = numeratorFactors.length ? numeratorFactors.join(' * ') : '1';
        return `(${point.y.toString()}) * (${numerator}) / (${denominator.toString()})`;
    });

    const expression = math.simplify(terms.join(' + ')).toString();
    const compiled = math.compile(expression);

    return {
        expression,
        evaluate: (xValue) => compiled.evaluate({ x: math.bignumber(xValue) })
    };
}

function formatLagrangeFactor(xValue) {
    if (math.equal(xValue, 0)) {
        return '(x)';
    }

    return math.larger(xValue, 0)
        ? `(x - ${xValue.toString()})`
        : `(x + ${math.abs(xValue).toString()})`;
}
