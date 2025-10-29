// File: /functions/askAI.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

const lessonPrompts = {
    'do-toc-do': `Bạn là một trợ giảng AI chuyên sâu về bài học "Đo tốc độ"...`,
    // ... (toàn bộ danh sách các prompt khác) ...
    'default': `Bạn là một trợ giảng chung cho môn Khoa học Tự nhiên.`
};

export async function onRequest(context) {
    const apiKey = context.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("LỖI CẤU HÌNH: GOOGLE_API_KEY chưa được thiết lập!");
        return new Response(JSON.stringify({ error: 'Lỗi cấu hình máy chủ.' }), { status: 500 });
    }

    try {
        const { question, lesson_id } = await context.request.json();
        if (!question) {
            return new Response(JSON.stringify({ error: 'Thiếu câu hỏi.' }), { status: 400 });
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

        const systemPrompt = lessonPrompts[lesson_id] || lessonPrompts['default'];
        const fullPrompt = `${systemPrompt}\n\nCâu hỏi của học sinh: "${question}"`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const aiResponse = response.text();

        return new Response(JSON.stringify({ answer: aiResponse }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });

    } catch (error) {
        console.error('Lỗi xử lý function:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}


