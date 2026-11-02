/* Bài học — Module 16: Production Troubleshooting */
(() => {
  const L = (topic, blocks) => LS.add('troubleshooting', topic, blocks);

  L('Phương pháp điều tra sự cố', [
    '## Trình tự khi trực sự cố',
    '- **Phát hiện & thông báo**: xác nhận cảnh báo, thông báo các bên liên quan, chỉ định người điều phối.',
    '- **Khoanh vùng**: endpoint nào, mọi instance hay một, bắt đầu khi nào, **cái gì vừa thay đổi** (deploy, cấu hình, traffic, dữ liệu, dependency)?',
    '- **Giảm thiểu trước**: rollback, tắt feature flag, scale, chuyển traffic — khôi phục dịch vụ quan trọng hơn tìm nguyên nhân ngay.',
    '- **Thu thập bằng chứng** trước khi restart: thread dump, heap dump, log, metrics.',
    '- **Tìm nguyên nhân gốc** (5 Whys), sửa, xác minh.',
    '- **Postmortem không đổ lỗi**: timeline, tác động, nguyên nhân, hành động phòng ngừa (test, cảnh báo, quy trình).',
    '## Đọc thread dump',
    '- Gom các thread theo stack giống nhau: nhiều thread WAITING ở `HikariPool.getConnection` + vài thread giữ connection đang chờ `SocketInputStream.read` → gọi HTTP chậm trong transaction.',
    '? Khi phỏng vấn, mô tả theo cấu trúc: triệu chứng → giả thuyết → bằng chứng kiểm chứng → hành động → phòng ngừa.',
  ]);

  L('Latency tăng đột biến', [
    '- Xem metrics: p95/p99 theo endpoint, theo instance, theo dependency (DB, cache, API ngoài); mức sử dụng pool (DB connection, Tomcat threads, HTTP client).',
    '- Tương quan với deploy, traffic, GC pause (Full GC), batch job, sự cố hạ tầng.',
    '- Trace của request chậm cho thấy bước tốn thời gian.',
    { table: [['Dấu hiệu', 'Nguyên nhân khả dĩ'], ['Latency tăng + pool DB pending cao', 'Truy vấn chậm, transaction dài, thiếu index'], ['Latency tăng theo chu kỳ', 'GC pause, cron/batch job'], ['Lỗi 504 đúng 30s', 'Timeout không đồng bộ giữa gateway và ứng dụng'], ['Chỉ một instance chậm', 'Node lỗi, noisy neighbor, GC của instance đó'], ['Chậm sau deploy, tự hết', 'JVM warm-up, cache rỗng']] },
    '- Giảm thiểu: rollback nếu do deploy, tăng instance tạm thời, bật circuit breaker cho dependency chậm.',
  ]);

  L('CPU cao', [
    '- Trùng thời điểm deploy và traffic không đổi → nghi code mới: rollback để khôi phục, giữ một instance để điều tra.',
    '- Xác định thread nóng: `top -H -p <pid>` + thread dump (`nid` hex), hoặc async-profiler/JFR flame graph.',
    '- Nguyên nhân thường gặp: vòng lặp vô hạn, regex backtracking thảm họa, serialize JSON khổng lồ, xử lý collection lớn O(n²), log quá nhiều, **GC liên tục do thiếu bộ nhớ**, spin-wait.',
    '- Thread GC chiếm CPU → vấn đề thực là cấp phát bộ nhớ/leak.',
    '! Scale ngang chỉ chữa triệu chứng nếu lỗi nằm ở code.',
  ]);

  L('Bộ nhớ và OutOfMemoryError', [
    '- Xác định loại: heap (`Java heap space`), Metaspace, native thread, direct buffer, hay **OOMKilled** của container.',
    '- Leak (heap sau GC tăng dần theo ngày) vs spike (một request tải quá nhiều dữ liệu).',
    '- Heap dump (`-XX:+HeapDumpOnOutOfMemoryError`) → MAT: Dominator Tree, Leak Suspects, đường tới GC root; histogram nhanh: `jcmd GC.class_histogram`.',
    '- Ví dụ spike: export gọi `findAll()` vào List → stream/phân trang, ghi dần ra output, chuyển thành job bất đồng bộ.',
    '- Ví dụ leak: cache không giới hạn, ThreadLocal không remove, listener không hủy.',
    '- Container: heap ≤ ~70% giới hạn (`MaxRAMPercentage`), Native Memory Tracking để đo phần non-heap.',
  ]);

  L('Dữ liệu trùng lặp và đồng thời', [
    '- Triệu chứng: đơn hàng/hồ sơ trùng, số dư sai, bán vượt tồn kho — thường chỉ xảy ra dưới tải.',
    '- Nguyên nhân: check-then-act, retry của client/gateway không idempotent, nhiều instance chạy cùng job, lost update.',
    '- Khắc phục gốc: unique constraint, idempotency key, cập nhật nguyên tử có điều kiện, optimistic/pessimistic locking, distributed lock cho job.',
    '- Xử lý hậu quả: xác định bản ghi trùng theo tiêu chí rõ, sửa dữ liệu theo quy trình có duyệt và audit (không SQL tay tùy tiện), thông báo nghiệp vụ.',
    '- Phòng ngừa: metric/cảnh báo phát hiện trùng, test đồng thời.',
  ]);

  L('Database chậm', [
    '- Tìm truy vấn tốn tổng thời gian nhiều nhất: `pg_stat_statements`, AWR/ASH, slow query log, APM.',
    '- Lấy **execution plan thực tế** trên production; so sánh ước lượng và thực tế; kiểm tra thống kê.',
    '- Nguyên nhân: thiếu/sai index, predicate không sargable, N+1, OFFSET lớn, khóa/tranh chấp (`pg_locks`, blocking session), bloat, thống kê lỗi thời, plan thay đổi theo tham số.',
    '- "Nhanh ở staging, chậm ở production": khối lượng và phân bố dữ liệu khác.',
    '- Phía ứng dụng: pool cạn do transaction dài/OSIV, truy vấn trong vòng lặp.',
  ]);

  L('Tích hợp API bên ngoài', [
    '- Đối tác chậm/lỗi không được làm sập hệ thống của bạn: **timeout** theo ngân sách SLA, **circuit breaker**, **bulkhead**, retry có giới hạn chỉ cho lỗi tạm thời.',
    '- Không gọi đối tác trong transaction DB.',
    '- SLA của bạn chặt hơn dependency → xử lý bất đồng bộ, cache kết quả hợp lệ, trạng thái "đang xử lý".',
    '- Kết quả không rõ (timeout sau khi gửi): idempotency key + API tra cứu trạng thái/đối soát.',
    '- Giám sát riêng từng đối tác; lưu request/response quan trọng (đã che dữ liệu nhạy cảm) để đối soát.',
  ]);

  L('Deployment và cấu hình', [
    { table: [['Triệu chứng sau deploy', 'Kiểm tra'], ['Không kết nối được DB', 'URL/profile/secret thực tế, DNS, firewall/security group, credential, SSL, max connections'], ['Lỗi 401 ngẫu nhiên sau khi scale', 'Khóa ký JWT khác nhau giữa instance'], ['Báo cáo lệch giờ', 'Container chạy UTC, code dùng múi giờ hệ thống'], ['Pod kẹt ở migration', 'Khóa Liquibase/Flyway từ pod bị kill trước đó'], ['Ứng dụng dùng nhầm môi trường', 'SPRING_PROFILES_ACTIVE, biến môi trường không được truyền'], ['Lỗi 502 khi rollout', 'Graceful shutdown, preStop, readiness']] },
    '- Phân biệt thông điệp lỗi kết nối: *timed out* (mạng/firewall), *refused* (không có tiến trình lắng nghe), *authentication failed* (credential).',
    '- Kiểm tra từ chính pod/container (`kubectl exec`), không phải từ máy cá nhân.',
  ]);

  L('Spring Bean và khởi động', [
    '- Đọc phần "Description" và "Action" của FailureAnalyzer trong log khởi động.',
    '- `NoSuchBeanDefinitionException`: class không được scan, điều kiện/profile không thỏa, thiếu auto-config.',
    '- `NoUniqueBeanDefinitionException`: nhiều bean cùng kiểu → `@Qualifier`/`@Primary`.',
    '- **Circular dependency**: Spring Boot 2.6+ cấm mặc định; với `@Async` còn gây lỗi "injected in its raw version". Phá vòng bằng tách logic/dùng event; `@Lazy` chỉ tạm thời.',
    '- `ConflictingBeanDefinitionException`: hai class cùng tên đơn giản.',
    '- Chạy `--debug` để xem condition report; `/actuator/beans` để kiểm tra bean thực tế.',
  ]);

  L('Messaging và Kafka', [
    '- **Consumer lag tăng**: so sánh tốc độ produce và consume; downstream chậm; poison message chặn một partition; rebalance liên tục; consumer ít hơn partition.',
    '- Lag chỉ ở một partition → hot key hoặc poison message. Mọi partition → downstream/traffic.',
    '- Rebalance liên tục + xử lý lại: thời gian xử lý một poll vượt `max.poll.interval.ms` → giảm `max.poll.records`, tăng thời gian cho phép, xử lý nhanh hơn.',
    '- Message trùng: at-least-once là bình thường → consumer idempotent.',
    '- Mất message: auto-commit trước khi xử lý, `acks=1`, auto-ack RabbitMQ.',
    '- Công cụ: `kafka-consumer-groups --describe`, metrics lag (Burrow, Prometheus exporter), DLT.',
  ]);
})();
