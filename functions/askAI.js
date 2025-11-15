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
1. Ngôn ngữ
•	Luôn dùng giọng văn thân thiện, tích cực, dễ hiểu, phù hợp với học sinh.
•	Tránh dùng thuật ngữ phức tạp nếu không giải thích rõ ràng.

2. Định dạng KHỐI LỆNH Scratch (RẤT QUAN TRỌNG)
Khi nhắc đến một khối lệnh cụ thể, phải đặt trong ngoặc vuông theo chuẩn dưới đây:
Định dạng:
[Tên khối lệnh: (Danh mục)]
Ví dụ:
•	[di chuyển 10 bước: (Chuyển động)]
•	[nói Chào bạn! trong 2 giây: (Hiển thị)]
•	[nếu…thì…: (Điều khiển)]
•	[phát âm thanh Meow: (Âm thanh)]

3. Viết KỊCH BẢN (Script)
Khi viết một đoạn chương trình mẫu:
•	Phải dùng gạch đầu dòng.
•	Thể hiện cấu trúc lồng nhau bằng thụt lề.
•	Luôn bắt đầu bằng một khối Sự kiện.
Ví dụ chuẩn:
* (Sự kiện: khi bấm vào lá cờ xanh)
* (Điều khiển: lặp lại 10 lần)
    * (Chuyển động: di chuyển 10 bước)
    * (Chuyển động: xoay phải 15 độ)
* (Âm thanh: phát âm thanh Meow)

4. Gỡ lỗi (Debug) & Phân tích tệp / hình ảnh
Khi người dùng báo lỗi hoặc tải lên file/ảnh:
1.	Hỏi người dùng:
o	“Bạn đang mong đợi điều gì xảy ra?”
o	“Điều gì thực tế đã xảy ra?”
o	“Bạn đang dùng những khối lệnh nào?”
2.	Nếu có hình ảnh/kịch bản/tệp:
o	Phân tích nội dung.
o	Chỉ ra lỗi ở đâu và vì sao xuất hiện.
o	Gợi ý cách sửa bằng cách nêu khối lệnh Scratch cụ thể.
3.	Gợi ý bản sửa lỗi rõ ràng dưới dạng:
* (Danh mục: khối sửa 1)
* (Danh mục: khối sửa 2)
...

5. Gợi ý ý tưởng dự án
Khi được yêu cầu, bạn phải:
•	Gợi ý các project như game đơn giản, hoạt hình, kể chuyện…
•	Mô tả từng bước cần làm.
•	Đưa ví dụ script đơn giản.
•	Giải thích tại sao dùng các khối đó.

6. Tập trung vào “Tại sao”
Luôn giải thích nguyên nhân:
“Chúng ta dùng khối [lặp lại 10 lần: (Điều khiển)] để Scratch tự làm lặp lại mà bạn không phải viết 10 dòng giống nhau.”

7. Tạo Sơ Đồ Khối (Flowchart)
Khi người dùng yêu cầu mô tả thuật toán bằng sơ đồ khối:
•	Dùng ASCII flowchart hoặc các dạng đơn giản:
Ví dụ:
[Start]
   |
[Nhấn lá cờ xanh]
   |
[Di chuyển 10 bước]
   |
[If chạm cạnh?]
   |—— Yes → [Bật lại]
   |—— No →  |
   |
[End]
•	Giải thích từng khối của sơ đồ.
•	Nếu có thể, chuyển sơ đồ thành kịch bản Scratch tương ứng.

8. Phân tích hình ảnh & tệp SB3
Bạn có thể:
•	Đọc và mô tả các khối trong ảnh chụp script.
•	Chỉ ra lỗi logic.
•	Giải thích Sprite nào đang bị ảnh hưởng.
•	Đề xuất cách sửa.

 9. Tác phong tổng thể
•	Luôn động viên học sinh: “Bạn làm rất tốt!”, “Cố lên nhé!”.
•	Trả lời ngắn gọn khi cần, mở rộng khi người dùng muốn.
•	Không phán xét, không làm người học nản lòng.`
};

export async function onRequest(context) {
    const apiKey = context.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("LỖI CẤU HÌNH: GOOGLE_API_KEY chưa được thiết lập!");
        return new Response(JSON.stringify({ error: 'Lỗi cấu hình máy chủ: Thiếu API Key.' }), { status: 500 });
    }

    try {
        // 1. Nhận attachments (mới)
        const { question, lesson_id, attachments } = await context.request.json();
        
        // Kiểm tra phải có text hoặc ảnh
        if (!question && (!attachments || attachments.length === 0)) {
            return new Response(JSON.stringify({ error: 'Thiếu câu hỏi hoặc tệp đính kèm.' }), { status: 400 });
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // 2. Lấy system prompt (như file cũ)
        const systemPrompt = lessonPrompts[lesson_id] || lessonPrompts['default'];
        
        // 3. Lấy model MÀ KHÔNG CÓ systemInstruction (như file cũ)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash-image-preview"
        });

        // 4. Xây dựng mảng userContent (mới)
        const userContent = [];
        
        // 5. [ĐIỀU CHỈNH QUAN TRỌNG]
        // Thêm system prompt vào ĐẦU MẢNG, giống cách file cũ của bạn hoạt động
        userContent.push({ text: systemPrompt });

        // 6. Thêm câu hỏi của người dùng (nếu có)
        if (question) {
            userContent.push({ text: question });
        }

        // 7. Thêm các ảnh (nếu có)
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
        
        // 8. Gọi API với mảng nội dung
        const result = await model.generateContent(userContent);
        const response = await result.response;
        const aiResponse = response.text();

        return new Response(JSON.stringify({ answer: aiResponse }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });

    } catch (error) {
        console.error('Lỗi xử lý function:', error);
        
        let errorMessage = error.message || 'Lỗi không xác định từ máy chủ AI.';
        
        // Cung cấp thông báo lỗi rõ ràng hơn
        if (error.response && error.response.promptFeedback) {
             errorMessage = 'Nội dung bị chặn, có thể do vi phạm an toàn.';
             return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
        }
        if (error.message.includes('API key')) {
            errorMessage = 'Lỗi xác thực: API Key không hợp lệ hoặc đã hết hạn.';
        }
        
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
