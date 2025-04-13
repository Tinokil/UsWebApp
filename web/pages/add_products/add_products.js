let tg = window.Telegram.WebApp;

tg.expand();

// Инициализация MainButton
tg.MainButton.setText("Отправить данные");
tg.MainButton.textColor = "#FFFFFF";
tg.MainButton.color = "#2C91FF";
tg.MainButton.show();

// Обработчики кнопок (только если элементы существуют)
document.getElementById("btn")?.addEventListener('click', function() {
    tg.MainButton.isVisible ? tg.MainButton.hide() : tg.MainButton.show();
});

document.getElementById("btnED")?.addEventListener('click', function() {
    if (tg.MainButton.isActive) {
        tg.MainButton.setParams({"color": "#CCCCCC"});
        tg.MainButton.disable();
    } else {
        tg.MainButton.setParams({"color": "#2C91FF"});
        tg.MainButton.enable();
    }
});

// Обработчик данных
Telegram.WebApp.onEvent('mainButtonClicked', function() {
    const data = {
        user: tg.initDataUnsafe?.user,
        query_id: tg.initDataUnsafe?.query_id
    };
    tg.sendData(JSON.stringify(data));
});

// Показ информации о пользователе
let usercard = document.getElementById("usercard");
if (usercard && tg.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user;
    let profName = document.createElement('p');
    profName.innerText = `${user.first_name || ''} ${user.last_name || ''}\n@${user.username || 'нет'}`;
    usercard.appendChild(profName);
}