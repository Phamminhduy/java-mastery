/* Bài học — Module 10: REST API và Web */
(() => {
  const L = (topic, blocks) => LS.add('rest-api', topic, blocks);

  L('HTTP Methods', [
    { table: [['Method', 'Mục đích', 'Safe', 'Idempotent'], ['GET', 'Đọc tài nguyên', 'Có', 'Có'], ['HEAD', 'Như GET, không body', 'Có', 'Có'], ['OPTIONS', 'Hỏi khả năng (preflight CORS)', 'Có', 'Có'], ['POST', 'Tạo mới / hành động', 'Không', 'Không'], ['PUT', 'Thay thế toàn bộ', 'Không', 'Có'], ['PATCH', 'Cập nhật một phần', 'Không', 'Không đảm bảo'], ['DELETE', 'Xóa', 'Không', 'Có']] },
    '- **Safe**: không thay đổi trạng thái server. **Idempotent**: gọi nhiều lần cho cùng trạng thái server như gọi một lần.',
    '- Idempotent quyết định việc retry tự động có an toàn không.',
  ]);

  L('GET, POST, PUT, PATCH và DELETE', [
    '- GET không có body có ý nghĩa, không thay đổi dữ liệu, có thể cache.',
    '- POST tạo tài nguyên mới (201 + Location) hoặc thực hiện hành động (`POST /orders/42/cancel`).',
    '- PUT gửi **toàn bộ** representation; field thiếu hiểu là rỗng.',
    '- PATCH gửi phần thay đổi: JSON Merge Patch (RFC 7396 — null nghĩa là xóa) hoặc JSON Patch (RFC 6902 — danh sách thao tác).',
    '- DELETE thành công: 204 (hoặc 200 kèm body); gọi lại: 404 hoặc 204 tùy quy ước — vẫn idempotent về trạng thái.',
    '! Idempotency là ngữ nghĩa do server cài đặt: `PUT {"delta": 100}` (cộng thêm) **không** idempotent.',
  ]);

  L('HTTP Status Codes', [
    { table: [['Mã', 'Ý nghĩa', 'Dùng khi'], ['200', 'OK', 'Đọc/cập nhật thành công'], ['201', 'Created', 'Tạo mới (+ Location)'], ['202', 'Accepted', 'Đã nhận, xử lý bất đồng bộ'], ['204', 'No Content', 'Thành công không body'], ['304', 'Not Modified', 'Conditional GET với ETag'], ['400', 'Bad Request', 'Sai định dạng/validation'], ['401', 'Unauthorized', 'Chưa xác thực/token sai'], ['403', 'Forbidden', 'Đã xác thực nhưng không đủ quyền'], ['404', 'Not Found', 'Không có tài nguyên'], ['409', 'Conflict', 'Trùng, xung đột version'], ['412', 'Precondition Failed', 'If-Match không khớp'], ['415', 'Unsupported Media Type', 'Content-Type không hỗ trợ'], ['422', 'Unprocessable Content', 'Lỗi ngữ nghĩa nghiệp vụ'], ['429', 'Too Many Requests', 'Vượt rate limit'], ['500', 'Internal Server Error', 'Lỗi không mong đợi'], ['502/503/504', 'Bad Gateway / Unavailable / Gateway Timeout', 'Lỗi hạ tầng, phía sau']] },
    '! Không trả 200 kèm `{"success": false}` cho lỗi — làm sai lệch monitoring, cache, retry.',
  ]);

  L('Request và Response', [
    '- Request: method, URI (path + query), headers, body. Response: status, headers, body.',
    '- Định dạng body nhất quán (JSON camelCase), ngày giờ ISO-8601 kèm offset, tiền tệ dạng chuỗi/đơn vị nhỏ nhất.',
    '- Response tạo mới trả representation đã tạo (có id, các field do server sinh).',
    '- Thao tác dài: 202 + tài nguyên trạng thái để polling, hoặc webhook.',
    '- Nén response lớn (gzip/br), phân trang danh sách.',
  ]);

  L('Headers', [
    { table: [['Header', 'Vai trò'], ['Content-Type', 'Định dạng body gửi đi (application/json)'], ['Accept', 'Định dạng client muốn nhận (406 nếu không đáp ứng)'], ['Authorization', 'Credential (Bearer token)'], ['Location', 'URI tài nguyên vừa tạo'], ['ETag / If-None-Match / If-Match', 'Cache có điều kiện, optimistic concurrency'], ['Cache-Control', 'Chính sách cache'], ['Retry-After', 'Thời gian chờ trước khi thử lại (429/503)'], ['X-Request-Id / traceparent', 'Correlation & tracing'], ['Idempotency-Key', 'Chống xử lý trùng cho POST']] },
    '- Header tùy chỉnh không cần tiền tố `X-` nữa (RFC 6648) nhưng nhiều hệ thống vẫn dùng.',
  ]);

  L('Query Parameters và Path Variables', [
    '- **Path variable** định danh tài nguyên: `/users/42/orders/7`.',
    '- **Query parameter** cho lọc, tìm kiếm, sắp xếp, phân trang, tùy chọn: `/orders?status=PAID&sort=createdAt,desc&page=0&size=20`.',
    '- Giá trị phải được URL-encode; giới hạn độ dài URL (~2KB an toàn).',
    '- Không đặt dữ liệu nhạy cảm (token, mật khẩu, số thẻ) trong URL — xuất hiện trong log, history, header Referer.',
  ]);

  L('JSON Serialization', [
    '- Spring Boot dùng Jackson: tự đăng ký java.time (ISO-8601), bỏ qua field lạ khi deserialize.',
    '- Annotation thường dùng: `@JsonProperty`, `@JsonIgnore`, `@JsonInclude(NON_NULL)`, `@JsonFormat`, `@JsonCreator`.',
    '- Record là DTO lý tưởng cho request/response.',
    '! `Long` > 2^53 mất chính xác trong JavaScript → serialize dạng chuỗi. Serialize entity JPA trực tiếp gây vòng lặp/lazy loading/lộ field.',
    '- Polymorphic deserialization (`@JsonTypeInfo` với class name) từ dữ liệu không tin cậy là rủi ro bảo mật.',
  ]);

  L('RESTful Design', [
    '- Tài nguyên là **danh từ số nhiều**, phân cấp qua path: `/customers/{id}/orders`.',
    '- Hành động thể hiện bằng HTTP method; hành động nghiệp vụ không khớp CRUD → sub-resource: `POST /orders/{id}/cancellation`.',
    '- Stateless: mỗi request mang đủ thông tin (token), server không giữ phiên.',
    '- Nhất quán: đặt tên, định dạng lỗi, phân trang, ngày giờ trên toàn bộ API.',
    '- HATEOAS (link trong response) là mức trưởng thành cao nhất theo Richardson, ít dùng trong thực tế.',
    '- Contract-first với OpenAPI khi nhiều team phát triển song song.',
  ]);

  L('Idempotency', [
    'Mạng có thể làm mất response → client không biết request đã được xử lý hay chưa → cần retry an toàn.',
    '## Idempotency key cho POST',
    '- Client sinh UUID cho mỗi ý định (thanh toán), gửi trong header `Idempotency-Key` ở mọi lần retry.',
    '- Server lưu key (unique constraint, gắn user + hash payload) cùng kết quả; lần sau trả lại kết quả cũ; request đầu còn đang chạy → 409/đợi.',
    '- Key có TTL (ví dụ 24 giờ).',
    { lang: 'sql', code: `
CREATE TABLE idempotency_keys (
  key_value   VARCHAR(64) PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  response_body TEXT,
  status      VARCHAR(20) NOT NULL,   -- PROCESSING | DONE
  created_at  TIMESTAMP NOT NULL
);` },
    '! Disable nút bấm trên UI không đủ — retry còn đến từ gateway, mobile, client khác.',
  ]);

  L('Pagination, Sorting và Filtering', [
    '- Offset (`page`, `size`) cho màn hình có số trang; keyset/cursor (`after=<id>`) cho dữ liệu lớn/infinite scroll.',
    '- Response chứa metadata: `page`, `size`, `totalElements` (nếu cần), hoặc `nextCursor`.',
    '- Giới hạn `size` tối đa phía server; whitelist trường được phép sort/filter.',
    '- Luôn có sắp xếp xác định (thêm id làm tie-breaker).',
    '- Spring: `Pageable` + `spring.data.web.pageable.max-page-size`.',
  ]);

  L('API Versioning', [
    '- Cách phổ biến: URI (`/v1/orders`) — đơn giản, dễ thấy; header (`API-Version`); media type (`application/vnd.acme.v2+json`).',
    '- **Breaking change**: xóa/đổi tên/đổi kiểu field, thêm tham số bắt buộc, đổi ngữ nghĩa/status code.',
    '- **Không breaking**: thêm field tùy chọn, thêm endpoint (với client tolerant reader).',
    '- Chính sách deprecate: header `Deprecation`/`Sunset`, thời gian chuyển đổi, theo dõi client còn dùng bản cũ.',
  ]);

  L('Error Response Design', [
    { lang: 'json', code: `
{
  "type": "https://api.acme.com/errors/validation",
  "title": "Dữ liệu không hợp lệ",
  "status": 400,
  "detail": "Có 2 trường không hợp lệ",
  "instance": "/api/orders",
  "traceId": "4bf92f3577b34da6",
  "errors": [
    { "field": "email", "code": "INVALID_FORMAT", "message": "Email không đúng định dạng" },
    { "field": "quantity", "code": "MUST_BE_POSITIVE", "message": "Số lượng phải > 0" }
  ]
}` },
    '- Theo chuẩn ProblemDetail (RFC 9457); mã lỗi (`code`) ổn định để client xử lý logic, `message` để hiển thị.',
    '- Trả đủ lỗi validation một lần; kèm traceId; không lộ stack trace/SQL.',
  ]);

  L('Authentication và Authorization', [
    '- **Authentication**: xác minh danh tính (đăng nhập, token, mTLS). Thất bại → 401.',
    '- **Authorization**: quyết định được làm gì. Thất bại → 403 (hoặc 404 để không lộ tài nguyên).',
    '- Hai mức authorization: **chức năng** (role được gọi endpoint) và **đối tượng** (user có sở hữu đơn này không — thiếu là lỗi IDOR/BOLA).',
    '- Cơ chế phổ biến: session cookie, JWT bearer, OAuth2/OIDC, API key cho máy–máy, mTLS.',
  ]);

  L('JWT', [
    'JWT = `header.payload.signature` (Base64URL). Payload (claims: `sub`, `exp`, `iat`, `iss`, `aud`, roles) **đọc được bởi bất kỳ ai** — chữ ký chỉ đảm bảo không bị sửa.',
    '- HS256: khóa bí mật dùng chung; RS256/ES256: ký bằng private key, xác minh bằng public key (JWKS) — phù hợp nhiều service.',
    '- Xác minh: chữ ký với khóa tin cậy, **thuật toán cố định** (chống `alg: none`/algorithm confusion), `exp`, `nbf`, `iss`, `aud`.',
    '- Thu hồi khó (stateless): access token ngắn hạn (5–15 phút) + refresh token có thể thu hồi (rotation), denylist khi cần.',
    '! Không đặt dữ liệu nhạy cảm trong JWT; không lưu khóa ký sinh ngẫu nhiên khi khởi động (nhiều instance sẽ không xác minh được token của nhau).',
  ]);

  L('CORS', [
    'Same-Origin Policy chặn JavaScript đọc response từ origin khác. CORS cho phép server nới lỏng có kiểm soát qua header.',
    '- Request "không đơn giản" (header Authorization, JSON, PUT/DELETE) → trình duyệt gửi **preflight OPTIONS** trước.',
    '- Server trả `Access-Control-Allow-Origin` (origin cụ thể khi có credentials, không dùng `*`), `-Allow-Methods`, `-Allow-Headers`, `-Allow-Credentials`, `-Max-Age`.',
    '- Spring: `CorsConfigurationSource` + `http.cors(...)` để preflight không bị Security chặn.',
    '! CORS do **trình duyệt** thực thi — không bảo vệ API khỏi curl/Postman/server khác. Vẫn cần authentication/authorization.',
  ]);

  L('Rate Limiting', [
    '- Thuật toán: fixed window (đơn giản, burst ở biên), sliding window log/counter, **token bucket** (cho phép burst có kiểm soát), leaky bucket.',
    '- Nhiều instance → bộ đếm dùng chung (Redis) hoặc áp dụng ở API Gateway/Ingress.',
    '- Vượt giới hạn: `429 Too Many Requests` + `Retry-After`, header hạn mức (`RateLimit-Limit/Remaining/Reset`).',
    '- Phía client gọi đối tác: tôn trọng Retry-After, client-side rate limiter (Resilience4j RateLimiter, Bucket4j).',
    '- Giới hạn theo API key/user/IP; mức riêng cho endpoint tốn kém (đăng nhập, export).',
  ]);

  L('Timeout', [
    '- **Connect timeout**: thiết lập kết nối (ngắn: 0.5–2s). **Read timeout**: chờ dữ liệu giữa các gói. **Request/response timeout**: tổng thời gian.',
    '- Timeout lấy connection từ pool HTTP client.',
    '- Quy tắc lan truyền: timeout tầng ngoài > tổng thời gian (kể cả retry) của tầng trong; dùng "time budget".',
    { lang: 'java', code: `
var factory = new SimpleClientHttpRequestFactory();
factory.setConnectTimeout(Duration.ofSeconds(1));
factory.setReadTimeout(Duration.ofSeconds(3));
RestClient client = RestClient.builder().requestFactory(factory).baseUrl(url).build();` },
    '! `new RestTemplate()` mặc định **không có timeout** — một đối tác treo có thể làm cạn toàn bộ thread.',
  ]);

  L('Retry', [
    '- Chỉ retry lỗi **tạm thời**: lỗi kết nối, timeout, 502/503/504, 429 (theo Retry-After).',
    '- Không retry 400/401/403/404/422 — lỗi do dữ liệu/quyền sẽ lặp lại.',
    '- Chỉ retry thao tác idempotent hoặc có idempotency key.',
    '- **Exponential backoff + jitter**, giới hạn số lần; retry budget.',
    '- Chỉ retry ở **một tầng** — retry ở mọi tầng nhân số lần gọi (retry storm).',
    '- Kết hợp circuit breaker để dừng retry khi phía sau lỗi kéo dài (Resilience4j Retry, Spring Retry).',
  ]);

  L('API Documentation với OpenAPI', [
    '- OpenAPI 3 mô tả endpoint, schema, mã lỗi, bảo mật; Swagger UI để thử API.',
    '- Spring Boot 3: `springdoc-openapi-starter-webmvc-ui` (Springfox không còn hỗ trợ). Bổ sung mô tả bằng `@Operation`, `@Schema`, `@ApiResponse`.',
    '- Code-first (sinh spec từ code) vs contract-first (viết spec, sinh code bằng openapi-generator).',
    '- Kiểm tra contract trong CI (diff spec để phát hiện breaking change).',
    '! Không public Swagger UI ở production nếu API nội bộ; bảo vệ bằng xác thực.',
  ]);

  L('API Security', [
    'OWASP API Security Top 10 (2023) — các rủi ro thường gặp:',
    '- **BOLA/IDOR**: không kiểm tra quyền trên đối tượng (`/orders/{id}` của người khác).',
    '- Broken Authentication: token không hết hạn, không kiểm tra chữ ký/audience.',
    '- **Broken Object Property Level Authorization**: mass assignment (client gửi `role: ADMIN`), trả thừa field nhạy cảm.',
    '- Unrestricted Resource Consumption: không giới hạn page size, upload, rate limit.',
    '- Broken Function Level Authorization: endpoint admin không kiểm tra role.',
    '- SSRF: server gọi URL do người dùng cung cấp.',
    '- Biện pháp: DTO cho input/output, kiểm tra quyền ở service, validate input, HTTPS, rate limit, log/giám sát, không lộ lỗi chi tiết.',
  ]);

  L('Xử lý lỗi và logging khi tích hợp API bên ngoài', [
    '- Bọc client đối tác thành một **adapter** riêng; ánh xạ lỗi của đối tác sang exception domain.',
    '- Phân loại: 4xx do dữ liệu → không retry, báo nghiệp vụ; 5xx/timeout → retry có giới hạn, circuit breaker, fallback.',
    '- Log có cấu trúc: correlationId, endpoint, status, latency, mã lỗi đối tác; **che secret và dữ liệu cá nhân**.',
    '- Metrics theo đối tác: tỷ lệ lỗi, p95/p99 latency, trạng thái circuit breaker; cảnh báo khi vượt ngưỡng.',
    '- Lưu lại request quan trọng (thanh toán) để đối soát và xử lý lại.',
    '- Test bằng WireMock: chậm, 503, body sai, timeout.',
  ]);
})();
