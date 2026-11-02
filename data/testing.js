/* Module 12: Testing */
QB.module({
  id: 'testing', order: 12, title: 'Testing',
  description: 'JUnit 5, Mockito, Spring Boot test slices, MockMvc, Testcontainers, test transaction, test pyramid và lỗi thường gặp.',
  topics: ['Unit Testing', 'Integration Testing', 'JUnit 5', 'Mockito', 'Mock và Spy', '@Mock và @InjectMocks', '@SpringBootTest', '@WebMvcTest',
    'MockMvc', 'Testcontainers', 'Testing Repository', 'Testing Service', 'Testing Controller', 'Test Coverage', 'Testing Transaction',
    'Test Pyramid', 'Các lỗi thường gặp khi viết Unit Test'],
}, [
  {
    id: 'TST-001', topic: 'Unit Testing', d: 'b', cat: 'theory',
    q: 'Đặc điểm nào mô tả đúng một **unit test** tốt?',
    opts: [
      'Kết nối database thật để đảm bảo chính xác',
      'Kiểm tra một đơn vị logic tách biệt khỏi hạ tầng (DB, mạng, file), chạy nhanh (mili giây), xác định (deterministic), độc lập với thứ tự chạy',
      'Phải khởi động toàn bộ Spring context',
      'Chỉ chạy được trên máy của developer viết nó',
    ], ans: 'B',
    exp: 'Thuộc tính FIRST: Fast, Independent, Repeatable, Self-validating, Timely. Dependency bên ngoài được thay bằng test double (mock/stub/fake). Integration test mới kiểm tra sự phối hợp với hạ tầng thật.',
    tags: ['unit-test', 'first'], sec: 25,
  },
  {
    id: 'TST-002', topic: 'JUnit 5', d: 'i', cat: 'output',
    q: 'Hai test chạy theo thứ tự bất kỳ. Mỗi test in ra gì (JUnit 5, cấu hình mặc định)?',
    code: `
class CounterTest {
    private int counter = 0;

    @BeforeEach
    void setUp() { counter++; }

    @Test void first()  { System.out.println("first="  + counter); }
    @Test void second() { System.out.println("second=" + counter); }
}`,
    opts: ['first=1, second=2', 'first=1, second=1', 'first=0, second=0', 'Phụ thuộc thứ tự chạy'], ans: 'B',
    exp: 'JUnit 5 mặc định dùng `TestInstance.Lifecycle.PER_METHOD`: tạo **instance mới** của class test cho mỗi method, nên trạng thái field không chia sẻ giữa các test. `@BeforeEach` chạy trước mỗi test. Với `@TestInstance(PER_CLASS)` thì dùng chung instance (cho phép @BeforeAll không static) và kết quả sẽ phụ thuộc thứ tự.',
    tags: ['junit5', 'lifecycle', 'beforeeach'], sec: 40,
  },
  {
    id: 'TST-003', topic: 'JUnit 5', d: 'b', cat: 'theory',
    q: 'Cách kiểm tra một method ném `InsufficientBalanceException` với message chứa "balance" trong JUnit 5?',
    opts: [
      '@Test(expected = InsufficientBalanceException.class)',
      'var ex = assertThrows(InsufficientBalanceException.class, () -> wallet.withdraw(500)); assertTrue(ex.getMessage().contains("balance"));',
      'try { wallet.withdraw(500); } catch (Exception e) { }',
      'assertEquals(InsufficientBalanceException.class, wallet.withdraw(500));',
    ], ans: 'B',
    exp: '`@Test(expected=...)` là cú pháp JUnit 4. `assertThrows` trả về exception để kiểm tra thêm và chỉ áp dụng cho đúng đoạn lambda (không vô tình pass khi exception đến từ phần setup). Khối try/catch rỗng khiến test pass kể cả khi không có exception.',
    tags: ['junit5', 'assertthrows'], sec: 30,
  },
  {
    id: 'TST-004', topic: 'JUnit 5', d: 'i', cat: 'theory',
    q: 'Cần test hàm tính phí với 8 bộ dữ liệu (đầu vào → kết quả mong đợi) mà không lặp code. Tính năng JUnit 5 phù hợp?',
    opts: [
      'Viết 8 method @Test giống nhau',
      '`@ParameterizedTest` với nguồn dữ liệu như `@CsvSource({"100, STANDARD, 15", ...})` hoặc `@MethodSource`',
      'Dùng vòng for trong một @Test',
      '@RepeatedTest(8)',
    ], ans: 'B',
    exp: 'Parameterized test báo cáo từng bộ dữ liệu như một test riêng (biết chính xác case nào fail), khác với vòng for dừng ở lỗi đầu tiên. `@RepeatedTest` chạy lặp cùng một dữ liệu.',
    tags: ['parameterizedtest', 'csvsource'], sec: 30,
  },
  {
    id: 'TST-005', topic: 'Mockito', d: 'i', cat: 'output',
    q: 'Với Mockito 2+, `repo` là mock và **chưa** được stub. Kết quả in ra là gì?',
    code: `
interface UserRepository {
    Optional<User> findById(Long id);
    List<User> findAll();
    long count();
}

UserRepository repo = mock(UserRepository.class);
System.out.println(repo.findById(1L) + " " + repo.findAll() + " " + repo.count());`,
    opts: ['null null 0', 'Optional.empty [] 0', 'Ném NullPointerException', 'Ném UnfinishedStubbingException'], ans: 'B',
    exp: 'Answer mặc định `RETURNS_DEFAULTS` trả giá trị "rỗng" hợp lý: 0/false cho primitive, collection rỗng, `Optional.empty()`, Stream rỗng; null cho các object khác. Do đó quên stub có thể khiến test đi vào nhánh "không tìm thấy" mà không báo lỗi rõ ràng.',
    tags: ['mockito', 'default-answer'], sec: 45,
  },
  {
    id: 'TST-006', topic: 'Mock và Spy', d: 'a', cat: 'bug',
    q: '`list` là spy của một `ArrayList` rỗng. Dòng stubbing ném `IndexOutOfBoundsException`. Vì sao và cách viết đúng?',
    code: `
List<String> list = spy(new ArrayList<>());
when(list.get(0)).thenReturn("foo");`,
    opts: [
      'Spy không cho phép stub',
      'Với spy, biểu thức `list.get(0)` bên trong `when(...)` gọi **phương thức thật** trên list rỗng trước khi stub được áp dụng. Dùng `doReturn("foo").when(list).get(0)`',
      'Phải dùng mock thay vì spy cho List',
      'Do thiếu @ExtendWith',
    ], ans: 'B',
    exp: 'Mock: mọi method là giả trừ khi stub. Spy: bọc object thật, method gọi thật trừ khi stub. Cú pháp `doReturn/doThrow/doNothing().when(spy).method()` không gọi method thật. Lạm dụng spy (partial mock) thường là dấu hiệu class cần được tách nhỏ.',
    tags: ['spy', 'doreturn'], sec: 50,
  },
  {
    id: 'TST-007', topic: '@Mock và @InjectMocks', d: 'i', cat: 'bug',
    q: 'Test JUnit 5 sau ném NullPointerException ngay dòng đầu của test. Thiếu gì?',
    code: `
class OrderServiceTest {
    @Mock OrderRepository repo;
    @InjectMocks OrderService service;

    @Test
    void createsOrder() {
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        service.create(new CreateOrderCommand("SKU-1", 2));
    }
}`,
    opts: [
      'Thiếu @SpringBootTest',
      'Thiếu `@ExtendWith(MockitoExtension.class)` trên class (hoặc gọi `MockitoAnnotations.openMocks(this)`), nên @Mock/@InjectMocks không được khởi tạo và `repo` là null',
      'Thiếu @Autowired',
      'any() không dùng được với save',
    ], ans: 'B',
    exp: 'Annotation của Mockito cần extension/runner xử lý. Với JUnit 4 là `@RunWith(MockitoJUnitRunner.class)`. @InjectMocks ưu tiên constructor injection lớn nhất, sau đó setter/field. Không cần Spring context cho unit test service.',
    tags: ['mockito-extension', 'injectmocks'], sec: 40,
  },
  {
    id: 'TST-008', topic: 'Mockito', d: 'i', cat: 'debug',
    q: 'Test dùng `MockitoExtension` fail với `UnnecessaryStubbingException` dù logic đúng. Ý nghĩa?',
    opts: [
      'Mockito bị lỗi phiên bản',
      'Strict stubs: có stub được khai báo nhưng code dưới test không hề gọi tới. Thường là stub thừa còn sót lại (nên xóa) hoặc dấu hiệu code không đi vào nhánh mong đợi; chỉ dùng `lenient()` khi thật sự cần',
      'Phải gọi verify cho mọi stub',
      'Thiếu @MockBean',
    ], ans: 'B',
    exp: 'Strict stubbing (mặc định của MockitoExtension) giúp test gọn và phát hiện lỗi sớm, ví dụ stub với tham số khác với tham số thực tế được gọi (khi đó Mockito còn báo PotentialStubbingProblem).',
    tags: ['strict-stubs', 'unnecessarystubbingexception'], sec: 40,
  },
  {
    id: 'TST-009', topic: 'Mockito', d: 'i', cat: 'theory',
    q: 'Service tạo object `AuditLog` bên trong rồi gọi `auditRepository.save(log)`. Test cần kiểm tra field `action` của object được lưu là "LOGIN". Cách phù hợp?',
    opts: [
      'verify(auditRepository).save(new AuditLog("LOGIN"))',
      'Dùng `ArgumentCaptor<AuditLog>`: `verify(auditRepository).save(captor.capture()); assertEquals("LOGIN", captor.getValue().getAction());`',
      'Đọc lại từ database',
      'Không thể kiểm tra',
    ], ans: 'B',
    exp: 'ArgumentCaptor bắt tham số thực tế để assert chi tiết. Cách verify với `new AuditLog("LOGIN")` chỉ đúng nếu AuditLog có equals phù hợp (và các field như timestamp khớp chính xác). Cũng có thể dùng `argThat(log -> "LOGIN".equals(log.getAction()))`.',
    tags: ['argumentcaptor', 'verify'], sec: 40,
  },
  {
    id: 'TST-010', topic: '@SpringBootTest', d: 'i', cat: 'tradeoff',
    q: 'Bộ test có 400 class đều dùng `@SpringBootTest`, CI mất 25 phút. Nhiều class lại khai báo @MockBean khác nhau. Nguyên nhân chậm chính và hướng cải thiện?',
    opts: [
      'Do JUnit 5 chậm hơn JUnit 4',
      '@SpringBootTest nạp toàn bộ context; mỗi tổ hợp cấu hình/@MockBean khác nhau làm vô hiệu context cache nên phải khởi động lại context nhiều lần. Dùng unit test thuần cho logic, test slice (@WebMvcTest, @DataJpaTest) cho từng tầng, và chuẩn hóa cấu hình integration test để tái sử dụng context',
      'Do thiếu RAM trên CI',
      'Do dùng assertEquals',
    ], ans: 'B',
    exp: 'Spring TestContext Framework cache ApplicationContext theo "khóa" cấu hình (classes, profiles, properties, mock beans...). Khác nhau dù chỉ một @MockBean cũng tạo context mới. Gom các integration test dùng chung một base class cấu hình là kỹ thuật phổ biến.',
    tags: ['springboottest', 'context-caching', 'test-slices'], sec: 55,
  },
  {
    id: 'TST-011', topic: '@WebMvcTest', d: 'i', cat: 'debug',
    q: 'Test `@WebMvcTest(OrderController.class)` lỗi khi khởi động: "No qualifying bean of type OrderService". Vì sao và sửa thế nào?',
    opts: [
      'Do thiếu @SpringBootApplication trong test',
      '@WebMvcTest chỉ nạp các thành phần tầng web (controller, ControllerAdvice, converter, filter, Spring Security...), không nạp @Service/@Repository. Cần cung cấp mock: `@MockitoBean OrderService` (Spring Boot 3.4+, thay cho @MockBean đã deprecated)',
      'Phải dùng @SpringBootTest',
      'Do OrderService không có interface',
    ], ans: 'B',
    exp: 'Test slice giúp test nhanh và tập trung: kiểm tra mapping URL, validation, serialization, mã lỗi, phân quyền. Logic nghiệp vụ được giả lập. `@MockBean` của Spring Boot bị deprecated từ 3.4 để chuyển sang `@MockitoBean` của Spring Framework 6.2.',
    tags: ['webmvctest', 'mockitobean', 'test-slice'], sec: 45, ver: 'Spring Boot 3.4+',
  },
  {
    id: 'TST-012', topic: 'MockMvc', d: 'i', cat: 'theory',
    q: 'Viết test kiểm tra `POST /api/orders` với body rỗng `{}` trả về 400 và có lỗi cho field `sku`. Đoạn nào đúng?',
    lang: 'java', code: `
mockMvc.perform(post("/api/orders")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{}"))
    .andExpect(status().isBadRequest())
    .andExpect(jsonPath("$.errors[0].field").value("sku"));`,
    opts: [
      'Đúng: gửi JSON với Content-Type phù hợp và kiểm tra status lẫn nội dung lỗi bằng jsonPath (giả định cấu trúc lỗi của API có mảng errors)',
      'Sai: MockMvc không kiểm tra được status',
      'Sai: phải khởi động server thật trên cổng 8080',
      'Sai: jsonPath chỉ dùng cho XML',
    ], ans: 'A',
    exp: 'MockMvc thực thi request qua DispatcherServlet mà không cần server thật, kiểm tra được mapping, validation, @ControllerAdvice và JSON. Thiếu `contentType` sẽ nhận 415 thay vì 400. Kiểm tra cả nội dung lỗi giúp đảm bảo contract với client.',
    tags: ['mockmvc', 'jsonpath', 'validation'], sec: 45,
  },
  {
    id: 'TST-013', topic: 'Testcontainers', d: 'a', cat: 'tradeoff',
    q: 'Production dùng PostgreSQL với native query dùng `jsonb`, `ON CONFLICT` và window function. Integration test hiện chạy trên H2 in-memory và luôn pass, nhưng production lỗi cú pháp. Giải pháp nào phù hợp?',
    opts: [
      'Bật chế độ tương thích PostgreSQL của H2 là đủ',
      'Dùng Testcontainers chạy PostgreSQL thật (cùng phiên bản production) trong Docker cho integration test; Spring Boot 3.1+ hỗ trợ `@ServiceConnection` để tự cấu hình datasource',
      'Bỏ integration test',
      'Viết lại mọi query bằng JPQL đơn giản',
    ], ans: 'B',
    exp: 'H2 chỉ mô phỏng một phần cú pháp/hành vi của DB khác (kiểu dữ liệu, locking, isolation, hàm). Test trên DB khác production tạo cảm giác an toàn giả. Testcontainers chậm hơn H2 một chút nhưng đáng tin cậy; có thể tái sử dụng container giữa các test class để giảm thời gian. Flyway migration cũng được kiểm tra luôn.',
    tags: ['testcontainers', 'h2', 'postgresql'], sec: 50, ver: 'Spring Boot 3.1+',
  },
  {
    id: 'TST-014', topic: 'Testing Repository', d: 'i', cat: 'theory',
    q: 'Phát biểu nào đúng về `@DataJpaTest` trong Spring Boot?',
    opts: [
      'Nạp toàn bộ context gồm cả controller và service',
      'Chỉ nạp cấu hình JPA (entity, repository, DataSource, Flyway/Liquibase), mỗi test chạy trong transaction và **rollback** khi kết thúc; mặc định thay DataSource bằng DB nhúng trừ khi dùng `@AutoConfigureTestDatabase(replace = NONE)` (hoặc Testcontainers @ServiceConnection)',
      'Không hỗ trợ native query',
      'Bắt buộc dùng H2',
    ], ans: 'B',
    exp: 'Vì test được bọc trong transaction và rollback, dữ liệu không ảnh hưởng test khác. Lưu ý: nếu không flush, một số lỗi (constraint, mapping) chỉ phát sinh khi flush — có thể dùng `saveAndFlush` hoặc `TestEntityManager.flush()` để chắc chắn SQL thực sự chạy.',
    tags: ['datajpatest', 'repository-test'], sec: 40,
  },
  {
    id: 'TST-015', topic: 'Testing Transaction', d: 's', cat: 'debug',
    q: 'Integration test được đánh dấu `@Transactional` (rollback sau mỗi test) và luôn pass. Nhưng ở production, API ném `LazyInitializationException` và listener `@TransactionalEventListener(AFTER_COMMIT)` gửi email lại không chạy trong test. Giải thích đúng?',
    opts: [
      'Do test dùng H2',
      'Transaction của test bao trùm toàn bộ lời gọi: persistence context còn mở nên lazy loading "may mắn" chạy được, và vì test rollback nên không bao giờ có commit → AFTER_COMMIT listener không chạy. Test không phản ánh ranh giới transaction thật; nên có test không dùng @Transactional (dọn dữ liệu thủ công) cho các luồng này',
      'Do MockMvc không hỗ trợ transaction',
      'Do test chạy song song',
    ], ans: 'B',
    exp: '@Transactional trên test tiện cho việc dọn dữ liệu nhưng làm thay đổi hành vi: che giấu lỗi lazy loading, flush không xảy ra (constraint không được kiểm tra), code chạy ở thread khác (async, MockMvc với server thật qua TestRestTemplate) không thấy dữ liệu chưa commit. Hiểu điều này giúp tránh "test xanh, production đỏ".',
    tags: ['transactional-test', 'rollback', 'lazy-loading'], sec: 70,
  },
  {
    id: 'TST-016', topic: 'Test Pyramid', d: 'b', cat: 'theory',
    q: 'Theo mô hình Test Pyramid, phân bổ test hợp lý là gì?',
    opts: [
      'Nhiều E2E test qua UI nhất, ít unit test',
      'Nhiều unit test (nhanh, rẻ) ở đáy, ít integration test hơn ở giữa, và một số ít E2E test ở đỉnh',
      'Chỉ cần E2E test',
      'Số lượng mỗi loại bằng nhau',
    ], ans: 'B',
    exp: 'Test ở tầng cao chậm, dễ flaky và khó xác định nguyên nhân; tầng thấp nhanh và chính xác. Anti-pattern "ice cream cone" (nhiều E2E/manual) làm feedback chậm. Với microservices, contract test (Spring Cloud Contract, Pact) giúp giảm nhu cầu E2E giữa các service.',
    tags: ['test-pyramid'], sec: 25,
  },
  {
    id: 'TST-017', topic: 'Test Coverage', d: 'i', cat: 'theory',
    q: 'Team đặt mục tiêu 100% line coverage. Nhận định nào đúng nhất?',
    opts: [
      '100% coverage đảm bảo không có bug',
      'Coverage chỉ cho biết dòng code nào **được chạy**, không đảm bảo hành vi được assert đúng; test không có assert vẫn tăng coverage. Nên dùng coverage để tìm vùng chưa được test, kết hợp review chất lượng assert và mutation testing (ví dụ PIT)',
      'Coverage không có giá trị gì',
      'Branch coverage và line coverage là một',
    ], ans: 'B',
    exp: 'Chạy theo con số dễ dẫn tới test vô nghĩa (test getter/setter, test không assert). Mutation testing thay đổi code (đảo điều kiện, đổi toán tử) và kiểm tra test có fail không — đo khả năng phát hiện lỗi thực sự. Branch coverage khắt khe hơn line coverage.',
    tags: ['coverage', 'mutation-testing', 'jacoco'], sec: 40,
  },
  {
    id: 'TST-018', topic: 'Các lỗi thường gặp khi viết Unit Test', d: 'i', cat: 'debug',
    q: 'Test kiểm tra "voucher hết hạn" pass mọi ngày nhưng fail vào ngày cuối tháng và khi CI chạy lúc gần nửa đêm. Code service dùng `LocalDate.now()` trực tiếp. Cách sửa tốt nhất?',
    opts: [
      'Không chạy CI vào cuối tháng',
      'Inject `java.time.Clock` vào service (bean Clock trong production) và dùng `LocalDate.now(clock)`; trong test truyền `Clock.fixed(...)` để thời gian xác định',
      'Thêm Thread.sleep để qua nửa đêm',
      'Mock static LocalDate bằng thư viện bytecode cho mọi test',
    ], ans: 'B',
    exp: 'Phụ thuộc ẩn vào thời gian hệ thống (cũng như random, UUID, múi giờ máy chạy) làm test không xác định (flaky). Clock là dependency tường minh, dễ thay thế. Mock static (mockStatic) dùng được nhưng nặng và che giấu vấn đề thiết kế.',
    tags: ['flaky-test', 'clock', 'time'], sec: 45,
  },
  {
    id: 'TST-019', topic: 'Các lỗi thường gặp khi viết Unit Test', d: 'a', cat: 'debug',
    q: 'Test kiểm tra một handler xử lý message bất đồng bộ dùng `Thread.sleep(2000)` rồi assert. Test thỉnh thoảng fail trên CI và làm bộ test chậm. Cách tốt hơn?',
    opts: [
      'Tăng sleep lên 10 giây',
      'Chờ theo điều kiện có timeout, ví dụ Awaitility: `await().atMost(5, SECONDS).untilAsserted(() -> assertThat(repo.count()).isEqualTo(1))` — kết thúc ngay khi điều kiện đúng',
      'Bỏ test',
      'Chạy test đơn luồng',
    ], ans: 'B',
    exp: 'Sleep cố định vừa chậm (luôn chờ đủ) vừa không chắc chắn (máy CI chậm có thể cần lâu hơn). Polling có điều kiện + timeout cho kết quả nhanh và ổn định hơn. Nếu có thể, tách logic xử lý ra để unit test đồng bộ, chỉ để phần tích hợp cho test bất đồng bộ.',
    tags: ['awaitility', 'async-test', 'flaky-test'], sec: 40,
  },
  {
    id: 'TST-020', topic: 'Testing Service', d: 'a', cat: 'design',
    q: 'Unit test của `PricingService` mock 6 dependency và dùng `verify` kiểm tra thứ tự từng lời gọi nội bộ. Mỗi lần refactor (không đổi kết quả) đều phải sửa hàng loạt test. Nhận định đúng?',
    opts: [
      'Đây là cách viết test tốt vì kiểm tra rất chi tiết',
      'Test đang gắn chặt với chi tiết cài đặt (over-mocking/over-specification). Nên tập trung vào hành vi quan sát được (đầu ra, trạng thái, tác động quan trọng); dùng fake/in-memory cho dependency đơn giản; số lượng dependency lớn cũng là dấu hiệu service cần tách nhỏ',
      'Nên bỏ toàn bộ mock',
      'Nên chuyển sang E2E test',
    ], ans: 'B',
    exp: 'Test tốt bảo vệ hành vi và cho phép refactor tự tin. Chỉ verify các tương tác là một phần của contract (ví dụ "phải gửi sự kiện thanh toán", "không được gọi gateway khi số tiền bằng 0"), không verify mọi lời gọi query nội bộ.',
    tags: ['over-mocking', 'test-design', 'refactoring'], sec: 55,
  },
  {
    id: 'TST-021', topic: 'Integration Testing', d: 'i', cat: 'design',
    q: 'Service gọi API thanh toán bên ngoài qua HTTP. Cách viết integration test cho phần client tích hợp (mapping request/response, xử lý timeout, lỗi 5xx) mà không phụ thuộc hệ thống thật?',
    opts: [
      'Gọi trực tiếp sandbox của đối tác trong mọi lần chạy CI',
      'Dùng HTTP server giả lập như WireMock (hoặc MockRestServiceServer/MockWebServer) để stub response, độ trễ và lỗi; kết hợp contract test nếu đối tác cung cấp',
      'Mock interface client bằng Mockito là đủ để kiểm tra mapping JSON',
      'Bỏ qua test cho phần tích hợp',
    ], ans: 'B',
    exp: 'Mock interface bỏ qua chính phần cần kiểm tra (serialization, header, status code, timeout). WireMock chạy HTTP thật cục bộ, cho phép mô phỏng tình huống khó tạo trên sandbox (chậm, trả 503, body sai). Sandbox của đối tác hữu ích cho kiểm thử định kỳ nhưng không ổn định cho CI.',
    tags: ['wiremock', 'integration-test', 'http-client'], sec: 45,
  },
  {
    id: 'TST-022', topic: 'Testing Controller', d: 'i', cat: 'design',
    q: 'Khi viết test cho một REST controller bằng `@WebMvcTest` + MockMvc (service được mock), những gì **nên** là trọng tâm kiểm tra?',
    opts: [
      'Logic tính toán nghiệp vụ chi tiết bên trong service',
      'Contract HTTP: mapping URL/method, binding tham số, validation trả 400 với lỗi theo field, mã trạng thái cho từng nhánh (201, 404, 409...), định dạng JSON request/response, ánh xạ exception qua @ControllerAdvice và quy tắc phân quyền (401/403)',
      'Câu SQL được sinh ra',
      'Hiệu năng dưới tải 10.000 request/giây',
    ], ans: 'B',
    exp: 'Mỗi tầng test đúng trách nhiệm của nó: controller test bảo vệ contract API mà client phụ thuộc; logic nghiệp vụ được unit test ở service; truy vấn được kiểm tra bằng repository/integration test; hiệu năng bằng load test riêng (Gatling, k6, JMeter). Với Spring Security, dùng `@WithMockUser` hoặc `jwt()` post-processor để test phân quyền.',
    tags: ['controller-test', 'webmvctest', 'api-contract'], sec: 45,
  },
  {
    id: 'TST-023', topic: 'Mock và Spy', d: 'b', cat: 'theory',
    q: 'Khác biệt cơ bản giữa `mock(OrderService.class)` và `spy(new OrderService(...))` trong Mockito?',
    opts: [
      'Không có khác biệt',
      'Mock: mọi method đều giả, trả giá trị mặc định nếu chưa stub, không chạy code thật. Spy: bọc một object thật, method chạy code thật trừ khi được stub; dùng khi cần giữ phần lớn hành vi thật và chỉ thay một vài method',
      'Spy nhanh hơn mock vì không tạo object',
      'Mock chỉ dùng cho interface, spy chỉ dùng cho class final',
    ], ans: 'B',
    exp: 'Mock phù hợp để cô lập dependency. Spy (partial mock) nên dùng hạn chế — nhu cầu spy class đang test thường là dấu hiệu class làm quá nhiều việc. Mockito 5 mặc định dùng inline mock maker nên mock được cả class/method final.',
    tags: ['mockito', 'mock', 'spy'], sec: 30,
  },
  {
    id: 'TST-024', topic: 'Testcontainers', d: 'i', cat: 'perf',
    q: 'Có 40 class integration test, mỗi class khai báo `@Container static PostgreSQLContainer` riêng nên CI khởi động PostgreSQL 40 lần. Cách giảm thời gian phổ biến nhất?',
    opts: [
      'Chuyển sang H2',
      'Dùng một container dùng chung (singleton container pattern: khởi động một lần trong base class/static initializer, hoặc `@ServiceConnection` + cấu hình dùng chung) để mọi test class tái sử dụng; kết hợp cấu hình Spring context giống nhau để tận dụng context cache',
      'Chạy test tuần tự với -Xmx lớn hơn',
      'Bỏ integration test khỏi CI',
    ], ans: 'B',
    exp: 'Khởi động container tốn vài giây mỗi lần. Khi dùng chung container, cần đảm bảo test không phụ thuộc dữ liệu của nhau (dọn dữ liệu, dùng dữ liệu riêng). Testcontainers cũng có tùy chọn reuse cho máy local.',
    tags: ['testcontainers', 'singleton-container', 'ci'], sec: 45,
  },
  {
    id: 'TST-025', topic: '@SpringBootTest', d: 'a', cat: 'debug',
    q: 'Test dùng `@SpringBootTest(webEnvironment = RANDOM_PORT)` + `TestRestTemplate` và đánh dấu `@Transactional` để rollback. Nhưng dữ liệu do API tạo ra vẫn còn trong DB sau test và làm test khác thất bại. Vì sao?',
    opts: [
      'Do TestRestTemplate không hỗ trợ POST',
      'Với server thật trên cổng ngẫu nhiên, request được xử lý trên **thread của server**, trong transaction riêng và commit thật; transaction của test (trên thread test) không bao trùm và rollback của nó không ảnh hưởng. Cần dọn dữ liệu tường minh (xóa sau mỗi test, @Sql, truncate) hoặc dùng MockMvc khi phù hợp',
      'Do @Transactional không dùng được trong test',
      'Do RANDOM_PORT tạo database mới',
    ], ans: 'B',
    exp: 'Transaction gắn với thread. MockMvc chạy trong cùng thread test nên @Transactional rollback có hiệu lực (kèm các hệ quả đã biết); WebTestClient/TestRestTemplate với server thật thì không. Thiết kế test độc lập dữ liệu giúp tránh lỗi phụ thuộc thứ tự chạy.',
    tags: ['springboottest', 'random-port', 'transaction'], sec: 55,
  },
]);
