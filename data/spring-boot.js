/* Module 7: Spring Boot */
QB.module({
  id: 'spring-boot', order: 7, title: 'Spring Boot',
  description: 'Auto-Configuration, Starters, cấu hình, REST, Exception Handling, Validation, Logging, Actuator, Spring Boot 3+ và lỗi production.',
  topics: ['Spring Boot Auto-Configuration', 'Starter Dependencies', 'ApplicationContext', 'application.properties và application.yml',
    'Configuration Properties', 'Profiles', 'Embedded Server', 'REST Controllers', 'Global Exception Handling', 'Validation', 'Logging',
    'Actuator', 'Health Checks', 'Application Startup', 'Spring Boot 3+ và các thay đổi quan trọng', 'Các lỗi thường gặp khi triển khai production'],
}, [
  {
    id: 'SB-001', topic: 'Spring Boot Auto-Configuration', d: 'i', cat: 'theory',
    q: 'Bạn tự khai báo một bean `DataSource` (HikariCP với cấu hình riêng). Auto-configuration `DataSourceAutoConfiguration` của Spring Boot xử lý thế nào?',
    opts: [
      'Tạo thêm một DataSource thứ hai và báo lỗi NoUniqueBeanDefinitionException',
      'Lùi lại (back off): bean DataSource của auto-config được đánh dấu @ConditionalOnMissingBean nên không được tạo khi đã có bean do người dùng định nghĩa',
      'Ghi đè bean của bạn bằng bean mặc định',
      'Ứng dụng không khởi động được',
    ], ans: 'B',
    exp: 'Auto-configuration được xử lý **sau** cấu hình của người dùng và dựa vào các điều kiện: `@ConditionalOnClass` (có thư viện trên classpath), `@ConditionalOnMissingBean` (chưa có bean), `@ConditionalOnProperty`... Nhờ vậy Spring Boot "có quan điểm mặc định" nhưng luôn nhường quyền cho cấu hình tường minh.',
    tags: ['auto-configuration', 'conditional'], sec: 40,
  },
  {
    id: 'SB-002', topic: 'Spring Boot Auto-Configuration', d: 'i', cat: 'debug',
    q: 'Bạn cần biết vì sao một auto-configuration (ví dụ RedisAutoConfiguration) được/không được áp dụng. Cách nhanh nhất?',
    opts: [
      'Đọc toàn bộ source code của Spring Boot',
      'Chạy với `--debug` (hoặc `debug=true`) để in Condition Evaluation Report, hoặc xem endpoint Actuator `/actuator/conditions`',
      'Xóa thư mục target và build lại',
      'Thêm @EnableAutoConfiguration lần nữa',
    ], ans: 'B',
    exp: 'Condition Evaluation Report liệt kê "Positive matches" và "Negative matches" cùng lý do (thiếu class nào, đã có bean nào, property nào). Đây là công cụ quan trọng khi bean không xuất hiện hoặc xuất hiện ngoài ý muốn.',
    tags: ['auto-configuration', 'debug', 'conditions'], sec: 35,
  },
  {
    id: 'SB-003', topic: 'Spring Boot 3+ và các thay đổi quan trọng', d: 'a', cat: 'debug',
    q: 'Thư viện nội bộ tự viết auto-configuration, đăng ký trong `META-INF/spring.factories` với key `EnableAutoConfiguration`. Sau khi ứng dụng nâng lên Spring Boot 3.0, cấu hình này không còn được nạp. Vì sao?',
    opts: [
      'Spring Boot 3 bỏ hoàn toàn cơ chế auto-configuration',
      'Từ Spring Boot 3.0, auto-configuration phải được đăng ký trong file `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (hỗ trợ spring.factories cho key này đã bị gỡ bỏ); class nên dùng @AutoConfiguration',
      'Phải đổi tên file thành spring.yml',
      'Cần thêm @ComponentScan cho thư viện',
    ], ans: 'B',
    exp: 'Spring Boot 2.7 giới thiệu file `AutoConfiguration.imports` và annotation `@AutoConfiguration`; 3.0 gỡ hỗ trợ đăng ký auto-config qua spring.factories. Đây là một trong các bước migration hay bị bỏ sót đối với thư viện dùng chung trong doanh nghiệp.',
    tags: ['spring-boot-3', 'auto-configuration', 'migration'], sec: 50, ver: 'Spring Boot 3.0+',
  },
  {
    id: 'SB-004', topic: 'Starter Dependencies', d: 'b', cat: 'theory',
    q: '`spring-boot-starter-web` mang lại những gì?',
    opts: [
      'Chỉ thư viện Jackson',
      'Một tập dependency được tuyển chọn và tương thích phiên bản: Spring MVC, embedded Tomcat, Jackson, validation API cơ bản… kèm auto-configuration tương ứng',
      'Một web server độc lập cần cài riêng',
      'Spring WebFlux và Netty',
    ], ans: 'B',
    exp: 'Starter là "dependency descriptor": thêm một starter là có đủ thư viện cho một năng lực, với phiên bản được quản lý bởi Spring Boot BOM. Muốn đổi Tomcat sang Jetty/Undertow: exclude `spring-boot-starter-tomcat` và thêm starter tương ứng. Lưu ý: từ Boot 2.3, validation tách thành `spring-boot-starter-validation`.',
    tags: ['starter', 'dependency-management'], sec: 30,
  },
  {
    id: 'SB-005', topic: 'Spring Boot 3+ và các thay đổi quan trọng', d: 'i', cat: 'theory', type: 'multiple',
    q: 'Chọn **2** thay đổi bắt buộc khi nâng cấp từ Spring Boot 2.7 lên 3.x.',
    opts: [
      'Baseline Java tối thiểu là Java 17',
      'Chuyển namespace từ `javax.*` sang `jakarta.*` (Jakarta EE 9+), ví dụ `jakarta.persistence.Entity`, `jakarta.servlet.Filter`',
      'Bỏ hỗ trợ file application.yml',
      'Bắt buộc dùng WebFlux thay cho Spring MVC',
    ], ans: ['A', 'B'],
    exp: 'Spring Boot 3 dựa trên Spring Framework 6: yêu cầu Java 17+ và Jakarta EE 9+ (javax → jakarta cho Servlet, JPA, Bean Validation…). Các thay đổi khác cần chú ý: Hibernate 6, Spring Security 6 (bỏ WebSecurityConfigurerAdapter), Micrometer Tracing thay Sleuth, trailing slash matching tắt mặc định, đăng ký auto-config bằng AutoConfiguration.imports.',
    tags: ['spring-boot-3', 'jakarta', 'java17'], sec: 45, ver: 'Spring Boot 3.0+',
  },
  {
    id: 'SB-006', topic: 'Spring Boot 3+ và các thay đổi quan trọng', d: 'a', cat: 'debug',
    q: 'Sau khi nâng cấp Spring Boot 3.2, request `GET /api/orders/` (có dấu `/` cuối) mà trước đây hoạt động giờ trả về 404, trong khi controller khai báo `@GetMapping("/api/orders")`. Nguyên nhân?',
    opts: [
      'Do Spring Security chặn',
      'Spring Framework 6 tắt mặc định trailing slash matching; `/api/orders/` không còn tự khớp với `/api/orders`',
      'Do Tomcat 10 không hỗ trợ dấu /',
      'Do thiếu @ResponseBody',
    ], ans: 'B',
    exp: 'Từ Spring Framework 6.0, tùy chọn trailing slash match bị deprecate và mặc định false để tránh mơ hồ về URL (và rủi ro bảo mật khi rule bảo vệ chỉ khớp một dạng). Giải pháp: client gọi đúng URL; khai báo cả hai path tường minh; hoặc dùng filter chuyển hướng/chuẩn hóa URL. Không nên dựa vào cấu hình cũ đã deprecated.',
    tags: ['spring-6', 'trailing-slash', 'migration'], sec: 50, ver: 'Spring Boot 3.0+',
  },
  {
    id: 'SB-007', topic: 'Spring Boot 3+ và các thay đổi quan trọng', d: 'i', cat: 'theory',
    q: 'Trong Spring Boot 3, thành phần nào thay thế Spring Cloud Sleuth cho distributed tracing?',
    opts: ['Zipkin Server', 'Micrometer Tracing (với bridge Brave hoặc OpenTelemetry) và Observation API', 'Spring Boot Admin', 'Logback MDC thuần'], ans: 'B',
    exp: 'Sleuth không hỗ trợ Spring Boot 3. Micrometer Observation API thống nhất metrics và tracing; Micrometer Tracing cung cấp facade với bridge Brave/OpenTelemetry, tự đưa traceId/spanId vào MDC để log. Exporter gửi dữ liệu tới Zipkin, Jaeger, Tempo...',
    tags: ['observability', 'micrometer', 'tracing'], sec: 35, ver: 'Spring Boot 3.0+',
  },
  {
    id: 'SB-008', topic: 'application.properties và application.yml', d: 'i', cat: 'theory',
    q: 'Ứng dụng chạy với profile `prod`. `application.yml` có `app.page-size: 20`, `application-prod.yml` có `app.page-size: 50`. Giá trị nào được dùng, và điều gì xảy ra với các thuộc tính chỉ có trong application.yml?',
    opts: [
      '20; application-prod.yml bị bỏ qua',
      '50; thuộc tính trong file theo profile ghi đè file chung, các thuộc tính khác của application.yml vẫn được áp dụng',
      '50; toàn bộ application.yml bị bỏ qua',
      'Lỗi trùng khóa cấu hình',
    ], ans: 'B',
    exp: 'File profile-specific được nạp **bổ sung** và có độ ưu tiên cao hơn file chung, nên chỉ những khóa trùng mới bị ghi đè. Từ Spring Boot 2.4, có thể viết nhiều profile trong một file YAML bằng tài liệu `---` với `spring.config.activate.on-profile: prod`.',
    tags: ['profile-specific', 'yaml'], sec: 40,
  },
  {
    id: 'SB-009', topic: 'Configuration Properties', d: 'i', cat: 'design',
    q: 'Bạn muốn ứng dụng **không khởi động** nếu thiếu `partner.base-url` hoặc `partner.timeout` âm, thay vì lỗi lúc runtime. Cách làm phù hợp?',
    code: `
@ConfigurationProperties(prefix = "partner")
public record PartnerProperties(String baseUrl, Duration timeout) { }`,
    opts: [
      'Kiểm tra null trong từng service sử dụng',
      'Thêm `@Validated` cho class properties và constraint như `@NotBlank String baseUrl`, `@NotNull Duration timeout` (kèm kiểm tra dương), có spring-boot-starter-validation trên classpath',
      'Dùng @Value với giá trị mặc định',
      'Đặt giá trị mặc định trong code',
    ], ans: 'B',
    exp: 'Bean Validation được áp dụng lúc binding cấu hình; vi phạm khiến context khởi động thất bại với thông báo rõ ràng (fail-fast). Record + constructor binding giúp properties bất biến. Đăng ký bằng `@EnableConfigurationProperties` hoặc `@ConfigurationPropertiesScan`.',
    tags: ['configurationproperties', 'validation', 'fail-fast'], sec: 45, ver: 'Spring Boot 3',
  },
  {
    id: 'SB-010', topic: 'Embedded Server', d: 'a', cat: 'scenario',
    q: 'Spring MVC trên embedded Tomcat (cấu hình mặc định, không dùng virtual threads). Một API downstream chậm khiến mọi request treo 30 giây. Khi tải tăng, ứng dụng ngừng phản hồi cả health check. Giải thích đúng nhất?',
    opts: [
      'Tomcat chỉ xử lý 1 request mỗi lần',
      'Tomcat dùng thread-per-request với pool tối đa mặc định 200 thread (`server.tomcat.threads.max`). Khi mọi thread bị chặn chờ downstream, request mới phải xếp hàng (accept-count) rồi bị từ chối. Cần timeout cho HTTP client, circuit breaker/bulkhead',
      'Do JVM hết Metaspace',
      'Do Jackson serialize chậm',
    ], ans: 'B',
    exp: 'Mô hình servlet truyền thống chặn một thread suốt thời gian xử lý request. Không đặt timeout cho lời gọi ra ngoài là nguyên nhân phổ biến gây "thread starvation" lan truyền. Biện pháp: connect/read timeout hợp lý, Resilience4j circuit breaker + bulkhead, tách thread pool cho tác vụ chậm, hoặc virtual threads (Boot 3.2+ với Java 21) — vẫn cần timeout.',
    tags: ['tomcat', 'thread-pool', 'timeout'], sec: 60,
  },
  {
    id: 'SB-011', topic: 'REST Controllers', d: 'i', cat: 'design',
    q: 'API `POST /api/orders` tạo đơn hàng mới thành công. Response nào theo đúng chuẩn REST nhất?',
    opts: [
      '200 OK với body là "success"',
      '201 Created, header `Location: /api/orders/{id}` và body là representation của đơn hàng vừa tạo',
      '204 No Content',
      '302 Found chuyển hướng tới trang đơn hàng',
    ], ans: 'B',
    exp: 'Trong Spring: `return ResponseEntity.created(URI.create("/api/orders/" + id)).body(dto);` hoặc dùng `ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")`. 201 thông báo tài nguyên mới đã được tạo; Location cho biết URI của nó.',
    tags: ['rest', 'status-code', 'responseentity'], sec: 35,
  },
  {
    id: 'SB-012', topic: 'Global Exception Handling', d: 'i', cat: 'output',
    q: 'Service ném `OrderNotFoundException extends EntityNotFoundException` (đều là RuntimeException). Response trả về status nào?',
    code: `
@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(Exception.class)
    ResponseEntity<ProblemDetail> handleAll(Exception e) {
        return ResponseEntity.status(500).body(ProblemDetail.forStatus(500));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    ResponseEntity<ProblemDetail> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(404).body(ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage()));
    }
}`,
    opts: ['500', '404', 'Tùy thứ tự khai báo method', '400'], ans: 'B',
    exp: 'Trong cùng một @ControllerAdvice, Spring chọn @ExceptionHandler có kiểu exception **gần nhất** với exception thực tế trong hệ phân cấp (dùng ExceptionDepthComparator), không phụ thuộc thứ tự khai báo. OrderNotFoundException gần EntityNotFoundException hơn Exception → 404. `ProblemDetail` (RFC 7807/9457) có sẵn từ Spring 6.',
    tags: ['exceptionhandler', 'controlleradvice', 'problemdetail'], sec: 50, ver: 'Spring 6',
  },
  {
    id: 'SB-013', topic: 'Global Exception Handling', d: 'a', cat: 'design',
    q: 'Thiết kế xử lý lỗi toàn cục cho REST API production. Phương án nào tốt nhất?',
    opts: [
      'Trả về stack trace đầy đủ trong response để client dễ debug',
      'Dùng @RestControllerAdvice ánh xạ exception nghiệp vụ sang status phù hợp (400/404/409/422), trả body thống nhất (ví dụ ProblemDetail có type, title, detail, errorCode, traceId); lỗi không mong đợi trả 500 với thông điệp chung và log đầy đủ ở server',
      'Mỗi controller tự try/catch và trả về 200 kèm trường success=false',
      'Để Spring tự xử lý, mọi lỗi trả về 500',
    ], ans: 'B',
    exp: 'Response lỗi nhất quán giúp client xử lý dễ dàng; traceId/correlationId giúp đối chiếu log. Không lộ stack trace, câu SQL hay thông tin nội bộ (rủi ro bảo mật). Trả 200 cho lỗi phá vỡ ngữ nghĩa HTTP và làm sai lệch monitoring, retry, cache.',
    tags: ['error-handling', 'problemdetail', 'api-design'], sec: 45,
  },
  {
    id: 'SB-014', topic: 'Validation', d: 'b', cat: 'bug',
    q: 'DTO có `@NotBlank String email;` và `@Positive int quantity;` nhưng request với email rỗng vẫn đi vào service. Vì sao?',
    code: `
@PostMapping("/orders")
public OrderDto create(@RequestBody CreateOrderRequest req) {
    return service.create(req);
}`,
    opts: [
      'Do thiếu @Validated trên service',
      'Thiếu `@Valid` (hoặc `@Validated`) trước `@RequestBody` nên Spring không kích hoạt Bean Validation cho tham số',
      'Do @NotBlank chỉ dùng cho entity',
      'Do JSON không hỗ trợ validation',
    ], ans: 'B',
    exp: 'Constraint trên DTO chỉ được kiểm tra khi tham số được đánh dấu `@Valid`/`@Validated` (và có `spring-boot-starter-validation`). Khi vi phạm, Spring ném `MethodArgumentNotValidException` → 400 Bad Request; nên xử lý trong @RestControllerAdvice để trả danh sách lỗi theo field. Với object lồng nhau, field con cũng cần `@Valid`.',
    tags: ['validation', 'valid', 'requestbody'], sec: 35,
  },
  {
    id: 'SB-015', topic: 'Validation', d: 'i', cat: 'theory',
    q: 'Cần validate `startDate` phải trước `endDate` trong cùng một request DTO. Cách tiếp cận phù hợp với Bean Validation?',
    opts: [
      'Đặt @Past trên startDate và @Future trên endDate',
      'Viết class-level constraint tùy chỉnh (annotation + ConstraintValidator kiểm tra cả object), hoặc method `@AssertTrue boolean isDateRangeValid()`',
      'Không thể validate quan hệ giữa hai field',
      'Dùng @Pattern trên cả hai field',
    ], ans: 'B',
    exp: 'Annotation trên field chỉ thấy một giá trị. Ràng buộc liên field cần constraint ở mức class (cross-field) hoặc `@AssertTrue` trên getter. Quy tắc nghiệp vụ phức tạp, cần truy vấn DB (ví dụ email đã tồn tại) nên đặt ở tầng service.',
    tags: ['validation', 'cross-field'], sec: 40,
  },
  {
    id: 'SB-016', topic: 'Logging', d: 'i', cat: 'perf',
    q: 'Dòng log sau nằm trong vòng lặp xử lý 1 triệu bản ghi, production đặt log level INFO. Vấn đề?',
    code: `
log.debug("Processing record " + record.getId() + " payload=" + toJson(record));`,
    opts: [
      'Không có vấn đề vì DEBUG bị tắt',
      'Chuỗi và `toJson(record)` vẫn được tính trước khi gọi log.debug dù DEBUG bị tắt; nên dùng placeholder `log.debug("Processing {} payload={}", id, ...)` và với tính toán đắt thì kiểm tra `log.isDebugEnabled()` hoặc dùng supplier (SLF4J 2 fluent API)',
      'Logback không hỗ trợ DEBUG',
      'Phải dùng System.out.println cho nhanh',
    ], ans: 'B',
    exp: 'Đối số Java được đánh giá trước khi gọi method. Placeholder trì hoãn việc format chuỗi, nhưng `toJson(record)` vẫn chạy nếu truyền trực tiếp làm tham số — cần guard hoặc lazy supplier (`log.atDebug().addArgument(() -> toJson(record)).log(...)`). Ngoài ra, không log toàn bộ payload chứa dữ liệu cá nhân.',
    tags: ['logging', 'slf4j', 'performance'], sec: 45,
  },
  {
    id: 'SB-017', topic: 'Logging', d: 'a', cat: 'design',
    q: 'Một request đi qua controller → service → nhiều lời gọi async và gọi sang service khác. Khi có lỗi, rất khó lọc toàn bộ log của **một** request. Giải pháp phù hợp?',
    opts: [
      'Tăng log level lên DEBUG toàn hệ thống',
      'Gán correlation/trace ID cho mỗi request (nhận từ header hoặc tạo mới), đưa vào MDC để mọi dòng log tự kèm ID, truyền tiếp qua header khi gọi service khác và sang thread async; dùng structured logging (JSON) để tìm kiếm',
      'Ghi log ra nhiều file theo tên class',
      'In thêm timestamp chi tiết tới nano giây',
    ], ans: 'B',
    exp: 'MDC gắn ngữ cảnh theo thread; Micrometer Tracing tự đưa traceId/spanId vào MDC. Với thread pool/async cần truyền context (TaskDecorator, context-propagation). Nhớ xóa MDC sau request để không rò sang request khác. Log tập trung (ELK/Loki) + ID giúp truy vết end-to-end.',
    tags: ['logging', 'mdc', 'correlation-id'], sec: 50,
  },
  {
    id: 'SB-018', topic: 'Actuator', d: 'a', cat: 'scenario',
    q: 'Một bài pentest phát hiện ứng dụng production công khai `/actuator/env` và `/actuator/heapdump` ra Internet. Rủi ro và cách xử lý đúng?',
    opts: [
      'Không có rủi ro vì chỉ là thông tin kỹ thuật',
      'Rủi ro lộ cấu hình, secret (một phần có thể bị che nhưng heap dump chứa toàn bộ dữ liệu trong bộ nhớ: mật khẩu, token, dữ liệu khách hàng). Chỉ expose endpoint cần thiết (health, info, prometheus), tách management port nội bộ, và bảo vệ bằng Spring Security',
      'Chỉ cần đổi base path thành /manage',
      'Tắt toàn bộ Actuator',
    ], ans: 'B',
    exp: 'Mặc định Spring Boot chỉ expose `health` qua HTTP; cấu hình `management.endpoints.web.exposure.include=*` là nguyên nhân thường gặp. Đổi đường dẫn chỉ là che giấu (security through obscurity). Nên dùng `management.server.port` riêng không public, whitelist endpoint, phân quyền. Tắt hẳn Actuator làm mất khả năng giám sát.',
    tags: ['actuator', 'security', 'heapdump'], sec: 50,
  },
  {
    id: 'SB-019', topic: 'Health Checks', d: 's', cat: 'design',
    q: 'Ứng dụng chạy trên Kubernetes với liveness và readiness probe. Database tạm thời mất kết nối 2 phút. Cấu hình health nào hợp lý?',
    opts: [
      'Đưa DB health vào liveness để pod bị restart ngay',
      'Liveness chỉ phản ánh trạng thái nội tại của ứng dụng (không phụ thuộc hệ thống ngoài); DB đưa vào readiness (hoặc không đưa vào probe) để pod tạm ngừng nhận traffic thay vì bị restart hàng loạt',
      'Tắt cả hai probe',
      'Dùng một endpoint /actuator/health chung cho cả hai',
    ], ans: 'B',
    exp: 'Nếu liveness phụ thuộc DB, sự cố DB khiến **mọi** pod bị restart liên tục (cascading failure) mà không giải quyết được gì, còn làm tăng tải khi DB phục hồi. Spring Boot cung cấp nhóm `/actuator/health/liveness` và `/actuator/health/readiness` (tự bật trên Kubernetes); có thể thêm indicator vào nhóm readiness qua `management.endpoint.health.group.readiness.include`. Cũng cần cân nhắc: nếu mọi pod cùng not-ready thì service không còn endpoint nào.',
    tags: ['health', 'liveness', 'readiness', 'kubernetes'], sec: 60,
  },
  {
    id: 'SB-020', topic: 'Application Startup', d: 'i', cat: 'theory',
    q: 'Cần chạy logic nạp dữ liệu tham chiếu **sau khi** ApplicationContext đã khởi tạo xong toàn bộ bean. Lựa chọn nào phù hợp?',
    opts: [
      'Đặt logic trong constructor của bean',
      'Implement `ApplicationRunner`/`CommandLineRunner`, hoặc lắng nghe `ApplicationReadyEvent`',
      'Dùng static block',
      'Dùng @Bean method trả về null',
    ], ans: 'B',
    exp: 'Runner được gọi sau khi context refresh xong (trước ApplicationReadyEvent); `ApplicationReadyEvent` phát ra khi ứng dụng sẵn sàng phục vụ. Logic chạy lâu trong runner sẽ trì hoãn trạng thái ready (và readiness probe). Constructor/@PostConstruct chạy khi bean khác có thể chưa sẵn sàng và proxy chưa được áp dụng.',
    tags: ['applicationrunner', 'startup', 'applicationreadyevent'], sec: 35,
  },
  {
    id: 'SB-021', topic: 'ApplicationContext', d: 'b', cat: 'debug',
    q: 'Ứng dụng dừng ngay khi khởi động với log: "APPLICATION FAILED TO START — Parameter 0 of constructor in com.acme.OrderService required a bean of type \'com.acme.PaymentClient\' that could not be found." Nguyên nhân **không** khả dĩ là gì?',
    opts: [
      'PaymentClient không có annotation stereotype (@Component/@Service) và cũng không được khai báo bằng @Bean',
      'PaymentClient nằm ngoài package được component scan',
      'Bean PaymentClient có @ConditionalOnProperty mà property không được bật ở môi trường này',
      'OrderService dùng constructor injection thay vì field injection',
    ], ans: 'D',
    exp: 'Constructor injection không gây lỗi này; nó chỉ làm lỗi lộ ra sớm. Ba nguyên nhân còn lại đều khiến bean không tồn tại trong ApplicationContext. Mẹo: chạy với `--debug` để xem condition report, kiểm tra profile đang active.',
    tags: ['nosuchbean', 'startup-failure'], sec: 40,
  },
  {
    id: 'SB-022', topic: 'Các lỗi thường gặp khi triển khai production', d: 'a', cat: 'scenario',
    q: 'Mỗi lần rolling deploy trên Kubernetes, một số request đang xử lý bị lỗi 502/connection reset. Biện pháp nào giải quyết đúng gốc?',
    opts: [
      'Tăng số replica',
      'Bật graceful shutdown (`server.shutdown=graceful`, mặc định từ Boot 3.4) với `spring.lifecycle.timeout-per-shutdown-phase`, thêm preStop hook ngắn để load balancer kịp gỡ pod, và đặt terminationGracePeriodSeconds lớn hơn thời gian shutdown',
      'Tắt readiness probe',
      'Deploy vào ban đêm',
    ], ans: 'B',
    exp: 'Khi nhận SIGTERM, ứng dụng nên ngừng nhận request mới nhưng hoàn thành request đang xử lý. Có độ trễ giữa lúc pod bị đánh dấu terminating và lúc endpoint bị gỡ khỏi Service/Ingress, nên preStop `sleep` vài giây giúp tránh gửi request tới pod đang tắt. Thời gian chờ của Kubernetes phải đủ dài, nếu không pod bị SIGKILL.',
    tags: ['graceful-shutdown', 'kubernetes', 'deployment'], sec: 60, ver: 'Spring Boot 2.3+',
  },
  {
    id: 'SB-023', topic: 'Các lỗi thường gặp khi triển khai production', d: 'i', cat: 'scenario',
    q: 'Ứng dụng chạy tốt ở local nhưng trên server production luôn kết nối vào database của môi trường dev. Nguyên nhân phổ biến nhất?',
    opts: [
      'JDBC driver lỗi',
      'Profile/cấu hình không đúng: `spring.profiles.active` không được đặt (hoặc sai) trên server, nên dùng giá trị mặc định trong application.yml đang trỏ tới dev; hoặc biến môi trường ghi đè không được truyền vào container',
      'Do DNS cache của JVM',
      'Do Hibernate tự chọn database',
    ], ans: 'B',
    exp: 'Nguyên tắc: file cấu hình mặc định không nên chứa thông tin kết nối thật của bất kỳ môi trường nào; mỗi môi trường cấp cấu hình qua biến môi trường/secret. Ghi log profile đang active và URL (đã che mật khẩu) lúc startup giúp phát hiện nhanh. Có thể làm ứng dụng fail-fast nếu thiếu cấu hình bắt buộc.',
    tags: ['profile', 'configuration', 'production'], sec: 40,
  },
  {
    id: 'SB-024', topic: 'REST Controllers', d: 'b', cat: 'theory',
    q: 'Với endpoint `GET /api/users/{id}/orders?status=PAID&page=2`, cách bind tham số nào đúng?',
    opts: [
      '@RequestParam Long id, @PathVariable String status',
      '@PathVariable Long id, @RequestParam String status, @RequestParam int page',
      '@RequestBody Long id, @RequestParam String status',
      '@RequestHeader Long id, @PathVariable int page',
    ], ans: 'B',
    exp: '`@PathVariable` lấy giá trị từ đoạn path trong URI template; `@RequestParam` lấy từ query string (hoặc form data). Thường dùng path variable để định danh tài nguyên và query parameter cho lọc, sắp xếp, phân trang. Với Spring Data có thể bind `Pageable` trực tiếp.',
    tags: ['pathvariable', 'requestparam'], sec: 30,
  },
  {
    id: 'SB-025', topic: 'Profiles', d: 'i', cat: 'scenario',
    q: 'Integration test vô tình chạy với cấu hình kết nối tới hệ thống thanh toán thật vì developer đặt `SPRING_PROFILES_ACTIVE=prod` trên máy. Cách phòng ngừa tốt nhất?',
    opts: [
      'Nhắc developer cẩn thận hơn',
      'Trong test dùng `@ActiveProfiles("test")` với cấu hình test riêng (stub/WireMock/Testcontainers), không để thông tin kết nối thật trong repository; credential production chỉ được cấp trong môi trường production',
      'Xóa profile prod',
      'Đặt tất cả cấu hình trong application-test.yml',
    ], ans: 'B',
    exp: '@ActiveProfiles cố định profile cho test context. Quan trọng hơn là tách biệt bí mật: máy dev không có credential production thì không thể kết nối nhầm. Đây là nguyên tắc defense in depth cho cấu hình.',
    tags: ['profile', 'testing', 'secrets'], sec: 40,
  },
  {
    id: 'SB-026', topic: 'REST Controllers', d: 'i', cat: 'theory',
    q: 'Trong Spring Boot (cấu hình Jackson mặc định), field `LocalDateTime createdAt = 2024-05-01T10:15:30` của DTO được serialize thành gì?',
    opts: [
      '[2024,5,1,10,15,30]',
      '"2024-05-01T10:15:30"',
      '1714558530000',
      'Ném InvalidDefinitionException vì không hỗ trợ java.time',
    ], ans: 'B',
    exp: 'Spring Boot tự đăng ký JavaTimeModule (jackson-datatype-jsr310) và tắt `SerializationFeature.WRITE_DATES_AS_TIMESTAMPS`, nên java.time được ghi dạng ISO-8601. Nếu tự tạo `new ObjectMapper()` mà không đăng ký module (Jackson 2.x), sẽ gặp lỗi hoặc dạng mảng. Với API đa múi giờ, nên trả `Instant`/`OffsetDateTime` để có thông tin offset.',
    tags: ['jackson', 'java-time', 'serialization'], sec: 40,
  },
  {
    id: 'SB-027', topic: 'Actuator', d: 'i', cat: 'theory',
    q: 'Gọi `GET /actuator/health` với cấu hình mặc định của Spring Boot (có DataSource, Redis). Response chứa gì?',
    opts: [
      'Chi tiết từng thành phần (db, redis, diskSpace) kèm thông tin kết nối',
      'Chỉ trạng thái tổng hợp `{"status":"UP"}` (hoặc DOWN); chi tiết từng thành phần chỉ hiện khi cấu hình `management.endpoint.health.show-details` (ví dụ `when-authorized`)',
      'Danh sách mọi bean',
      'Lỗi 404 vì health chưa được bật',
    ], ans: 'B',
    exp: 'Mặc định `show-details=never` để tránh lộ thông tin hạ tầng. Trạng thái tổng hợp được tính từ mọi HealthIndicator: chỉ cần một thành phần DOWN thì tổng là DOWN (và HTTP 503) — cân nhắc khi dùng endpoint này cho probe của Kubernetes (xem nhóm liveness/readiness).',
    tags: ['actuator', 'health'], sec: 35,
  },
  {
    id: 'SB-028', topic: 'Configuration Properties', d: 'i', cat: 'debug',
    q: 'File cấu hình có `payment.max-retry: 3`. Class `@ConfigurationProperties(prefix = "payment") record PaymentProps(int maxRetry)` nhận đúng giá trị 3. Nếu đổi prefix thành `"Payment"` hoặc `"payMent"` thì sao?',
    opts: [
      'Vẫn hoạt động vì relaxed binding',
      'Ứng dụng báo lỗi khi khởi động: prefix phải ở dạng canonical (chữ thường, kebab-case, ví dụ "payment" hoặc "my-app"). Relaxed binding áp dụng cho **nguồn** cấu hình (max-retry, maxRetry, MAX_RETRY), không áp dụng cho prefix khai báo trong code',
      'maxRetry nhận giá trị 0',
      'Spring tự đổi prefix thành chữ thường',
    ], ans: 'B',
    exp: 'Spring Boot kiểm tra prefix hợp lệ (`InvalidConfigurationPropertyNameException`). Trong file cấu hình nên dùng kebab-case (`max-retry`) — dạng khuyến nghị; biến môi trường dùng `PAYMENT_MAXRETRY`.',
    tags: ['configurationproperties', 'relaxed-binding'], sec: 45,
  },
  {
    id: 'SB-029', topic: 'Embedded Server', d: 'b', cat: 'theory',
    q: 'Ứng dụng Spring Boot web được đóng gói thành file jar và chạy bằng `java -jar app.jar`. Web server nằm ở đâu?',
    opts: [
      'Phải cài Tomcat riêng trên server và copy jar vào thư mục webapps',
      'Server (mặc định Tomcat) được nhúng sẵn trong jar như một thư viện và được khởi động bởi chính ứng dụng; cấu hình qua `server.*` (port, context-path, threads…)',
      'Spring Boot không hỗ trợ web server',
      'Dùng web server của hệ điều hành',
    ], ans: 'B',
    exp: 'Embedded server đơn giản hóa triển khai (một artifact chạy độc lập, phù hợp container). Vẫn có thể đóng gói WAR để deploy lên server ngoài (`SpringBootServletInitializer`) khi tổ chức yêu cầu. `server.port=0` chọn cổng ngẫu nhiên — tiện cho test.',
    tags: ['embedded-server', 'tomcat', 'executable-jar'], sec: 25,
  },
  {
    id: 'SB-030', topic: 'Starter Dependencies', d: 'i', cat: 'debug',
    q: 'Dự án dùng Spring Boot parent 3.2. Một developer thêm `<version>2.13.0</version>` cho `jackson-databind` để "sửa lỗi bảo mật". Sau đó serialize bị lỗi `NoSuchMethodError`. Nguyên nhân và cách đúng?',
    opts: [
      'Do Jackson không hỗ trợ Java 17',
      'Ghi đè version một module lẻ làm lệch với các module Jackson khác do Spring Boot BOM quản lý (core, annotations, datatype-jsr310...). Nên nâng cấp Spring Boot patch, hoặc ghi đè **property version** của BOM (`<jackson-bom.version>`) để mọi module cùng phiên bản',
      'Phải xóa thư mục .m2',
      'Do thiếu @EnableJackson',
    ], ans: 'B',
    exp: '`spring-boot-dependencies` quản lý phiên bản tương thích của hàng trăm thư viện. Ghi đè từng artifact dễ gây "dependency hell". Dùng `mvn dependency:tree` để kiểm tra, và ưu tiên cơ chế property/BOM mà Spring Boot hỗ trợ.',
    tags: ['starter', 'bom', 'dependency-management'], sec: 50,
  },
  {
    id: 'SB-031', topic: 'ApplicationContext', d: 'a', cat: 'debug',
    q: 'Code khởi động cache dùng `@EventListener(ContextRefreshedEvent.class)` và thấy dữ liệu bị nạp **hai lần** khi ứng dụng có thêm một child context (ví dụ do thư viện/Spring Cloud tạo). Event nào phù hợp hơn để chạy một lần khi ứng dụng đã sẵn sàng?',
    opts: [
      'ContextClosedEvent',
      '`ApplicationReadyEvent` — phát một lần bởi SpringApplication sau khi context refresh và các runner chạy xong; ContextRefreshedEvent phát cho **mỗi context** được refresh (kể cả context con và mỗi lần refresh)',
      'ApplicationStartingEvent',
      'Không có cách nào, phải dùng biến static để chặn lần hai',
    ], ans: 'B',
    exp: 'ContextRefreshedEvent là event của Spring Framework cho từng ApplicationContext; trong hệ phân cấp context, listener ở context cha có thể nhận event của context con. ApplicationReadyEvent là event vòng đời của Spring Boot cho toàn ứng dụng, đồng thời gắn với trạng thái readiness.',
    tags: ['applicationreadyevent', 'contextrefreshedevent'], sec: 50,
  },
  {
    id: 'SB-032', topic: 'ApplicationContext', d: 'i', cat: 'design',
    q: 'Một class tiện ích static được viết để lấy bean ở bất cứ đâu: `SpringContext.getBean(OrderService.class)` (lưu ApplicationContext vào biến static qua `ApplicationContextAware`). Đánh giá?',
    opts: [
      'Thực hành tốt vì tiện lợi',
      'Đây là anti-pattern **Service Locator**: che giấu dependency, khó test, phụ thuộc thứ tự khởi tạo (gọi trước khi context sẵn sàng → null), hỏng khi có nhiều context (test). Ưu tiên dependency injection qua constructor; chỉ dùng ở biên tích hợp với code không do Spring quản lý',
      'Bắt buộc phải dùng để lấy bean prototype',
      'Nhanh hơn constructor injection',
    ], ans: 'B',
    exp: 'Nếu cần lấy bean động (theo tên, prototype), inject `ObjectProvider` hoặc `Map<String, T>` thay vì tra cứu context toàn cục.',
    tags: ['service-locator', 'applicationcontextaware'], sec: 40,
  },
  {
    id: 'SB-033', topic: 'application.properties và application.yml', d: 'b', cat: 'theory',
    q: 'Cấu hình dạng properties `app.allowed-origins[0]=https://a.com` và `app.allowed-origins[1]=https://b.com` tương đương với YAML nào?',
    lang: 'yaml', code: `
# (1)
app:
  allowed-origins: https://a.com, https://b.com
# (2)
app:
  allowed-origins:
    - https://a.com
    - https://b.com
# (3)
app.allowed-origins:
  0: https://a.com`,
    opts: ['(1)', '(2)', '(3)', 'Không có cách biểu diễn list trong YAML'], ans: 'B', fixed: true,
    exp: 'YAML biểu diễn list bằng dấu `-` với thụt lề nhất quán (dùng dấu cách, không dùng tab). Lưu ý: Spring Boot cũng chuyển chuỗi phân tách bằng dấu phẩy thành List khi binding vào `List<String>`, nhưng (2) mới là cú pháp list YAML chuẩn và tương đương trực tiếp với dạng chỉ số.',
    tags: ['yaml', 'list', 'configuration'], sec: 35,
  },
  {
    id: 'SB-034', topic: 'application.properties và application.yml', d: 'i', cat: 'theory',
    q: 'Thư mục `src/main/resources` chứa **cả** `application.properties` (có `server.port=8081`) và `application.yml` (có `server.port: 8082`). Ứng dụng chạy cổng nào?',
    opts: ['8082', '8081 — khi cả hai định dạng cùng vị trí, file `.properties` được ưu tiên', 'Lỗi xung đột cấu hình', 'Ngẫu nhiên theo thứ tự đọc file'], ans: 'B',
    exp: 'Tài liệu Spring Boot: nếu có cả .properties và YAML ở cùng một vị trí, .properties có độ ưu tiên cao hơn. Thực tế nên chỉ dùng một định dạng trong dự án để tránh nhầm lẫn.',
    tags: ['properties', 'yaml', 'precedence'], sec: 30,
  },
  {
    id: 'SB-035', topic: 'Profiles', d: 'a', cat: 'debug',
    q: 'File `application-dev.yml` chứa `spring.profiles.active: local` (để "kích hoạt thêm" profile local khi chạy dev). Từ Spring Boot 2.4, ứng dụng báo lỗi `InvalidConfigDataPropertyException`. Vì sao và cách đúng?',
    opts: [
      'Do YAML sai thụt lề',
      'Không được đặt `spring.profiles.active` trong file **cấu hình theo profile** (tránh vòng kích hoạt). Dùng **profile groups** trong application.yml: `spring.profiles.group.dev: local` — kích hoạt dev sẽ kéo theo local',
      'Do profile local không tồn tại',
      'Phải đổi tên file thành application-local.yml',
    ], ans: 'B',
    exp: 'Spring Boot 2.4 thiết kế lại cơ chế nạp cấu hình (ConfigData API), cấm một số property trong file theo profile (`spring.profiles.active`, `spring.profiles.include`, `spring.profiles.group`). Profile groups là cách khai báo tổ hợp profile rõ ràng.',
    tags: ['profile', 'profile-groups', 'spring-boot-2.4'], sec: 50, ver: 'Spring Boot 2.4+',
  },
  {
    id: 'SB-036', topic: 'Profiles', d: 'b', cat: 'theory',
    q: 'Chạy ứng dụng Spring Boot trong Docker và muốn kích hoạt profile `prod` mà **không** sửa image. Cách phổ biến nhất?',
    opts: [
      'Sửa application.yml trong jar',
      'Truyền biến môi trường `SPRING_PROFILES_ACTIVE=prod` (ví dụ `docker run -e SPRING_PROFILES_ACTIVE=prod ...` hoặc `env` trong Kubernetes)',
      'Đổi tên jar thành app-prod.jar',
      'Thêm @Profile("prod") vào main class',
    ], ans: 'B',
    exp: 'Biến môi trường được relaxed binding thành `spring.profiles.active`. Cách này giữ nguyên artifact giữa các môi trường (build once, deploy many). Cũng có thể truyền tham số `--spring.profiles.active=prod` hoặc `-Dspring.profiles.active=prod`.',
    tags: ['profile', 'docker', 'environment-variable'], sec: 25,
  },
  {
    id: 'SB-037', topic: 'Health Checks', d: 'i', cat: 'theory',
    q: 'Cần thêm vào `/actuator/health` một kiểm tra "kết nối tới cổng thanh toán còn hoạt động". Cách cài đặt chuẩn trong Spring Boot?',
    code: `
@Component
public class PaymentGatewayHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        boolean ok = gateway.ping(Duration.ofMillis(500));
        return ok ? Health.up().build()
                  : Health.down().withDetail("gateway", "unreachable").build();
    }
}`,
    opts: [
      'Không hợp lệ, phải viết controller /health riêng',
      'Hợp lệ: bean `HealthIndicator` được tự động gộp vào health tổng hợp với tên `paymentGateway` (bỏ hậu tố HealthIndicator); cần timeout ngắn và cân nhắc có nên đưa vào nhóm readiness hay không',
      'Chỉ hoạt động khi thêm @EnableHealth',
      'Phải trả về String "UP"',
    ], ans: 'B',
    exp: 'Health tổng hợp DOWN nếu bất kỳ indicator nào DOWN. Với dependency bên ngoài, việc đưa vào probe cần thận trọng: đối tác sự cố không nên làm Kubernetes restart pod của bạn. Có thể cấu hình nhóm: `management.endpoint.health.group.readiness.include=db,paymentGateway`.',
    tags: ['healthindicator', 'actuator'], sec: 40,
  },
  {
    id: 'SB-038', topic: 'Health Checks', d: 'a', cat: 'scenario',
    q: 'Readiness probe gọi `/actuator/health` mỗi 5 giây với timeout 1 giây. Health có indicator gọi API đối tác (đôi khi mất 3 giây). Khi đối tác chậm, mọi pod bị đánh dấu not-ready cùng lúc và service mất toàn bộ endpoint. Cải tiến hợp lý?',
    opts: [
      'Tăng số pod',
      'Không để probe phụ thuộc trực tiếp vào hệ thống ngoài chậm: tách nhóm health (`/actuator/health/readiness` chỉ gồm thành phần nội tại), kiểm tra dependency ngoài bằng metrics/cảnh báo hoặc chạy nền và cache kết quả; đặt timeout probe phù hợp',
      'Tắt readiness probe',
      'Gọi API đối tác hai lần để chắc chắn',
    ], ans: 'B',
    exp: 'Probe phải nhanh và phản ánh việc "pod này có xử lý được request không". Phụ thuộc đối tác khiến lỗi bên ngoài lan thành sự cố toàn hệ thống. Mất kết nối đối tác nên xử lý bằng circuit breaker/fallback ở tầng nghiệp vụ và cảnh báo vận hành.',
    tags: ['readiness', 'probe', 'cascading-failure'], sec: 55,
  },
  {
    id: 'SB-039', topic: 'Application Startup', d: 'i', cat: 'runtime',
    q: 'Một `CommandLineRunner` nạp dữ liệu tham chiếu và ném RuntimeException do DB thiếu bảng. Điều gì xảy ra với ứng dụng?',
    opts: [
      'Exception bị log, ứng dụng vẫn chạy bình thường',
      'Khởi động thất bại: SpringApplication báo lỗi, đóng context và tiến trình thoát với mã khác 0',
      'Runner được retry tự động 3 lần',
      'Chỉ bean runner bị vô hiệu hóa',
    ], ans: 'B',
    exp: 'Runner là một phần của quá trình khởi động; exception trong đó làm `SpringApplication.run` thất bại (fail-fast). Nếu tác vụ không bắt buộc cho việc phục vụ request, hãy bắt lỗi và log, hoặc chạy bất đồng bộ sau ApplicationReadyEvent.',
    tags: ['commandlinerunner', 'startup-failure'], sec: 30,
  },
  {
    id: 'SB-040', topic: 'Application Startup', d: 'a', cat: 'tradeoff',
    q: 'Bật `spring.main.lazy-initialization=true` giúp ứng dụng khởi động nhanh hơn 40%. Rủi ro chính khi dùng ở production?',
    opts: [
      'Không có rủi ro',
      'Lỗi cấu hình/khởi tạo bean bị phát hiện **muộn** (khi request đầu tiên dùng tới bean) thay vì lúc deploy; request đầu tiên chậm hơn; readiness có thể báo sẵn sàng trong khi bean quan trọng chưa được kiểm chứng',
      'Bean singleton thành prototype',
      'Không dùng được @Transactional',
    ], ans: 'B',
    exp: 'Lazy initialization hữu ích cho dev (khởi động nhanh) hoặc ứng dụng serverless; ở production thường ưu tiên fail-fast. Có thể loại trừ một số bean khỏi lazy bằng `@Lazy(false)`. Các cách khác để khởi động nhanh: giảm auto-config thừa, AppCDS, CRaC, native image.',
    tags: ['lazy-initialization', 'startup', 'fail-fast'], sec: 45,
  },
  {
    id: 'SB-041', topic: 'Spring Boot Auto-Configuration', d: 's', cat: 'debug',
    q: 'Trong một class `@Configuration` **của ứng dụng** (không phải auto-configuration), bạn viết `@Bean @ConditionalOnMissingBean(Clock.class) Clock defaultClock()` để chỉ tạo nếu chưa có bean Clock khác. Đôi khi vẫn có hai bean Clock, đôi khi không. Vì sao?',
    opts: [
      'Do Clock không phải interface',
      'Điều kiện `@ConditionalOnMissingBean` được đánh giá dựa trên các bean definition **đã đăng ký tại thời điểm đó**; với cấu hình người dùng, thứ tự xử lý các class không được đảm bảo. Annotation này chỉ đáng tin cậy trong auto-configuration (được xử lý sau cấu hình người dùng và có thể sắp thứ tự bằng @AutoConfiguration(after/before))',
      'Do thiếu @Primary',
      'Do Clock là final class',
    ], ans: 'B',
    exp: 'Tài liệu Spring Boot khuyến cáo chỉ dùng các condition dựa trên bean trong auto-configuration class. Trong ứng dụng, hãy khai báo tường minh hoặc dùng `@Primary`/profile/property để chọn bean.',
    tags: ['conditionalonmissingbean', 'auto-configuration', 'ordering'], sec: 65,
  },
  {
    id: 'SB-042', topic: 'Starter Dependencies', d: 'b', cat: 'theory',
    q: '`spring-boot-starter-test` cung cấp sẵn những thư viện nào (Spring Boot 3)?',
    opts: [
      'Chỉ JUnit 4',
      'JUnit Jupiter (JUnit 5), Spring Test & Spring Boot Test, AssertJ, Hamcrest, Mockito, JSONassert, JsonPath, Awaitility…',
      'Selenium và Cucumber',
      'Testcontainers và WireMock',
    ], ans: 'B',
    exp: 'Testcontainers và WireMock cần thêm dependency riêng (Spring Boot quản lý version Testcontainers qua BOM). Starter test được khai báo scope `test` để không vào artifact production.',
    tags: ['starter-test', 'junit5', 'mockito'], sec: 25,
  },
  {
    id: 'SB-043', topic: 'Configuration Properties', d: 'i', cat: 'theory',
    q: 'Với `@ConfigurationProperties("client") record ClientProps(Duration timeout)` và cấu hình `client.timeout=30` (không có đơn vị), giá trị `timeout` là bao nhiêu?',
    opts: ['30 giây', '30 mili giây', '30 phút', 'Lỗi binding vì thiếu đơn vị'], ans: 'B',
    exp: 'Khi binding `Duration` từ số không có đơn vị, Spring Boot mặc định hiểu là **mili giây** (có thể đổi bằng `@DurationUnit(ChronoUnit.SECONDS)`). Nên luôn ghi đơn vị rõ ràng: `30s`, `500ms`, `2m`, hoặc định dạng ISO-8601 `PT30S`. Tương tự `DataSize` mặc định là byte (`10MB`).',
    tags: ['duration', 'configurationproperties', 'binding'], sec: 35,
  },
  {
    id: 'SB-044', topic: 'Embedded Server', d: 'i', cat: 'debug',
    q: 'API upload hóa đơn PDF hoạt động với file nhỏ, nhưng file 3MB bị từ chối với `MaxUploadSizeExceededException`. Nguyên nhân và cấu hình cần chỉnh?',
    opts: [
      'Tomcat không hỗ trợ file PDF',
      'Giới hạn multipart mặc định của Spring Boot là 1MB mỗi file (`spring.servlet.multipart.max-file-size`) và 10MB mỗi request (`max-request-size`). Tăng theo nhu cầu nghiệp vụ, và xử lý exception để trả 413/400 rõ ràng',
      'Phải dùng PUT thay vì POST',
      'Do JSON không chứa được file',
    ], ans: 'B',
    exp: 'Giới hạn tồn tại để bảo vệ server khỏi request quá lớn. Nhớ kiểm tra cả giới hạn ở các tầng phía trước (Nginx `client_max_body_size`, API Gateway, Ingress) — thường là nguyên nhân 413 khi đã sửa cấu hình Spring. File rất lớn nên upload trực tiếp lên object storage bằng presigned URL.',
    tags: ['multipart', 'upload', 'limits'], sec: 40,
  },
  {
    id: 'SB-045', topic: 'REST Controllers', d: 'i', cat: 'design',
    q: 'Khi không tìm thấy đơn hàng, cách nào giúp controller gọn và xử lý lỗi nhất quán trên toàn API?',
    opts: [
      'Mỗi controller tự try/catch và trả `ResponseEntity.status(404).body("not found")`',
      'Service ném exception nghiệp vụ (`OrderNotFoundException`); `@RestControllerAdvice` ánh xạ sang 404 với body ProblemDetail thống nhất. (Với trường hợp đơn giản có thể dùng `@ResponseStatus(HttpStatus.NOT_FOUND)` trên class exception hoặc `ResponseStatusException`)',
      'Trả 200 với body null',
      'Trả 500 để client tự hiểu',
    ], ans: 'B',
    exp: 'Tập trung ánh xạ exception → HTTP giúp controller chỉ mô tả "happy path", format lỗi đồng nhất và dễ thay đổi. `ResponseStatusException` tiện cho trường hợp lẻ nhưng rải trong nhiều nơi sẽ khó giữ nhất quán.',
    tags: ['controlleradvice', 'responsestatus', 'error-handling'], sec: 40,
  },
  {
    id: 'SB-046', topic: 'Global Exception Handling', d: 'a', cat: 'debug',
    q: 'Một `OncePerRequestFilter` kiểm tra API key ném `InvalidApiKeyException`. Dù `@RestControllerAdvice` có `@ExceptionHandler(InvalidApiKeyException.class)`, client vẫn nhận lỗi 500 với body mặc định. Vì sao?',
    opts: [
      'Do thiếu @ResponseStatus',
      'Filter chạy **trước** DispatcherServlet; @ControllerAdvice chỉ xử lý exception phát sinh trong quá trình xử lý của DispatcherServlet (controller, interceptor, binding). Exception trong filter phải được xử lý ngay trong filter (ghi response 401) hoặc chuyển qua `HandlerExceptionResolver` được inject vào filter',
      'Do exception phải là checked exception',
      'Do @RestControllerAdvice chỉ bắt RuntimeException',
    ], ans: 'B',
    exp: 'Tương tự, exception trong Spring Security filter được xử lý bởi `AuthenticationEntryPoint`/`AccessDeniedHandler`, không phải ControllerAdvice. Hiểu ranh giới filter vs DispatcherServlet giúp thiết kế xử lý lỗi nhất quán.',
    tags: ['filter', 'controlleradvice', 'dispatcherservlet'], sec: 55,
  },
  {
    id: 'SB-047', topic: 'Validation', d: 'a', cat: 'theory',
    q: 'Service được đánh dấu `@Validated` với method `void register(@Valid UserCommand cmd)`. Controller gọi service với `cmd` có email rỗng (vi phạm `@NotBlank`). Exception nào được ném và client nhận status gì nếu không có handler riêng?',
    opts: [
      '`MethodArgumentNotValidException`, 400',
      '`ConstraintViolationException` (method validation qua AOP proxy); không có handler riêng thì thường thành lỗi **500**',
      'Không có exception vì validation chỉ chạy ở controller',
      '`BindException`, 422',
    ], ans: 'B',
    exp: '`MethodArgumentNotValidException` chỉ phát sinh khi validate `@RequestBody` ở controller. Method validation ở service (cần `@Validated` trên class, chạy bằng proxy) ném `ConstraintViolationException` — cần thêm @ExceptionHandler để trả 400. (Spring 6.1+ có `HandlerMethodValidationException` cho method validation ở tầng controller.)',
    tags: ['validated', 'constraintviolationexception', 'method-validation'], sec: 55,
  },
  {
    id: 'SB-048', topic: 'Logging', d: 'i', cat: 'theory',
    q: 'Vì sao Spring Boot khuyến nghị đặt cấu hình Logback trong `logback-spring.xml` thay vì `logback.xml`?',
    opts: [
      'Vì logback.xml không được hỗ trợ',
      '`logback.xml` được Logback nạp quá sớm, trước khi Spring khởi tạo; `logback-spring.xml` cho phép Spring Boot xử lý các extension như `<springProfile name="prod">` và `<springProperty>` lấy giá trị từ Environment',
      'Vì logback-spring.xml chạy nhanh hơn',
      'Vì logback.xml chỉ dùng cho test',
    ], ans: 'B',
    exp: 'Với cấu hình đơn giản, chỉ cần property `logging.level.*`, `logging.file.name`, `logging.pattern.*`. Đổi log level lúc chạy có thể dùng endpoint `/actuator/loggers` (cần bảo vệ).',
    tags: ['logback', 'springprofile', 'logging'], sec: 35,
  },
  {
    id: 'SB-049', topic: 'Actuator', d: 'i', cat: 'debug',
    q: 'Đội vận hành cần Prometheus scrape metrics của ứng dụng tại `/actuator/prometheus`, nhưng endpoint trả 404. Đã có `spring-boot-starter-actuator`. Còn thiếu gì?',
    opts: [
      'Thiếu @EnablePrometheus',
      'Thêm dependency `micrometer-registry-prometheus` (để có registry định dạng Prometheus) và expose endpoint: `management.endpoints.web.exposure.include=health,info,prometheus`',
      'Prometheus chỉ hỗ trợ ứng dụng WebFlux',
      'Phải viết controller xuất metrics thủ công',
    ], ans: 'B',
    exp: 'Actuator tự cấu hình endpoint khi có registry tương ứng trên classpath; mặc định chỉ `health` được expose qua HTTP. Metrics có sẵn: `http.server.requests`, `jvm.*`, `hikaricp.*`, `tomcat.*`… Nên đặt tag chung (`management.metrics.tags.application`) và tránh label có cardinality cao.',
    tags: ['prometheus', 'micrometer', 'actuator'], sec: 35,
  },
  {
    id: 'SB-050', topic: 'Các lỗi thường gặp khi triển khai production', d: 'a', cat: 'scenario',
    q: 'Sau một lần deploy, vài bảng production bị mất dữ liệu. Điều tra cho thấy profile production vô tình kế thừa `spring.jpa.hibernate.ddl-auto=create-drop` từ cấu hình dev. Bài học và cấu hình đúng cho production?',
    opts: [
      'Dùng `ddl-auto=update` ở production cho an toàn',
      'Production đặt `ddl-auto=validate` (hoặc `none`) và quản lý schema bằng **Flyway/Liquibase** có review; không để giá trị nguy hiểm trong cấu hình mặc định; tài khoản DB của ứng dụng không cần quyền DDL; luôn có backup đã kiểm chứng khôi phục',
      'Tắt Hibernate',
      'Chạy deploy vào cuối tuần',
    ], ans: 'B',
    exp: '`create`/`create-drop` xóa và tạo lại bảng; `update` cũng không an toàn (không xóa cột cũ, có thể tạo thay đổi ngoài dự kiến, không có lịch sử). Nguyên tắc least privilege với tài khoản DB giúp lỗi cấu hình không gây thảm họa. Spring Boot chỉ mặc định `create-drop` cho DB nhúng (H2), còn DB thật mặc định `none`.',
    tags: ['ddl-auto', 'flyway', 'production'], sec: 50,
  },
]);
