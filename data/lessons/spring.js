/* Bài học — Module 6: Spring Framework */
(() => {
  const L = (topic, blocks) => LS.add('spring', topic, blocks);

  L('IoC Container', [
    'Inversion of Control: thay vì code tự `new` và nối các object, **container** (ApplicationContext) tạo bean, inject dependency và quản lý vòng đời dựa trên cấu hình (annotation, `@Bean`, XML).',
    '- `BeanFactory`: interface nền tảng, tạo bean lazy.',
    '- `ApplicationContext`: mở rộng BeanFactory — khởi tạo singleton sớm (fail-fast), tự đăng ký BeanPostProcessor, event, i18n, resource, profile/environment.',
    '- **BeanDefinition** là "công thức" tạo bean (class, scope, dependency, init/destroy method); `BeanFactoryPostProcessor` sửa definition trước khi tạo bean (ví dụ thay placeholder `${...}`).',
    '? Lợi ích của IoC/DI: giảm coupling, dễ thay implementation, dễ test, cấu hình tập trung.',
  ]);

  L('Dependency Injection', [
    'Ba cách inject: **constructor**, setter, field. Khuyến nghị constructor injection.',
    '- Nhiều bean cùng kiểu → `NoUniqueBeanDefinitionException`; giải quyết bằng `@Primary`, `@Qualifier`, hoặc inject `List<T>`/`Map<String, T>`.',
    '- Inject collection: Spring gom mọi bean cùng kiểu, sắp theo `@Order`.',
    '- Dependency tùy chọn/lazy: `ObjectProvider<T>`, `Optional<T>`.',
    { lang: 'java', code: `
@Service
public class PaymentService {
    private final Map<String, PaymentGateway> gateways;   // key = tên bean
    public PaymentService(Map<String, PaymentGateway> gateways) { this.gateways = gateways; }
    public void pay(String method, Order o) { gateways.get(method + "Gateway").pay(o); }
}` },
    '## Circular dependency',
    '- Spring Boot 2.6+ cấm mặc định. Đây là dấu hiệu thiết kế: tách logic chung ra bean thứ ba, dùng event; `@Lazy` chỉ là giải pháp tạm.',
  ]);

  L('Bean Lifecycle', [
    'Thứ tự khởi tạo singleton:',
    '- Instantiate (constructor) → inject dependency (setter/field) → `*Aware` callbacks.',
    '- `BeanPostProcessor.postProcessBeforeInitialization` → `@PostConstruct` → `InitializingBean.afterPropertiesSet` → init-method.',
    '- `BeanPostProcessor.postProcessAfterInitialization` — nơi **tạo proxy AOP** (@Transactional, @Async, @Cacheable).',
    '- Khi đóng context: `@PreDestroy` → `DisposableBean.destroy` → destroy-method.',
    '! Trong @PostConstruct, gọi method @Transactional của chính bean (`this.x()`) không có transaction — proxy chưa áp dụng và self-invocation không qua proxy. Dùng `ApplicationReadyEvent` + gọi qua bean khác.',
    '- Bean prototype: Spring không gọi destroy callback.',
  ]);

  L('Bean Scope', [
    { table: [['Scope', 'Số instance'], ['singleton (mặc định)', 'Một instance cho mỗi container'], ['prototype', 'Instance mới mỗi lần được yêu cầu'], ['request', 'Một instance mỗi HTTP request'], ['session', 'Một instance mỗi HTTP session'], ['application', 'Một instance mỗi ServletContext']] },
    '- Singleton dùng chung giữa mọi thread → phải **stateless** hoặc thread-safe. Không lưu dữ liệu theo request trong field.',
    '- Prototype inject vào singleton chỉ được tạo **một lần**; muốn instance mới mỗi lần dùng `ObjectProvider.getObject()`, `@Lookup` hoặc scoped proxy.',
    '- Bean request/session inject vào singleton cần `proxyMode = ScopedProxyMode.TARGET_CLASS`.',
  ]);

  L('@Component, @Service, @Repository và @Controller', [
    '- `@Component`: stereotype chung để component scanning phát hiện.',
    '- `@Service`: tầng nghiệp vụ (ngữ nghĩa, không thêm hành vi).',
    '- `@Repository`: tầng truy cập dữ liệu + **exception translation** sang `DataAccessException`.',
    '- `@Controller`: xử lý web request, trả view; `@RestController` = `@Controller` + `@ResponseBody` (trả JSON).',
    '- Tên bean mặc định = tên class đơn giản viết thường chữ đầu → hai class cùng tên khác package gây `ConflictingBeanDefinitionException`.',
  ]);

  L('@Configuration và @Bean', [
    '`@Bean` khai báo bean bằng method — dùng cho class bên thứ ba (không thể gắn annotation) hoặc cần logic khởi tạo.',
    '- Trong class `@Configuration` (mặc định `proxyBeanMethods = true`), CGLIB chặn lời gọi giữa các method `@Bean` để trả về đúng singleton.',
    '- Ở lite mode (`@Component` hoặc `proxyBeanMethods = false`), gọi method @Bean là lời gọi Java thường → tạo object mới.',
    { lang: 'java', code: `
@Configuration(proxyBeanMethods = false)
class HttpConfig {
    @Bean RestClient partnerClient(RestClient.Builder builder, PartnerProps props) {   // truyền qua tham số
        return builder.baseUrl(props.baseUrl()).build();
    }
}` },
    '- Điều kiện: `@Profile`, `@ConditionalOnProperty`, `@ConditionalOnMissingBean` (Spring Boot).',
  ]);

  L('Constructor Injection', [
    '- Dependency là `final` → object luôn hợp lệ sau khởi tạo, bất biến.',
    '- Dependency bắt buộc được thể hiện rõ; constructor quá nhiều tham số là dấu hiệu vi phạm SRP.',
    '- Unit test dễ: `new OrderService(mockRepo, mockMail)` không cần Spring.',
    '- Phát hiện circular dependency ngay khi khởi động.',
    '- Class chỉ có một constructor không cần `@Autowired` (Spring 4.3+). Lombok `@RequiredArgsConstructor` sinh constructor cho field final.',
    '! Field injection che giấu dependency, không dùng được `final`, khó test (cần reflection).',
  ]);

  L('@Autowired', [
    '- Inject theo **kiểu**; nhiều ứng viên → dùng `@Qualifier`/`@Primary` (fallback: tên tham số trùng tên bean).',
    '- `@Autowired(required = false)` hoặc `Optional`/`ObjectProvider` cho dependency tùy chọn.',
    '- Chỉ hoạt động với object do Spring quản lý: object tạo bằng `new` có field `@Autowired` = null.',
    '- Có thể đặt trên constructor, setter, field, method cấu hình.',
  ]);

  L('Component Scanning', [
    '`@SpringBootApplication` bao gồm `@ComponentScan` quét **package của main class và các package con**.',
    '- Class nằm ngoài phạm vi → `NoSuchBeanDefinitionException`. Đặt main class ở package gốc hoặc khai báo `scanBasePackages`.',
    '- `@EntityScan` và `@EnableJpaRepositories` cũng mặc định theo package gốc.',
    '- Thư viện dùng chung không nên dựa vào scan của ứng dụng; cung cấp **auto-configuration** (`AutoConfiguration.imports`).',
    '- Lọc: `@ComponentScan(excludeFilters = ...)`.',
  ]);

  L('Spring AOP', [
    'AOP tách các mối quan tâm cắt ngang (transaction, logging, security, metrics, retry) khỏi logic nghiệp vụ.',
    '- **Aspect** (module chứa advice), **Advice** (`@Before`, `@AfterReturning`, `@AfterThrowing`, `@After`, `@Around`), **Pointcut** (biểu thức chọn join point), **Join point** (với Spring AOP: lời gọi method).',
    { lang: 'java', code: `
@Aspect @Component
class TimingAspect {
    @Around("@annotation(com.acme.Timed)")
    Object time(ProceedingJoinPoint pjp) throws Throwable {
        long t = System.nanoTime();
        try { return pjp.proceed(); }        // phải gọi proceed và trả kết quả
        finally { log.info("{} took {} ms", pjp.getSignature(), (System.nanoTime() - t) / 1_000_000); }
    }
}` },
    '! Spring AOP dựa trên proxy: không áp dụng cho self-invocation, method private/final, object không phải bean. AspectJ weaving mới làm được các trường hợp này.',
  ]);

  L('Proxy', [
    '- **JDK dynamic proxy**: dựa trên interface, chỉ chặn method của interface.',
    '- **CGLIB proxy**: tạo subclass lúc runtime, chặn method public/protected không final. Spring Boot mặc định `proxyTargetClass = true` (CGLIB).',
    '- Lời gọi từ bên ngoài → proxy → advice → bean thật. Lời gọi `this.method()` bên trong bean **không** qua proxy.',
    '- Class/method `final` không proxy được bằng CGLIB (Kotlin cần plugin all-open/kotlin-spring).',
    '? Câu hỏi kinh điển: "Vì sao @Transactional không chạy khi gọi method trong cùng class?" → self-invocation không đi qua proxy.',
  ]);

  L('Transaction Management', [
    '`@Transactional` được cài bằng AOP proxy: mở transaction trước method, commit khi thành công, rollback khi có exception theo quy tắc.',
    '## Quy tắc rollback',
    '- Mặc định rollback với `RuntimeException` và `Error`; **commit** với checked exception → dùng `rollbackFor = Exception.class` khi cần.',
    '- Exception bị nuốt (catch không ném lại) → không rollback.',
    '## Propagation',
    { table: [['Propagation', 'Hành vi'], ['REQUIRED (mặc định)', 'Tham gia transaction hiện có, không có thì tạo mới'], ['REQUIRES_NEW', 'Tạm dừng transaction hiện tại, tạo transaction độc lập (thêm connection)'], ['NESTED', 'Savepoint trong transaction hiện tại (JDBC)'], ['SUPPORTS / NOT_SUPPORTED / MANDATORY / NEVER', 'Các biến thể ít dùng']] },
    '- Inner REQUIRED ném RuntimeException → transaction bị đánh dấu **rollback-only**; outer bắt lỗi rồi commit → `UnexpectedRollbackException`.',
    '- `readOnly = true`: tối ưu Hibernate (không flush, giảm dirty checking), có thể định tuyến replica.',
    '! Không áp dụng cho self-invocation, method private. Không gọi HTTP/hệ thống ngoài bên trong transaction dài — giữ connection và lock.',
  ]);

  L('Spring Events', [
    'Observer pattern trong Spring: `ApplicationEventPublisher.publishEvent(event)`, nhận bằng `@EventListener`.',
    '- Mặc định listener chạy **đồng bộ, cùng thread, cùng transaction** với publisher; exception lan ngược về publisher.',
    '- `@TransactionalEventListener(phase = AFTER_COMMIT)`: chỉ chạy khi transaction commit thành công (gửi email, publish message).',
    '- `@Async` trên listener để chạy bất đồng bộ (cần `@EnableAsync`).',
    '! Event trong bộ nhớ mất khi ứng dụng crash sau commit → cần Outbox pattern khi yêu cầu "chắc chắn gửi".',
    '- Event giúp giảm coupling giữa module (OrderService không cần biết LoyaltyService).',
  ]);

  L('Profiles', [
    'Profile cho phép kích hoạt bean/cấu hình theo môi trường.',
    '- `@Profile("dev")`, `@Profile("!prod")`, `@Profile("dev | test")` trên bean/configuration.',
    '- Kích hoạt: `spring.profiles.active=prod`, biến môi trường `SPRING_PROFILES_ACTIVE`, `--spring.profiles.active`.',
    '- File cấu hình theo profile: `application-prod.yml` ghi đè `application.yml`.',
    '- Test: `@ActiveProfiles("test")`.',
    '! Không để thông tin kết nối thật trong file của profile được commit; secret lấy từ biến môi trường/secret manager.',
  ]);

  L('Externalized Configuration', [
    'Spring hợp nhất cấu hình từ nhiều nguồn vào `Environment`. Thứ tự ưu tiên (cao → thấp, rút gọn):',
    '- Command-line args → `SPRING_APPLICATION_JSON` → Java system properties (`-D`) → biến môi trường → file theo profile → `application.yml` trong jar.',
    '- `@Value("${app.timeout:5s}")` cho giá trị lẻ (hỗ trợ mặc định, SpEL).',
    '- `@ConfigurationProperties(prefix = "app")`: binding có kiểu, nhóm, validation (`@Validated`), relaxed binding — khuyến nghị cho nhóm cấu hình.',
    '- Relaxed binding: `app.max-retry` ↔ `APP_MAXRETRY` ↔ `app.maxRetry`.',
    '- `spring.config.import` nạp thêm nguồn (config server, `configtree:` cho Kubernetes secret).',
  ]);
})();
