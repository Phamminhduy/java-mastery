/* Bài học — Module 7: Spring Boot */
(() => {
  const L = (topic, blocks) => LS.add('spring-boot', topic, blocks);

  L('Spring Boot Auto-Configuration', [
    'Auto-configuration tự cấu hình bean dựa trên **classpath, bean đã có và property**. Mỗi auto-config là một class `@AutoConfiguration` có các điều kiện:',
    '- `@ConditionalOnClass` (có thư viện), `@ConditionalOnMissingBean` (người dùng chưa tự khai báo), `@ConditionalOnProperty`, `@ConditionalOnWebApplication`...',
    '- Bean do người dùng khai báo luôn được ưu tiên — auto-config "lùi lại".',
    '- Đăng ký (Boot 2.7+/3): file `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (Boot 3 bỏ spring.factories cho mục này).',
    '- Debug: chạy với `--debug` để xem Condition Evaluation Report, hoặc `/actuator/conditions`.',
    '- Tắt một auto-config: `@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)`.',
  ]);

  L('Starter Dependencies', [
    'Starter là dependency "gom nhóm" cho một năng lực: `spring-boot-starter-web` (Spring MVC, Tomcat, Jackson), `-data-jpa`, `-security`, `-validation`, `-actuator`, `-test`...',
    '- Phiên bản do **Spring Boot BOM** (`spring-boot-dependencies`) quản lý — thường không ghi version cho dependency được quản lý.',
    '- Cần đổi version một thư viện: ghi đè property của BOM (`<jackson-bom.version>`) thay vì ghi version cho từng artifact.',
    '- Đổi Tomcat sang Jetty/Undertow: exclude `spring-boot-starter-tomcat`, thêm starter tương ứng.',
  ]);

  L('ApplicationContext', [
    '`SpringApplication.run()` tạo và refresh ApplicationContext: nạp cấu hình, tạo bean, khởi động web server, phát các event vòng đời.',
    '- Event theo thứ tự: `ApplicationStartingEvent` → `ApplicationEnvironmentPreparedEvent` → `ApplicationContextInitializedEvent` → `ApplicationPreparedEvent` → `ContextRefreshedEvent` → `ApplicationStartedEvent` → (runners) → `ApplicationReadyEvent`.',
    '- Lỗi "APPLICATION FAILED TO START" thường do thiếu bean (không scan, điều kiện/profile không thỏa), circular dependency, cấu hình sai/thiếu, cổng bị chiếm.',
    '- `FailureAnalyzer` của Boot in thông điệp gợi ý cách sửa — đọc kỹ phần "Action".',
  ]);

  L('application.properties và application.yml', [
    '- Hai định dạng tương đương; YAML gọn cho cấu hình lồng nhau, properties đơn giản và ít lỗi thụt lề.',
    '- Vị trí mặc định: classpath root, `classpath:/config`, thư mục hiện tại, `./config` (nguồn sau ghi đè nguồn trước).',
    '- File theo profile `application-{profile}.yml` được nạp **bổ sung** và ghi đè khóa trùng.',
    '- Nhiều tài liệu trong một YAML: phân cách `---` + `spring.config.activate.on-profile: prod` (Boot 2.4+).',
    { lang: 'yaml', code: `
spring:
  datasource:
    url: \${DB_URL}            # lấy từ biến môi trường
    hikari:
      maximum-pool-size: 20
server:
  shutdown: graceful
---
spring.config.activate.on-profile: dev
logging.level.com.acme: DEBUG` },
  ]);

  L('Configuration Properties', [
    { lang: 'java', code: `
@Validated
@ConfigurationProperties(prefix = "partner")
public record PartnerProperties(
        @NotBlank String baseUrl,
        @NotNull Duration timeout,
        @Min(0) @Max(5) int maxRetry) { }

@SpringBootApplication
@ConfigurationPropertiesScan
public class App { }` },
    '- Binding có kiểu: `Duration` ("5s"), `DataSize` ("10MB"), List, Map, object lồng nhau.',
    '- Validation khi khởi động → thiếu/sai cấu hình là **fail-fast**.',
    '- Prefix phải ở dạng kebab-case chữ thường; trong file dùng `max-retry`, biến môi trường `PARTNER_MAXRETRY`.',
    '- Thêm `spring-boot-configuration-processor` để IDE gợi ý property.',
  ]);

  L('Profiles', [
    '- Kích hoạt: `SPRING_PROFILES_ACTIVE=prod`; có thể nhiều profile `prod,metrics`.',
    '- Profile groups: `spring.profiles.group.prod=proddb,prodmq`.',
    '- `spring.profiles.default` dùng khi không profile nào được kích hoạt.',
    '- Log ra profile đang active khi khởi động giúp phát hiện sai môi trường.',
    '! Không để cấu hình mặc định trỏ tới hệ thống thật; máy dev không nên có credential production.',
  ]);

  L('Embedded Server', [
    'Spring Boot nhúng Tomcat (mặc định), Jetty hoặc Undertow trong executable jar: `java -jar app.jar`.',
    '- Cấu hình: `server.port`, `server.servlet.context-path`, `server.tomcat.threads.max` (mặc định 200), `server.tomcat.accept-count` (100), `server.tomcat.connection-timeout`.',
    '- Mô hình thread-per-request: request chậm chiếm thread; hết thread → request xếp hàng rồi bị từ chối.',
    '- Spring Boot 3.2+ với Java 21: `spring.threads.virtual.enabled=true`.',
    '- WebFlux dùng Netty, mô hình non-blocking event loop.',
  ]);

  L('REST Controllers', [
    { lang: 'java', code: `
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
class OrderController {
    private final OrderService service;

    @GetMapping("/{id}")
    OrderDto get(@PathVariable long id) { return service.find(id); }

    @GetMapping
    Page<OrderDto> list(@RequestParam(required = false) Status status, Pageable pageable) { ... }

    @PostMapping
    ResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrderRequest req) {
        OrderDto dto = service.create(req);
        return ResponseEntity.created(URI.create("/api/orders/" + dto.id())).body(dto);
    }
}` },
    '- `@PathVariable` định danh tài nguyên; `@RequestParam` cho lọc/phân trang; `@RequestBody` + `@Valid` cho body.',
    '- Controller mỏng: không chứa logic nghiệp vụ, không trả entity JPA.',
    '- Jackson của Boot: java.time dạng ISO-8601, bỏ qua field lạ (`FAIL_ON_UNKNOWN_PROPERTIES=false`).',
  ]);

  L('Global Exception Handling', [
    { lang: 'java', code: `
@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail notFound(OrderNotFoundException e) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
        pd.setProperty("code", "ORDER_NOT_FOUND");
        return pd;
    }
    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception e) {
        log.error("Unexpected error", e);
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra");
    }
}` },
    '- Spring chọn handler có kiểu exception **gần nhất** trong hệ phân cấp, không theo thứ tự khai báo.',
    '- `ProblemDetail` (RFC 7807/9457) có sẵn từ Spring 6; bật `spring.mvc.problemdetails.enabled=true` cho lỗi mặc định của Spring MVC.',
    '- Không trả stack trace, câu SQL ra client; kèm traceId để đối chiếu log.',
  ]);

  L('Validation', [
    '- Thêm `spring-boot-starter-validation`; đặt `@Valid`/`@Validated` trước `@RequestBody`.',
    '- Constraint phổ biến: `@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@Positive`, `@Pattern`, `@Past`, `@Future`.',
    '- Lỗi → `MethodArgumentNotValidException` (400); xử lý trong ControllerAdvice để trả danh sách lỗi theo field.',
    '- Object lồng nhau cần `@Valid` trên field; nhóm validation (`groups`) cho create/update khác nhau.',
    '- Ràng buộc liên field: class-level constraint hoặc `@AssertTrue`. Quy tắc cần truy vấn DB đặt ở service.',
    '- Validate tham số `@RequestParam/@PathVariable`: Spring 6.1+ hỗ trợ method validation sẵn cho controller.',
  ]);

  L('Logging', [
    '- Spring Boot dùng SLF4J + Logback mặc định; cấu hình `logging.level.com.acme=DEBUG`, `logback-spring.xml` cho cấu hình nâng cao (rolling, JSON).',
    '- Dùng placeholder: `log.info("Order {} created", id)` — không nối chuỗi; với tính toán đắt dùng `isDebugEnabled()`/lazy argument.',
    '- Log exception kèm stack trace một lần ở nơi xử lý: `log.error("...", e)`.',
    '- **MDC** gắn correlation/trace ID vào mọi dòng log; Micrometer Tracing tự đưa `traceId/spanId` vào MDC.',
    '- Structured logging (JSON) giúp tìm kiếm trên ELK/Loki; Spring Boot 3.4 hỗ trợ sẵn.',
    '! Không log mật khẩu, token, dữ liệu cá nhân, toàn bộ payload. Cấu hình rotation để không đầy đĩa.',
  ]);

  L('Actuator', [
    'Actuator cung cấp endpoint vận hành: `health`, `info`, `metrics`, `prometheus`, `loggers`, `env`, `configprops`, `threaddump`, `heapdump`, `conditions`...',
    '- Mặc định chỉ expose `health` qua HTTP; mở thêm bằng `management.endpoints.web.exposure.include=health,info,prometheus`.',
    '- `/actuator/health` mặc định chỉ trả trạng thái tổng hợp; chi tiết khi `show-details=when-authorized`.',
    '- Đổi log level lúc runtime qua `/actuator/loggers` (cần bảo vệ).',
    '! `env`, `heapdump`, `threaddump` chứa thông tin nhạy cảm — không public; dùng `management.server.port` nội bộ và Spring Security.',
  ]);

  L('Health Checks', [
    '- Health tổng hợp từ các `HealthIndicator` (db, redis, diskSpace, kafka...). Một thành phần DOWN → tổng DOWN, HTTP 503.',
    '- Kubernetes: `/actuator/health/liveness` (ứng dụng còn sống — không phụ thuộc hệ thống ngoài) và `/actuator/health/readiness` (sẵn sàng nhận traffic).',
    '- Đưa DB vào liveness → DB sự cố làm mọi pod restart liên tục (cascading failure). Nên đặt ở readiness hoặc không đưa vào probe.',
    '- Tự viết indicator: implements `HealthIndicator`; thêm vào nhóm `management.endpoint.health.group.readiness.include=db,customCheck`.',
  ]);

  L('Application Startup', [
    '- Logic sau khi context sẵn sàng: `ApplicationRunner`/`CommandLineRunner` hoặc `@EventListener(ApplicationReadyEvent.class)`.',
    '- Runner chạy lâu làm chậm trạng thái ready (readiness probe).',
    '- Tăng tốc khởi động: lazy initialization (`spring.main.lazy-initialization`, đánh đổi lỗi phát hiện muộn), giảm auto-config không dùng, AppCDS, CRaC, GraalVM native image (Boot 3).',
    '- Đo: `ApplicationStartup` + `/actuator/startup` (BufferingApplicationStartup).',
  ]);

  L('Spring Boot 3+ và các thay đổi quan trọng', [
    '- **Java 17+** và **Jakarta EE 9+**: `javax.*` → `jakarta.*` (persistence, servlet, validation).',
    '- Spring Framework 6, Hibernate 6, Spring Security 6 (bỏ `WebSecurityConfigurerAdapter`, `requestMatchers`, `authorizeHttpRequests`).',
    '- Trailing slash matching tắt mặc định: `/api/orders/` không còn khớp `/api/orders`.',
    '- Observability: Micrometer Observation + Micrometer Tracing thay Spring Cloud Sleuth.',
    '- Auto-config đăng ký bằng `AutoConfiguration.imports`; `ProblemDetail`; HTTP interface client (`@HttpExchange`); `RestClient` (3.2); Docker Compose & Testcontainers `@ServiceConnection` (3.1); virtual threads (3.2); `@MockitoBean` thay `@MockBean` (3.4); graceful shutdown mặc định (3.4).',
    '? Kinh nghiệm migrate: dùng OpenRewrite/Spring Boot Migrator, cập nhật thư viện bên thứ ba hỗ trợ jakarta, chạy toàn bộ test, kiểm tra URL có dấu / và cấu hình security.',
  ]);

  L('Các lỗi thường gặp khi triển khai production', [
    { table: [['Triệu chứng', 'Nguyên nhân thường gặp'], ['Kết nối nhầm DB/môi trường', 'Profile không được đặt, biến môi trường thiếu'], ['502 khi rolling deploy', 'Không graceful shutdown, thiếu preStop, readiness sai'], ['Pod OOMKilled', 'Heap = giới hạn container, không chừa non-heap'], ['Thread treo hàng loạt', 'Gọi API ngoài không timeout'], ['Cạn connection pool', 'Transaction dài, OSIV, leak connection'], ['Chậm sau deploy', 'JVM warm-up, cache rỗng, pool chưa khởi tạo'], ['Lệch giờ báo cáo', 'Container chạy UTC, code dùng múi giờ hệ thống']] },
    '- Cấu hình graceful shutdown: `server.shutdown=graceful`, `spring.lifecycle.timeout-per-shutdown-phase=30s`, Kubernetes `terminationGracePeriodSeconds` lớn hơn.',
    '- Có health/metrics/log tập trung trước khi lên production.',
  ]);
})();
