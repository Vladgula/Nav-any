
// Элементы DOM
const fromInput = document.getElementById('from');
const toInput = document.getElementById('to');
const autocomplete = document.getElementById('autocomplete');
let currentInput = null;

// Создаем обработчики событий для обоих полей ввода
[fromInput, toInput].forEach(input => {
    input.addEventListener('input', handleInput);
    input.addEventListener('focus', handleInput);
    input.addEventListener('blur', handleBlur);
});

// Обработчик клика вне автодополнения
document.addEventListener('click', (e) => {
    if (!autocomplete.contains(e.target) && e.target !== currentInput) {
        hideAutocomplete();
    }
});

// Обработчик ввода текста
function handleInput(e) {
    // Сначала скрываем автодополнение для всех полей
    [fromInput, toInput].forEach(input => {
        input.classList.remove('form__input_no-bottom-radius');
    });

    currentInput = e.target;
    const value = currentInput.value.trim();

    if (value.length === 0) {
        hideAutocomplete();
        return;
    }

    const matches = searchPoints(value);
    showAutocomplete(matches, currentInput);
}

// Обработчик потери фокуса (с задержкой для обработки клика по пункту)
function handleBlur() {
    setTimeout(() => {
        // Проверяем, был ли клик по автодополнению
        const activeElement = document.activeElement;
        const clickedAutocomplete = autocomplete.contains(activeElement);

        if (!clickedAutocomplete && activeElement !== currentInput) {
            // Восстанавливаем скругление только если переключились на элемент вне автодополнения
            restoreBottomLine();
            hideAutocomplete();
        }
    }, 100);
}

// Поиск совпадений
function searchPoints(query) {
    const lowerQuery = query.toLowerCase();

    return plan.points
        .filter(point => point.id.toLowerCase().includes(lowerQuery))
        .sort((a, b) => {
            const aName = a.id.toLowerCase();
            const bName = b.id.toLowerCase();

            // Проверяем, начинается ли слово с запроса
            const aStartsWith = aName.startsWith(lowerQuery) ? 0 : 1;
            const bStartsWith = bName.startsWith(lowerQuery) ? 0 : 1;

            // Сначала сортируем по признаку "начинается с"
            if (aStartsWith !== bStartsWith) {
                return aStartsWith - bStartsWith;
            }

            // Если оба начинаются или не начинаются - сортируем по длине слова
            return aName.length - bName.length;
        }).slice(0, 6); // Ограничиваем количество результатов
}

// Показать автодополнение
function showAutocomplete(items, inputElement) {
    if (items.length === 0) {
        hideAutocomplete();
        return;
    }

    // Очищаем предыдущие результаты
    autocomplete.innerHTML = '';

    // Создаем элементы списка
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'autocomplete__item';
        itemElement.textContent = item.id;

        const handleSelect = (e) => {
            inputElement.value = item.id;
            hideAutocomplete();
            inputElement.focus();
        }

        itemElement.addEventListener('mousedown', handleSelect);
        itemElement.addEventListener('click', handleSelect);

        autocomplete.appendChild(itemElement);
    });

    // Позиционируем автодополнение
    const rect = inputElement.getBoundingClientRect();
    autocomplete.style.top = `${rect.bottom + window.scrollY}px`;
    autocomplete.style.left = `${rect.left + window.scrollX}px`;
    autocomplete.style.width = `${rect.width}px`;
    autocomplete.style.display = 'block';
    inputElement.classList.add('form__input_no-bottom-radius');
}

// Скрыть автодополнение
function hideAutocomplete() {
    autocomplete.style.display = 'none';
    restoreBottomLine();
    currentInput = null;
}

//Восстанавливаем скругленный угол текстового поля
function restoreBottomLine() {
    if (currentInput) {
        currentInput.classList.remove('form__input_no-bottom-radius');
    }
}
