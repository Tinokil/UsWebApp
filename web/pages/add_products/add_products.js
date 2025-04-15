const tg = window.Telegram.WebApp;
let formIsValid = false;

function initApp() {
    if (!tg.initDataUnsafe) {
        // Если запуск не из Telegram, добавляем fallback
        document.addEventListener('DOMContentLoaded', setupApp);
        return;
    }
    setupApp();
}

function setupApp() {
    tg.ready();
    tg.expand();
    
    tg.MainButton.setParams({
        color: tg.themeParams.button_color || '#0088cc',
        text_color: '#ffffff',
        is_active: false,
        is_visible: false
    });
    
    updatePreview();
    setupEventListeners();
}

function updatePreview() {
    const formData = getFormData();
    const previewElement = document.getElementById('previewContent');
    if (previewElement) {
        previewElement.innerHTML = generatePreviewHTML(formData);
    }
    validateForm(formData);
}

function getFormData() {
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

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : null;
}

function getChecked(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

function generatePreviewHTML(data) {
    const finalPrice = data.discount ? 
        Math.round(data.price * (1 - (data.discount/100))) : 
        data.price;
    
    const conditionText = {
        'new': 'Новое',
        'like_new': 'Хорошее',
        'good': 'Удовлетворительное',
        'satisfactory': 'Требуется ремонт'
    }[data.condition] || data.condition;
    
    return `
        <p>📱 <strong>${data.model || 'Модель не указана'}${data.memory ? ` | ${data.memory}ГБ` : ''}</strong></p>
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
    `;
}

function validateForm(data) {
    const requiredFields = ['model', 'category', 'price', 'location', 'original_price', 'condition'];
    formIsValid = requiredFields.every(field => data[field] && data[field].toString().trim() !== '');
    
    if (formIsValid) {
        tg.MainButton.setText('🚀 Опубликовать');
        tg.MainButton.show().enable();
        const btn = document.querySelector('.btn');
        if (btn) btn.classList.add('active');
    } else {
        tg.MainButton.hide();
        const btn = document.querySelector('.btn');
        if (btn) btn.classList.remove('active');
    }
}

function submitForm() {
    if (!formIsValid) return;
    
    tg.sendData(JSON.stringify({
        ...getFormData(),
        timestamp: new Date().toISOString()
    }));
    
    tg.close();
}

function formatPrice(price) {
    return Number(price).toLocaleString('ru-RU');
}

function truncateDescription(text, maxLength = 100) {
    return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function setupEventListeners() {
    const formIds = [
        'model', 'category', 'memory', 'price', 'discount', 
        'original_price', 'condition', 'color', 'battery', 
        'location', 'description'
    ];
    
    formIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.addEventListener('input', updatePreview);
    });
    
    ['delivery_possible', 'meetup_possible', 'publish_avito', 'publish_telegram'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.addEventListener('change', updatePreview);
    });
    
    if (tg.MainButton) {
        tg.MainButton.onClick(submitForm);
    }
    
    const btn = document.querySelector('.btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            submitForm();
        });
    }
}

initApp();
