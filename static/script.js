const form = document.getElementById('uncertainty-form');
const measurementsWrap = document.getElementById('measurement-list');
const addMeasurementButton = document.getElementById('add-measurement');
const feedback = document.getElementById('form-feedback');
const resultsSection = document.getElementById('results');

const MAX_MEASUREMENTS = 30;
const API_BASE_URL = (() => {
	if (typeof window.__API_BASE_URL__ === 'string' && window.__API_BASE_URL__.trim() !== '') {
		return window.__API_BASE_URL__.trim().replace(/\/$/, '');
	}

	const { protocol, hostname, port } = window.location;

	if (protocol === 'file:') {
		return 'http://127.0.0.1:8000';
	}

	if (port === '8000' || port === '') {
		return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
	}

	return `http://${hostname || '127.0.0.1'}:8000`;
})();

const numberPattern = /^[-+]?\d*(?:[\.,]\d+)?$/;

function setFeedback(message, state) {
	feedback.textContent = message || '';
	feedback.classList.remove('form-feedback--error', 'form-feedback--success');

	if (!message) {
		return;
	}

	if (state === 'error') {
		feedback.classList.add('form-feedback--error');
	}

	if (state === 'success') {
		feedback.classList.add('form-feedback--success');
	}
}

function buildMeasurementLabel(index) {
	return `Pomiar ${index + 1}`;
}

function renderMeasurementIndices() {
	const measurementNodes = measurementsWrap.querySelectorAll('.measurement-item');
	measurementNodes.forEach((node, index) => {
		const label = node.querySelector('label');
		if (label) {
			label.textContent = buildMeasurementLabel(index);
		}
	});
}

function createMeasurementItem(initialValue = '') {
	const wrapper = document.createElement('div');
	wrapper.className = 'measurement-item';

	const topRow = document.createElement('div');
	topRow.className = 'measurement-item__top';

	const label = document.createElement('label');
	label.textContent = buildMeasurementLabel(measurementsWrap.children.length);
	label.htmlFor = `measurement-${Date.now()}-${Math.random().toString(16).slice(2)}`;

	const removeButton = document.createElement('button');
	removeButton.type = 'button';
	removeButton.className = 'measurement-remove';
	removeButton.textContent = 'Usun';
	removeButton.addEventListener('click', () => {
		if (measurementsWrap.children.length <= 2) {
			setFeedback('Potrzebujemy co najmniej dwoch pomiarow.', 'error');
			return;
		}

		wrapper.remove();
		renderMeasurementIndices();
	});

	topRow.appendChild(label);
	topRow.appendChild(removeButton);

	const input = document.createElement('input');
	input.type = 'text';
	input.id = label.htmlFor;
	input.inputMode = 'decimal';
	input.autocomplete = 'off';
	input.placeholder = 'np. 12.345';
	input.value = initialValue;

	wrapper.appendChild(topRow);
	wrapper.appendChild(input);

	return wrapper;
}

function addMeasurement(initialValue = '') {
	if (measurementsWrap.children.length >= MAX_MEASUREMENTS) {
		setFeedback(`Mozesz dodac maksymalnie ${MAX_MEASUREMENTS} pomiarow.`, 'error');
		return;
	}

	const item = createMeasurementItem(initialValue);
	measurementsWrap.appendChild(item);
	renderMeasurementIndices();
}

function prepareMeasurements() {
	const inputs = Array.from(measurementsWrap.querySelectorAll('input'));
	const cleaned = [];

	for (const input of inputs) {
		const raw = input.value.trim();

		if (raw === '') {
			continue;
		}

		if (!numberPattern.test(raw)) {
			throw new Error(`"${raw}" nie wyglada na liczbe.`);
		}

		const normalized = raw.replace(',', '.');
		const numericValue = Number(normalized);

		if (!Number.isFinite(numericValue)) {
			throw new Error(`Nie mozemy odczytac liczby z wartosci "${raw}".`);
		}

		cleaned.push(numericValue);
	}

	if (cleaned.length < 2) {
		throw new Error('Potrzebujemy co najmniej dwoch pomiarow.');
	}

	return cleaned;
}

function prepareDeviceUncertainty() {
	const input = document.getElementById('device-uncertainty');

	if (!input) {
		return null;
	}

	const raw = input.value.trim();

	if (raw === '') {
		return null;
	}

	if (!numberPattern.test(raw)) {
		throw new Error('Niepewnosc urzadzenia powinna byc liczba.');
	}

	const normalized = raw.replace(',', '.');
	const numericValue = Number(normalized);

	if (!Number.isFinite(numericValue) || numericValue < 0) {
		throw new Error('Niepewnosc urzadzenia musi byc nieujemna.');
	}

	return numericValue;
}

function renderResults(data) {
	const list = document.createElement('ul');
	list.className = 'results__list';

	const entries = [
		{ key: 'n', label: 'Liczba pomiarów' },
		{ key: 'sum_of_squares', label: 'Suma kwadratów odchyleń' },
		{ key: 'u_a', label: 'u_a (typ A)' },
		{ key: 'u_b', label: 'u_b (typ B)' },
		{ key: 'u_c', label: 'u_c (łączna)' }
	];

	entries.forEach(({ key, label }) => {
		if (typeof data[key] === 'number') {
			const item = document.createElement('li');
			item.textContent = `${label}: ${String(data[key])}`;
			list.appendChild(item);
		}
	});

	// Dodaj składniki u_a jeśli istnieją
	if (Array.isArray(data.u_a_ingredients) && data.u_a_ingredients.length > 0) {
		const ingredientsItem = document.createElement('li');
		ingredientsItem.innerHTML = `<strong>Składniki (x̄ - xᵢ)²:</strong>`;
		const ingredientsList = document.createElement('ul');
		ingredientsList.style.marginTop = '8px';
		ingredientsList.style.marginLeft = '20px';
		
		data.u_a_ingredients.forEach((val, idx) => {
			const subItem = document.createElement('li');
			subItem.textContent = `Pomiar ${idx + 1}: ${String(val)}`;
			ingredientsList.appendChild(subItem);
		});
		
		ingredientsItem.appendChild(ingredientsList);
		list.appendChild(ingredientsItem);
	}

	resultsSection.innerHTML = '';

	const heading = document.createElement('h3');
	heading.textContent = 'Wyniki';

	resultsSection.appendChild(heading);
	resultsSection.appendChild(list);

	if (typeof data.summary === 'string' && data.summary.trim() !== '') {
		const summaryWrap = document.createElement('div');
		summaryWrap.className = 'results__summary';

		const summaryCode = document.createElement('code');
		summaryCode.textContent = data.summary;

		const copyButton = document.createElement('button');
		copyButton.type = 'button';
		copyButton.className = 'results__copy';
		copyButton.textContent = 'Kopiuj';
		copyButton.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(data.summary);
				copyButton.textContent = 'Skopiowano!';
				setTimeout(() => {
					copyButton.textContent = 'Kopiuj';
				}, 1800);
			} catch (error) {
				copyButton.textContent = 'Blad kopiowania';
				setTimeout(() => {
					copyButton.textContent = 'Kopiuj';
				}, 1800);
			}
		});

		summaryWrap.appendChild(summaryCode);
		summaryWrap.appendChild(copyButton);
		resultsSection.appendChild(summaryWrap);
	}
	resultsSection.classList.add('is-visible');
}

async function submitForm(event) {
	event.preventDefault();
	setFeedback('', null);
	resultsSection.classList.remove('is-visible');
	resultsSection.innerHTML = '';

	let measurements;
	let deviceUncertainty;

	try {
		measurements = prepareMeasurements();
		deviceUncertainty = prepareDeviceUncertainty();
	} catch (error) {
		setFeedback(error.message, 'error');
		return;
	}

	const payload = {
		scores: measurements,
		device_uncertanity: deviceUncertainty
	};

	try {
	const response = await fetch(`${API_BASE_URL}/api/uncertanity`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const problem = await response.json().catch(() => null);
			const message = problem?.detail || 'Ups! Nie udalo sie policzyc niepewnosci.';
			throw new Error(message);
		}

		const data = await response.json();
		renderResults(data);
		setFeedback('Gotowe! Zobacz wyniki ponizej.', 'success');
	} catch (error) {
		setFeedback(error.message, 'error');
	}
}

function bootstrap() {
	measurementsWrap.innerHTML = '';
	addMeasurement('12.345');
	addMeasurement('12.678');

	addMeasurementButton.addEventListener('click', () => addMeasurement());
	form.addEventListener('submit', submitForm);
}

let mathInitAttempts = 0;

function initMath() {
	if (typeof window.renderMathInElement !== 'function') {
		if (mathInitAttempts < 10) {
			mathInitAttempts += 1;
			setTimeout(initMath, 150);
		}
		return;
	}

	window.renderMathInElement(document.body, {
		delimiters: [
			{ left: '$$', right: '$$', display: true },
			{ left: '\\(', right: '\\)', display: false }
		],
		hrowOnError: false
	});
}

function initApp() {
	initMath();
	bootstrap();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initApp);
} else {
	initApp();
}
