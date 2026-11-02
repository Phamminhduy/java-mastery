/* Module 9: Hibernate và JPA */
QB.module({
  id: 'hibernate-jpa', order: 9, title: 'Hibernate và JPA',
  description: 'Entity lifecycle, Persistence Context, Cache, quan hệ, Fetching, Cascade, Dirty Checking, Flush, JPQL, N+1, @Version, OSIV và lỗi thường gặp.',
  topics: ['Entity', 'Entity Lifecycle', 'Persistence Context', 'First-level Cache và Second-level Cache', 'EntityManager', 'JpaRepository',
    'One-to-One', 'One-to-Many', 'Many-to-One', 'Many-to-Many', 'FetchType LAZY và EAGER', 'Cascade', 'Orphan Removal', 'Dirty Checking',
    'Flush và Commit', 'JPQL', 'Native Query', 'N+1 Problem', 'Optimistic Locking với @Version', 'Transaction Management',
    'Open Session in View', 'Các lỗi thường gặp khi làm việc với Hibernate'],
}, [
  {
    id: 'JPA-001', topic: 'Entity', d: 'b', cat: 'theory',
    q: 'Yêu cầu nào sau đây **không** bắt buộc đối với một JPA entity class?',
    opts: [
      'Có annotation @Entity',
      'Có thuộc tính định danh với @Id',
      'Có constructor không tham số (public hoặc protected)',
      'Implement Serializable',
    ], ans: 'D',
    exp: 'Spec JPA yêu cầu @Entity, @Id và no-arg constructor (để provider khởi tạo bằng reflection). Class/method/field persistence không nên `final` để Hibernate tạo proxy cho lazy loading. Serializable chỉ cần khi entity được truyền qua cơ chế serialization (ví dụ remote, HTTP session), không bắt buộc.',
    tags: ['entity', 'jpa-spec'], sec: 30,
  },
  {
    id: 'JPA-002', topic: 'Entity Lifecycle', d: 'i', cat: 'theory',
    q: 'Một entity được tải bằng `findById` trong method `@Transactional` của service, rồi được trả về controller. Khi controller chạy (OSIV tắt), entity đang ở trạng thái nào?',
    opts: ['Transient', 'Managed', 'Detached', 'Removed'], ans: 'C',
    exp: 'Bốn trạng thái: **Transient** (new, chưa gắn persistence context), **Managed** (được persistence context theo dõi, thay đổi tự đồng bộ), **Detached** (từng managed nhưng persistence context đã đóng hoặc bị detach/clear), **Removed** (đánh dấu xóa, DELETE khi flush). Khi transaction kết thúc, persistence context đóng nên entity trở thành detached — thay đổi sau đó không được lưu và truy cập lazy association sẽ lỗi.',
    tags: ['entity-lifecycle', 'detached'], sec: 40,
  },
  {
    id: 'JPA-003', topic: 'Entity Lifecycle', d: 'a', cat: 'bug',
    q: '`dto` là một `Product` detached nhận từ client (có id). Sau khi method kết thúc, giá trị `discount` có được lưu vào DB không?',
    code: `
@Transactional
public void update(Product dto) {
    Product saved = productRepository.save(dto);   // dto có id -> merge
    dto.setDiscount(new BigDecimal("0.10"));
}`,
    opts: [
      'Có, vì dto đã được save',
      'Không: với entity đã có id, `save()` gọi `em.merge()` — trả về một instance **managed khác** (saved) và dto vẫn detached; thay đổi trên dto không được theo dõi',
      'Có, nhưng chỉ khi gọi flush()',
      'Ném IllegalStateException',
    ], ans: 'B',
    exp: '`merge` copy trạng thái của object truyền vào sang instance managed (tải từ DB hoặc từ persistence context) và trả về instance đó. Phải dùng giá trị trả về: `saved.setDiscount(...)`. Ngoài ra, nhận entity trực tiếp từ request là rủi ro (mass assignment ghi đè field không mong muốn) — nên nhận DTO, tải entity rồi cập nhật có chọn lọc.',
    tags: ['merge', 'detached', 'save'], sec: 60,
  },
  {
    id: 'JPA-004', topic: 'First-level Cache và Second-level Cache', d: 'i', cat: 'output',
    q: 'Trong **một** transaction, đoạn code sau phát sinh bao nhiêu câu SELECT và in ra gì (không bật second-level cache)?',
    code: `
@Transactional
public void check(Long id) {
    Customer a = customerRepository.findById(id).orElseThrow();
    Customer b = customerRepository.findById(id).orElseThrow();
    System.out.println(a == b);
}`,
    opts: ['2 SELECT, false', '1 SELECT, true', '1 SELECT, false', '2 SELECT, true'], ans: 'B',
    exp: 'Persistence context (first-level cache) đảm bảo **mỗi id chỉ có một instance managed** trong phạm vi context. `findById` (em.find) kiểm tra context trước, nên lần thứ hai không truy vấn DB và trả về cùng object. Lưu ý: query JPQL (`findByEmail`) vẫn chạy SQL, nhưng kết quả cũng được map về instance đã có trong context.',
    tags: ['first-level-cache', 'persistence-context', 'identity'], sec: 45,
  },
  {
    id: 'JPA-005', topic: 'First-level Cache và Second-level Cache', d: 'a', cat: 'tradeoff',
    q: 'Phát biểu nào đúng về second-level cache của Hibernate?',
    opts: [
      'Bật mặc định và cache mọi entity',
      'Dùng chung giữa các Session/EntityManager (mức SessionFactory), cần provider (ví dụ JCache với Ehcache/Caffeine) và đánh dấu entity @Cacheable; phù hợp dữ liệu đọc nhiều, ít thay đổi. Cần cẩn trọng khi có nhiều instance hoặc DB bị sửa từ bên ngoài',
      'Thay thế hoàn toàn first-level cache',
      'Tự đồng bộ khi một hệ thống khác cập nhật DB',
    ], ans: 'B',
    exp: 'L2 cache giảm truy vấn cho dữ liệu tham chiếu (danh mục, cấu hình). Rủi ro: dữ liệu cũ khi DB bị sửa bởi job/SQL ngoài Hibernate, hoặc khi cache cục bộ trên nhiều node không đồng bộ (cần cache phân tán hoặc TTL ngắn). Query cache là cơ chế riêng, thường ít hiệu quả hơn mong đợi.',
    tags: ['second-level-cache', 'caching'], sec: 50,
  },
  {
    id: 'JPA-006', topic: 'Dirty Checking', d: 'i', cat: 'output',
    q: 'Method sau được gọi qua proxy. Có câu UPDATE nào được gửi xuống DB không?',
    code: `
@Transactional
public void rename(Long id, String newName) {
    Product p = productRepository.findById(id).orElseThrow();
    p.setName(newName);
    // không gọi save()
}`,
    opts: [
      'Không, vì không gọi save()',
      'Có: p là entity managed; khi transaction commit, Hibernate flush và dirty checking phát hiện field thay đổi so với snapshot nên sinh UPDATE',
      'Chỉ khi entity có @DynamicUpdate',
      'Có, nhưng chỉ khi gọi em.refresh(p)',
    ], ans: 'B',
    exp: 'Hibernate lưu snapshot trạng thái lúc tải entity; lúc flush so sánh để sinh UPDATE (mặc định cập nhật tất cả cột; @DynamicUpdate chỉ cập nhật cột thay đổi). Gọi `save()` cho entity managed là thừa (vô hại). Hệ quả: vô tình sửa entity managed (ví dụ để format hiển thị) cũng sẽ bị lưu xuống DB.',
    tags: ['dirty-checking', 'flush'], sec: 45,
  },
  {
    id: 'JPA-007', topic: 'Dirty Checking', d: 'i', cat: 'bug',
    q: 'Method sau **không** có `@Transactional`, Open Session in View tắt. Vì sao giá mới không được lưu?',
    code: `
public void changePrice(Long id, BigDecimal price) {
    Product p = productRepository.findById(id).orElseThrow();
    p.setPrice(price);
}`,
    opts: [
      'Do BigDecimal immutable',
      '`findById` chạy trong transaction riêng của repository (SimpleJpaRepository là @Transactional(readOnly = true)); sau khi trả về, persistence context đóng và p là detached nên thay đổi không được theo dõi',
      'Do thiếu @DynamicUpdate',
      'Do Spring Data cache kết quả',
    ], ans: 'B',
    exp: 'Dirty checking chỉ hoạt động khi entity còn managed trong một persistence context đang mở và có flush/commit. Cần `@Transactional` ở tầng service bao trùm cả việc đọc và sửa, hoặc gọi `save(p)` (merge) — nhưng cách đầu rõ ràng và hiệu quả hơn.',
    tags: ['dirty-checking', 'transactional', 'detached'], sec: 50,
  },
  {
    id: 'JPA-008', topic: 'Flush và Commit', d: 'a', cat: 'theory',
    q: 'Phát biểu nào đúng về flush trong JPA/Hibernate (FlushMode AUTO mặc định)?',
    opts: [
      'flush() đồng nghĩa với commit transaction',
      'flush đồng bộ thay đổi trong persistence context xuống DB (gửi SQL) nhưng chưa commit; Hibernate tự flush trước khi commit và trước khi chạy query có thể bị ảnh hưởng bởi thay đổi chưa flush',
      'flush xóa toàn bộ persistence context',
      'Thay đổi chỉ được gửi xuống DB khi gọi save()',
    ], ans: 'B',
    exp: 'Sau flush, dữ liệu vẫn có thể rollback. Auto-flush trước query đảm bảo query thấy thay đổi của chính transaction. `clear()` mới xóa persistence context (dùng cùng flush khi xử lý batch lớn). Trong transaction readOnly, Spring đặt FlushMode MANUAL.',
    tags: ['flush', 'commit', 'flushmode'], sec: 45,
  },
  {
    id: 'JPA-009', topic: 'Flush và Commit', d: 's', cat: 'debug',
    q: 'Entity `User` dùng `@GeneratedValue(strategy = SEQUENCE)`, cột email có UNIQUE. Code bắt `DataIntegrityViolationException` quanh `save()` để trả lỗi 409 khi email trùng, nhưng client vẫn nhận 500. Vì sao?',
    code: `
@Transactional
public User register(SignupRequest req) {
    try {
        return userRepository.save(new User(req.email()));
    } catch (DataIntegrityViolationException e) {
        throw new EmailAlreadyUsedException(req.email());
    }
}`,
    opts: [
      'Do UNIQUE constraint không hoạt động với SEQUENCE',
      'Với SEQUENCE, `persist` chỉ lấy id từ sequence; câu INSERT được hoãn tới lúc flush (khi commit, **sau** khi ra khỏi khối try), nên exception phát sinh ở tầng transaction interceptor ngoài try/catch',
      'Do DataIntegrityViolationException là checked exception',
      'Do save() chạy bất đồng bộ',
    ], ans: 'B',
    exp: 'Hibernate trì hoãn INSERT để gom batch (write-behind). Với IDENTITY thì INSERT chạy ngay khi persist (cần id), nên hành vi khác nhau theo chiến lược sinh id. Cách sửa: `saveAndFlush()` trong try, hoặc kiểm tra trước (vẫn cần constraint cho race condition), hoặc xử lý `DataIntegrityViolationException` ở @RestControllerAdvice.',
    tags: ['flush', 'write-behind', 'unique-constraint'], sec: 75,
  },
  {
    id: 'JPA-010', topic: 'Các lỗi thường gặp khi làm việc với Hibernate', d: 'a', cat: 'perf',
    q: 'Import 200.000 bản ghi bằng `saveAll()` đã bật `hibernate.jdbc.batch_size=50` nhưng log vẫn cho thấy từng câu INSERT riêng lẻ. Entity dùng `@GeneratedValue(strategy = GenerationType.IDENTITY)`. Nguyên nhân?',
    opts: [
      'batch_size phải là bội số của 100',
      'Với IDENTITY, Hibernate phải thực thi INSERT ngay để lấy id do DB sinh, nên vô hiệu hóa JDBC batch insert. Dùng SEQUENCE với pooled optimizer (allocationSize phù hợp) để batch được',
      'saveAll không hỗ trợ batch',
      'Do thiếu @Transactional',
    ], ans: 'B',
    exp: 'JDBC batching gom nhiều câu lệnh trong một round-trip. IDENTITY (auto-increment) không biết id trước khi insert nên không batch được. SEQUENCE + `allocationSize` (ví dụ 50) cho phép lấy trước một khối id. Với PostgreSQL thêm `reWriteBatchedInserts=true` ở driver; xử lý theo lô có `flush()` + `clear()` để persistence context không phình to.',
    tags: ['batch-insert', 'identity', 'sequence'], sec: 60,
  },
  {
    id: 'JPA-011', topic: 'N+1 Problem', d: 'i', cat: 'perf',
    q: '`Order` có `@ManyToOne(fetch = LAZY) Customer customer`. API trả 100 đơn hàng kèm tên khách hàng và log cho thấy 101 câu SQL. Cách khắc phục phù hợp nhất cho use case này?',
    code: `
List<Order> orders = orderRepository.findByStatus(Status.PAID);   // 1 query
return orders.stream()
    .map(o -> new OrderDto(o.getId(), o.getCustomer().getName()))  // +1 query mỗi đơn
    .toList();`,
    opts: [
      'Đổi sang FetchType.EAGER',
      'Tải kèm association trong query: `@Query("select o from Order o join fetch o.customer where o.status = :s")` hoặc `@EntityGraph(attributePaths = "customer")`; hoặc dùng DTO projection chỉ lấy cột cần thiết',
      'Bật second-level cache cho Order',
      'Tăng connection pool',
    ], ans: 'B',
    exp: 'Lazy proxy của mỗi customer được khởi tạo riêng khi truy cập → N query. JOIN FETCH/EntityGraph lấy cùng lúc trong 1 query. EAGER không giải quyết triệt để: với query JPQL, Hibernate vẫn tải association EAGER bằng các SELECT riêng (vẫn N+1) và áp dụng cho mọi use case khác. `@BatchSize`/`hibernate.default_batch_fetch_size` giảm N+1 thành ~N/size query.',
    tags: ['n+1', 'join-fetch', 'entitygraph'], sec: 55,
  },
  {
    id: 'JPA-012', topic: 'N+1 Problem', d: 's', cat: 'debug',
    q: 'Query `select distinct o from Order o join fetch o.items` được dùng với `Pageable` (page size 20). Log Hibernate cảnh báo "firstResult/maxResults specified with collection fetch; applying in memory" và API ngốn nhiều bộ nhớ. Giải thích và cách sửa?',
    opts: [
      'Cảnh báo vô hại, bỏ qua',
      'Fetch join collection làm mỗi Order nhân thành nhiều dòng, nên Hibernate không thể LIMIT ở SQL mà tải **toàn bộ** kết quả rồi phân trang trong bộ nhớ. Sửa: truy vấn trang id trước (có LIMIT), rồi fetch join theo danh sách id đó; hoặc dùng @BatchSize cho collection',
      'Phải dùng native query cho mọi phân trang',
      'Đổi items thành EAGER',
    ], ans: 'B',
    exp: 'Đây là lỗi hiệu năng nghiêm trọng thường chỉ lộ ra khi dữ liệu lớn (có thể gây OOM). Hibernate 6 có thể cấu hình `hibernate.query.fail_on_pagination_over_collection_fetch=true` để biến cảnh báo thành lỗi. Mẫu hai bước: `select o.id from Order o where ... order by ...` (pageable) → `select o from Order o join fetch o.items where o.id in :ids`.',
    tags: ['pagination', 'fetch-join', 'collection'], sec: 75,
  },
  {
    id: 'JPA-013', topic: 'Các lỗi thường gặp khi làm việc với Hibernate', d: 'a', cat: 'runtime',
    q: 'Entity `Post` có hai collection `List<Comment> comments` và `List<Tag> tags` (cả hai là @OneToMany/@ManyToMany kiểu List, không có @OrderColumn). Query `select p from Post p join fetch p.comments join fetch p.tags` ném lỗi gì?',
    opts: [
      'LazyInitializationException',
      'MultipleBagFetchException: cannot simultaneously fetch multiple bags',
      'NonUniqueResultException',
      'Không lỗi, kết quả chính xác',
    ], ans: 'B',
    exp: 'List không có index được Hibernate xem là "bag" (cho phép trùng). Fetch join hai bag cùng lúc tạo tích Descartes (comments × tags) và Hibernate không thể khử trùng đúng nên từ chối. Giải pháp: fetch từng collection bằng query riêng (cùng persistence context sẽ ghép lại), dùng @BatchSize; đổi sang Set chỉ tránh lỗi nhưng vẫn sinh tích Descartes rất tốn kém.',
    tags: ['multiplebagfetchexception', 'fetch-join', 'cartesian-product'], sec: 55,
  },
  {
    id: 'JPA-014', topic: 'FetchType LAZY và EAGER', d: 'i', cat: 'theory',
    q: 'FetchType **mặc định** theo đặc tả JPA của các loại quan hệ là gì?',
    opts: [
      'Tất cả đều LAZY',
      '@ManyToOne và @OneToOne: EAGER; @OneToMany và @ManyToMany: LAZY',
      '@OneToMany: EAGER; còn lại LAZY',
      'Tất cả đều EAGER',
    ], ans: 'B',
    exp: 'Quan hệ "to-one" mặc định EAGER là nguồn gốc của nhiều truy vấn thừa và N+1. Khuyến nghị phổ biến: khai báo tường minh `fetch = FetchType.LAZY` cho mọi @ManyToOne/@OneToOne, rồi quyết định tải kèm theo từng use case bằng JOIN FETCH/EntityGraph.',
    tags: ['fetchtype', 'eager', 'lazy'], sec: 35,
  },
  {
    id: 'JPA-015', topic: 'FetchType LAZY và EAGER', d: 'i', cat: 'debug',
    q: 'Controller gọi `orderService.find(id)` (method @Transactional trả về entity Order), sau đó Jackson serialize `order.getItems()` (LAZY) và ném `LazyInitializationException: could not initialize proxy - no Session`. `spring.jpa.open-in-view=false`. Cách xử lý đúng hướng nhất?',
    opts: [
      'Bật lại open-in-view',
      'Trong service (khi transaction còn mở), tải đủ dữ liệu cần dùng (JOIN FETCH/EntityGraph) và map sang DTO trả về controller; không serialize entity trực tiếp',
      'Đổi items sang EAGER',
      'Dùng `hibernate.enable_lazy_load_no_trans=true`',
    ], ans: 'B',
    exp: 'Lazy proxy cần Session mở để tải dữ liệu. Ranh giới transaction ở service nên quyết định dữ liệu cần lấy. Trả DTO còn giúp ổn định contract API, tránh vòng lặp serialize ở quan hệ hai chiều và tránh lộ field nội bộ. `enable_lazy_load_no_trans` mở connection tạm cho mỗi lần lazy load — anti-pattern; OSIV che giấu N+1 và giữ connection lâu.',
    tags: ['lazyinitializationexception', 'dto', 'osiv'], sec: 50,
  },
  {
    id: 'JPA-016', topic: 'Open Session in View', d: 'a', cat: 'tradeoff',
    q: 'Spring Boot bật `spring.jpa.open-in-view=true` mặc định (và in cảnh báo khi khởi động). Đánh giá nào chính xác về OSIV?',
    opts: [
      'OSIV chỉ có lợi, nên luôn bật',
      'OSIV giữ EntityManager (và thường là connection DB) mở suốt request đến khi render xong response, giúp tránh LazyInitializationException nhưng che giấu N+1 ở tầng view/serialization và giữ connection lâu hơn — dễ cạn pool khi tải cao. Nhiều team tắt nó và tải dữ liệu tường minh ở service',
      'OSIV tạo transaction cho mọi request',
      'OSIV chỉ ảnh hưởng tới ứng dụng dùng Thymeleaf',
    ], ans: 'B',
    exp: 'Với OSIV, lazy loading xảy ra ngoài transaction (ở chế độ auto-commit) khi Jackson truy cập association, tạo truy vấn khó kiểm soát. Tắt OSIV buộc thiết kế ranh giới dữ liệu rõ ràng; khi bật thì cần giám sát số query mỗi request.',
    tags: ['osiv', 'open-in-view', 'connection-pool'], sec: 55,
  },
  {
    id: 'JPA-017', topic: 'Cascade', d: 'a', cat: 'bug',
    q: 'Mapping sau được viết "cho tiện". Khi xóa một đơn hàng (`orderRepository.delete(order)`), điều gì xảy ra?',
    code: `
@Entity
public class Order {
    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "customer_id")
    private Customer customer;
}`,
    opts: [
      'Chỉ xóa đơn hàng',
      'Cascade REMOVE lan sang Customer: Hibernate cố xóa luôn khách hàng — lỗi FK nếu khách còn đơn khác, hoặc mất dữ liệu khách hàng nếu không còn',
      'Customer bị set NULL',
      'Lỗi compile',
    ], ans: 'B',
    exp: 'Cascade nên đi từ **cha sở hữu vòng đời** xuống con (Order → OrderItem), gần như không bao giờ từ con lên cha qua @ManyToOne. CascadeType.ALL bao gồm PERSIST, MERGE, REMOVE, REFRESH, DETACH. Chỉ khai báo cascade thực sự cần.',
    tags: ['cascade', 'manytoone', 'remove'], sec: 50,
  },
  {
    id: 'JPA-018', topic: 'Orphan Removal', d: 'i', cat: 'output',
    q: 'Trong một transaction, `order.getItems().remove(item)` được gọi trên Order managed. Với mapping sau, lúc flush Hibernate làm gì với item?',
    code: `
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
private List<OrderItem> items = new ArrayList<>();`,
    opts: [
      'Không làm gì, item vẫn tồn tại trong DB',
      'Sinh câu DELETE cho OrderItem vì nó trở thành "mồ côi" (không còn thuộc cha)',
      'Set order_id của item thành NULL',
      'Ném exception vì phải gọi itemRepository.delete()',
    ], ans: 'B',
    exp: '`orphanRemoval = true` xóa entity con khi nó bị gỡ khỏi collection của cha — phù hợp khi con không có ý nghĩa nếu tách khỏi cha (dòng đơn hàng). Khác với CascadeType.REMOVE chỉ xóa con khi **cha** bị xóa. Lưu ý: không thay thế collection bằng instance mới (`setItems(new ArrayList<>())`) vì Hibernate có thể báo lỗi "collection with cascade=all-delete-orphan was no longer referenced".',
    tags: ['orphanremoval', 'onetomany'], sec: 45,
  },
  {
    id: 'JPA-019', topic: 'One-to-Many', d: 'a', cat: 'bug',
    q: 'Quan hệ hai chiều Order–OrderItem. Sau khi chạy code dưới, các dòng order_item được insert nhưng cột `order_id` bằng NULL. Vì sao?',
    code: `
// Order:      @OneToMany(mappedBy = "order", cascade = CascadeType.ALL) List<OrderItem> items;
// OrderItem:  @ManyToOne @JoinColumn(name = "order_id") Order order;

Order order = new Order();
OrderItem item = new OrderItem("SKU-1", 2);
order.getItems().add(item);
orderRepository.save(order);`,
    opts: [
      'Do thiếu orphanRemoval',
      'Phía sở hữu (owning side) là OrderItem.order (có @JoinColumn); phía `mappedBy` bị bỏ qua khi ghi khóa ngoại. Code chỉ set phía inverse nên order_id NULL. Cần đồng bộ hai chiều, ví dụ method `order.addItem(item)` gán cả `item.setOrder(this)`',
      'Do cascade không áp dụng cho List',
      'Do phải save item trước order',
    ], ans: 'B',
    exp: 'Trong quan hệ hai chiều, chỉ owning side quyết định giá trị cột FK. Cascade vẫn persist item (nên có INSERT) nhưng item.order = null. Viết helper add/remove trong entity cha để luôn đồng bộ hai phía và đảm bảo object graph trong bộ nhớ nhất quán.',
    tags: ['bidirectional', 'owning-side', 'mappedby'], sec: 60,
  },
  {
    id: 'JPA-020', topic: 'One-to-Many', d: 'i', cat: 'theory',
    q: 'Mapping `@OneToMany private List<Address> addresses;` **một chiều**, không có `@JoinColumn` hay `mappedBy`. Hibernate tạo/ánh xạ thế nào?',
    opts: [
      'Thêm cột FK customer_id vào bảng address',
      'Dùng **bảng nối** (join table, ví dụ customer_addresses) giữa hai bảng',
      'Lưu danh sách id dạng chuỗi',
      'Báo lỗi mapping',
    ], ans: 'B',
    exp: 'Theo JPA, @OneToMany một chiều mặc định dùng join table — thêm một bảng và các thao tác INSERT/DELETE thừa. Nếu muốn FK nằm ở bảng con: thêm `@JoinColumn(name = "customer_id")` (vẫn có thể phát sinh UPDATE bổ sung), hoặc tốt nhất là quan hệ hai chiều với @ManyToOne ở phía con.',
    tags: ['onetomany', 'unidirectional', 'join-table'], sec: 40,
  },
  {
    id: 'JPA-021', topic: 'Many-to-Many', d: 'i', cat: 'design',
    q: 'Quan hệ Student–Course ban đầu là `@ManyToMany`. Nay cần lưu thêm ngày đăng ký và điểm số cho mỗi cặp. Thiết kế phù hợp?',
    opts: [
      'Thêm field registeredAt vào Student',
      'Tạo entity trung gian `Enrollment` (student, course, registeredAt, grade) với hai quan hệ @ManyToOne; Student/Course có @OneToMany tới Enrollment',
      'Dùng @ElementCollection lưu Map<Course, LocalDate>',
      'Giữ @ManyToMany và thêm cột vào join table bằng native query',
    ], ans: 'B',
    exp: '@ManyToMany chỉ phù hợp khi bảng nối không có thuộc tính riêng. Khi quan hệ có dữ liệu, nó trở thành một entity thực sự (association entity), dễ truy vấn, validate và mở rộng. Ngoài ra, với @ManyToMany nên dùng Set thay vì List để tránh Hibernate xóa toàn bộ rồi insert lại khi sửa collection.',
    tags: ['manytomany', 'association-entity'], sec: 45,
  },
  {
    id: 'JPA-022', topic: 'One-to-One', d: 's', cat: 'perf',
    q: '`User` có `@OneToOne(mappedBy = "user", fetch = FetchType.LAZY) UserProfile profile;` (FK nằm ở bảng user_profile). Khi tải danh sách User, log vẫn thấy một SELECT user_profile cho mỗi user. Vì sao?',
    opts: [
      'Do LAZY bị Spring Boot bỏ qua',
      'Ở phía không sở hữu (mappedBy) của @OneToOne, Hibernate không biết profile có tồn tại hay không nếu không truy vấn (không có cột FK ở bảng user để quyết định null hay proxy), nên phải tải ngay. Giải pháp: dùng @MapsId để chia sẻ khóa chính, chỉ map một chiều từ phía sở hữu, hoặc bytecode enhancement',
      'Do thiếu @JoinColumn ở User',
      'Do UserProfile không có @Entity',
    ], ans: 'B',
    exp: 'Proxy chỉ hợp lệ khi biết chắc association khác null. Với @ManyToOne/@OneToOne phía sở hữu, giá trị FK cho biết điều này; phía inverse thì không. `@MapsId` khiến user_profile.id = user.id nên có thể truy vấn trực tiếp theo id khi cần mà không map phía inverse.',
    tags: ['onetoone', 'lazy', 'mapsid'], sec: 75,
  },
  {
    id: 'JPA-023', topic: 'JPQL', d: 'b', cat: 'runtime',
    q: 'Entity được khai báo `@Entity @Table(name = "tbl_orders") public class Order { ... private Long customerId; }`. Query JPQL nào hợp lệ?',
    opts: [
      'SELECT o FROM tbl_orders o WHERE o.customer_id = :id',
      'SELECT o FROM Order o WHERE o.customerId = :id',
      'SELECT * FROM Order WHERE customerId = :id',
      'SELECT o FROM tbl_orders o WHERE o.customerId = :id',
    ], ans: 'B',
    exp: 'JPQL làm việc với **tên entity và tên thuộc tính Java**, không phải tên bảng/cột. Hibernate dịch sang SQL dựa trên mapping. Native query (`nativeQuery = true`) mới dùng tên bảng/cột thực tế.',
    tags: ['jpql'], sec: 30,
  },
  {
    id: 'JPA-024', topic: 'Native Query', d: 'i', cat: 'bug',
    q: 'Repository có method tìm kiếm sau. Vấn đề nghiêm trọng nhất?',
    code: `
public List<Product> search(String keyword) {
    String sql = "SELECT * FROM product WHERE name LIKE '%" + keyword + "%'";
    return em.createNativeQuery(sql, Product.class).getResultList();
}`,
    opts: [
      'LIKE chậm',
      'SQL Injection: keyword do người dùng nhập được nối thẳng vào câu SQL (ví dụ `%\' OR 1=1 --`). Phải dùng tham số ràng buộc: `... LIKE :kw` với `setParameter("kw", "%" + keyword + "%")`',
      'Native query không trả về entity',
      'Thiếu @Transactional',
    ], ans: 'B',
    exp: 'Parameter binding (PreparedStatement) tách dữ liệu khỏi câu lệnh nên không thể thay đổi cấu trúc SQL. Áp dụng cho cả JPQL và native query. Nếu cần sắp xếp động theo tên cột, dùng whitelist cột hợp lệ (không bind được tên cột). Cũng nên escape ký tự đại diện `%`, `_` trong keyword nếu cần tìm chính xác.',
    tags: ['sql-injection', 'native-query', 'security'], sec: 45,
  },
  {
    id: 'JPA-025', topic: 'JpaRepository', d: 's', cat: 'debug',
    q: 'Trong cùng một transaction: tải `Product p` (price = 100), chạy bulk update `@Modifying @Query("update Product p set p.price = p.price * 1.1")`, rồi đọc lại `productRepository.findById(p.getId())`. Giá trị price nhận được và vấn đề là gì?',
    opts: [
      '110, không vấn đề',
      '100: bulk update chạy thẳng xuống DB, bỏ qua persistence context; findById trả về instance cũ đang managed. Dùng `@Modifying(clearAutomatically = true, flushAutomatically = true)` hoặc tự flush/clear',
      '121 do cập nhật hai lần',
      'Ném OptimisticLockException',
    ], ans: 'B',
    exp: 'JPQL UPDATE/DELETE hàng loạt không đồng bộ với entity đã tải; persistence context giữ trạng thái cũ. Nguy hiểm hơn: nếu entity cũ bị sửa và flush sau đó, nó có thể ghi đè dữ liệu mới. Bulk update cũng không tăng @Version và không kích hoạt callback/cascade — cần tự xử lý.',
    tags: ['modifying', 'bulk-update', 'persistence-context'], sec: 70,
  },
  {
    id: 'JPA-026', topic: 'Optimistic Locking với @Version', d: 'i', cat: 'design',
    q: 'Entity `Ticket` có `@Version Long version`. Hai nhân viên cùng sửa một ticket; người lưu sau nhận `ObjectOptimisticLockingFailureException`. Cách xử lý phù hợp ở API REST?',
    opts: [
      'Bắt exception và âm thầm lưu đè bằng dữ liệu của người sau',
      'Trả 409 Conflict (kèm thông điệp yêu cầu tải lại dữ liệu mới nhất); client gửi kèm version (hoặc ETag/If-Match) để server kiểm tra. Với thao tác tự động không có người dùng, có thể retry có giới hạn',
      'Trả 500 Internal Server Error',
      'Xóa cột version để tránh lỗi',
    ], ans: 'B',
    exp: 'Optimistic locking ngăn lost update khi xung đột hiếm. Version phải đi cùng dữ liệu tới client và quay lại khi cập nhật — nếu server tải lại entity mới nhất rồi áp dữ liệu client, kiểm tra version sẽ vô tác dụng (trừ khi so sánh version client gửi). HTTP hỗ trợ tự nhiên bằng ETag + If-Match → 412 Precondition Failed.',
    tags: ['version', 'optimistic-locking', '409'], sec: 50,
  },
  {
    id: 'JPA-027', topic: 'JpaRepository', d: 'b', cat: 'theory',
    q: 'Method nào là **derived query** hợp lệ của Spring Data JPA cho entity `User(email, status, createdAt)`?',
    opts: [
      'List<User> getUsersWhereEmailIs(String email)',
      'List<User> findTop10ByStatusOrderByCreatedAtDesc(Status status)',
      'List<User> selectByEmail(String email)',
      'List<User> findByEmailWhereStatus(String email, Status status)',
    ], ans: 'B',
    exp: 'Spring Data phân tích tên method theo tiền tố `find/read/get/query/count/exists/delete…By`, sau đó là các thuộc tính, toán tử (And, Or, Between, LessThan, In, Containing…), `OrderBy...Asc/Desc` và giới hạn `Top/First`. Tên sai cú pháp sẽ gây lỗi khi khởi động. Truy vấn phức tạp nên dùng @Query hoặc Specification/Querydsl.',
    tags: ['spring-data', 'derived-query'], sec: 30,
  },
  {
    id: 'JPA-028', topic: 'JpaRepository', d: 'i', cat: 'perf',
    q: 'Màn hình danh sách chỉ hiển thị id, mã đơn và tổng tiền, nhưng entity `Order` có 40 cột và nhiều quan hệ. Cách truy vấn hiệu quả nhất với Spring Data JPA?',
    opts: [
      'findAll() rồi map sang DTO',
      'Dùng projection: interface projection hoặc DTO/record projection (`select new com.acme.OrderRow(o.id, o.code, o.total) from Order o ...`) để chỉ SELECT các cột cần',
      'Bật EAGER cho mọi quan hệ',
      'Dùng second-level cache cho Order',
    ], ans: 'B',
    exp: 'Projection giảm dữ liệu truyền tải, không tạo entity managed (không tốn snapshot cho dirty checking) và tránh tải quan hệ ngoài ý muốn. Lưu ý interface projection "open" (dùng SpEL @Value) sẽ tải cả entity, mất lợi ích.',
    tags: ['projection', 'dto', 'performance'], sec: 45,
  },
  {
    id: 'JPA-029', topic: 'JpaRepository', d: 's', cat: 'perf',
    q: 'Entity `Product` có id do hệ thống bên ngoài cấp (`@Id String sku;`, không @GeneratedValue). Khi import 10.000 sản phẩm **mới** bằng `saveAll()`, log cho thấy trước mỗi INSERT có một SELECT. Vì sao và cách khắc phục?',
    opts: [
      'Do thiếu index trên sku',
      '`SimpleJpaRepository.save()` dùng `isNew()`: với id do người dùng gán (khác null) và không có @Version, entity bị coi là không mới nên gọi `merge()` — merge SELECT trước để kiểm tra tồn tại. Implement `Persistable<String>` với isNew() phù hợp (hoặc thêm @Version kiểu wrapper), hoặc dùng em.persist',
      'Do Hibernate luôn SELECT trước INSERT',
      'Do batch_size quá nhỏ',
    ], ans: 'B',
    exp: 'Spring Data quyết định persist hay merge dựa trên id null (hoặc version null nếu có @Version kiểu wrapper). Merge cho entity chưa tồn tại tốn thêm một SELECT mỗi dòng. `Persistable` (thường với cờ transient `isNew` được đặt bằng @PostLoad/@PostPersist) cho phép kiểm soát chính xác.',
    tags: ['persistable', 'isnew', 'merge'], sec: 70,
  },
  {
    id: 'JPA-030', topic: 'Các lỗi thường gặp khi làm việc với Hibernate', d: 'i', cat: 'debug',
    q: 'Entity `Department` và `Employee` có quan hệ hai chiều; cả hai dùng Lombok `@Data`. Khi log một Department, ứng dụng ném StackOverflowError (hoặc chạy hàng loạt query lazy). Nguyên nhân?',
    opts: [
      'Do Lombok không tương thích Hibernate',
      '`@Data` sinh toString/equals/hashCode bao gồm mọi field, kể cả association: Department.toString gọi Employee.toString gọi lại Department… gây đệ quy vô hạn và kích hoạt lazy loading. Loại association khỏi toString/equals (@ToString.Exclude) hoặc tự viết',
      'Do log level DEBUG',
      'Do thiếu @Transactional',
    ], ans: 'B',
    exp: 'Với entity JPA, tránh `@Data`; dùng @Getter/@Setter có chọn lọc, toString chỉ gồm field đơn giản, equals/hashCode theo id/business key (xem thêm vấn đề hashCode thay đổi khi id được gán). Jackson cũng gặp vòng lặp tương tự nếu serialize entity hai chiều — lý do nên trả DTO.',
    tags: ['lombok', 'tostring', 'bidirectional'], sec: 45,
  },
  {
    id: 'JPA-031', topic: 'Transaction Management', d: 'a', cat: 'perf',
    q: 'Batch job đọc file 500.000 dòng và `persist` từng entity trong **một** transaction. Sau ~200.000 dòng, job rất chậm và gần hết heap. Cải tiến đúng?',
    opts: [
      'Tăng -Xmx lên 16GB',
      'Persistence context giữ mọi entity managed (kèm snapshot) nên phình to, dirty checking mỗi lần flush ngày càng tốn. Xử lý theo lô: mỗi N (ví dụ 50–500) bản ghi gọi `flush()` + `clear()`, bật JDBC batching; cân nhắc chia nhiều transaction nhỏ có khả năng chạy lại (Spring Batch chunk)',
      'Gọi System.gc() sau mỗi 1.000 dòng',
      'Đổi sang FetchType.LAZY',
    ], ans: 'B',
    exp: 'First-level cache không có giới hạn kích thước. clear() giải phóng entity đã ghi xuống DB. Một transaction khổng lồ còn giữ lock và undo/WAL lớn, rollback rất lâu khi lỗi. Với khối lượng rất lớn, JDBC batch hoặc công cụ bulk load của DB (COPY trong PostgreSQL, SQL*Loader) hiệu quả hơn ORM.',
    tags: ['batch', 'flush-clear', 'persistence-context'], sec: 60,
  },
  {
    id: 'JPA-032', topic: 'Persistence Context', d: 'i', cat: 'theory',
    q: 'Trong ứng dụng Spring dùng `@PersistenceContext EntityManager em` (transaction-scoped, mặc định), phát biểu nào đúng về Persistence Context?',
    opts: [
      'Mỗi lần gọi method của em tạo một Persistence Context mới',
      'Persistence Context gắn với transaction hiện tại: mọi repository/EntityManager được inject dùng chung một context trong cùng transaction; context đóng khi transaction kết thúc. EntityManager được inject thực chất là proxy thread-safe chuyển lời gọi tới context của transaction đang chạy',
      'Persistence Context dùng chung cho toàn bộ ứng dụng như một cache toàn cục',
      'Persistence Context chỉ tồn tại trong repository',
    ], ans: 'B',
    exp: 'Persistence Context là tập các entity managed với đảm bảo "một id ↔ một instance". Spring inject `SharedEntityManager` proxy nên có thể inject vào bean singleton an toàn. Ngoài transaction (và không có OSIV), mỗi thao tác dùng context tạm thời rồi đóng ngay, nên entity trả về là detached. Extended persistence context (sống qua nhiều transaction) hiếm khi dùng trong ứng dụng Spring stateless.',
    tags: ['persistence-context', 'entitymanager', 'transaction-scoped'], sec: 50,
  },
  {
    id: 'JPA-033', topic: 'EntityManager', d: 'a', cat: 'theory',
    q: 'Khác biệt giữa `em.find(Product.class, id)` và `em.getReference(Product.class, id)` (Spring Data: `findById` và `getReferenceById`)?',
    opts: [
      'Hoàn toàn giống nhau',
      '`find` truy vấn ngay (hoặc lấy từ persistence context) và trả về null nếu không tồn tại; `getReference` có thể trả về proxy chưa khởi tạo mà **không** truy vấn DB — chỉ truy vấn khi truy cập field khác id, và ném EntityNotFoundException lúc đó nếu không tồn tại',
      'getReference luôn nhanh hơn và an toàn hơn trong mọi trường hợp',
      'find chỉ dùng được với khóa phức hợp',
    ], ans: 'B',
    exp: 'getReference hữu ích khi chỉ cần tham chiếu để gán quan hệ (thiết lập khóa ngoại) mà không cần dữ liệu của entity. Nếu cần kiểm tra tồn tại hoặc đọc dữ liệu, dùng find. Truy cập proxy chưa khởi tạo sau khi persistence context đóng sẽ gây LazyInitializationException.',
    tags: ['entitymanager', 'getreference', 'find', 'proxy'], sec: 50,
  },
  {
    id: 'JPA-034', topic: 'Many-to-One', d: 'a', cat: 'perf',
    q: 'API tạo `OrderItem` nhận `productId`. Code hiện tại `Product p = productRepository.findById(productId).orElseThrow(); item.setProduct(p);` phát sinh một SELECT product mỗi item, trong khi không dùng dữ liệu nào của Product (giá đã có trong request và đã được kiểm tra ở bước khác). Cách tối ưu phù hợp?',
    code: `
@Entity
class OrderItem {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;
}`,
    opts: [
      'Đổi quan hệ thành EAGER',
      'Dùng `productRepository.getReferenceById(productId)` để lấy proxy chỉ chứa id và gán vào quan hệ; câu INSERT chỉ cần giá trị khóa ngoại. Ràng buộc FK ở DB vẫn bảo vệ trường hợp productId không tồn tại',
      'Lưu productId dưới dạng String thay vì quan hệ',
      'Gọi findAll() một lần và cache toàn bộ Product',
    ], ans: 'B',
    exp: 'Với @ManyToOne, phía sở hữu chỉ cần id của entity tham chiếu để ghi cột FK. Proxy tránh được SELECT thừa. Đánh đổi: lỗi "không tồn tại" sẽ đến từ vi phạm FK lúc flush thay vì lỗi nghiệp vụ rõ ràng, nên phù hợp khi id đã được xác minh hoặc lỗi FK được ánh xạ thành response phù hợp.',
    tags: ['manytoone', 'getreference', 'performance'], sec: 55,
  },
  {
    id: 'JPA-035', topic: 'Cascade', d: 'i', cat: 'runtime',
    q: '`Order` có `@ManyToOne Address shippingAddress` (không khai báo cascade). Code tạo `new Address(...)` mới (chưa lưu), gán vào order rồi `orderRepository.save(order)`. Điều gì xảy ra lúc flush?',
    opts: [
      'Hibernate tự lưu Address trước',
      'Lỗi kiểu "object references an unsaved transient instance" (TransientPropertyValueException/TransientObjectException): order tham chiếu một entity transient. Cần lưu Address trước hoặc cấu hình cascade PERSIST phù hợp với vòng đời',
      'shipping_address_id được lưu là NULL',
      'Address được lưu nhưng order thì không',
    ], ans: 'B',
    exp: 'Không có cascade, Hibernate không tự persist entity liên quan. Quyết định cascade dựa trên quan hệ vòng đời: nếu Address thuộc riêng Order (composition) có thể cascade hoặc dùng `@Embeddable`; nếu Address dùng chung giữa nhiều order thì nên lưu riêng.',
    tags: ['cascade', 'transient', 'persist'], sec: 45,
  },
  {
    id: 'JPA-036', topic: 'JPQL', d: 'i', cat: 'theory',
    q: 'Muốn JPQL trả trực tiếp DTO `com.acme.report.OrderSummary(Long id, String customerName, BigDecimal total)`. Câu lệnh nào đúng?',
    opts: [
      'select OrderSummary(o.id, o.customer.name, o.total) from Order o',
      'select new com.acme.report.OrderSummary(o.id, c.name, o.total) from Order o join o.customer c',
      'select o.* into OrderSummary from Order o',
      'select new OrderSummary from orders',
    ], ans: 'B',
    exp: 'Constructor expression yêu cầu từ khóa `new` và tên class đầy đủ (fully qualified), với constructor khớp thứ tự/kiểu tham số. Hibernate 6 có thể nhận tên ngắn trong một số trường hợp, nhưng tên đầy đủ là cách chuẩn. Kết hợp với Spring Data, có thể trả về interface/record projection.',
    tags: ['jpql', 'constructor-expression', 'dto'], sec: 40,
  },
  {
    id: 'JPA-037', topic: 'Entity', d: 'i', cat: 'debug',
    q: 'Entity có `@Enumerated private OrderStatus status;` với enum `NEW, PAID, SHIPPED`. Sau khi thêm `CANCELLED` vào **giữa** NEW và PAID, dữ liệu cũ hiển thị sai trạng thái. Vì sao?',
    opts: [
      'Do Hibernate cache',
      '`@Enumerated` mặc định là `EnumType.ORDINAL`: lưu vị trí (0, 1, 2) thay vì tên. Chèn hằng mới làm dịch vị trí, dữ liệu cũ ánh xạ sang trạng thái khác. Dùng `@Enumerated(EnumType.STRING)` (kèm migration dữ liệu) hoặc AttributeConverter với mã cố định',
      'Do enum không hỗ trợ JPA',
      'Do thiếu @Column',
    ], ans: 'B',
    exp: 'ORDINAL tiết kiệm dung lượng nhưng phụ thuộc thứ tự khai báo — bất kỳ ai sắp xếp lại enum cũng làm hỏng dữ liệu. STRING an toàn hơn (nhưng đổi tên hằng cũng cần migration); converter với mã nghiệp vụ ổn định là lựa chọn cho hệ thống dài hạn.',
    tags: ['enumerated', 'ordinal', 'data-corruption'], sec: 45,
  },
  {
    id: 'JPA-038', topic: 'Many-to-Many', d: 'a', cat: 'perf',
    q: '`Student` có `@ManyToMany List<Course> courses`. Khi gỡ một khóa học khỏi danh sách 30 khóa của sinh viên, log Hibernate cho thấy DELETE toàn bộ dòng của sinh viên trong bảng nối rồi INSERT lại 29 dòng. Vì sao và cách cải thiện?',
    opts: [
      'Do thiếu index',
      'List không có index được xem là "bag": Hibernate không xác định được dòng nào cần xóa nên xóa hết rồi chèn lại. Dùng `Set<Course>` (với equals/hashCode hợp lý) để Hibernate chỉ xóa đúng một dòng, hoặc chuyển sang entity trung gian',
      'Do cascade REMOVE',
      'Do FetchType.LAZY',
    ], ans: 'B',
    exp: 'Với Set, mỗi phần tử là duy nhất nên Hibernate sinh câu DELETE cụ thể. Thêm `@OrderColumn` cho List cũng cho phép cập nhật theo vị trí nhưng phức tạp hơn. Quan hệ nhiều-nhiều có thuộc tính riêng nên mô hình hóa bằng entity trung gian.',
    tags: ['manytomany', 'bag', 'set'], sec: 55,
  },
]);
