// File: /shared/chatbot.js (Phiên bản chuẩn)

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// URL của Web Service trung tâm trên Cloudflare
const AI_SERVICE_URL = '/askAI'; 

// Lấy mã bài học được định nghĩa trong từng file HTML
const LESSON_ID = window.lessonId || 'default';

// Gán sự kiện cho các nút, cần kiểm tra xem các phần tử có tồn tại không
if (sendButton && userInput && chatWindow) {
    sendButton.addEventListener('click', askAI);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            askAI();
        }
    });
}

function addMessageToChat(text, className) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', className);
    chatWindow.appendChild(messageElement);
    
    if (typeof marked !== 'undefined') {
        messageElement.innerHTML = marked.parse(text);
    } else {
        messageElement.textContent = text;
    }
    
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageElement;
}

async function askAI() {
    const question = userInput.value.trim();
    if (!question) return;

    addMessageToChat(question, 'user-message');
    userInput.value = '';
    const waitingMessage = addMessageToChat('Trợ lý AI đang suy nghĩ...', 'ai-message');

    try {
        const response = await fetch(AI_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                lesson_id: LESSON_ID
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Lỗi không xác định từ server');
        }
        
        waitingMessage.innerHTML = marked.parse(data.answer);

    } catch (error) {
        console.error("Lỗi khi gọi AI:", error);
        waitingMessage.innerHTML = marked.parse(`**Xin lỗi, đã có lỗi xảy ra!** (${error.message})`);
    }
}
