# Java Backend Mastery

Website ôn luyện kiến thức **Java Backend Developer** từ cơ bản đến nâng cao, phục vụ chuẩn bị phỏng vấn ở mức ~5 năm kinh nghiệm (Java 8+, Spring Boot, Oracle/PostgreSQL, xử lý sự cố production).

- HTML5 + CSS3 + JavaScript thuần (ES6+), **không cần backend, không cần cài đặt**.
- Dữ liệu cá nhân lưu trong `localStorage` của trình duyệt.
- Giao diện tiếng Việt, giữ nguyên thuật ngữ kỹ thuật tiếng Anh.

## 1. Cách chạy

Chọn một trong các cách:

1. **Mở trực tiếp** file `index.html` bằng trình duyệt (Chrome, Edge, Firefox).
2. **VS Code Live Server**: chuột phải `index.html` → *Open with Live Server*.
3. **Node.js** (không cần cài gói nào):

   ```bash
   node tools/serve.js
   ```

   rồi mở http://localhost:5500

> Lưu ý: `localStorage` gắn với origin. Dữ liệu khi mở bằng `file://` và khi mở bằng `http://localhost` là hai kho riêng — dùng Export/Import để chuyển.

## 2. Cấu trúc thư mục

```
java-backend-mastery/
├── index.html              # khung trang, sidebar, nạp script theo thứ tự
├── css/style.css           # theme Light/Dark (CSS variables), responsive
├── js/
│   ├── bank.js             # QB: đăng ký module & chuẩn hóa câu hỏi (phải nạp trước data/)
│   ├── lessons.js          # LS: kho bài học lý thuyết + renderer
│   ├── ui.js               # escape HTML, syntax highlight Java/SQL/JSON/YAML, toast, modal
│   ├── storage.js          # localStorage có version, sanitize, import/export
│   ├── progress.js         # ghi nhận kết quả, spaced repetition, thống kê
│   ├── quiz.js             # bộ máy làm bài (practice/exam), timer, kết quả
│   ├── interview.js        # Interview Simulator 8 vòng
│   └── app.js              # router (hash) và các tab
├── data/                   # ngân hàng câu hỏi, mỗi module một file
│   ├── java-core.js … devops-git-linux.js
│   ├── troubleshooting.js  # module bổ sung: Production Troubleshooting
│   └── lessons/            # bài học lý thuyết, mỗi module một file (268 bài)
└── tools/
    ├── test.js             # bộ test logic (62 test): chấm điểm, lưu trữ, ôn tập, Interview, Import/Export, bài học
    ├── validate.js         # kiểm tra chất lượng cấu trúc ngân hàng câu hỏi
    └── serve.js            # static server tối giản
```

Kiểm tra nhanh trước khi commit/thay đổi dữ liệu:

```bash
node tools/test.js
```

```bash
node tools/validate.js
```

## 3. Tính năng

### Đã hoàn thành

| Tab | Nội dung |
|---|---|
| **Dashboard** | Tổng câu, lượt đã làm, đúng/sai, tỷ lệ chính xác, chưa học, cần ôn, điểm thi gần nhất/trung bình, tiến độ theo module, chủ đề sai nhiều nhất, câu sai gần đây; nút Tiếp tục học / Thi nhanh / Ôn câu sai. Khi chưa có dữ liệu hiển thị trạng thái bắt đầu (không số liệu giả). |
| **Học lý thuyết** | Bài học cho **toàn bộ 268 topic** của 16 module (~26.000 từ): giải thích cơ chế, bảng so sánh, ví dụ code, khung "Lưu ý" (lỗi thường gặp) và "Phỏng vấn" (gợi ý trả lời). Mục lục theo module, đánh dấu đã đọc (lưu localStorage, có trong Export/Import), nút "Đọc bài tiếp theo", tìm kiếm trong nội dung bài học, luyện ngay các câu hỏi của topic vừa đọc. Phần giải thích đáp án ở mọi bài làm có link **📖 Đọc bài học** tới đúng topic. |
| **Learning Path** | 16 module theo lộ trình, mỗi topic hiển thị số câu đã làm/tổng; bấm topic để luyện riêng; nút học module, thi 20 câu, xem câu hỏi. |
| **Theory Quiz** | Chọn module, topic, độ khó (Beginner/Intermediate/Advanced/Senior Interview), số câu (10/20/30/50/toàn bộ), thời gian, chế độ luyện tập/thi, lấy hoặc bỏ câu đã làm, ưu tiên câu sai. |
| **Interview Simulator** | 8 vòng (Java Core → Production Troubleshooting), 4 cấp độ (Junior, Middle, Senior, Senior Enterprise), 30/45/60 phút; chọn câu theo trọng số độ khó và thời gian dự kiến; kết quả theo vòng, theo chủ đề, kiến thức yếu, gợi ý học tiếp, kèm lưu ý đây là công cụ tự đánh giá. |
| **Code Challenge** | Lọc các câu có code/bảng dữ liệu theo dạng bài (dự đoán output, lỗi compile/runtime, bug logic, SQL, tìm nguyên nhân lỗi, hiệu năng…) và module. Không thực thi code (không dùng `eval`). |
| **Review Mistakes** | Tự lưu câu sai (và câu bạn tự đánh dấu "cần ôn tập"), số lần sai, số lần đúng sau khi ôn, lần trả lời gần nhất, lịch sử lựa chọn; lọc theo module/topic/độ khó/số lần sai/trạng thái; đánh dấu đã nắm vững; luyện câu đến hạn, câu sai, câu đã bookmark. |
| **Spaced Repetition** | Sai → đến hạn ngay. Đúng khi đang trong lịch → giãn theo mốc 1, 3, 7, 14, 30 ngày (chỉnh được trong Cài đặt). Badge số câu đến hạn ở sidebar. |
| **Bookmarks & Notes** | Yêu thích, ghi chú theo câu (hiện khi làm bài), tìm kiếm cả trong ghi chú, lọc module/độ khó, luyện các câu đã đánh dấu. |
| **Ngân hàng câu hỏi** | Tìm kiếm trên câu hỏi, code, lựa chọn, giải thích, tag; lọc kết hợp (AND) theo module, topic, độ khó, loại, trạng thái (đã làm, chưa làm, từng sai, yêu thích, cần ôn); phân trang; luyện tập từ kết quả lọc. Ô tìm kiếm toàn cục ở topbar (phím `/`). |
| **Progress & Analytics** | Tổng lượt, câu duy nhất, độ chính xác theo module/độ khó, biểu đồ điểm thi theo thời gian, chủ đề sai nhiều, chủ đề đang cải thiện, lịch sử phiên làm bài. |
| **Cài đặt & Dữ liệu** | Light/Dark/theo hệ thống, hiển thị ghi chú khi thi, lịch ôn tập, Export/Import JSON (có kiểm tra định dạng), Reset có xác nhận, bảng số lượng câu hỏi thực tế. |

**Bộ máy làm bài**

- *Luyện tập*: kiểm tra ngay, hiện đáp án đúng, giải thích, giải thích từng lựa chọn (khi có), đánh dấu cần ôn tập, quay lại câu trước.
- *Thi*: không lộ đáp án trước khi nộp, đồng hồ đếm ngược, thanh tiến độ, bảng điều hướng câu, đánh dấu xem lại, nộp sớm, **tự nộp khi hết giờ** — kể cả khi hết giờ trong lúc đóng/tải lại trang.
- *Chống lỗi*: câu một đáp án chỉ giữ một lựa chọn; câu nhiều đáp án giới hạn đúng số lựa chọn và chỉ đúng khi khớp hoàn toàn (không chấm điểm từng phần); câu bỏ trống không tính đúng; mỗi câu chỉ ghi nhận một lần mỗi phiên; kết quả đã nộp là chỉ đọc; phiên đang làm được lưu sau mỗi thao tác nên tải lại trang không mất bài.
- *Bàn phím*: `1–8` / `A–H` chọn đáp án, `Enter` kiểm tra/câu tiếp, `←` `→` chuyển câu, `F` đánh dấu (thi), `Shift+B` yêu thích, `/` tìm kiếm.
- Thứ tự lựa chọn được **hoán vị xác định theo ID** khi tải để đáp án đúng phân bố đều A/B/C/D (không bị lệch về B).

### Trạng thái triển khai (rà soát ngày 02/11/2026)

**Hoạt động thực sự (đã kiểm tra luồng sử dụng):** tất cả 10 tab ở bảng trên, bộ máy làm bài practice/exam, chấm điểm, lưu tiến độ, spaced repetition, Interview Simulator, Code Challenge, Dashboard/Analytics, Bookmarks & Notes, tìm kiếm/lọc, Import/Export/Reset, Light/Dark, responsive. Không có nút hay tab nào chỉ mang tính trang trí.

**Chưa triển khai / giới hạn đã biết:**

- Chưa có câu hỏi tự luận hay live coding — mọi câu đều trắc nghiệm theo yêu cầu phiên bản đầu.
- Dữ liệu chỉ lưu trên một trình duyệt; đồng bộ nhiều thiết bị phải dùng Export/Import thủ công.
- Không có bộ test tự động cho giao diện (UI). Logic cốt lõi có `tools/test.js`; luồng giao diện được kiểm thử bằng trình duyệt (mục 7), chưa tự động hóa.
- Ngân hàng phủ 100% topic nhưng **nhiều topic mới có 1 câu** (112/268 topic có đúng 1 câu). Nên bổ sung dần theo mục 5.
- Thay đổi khoảng ôn tập trong Cài đặt chỉ áp dụng cho các lần trả lời sau, không tính lại lịch đã có.
- Số câu dự kiến hiển thị ở trang thiết lập Interview là ước lượng (mỗi lần bắt đầu chọn ngẫu nhiên lại).
- Spring Boot 3.4+/Java 21+ thay đổi nhanh: các câu có trường `ver` cần rà soát khi có phiên bản mới.

## 4. Ngân hàng câu hỏi — số lượng thực tế

Tổng: **477 câu**, 16 module, phủ **100% topic** đã khai báo (268 topic; 112 topic mới có 1 câu). Số liệu sinh bởi `node tools/validate.js`:

| # | Module | Beginner | Intermediate | Advanced | Senior | Tổng |
|---|---|---:|---:|---:|---:|---:|
| 1 | Java Core | 16 | 32 | 8 | 0 | 56 |
| 2 | Object-Oriented Programming | 6 | 13 | 6 | 0 | 25 |
| 3 | Collections Framework | 5 | 13 | 6 | 2 | 26 |
| 4 | JVM và Memory Management | 3 | 10 | 8 | 4 | 25 |
| 5 | Multithreading và Concurrency | 2 | 16 | 11 | 4 | 33 |
| 6 | Spring Framework | 5 | 13 | 10 | 3 | 31 |
| 7 | Spring Boot | 5 | 17 | 7 | 1 | 30 |
| 8 | Database và SQL | 7 | 21 | 13 | 5 | 46 |
| 9 | Hibernate và JPA | 3 | 18 | 12 | 5 | 38 |
| 10 | REST API và Web | 7 | 15 | 6 | 4 | 32 |
| 11 | Spring Security | 0 | 10 | 9 | 2 | 21 |
| 12 | Testing | 4 | 15 | 5 | 1 | 25 |
| 13 | Microservices và Messaging | 0 | 12 | 10 | 4 | 26 |
| 14 | System Design và Backend Architecture | 2 | 8 | 11 | 4 | 25 |
| 15 | Git, Linux, Docker và CI/CD | 5 | 12 | 2 | 1 | 20 |
| 16 | Production Troubleshooting | 0 | 3 | 10 | 5 | 18 |
| | **Tổng** | **70** | **228** | **134** | **45** | **477** |

Theo loại: lý thuyết 139, chọn thiết kế 70, tìm nguyên nhân lỗi 62, dự đoán output 52, bug logic 35, tình huống thực tế 32, trade-off 26, hiệu năng 24, lỗi runtime 14, SQL 14, lỗi compile 9. Có 140 câu kèm code hoặc bảng dữ liệu; 10 câu nhiều đáp án.

Câu SQL dự đoán kết quả luôn kèm bảng dữ liệu mẫu (`departments`, `employees`, …). Câu phụ thuộc phiên bản ghi rõ phạm vi (`Java 16+`, `Spring Boot 3.0+`, `Oracle 12c+`…).

## 5. Thêm module và câu hỏi

### Thêm câu hỏi

Mở file module trong `data/` và thêm object vào mảng. Định dạng rút gọn (được `js/bank.js` chuẩn hóa về schema đầy đủ):

```js
{
  id: 'JC-053',                       // duy nhất, dạng PREFIX-000
  topic: 'Stream API',                // phải nằm trong topics của module
  d: 'i',                             // b | i | a | s  (Beginner, Intermediate, Advanced, Senior Interview)
  cat: 'output',                      // theory | output | compile | runtime | bug | sql | scenario | design | debug | perf | tradeoff
  q: 'Kết quả in ra là gì?',          // hỗ trợ `inline code` và **đậm**
  lang: 'java',                       // java | sql | json | yaml | bash | dockerfile | text (mặc định java khi có code)
  code: `
List<Integer> xs = List.of(1, 2, 3);
System.out.println(xs.stream().mapToInt(i -> i).sum());`,
  tables: [{ name: 'orders', columns: ['id', 'total'], rows: [[1, 100], [2, null]] }], // tùy chọn, null hiển thị NULL
  opts: ['6', '123', 'Compilation error', 'Ném exception'],
  ans: 'A',                           // hoặc ['A', 'C'] cho câu nhiều đáp án (type tự suy ra là multiple)
  exp: 'Giải thích vì sao đúng, cơ chế bên dưới…',
  why: { B: 'Vì sao B sai…' },        // tùy chọn: giải thích từng lựa chọn
  tags: ['stream'],
  sec: 45,                            // thời gian dự kiến (giây), dùng cho Interview Simulator
  ver: 'Java 8+',                     // phạm vi phiên bản nếu ảnh hưởng đáp án
  // fixed: true                      // giữ nguyên thứ tự lựa chọn (khi lựa chọn có thứ tự như (1)…(4))
}
```

Quy tắc:

- `ans` và `why` dùng letter theo **thứ tự trong file**; khi tải, lựa chọn được hoán vị và letter được ánh xạ tự động. Vì vậy **không viết "đáp án B" trong `exp`** — hãy nói về nội dung (validator sẽ cảnh báo).
- Trong template literal (`` ` ``), viết `\\n` nếu muốn hiển thị chuỗi `\n` trong code Java.
- Không thêm câu chỉ khác vài từ so với câu đã có; mỗi câu cần mục tiêu kiểm tra rõ ràng và đủ ngữ cảnh.

Sau khi thêm, chạy:

```bash
node tools/validate.js
```

Script báo lỗi nếu: trùng ID, thiếu đáp án/giải thích, đáp án không có trong lựa chọn, câu single có nhiều đáp án, trùng nội dung lựa chọn, topic không thuộc module, bảng sai số cột, câu hỏi trùng nội dung; đồng thời in thống kê số lượng để cập nhật README.

### Thêm module mới

1. Tạo `data/<module>.js`:

   ```js
   QB.module({
     id: 'kotlin', order: 17, title: 'Kotlin cho Backend',
     description: '…',
     topics: ['Null Safety', 'Coroutines'],
   }, [ /* câu hỏi */ ]);
   ```

2. Thêm `<script src="data/<module>.js"></script>` vào `index.html` (sau `js/bank.js`, trước `js/ui.js`).
3. Nếu muốn module xuất hiện trong Interview Simulator, thêm điều kiện vào `ROUNDS` trong `js/interview.js`.
4. Viết bài học cho **mọi topic** trong `data/lessons/<module>.js` và thêm script tag tương ứng (validator báo lỗi nếu topic nào thiếu bài).

### Viết bài học lý thuyết

Mỗi topic một bài, tên topic phải trùng tuyệt đối với `topics` của module:

```js
(() => {
  const L = (topic, blocks) => LS.add('kotlin', topic, blocks);
  L('Null Safety', [
    'Đoạn văn, hỗ trợ `inline code` và **đậm**.',
    '## Tiêu đề nhỏ',
    '- Bullet (các dòng liên tiếp gộp thành một danh sách)',
    { lang: 'kotlin', code: `val name: String? = null` },
    { table: [['Cột 1', 'Cột 2'], ['a', 'b']] },
    '! Lưu ý / lỗi thường gặp',
    '? Gợi ý trả lời phỏng vấn',
  ]);
})();
```

Chuỗi dùng nháy đơn — nhớ escape `\'` nếu nội dung có dấu nháy đơn (ví dụ `'PAID'` trong SQL). Validator yêu cầu mỗi bài ≥ 50 từ.

## 6. Mô hình dữ liệu lưu trữ

Key `jbm.data` trong localStorage (schema `version: 1`):

```
settings      { theme, srsIntervals[], showNotesInQuiz }
progress      { [questionId]: { attempts, correct, wrong, correctAfterWrong, firstAnswered,
                                lastAnswered, lastResult, history[{t, sel[], ok}] (≤20), mastered, srs{level, due} } }
bookmarks     { [questionId]: timestamp }
notes         { [questionId]: { text, updatedAt } }
lessons       { "moduleId::topic": timestamp đã đọc }
sessions      [ { id, kind, mode, title, startedAt, finishedAt, auto, durationSec, total, correct, wrong,
                  unanswered, score, questionIds, answers, flagged, meta, byModule, byTopic, byRound } ] (≤200)
activeSession { …phiên đang làm, deadline, index, answers, checked, flagged }
```

- Thiếu dữ liệu → dùng mặc định; trường sai kiểu bị bỏ qua; dữ liệu cũ thiếu trường được bổ sung.
- JSON hỏng → khởi tạo lại và sao lưu bản cũ vào `jbm.data.corrupt.<timestamp>`.
- Import kiểm tra `app`, `version`, kiểu dữ liệu trước khi thay thế; luôn hỏi xác nhận.
- Không lưu thông tin xác thực hay dữ liệu nhạy cảm.

## 7. Kết quả kiểm thử (02/11/2026)

Kiểm thử trên trình duyệt Chromium qua `node tools/serve.js`:

| # | Hạng mục | Kết quả |
|---|---|---|
| 1 | Mở website không lỗi JavaScript | ✅ Console không có lỗi |
| 2 | Chuyển đổi 10 tab | ✅ Không tab nào lỗi render |
| 3 | Tìm kiếm | ✅ Tìm theo nội dung, tag, giải thích (ví dụ "hashcode" → 12 câu) |
| 4 | Lọc kết hợp | ✅ module + độ khó + từ khóa + trạng thái cho đúng số lượng mong đợi |
| 5 | Chọn đáp án & tính điểm | ✅ Luyện tập và thi chấm đúng; Interview 15/48 → 31 điểm |
| 6 | Chế độ thi không lộ đáp án | ✅ Không có class đúng/sai hay giải thích trước khi nộp |
| 7 | Hết thời gian | ✅ Tự nộp khi đang mở trang và khi mở lại trang sau hạn |
| 8 | Lưu câu sai | ✅ Xuất hiện ở Review Mistakes, badge đến hạn cập nhật |
| 9 | Giữ dữ liệu sau tải lại | ✅ Phiên đang làm, tiến độ, lịch sử còn nguyên |
| 10 | Dashboard tính đúng | ✅ Đối chiếu tay (ví dụ TB thi (0+0+31)/3 = 10) |
| 11 | Import/Export JSON | ✅ Round-trip; từ chối JSON hỏng, sai `app`, version không hỗ trợ; dữ liệu thiếu trường được bổ sung |
| 12 | Reset có xác nhận | ✅ Hủy xác nhận thì dữ liệu giữ nguyên |
| 13 | Không trùng ID | ✅ `validate.js` |
| 14 | Không thiếu đáp án/giải thích | ✅ `validate.js` |
| 15 | Chấm câu nhiều đáp án | ✅ Đủ & đúng → đúng; thiếu, thừa, lẫn đáp án sai → sai; bỏ trống → không tính |
| 16 | Câu SQL có dữ liệu đầu vào | ✅ Các câu dự đoán kết quả có bảng mẫu |
| 17 | Phiên bản Java/Spring | ✅ Rà soát thủ công, ghi `ver` khi ảnh hưởng đáp án |
| 18 | Responsive | ✅ 375px: sidebar dạng drawer, card câu hỏi không tràn, code block cuộn ngang; Light/Dark đều hiển thị tốt |

### Đợt 3 — Tab Học lý thuyết (02/11/2026)

- `node tools/test.js`: **62/62 pass** (thêm 4 test: đủ bài cho 268 topic, renderer escape HTML và gộp bullet đúng, render toàn bộ 268 bài không lỗi, lưu/sanitize/import trạng thái đã đọc).
- `node tools/validate.js`: 268/268 topic có bài, mỗi bài ≥ 50 từ, bảng đúng số cột, không có bài thừa/sai tên topic.
- Trình duyệt: "Đọc bài tiếp theo" mở đúng bài chưa đọc đầu tiên; đánh dấu đã đọc cập nhật mục lục và tiến độ; tìm "skip locked" trả 3 bài liên quan; "Luyện câu về topic này" tạo phiên chỉ gồm câu của topic; link "📖 Đọc bài học" trong phần giải thích mở đúng topic; bố cục 2 cột với mục lục dính ở màn hình rộng, 1 cột không tràn ngang ở 375px; tải mới không có tài nguyên lỗi.
- Giới hạn: bài học là bản tóm tắt định hướng phỏng vấn (khoảng 60–200 từ mỗi bài), không thay thế tài liệu chính thức; chưa có tìm kiếm bài học từ ô tìm kiếm toàn cục (ô đó tìm câu hỏi).

### Đợt rà soát 2 (02/11/2026)

**Test tự động** — `node tools/test.js`: **58/58 pass**, gồm 8 nhóm: chuẩn hóa ngân hàng (hoán vị lựa chọn giữ đúng nội dung đáp án và giải thích từng lựa chọn), chấm điểm (single/multi/bỏ trống/lặp/ID lạ), Storage (rỗng, hỏng, thiếu trường), Progress & spaced repetition (mốc 1→3→…→30 ngày, nắm vững, lịch sử ≤ 20), kết thúc phiên (điểm, không ghi trùng, kết quả bất biến, hết giờ), Interview (12 tổ hợp cấp độ × thời lượng), Code Challenge/lọc, Import/Export.

**Kiểm thử luồng trên giao diện:** Interview Senior Enterprise 30 phút qua các nút (1 đúng, 1 sai, 24 bỏ trống → 4 điểm, đủ 8 vòng), Code Challenge chế độ thi lọc SQL (timer = tổng thời gian dự kiến + 2 phút), Dashboard đối chiếu với `Progress.summary()`, Import/Export bằng chính nút trên trang Cài đặt (file hợp lệ khôi phục đủ dữ liệu; file sai bị từ chối, dữ liệu hiện tại giữ nguyên).

**Lỗi tìm thấy và đã sửa trong đợt này:**

| Lỗi | Ảnh hưởng | Sửa |
|---|---|---|
| Router không gỡ `onclick/onchange` của view trước | Đang làm bài, sửa ghi chú rồi rời ô nhập → màn hình bị thay bằng trang cấu hình Theory Quiz | Gỡ handler trước khi render view mới (`js/app.js`) |
| Câu tự đánh dấu "cần ôn tập" (chưa từng sai) không hiện trong Review Mistakes | Đếm vào "đến hạn" nhưng không thấy trong danh sách | Thêm `Progress.reviewIds()` và dùng cho Review/Dashboard |
| Danh sách câu trùng ID bị tính nhiều lần | Một câu có thể được chấm/ghi tiến độ nhiều lần trong một phiên | Khử trùng khi tạo phiên và khi chấm |
| Kết quả đã nộp dùng chung object `answers` với phiên | Có thể bị sửa gián tiếp sau khi nộp | Lưu bản sao độc lập |
| Hết giờ khi hộp thoại "Nộp bài?" đang mở | Hộp thoại còn treo trên trang kết quả | Đóng hộp thoại khi tự nộp |
| 2 giải thích tham chiếu "đáp án D"/"Cách A" theo vị trí | Sai sau khi lựa chọn được hoán vị | Viết lại theo nội dung; validator kiểm tra thêm mẫu "Cách X" |

Bổ sung 42 câu hỏi (435 → 477) cho các topic phỏng vấn trọng tâm còn mỏng: volatile, Atomic, Virtual Threads (pinning), Future timeout, race condition, class loading, String Pool, WeakHashMap, clone, reflection, charset I/O, labeled loop, DI với List, Lombok constructor, xung đột tên bean, Actuator health, ConfigurationProperties, BOM, GROUP BY với NULL, covering index, ACID, FOR UPDATE NOWAIT/SKIP LOCKED, Slice vs Page, cascade transient, JPQL constructor, `@Enumerated` ORDINAL, Many-to-Many bag, idempotency của PUT, timeout, 429, preflight, JWT algorithm confusion, CSRF cho SPA, role hierarchy, mock vs spy, Testcontainers dùng chung, transaction với RANDOM_PORT, RabbitMQ ack/DLQ, Kafka acks, zero trust ở gateway.

### Đợt rà soát 1

Các lỗi phát hiện và đã sửa: đáp án đúng bị lệch về B (thêm hoán vị lựa chọn), thanh tiến độ co lại trong card hẹp, card câu hỏi tràn ngang trên mobile, nền code block bị tô theo dòng, icon sidebar xuống dòng, trang không cuộn về đầu khi đổi tab, ngân sách thời gian Interview hơi vượt.

> Điểm trắc nghiệm là công cụ **tự đánh giá kiến thức**, không phản ánh đầy đủ năng lực trong phỏng vấn thực tế.
