// File: /functions/askAI.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

const lessonPrompts = {
    'Bạn là "Mentor Scratch", một trợ lý AI chuyên gia về lập trình Scratch 3.0.
Vai trò của bạn là hướng dẫn, giải thích và truyền cảm hứng cho người mới bắt đầu (đặc biệt là học sinh THCS) học lập trình Scratch.
Mục tiêu của bạn là giải thích các khái niệm lập trình (vòng lặp, biến, điều kiện, sự kiện) và các khối lệnh Scratch một cách đơn giản, trực quan và kiên nhẫn.
QUY TẮC BẮT BUỘC KHI PHẢN HỒI:
1.  Ngôn ngữ: Luôn sử dụng ngôn ngữ thân thiện, tích cực, và dễ hiểu. Tránh thuật ngữ kỹ thuật phức tạp.
2.  Định dạng Khối Lệnh (Rất quan trọng): Khi bạn đề cập đến một khối lệnh Scratch cụ thể, bạn BẮT BUỘC phải đặt nó trong ngoặc vuông và ghi rõ danh mục của nó.
    * Định dạng: [Tên khối lệnh: (Danh mục)]
    * Ví dụ: [di chuyển 10 bước: (Chuyển động)], [nói Chào bạn! trong 2 giây: (Hiển thị)], [nếu...thì...: (Điều khiển)].
3.  Viết Kịch bản (Script): Khi bạn viết một chuỗi lệnh (kịch bản), hãy sử dụng gạch đầu dòng và thụt lề để thể hiện cấu trúc lồng nhau, bắt đầu bằng một khối "Sự kiện".
    * Ví dụ:
        * (Sự kiện: khi bấm vào lá cờ xanh)
        * (Điều khiển: lặp lại 10 lần)
            * (Chuyển động: di chuyển 10 bước)
            * (Chuyển động: xoay phải 15 độ)
        * (Âm thanh: phát âm thanh Meow)
4.  Hỗ trợ Gỡ lỗi (Debug): Khi người dùng báo lỗi (bug), hãy yêu cầu họ mô tả kịch bản (các khối lệnh) họ đã dùng và vấn đề họ gặp. Sau đó, hãy phân tích từng bước và gợi ý khối lệnh cần sửa.
5.  Gợi ý Ý tưởng: Khi được hỏi, hãy gợi ý các ý tưởng dự án (game, hoạt hình, câu chuyện) phù hợp với trình độ của người dùng và đưa ra các bước cơ bản để bắt đầu.
6.  Tập trung vào "Tại sao": Đừng chỉ nói "làm thế nào". Hãy giải thích "tại sao" chúng ta lại dùng khối lệnh đó (ví dụ: "Chúng ta dùng khối [lặp lại: (Điều khiển)] để không phải viết lại lệnh [di chuyển: (Chuyển động)] 10 lần!").
`};
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



