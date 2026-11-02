/* Module 16: Production Troubleshooting (mở rộng — dùng chính cho Round 8 của Interview Simulator) */
QB.module({
  id: 'troubleshooting', order: 16, title: 'Production Troubleshooting',
  description: 'Tình huống thực tế trong dự án Enterprise: latency, CPU, bộ nhớ, dữ liệu trùng, DB chậm, tích hợp ngoài, deploy, Spring Bean, messaging.',
  topics: ['Phương pháp điều tra sự cố', 'Latency tăng đột biến', 'CPU cao', 'Bộ nhớ và OutOfMemoryError', 'Dữ liệu trùng lặp và đồng thời',
    'Database chậm', 'Tích hợp API bên ngoài', 'Deployment và cấu hình', 'Spring Bean và khởi động', 'Messaging và Kafka'],
}, [
  {
    id: 'PRD-001', topic: 'Latency tăng đột biến', d: 'a', cat: 'scenario',
    q: 'Lúc 14:05, cảnh báo p95 latency của API `GET /orders` tăng từ 120ms lên 4s; tỷ lệ lỗi chưa tăng. Bạn là người trực sự cố. Việc nên làm **đầu tiên** là gì?',
    opts: [
      'Restart toàn bộ instance ngay lập tức',
      'Xác định phạm vi và thời điểm từ metrics/dashboard: endpoint nào, mọi instance hay một instance, có trùng thời điểm deploy/thay đổi cấu hình/traffic tăng không; xem latency của dependency (DB, cache, API ngoài) và mức sử dụng pool (DB connection, thread). Sau đó quyết định giảm thiểu (rollback, scale) trước khi tìm nguyên nhân gốc',
      'Thêm index cho mọi bảng',
      'Bật log DEBUG trên production cho mọi package',
    ], ans: 'B',
    exp: 'Điều tra có hệ thống: "cái gì thay đổi?" là câu hỏi mạnh nhất. Restart mù quáng có thể tạm che triệu chứng nhưng xóa mất bằng chứng (thread dump, heap). Bật DEBUG toàn bộ có thể làm hệ thống chậm hơn và đầy đĩa. Ưu tiên khôi phục dịch vụ (mitigation) song song với thu thập bằng chứng.',
    tags: ['incident', 'latency', 'methodology'], sec: 60,
  },
  {
    id: 'PRD-002', topic: 'CPU cao', d: 'a', cat: 'scenario',
    q: 'Ngay sau khi deploy phiên bản mới, CPU của mọi pod tăng từ 30% lên 95%, traffic không đổi. Hướng xử lý hợp lý nhất?',
    opts: [
      'Tăng gấp đôi số pod và để đó',
      'Vì trùng thời điểm deploy và traffic không đổi: cân nhắc rollback để khôi phục ngay; đồng thời thu thập bằng chứng (thread dump nhiều lần, async-profiler/JFR, GC log) trên một pod để tìm hot path — xem diff thay đổi (regex mới, vòng lặp, serialize lớn, thay đổi cấu hình cache/log, GC do tăng cấp phát bộ nhớ)',
      'Tắt GC',
      'Hạ log level xuống TRACE để biết thêm',
    ], ans: 'B',
    exp: 'Scale ngang chỉ là chữa triệu chứng và tốn chi phí khi lỗi nằm ở code. Nếu GC chiếm CPU (thread GC nóng, GC log dày đặc), vấn đề thực là bộ nhớ (cấp phát quá nhiều/leak). Profiling liên tục ở mức overhead thấp (JFR) giúp so sánh trước/sau deploy.',
    tags: ['high-cpu', 'deployment', 'profiling'], sec: 60,
  },
  {
    id: 'PRD-003', topic: 'Dữ liệu trùng lặp và đồng thời', d: 's', cat: 'scenario',
    q: 'API "tạo hồ sơ khách hàng theo số CMND" thỉnh thoảng tạo **hai bản ghi trùng** khi hai request đến gần như cùng lúc (người dùng bấm hai lần, gateway retry). Code: `if (!repo.existsByIdNumber(x)) repo.save(new Customer(x));`. Cách khắc phục triệt để?',
    opts: [
      'Thêm synchronized vào method',
      'Thêm UNIQUE constraint trên cột id_number (sau khi làm sạch dữ liệu trùng hiện có) để DB là chốt chặn cuối; xử lý vi phạm unique thành response idempotent (trả về bản ghi đã có hoặc 409); bổ sung idempotency key cho request tạo mới',
      'Disable nút bấm trên giao diện là đủ',
      'Kiểm tra trùng hai lần trước khi save',
    ], ans: 'B',
    exp: 'Check-then-act có race condition giữa nhiều thread và nhiều instance. Chặn ở UI không ngăn được retry của mạng/gateway hay client khác. Ràng buộc dữ liệu ở DB đảm bảo tính đúng đắn bất kể đường đi của request. Đừng quên kế hoạch xử lý dữ liệu trùng đã tồn tại trước khi thêm constraint.',
    tags: ['duplicate', 'race-condition', 'unique-constraint', 'idempotency'], sec: 65,
  },
  {
    id: 'PRD-004', topic: 'Bộ nhớ và OutOfMemoryError', d: 'a', cat: 'debug',
    q: 'Heap dump tại thời điểm OutOfMemoryError cho thấy 1 thread Tomcat giữ một `ArrayList` chứa 3,2 triệu `TransactionDto` (chiếm 85% heap). Stack của thread nằm trong `ReportController.exportAll()`. Nguyên nhân và cách sửa?',
    opts: [
      'Do GC lỗi; đổi sang ZGC',
      'Endpoint export tải **toàn bộ** dữ liệu vào bộ nhớ (findAll → list → DTO) trước khi ghi file. Sửa bằng xử lý theo luồng/lô: phân trang keyset hoặc Stream với fetch size, ghi dần ra output (StreamingResponseBody), giới hạn phạm vi export, hoặc chuyển thành job bất đồng bộ tạo file',
      'Tăng -Xmx lên gấp 4',
      'Đổi ArrayList thành LinkedList',
    ], ans: 'B',
    exp: 'Đây không phải memory leak mà là một request cấp phát quá nhiều (spike). Lượng dữ liệu tăng theo thời gian nên tăng heap chỉ trì hoãn. Với JPA, đọc dạng Stream cần transaction mở, fetch size phù hợp và tránh giữ entity trong persistence context (detach/clear hoặc dùng projection).',
    tags: ['oom', 'heap-dump', 'export', 'streaming'], sec: 60,
  },
  {
    id: 'PRD-005', topic: 'Database chậm', d: 'a', cat: 'debug',
    q: 'Endpoint `GET /customers/{id}/dashboard` mất 3 giây. APM (hoặc log SQL) cho thấy mỗi request thực thi 240 câu SELECT gần giống nhau, mỗi câu ~5ms. Nhận định và hướng xử lý?',
    opts: [
      'Database chậm, cần nâng cấp phần cứng',
      'Dấu hiệu N+1 (lazy loading trong vòng lặp hoặc gọi repository trong loop). Xác định association gây ra từ stack/SQL, sửa bằng fetch join/EntityGraph, truy vấn theo lô (IN), hoặc projection riêng cho dashboard; thêm kiểm thử đếm số câu SQL để chống tái diễn',
      'Tăng connection pool',
      'Thêm cache cho mọi câu SELECT',
    ], ans: 'B',
    exp: 'Từng câu SQL nhanh nhưng số lượng lớn nhân lên thời gian. Công cụ phát hiện: Hibernate statistics (`hibernate.generate_statistics`), datasource-proxy/p6spy, APM (trace thấy nhiều span JDBC lặp lại). Có thể viết test assert số câu SQL (ví dụ với datasource-proxy) cho endpoint quan trọng.',
    tags: ['n+1', 'apm', 'sql-count'], sec: 55,
  },
  {
    id: 'PRD-006', topic: 'Dữ liệu trùng lặp và đồng thời', d: 'a', cat: 'tradeoff',
    q: 'Hai nghiệp vụ cùng cập nhật số dư một bản ghi: (A) màn hình nhân viên chỉnh hạn mức tín dụng — thỉnh thoảng mới xung đột; (B) trừ điểm thưởng mỗi giao dịch — một tài khoản doanh nghiệp có hàng trăm giao dịch đồng thời mỗi giây. Lựa chọn locking phù hợp?',
    opts: [
      'Cả hai dùng optimistic locking với retry vô hạn',
      '(A) optimistic locking (@Version), báo người dùng tải lại khi xung đột; (B) cập nhật nguyên tử ở DB (`UPDATE ... SET points = points - :n WHERE id = :id AND points >= :n`) hoặc pessimistic lock ngắn — vì tranh chấp cao, optimistic sẽ retry liên tục',
      'Cả hai dùng SERIALIZABLE',
      'Không cần locking vì DB tự xử lý',
    ], ans: 'B',
    exp: 'Optimistic locking hiệu quả khi xung đột hiếm (không giữ khóa, không chặn). Khi tranh chấp cao, tỷ lệ thất bại và retry tăng vọt, lãng phí tài nguyên. Thao tác nguyên tử ở DB hoặc khóa bi quan ngắn gọn phù hợp hơn; với tải cực cao có thể gom/ghi sổ (ledger) rồi tổng hợp.',
    tags: ['optimistic-locking', 'pessimistic-locking', 'contention'], sec: 60,
  },
  {
    id: 'PRD-007', topic: 'Tích hợp API bên ngoài', d: 's', cat: 'design',
    q: 'Service tra cứu điểm tín dụng gọi API của đối tác: p50 = 400ms nhưng p99 = 8s và thỉnh thoảng timeout. API của bạn cam kết SLA p99 < 2s cho màn hình đăng ký khoản vay. Thiết kế bảo vệ nào hợp lý nhất?',
    opts: [
      'Đặt read timeout 30 giây để không bao giờ bị timeout',
      'Đặt timeout phù hợp ngân sách SLA (ví dụ ~1,5s), circuit breaker + bulkhead riêng cho đối tác, retry có giới hạn chỉ khi còn ngân sách thời gian; với kết quả không cần ngay, chuyển sang xử lý bất đồng bộ (trả trạng thái "đang thẩm định", cập nhật khi có kết quả) và cache kết quả hợp lệ trong thời hạn cho phép',
      'Retry 5 lần liên tiếp không chờ',
      'Gọi API đối tác hai lần song song và lấy kết quả nhanh hơn cho mọi request',
    ], ans: 'B',
    exp: 'Không thể đạt SLA chặt hơn dependency nếu gọi đồng bộ vô điều kiện. Cần thiết kế theo "time budget" và trải nghiệm phù hợp với nghiệp vụ. Hedged request (gửi bản sao khi request đầu chậm) là kỹ thuật hợp lệ cho thao tác idempotent, nhưng gửi đôi cho mọi request làm tăng gấp đôi tải và có thể tốn phí.',
    tags: ['external-api', 'timeout', 'sla', 'circuit-breaker'], sec: 70,
  },
  {
    id: 'PRD-008', topic: 'Dữ liệu trùng lặp và đồng thời', d: 'a', cat: 'scenario',
    q: 'Phát hiện 37 đơn hàng bị tạo trùng trong tuần qua do client retry khi timeout. Với vai trò người phụ trách, phương án xử lý **đầy đủ** nhất?',
    opts: [
      'Chỉ xóa các đơn trùng bằng SQL trực tiếp trên production',
      'Khắc phục: xác định đơn trùng theo tiêu chí rõ ràng, phối hợp nghiệp vụ hủy/hoàn tiền theo quy trình (có audit, không xóa tay). Phòng ngừa: idempotency key cho API tạo đơn + unique constraint, response cho request lặp trả lại đơn đã tạo. Phát hiện: metric/cảnh báo đơn trùng; viết postmortem',
      'Tăng timeout của client lên 5 phút',
      'Tắt retry ở mọi nơi',
    ], ans: 'B',
    exp: 'Xử lý sự cố dữ liệu gồm ba phần: sửa hậu quả (có kiểm soát, có duyệt, có backup), sửa nguyên nhân gốc, và tăng khả năng phát hiện sớm. Tắt retry đổi lỗi trùng thành lỗi mất đơn; tăng timeout chỉ giảm tần suất.',
    tags: ['duplicate-orders', 'idempotency', 'data-fix', 'postmortem'], sec: 60,
  },
  {
    id: 'PRD-009', topic: 'Deployment và cấu hình', d: 'i', cat: 'scenario',
    q: 'Sau khi deploy lên môi trường mới, ứng dụng không kết nối được database ("Connection timed out" khi khởi động). Thứ tự kiểm tra hợp lý nhất?',
    opts: [
      'Viết lại code DAO',
      'Kiểm tra URL/host/port thực tế ứng dụng đang dùng (profile, biến môi trường, secret đã được mount) → phân giải DNS và kết nối mạng từ chính container/pod (nc/telnet tới host:port) → firewall/security group/network policy → thông tin đăng nhập, SSL mode → giới hạn kết nối/trạng thái DB',
      'Tăng -Xmx',
      'Đổi sang database khác',
    ], ans: 'B',
    exp: '"Timed out" thường là vấn đề mạng (không tới được host: sai host, chặn firewall), khác với "Connection refused" (tới host nhưng không có ai lắng nghe cổng đó) hay "password authentication failed" (sai thông tin). Đọc kỹ thông điệp lỗi giúp khoanh vùng nhanh. Kiểm tra từ chính môi trường chạy ứng dụng, không phải từ máy cá nhân.',
    tags: ['database-connection', 'networking', 'deployment'], sec: 50,
  },
  {
    id: 'PRD-010', topic: 'Spring Bean và khởi động', d: 's', cat: 'debug',
    q: 'Sau khi thêm `@Async` vào một method của `ReportService`, ứng dụng không khởi động: "Bean with name \'reportService\' has been injected into other beans [exportService] in its raw version as part of a circular reference, but has eventually been wrapped". Phân tích và cách xử lý?',
    opts: [
      'Lỗi của Spring, hạ phiên bản',
      'ReportService và ExportService phụ thuộc vòng. Để giải vòng, Spring đưa tham chiếu "raw" (chưa bọc proxy) của ReportService cho ExportService sớm; nhưng @Async khiến bean cuối cùng là proxy khác, nên tham chiếu đã inject sai lệch. Cách đúng: phá vòng phụ thuộc (tách logic chung, dùng event), hoặc tạm thời inject @Lazy',
      'Xóa @EnableAsync',
      'Đổi tên bean',
    ], ans: 'B',
    exp: 'Cơ chế early reference (SmartInstantiationAwareBeanPostProcessor) xử lý được proxy của AOP thông thường (@Transactional) trong vòng phụ thuộc, nhưng `AsyncAnnotationBeanPostProcessor` bọc proxy ở giai đoạn sau nên phát sinh mâu thuẫn. Bài học chung: circular dependency là nợ thiết kế, sớm muộn sẽ gây lỗi khó hiểu.',
    tags: ['circular-dependency', 'async', 'proxy', 'startup'], sec: 75,
  },
  {
    id: 'PRD-011', topic: 'Messaging và Kafka', d: 'a', cat: 'scenario',
    q: 'Consumer lag của topic `payments` tăng liên tục từ 0 lên 2 triệu message trong 1 giờ. Bước điều tra nào phù hợp?',
    opts: [
      'Xóa topic và tạo lại',
      'Kiểm tra: tốc độ produce có tăng đột biến không; throughput và thời gian xử lý mỗi message của consumer (downstream DB/API chậm?); có rebalance liên tục, consumer bị lỗi lặp lại ở một message (poison) không; số consumer so với số partition. Sau đó mới tăng consumer/partition hoặc tối ưu xử lý',
      'Tăng retention của topic là đủ',
      'Restart broker Kafka',
    ], ans: 'B',
    exp: 'Lag tăng nghĩa là tốc độ tiêu thụ < tốc độ sản xuất. Lag chỉ tăng ở một partition gợi ý poison message hoặc phân bố key lệch (hot key); tăng đều mọi partition gợi ý downstream chậm hoặc traffic tăng. Thêm consumer vượt quá số partition không giúp gì.',
    tags: ['kafka', 'consumer-lag'], sec: 55,
  },
  {
    id: 'PRD-012', topic: 'Phương pháp điều tra sự cố', d: 's', cat: 'debug',
    q: 'Đọc trích đoạn thread dump khi service bị treo. Kết luận đúng nhất?',
    lang: 'text', code: `
"http-nio-8080-exec-1" ... WAITING (parking)
   at java.util.concurrent.locks.LockSupport.parkNanos
   at com.zaxxer.hikari.util.ConcurrentBag.borrow
   at com.zaxxer.hikari.pool.HikariPool.getConnection
   ...  (giống hệt cho ~190 thread http-nio-8080-exec-*)

"http-nio-8080-exec-77" ... RUNNABLE
   at java.net.SocketInputStream.socketRead0
   at org.apache.http.impl.io.SessionInputBufferImpl.fillBuffer
   at com.acme.partner.ShippingClient.createShipment
   at com.acme.order.OrderService.confirm        <-- @Transactional
   ...  (10 thread tương tự; pool Hikari max = 10)`,
    opts: [
      'Database bị deadlock',
      '10 thread đang giữ toàn bộ 10 connection DB (do đang ở trong method @Transactional) trong khi chờ API vận chuyển trả lời; ~190 thread khác chờ lấy connection. Nguyên nhân gốc: gọi HTTP chậm (có thể thiếu timeout) bên trong transaction. Sửa: đưa lời gọi ngoài ra khỏi transaction, đặt timeout, circuit breaker',
      'Tomcat có quá ít thread',
      'Do GC pause',
    ], ans: 'B',
    exp: 'Mẫu điển hình: "nhiều thread WAITING ở getConnection + vài thread giữ connection nhưng làm việc khác". Tăng pool chỉ dời điểm nghẽn. Đọc thread dump theo nhóm stack giống nhau (công cụ như fastThread giúp gom nhóm) là kỹ năng quan trọng khi xử lý sự cố.',
    tags: ['thread-dump', 'hikaricp', 'transaction', 'external-call'], sec: 80,
  },
  {
    id: 'PRD-013', topic: 'Phương pháp điều tra sự cố', d: 'i', cat: 'theory',
    q: 'Sự cố production gây lỗi 30% request thanh toán sau một lần deploy 10 phút trước. Trình tự xử lý phù hợp nhất với vai trò kỹ sư trực?',
    opts: [
      'Tìm ra nguyên nhân gốc chính xác rồi mới làm gì tiếp',
      'Thông báo sự cố cho các bên liên quan → giảm thiểu ảnh hưởng nhanh nhất (rollback bản deploy, tắt feature flag) → xác nhận hệ thống ổn định → thu thập bằng chứng và tìm nguyên nhân gốc → viết postmortem không đổ lỗi (blameless) với hành động phòng ngừa',
      'Sửa code trực tiếp trên server production',
      'Chờ người dùng báo cáo thêm để chắc chắn',
    ], ans: 'B',
    exp: 'Ưu tiên khôi phục dịch vụ (giảm MTTR) trước khi điều tra sâu — đặc biệt khi có thay đổi gần đây rõ ràng. Postmortem tập trung vào hệ thống và quy trình (vì sao test/monitoring không phát hiện) thay vì cá nhân. Sửa nóng trên server phá vỡ tính truy vết và có thể bị ghi đè ở lần deploy sau.',
    tags: ['incident-response', 'rollback', 'postmortem'], sec: 45,
  },
  {
    id: 'PRD-014', topic: 'Latency tăng đột biến', d: 'a', cat: 'debug',
    q: 'Client nhận lỗi `504 Gateway Timeout` ngắt quãng. Log gateway ghi thời lượng các request lỗi đều đúng ~30 giây; log ứng dụng cho thấy những request đó vẫn xử lý thành công sau 40–50 giây và commit đơn hàng. Vấn đề là gì?',
    opts: [
      'Ứng dụng bị lỗi 500',
      'Timeout không đồng bộ giữa các tầng: gateway bỏ cuộc sau 30s trong khi ứng dụng tiếp tục xử lý; client tưởng thất bại (và có thể retry → trùng đơn) dù dữ liệu đã được ghi. Cần: tối ưu thao tác chậm hoặc chuyển sang bất đồng bộ, đặt timeout tầng trong nhỏ hơn tầng ngoài, và idempotency để retry an toàn',
      'Gateway bị quá tải CPU',
      'Lỗi DNS',
    ], ans: 'B',
    exp: 'Một con số "tròn" lặp lại (30s, 60s) trong log lỗi thường là dấu hiệu chạm timeout cấu hình ở đâu đó. Kết quả "không rõ" (unknown outcome) là trạng thái nguy hiểm nhất trong hệ phân tán — idempotency và API trạng thái giúp client xác minh lại.',
    tags: ['504', 'timeout-mismatch', 'gateway'], sec: 60,
  },
  {
    id: 'PRD-015', topic: 'Deployment và cấu hình', d: 'i', cat: 'debug',
    q: 'Sau khi chuyển ứng dụng từ server truyền thống (múi giờ Asia/Ho_Chi_Minh) sang container, báo cáo doanh thu "theo ngày" bị lệch: giao dịch lúc 0h–7h sáng bị tính vào ngày hôm trước. Nguyên nhân khả dĩ nhất?',
    opts: [
      'Database bị mất dữ liệu',
      'Container mặc định dùng múi giờ UTC; code dùng `LocalDate.now()`/`ZoneId.systemDefault()` (hoặc session DB theo múi giờ JVM) để xác định ranh giới ngày. Nên lưu thời điểm dạng UTC (Instant/timestamptz) và chuyển đổi tường minh theo múi giờ nghiệp vụ (`ZoneId.of("Asia/Ho_Chi_Minh")`) khi tính "ngày"',
      'Do Docker chạy chậm 7 giờ',
      'Do thiếu index trên cột ngày',
    ], ans: 'B',
    exp: 'Phụ thuộc ngầm vào múi giờ hệ thống là lỗi kinh điển khi đổi hạ tầng. Đặt `TZ` cho container chỉ là chữa cháy; code nên nêu rõ múi giờ nghiệp vụ. Cũng chú ý `hibernate.jdbc.time_zone` và kiểu cột (timestamp with/without time zone).',
    tags: ['timezone', 'container', 'java-time'], sec: 50,
  },
  {
    id: 'PRD-016', topic: 'Deployment và cấu hình', d: 'a', cat: 'debug',
    q: 'Pod mới khởi động bị treo ở bước migration, log lặp lại "Waiting for changelog lock..." (Liquibase). Lần deploy trước, một pod bị kill giữa lúc đang chạy migration. Nguyên nhân và cách xử lý?',
    opts: [
      'Database bị hỏng, cần restore',
      'Liquibase dùng bảng `DATABASECHANGELOGLOCK` để đảm bảo chỉ một instance migrate; pod bị kill không kịp giải phóng khóa. Xác nhận không có tiến trình migration nào đang chạy, kiểm tra trạng thái schema, rồi giải phóng khóa (`liquibase releaseLocks` hoặc cập nhật bảng lock); cân nhắc chạy migration như một job riêng trước khi rollout',
      'Tăng số pod để một pod khác lấy được khóa',
      'Xóa bảng DATABASECHANGELOG',
    ], ans: 'B',
    exp: 'Flyway dùng cơ chế khóa của DB (advisory lock trên PostgreSQL) nên ít gặp lỗi kẹt khóa hơn, nhưng vẫn có thể gặp migration dở dang. Tách migration khỏi quá trình khởi động ứng dụng (init container/job) giúp kiểm soát tốt hơn và tránh nhiều pod cùng chờ. Xóa DATABASECHANGELOG sẽ khiến Liquibase chạy lại mọi migration.',
    tags: ['liquibase', 'migration', 'lock', 'deployment'], sec: 55,
  },
  {
    id: 'PRD-017', topic: 'Deployment và cấu hình', d: 'a', cat: 'debug',
    q: 'Sau khi scale auth-service từ 1 lên 3 instance, người dùng bị lỗi 401 ngẫu nhiên dù vừa đăng nhập thành công. Mỗi instance tạo khóa ký JWT ngẫu nhiên khi khởi động. Giải thích?',
    opts: [
      'Do token hết hạn quá nhanh',
      'Token do instance A ký không xác minh được ở instance B/C vì mỗi instance có khóa riêng; load balancer phân phối request ngẫu nhiên. Cần khóa ký dùng chung được quản lý tập trung (secret manager) hoặc cặp khóa bất đối xứng với JWKS, có quy trình xoay vòng khóa (kid)',
      'Do thiếu sticky session',
      'Do CORS',
    ], ans: 'B',
    exp: 'Trạng thái "ẩn" sinh lúc khởi động (khóa, cache, ID generator) làm hỏng tính stateless khi scale. Sticky session chỉ che giấu vấn đề và vẫn lỗi khi instance bị thay thế (mọi token do instance cũ ký mất hiệu lực).',
    tags: ['jwt', 'scaling', 'signing-key', 'stateless'], sec: 50,
  },
  {
    id: 'PRD-018', topic: 'Database chậm', d: 's', cat: 'debug',
    q: 'Một truy vấn báo cáo chạy 200ms trên staging nhưng 25 giây trên production với cùng câu SQL và cùng index. Những nguyên nhân nào cần kiểm tra?',
    opts: [
      'Chắc chắn do mạng production chậm',
      'Khác biệt dữ liệu và thống kê: khối lượng/phân bố dữ liệu khác (độ chọn lọc khác khiến optimizer chọn plan khác), thống kê lỗi thời (cần ANALYZE/gather stats), plan khác do giá trị bind cụ thể (bind peeking/generic plan), tranh chấp khóa hoặc tải đồng thời. Lấy execution plan **thực tế** trên production để so sánh',
      'Do staging dùng SSD',
      'Do JDBC driver khác phiên bản là nguyên nhân duy nhất',
    ], ans: 'B',
    exp: 'Execution plan phụ thuộc thống kê và tham số. Staging thường có ít dữ liệu nên mọi plan đều nhanh. Trên PostgreSQL dùng `EXPLAIN (ANALYZE, BUFFERS)`, `auto_explain`, `pg_stat_statements`; trên Oracle dùng AWR/SQL Monitor, `DBMS_XPLAN.DISPLAY_CURSOR`. Cẩn thận khi chạy EXPLAIN ANALYZE với câu lệnh ghi (nó thực thi thật).',
    tags: ['slow-query', 'execution-plan', 'statistics'], sec: 65,
  },
]);
