/* Bài học — Module 13: Microservices và Messaging */
(() => {
  const L = (topic, blocks) => LS.add('microservices', topic, blocks);

  L('Monolith và Microservices', [
    { table: [['', 'Monolith (modular)', 'Microservices'], ['Triển khai', 'Một artifact', 'Nhiều service độc lập'], ['Giao tiếp', 'Gọi hàm trong process', 'Mạng (HTTP, message)'], ['Dữ liệu', 'Một DB, transaction ACID', 'Mỗi service một DB, eventual consistency'], ['Scale', 'Cả khối', 'Từng service'], ['Độ phức tạp vận hành', 'Thấp', 'Cao (tracing, CI/CD, mạng)'], ['Phù hợp', 'Team nhỏ, domain đang thay đổi', 'Nhiều team, domain ổn định, nhu cầu scale khác nhau']] },
    '- Bắt đầu bằng **modular monolith** với ranh giới module rõ (theo bounded context); tách service khi có lý do thực sự.',
    '- Anti-pattern: **distributed monolith** (service phải deploy cùng nhau, dùng chung DB, gọi đồng bộ dây chuyền).',
    '- Database per service: service khác truy cập qua API/event, không đọc thẳng bảng.',
    '- Strangler fig pattern để tách dần từ monolith.',
  ]);

  L('Service Discovery', [
    '- **Client-side**: client hỏi registry (Eureka, Consul) danh sách instance và tự cân bằng tải (Spring Cloud LoadBalancer).',
    '- **Server-side**: client gọi địa chỉ ổn định, nền tảng định tuyến — Kubernetes Service (DNS `order-service.ns.svc`), load balancer, service mesh.',
    '- Trên Kubernetes thường không cần Eureka.',
    '- Health check/readiness quyết định instance nào nhận traffic.',
  ]);

  L('API Gateway', [
    '- Điểm vào duy nhất: định tuyến, xác thực token, rate limiting, TLS termination, CORS, logging, correlation ID, aggregation đơn giản.',
    '- Ví dụ: Spring Cloud Gateway, Kong, Nginx, AWS API Gateway, Ingress controller.',
    '- **Không** đặt logic nghiệp vụ trong gateway.',
    '- Service phía sau vẫn xác minh danh tính và tự kiểm tra quyền nghiệp vụ (zero trust).',
    '- BFF (Backend for Frontend): gateway riêng cho từng loại client (web, mobile).',
  ]);

  L('Synchronous và Asynchronous Communication', [
    '- **Đồng bộ** (REST, gRPC): đơn giản, có kết quả ngay; nhưng coupling thời gian — availability nhân với nhau (0,999³ ≈ 99,7%), latency cộng dồn, lỗi lan truyền.',
    '- **Bất đồng bộ** (Kafka, RabbitMQ): tách rời producer/consumer, chịu lỗi tốt, hấp thụ tải đỉnh; nhưng eventual consistency, khó debug, cần idempotency.',
    '- Chọn đồng bộ khi cần câu trả lời ngay (kiểm tra giá, xác thực); bất đồng bộ cho thông báo, cập nhật dữ liệu phái sinh, quy trình dài.',
    '- Gọi đồng bộ luôn cần timeout, retry có giới hạn, circuit breaker.',
  ]);

  L('Kafka', [
    'Kafka là **distributed commit log**: topic chia thành partition; message được lưu theo retention (không xóa khi đọc); consumer tự quản lý offset.',
    '- Thứ tự chỉ đảm bảo **trong một partition** → dùng key (orderId) để event cùng đối tượng vào cùng partition.',
    '- Consumer group: mỗi partition gán cho tối đa một consumer trong group → số partition là giới hạn song song.',
    '- Rebalance khi consumer vào/ra hoặc không poll trong `max.poll.interval.ms`.',
    '- Replication: replication factor, ISR, `min.insync.replicas`; producer `acks=all` + idempotence cho độ bền.',
    { lang: 'java', code: `
@KafkaListener(topics = "payments", groupId = "loyalty")
void onPayment(PaymentEvent e, Acknowledgment ack) {
    loyaltyService.addPoints(e);   // idempotent theo paymentId
    ack.acknowledge();             // commit offset sau khi xử lý
}` },
  ]);

  L('RabbitMQ', [
    '- Message broker AMQP: producer gửi tới **exchange**, exchange định tuyến tới **queue** theo binding (direct, topic, fanout, headers).',
    '- Consumer ack từng message; message thường bị xóa sau khi ack.',
    '- Prefetch giới hạn số message chưa ack mỗi consumer.',
    '- Auto-ack của AMQP mất message khi consumer crash; Spring AMQP `AcknowledgeMode.AUTO` ack sau khi listener thành công.',
    '- Phù hợp task queue, routing linh hoạt, request/reply, priority, delay (plugin). Kafka phù hợp event streaming, replay, throughput rất lớn.',
  ]);

  L('Message Delivery Semantics', [
    '- **At-most-once**: có thể mất, không trùng (commit offset trước khi xử lý).',
    '- **At-least-once**: không mất, có thể trùng (commit sau khi xử lý) — phổ biến nhất.',
    '- **Exactly-once**: Kafka hỗ trợ trong phạm vi đọc–xử lý–ghi Kafka (transaction + idempotent producer); với side effect ra hệ thống ngoài vẫn cần idempotency.',
    '- Thực tế: **at-least-once + consumer idempotent** ≈ "effectively once".',
    '- Producer: `acks=all`, `enable.idempotence=true`, retry; topic replication factor ≥ 3, `min.insync.replicas=2`.',
  ]);

  L('Idempotent Consumer', [
    'Consumer xử lý trùng message mà kết quả không đổi.',
    '- Lưu message/business id đã xử lý trong bảng có **unique constraint**, trong **cùng transaction** với thay đổi nghiệp vụ.',
    '- Hoặc làm thao tác tự nhiên idempotent: upsert theo khóa nghiệp vụ, đặt trạng thái thay vì cộng dồn, kiểm tra version.',
    { lang: 'java', code: `
@Transactional
public void handle(PaymentCompleted e) {
    if (processedRepo.insertIfAbsent(e.messageId()) == 0) return;  // đã xử lý
    loyalty.addPoints(e.customerId(), e.amount());
}` },
    '! Set trong bộ nhớ không đủ (mất khi restart, không chia sẻ giữa instance).',
  ]);

  L('Retry và Dead Letter Queue', [
    '- Phân loại lỗi: **tạm thời** (DB/API ngoài lỗi) → retry có backoff; **vĩnh viễn** (message hỏng, validation) → chuyển DLQ ngay.',
    '- Poison message retry vô hạn làm kẹt partition (Kafka) hoặc vòng lặp requeue (RabbitMQ).',
    '- Spring Kafka: `DefaultErrorHandler` + `DeadLetterPublishingRecoverer`, `@RetryableTopic` (retry topic không chặn — mất thứ tự), `ErrorHandlingDeserializer`.',
    '- RabbitMQ: `x-dead-letter-exchange`, reject không requeue sau số lần thử.',
    '- DLQ cần giám sát, cảnh báo và công cụ xử lý lại (replay) sau khi sửa lỗi.',
  ]);

  L('Distributed Transactions', [
    '- **2PC/XA**: coordinator + prepare/commit; đảm bảo nguyên tử nhưng chặn khi một bên lỗi, giảm availability, nhiều công nghệ không hỗ trợ.',
    '- Microservices ưu tiên **Saga** + eventual consistency, **Outbox** cho dual write, idempotency, reconciliation (đối soát định kỳ).',
    '- CAP: khi có phân vùng mạng phải chọn Consistency hoặc Availability; PACELC: khi không có phân vùng vẫn đánh đổi Latency và Consistency.',
  ]);

  L('Saga Pattern', [
    'Saga chia giao dịch phân tán thành chuỗi **transaction cục bộ**; nếu một bước thất bại, chạy **compensating transaction** cho các bước đã thành công (hoàn tiền, nhả hàng) — không phải rollback.',
    '- **Choreography**: service phản ứng với event của nhau; coupling thấp, khó theo dõi khi nhiều bước.',
    '- **Orchestration**: orchestrator điều phối và lưu trạng thái saga; luồng rõ ràng, dễ xử lý timeout/bù (Temporal, Camunda, state machine tự viết).',
    '- Thiết kế: thứ tự bước giảm chi phí bù (giữ hàng trước, trừ tiền sau), trạng thái trung gian rõ (PENDING_PAYMENT), bước bù idempotent và retry được.',
    '- Thiếu isolation: người dùng có thể thấy trạng thái trung gian → semantic lock, thiết kế UX phù hợp.',
  ]);

  L('Circuit Breaker', [
    { table: [['Trạng thái', 'Hành vi'], ['CLOSED', 'Cho request qua, đo tỷ lệ lỗi/chậm trong cửa sổ'], ['OPEN', 'Từ chối ngay (fail fast), trả fallback trong `waitDurationInOpenState`'], ['HALF_OPEN', 'Cho vài request thử; thành công → CLOSED, lỗi → OPEN']] },
    { lang: 'java', code: `
@CircuitBreaker(name = "pricing", fallbackMethod = "cachedPrice")
@TimeLimiter(name = "pricing")
public CompletableFuture<Price> price(long id) { ... }` },
    '- Resilience4j (thay Hystrix). Kết hợp timeout, retry có giới hạn, bulkhead.',
    '- Thứ tự aspect mặc định: Retry(CircuitBreaker(RateLimiter(TimeLimiter(Bulkhead(fn))))).',
    '- Fallback phải có ý nghĩa nghiệp vụ và được test; theo dõi trạng thái breaker qua metrics.',
  ]);

  L('Eventual Consistency', [
    'Dữ liệu giữa các service/read model sẽ nhất quán **sau một khoảng thời gian**, không ngay lập tức.',
    '- Chấp nhận để có availability và khả năng mở rộng; phải thiết kế trải nghiệm phù hợp.',
    '- Kỹ thuật: read-your-own-writes (trả dữ liệu vừa tạo trong response, đọc từ nguồn ghi), hiển thị trạng thái "đang xử lý", optimistic UI.',
    '- Giám sát độ trễ đồng bộ (consumer lag), có cơ chế đối soát khi lệch.',
    '- Dữ liệu cần nhất quán mạnh (số dư) giữ trong một service/một DB.',
  ]);

  L('Distributed Tracing', [
    '- Một **trace** (traceId) gồm nhiều **span** (mỗi bước: HTTP call, DB query, xử lý message) với thời gian, quan hệ cha–con, thuộc tính.',
    '- Context truyền qua header chuẩn W3C `traceparent` (HTTP) và header message (Kafka).',
    '- Spring Boot 3: Micrometer Observation + Micrometer Tracing (bridge OpenTelemetry/Brave), exporter tới Zipkin, Jaeger, Tempo.',
    '- traceId tự vào MDC → liên kết log với trace.',
    '- Sampling để kiểm soát chi phí (head-based, tail-based giữ trace lỗi/chậm).',
  ]);

  L('Correlation ID', [
    '- ID gắn với một yêu cầu nghiệp vụ, đi qua mọi service để lọc log liên quan.',
    '- Nhận từ header (`X-Request-Id`/`traceparent`) hoặc tạo mới ở biên; đưa vào MDC; truyền tiếp qua HTTP header và **message header**.',
    '- Truyền context sang thread async (TaskDecorator, context-propagation).',
    '- Trả correlation ID trong response lỗi để người dùng/hỗ trợ báo lại.',
    '- Xóa MDC sau mỗi request/message.',
  ]);

  L('Outbox Pattern', [
    'Giải quyết **dual write**: lưu DB và publish message không thể nguyên tử với nhau.',
    '- Trong **cùng transaction**: lưu thay đổi nghiệp vụ + ghi event vào bảng `outbox`.',
    '- Relay publish event: **polling** bảng outbox (đơn giản) hoặc **CDC** (Debezium đọc WAL/redo log, độ trễ thấp).',
    '- Đánh dấu đã gửi/xóa sau khi publish; relay có thể gửi trùng → consumer idempotent.',
    '- Inbox pattern ở phía consumer: lưu message đã nhận để khử trùng.',
    { lang: 'sql', code: `
CREATE TABLE outbox (
  id UUID PRIMARY KEY,
  aggregate_type VARCHAR(50), aggregate_id VARCHAR(50),
  event_type VARCHAR(100), payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);` },
  ]);

  L('Resilience và Fault Tolerance', [
    { table: [['Pattern', 'Mục đích'], ['Timeout', 'Không chờ vô hạn'], ['Retry + backoff + jitter', 'Vượt qua lỗi tạm thời'], ['Circuit breaker', 'Fail fast khi phía sau lỗi kéo dài'], ['Bulkhead', 'Cô lập tài nguyên theo dependency'], ['Rate limiter', 'Bảo vệ chính mình/đối tác'], ['Fallback / graceful degradation', 'Giảm chức năng thay vì sập'], ['Cache', 'Phục vụ khi nguồn lỗi'], ['Idempotency', 'Retry an toàn']] },
    '- Phân biệt dependency cốt lõi và phụ.',
    '- Chaos testing để kiểm chứng (fallback ít khi chạy thường có bug).',
    '- Giám sát: tỷ lệ lỗi, latency, trạng thái breaker, queue size.',
  ]);
})();
