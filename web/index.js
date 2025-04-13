const tg = window.Telegram.WebApp;

// Инициализация приложения
function initApp() {
    tg.expand();
    tg.ready();
    updateTheme();
    
    // Установка данных пользователя
    document.getElementById('userName').textContent = tg.initDataUnsafe.user?.first_name || 'Гость';
    document.getElementById('userAvatar').src = tg.initDataUnsafe.user?.photo_url || 'default-avatar.png';
    document.getElementById('userLevel').textContent = '⭐ ' + (Math.random() * 5).toFixed(1);

    // Генерация тестовых данных
    generateOrders();
    generatePayments();

    // Обработчики событий
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });

    // Обработчик изменения темы
    tg.onEvent('themeChanged', updateTheme);
}

// Обновление темы
function updateTheme() {
    document.documentElement.style.setProperty('--tg-bg', tg.themeParams.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-text', tg.themeParams.text_color || '#222222');
    document.documentElement.style.setProperty('--tg-button', tg.themeParams.button_color || '#0088cc');
}

// Переключение секций
function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

// Генерация тестовых заказов
function generateOrders() {
    const orders = [
        { product: 'iPhone 15 Pro', date: '2024-04-15', status: 'В обработке' },
        { product: 'Samsung S24 Ultra', date: '2024-04-14', status: 'Доставка' }
    ];
    
    const list = document.getElementById('ordersList');
    orders.forEach(order => {
        list.innerHTML += `
            <div class="order-item">
                <h3>${order.product}</h3>
                <p>Дата: ${order.date}</p>
                <p>Статус: ${order.status}</p>
            </div>
        `;
    });
}

// Генерация тестовых платежей
function generatePayments() {
    const payments = [
        { amount: '24 500 ₽', date: '2024-04-15', method: 'Карта' },
        { amount: '12 300 ₽', date: '2024-04-14', method: 'Баланс' }
    ];
    
    const list = document.getElementById('paymentsList');
    payments.forEach(payment => {
        list.innerHTML += `
            <div class="payment-item">
                <h3>${payment.amount}</h3>
                <p>Дата: ${payment.date}</p>
                <p>Метод: ${payment.method}</p>
            </div>
        `;
    });
}

// Запуск приложения
initApp();