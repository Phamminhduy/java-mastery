/* Module 6: Spring Framework */
QB.module({
  id: 'spring', order: 6, title: 'Spring Framework',
  description: 'IoC, Dependency Injection, Bean Lifecycle/Scope, @Configuration, AOP & Proxy, Transaction Management, Events, Profiles và cấu hình.',
  topics: ['IoC Container', 'Dependency Injection', 'Bean Lifecycle', 'Bean Scope', '@Component, @Service, @Repository và @Controller',
    '@Configuration và @Bean', 'Constructor Injection', '@Autowired', 'Component Scanning', 'Spring AOP', 'Proxy',
    'Transaction Management', 'Spring Events', 'Profiles', 'Externalized Configuration'],
}, [
  {
    id: 'SPR-001', topic: 'IoC Container', d: 'b', cat: 'theory',
    q: 'Inversion of Control (IoC) trong Spring nghĩa là gì?',
    opts: [
      'Ứng dụng tự tạo mọi object bằng new và tự quản lý vòng đời',
      'Container chịu trách nhiệm tạo object (bean), cung cấp dependency và quản lý vòng đời; code nghiệp vụ chỉ khai báo những gì nó cần',
      'Đảo ngược thứ tự thực thi các method',
      'Cơ chế để Spring gọi database',
    ], ans: 'B',
    exp: 'Với IoC, quyền kiểm soát việc khởi tạo và kết nối các object được chuyển cho container (ApplicationContext). Dependency Injection là cách hiện thực IoC phổ biến nhất: dependency được "tiêm" qua constructor/setter/field. Lợi ích: giảm coupling, dễ thay thế implementation và dễ test.',
    tags: ['ioc', 'di'], sec: 30,
  },
  {
    id: 'SPR-002', topic: 'IoC Container', d: 'i', cat: 'theory',
    q: 'Điểm khác biệt nào giữa `ApplicationContext` và `BeanFactory` là đúng?',
    opts: [
      'BeanFactory hỗ trợ nhiều tính năng hơn ApplicationContext',
      'ApplicationContext mở rộng BeanFactory: tự đăng ký BeanPostProcessor/BeanFactoryPostProcessor, khởi tạo sẵn (eager) các singleton khi startup, hỗ trợ event, i18n (MessageSource), resource loading',
      'ApplicationContext chỉ dùng cho ứng dụng web',
      'BeanFactory không thể tạo bean singleton',
    ], ans: 'B',
    exp: 'BeanFactory là interface nền tảng, khởi tạo bean lazy theo yêu cầu. ApplicationContext là container "đầy đủ" dùng trong thực tế; việc tạo singleton ngay lúc khởi động giúp phát hiện lỗi cấu hình sớm (fail-fast) thay vì khi request đầu tiên tới.',
    tags: ['applicationcontext', 'beanfactory'], sec: 40,
  },
  {
    id: 'SPR-003', topic: 'Constructor Injection', d: 'i', cat: 'tradeoff', type: 'multiple',
    q: 'Chọn **2** lợi ích chính của Constructor Injection so với Field Injection (`@Autowired` trên field).',
    opts: [
      'Cho phép khai báo dependency là `final`, object luôn ở trạng thái hợp lệ sau khi khởi tạo',
      'Giảm thời gian khởi động ứng dụng đáng kể',
      'Dễ viết unit test: tạo object bằng `new Service(mockRepo)` mà không cần Spring hay reflection',
      'Cho phép circular dependency giữa các bean',
    ], ans: ['A', 'C'],
    exp: 'Constructor injection làm dependency trở nên bắt buộc và bất biến, lộ rõ khi class có quá nhiều dependency (dấu hiệu vi phạm SRP), và dễ test. Nó **không** cho phép circular dependency (Spring báo lỗi ngay) — đó là ưu điểm vì buộc xem lại thiết kế. Từ Spring 4.3, class chỉ có một constructor không cần `@Autowired`.',
    tags: ['constructor-injection', 'testability'], sec: 45,
  },
  {
    id: 'SPR-004', topic: 'Dependency Injection', d: 'a', cat: 'debug',
    q: 'Sau khi nâng cấp lên Spring Boot 2.6+, ứng dụng không khởi động: "The dependencies of some of the beans in the application context form a cycle: orderService ↔ paymentService". Cách xử lý đúng hướng nhất?',
    opts: [
      'Đặt `spring.main.allow-circular-references=true` vĩnh viễn và bỏ qua',
      'Phân tích trách nhiệm: tách phần logic dùng chung ra service thứ ba, hoặc dùng event để đảo chiều phụ thuộc; chỉ dùng @Lazy/allow-circular-references như giải pháp tạm',
      'Chuyển tất cả sang field injection',
      'Đánh dấu cả hai bean là prototype',
    ], ans: 'B',
    exp: 'Từ Spring Boot 2.6, circular reference bị cấm mặc định. Vòng phụ thuộc thường là dấu hiệu hai class quá ôm đồm hoặc ranh giới trách nhiệm chưa rõ. Tách logic chung, dùng interface/callback hoặc ApplicationEvent sẽ triệt để hơn. `@Lazy` (inject proxy) hoặc bật lại allow-circular-references chỉ nên là bước tạm khi migrate.',
    tags: ['circular-dependency', 'spring-boot-2.6'], sec: 60, ver: 'Spring Boot 2.6+',
  },
  {
    id: 'SPR-005', topic: '@Autowired', d: 'i', cat: 'debug',
    q: 'Có hai bean implement `PaymentGateway` (`vnpayGateway` và `momoGateway`). Service inject `private final PaymentGateway gateway;` qua constructor. Ứng dụng báo lỗi gì và cách sửa phù hợp?',
    opts: [
      'NoSuchBeanDefinitionException; thêm @Component cho interface',
      'NoUniqueBeanDefinitionException; dùng @Qualifier("vnpayGateway"), đánh dấu một bean @Primary, hoặc inject `Map<String, PaymentGateway>`/`List` để chọn lúc runtime',
      'BeanCurrentlyInCreationException; thêm @Lazy',
      'Spring tự chọn bean được khai báo trước',
    ], ans: 'B',
    exp: 'Khi có nhiều ứng viên cùng kiểu, Spring không biết chọn bean nào (trừ khi tên tham số trùng tên bean — cơ chế dự phòng, không nên dựa vào). @Primary chỉ định mặc định; @Qualifier chỉ định cụ thể; inject Map/List hữu ích cho Strategy pattern.',
    tags: ['autowired', 'qualifier', 'primary'], sec: 45,
  },
  {
    id: 'SPR-006', topic: '@Autowired', d: 'b', cat: 'bug',
    q: 'Vì sao đoạn code sau ném NullPointerException ở dòng `repo.save(...)`?',
    code: `
@Component
public class ReportJob {
    @Autowired
    private ReportRepository repo;

    public void run() { repo.save(new Report()); }
}

// ở một class khác:
ReportJob job = new ReportJob();
job.run();`,
    opts: [
      'ReportRepository chưa có @Repository',
      'Object được tạo bằng `new` không do Spring quản lý nên không được inject; cần inject `ReportJob` từ container',
      'Thiếu @Transactional',
      'Field private không thể @Autowired',
    ], ans: 'B',
    exp: 'Spring chỉ inject dependency cho bean mà container tạo ra. `new ReportJob()` là object thường, field `repo` vẫn null. Đây cũng là lý do field injection che giấu dependency — với constructor injection, `new ReportJob()` sẽ không biên dịch được nếu thiếu tham số.',
    tags: ['autowired', 'new', 'npe'], sec: 35,
  },
  {
    id: 'SPR-007', topic: 'Bean Scope', d: 'a', cat: 'debug',
    q: '`ShoppingCartCalculator` là bean scope `prototype` có trạng thái, được inject vào `CheckoutService` (singleton). Lập trình viên mong mỗi lần gọi `checkout()` có calculator mới, nhưng trạng thái bị lẫn giữa các request. Vì sao và sửa thế nào?',
    opts: [
      'Prototype bean luôn là singleton trong Spring Boot',
      'Dependency chỉ được inject **một lần** khi tạo singleton nên nó giữ mãi một instance prototype; dùng `ObjectProvider<ShoppingCartCalculator>.getObject()` (hoặc @Lookup / scoped proxy) để lấy instance mới mỗi lần',
      'Phải đổi CheckoutService thành prototype là cách duy nhất',
      'Do thiếu @Scope trên interface',
    ], ans: 'B',
    exp: 'Scope prototype nghĩa là container tạo instance mới **mỗi khi được yêu cầu**, nhưng singleton chỉ yêu cầu một lần lúc khởi tạo. Giải pháp: ObjectProvider/Provider, method injection (@Lookup), hoặc `@Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS)`. Thường tốt hơn nữa là thiết kế calculator không trạng thái và truyền dữ liệu qua tham số.',
    tags: ['scope', 'prototype', 'singleton'], sec: 60,
  },
  {
    id: 'SPR-008', topic: 'Bean Scope', d: 'i', cat: 'bug',
    q: 'Controller sau trả về kết quả sai khi có nhiều request đồng thời. Nguyên nhân?',
    code: `
@RestController
public class QuoteController {
    private BigDecimal lastTotal;

    @PostMapping("/quotes")
    public QuoteResponse quote(@RequestBody QuoteRequest req) {
        lastTotal = calculate(req);
        audit(req);
        return new QuoteResponse(lastTotal);
    }
}`,
    opts: [
      'Thiếu @ResponseBody',
      'Controller là singleton dùng chung giữa các request (thread); field `lastTotal` là trạng thái mutable chia sẻ nên các request ghi đè lẫn nhau. Dùng biến cục bộ',
      'BigDecimal không thread-safe',
      'Phải dùng @RequestScope cho mọi controller',
    ], ans: 'B',
    exp: 'Bean mặc định là singleton, mỗi request chạy trên một thread khác nhau nhưng dùng chung instance. Field instance có thể bị request khác ghi đè giữa lúc gán và lúc đọc. Nguyên tắc: bean singleton nên stateless; dữ liệu theo request đặt trong biến cục bộ hoặc tham số.',
    tags: ['singleton', 'thread-safety', 'stateless'], sec: 40,
  },
  {
    id: 'SPR-009', topic: 'Bean Lifecycle', d: 'a', cat: 'theory',
    q: 'Thứ tự nào đúng trong vòng đời khởi tạo một singleton bean?',
    opts: [
      '@PostConstruct → Constructor → Inject dependency → BeanPostProcessor',
      'Constructor → Inject dependency (setter/field) → Aware callbacks → BeanPostProcessor#postProcessBeforeInitialization → @PostConstruct → afterPropertiesSet/init-method → BeanPostProcessor#postProcessAfterInitialization (thường là nơi tạo proxy AOP)',
      'Constructor → @PostConstruct → Inject dependency → Proxy',
      'BeanPostProcessor → Constructor → @PreDestroy → @PostConstruct',
    ], ans: 'B',
    exp: 'Hiểu thứ tự này giải thích nhiều lỗi thực tế: trong constructor, field injection chưa xảy ra (null); trong @PostConstruct, dependency đã có nhưng proxy AOP của **chính bean** có thể chưa được áp dụng cho lời gọi nội bộ. Khi context đóng: @PreDestroy → DisposableBean.destroy → destroy-method.',
    tags: ['lifecycle', 'postconstruct', 'beanpostprocessor'], sec: 60,
  },
  {
    id: 'SPR-010', topic: 'Bean Lifecycle', d: 's', cat: 'debug',
    q: '`CacheWarmer` có method `@PostConstruct void init() { this.loadAll(); }` và `loadAll()` được đánh dấu `@Transactional(readOnly = true)`. Khi chạy, Hibernate ném `LazyInitializationException`/không có transaction. Giải thích và cách sửa?',
    opts: [
      'readOnly không cho phép đọc dữ liệu lazy',
      'Lời gọi `this.loadAll()` là self-invocation, không đi qua proxy giao dịch; hơn nữa @PostConstruct chạy trước khi bean được bọc proxy. Nên chạy warm-up khi ứng dụng sẵn sàng (`@EventListener(ApplicationReadyEvent.class)`) và gọi qua bean khác, hoặc dùng TransactionTemplate',
      'Do thiếu @EnableCaching',
      'Do @PostConstruct chạy trên thread khác',
    ], ans: 'B',
    exp: 'Proxy AOP được tạo trong `postProcessAfterInitialization`, tức **sau** @PostConstruct, và lời gọi qua `this` không bao giờ đi qua proxy. Vì vậy @Transactional/@Cacheable/@Async không có hiệu lực trong trường hợp này. ApplicationReadyEvent cũng giúp warm-up không làm chậm/khóa quá trình khởi động context.',
    tags: ['postconstruct', 'transactional', 'self-invocation'], sec: 70,
  },
  {
    id: 'SPR-011', topic: '@Component, @Service, @Repository và @Controller', d: 'i', cat: 'theory',
    q: 'Ngoài vai trò stereotype để component scanning phát hiện, `@Repository` còn mang lại hành vi đặc biệt nào?',
    opts: [
      'Tự động mở transaction cho mọi method',
      'Exception translation: exception của công nghệ persistence (JDBC SQLException, JPA/Hibernate) được chuyển thành hệ phân cấp `DataAccessException` thống nhất của Spring',
      'Tự động cache kết quả truy vấn',
      'Không có khác biệt nào so với @Component',
    ], ans: 'B',
    exp: '`PersistenceExceptionTranslationPostProcessor` bọc bean @Repository bằng proxy dịch exception, giúp tầng service xử lý lỗi (ví dụ `DataIntegrityViolationException`) độc lập với công nghệ. @Service và @Controller hiện chủ yếu mang ngữ nghĩa phân tầng; @Controller kết hợp @RequestMapping để xử lý web request.',
    tags: ['repository', 'exception-translation'], sec: 40,
  },
  {
    id: 'SPR-012', topic: '@Configuration và @Bean', d: 's', cat: 'output',
    q: 'Với lớp cấu hình sau, `a.getClock() == b.getClock()` cho kết quả gì khi dùng `@Configuration`, và khi đổi thành `@Component`?',
    code: `
@Configuration   // thử đổi thành @Component
public class AppConfig {
    @Bean Clock clock()   { return Clock.systemUTC(); }
    @Bean ServiceA a()    { return new ServiceA(clock()); }
    @Bean ServiceB b()    { return new ServiceB(clock()); }
}`,
    opts: [
      'true với @Configuration; false với @Component',
      'false với cả hai',
      'true với cả hai',
      'false với @Configuration; true với @Component',
    ], ans: 'A',
    exp: 'Class `@Configuration` (mặc định `proxyBeanMethods = true`) được CGLIB tạo subclass: lời gọi `clock()` bên trong bị chặn và trả về singleton bean trong container. Với `@Component` (lite mode) hoặc `@Configuration(proxyBeanMethods = false)`, `clock()` chỉ là lời gọi Java thông thường, mỗi lần tạo object mới. Spring Boot auto-configuration dùng proxyBeanMethods=false để khởi động nhanh hơn, nên truyền dependency qua tham số method @Bean thay vì gọi method.',
    tags: ['configuration', 'bean', 'cglib', 'proxybeanmethods'], sec: 70,
  },
  {
    id: 'SPR-013', topic: 'Component Scanning', d: 'i', cat: 'debug',
    q: 'Class chính `com.acme.order.OrderApplication` có `@SpringBootApplication`. Một `@Service` mới được đặt trong package `com.acme.shared.audit`. Ứng dụng báo `NoSuchBeanDefinitionException` cho AuditService. Nguyên nhân?',
    opts: [
      '@Service phải đặt trên interface',
      'Component scanning mặc định chỉ quét package của class @SpringBootApplication và các package con (`com.acme.order..`); `com.acme.shared` nằm ngoài phạm vi',
      'Thiếu @Autowired trên AuditService',
      'Do Spring Boot chỉ hỗ trợ một package',
    ], ans: 'B',
    exp: 'Giải pháp: đặt main class ở package gốc chung (`com.acme`), hoặc khai báo `@SpringBootApplication(scanBasePackages = "com.acme")`, hoặc với thư viện dùng chung thì cung cấp auto-configuration (`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`) thay vì dựa vào scanning. Lưu ý @EntityScan/@EnableJpaRepositories cũng theo package gốc.',
    tags: ['component-scan', 'package'], sec: 40,
  },
  {
    id: 'SPR-014', topic: 'Transaction Management', d: 'a', cat: 'bug',
    q: 'Controller gọi `orderService.placeAll(orders)`. Khi đơn thứ 3 lỗi, hai đơn đầu **không** được rollback như kỳ vọng "mỗi đơn một transaction", và trong `placeOne` cũng không thấy transaction nào active. Vì sao?',
    code: `
@Service
public class OrderService {
    public void placeAll(List<Order> orders) {
        for (Order o : orders) {
            placeOne(o);
        }
    }

    @Transactional
    public void placeOne(Order o) {
        repo.save(o);
        inventory.reserve(o);
    }
}`,
    opts: [
      '@Transactional chỉ hoạt động trên interface',
      'Self-invocation: `placeOne` được gọi qua `this` từ bên trong bean, không đi qua proxy nên annotation @Transactional bị bỏ qua',
      'Phải dùng propagation REQUIRES_NEW',
      'Repository tự commit sau mỗi save',
    ], ans: 'B',
    exp: 'Spring quản lý transaction bằng proxy bao quanh bean; chỉ lời gọi từ bên ngoài đi qua proxy mới được áp dụng advice. Ở đây mỗi `repo.save` chạy trong transaction riêng của SimpleJpaRepository (auto-commit), nên dữ liệu đã lưu không được rollback cùng nhau. Sửa: tách `placeOne` sang bean khác, hoặc dùng `TransactionTemplate` trong vòng lặp, hoặc tự inject proxy của chính mình (ít khuyến khích).',
    tags: ['transactional', 'self-invocation', 'proxy'], sec: 60,
  },
  {
    id: 'SPR-015', topic: 'Transaction Management', d: 'i', cat: 'theory',
    q: 'Một method `private` được đánh dấu `@Transactional` trong Spring 6 (proxy-based AOP mặc định). Điều gì xảy ra?',
    opts: [
      'Transaction được áp dụng bình thường',
      'Annotation bị bỏ qua: proxy không thể chặn lời gọi tới method private',
      'Ứng dụng không khởi động được',
      'Spring tự đổi method thành public',
    ], ans: 'B',
    exp: 'Proxy (JDK hoặc CGLIB) chỉ có thể override/chặn method có thể ghi đè từ bên ngoài. Method private (và final, static) không được intercept. Spring 6.0 mở rộng hỗ trợ cho method protected/package-private với class-based proxy, nhưng private vẫn không. Chỉ khi dùng AspectJ weaving (compile/load-time) mới áp dụng được cho mọi method.',
    tags: ['transactional', 'private', 'proxy'], sec: 40, ver: 'Spring 6',
  },
  {
    id: 'SPR-016', topic: 'Transaction Management', d: 'a', cat: 'output',
    q: 'Gọi `importService.importFile(path)` từ controller (đi qua proxy). File lỗi định dạng khiến `parse()` ném `IOException` (checked) **sau khi** đã lưu bản ghi `ImportJob`. Bản ghi ImportJob có được lưu trong DB không?',
    code: `
@Transactional
public void importFile(Path path) throws IOException {
    jobRepository.save(new ImportJob(path.toString(), "STARTED"));
    List<Row> rows = parse(path);   // ném IOException
    rowRepository.saveAll(rows);
}`,
    opts: [
      'Không, mọi exception đều gây rollback',
      'Có: mặc định Spring chỉ rollback với RuntimeException và Error; checked exception khiến transaction vẫn commit',
      'Không, IOException luôn làm Hibernate rollback',
      'Tùy database',
    ], ans: 'B',
    exp: 'Quy tắc mặc định của Spring (kế thừa từ EJB): rollback với unchecked exception, commit với checked exception. Muốn rollback cả checked exception: `@Transactional(rollbackFor = Exception.class)`. Nhiều team quy ước luôn khai báo rollbackFor hoặc bọc checked exception thành runtime exception nghiệp vụ.',
    tags: ['transactional', 'rollback-rules', 'checked-exception'], sec: 55,
  },
  {
    id: 'SPR-017', topic: 'Transaction Management', d: 's', cat: 'output',
    q: '`outer()` của OrderService gọi `inner.process()` của một bean khác. Cả hai dùng `@Transactional` mặc định (REQUIRED). `process()` ném exception, outer bắt và chỉ log. Kết quả khi `outer()` kết thúc?',
    code: `
@Transactional
public void outer() {
    orderRepo.save(order);
    try {
        inner.process();          // bean khác, @Transactional, ném IllegalStateException
    } catch (RuntimeException e) {
        log.warn("ignore", e);
    }
}`,
    opts: [
      'order được commit bình thường vì exception đã được catch',
      'Transaction đã bị đánh dấu rollback-only khi exception đi qua proxy của inner; lúc outer commit, Spring rollback và ném UnexpectedRollbackException — order không được lưu',
      'Chỉ phần của inner bị rollback, order vẫn được lưu',
      'Ném IllegalStateException ra controller',
    ], ans: 'B',
    exp: 'Với REQUIRED, inner tham gia **cùng** transaction vật lý. Khi RuntimeException đi qua proxy của inner, transaction interceptor đánh dấu toàn bộ transaction là rollback-only. Outer nuốt exception và cố commit → `UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only`. Nếu muốn lỗi của inner không ảnh hưởng outer: dùng REQUIRES_NEW (transaction riêng) hoặc NESTED (savepoint, với JDBC/DataSourceTransactionManager), hoặc không đánh dấu inner là @Transactional.',
    tags: ['transactional', 'propagation', 'rollback-only'], sec: 80,
  },
  {
    id: 'SPR-018', topic: 'Transaction Management', d: 'a', cat: 'design',
    q: 'Yêu cầu: mỗi lần chuyển tiền phải ghi một bản ghi audit, **kể cả khi** giao dịch chuyển tiền thất bại và rollback. Cách cấu hình nào phù hợp?',
    opts: [
      'Gọi auditRepository.save() trong cùng method @Transactional của transfer',
      'Đặt logic audit trong một bean khác với `@Transactional(propagation = Propagation.REQUIRES_NEW)` và gọi nó (thường trong khối finally/catch) — audit commit độc lập với transaction chính',
      'Dùng Propagation.MANDATORY',
      'Dùng readOnly = true cho audit',
    ], ans: 'B',
    exp: 'REQUIRES_NEW tạm dừng transaction hiện tại và mở transaction mới, commit/rollback độc lập. Lưu ý: phải gọi qua bean khác (proxy), mỗi REQUIRES_NEW lấy thêm một connection từ pool (nguy cơ cạn pool/deadlock khi pool nhỏ). Nếu audit có thể bất đồng bộ, có thể dùng event + outbox để không ảnh hưởng latency.',
    tags: ['transactional', 'requires-new', 'audit'], sec: 55,
  },
  {
    id: 'SPR-019', topic: 'Transaction Management', d: 'a', cat: 'theory',
    q: '`@Transactional(readOnly = true)` mang lại lợi ích gì khi dùng với Spring Data JPA/Hibernate?',
    opts: [
      'Đảm bảo tuyệt đối không câu lệnh ghi nào được thực thi trên mọi database',
      'Gợi ý tối ưu: Hibernate đặt flush mode MANUAL và có thể bỏ snapshot/dirty checking cho entity đọc ra; driver/DB có thể tối ưu và có thể dùng để định tuyến sang read replica',
      'Tự động cache kết quả truy vấn',
      'Cho phép chạy ngoài transaction',
    ], ans: 'B',
    exp: 'readOnly là **gợi ý** (hint): với Hibernate, session không flush thay đổi và (Spring 5.1+/Hibernate 5.x) giảm chi phí giữ snapshot, tiết kiệm CPU/bộ nhớ khi đọc nhiều entity. JDBC `Connection.setReadOnly(true)` có thể được DB như PostgreSQL thực thi nghiêm ngặt, nhưng không phải mọi DB/driver đều chặn ghi. Thường dùng mặc định readOnly ở mức class service truy vấn và override cho method ghi.',
    tags: ['transactional', 'readonly', 'hibernate'], sec: 50,
  },
  {
    id: 'SPR-020', topic: 'Spring Events', d: 'a', cat: 'design',
    q: 'Sau khi tạo đơn hàng, hệ thống gửi email xác nhận qua event. Đôi khi khách nhận email cho đơn hàng mà sau đó transaction bị rollback. Cách sửa phù hợp?',
    code: `
@Transactional
public Order create(CreateOrderCommand cmd) {
    Order o = repo.save(Order.from(cmd));
    publisher.publishEvent(new OrderCreatedEvent(o.getId()));
    paymentService.hold(o);   // có thể ném exception
    return o;
}

@EventListener
public void onCreated(OrderCreatedEvent e) { mailService.sendConfirmation(e.orderId()); }`,
    opts: [
      'Đổi publishEvent xuống cuối method là đủ trong mọi trường hợp',
      'Dùng `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` để listener chỉ chạy khi transaction commit thành công (kết hợp @Async hoặc outbox nếu cần đảm bảo gửi)',
      'Đánh dấu listener @Transactional(REQUIRES_NEW)',
      'Bọc sendConfirmation trong try/catch',
    ], ans: 'B',
    exp: '`@EventListener` chạy **đồng bộ ngay lúc publish**, bên trong transaction chưa commit. `@TransactionalEventListener` hoãn tới phase chỉ định (mặc định AFTER_COMMIT). Lưu ý: nếu ứng dụng crash ngay sau commit thì event trong bộ nhớ bị mất — cần Outbox pattern khi yêu cầu "chắc chắn gửi". Đổi vị trí publish không giải quyết được lỗi xảy ra lúc commit (constraint, deadlock).',
    tags: ['transactional-event-listener', 'after-commit', 'events'], sec: 60,
  },
  {
    id: 'SPR-021', topic: 'Spring Events', d: 'i', cat: 'theory',
    q: 'Mặc định, khi một `@EventListener` ném RuntimeException, điều gì xảy ra với method đã gọi `publishEvent()` trong một transaction?',
    opts: [
      'Exception bị Spring nuốt và log lại',
      'Listener chạy đồng bộ trên cùng thread nên exception lan ngược về publisher; nếu không được catch, transaction của publisher bị rollback',
      'Listener chạy trên thread riêng nên không ảnh hưởng',
      'Event được retry 3 lần',
    ], ans: 'B',
    exp: 'Mặc định `ApplicationEventMulticaster` gọi listener tuần tự, đồng bộ. Do đó listener chậm cũng làm chậm publisher. Muốn bất đồng bộ: `@Async` trên listener (cần `@EnableAsync`) hoặc cấu hình TaskExecutor cho multicaster — khi đó exception không còn lan về publisher và phải tự xử lý.',
    tags: ['events', 'eventlistener', 'synchronous'], sec: 40,
  },
  {
    id: 'SPR-022', topic: 'Profiles', d: 'b', cat: 'theory',
    q: 'Bean được đánh dấu `@Profile("dev")`. Ứng dụng chạy với `spring.profiles.active=prod`. Điều gì xảy ra?',
    opts: ['Bean vẫn được tạo nhưng không được inject', 'Bean không được đăng ký vào container', 'Ứng dụng không khởi động được', 'Bean được tạo với cấu hình prod'], ans: 'B',
    exp: '@Profile là điều kiện đăng ký bean: chỉ khi profile tương ứng active thì bean mới được tạo. Có thể dùng biểu thức như `@Profile("!prod")`, `@Profile("dev | test")`. Nếu bean khác bắt buộc phụ thuộc vào bean này mà profile không active, ứng dụng sẽ lỗi NoSuchBeanDefinitionException.',
    tags: ['profile'], sec: 25,
  },
  {
    id: 'SPR-023', topic: 'Externalized Configuration', d: 'i', cat: 'theory',
    q: '`application.yml` có `server.port: 8080`, biến môi trường `SERVER_PORT=9090`, và ứng dụng được chạy bằng `java -jar app.jar --server.port=7070`. Ứng dụng lắng nghe cổng nào?',
    opts: ['8080', '9090', '7070', 'Lỗi xung đột cấu hình'], ans: 'C',
    exp: 'Thứ tự ưu tiên (cao → thấp, rút gọn): command-line arguments > SPRING_APPLICATION_JSON > Java system properties (-D) > biến môi trường OS > file cấu hình theo profile > application.properties/yml trong jar. Biến môi trường được ánh xạ qua relaxed binding (`SERVER_PORT` → `server.port`). Hiểu thứ tự này giúp debug lỗi "đã sửa config mà không ăn" khi deploy.',
    tags: ['configuration', 'property-precedence', 'relaxed-binding'], sec: 40,
  },
  {
    id: 'SPR-024', topic: 'Externalized Configuration', d: 'i', cat: 'tradeoff',
    q: 'Module tích hợp đối tác có 8 thuộc tính cấu hình (url, timeout, retry, apiKey...). So với dùng nhiều `@Value("${partner.xxx}")`, `@ConfigurationProperties(prefix = "partner")` có ưu điểm gì?',
    opts: [
      'Không có khác biệt',
      'Binding có kiểu (Duration, List, nested object), gom nhóm cấu hình, hỗ trợ validation (@Validated) để fail-fast khi khởi động, relaxed binding và metadata gợi ý trong IDE',
      'Chỉ hỗ trợ file .properties',
      'Đọc cấu hình nhanh hơn ở runtime',
    ], ans: 'B',
    exp: '@ConfigurationProperties (có thể dùng với record/constructor binding — mặc định từ Spring Boot 3 khi chỉ có một constructor) giúp cấu hình rõ ràng, dễ test và kiểm tra thiếu/sai ngay lúc startup. @Value phù hợp cho một vài giá trị lẻ và hỗ trợ SpEL. Thông tin bí mật như apiKey nên lấy từ secret manager/biến môi trường, không commit vào repository.',
    tags: ['configurationproperties', 'value', 'validation'], sec: 45,
  },
  {
    id: 'SPR-025', topic: 'Proxy', d: 'a', cat: 'theory',
    q: 'Spring Boot mặc định dùng CGLIB proxy (`proxyTargetClass = true`). Hệ quả nào đúng?',
    opts: [
      'Bean bắt buộc phải implement interface',
      'Proxy là subclass sinh động của class bean; method `final` không thể bị override nên advice (ví dụ @Transactional) trên method final không có hiệu lực, và class final không thể proxy',
      'CGLIB proxy chỉ chặn method private',
      'CGLIB không hỗ trợ constructor injection',
    ], ans: 'B',
    exp: 'JDK dynamic proxy cần interface và chỉ chặn method của interface; CGLIB tạo subclass nên chặn được method public/protected không final. Đây là lý do Kotlin cần plugin `kotlin-spring` (all-open). Khi inject theo kiểu class cụ thể mà bean dùng JDK proxy sẽ gặp lỗi "bean is not of required type ... but was actually of type jdk.proxy...".',
    tags: ['cglib', 'jdk-proxy', 'final'], sec: 50,
  },
  {
    id: 'SPR-026', topic: 'Spring AOP', d: 'i', cat: 'theory',
    q: 'Trong Spring AOP, advice `@Around` khác `@Before`/`@AfterReturning` ở điểm quan trọng nào?',
    opts: [
      '@Around chỉ chạy sau method',
      '@Around bao quanh lời gọi: tự quyết định có gọi `joinPoint.proceed()` hay không, có thể đổi tham số/kết quả, bắt exception và đo thời gian; quên gọi proceed() thì method gốc không chạy',
      '@Around không truy cập được tham số',
      '@Before có thể thay đổi giá trị trả về',
    ], ans: 'B',
    exp: '@Around là loại advice mạnh nhất (dùng cho transaction, retry, metrics) nhưng dễ gây lỗi: phải trả về kết quả của proceed() và không nuốt exception ngoài ý muốn. Nguyên tắc: dùng loại advice yếu nhất đủ đáp ứng nhu cầu.',
    tags: ['aop', 'around-advice'], sec: 40,
  },
  {
    id: 'SPR-027', topic: 'Spring AOP', d: 'i', cat: 'bug',
    q: 'Method `sendReport()` được đánh dấu `@Async`, nhưng request vẫn chờ tới khi báo cáo gửi xong (10 giây). `@EnableAsync` đã được cấu hình. Nguyên nhân khả dĩ nhất?',
    code: `
@Service
public class ReportService {
    public void generate(Long id) {
        Report r = build(id);
        sendReport(r);           // kỳ vọng chạy nền
    }

    @Async
    public void sendReport(Report r) { mailClient.send(r); }
}`,
    opts: [
      '@Async chỉ hoạt động với method trả về CompletableFuture',
      'Self-invocation: `sendReport` được gọi qua `this` nên không đi qua proxy, @Async bị bỏ qua và chạy đồng bộ',
      'Thread pool mặc định chỉ có 1 thread',
      'Mail client không hỗ trợ bất đồng bộ',
    ], ans: 'B',
    exp: '@Async cũng là AOP dựa trên proxy, cùng hạn chế với @Transactional. Tách sendReport sang bean khác. Ngoài ra nên cấu hình `ThreadPoolTaskExecutor` có giới hạn (Spring Boot tự cấu hình `applicationTaskExecutor`), và xử lý exception của method void bằng `AsyncUncaughtExceptionHandler`.',
    tags: ['async', 'self-invocation'], sec: 45,
  },
  {
    id: 'SPR-028', topic: '@Component, @Service, @Repository và @Controller', d: 'b', cat: 'theory',
    q: '`@RestController` tương đương với tổ hợp annotation nào?',
    opts: ['@Controller + @ResponseBody', '@Component + @RequestMapping', '@Service + @ResponseBody', '@Controller + @RequestBody'], ans: 'A',
    exp: '@RestController = @Controller + @ResponseBody: giá trị trả về của mọi handler method được ghi trực tiếp vào HTTP response body (qua HttpMessageConverter, ví dụ Jackson → JSON), thay vì được hiểu là tên view.',
    tags: ['restcontroller', 'responsebody'], sec: 20,
  },
  {
    id: 'SPR-029', topic: 'Dependency Injection', d: 'i', cat: 'theory',
    q: 'Có 3 bean implement `DiscountRule`, được đánh dấu `@Order(1)`, `@Order(2)`, `@Order(3)`. Service khai báo constructor nhận `List<DiscountRule> rules`. Spring inject gì?',
    opts: [
      'Lỗi NoUniqueBeanDefinitionException',
      'Một List chứa cả 3 bean, sắp xếp theo @Order (giá trị nhỏ trước)',
      'Chỉ bean @Order(1)',
      'Một List rỗng',
    ], ans: 'B',
    exp: 'Khi điểm inject là collection/Map của một kiểu, Spring gom mọi bean phù hợp (List/Set theo thứ tự `@Order`/`Ordered`; `Map<String, T>` với key là tên bean). Đây là cách cài đặt Chain of Responsibility/Strategy gọn gàng: thêm rule mới chỉ cần thêm bean. Nếu không có bean nào, List không tự rỗng mà gây lỗi — trừ khi dùng `ObjectProvider` hoặc `@Autowired(required = false)`.',
    tags: ['di', 'list-injection', 'order'], sec: 40,
  },
  {
    id: 'SPR-030', topic: 'Constructor Injection', d: 'b', cat: 'theory',
    q: 'Class sau dùng Lombok. Spring inject dependency như thế nào?',
    code: `
@Service
@RequiredArgsConstructor
public class InvoiceService {
    private final InvoiceRepository repository;
    private final MailSender mailSender;
    private String lastError;   // không final
}`,
    opts: [
      'Không inject được vì thiếu @Autowired',
      'Lombok sinh constructor cho các field `final` (repository, mailSender); vì class chỉ có một constructor, Spring dùng nó để inject mà không cần @Autowired. Field không final (lastError) không có trong constructor',
      'Inject cả lastError bằng chuỗi rỗng',
      'Phải thêm @Autowired cho từng field',
    ], ans: 'B',
    exp: 'Từ Spring 4.3, class có đúng một constructor được dùng tự động cho injection. `@RequiredArgsConstructor` là cách viết phổ biến cho constructor injection. Lưu ý field mutable như lastError trong singleton là trạng thái dùng chung giữa các thread — nên tránh.',
    tags: ['constructor-injection', 'lombok'], sec: 30,
  },
  {
    id: 'SPR-031', topic: 'Component Scanning', d: 'a', cat: 'debug',
    q: 'Hai class `com.acme.order.ReportService` và `com.acme.billing.ReportService` đều có `@Service` (không đặt tên). Ứng dụng không khởi động được. Lỗi gì và vì sao?',
    opts: [
      'NoUniqueBeanDefinitionException khi inject',
      '`ConflictingBeanDefinitionException`: tên bean mặc định được sinh từ tên class đơn giản viết thường chữ đầu (`reportService`), hai class trùng tên đơn giản tạo ra hai bean cùng tên. Đặt tên rõ ràng `@Service("orderReportService")` hoặc đổi tên class',
      'StackOverflowError',
      'Spring tự chọn class được quét trước',
    ], ans: 'B',
    exp: '`AnnotationBeanNameGenerator` dùng simple class name, không gồm package. Spring Boot mặc định cũng không cho ghi đè bean definition (`spring.main.allow-bean-definition-overriding=false`), giúp phát hiện xung đột sớm thay vì âm thầm thay bean.',
    tags: ['component-scan', 'bean-name', 'conflict'], sec: 45,
  },
]);
