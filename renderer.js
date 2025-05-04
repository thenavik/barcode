const videoElement = document.getElementById('video');
const resultElement = document.getElementById('result');

let codeReader = null;

async function startScanning() {
    try {
        // Инициализация ZXing
        const { BrowserMultiFormatReader } = window.ZXing;
        codeReader = new BrowserMultiFormatReader();
        
        const devices = await codeReader.listVideoInputDevices();
        
        if (devices.length === 0) {
            resultElement.textContent = 'Нет доступных камер. Проверьте подключение камеры и разрешения.';
            return;
        }

        console.log('Доступные камеры:', devices);
        
        // Пробуем использовать заднюю камеру, если доступна
        const selectedDevice = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear')
        ) || devices[0];

        console.log('Используется камера:', selectedDevice.label);

        await codeReader.decodeFromVideoDevice(selectedDevice.deviceId, videoElement, (result, err) => {
            if (result) {
                resultElement.textContent = `Результат: ${result.text}`;
                console.log('Сканировано:', result.text);
            }
            if (err && !(err instanceof window.ZXing.NotFoundException)) {
                console.error('Ошибка сканирования:', err);
                resultElement.textContent = 'Ошибка сканирования: ' + err.message;
            }
        });
    } catch (error) {
        console.error('Ошибка доступа к камере:', error);
        resultElement.textContent = 'Ошибка доступа к камере: ' + error.message;
        
        // Проверяем, есть ли у пользователя камера
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                console.log('Доступные устройства:', videoDevices);
                if (videoDevices.length === 0) {
                    resultElement.textContent += '\nКамера не обнаружена. Проверьте подключение.';
                }
            })
            .catch(err => {
                console.error('Ошибка при проверке устройств:', err);
                resultElement.textContent += '\nОшибка при проверке устройств: ' + err.message;
            });
    }
}

// Запускаем сканирование при загрузке страницы
window.addEventListener('load', startScanning);
