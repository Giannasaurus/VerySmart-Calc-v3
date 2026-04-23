function initializeRootFindingCalculators() {
    document.getElementById('runBisectionBtn').addEventListener('click', handleRunBisection);
    document.getElementById('runNewtonBtn').addEventListener('click', handleRunNewton);
}

function handleRunBisection() {
    let settings;
    try {
        settings = getRootFindingSettings();
    } catch (err) {
        showMethodError(err.message, 'bisectionRoot', 'bisectionSteps', 'bisectionTable');
        return;
    }

    const a = parseFloat(document.getElementById('bisectionA').value);
    const b = parseFloat(document.getElementById('bisectionB').value);
    const tol = parseFloat(document.getElementById('bisectionTolerance').value);

    if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) {
        showMethodError('Please enter two different finite endpoints.', 'bisectionRoot', 'bisectionSteps', 'bisectionTable');
        return;
    }
    if (!Number.isFinite(tol) || tol <= 0) {
        showMethodError('Please enter a positive tolerance.', 'bisectionRoot', 'bisectionSteps', 'bisectionTable');
        return;
    }

    const methodResult = runBisection(
        settings.f,
        Math.min(a, b),
        Math.max(a, b),
        settings.sigs,
        settings.mode,
        tol
    );

    displayMethodResult(methodResult, 'bisectionRoot', 'bisectionSteps', 'bisectionTable', ['iter', 'a', 'b', 'mid', 'fMid']);
}

function handleRunNewton() {
    let settings;
    try {
        settings = getRootFindingSettings();
    } catch (err) {
        showMethodError(err.message, 'newtonRoot', 'newtonSteps', 'newtonTable');
        return;
    }

    const x0 = parseFloat(document.getElementById('newtonInitial').value);
    const stopVal = parseFloat(document.getElementById('newtonStopValue').value);
    const stopType = document.getElementById('newtonStopType').value;

    if (!Number.isFinite(x0)) {
        showMethodError('Please enter a finite initial guess.', 'newtonRoot', 'newtonSteps', 'newtonTable');
        return;
    }
    if (!Number.isFinite(stopVal) || stopVal <= 0) {
        showMethodError('Please enter a positive stopping value.', 'newtonRoot', 'newtonSteps', 'newtonTable');
        return;
    }
    if (stopType === 'iter' && !Number.isInteger(stopVal)) {
        showMethodError('Iterations must be a whole number.', 'newtonRoot', 'newtonSteps', 'newtonTable');
        return;
    }

    const methodResult = runNewton(settings.f, x0, settings.sigs, settings.mode, stopVal, stopType);
    displayMethodResult(methodResult, 'newtonRoot', 'newtonSteps', 'newtonTable', ['iter', 'x', 'fx']);
}

function getRootFindingSettings() {
    const expr = document.getElementById('rootFunction').value.trim();
    const sigs = parseInt(document.getElementById('rootSigDigits').value);
    const mode = document.querySelector('input[name="rootMethod"]:checked').value;

    if (!expr) {
        throw new Error('Please enter a function f(x).');
    }
    if (isNaN(sigs) || sigs <= 0) {
        throw new Error('Please enter a positive number of significant digits.');
    }

    return {
        f: buildSingleVariableFunction(expr),
        sigs,
        mode
    };
}

function showMethodError(message, rootId, stepsId, tableId) {
    document.getElementById(rootId).value = message;
    document.getElementById(stepsId).value = '';
    clearTable(tableId);
}

function displayMethodResult(methodResult, rootId, stepsId, tableId, keys) {
    document.getElementById(rootId).value = methodResult.error || methodResult.finalRoot;
    document.getElementById(stepsId).value = methodResult.table ? methodResult.table.length : '';
    renderRows(tableId, methodResult.table || [], keys);
}
