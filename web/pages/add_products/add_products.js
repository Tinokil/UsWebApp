// add_products.js
const tg = window.Telegram?.WebApp || {};
let formIsValid = false;

// Основная функция инициализации
function initApp() {
    // Проверяем, доступен ли Telegram WebApp
    if (window.Telegram?.WebApp) {
        tg.ready();
        tg.expand();
        
        tg.MainButton.setParams({
            color: tg.themeParams.button_color || '#0088cc',
            text_color: '#ffffff',
            is_active: false,
            is_visible: false
        });
    }
    
    // Инициализируем форму
    setupForm();
}

// Настройка формы и обработчиков событий
function setupForm() {
    updatePreview();
    setupEventListeners();
    
    // Если это inline-режим, сразу обновляем предпросмотр
    if (tg.initDataUnsafe?.query_id) {
        updatePreview();
    }
}

// Получение данных формы с защитой от ошибок
function getFormData() {
    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };
    
    const getChecked = (id) => {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    };

    return {
        type: "add_products",
        model: getValue('model'),
        category: getValue('category'),
        memory: getValue('memory'),
        price: getValue('price'),
        discount: getValue('discount'),
        original_price: getValue('original_price'),
        condition: getValue('condition'),
        color: getValue('color'),
        battery: getValue('battery'),
        location: getValue('location'),
        delivery: getChecked('delivery_possible'),
        meetup: getChecked('meetup_possible'),
        publish_avito: getChecked('publish_avito'),
        publish_telegram: getChecked('publish_telegram'),
        description: getValue('description')
    };
}

// Генерация HTML для предпросмотра
function generatePreviewHTML(data) {
    if (!data) return '';
    
    const finalPrice = data.discount ? 
        Math.round(data.price * (1 - (data.discount/100))) : 
        data.price;
    
    const conditionMap = {
        'new': 'Новое',
        'like_new': 'Хорошее',
        'good': 'Удовлетворительное',
        'satisfactory': 'Требуется ремонт'
    };
    
    const conditionText = conditionMap[data.condition] || data.condition;
    
    return `
        <div class="preview-content">
            ${data.model ? `<p>📱 <strong>${data.model}${data.memory ? ` | ${data.memory}ГБ` : ''}</strong></p>` : ''}
            ${data.price ? `
                <p>💵 <strong>Цена:</strong> 
                    ${data.discount ? `<s>${formatPrice(data.price)}</s> ` : ''}
                    <b>${formatPrice(finalPrice)}₽</b>
                    ${data.discount ? `(-${data.discount}%)` : ''}
                </p>
            ` : ''}
            ${data.condition ? `<p>⚡ <strong>Состояние:</strong> ${conditionText}</p>` : ''}
            ${data.color ? `<p>🎨 <strong>Цвет:</strong> ${data.color}</p>` : ''}
            ${data.battery ? `<p>🔋 <strong>Батарея:</strong> ${data.battery}%</p>` : ''}
            ${data.location ? `
                <p>📍 <strong>${data.meetup ? 'Самовывоз:' : 'Локация:'}</strong> ${data.location}</p>
                <p>🚚 <strong>Доставка:</strong> 
                    <span class="status-badge ${data.delivery ? 'active' : 'disable'}">
                        ${data.delivery ? 'Вкл' : 'Выкл'}
                    </span>
                </p>
            ` : ''}
            ${data.description ? `<p>📝 <strong>Описание:</strong> ${truncateDescription(data.description)}</p>` : ''}
        </div>
    `;
}

// Обновление предпросмотра
function updatePreview() {
    try {
        const formData = getFormData();
        const previewElement = document.getElementById('previewContent');
        
        if (previewElement) {
            previewElement.innerHTML = generatePreviewHTML(formData);
        }
        
        validateForm(formData);
    } catch (e) {
        console.error('Preview update error:', e);
    }
}

// Валидация формы
function validateForm(data) {
    const requiredFields = ['model', 'category', 'price', 'location', 'original_price', 'condition'];
    formIsValid = requiredFields.every(field => data[field] && data[field].toString().trim() !== '');
    
    if (window.Telegram?.WebApp) {
        if (formIsValid) {
            tg.MainButton.setText('🚀 Опубликовать');
            tg.MainButton.show().enable();
        } else {
            tg.MainButton.hide();
        }
    }
    
    const btn = document.querySelector('.btn');
    if (btn) {
        btn.classList.toggle('active', formIsValid);
    }
}

// Отправка формы
function submitForm(event) {
    if (event) event.preventDefault();
    if (!formIsValid) return;
    
    const formData = getFormData();
    
    if (window.Telegram?.WebApp) {
        tg.sendData(JSON.stringify({
            ...formData,
            timestamp: new Date().toISOString()
        }));
        tg.close();
    } else {
        console.log('Form data:', formData);
        alert('Форма отправлена! (тестовый режим)');
    }
}

// Вспомогательные функции
function formatPrice(price) {
    return price ? Number(price).toLocaleString('ru-RU') : '0';
}

function truncateDescription(text, maxLength = 100) {
    return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text || '';
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчики для полей ввода
    const inputFields = [
        'model', 'category', 'memory', 'price', 'discount',
        'original_price', 'condition', 'color', 'battery',
        'location', 'description'
    ];
    
    inputFields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updatePreview);
        }
    });
    
    // Обработчики для чекбоксов
    const checkboxes = [
        'delivery_possible', 'meetup_possible',
        'publish_avito', 'publish_telegram'
    ];
    
    checkboxes.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updatePreview);
        }
    });
    
    // Обработчик для кнопки
    const btn = document.querySelector('.btn');
    if (btn) {
        btn.addEventListener('click', submitForm);
    }
    
    // Обработчик для MainButton Telegram
    if (window.Telegram?.WebApp?.MainButton) {
        tg.MainButton.onClick(submitForm);
    }
}

// Запускаем приложение
document.addEventListener('DOMContentLoaded', initApp);

// Для inline-режима также вызываем инициализацию
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initApp();
} else {
    document.addEventListener('DOMContentLoaded', initApp);
}
