/* Bài học — Module 12: Testing */
(() => {
  const L = (topic, blocks) => LS.add('testing', topic, blocks);

  L('Unit Testing', [
    'Unit test kiểm tra một đơn vị logic **tách biệt** khỏi hạ tầng (DB, mạng, file), chạy trong mili giây.',
    '- Nguyên tắc **FIRST**: Fast, Independent, Repeatable, Self-validating, Timely.',
    '- Cấu trúc **Arrange – Act – Assert** (Given – When – Then); mỗi test một hành vi, tên mô tả rõ (`shouldRejectExpiredVoucher`).',
    '- Thay dependency bằng test double: mock, stub, fake (in-memory repository).',
    '- Test hành vi quan sát được (output, trạng thái, tương tác quan trọng), không test chi tiết cài đặt.',
    { lang: 'java', code: `
@Test
void appliesTenPercentForGoldCustomer() {
    var calculator = new DiscountCalculator(Clock.fixed(Instant.parse("2026-01-10T00:00:00Z"), UTC));
    var price = calculator.apply(new BigDecimal("200"), Tier.GOLD);
    assertThat(price).isEqualByComparingTo("180");
}` },
  ]);

  L('Integration Testing', [
    'Integration test kiểm tra sự phối hợp giữa các thành phần với hạ tầng thật hoặc gần thật: DB (Testcontainers), HTTP (WireMock), message broker, Spring context.',
    '- Phát hiện lỗi mà unit test không thấy: mapping JPA, SQL, transaction, serialization, cấu hình Spring, migration.',
    '- Chậm hơn → số lượng ít hơn unit test, tập trung luồng quan trọng.',
    '- Dữ liệu test độc lập giữa các test (dọn dữ liệu, dữ liệu riêng).',
    '- Contract test (Spring Cloud Contract, Pact) cho giao tiếp giữa service.',
  ]);

  L('JUnit 5', [
    '- Kiến trúc: JUnit Platform + Jupiter (API mới) + Vintage (chạy test JUnit 4).',
    '- Annotation: `@Test`, `@BeforeEach/@AfterEach`, `@BeforeAll/@AfterAll` (static, trừ PER_CLASS), `@DisplayName`, `@Nested`, `@Disabled`, `@Tag`, `@Timeout`.',
    '- Mặc định tạo **instance mới cho mỗi test** (PER_METHOD).',
    '- `assertThrows`, `assertAll`, `assertTimeout`; AssertJ (`assertThat`) cho assert dễ đọc.',
    '- `@ParameterizedTest` với `@ValueSource`, `@CsvSource`, `@MethodSource`, `@EnumSource`.',
    '- Extension model: `@ExtendWith(MockitoExtension.class)`, `SpringExtension`.',
  ]);

  L('Mockito', [
    { lang: 'java', code: `
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock OrderRepository repo;
    @Mock PaymentGateway gateway;
    @InjectMocks OrderService service;

    @Test
    void chargesAndSaves() {
        when(gateway.charge(any())).thenReturn(PaymentResult.ok("TX1"));
        service.place(new PlaceOrder("SKU-1", 2));
        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
        verify(repo).save(captor.capture());
        assertThat(captor.getValue().status()).isEqualTo(Status.PAID);
        verify(gateway, never()).refund(any());
    }
}` },
    '- Method chưa stub trả giá trị mặc định (null, 0, collection rỗng, `Optional.empty`).',
    '- Strict stubs (MockitoExtension): stub không dùng → `UnnecessaryStubbingException`.',
    '- Argument matchers: dùng matcher thì mọi tham số đều phải là matcher (`eq(1L), any()`).',
    '- Mockito 5 mock được class/method final; `mockStatic` cho static (dùng hạn chế).',
  ]);

  L('Mock và Spy', [
    '- **Mock**: object giả hoàn toàn, mọi method trả mặc định trừ khi stub.',
    '- **Spy**: bọc object thật, method chạy thật trừ khi stub — partial mock.',
    '- Stub spy dùng `doReturn(x).when(spy).method()` (tránh gọi method thật khi stub bằng `when(...)`).',
    '- Phân biệt thuật ngữ: **stub** cung cấp dữ liệu trả về; **mock** kiểm tra tương tác (verify); **fake** cài đặt đơn giản hoạt động được (in-memory DB).',
    '! Cần spy chính class đang test thường là dấu hiệu class quá lớn.',
  ]);

  L('@Mock và @InjectMocks', [
    '- `@Mock` tạo mock; `@InjectMocks` tạo object cần test và inject mock vào (ưu tiên constructor lớn nhất, sau đó setter, field).',
    '- Cần `@ExtendWith(MockitoExtension.class)` (JUnit 5) hoặc `MockitoAnnotations.openMocks(this)` — thiếu thì mock là null.',
    '- Với constructor injection, có thể bỏ @InjectMocks và tự `new Service(mockA, mockB)` cho rõ ràng.',
    '- `@Captor` khai báo ArgumentCaptor; `@Spy` cho spy.',
  ]);

  L('@SpringBootTest', [
    '- Nạp **toàn bộ** ApplicationContext; `webEnvironment`: MOCK (mặc định, dùng MockMvc), RANDOM_PORT/DEFINED_PORT (server thật + TestRestTemplate/WebTestClient), NONE.',
    '- Context được **cache** giữa các test cùng cấu hình; mỗi tổ hợp `@MockitoBean`/property/profile khác nhau tạo context mới → chậm. Gom cấu hình dùng chung vào base class.',
    '- `@Transactional` trên test rollback sau mỗi test — chỉ khi code chạy cùng thread (không áp dụng cho server thật với RANDOM_PORT).',
    '- `@TestPropertySource`, `@DynamicPropertySource`, `@ActiveProfiles("test")`.',
  ]);

  L('@WebMvcTest', [
    '- Test slice chỉ nạp tầng web: controller, `@ControllerAdvice`, converter, filter, Spring Security, Jackson.',
    '- Service/repository không được nạp → cung cấp bằng `@MockitoBean` (Boot 3.4+, thay `@MockBean`).',
    '- Nhanh hơn nhiều so với @SpringBootTest; tập trung contract HTTP.',
    '- Slice khác: `@DataJpaTest`, `@JsonTest`, `@RestClientTest`, `@WebFluxTest`, `@DataRedisTest`.',
    '- Chỉ định controller cần test: `@WebMvcTest(OrderController.class)` để nạp ít bean hơn.',
    '- Cấu hình Security của ứng dụng vẫn được nạp → test cả 401/403; nếu SecurityFilterChain phụ thuộc bean khác, cần `@Import` hoặc mock bean đó.',
    '! Bean tự viết (ví dụ `@Component` converter, filter dùng repository) có thể kéo theo dependency không có trong slice → lỗi khởi động test; mock hoặc loại trừ bằng `excludeFilters`.',
  ]);

  L('MockMvc', [
    { lang: 'java', code: `
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;

    @Test
    void returns400WhenSkuMissing() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content("{}")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.errors[0].field").value("sku"));
    }
}` },
    '- Thực thi request qua DispatcherServlet mà không cần server thật.',
    '- Kiểm tra status, header, JSON (`jsonPath`), view; `andDo(print())` để debug.',
    '- Spring Security test: `@WithMockUser`, `with(jwt())`, `with(csrf())`.',
  ]);

  L('Testcontainers', [
    'Testcontainers chạy dependency thật (PostgreSQL, Oracle Free, Kafka, Redis...) trong Docker cho test.',
    { lang: 'java', code: `
@SpringBootTest
@Testcontainers
class OrderRepositoryIT {
    @Container @ServiceConnection
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16");
}` },
    '- Spring Boot 3.1+: `@ServiceConnection` tự cấu hình datasource/kafka từ container.',
    '- Dùng **cùng phiên bản DB với production**; H2 không mô phỏng đúng cú pháp, locking, kiểu dữ liệu.',
    '- Tăng tốc: singleton container dùng chung cho mọi test class, reuse ở máy local.',
  ]);

  L('Testing Repository', [
    '- `@DataJpaTest`: nạp JPA, mỗi test chạy trong transaction và rollback; mặc định thay bằng DB nhúng — dùng `@AutoConfigureTestDatabase(replace = NONE)` + Testcontainers để test DB thật.',
    '- Test query tự viết (JPQL/native, Specification), mapping, constraint — không test lại method CRUD của Spring Data.',
    '- Gọi `flush()` (hoặc `saveAndFlush`) để SQL thực sự chạy và constraint được kiểm tra; `TestEntityManager` để chuẩn bị dữ liệu.',
    '- Kiểm tra số câu SQL cho truy vấn quan trọng để chống N+1.',
  ]);

  L('Testing Service', [
    '- Unit test với mock dependency hoặc fake; tập trung quy tắc nghiệp vụ, nhánh lỗi, điều kiện biên.',
    '- Inject `Clock`, ID generator để kết quả xác định.',
    '- Verify chỉ các tương tác là một phần contract (gửi event, không gọi gateway khi số tiền 0).',
    '! Over-mocking (mock 6 dependency, verify mọi lời gọi nội bộ) làm test vỡ mỗi lần refactor mà không phát hiện thêm lỗi.',
  ]);

  L('Testing Controller', [
    '- `@WebMvcTest` + MockMvc, service được mock.',
    '- Kiểm tra: mapping URL/method, binding tham số, validation (400 + lỗi theo field), status cho từng nhánh (201, 404, 409), JSON request/response, ánh xạ exception, phân quyền (401/403).',
    '- Không kiểm tra logic nghiệp vụ hay SQL ở đây.',
    '- End-to-end với server thật (RANDOM_PORT) cho vài luồng chính.',
  ]);

  L('Test Coverage', [
    '- Coverage (JaCoCo) đo dòng/nhánh **được chạy**, không đo chất lượng assert.',
    '- Branch coverage khắt khe hơn line coverage.',
    '- Dùng coverage để tìm vùng chưa test, không chạy theo 100%.',
    '- **Mutation testing** (PIT) thay đổi code và kiểm tra test có fail — đo khả năng phát hiện lỗi thật.',
    '- Đặt ngưỡng coverage trong CI cho code mới (diff coverage) thực tế hơn ngưỡng toàn dự án.',
  ]);

  L('Testing Transaction', [
    '- `@Transactional` trên test: rollback sau test, nhưng **thay đổi hành vi**: persistence context mở suốt test (che LazyInitializationException), không commit (AFTER_COMMIT listener không chạy), có thể không flush (constraint không kiểm tra).',
    '- Luồng phụ thuộc commit (event after commit, outbox, async, server thật) cần test không `@Transactional` và dọn dữ liệu thủ công (`@Sql`, truncate).',
    '- Kiểm tra rollback: gây exception rồi assert dữ liệu không đổi (trong test không transactional).',
    '- `TransactionTemplate` trong test để điều khiển ranh giới transaction tường minh.',
  ]);

  L('Test Pyramid', [
    '- Đáy: **nhiều unit test** (nhanh, rẻ, chính xác). Giữa: integration test vừa phải. Đỉnh: ít E2E/UI test.',
    '- Anti-pattern "ice cream cone": nhiều E2E/manual, ít unit → feedback chậm, flaky.',
    '- Microservices: thêm contract test giữa service thay cho E2E diện rộng.',
    '- Mục tiêu là feedback nhanh và tin cậy trong CI.',
  ]);

  L('Các lỗi thường gặp khi viết Unit Test', [
    { table: [['Lỗi', 'Cách sửa'], ['Phụ thuộc thời gian thật (`LocalDate.now()`)', 'Inject `Clock`'], ['`Thread.sleep` chờ async', 'Awaitility chờ theo điều kiện'], ['Test phụ thuộc thứ tự/dữ liệu chung', 'Dữ liệu riêng, dọn sau test'], ['Không có assert / assert yếu', 'Assert kết quả cụ thể'], ['Over-mocking', 'Test hành vi, dùng fake'], ['try/catch rỗng để "test exception"', '`assertThrows`'], ['Test H2 thay DB thật', 'Testcontainers'], ['Một test kiểm tra quá nhiều thứ', 'Tách test, tên rõ ràng']] },
    '- Test flaky làm mất niềm tin vào CI — sửa hoặc cách ly ngay.',
  ]);
})();
