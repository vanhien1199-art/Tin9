// File: /shared/chatbot.js
// Đã cập nhật để gửi FormData (văn bản + tệp)

// --- Lấy các phần tử DOM ---
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// URL của Web Service (giữ nguyên)
const AI_SERVICE_URL = '/askAI'; // Đường dẫn này đúng vì nó là tuyệt đối
const LESSON_ID = window.lessonId || 'default';

// --- Gán sự kiện ---
if (sendButton && userInput && chatWindow) {
    sendButton.addEventListener('click', askAI);
    userInput.addEventListener('keydown', (e) => {
        // Cho phép Shift+Enter để xuống dòng
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Ngăn hành vi xuống dòng mặc định
            askAI();
        }
    });
}

/**
 * Thêm tin nhắn (văn bản thuần túy hoặc Markdown) vào cửa sổ chat.
 * Hàm này chủ yếu dùng cho tin nhắn của AI hoặc tin nhắn chờ.
 * Tin nhắn của người dùng sẽ dùng window.appendUserMessage
 */
function addMessageToChat(text, className) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', className);
    chatWindow.appendChild(messageElement);
    
    // Sử dụng thư viện 'marked' (nếu có) để render Markdown
    if (typeof marked !== 'undefined') {
        messageElement.innerHTML = marked.parse(text);
    } else {
        // Fallback nếu marked không tải được
        messageElement.textContent = text;
    }
    
    // Tự động cuộn xuống dưới
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return messageElement;
}

/**
 * Hàm chính để gửi câu hỏi (và tệp) đến AI
 */
async function askAI() {
    const question = userInput.value.trim();
    
    // Lấy các tệp đính kèm từ script của index.html (phải được expose ra window)
    const filesToUpload = window.attachments ? [...window.attachments] : [];

    // Không gửi nếu không có văn bản VÀ không có tệp
    if (!question && filesToUpload.length === 0) {
        return;
    }

    // --- 1. Hiển thị tin nhắn của người dùng lên UI ngay lập tức ---
    
    // Kiểm tra xem hàm appendUserMessage từ index.html đã sẵn sàng chưa
    if (typeof window.appendUserMessage === 'function') {
        const imageUrls = filesToUpload
            .filter(a => a.file.type.startsWith('image/'))
            .map(a => a.url); // a.url là blob URL
        
        const fileLinks = filesToUpload
            .filter(a => !a.file.type.startsWith('image/'))
            .map(a => ({ url: a.url || '#', name: a.file.name }));

        // Gọi hàm của index.html để hiển thị tin nhắn người dùng (với ảnh/tệp)
        window.appendUserMessage(question, imageUrls, fileLinks);
    } else {
        // Fallback nếu hàm kia chưa có
        addMessageToChat(question || "(Đã gửi tệp)", 'user-message');
    }

    // --- 2. Dọn dẹp input và khu vực đính kèm ---
    userInput.value = '';
    if (window.attachments) {
        window.attachments = []; // Xóa mảng gốc
    }
    if (typeof window.renderAttachments === 'function') {
        window.renderAttachments(); // Cập nhật UI (xóa các tệp)
    }

    // Thêm tin nhắn chờ của AI
    const waitingMessage = addMessageToChat('Trợ lý AI đang suy nghĩ...', 'ai-message');
    sendButton.disabled = true; // Vô hiệu hóa nút gửi trong khi chờ

    // --- 3. Chuẩn bị FormData để gửi lên backend ---
    const formData = new FormData();
    formData.append('question', question);
    formData.append('lesson_id', LESSON_ID);

    // Thêm các tệp vào FormData
    filesToUpload.forEach((att) => {
        formData.append('files', att.file, att.file.name); // 'files' phải khớp với backend
    });

    // --- 4. Gửi request ---
    try {
        const response = await fetch(AI_SERVICE_URL, {
            method: 'POST',
            body: formData,
            // KHÔNG set 'Content-Type' ở đây. 
            // Trình duyệt sẽ tự động đặt 'multipart/form-data' với 'boundary' chính xác.
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Lỗi không xác định từ server');
        }
        
        // Cập nhật tin nhắn chờ bằng câu trả lời của AI (render Markdown)
        waitingMessage.innerHTML = marked.parse(data.answer);

    } catch (error) {
        console.error("Lỗi khi gọi AI:", error);
        waitingMessage.innerHTML = marked.parse(`**Xin lỗi, đã có lỗi xảy ra!** (${error.message})`);
    } finally {
        sendButton.disabled = false; // Bật lại nút gửi

        // Dọn dẹp các blob URL đã tạo
        filesToUpload.forEach(a => { 
            if (a.url && a.file.type.startsWith('image/')) {
                URL.revokeObjectURL(a.url);
            }
        });
    }
}