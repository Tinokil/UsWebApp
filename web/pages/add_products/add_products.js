const tg = window.Telegram.WebApp;
let formIsValid = false;

function initApp() {
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
    document.getElementById('previewContent').innerHTML = generatePreviewHTML(formData);
    validateForm(formData);
}

function getFormData() {
    return {
        model: document.getElementById('model').value,
        category: document.getElementById('category').value,
        memory: document.getElementById('memory').value,
        price: document.getElementById('price').value,
        discount: document.getElementById('discount').value,
        original_price: document.getElementById('original_price').value,
        condition: document.getElementById('condition').value,
        color: document.getElementById('color').value,
        battery: document.getElementById('battery').value,
        location: document.getElementById('location').value,
        delivery: document.getElementById('delivery_possible').checked,
        meetup: document.getElementById('meetup_possible').checked,
        publish_avito: document.getElementById('publish_avito').checked,
        publish_telegram: document.getElementById('publish_telegram').checked,
        description: document.getElementById('description').value
    };
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
        document.querySelector('.btn').classList.add('active');
    } else {
        tg.MainButton.hide();
        document.querySelector('.btn').classList.remove('active');
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
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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
        document.getElementById(id).addEventListener('change', updatePreview);
    });
    
    tg.MainButton.onClick(submitForm);
    document.querySelector('.btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        submitForm();
    });
}

document.addEventListener('DOMContentLoaded', initApp);