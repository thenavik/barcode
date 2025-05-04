const videoElement = document.getElementById('video');
const resultElement = document.getElementById('result');
const cameraSelect = document.getElementById('cameraSelect');

let codeReader = null;
let currentStream = null;

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
    }
}

// Обработчик изменения выбранной камеры
cameraSelect.addEventListener('change', () => {
    stopCurrentStream();
    resultElement.textContent = 'Выберите камеру и нажмите "Начать сканирование"';
});

// Запускаем обновление списка камер при загрузке страницы
window.addEventListener('load', updateCameraList);
