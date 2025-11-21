import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequest(context) {
    const apiKey = context.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
        return new Response("❌ LỖI: Chưa tìm thấy API Key trong Settings!", { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // --- THỬ MODEL 1.5 FLASH (Khuyên dùng) ---
    try {
        const modelName = "gemini-1.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent("Trả lời ngắn gọn: Bạn là model nào?");
        const response = await result.response;
        const text = response.text();

        return new Response(`✅ THÀNH CÔNG!\n\n- API Key: Hợp lệ\n- Model đang thử: ${modelName}\n- AI Phản hồi: "${text}"`);

    } catch (error) {
        // Nếu lỗi, in chi tiết ra để biết tại sao
        return new Response(`❌ THẤT BẠI KHI GỌI MODEL!\n\nLỗi chi tiết: ${error.message}\n\nGợi ý:\n- Nếu lỗi 404: Sai tên Model.\n- Nếu lỗi 429: Hết hạn ngạch (Hết tiền).\n- Nếu lỗi 400: API Key không hợp lệ.`);
    }
}
