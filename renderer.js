const videoElement = document.getElementById('video');
const resultElement = document.getElementById('result');
const cameraSelect = document.getElementById('cameraSelect');
const formatSelect = document.getElementById('formatSelect');
const formatInfo = document.getElementById('formatInfo');

let codeReader = null;
let currentStream = null;

// Словарь форматов штрих-кодов
const formatMap = {
    'all': 'Все форматы',
    'qr': 'QR Code',
    'ean13': 'EAN-13 (товарные коды)',
    'ean8': 'EAN-8 (товарные коды)',
    'upca': 'UPC-A (товарные коды)',
    'upce': 'UPC-E (товарные коды)',
    'code128': 'Code 128 (универсальный)',
    'code39': 'Code 39 (буквенно-цифровой)',
    'code93': 'Code 93 (буквенно-цифровой)',
    'itf': 'ITF (межстрочный)',
    'codabar': 'Codabar (цифровой)'
};

// Функция для обновления списка камер
async function updateCameraList() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        cameraSelect.innerHTML = '<option value="">Выберите камеру...</option>';
        
        videoDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Камера ${videoDevices.indexOf(device) + 1}`;
            cameraSelect.appendChild(option);
        });
        
        if (videoDevices.length > 0) {
            cameraSelect.disabled = false;
        } else {
            cameraSelect.disabled = true;
            resultElement.textContent = 'Камеры не обнаружены. Подключите камеру и обновите страницу.';
        }
    } catch (error) {
        console.error('Ошибка при получении списка камер:', error);
        resultElement.textContent = 'Ошибка при получении списка камер: ' + error.message;
    }
}

// Остановка текущего потока
function stopCurrentStream() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

// Получение форматов для сканирования
function getSelectedFormats() {
    const selectedFormat = formatSelect.value;
    if (selectedFormat === 'all') {
        return null; // null означает все форматы
    }
    
    const { BarcodeFormat } = window.ZXing;
    const formatMap = {
        'qr': BarcodeFormat.QR_CODE,
        'ean13': BarcodeFormat.EAN_13,
        'ean8': BarcodeFormat.EAN_8,
        'upca': BarcodeFormat.UPC_A,
        'upce': BarcodeFormat.UPC_E,
        'code128': BarcodeFormat.CODE_128,
        'code39': BarcodeFormat.CODE_39,
        'code93': BarcodeFormat.CODE_93,
        'itf': BarcodeFormat.ITF,
        'codabar': BarcodeFormat.CODABAR
    };
    
    return [formatMap[selectedFormat]];
}

// Обновление информации о формате
function updateFormatInfo() {
    const selectedFormat = formatSelect.value;
    formatInfo.textContent = `Выбран формат: ${formatMap[selectedFormat]}`;
}

async function startScanning() {
    try {
        stopCurrentStream();
        
        const selectedDeviceId = cameraSelect.value;
        if (!selectedDeviceId) {
            resultElement.textContent = 'Пожалуйста, выберите камеру';
            return;
        }

        // Инициализация ZXing
        const { BrowserMultiFormatReader } = window.ZXing;
        codeReader = new BrowserMultiFormatReader();
        
        // Установка форматов для сканирования
        const formats = getSelectedFormats();
        if (formats) {
            codeReader.setHints({
                formats: formats
            });
        }
        
        // Получаем поток с выбранной камеры
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: selectedDeviceId,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        videoElement.srcObject = currentStream;
        videoElement.play();

        await codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, err) => {
            if (result) {
                const format = result.getBarcodeFormat();
                resultElement.textContent = `Формат: ${format}\nРезультат: ${result.text}`;
                console.log('Сканировано:', result.text, 'Формат:', format);
            }
            if (err && !(err instanceof window.ZXing.NotFoundException)) {
                console.error('Ошибка сканирования:', err);
                resultElement.textContent = 'Ошибка сканирования: ' + err.message;
            }
        });
    } catch (error) {
        console.error('Ошибка доступа к камере:', error);
        resultElement.textContent = 'Ошибка доступа к камере: ' + error.message;
    }
}

// Обработчик изменения выбранной камеры
cameraSelect.addEventListener('change', () => {
    stopCurrentStream();
    resultElement.textContent = 'Выберите камеру и нажмите "Начать сканирование"';
});

// Обработчик изменения формата
formatSelect.addEventListener('change', updateFormatInfo);

// Запускаем обновление списка камер и информации о формате при загрузке страницы
window.addEventListener('load', () => {
    updateCameraList();
    updateFormatInfo();
});
