/* Bài học — Module 14: System Design và Backend Architecture */
(() => {
  const L = (topic, blocks) => LS.add('system-design', topic, blocks);

  L('Layered Architecture', [
    '- Các tầng: **Presentation** (controller, DTO) → **Application/Service** (use case, transaction, phân quyền) → **Domain** (quy tắc nghiệp vụ) → **Infrastructure/Persistence** (repository, client ngoài).',
    '- Tầng trên chỉ gọi tầng dưới; controller không gọi thẳng repository.',
    '- Ưu: đơn giản, quen thuộc. Nhược: dễ thành "anemic domain" (service chỉ chuyển CRUD), domain phụ thuộc vào persistence.',
    '- Package-by-feature (`order/`, `payment/`) thường dễ bảo trì hơn package-by-layer cho dự án lớn.',
  ]);

  L('Clean Architecture', [
    '- **Dependency rule**: phụ thuộc chỉ hướng vào trong. Entities → Use cases → Interface adapters → Frameworks & drivers.',
    '- Domain và use case không biết Spring, JPA, HTTP; tầng ngoài implement interface do tầng trong định nghĩa.',
    '- Ưu: logic nghiệp vụ test được độc lập, đổi công nghệ ít ảnh hưởng. Nhược: nhiều mapping/boilerplate.',
    '- Phù hợp domain phức tạp, sống lâu; CRUD đơn giản có thể không cần.',
  ]);

  L('Hexagonal Architecture', [
    '- **Ports & Adapters**: lõi ứng dụng định nghĩa **port** (interface): inbound (use case) và outbound (repository, publisher, payment gateway).',
    '- **Adapter** kết nối thế giới ngoài: inbound (REST controller, Kafka listener, scheduler), outbound (JPA, Kafka producer, HTTP client).',
    '- Có thể thay adapter (Kafka → RabbitMQ) hoặc dùng fake trong test mà không sửa lõi.',
    '- Tư tưởng gần với Clean Architecture/Onion.',
  ]);

  L('SOLID', [
    'Ở mức kiến trúc:',
    '- **SRP** → module/service có ranh giới trách nhiệm rõ (bounded context).',
    '- **OCP** → mở rộng bằng plugin/strategy/event thay vì sửa lõi.',
    '- **DIP** → domain phụ thuộc vào port, hạ tầng implement port.',
    '- Áp dụng có chừng mực: interface cho ranh giới quan trọng (hạ tầng, hệ thống ngoài), không bắt buộc `XxxService` + `XxxServiceImpl` cho mọi class.',
  ]);

  L('Design Patterns', [
    '- Trong Spring: Template Method dạng callback (`JdbcTemplate`, `TransactionTemplate`), Proxy (AOP), Observer (events), Strategy (inject Map/List bean), Factory (`FactoryBean`), Chain of Responsibility (Security filter chain, interceptor).',
    '- Kiến trúc: Repository, Unit of Work (persistence context), DTO, Specification, CQRS, Event Sourcing, Saga, Outbox, Circuit Breaker, Strangler Fig.',
    '- Chọn pattern để giải quyết vấn đề cụ thể, không áp dụng vì "đúng chuẩn".',
  ]);

  L('Caching', [
    { table: [['Chiến lược', 'Cách hoạt động'], ['Cache-aside', 'Đọc cache → miss thì đọc DB và ghi cache; ghi DB rồi xóa cache'], ['Read-through', 'Cache tự tải từ nguồn khi miss'], ['Write-through', 'Ghi cache và DB đồng bộ'], ['Write-behind', 'Ghi cache trước, đẩy DB bất đồng bộ (rủi ro mất dữ liệu)']] },
    '- Cache cục bộ (Caffeine): cực nhanh, nhưng mỗi instance một bản → không nhất quán. Cache phân tán (Redis): dùng chung, có độ trễ mạng.',
    '- Luôn có TTL/giới hạn kích thước; invalidation là phần khó nhất.',
    '- Vấn đề: **stampede** (key nóng hết hạn → nhiều request cùng tải: single-flight, refresh sớm), **penetration** (key không tồn tại: cache null, Bloom filter), **avalanche** (nhiều key hết hạn cùng lúc: TTL jitter).',
    '- Spring Cache: `@Cacheable`, `@CacheEvict`, `@CachePut`; `sync = true` để gom tải cùng key.',
    '! Không cache dữ liệu đòi hỏi chính xác tuyệt đối (số dư) hoặc dữ liệu theo quyền mà key không chứa user.',
  ]);

  L('Redis', [
    '- In-memory data store: String, Hash, List, Set, Sorted Set, Stream, HyperLogLog...',
    '- Thực thi lệnh trên **một luồng chính** → mỗi lệnh nguyên tử (`INCR`, `SET NX`), nhưng lệnh chậm (`KEYS *`, tập lớn) chặn mọi client — dùng `SCAN`.',
    '- Use case: cache, session, rate limiting, distributed lock, leaderboard (sorted set), hàng đợi nhẹ, pub/sub.',
    '- Bền vững: RDB snapshot, AOF; HA: Sentinel, Cluster (sharding theo hash slot).',
    '- `maxmemory-policy`: cache dùng `allkeys-lru/lfu`; mặc định `noeviction` từ chối ghi khi đầy.',
    '- Spring Data Redis / Lettuce; chọn serializer (JSON) để dễ đọc và tương thích phiên bản.',
  ]);

  L('Database Scaling', [
    '- **Vertical**: máy DB mạnh hơn — đơn giản, có giới hạn.',
    '- **Read replica**: tách đọc; replication lag → read-after-write cần đọc primary.',
    '- **Partitioning**: chia bảng lớn theo thời gian/khóa trong cùng DB (dễ xóa dữ liệu cũ, truy vấn theo khoảng).',
    '- **Sharding**: chia dữ liệu sang nhiều DB theo shard key — khó: truy vấn chéo shard, transaction chéo, rebalance, hot spot.',
    '- Trước khi scale hạ tầng: tối ưu truy vấn/index, cache, connection pool, giảm dữ liệu đọc.',
    '- CQRS: mô hình đọc riêng (denormalized, search engine) cho truy vấn phức tạp.',
  ]);

  L('Load Balancing', [
    '- **L4** (TCP/UDP): nhanh, không hiểu HTTP. **L7** (HTTP): định tuyến theo path/header, TLS termination, retry, sticky session.',
    '- Thuật toán: round robin, weighted, least connections, consistent hashing (giữ affinity theo key).',
    '- Health check loại instance lỗi; connection draining khi rút instance.',
    '- Global load balancing/DNS cho nhiều region.',
  ]);

  L('Horizontal và Vertical Scaling', [
    '- **Vertical**: thêm CPU/RAM cho một máy — nhanh, không đổi code, có giới hạn và là single point of failure.',
    '- **Horizontal**: thêm instance — cần ứng dụng **stateless** (session, file, cache, scheduler không phụ thuộc instance).',
    '- Autoscaling theo CPU, request rate, queue lag (KEDA).',
    '- Nút thắt thường chuyển sang DB/dependency — scale ứng dụng mà không scale DB có thể làm DB quá tải (connection pool tổng).',
  ]);

  L('Concurrency Control', [
    '- Trong một JVM: synchronized, Lock, Atomic — **không đủ** khi có nhiều instance.',
    '- Ở DB: cập nhật nguyên tử có điều kiện, optimistic locking (`@Version`), pessimistic lock (`FOR UPDATE`), unique/exclusion constraint.',
    '- Phân tán: distributed lock (Redis, ZooKeeper, DB advisory lock), xử lý tuần tự qua partition/queue theo key.',
    '- Chọn theo mức tranh chấp và yêu cầu nhất quán; luôn có chốt chặn cuối ở DB cho dữ liệu quan trọng.',
  ]);

  L('Rate Limiting', [
    { table: [['Thuật toán', 'Ưu', 'Nhược'], ['Fixed window', 'Đơn giản, một counter', 'Burst gấp đôi ở biên cửa sổ'], ['Sliding window log', 'Chính xác', 'Tốn bộ nhớ'], ['Sliding window counter', 'Cân bằng', 'Xấp xỉ'], ['Token bucket', 'Cho phép burst có kiểm soát', 'Cần tham số hợp lý'], ['Leaky bucket', 'Đầu ra đều', 'Không cho burst']] },
    '- Triển khai phân tán bằng Redis (Lua script nguyên tử) hoặc ở gateway.',
    '- Phản hồi 429 + Retry-After; giới hạn theo user/API key/IP và theo endpoint.',
  ]);

  L('Distributed Lock', [
    '- Redis: `SET lock:key <uuid> NX PX 30000`; giải phóng bằng Lua script kiểm tra đúng uuid (không xóa khóa của người khác).',
    '- Khóa hết hạn khi tiến trình còn chạy (GC pause, chậm) → hai bên cùng giữ khóa. Giảm thiểu: gia hạn (watchdog của Redisson), **fencing token** kiểm tra ở tài nguyên đích.',
    '- Lựa chọn khác: DB (`SELECT ... FOR UPDATE`, PostgreSQL advisory lock), ZooKeeper/etcd (đảm bảo mạnh hơn), ShedLock cho scheduled job.',
    '- Thiết kế idempotent và có ràng buộc dữ liệu để không phụ thuộc tuyệt đối vào khóa.',
  ]);

  L('High Availability', [
    '- Loại bỏ **single point of failure**: nhiều instance, nhiều AZ, DB có replica/failover, load balancer dự phòng.',
    '- Chỉ số: availability (99,9% ≈ 8,76 giờ downtime/năm; 99,99% ≈ 52 phút), **RPO** (lượng dữ liệu tối đa có thể mất), **RTO** (thời gian khôi phục tối đa).',
    '- Mô hình: active-passive (failover), active-active.',
    '- Backup **có kiểm tra khôi phục** định kỳ; disaster recovery theo region.',
    '- Deploy không downtime: rolling/blue-green/canary, migration tương thích ngược.',
  ]);

  L('Fault Tolerance', [
    '- Thiết kế giả định mọi thứ sẽ lỗi: mạng, dependency, máy chủ, dữ liệu.',
    '- Timeout, retry, circuit breaker, bulkhead, fallback, graceful degradation.',
    '- Phân biệt chức năng cốt lõi (đặt hàng) và phụ (gợi ý sản phẩm) để giảm chức năng thay vì sập toàn bộ.',
    '- Xử lý kết quả "không rõ" (timeout sau khi đã gửi): idempotency + API kiểm tra trạng thái.',
    '- Chaos engineering để kiểm chứng.',
  ]);

  L('Observability', [
    '- Ba trụ cột: **metrics**, **logs**, **traces** — liên kết bằng traceId/exemplar.',
    '- Phương pháp **RED** cho service (Rate, Errors, Duration) và **USE** cho tài nguyên (Utilization, Saturation, Errors).',
    '- SLI/SLO/error budget; cảnh báo theo triệu chứng người dùng (tỷ lệ lỗi, p99) và burn rate, không cảnh báo mọi CPU cao.',
    '- Spring Boot: Actuator + Micrometer (Prometheus/Grafana), Micrometer Tracing (OpenTelemetry), structured logging.',
    '- Dashboard theo dịch vụ và theo dependency; runbook cho mỗi cảnh báo.',
  ]);

  L('Logging, Metrics và Tracing', [
    { table: [['Công cụ', 'Trả lời câu hỏi', 'Đặc điểm'], ['Metrics', 'Xu hướng, tỷ lệ lỗi, p99 tuần này?', 'Tổng hợp, rẻ, lưu lâu, dùng cảnh báo'], ['Tracing', 'Request X chậm ở service nào?', 'Đường đi và thời gian từng bước'], ['Logs', 'Vì sao request X lỗi, dữ liệu gì?', 'Chi tiết sự kiện, tốn dung lượng']] },
    '- Log có cấu trúc (JSON) kèm traceId; mức log hợp lý; không log PII/secret.',
    '- Metric có label với **cardinality thấp** (không đặt userId làm label).',
    '- Ví dụ stack: Prometheus + Grafana, Loki/ELK, Tempo/Jaeger.',
  ]);

  L('Thiết kế hệ thống quản lý công việc', [
    '## Cách tiếp cận một bài system design',
    '- Làm rõ yêu cầu chức năng và phi chức năng (số người dùng, tải, độ trễ, nhất quán) → mô hình dữ liệu → API → luồng chính → điểm nghẽn và mở rộng.',
    '## Áp dụng',
    '- Thực thể: Project, Task (trạng thái, assignee, deadline, priority), Comment, Attachment, ActivityLog.',
    '- Workflow trạng thái hợp lệ (state machine), phân quyền theo dự án/vai trò.',
    '- Hai người cùng sửa → optimistic locking (`@Version`) và 409.',
    '- Lịch sử thay đổi (audit) — ai, khi nào, đổi gì.',
    '- Thông báo khi được giao/sắp đến hạn → bất đồng bộ qua event; job nhắc hạn chạy một instance (ShedLock).',
    '- Truy vấn "việc của tôi" → index `(assignee_id, status, due_date)`; tìm kiếm full-text khi lớn (Elasticsearch).',
    '- File đính kèm lưu object storage (S3), DB chỉ lưu metadata.',
  ]);

  L('Thiết kế hệ thống đặt hàng', [
    '- Luồng: giỏ hàng → kiểm tra giá/tồn → tạo đơn PENDING → giữ hàng → thanh toán → xác nhận → giao hàng.',
    '- Tồn kho: giữ chỗ nguyên tử có thời hạn (`UPDATE ... WHERE stock >= qty` hoặc Redis DECR), hết hạn tự hoàn.',
    '- Thanh toán qua cổng ngoài: idempotency key, xử lý callback/webhook trùng, đối soát.',
    '- Nhiều service: Saga (giữ hàng → thanh toán → bù khi lỗi), Outbox để publish event tin cậy.',
    '- Flash sale: hàng đợi/waiting room, rate limit, cache thông tin sản phẩm, tách luồng ghi.',
    '- Lưu giá tại thời điểm mua trong order_items; trạng thái đơn có lịch sử.',
    '- API tạo đơn idempotent; không giữ transaction khi gọi hệ thống ngoài.',
  ]);

  L('Thiết kế hệ thống thông báo', [
    '- Kênh: email, SMS, push, in-app; nhận yêu cầu qua message queue (bền vững, tách rời hệ thống gửi).',
    '- Thành phần: API/consumer nhận yêu cầu → kiểm tra tùy chọn người dùng (opt-out, giờ yên lặng) → render template (đa ngôn ngữ) → hàng đợi **theo kênh** → worker gửi qua nhà cung cấp.',
    '- Độ tin cậy: retry có backoff, DLQ, failover nhà cung cấp, lưu trạng thái gửi để tra cứu.',
    '- Khử trùng lặp bằng idempotency key; rate limit theo người dùng và theo nhà cung cấp.',
    '- Ưu tiên: OTP/giao dịch ưu tiên cao hơn marketing (queue riêng).',
    '- Theo dõi: tỷ lệ gửi thành công, độ trễ, bounce.',
  ]);

  L('Thiết kế API cho hệ thống Enterprise', [
    '- Quy ước thống nhất: đặt tên tài nguyên, định dạng lỗi (ProblemDetail + mã lỗi), phân trang, ngày giờ ISO-8601 có offset, tiền tệ.',
    '- Contract OpenAPI được review, quản lý phiên bản, chính sách deprecate.',
    '- Bảo mật: OAuth2/OIDC, phân quyền chức năng + đối tượng, rate limit, audit log.',
    '- Độ tin cậy: idempotency cho thao tác tạo/thanh toán, timeout, correlation ID.',
    '- Không trả entity; DTO là lớp chống ăn mòn giữa API và mô hình nội bộ.',
    '- Tài liệu, SDK/mock server cho đối tác; môi trường sandbox.',
  ]);
})();
