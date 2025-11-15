// File: /functions/askAI.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

const lessonPrompts = {
    'default': `Bạn là “Mentor Scratch”, một trợ lý AI chuyên gia về lập trình Scratch 3.0.
Nhiệm vụ của bạn là hướng dẫn, giải thích và truyền cảm hứng cho người mới bắt đầu (đặc biệt là học sinh THCS) học lập trình Scratch.
Bạn có khả năng:
•	Phân tích hình ảnh (ảnh chụp màn hình dự án Scratch, kịch bản, giao diện).
•	Phân tích tệp tải lên (file .sb3, ảnh, text, log) để gỡ lỗi và giải thích vấn đề.
•	Tạo sơ đồ khối (flowchart) để mô tả thuật toán và luồng xử lý một cách trực quan.

MỤC TIÊU CỦA BẠN
1.	Giải thích các khái niệm lập trình (vòng lặp, biến, điều kiện, sự kiện, broadcast…).
2.	Hướng dẫn cách sử dụng và ý nghĩa của từng khối lệnh Scratch.
3.	Hỗ trợ phân tích lỗi, tìm nguyên nhân và đề xuất sửa chữa.
4.	Gợi ý ý tưởng dự án phù hợp năng lực học sinh.
5.	Giải thích mọi thứ bằng cách đơn giản – trực quan – kiên nhẫn.

QUY TẮC BẮT BUỘC KHI PHẢN HỒI
(Toàn bộ quy tắc của bạn ...)`
};

// Hàm xử lý logic chính (chỉ chạy khi là POST)
async function handlePostRequest(context) {
    const apiKey = context.env.GOOGLE_API_KEY;

    // 1. Kiểm tra API Key
    if (!apiKey) {
        console.error("LỖI CẤU HÌNH: GOOGLE_API_KEY chưa được thiết lập!");
        return new Response(JSON.stringify({ error: 'Lỗi cấu hình máy chủ: Thiếu API Key.' }), { status: 500 });
    }

    try {
        // 2. Nhận dữ liệu (giống hệt code cũ của bạn)
        const { question, lesson_id, attachments } = await context.request.json();
        
        if (!question && (!attachments || attachments.length === 0)) {
            return new Response(JSON.stringify({ error: 'Thiếu câu hỏi hoặc tệp đính kèm.' }), { status: 400 });
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const systemPrompt = lessonPrompts[lesson_id] || lessonPrompts['default'];
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash-image-preview"
        });

        // 3. Xây dựng mảng nội dung
        const userContent = [];
        userContent.push({ text: systemPrompt }); // Đặt system prompt ở đầu

        if (question) {
            userContent.push({ text: question });
        }

        if (attachments && Array.isArray(attachments)) {
            for (const att of attachments) {
                if (att.base64Data) { 
                    userContent.push({
                        inlineData: {
                            mimeType: att.mimeType,
                            data: att.base64Data
                        }
                    });
                }
            }
        }
        
        // 4. Gọi API
        const result = await model.generateContent(userContent);
        const response = await result.response;
        const aiResponse = response.text();

        return new Response(JSON.stringify({ answer: aiResponse }), {
            headers: { 
                'Content-Type': 'application/json', 
                'Access-Control-Allow-Origin': '*' // Cho phép CORS
            },
        });

    } catch (error) {
        // 5. Bắt lỗi (giống code cũ)
        console.error('Lỗi xử lý function:', error);
        let errorMessage = error.message || 'Lỗi không xác định.';
        if (error.response && error.response.promptFeedback) {
             errorMessage = 'Nội dung bị chặn, có thể do vi phạm an toàn.';
             return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
        }
        if (error.message.includes('API key')) {
            errorMessage = 'Lỗi xác thực: API Key không hợp lệ.';
        }
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}

/**
 * [HÀM CHÍNH]
 * Đây là hàm mà Cloudflare sẽ gọi.
 * Nó kiểm tra phương thức (method) trước khi làm bất cứ điều gì.
 */
export async function onRequest(context) {
    
    // 1. Xử lý yêu cầu 'OPTIONS' (Preflight)
    // Trình duyệt gửi cái này TRƯỚC khi gửi POST
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204, // No Content
            headers: {
                'Access-Control-Allow-Origin': '*', // Cho phép domain của bạn
                'Access-Control-Allow-Methods': 'POST, OPTIONS', // Chỉ cho phép POST
                'Access-Control-Allow-Headers': 'Content-Type', // Cho phép header 'Content-Type'
            },
        });
    }

    // 2. Nếu là 'POST', chạy logic chatbot
    if (context.request.method === 'POST') {
        return handlePostRequest(context);
    }

    // 3. Nếu là bất cứ thứ gì khác (như GET), trả về lỗi 405
    return new Response(JSON.stringify({ error: 'Phương thức không được phép.' }), {
        status: 405,
        headers: {
            'Allow': 'POST, OPTIONS', // Báo cho trình duyệt biết chỉ cho phép POST
        },
    });
}
