/* Bài học — Module 9: Hibernate và JPA */
(() => {
  const L = (topic, blocks) => LS.add('hibernate-jpa', topic, blocks);

  L('Entity', [
    'Entity là class ánh xạ tới bảng: `@Entity`, `@Id`, constructor không tham số (public/protected), không `final` (để Hibernate tạo proxy).',
    { lang: 'java', code: `
@Entity
@Table(name = "orders")
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
    @SequenceGenerator(name = "order_seq", sequenceName = "order_seq", allocationSize = 50)
    private Long id;

    @Enumerated(EnumType.STRING)          // không dùng ORDINAL mặc định
    private OrderStatus status;

    @Version
    private Long version;

    protected Order() { }                 // cho JPA
}` },
    '- Chiến lược id: IDENTITY (đơn giản nhưng tắt JDBC batch insert), SEQUENCE (khuyến nghị, batch được), UUID.',
    '- equals/hashCode: business key bất biến hoặc id (khi khác null) + hashCode hằng; tránh Lombok `@Data`.',
    '- Javax → Jakarta: Spring Boot 3 dùng `jakarta.persistence.*`.',
  ]);

  L('Entity Lifecycle', [
    { table: [['Trạng thái', 'Mô tả', 'Chuyển sang'], ['Transient (new)', 'Object mới, chưa gắn persistence context', 'persist → Managed'], ['Managed', 'Được persistence context theo dõi, thay đổi tự đồng bộ', 'detach/clear/đóng context → Detached; remove → Removed'], ['Detached', 'Từng managed, context đã đóng', 'merge → (bản sao) Managed'], ['Removed', 'Đánh dấu xóa, DELETE khi flush', '']] },
    '- `merge(detached)` trả về **instance managed khác** — phải dùng giá trị trả về.',
    '- Spring Data `save()`: entity mới (id null hoặc `Persistable.isNew()`) → `persist`; ngược lại → `merge` (có thể thêm SELECT).',
    '- Callback: `@PrePersist`, `@PreUpdate`, `@PostLoad`... (hoặc Spring Data Auditing `@CreatedDate`).',
  ]);

  L('Persistence Context', [
    'Persistence context là "vùng làm việc" chứa các entity managed, đảm bảo **mỗi id ↔ một instance** trong phạm vi context.',
    '- Trong Spring, context gắn với **transaction** hiện tại (transaction-scoped); mọi repository trong cùng transaction dùng chung context.',
    '- `EntityManager` được inject là proxy thread-safe chuyển tới context của transaction đang chạy.',
    '- Context lưu snapshot để dirty checking; không giới hạn kích thước → xử lý batch lớn phải `flush()` + `clear()` định kỳ.',
    '- Open Session in View mở rộng context tới hết request web.',
  ]);

  L('First-level Cache và Second-level Cache', [
    '- **First-level cache** = persistence context: luôn bật, phạm vi một transaction/session. `findById` hai lần cùng id → một SELECT, cùng object.',
    '- Query JPQL vẫn chạy SQL nhưng kết quả được map về instance đã có trong context.',
    '- **Second-level cache**: dùng chung giữa các session (SessionFactory), phải bật và chọn provider (JCache: Ehcache, Caffeine, Infinispan), đánh dấu `@Cacheable` + `@Cache(usage = READ_WRITE)`.',
    '- Phù hợp dữ liệu đọc nhiều, ít đổi (danh mục, cấu hình). Rủi ro: dữ liệu cũ khi DB bị sửa ngoài Hibernate; nhiều node cần cache phân tán.',
    '- Query cache là cơ chế riêng, thường ít hiệu quả; Spring `@Cacheable` ở tầng service thường dễ kiểm soát hơn.',
  ]);

  L('EntityManager', [
    { table: [['Method', 'Ý nghĩa'], ['`persist(e)`', 'Biến entity mới thành managed (INSERT khi flush, IDENTITY thì ngay)'], ['`find(cls, id)`', 'Tải ngay (hoặc lấy từ context), null nếu không có'], ['`getReference(cls, id)`', 'Proxy chưa khởi tạo, không truy vấn tới khi truy cập field'], ['`merge(e)`', 'Copy trạng thái vào instance managed và trả về nó'], ['`remove(e)`', 'Đánh dấu xóa'], ['`flush()`', 'Đồng bộ thay đổi xuống DB (chưa commit)'], ['`clear()` / `detach(e)`', 'Gỡ mọi / một entity khỏi context'], ['`refresh(e)`', 'Tải lại từ DB, ghi đè thay đổi chưa flush']] },
    '- `getReference`/`getReferenceById` hữu ích để gán quan hệ chỉ cần id (tránh SELECT thừa).',
    '- `createQuery` (JPQL), `createNativeQuery` (SQL), `createNamedQuery`, Criteria API.',
  ]);

  L('JpaRepository', [
    '- `JpaRepository<T, ID>`: CRUD, phân trang (`Pageable`), sắp xếp, `saveAll`, `flush`, `saveAndFlush`, `getReferenceById`.',
    '- **Derived query**: `findByEmailAndStatus`, `findTop10ByStatusOrderByCreatedAtDesc`, `existsByEmail`, `countByStatus`.',
    '- `@Query` cho JPQL/native; `@Modifying` cho UPDATE/DELETE hàng loạt (bỏ qua persistence context → dùng `clearAutomatically = true`).',
    '- Projection: interface (`OrderView { Long getId(); }`), record/DTO, dynamic projection.',
    '- Truy vấn động: `Specification`, Querydsl, Query by Example.',
    '- `SimpleJpaRepository` có `@Transactional(readOnly = true)` mặc định, các method ghi có `@Transactional`.',
    '! `Page` luôn chạy thêm COUNT; dùng `Slice` khi không cần tổng.',
  ]);

  L('One-to-One', [
    '- Phía sở hữu có cột FK (`@JoinColumn`); phía kia dùng `mappedBy`.',
    '- Mặc định EAGER — nên khai báo `fetch = LAZY`.',
    '- Phía inverse (`mappedBy`) **không thể lazy** thực sự (Hibernate không biết null hay có) → mỗi lần tải cha phát sinh thêm SELECT.',
    '- Giải pháp: `@MapsId` (chia sẻ khóa chính: user_profile.id = user.id) và chỉ map một chiều từ phía con; hoặc bytecode enhancement.',
    '- Cân nhắc gộp vào một bảng hoặc dùng `@Embeddable` nếu dữ liệu luôn đi cùng nhau.',
  ]);

  L('One-to-Many', [
    'Khuyến nghị: quan hệ **hai chiều** với `@ManyToOne` ở phía con (sở hữu FK) và `@OneToMany(mappedBy)` ở phía cha.',
    { lang: 'java', code: `
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
private List<OrderItem> items = new ArrayList<>();

public void addItem(OrderItem item) {      // đồng bộ cả hai phía
    items.add(item);
    item.setOrder(this);
}
public void removeItem(OrderItem item) {
    items.remove(item);
    item.setOrder(null);
}` },
    '- Chỉ phía sở hữu quyết định giá trị FK: chỉ thêm vào `items` mà không set `item.order` → order_id NULL.',
    '- `@OneToMany` một chiều không `@JoinColumn` → tạo **join table** và nhiều câu lệnh thừa.',
    '- Mặc định LAZY; collection lớn không nên map (truy vấn riêng có phân trang).',
  ]);

  L('Many-to-One', [
    '- Quan hệ phổ biến nhất, là phía sở hữu FK. **Mặc định EAGER → luôn đặt `fetch = FetchType.LAZY`.**',
    '- `optional = false` giúp Hibernate dùng inner join khi fetch.',
    '- Gán quan hệ chỉ cần id: `order.setCustomer(customerRepository.getReferenceById(customerId))` — không SELECT customer.',
    '- Không dùng `cascade` từ con lên cha (`@ManyToOne(cascade = ALL)` có thể xóa luôn bản ghi cha dùng chung).',
  ]);

  L('Many-to-Many', [
    '- Dùng join table (`@JoinTable`); một phía sở hữu, phía kia `mappedBy`.',
    '- Dùng `Set` thay `List`: List (bag) khiến Hibernate xóa toàn bộ dòng nối rồi chèn lại khi gỡ một phần tử.',
    '- Không cascade REMOVE (xóa sinh viên không được xóa khóa học).',
    '- Khi quan hệ có thuộc tính riêng (ngày đăng ký, điểm) → tách thành **entity trung gian** với hai `@ManyToOne`.',
  ]);

  L('FetchType LAZY và EAGER', [
    { table: [['Quan hệ', 'Mặc định JPA'], ['@ManyToOne, @OneToOne', 'EAGER'], ['@OneToMany, @ManyToMany', 'LAZY'], ['@ElementCollection', 'LAZY']] },
    '- Chiến lược khuyến nghị: **mọi quan hệ LAZY**, quyết định tải kèm theo use case bằng JOIN FETCH, `@EntityGraph`, hoặc projection.',
    '- EAGER không giải quyết N+1 với JPQL (Hibernate vẫn tải bằng các SELECT riêng) và áp đặt chi phí cho mọi truy vấn.',
    '- Truy cập lazy proxy khi context đã đóng → `LazyInitializationException`.',
  ]);

  L('Cascade', [
    'Cascade lan truyền thao tác từ entity cha sang entity liên quan: `PERSIST`, `MERGE`, `REMOVE`, `REFRESH`, `DETACH`, `ALL`.',
    '- Dùng khi cha **sở hữu vòng đời** con (Order → OrderItem).',
    '- Không cascade từ con lên cha, không cascade REMOVE trong many-to-many.',
    '- Không có cascade PERSIST mà tham chiếu tới entity mới chưa lưu → lỗi "object references an unsaved transient instance".',
    '- Cascade REMOVE xóa từng con bằng câu lệnh riêng (tải hết con lên) — với số lượng lớn, dùng `ON DELETE CASCADE` ở DB hoặc bulk delete.',
  ]);

  L('Orphan Removal', [
    '`orphanRemoval = true`: entity con bị gỡ khỏi collection của cha (hoặc tham chiếu bị set null với one-to-one) sẽ bị **DELETE**.',
    '- Khác `CascadeType.REMOVE`: REMOVE chỉ xóa con khi **cha** bị xóa.',
    '- Phù hợp con không có ý nghĩa khi tách khỏi cha (dòng đơn hàng, địa chỉ riêng).',
    '! Không thay collection bằng instance mới (`setItems(new ArrayList<>())`) — sửa trực tiếp collection hiện có (`clear()`, `addAll`).',
  ]);

  L('Dirty Checking', [
    'Khi flush, Hibernate so sánh trạng thái entity managed với **snapshot** lúc tải; field thay đổi → sinh UPDATE. Không cần gọi `save()`.',
    '- Mặc định UPDATE mọi cột; `@DynamicUpdate` chỉ cập nhật cột thay đổi.',
    '- Chỉ hoạt động khi entity còn managed trong transaction đang mở.',
    '- `readOnly = true` bỏ qua dirty checking/flush → tiết kiệm CPU và bộ nhớ khi chỉ đọc.',
    '! Sửa entity managed chỉ để hiển thị (format, che dữ liệu) cũng bị lưu xuống DB — map sang DTO trước.',
  ]);

  L('Flush và Commit', [
    '- **Flush**: gửi SQL tương ứng với thay đổi xuống DB, vẫn trong transaction (có thể rollback).',
    '- **Commit**: kết thúc transaction, thay đổi trở thành vĩnh viễn và hiển thị cho transaction khác.',
    '- FlushMode AUTO: flush trước commit và trước query có thể bị ảnh hưởng.',
    '- Write-behind: với SEQUENCE, INSERT được hoãn tới flush → lỗi constraint xuất hiện lúc commit (ngoài try/catch quanh `save`). Dùng `saveAndFlush` khi cần bắt lỗi ngay.',
    '- Thứ tự SQL khi flush: INSERT → UPDATE → DELETE collection → DELETE (có thể gây lỗi unique khi xóa rồi thêm cùng giá trị trong một transaction).',
  ]);

  L('JPQL', [
    'JPQL truy vấn trên **entity và thuộc tính**, không phải bảng/cột.',
    { lang: 'java', code: `
@Query("""
    select o from Order o
    join fetch o.customer c
    where o.status = :status and c.tier = :tier
    """)
List<Order> findPaid(@Param("status") Status status, @Param("tier") Tier tier);

@Query("select new com.acme.report.OrderSummary(o.id, c.name, o.total) from Order o join o.customer c")
List<OrderSummary> summaries();` },
    '- Luôn dùng tham số (`:name`) — không nối chuỗi (SQL/JPQL injection).',
    '- `join fetch` tải association trong cùng truy vấn; `distinct` tránh trùng cha khi fetch collection (Hibernate 6 tự khử trùng).',
    '- Constructor expression cần `new` + tên class đầy đủ.',
  ]);

  L('Native Query', [
    '- Dùng khi cần tính năng riêng của DB: window function phức tạp, CTE đệ quy, hint, `FOR UPDATE SKIP LOCKED`, jsonb, upsert.',
    '- `@Query(value = "...", nativeQuery = true)`; kết quả map vào entity, interface projection hoặc `Tuple`.',
    '- Mất tính độc lập DB, thay đổi schema không được compiler/Hibernate kiểm tra → cần integration test với DB thật.',
    '! Không nối chuỗi input người dùng; tên cột sắp xếp động phải đi qua whitelist.',
  ]);

  L('N+1 Problem', [
    'Tải danh sách N entity (1 query) rồi truy cập association LAZY của từng entity → thêm N query.',
    { table: [['Giải pháp', 'Khi dùng'], ['`join fetch` trong JPQL', 'Use case cụ thể cần association'], ['`@EntityGraph(attributePaths = ...)`', 'Khai báo trên method repository'], ['`@BatchSize` / `hibernate.default_batch_fetch_size`', 'Giảm N query thành N/size, phù hợp nhiều collection'], ['DTO projection', 'Chỉ cần vài cột cho màn hình danh sách']] },
    '! Fetch join collection + phân trang → Hibernate phân trang **trong bộ nhớ** (cảnh báo HHH90003004). Lấy trang id trước rồi fetch theo id.',
    '! Fetch join nhiều List cùng lúc → `MultipleBagFetchException`; fetch riêng từng collection.',
    '- Phát hiện sớm: bật `hibernate.generate_statistics` ở dev, test đếm số câu SQL cho endpoint quan trọng.',
  ]);

  L('Optimistic Locking với @Version', [
    '- Field `@Version` (Long/Integer/Timestamp) tự tăng mỗi lần update; câu UPDATE kèm `WHERE version = ?`.',
    '- Xung đột → `OptimisticLockException` (Spring: `ObjectOptimisticLockingFailureException`).',
    '- API: client gửi kèm version (hoặc ETag/If-Match); server so sánh với version client gửi — nếu tải entity mới nhất rồi ghi đè thì kiểm tra vô tác dụng.',
    '- Xử lý: 409 Conflict cho người dùng; retry có giới hạn cho tác vụ tự động.',
    '- Bulk update (`@Modifying`) không tăng version tự động.',
  ]);

  L('Transaction Management', [
    '- Ranh giới transaction đặt ở **service**, bao trùm việc đọc và sửa entity để dirty checking hoạt động.',
    '- Không đặt lời gọi HTTP/hệ thống ngoài trong transaction (giữ connection và lock).',
    '- Batch lớn: chia lô, `flush()` + `clear()` mỗi N bản ghi, bật `hibernate.jdbc.batch_size`, `order_inserts/order_updates`; IDENTITY không batch được.',
    '- `@Transactional(readOnly = true)` cho truy vấn.',
    '- Xem lại quy tắc rollback và propagation trong module Spring Framework.',
  ]);

  L('Open Session in View', [
    'OSIV (`spring.jpa.open-in-view`, mặc định **true** kèm cảnh báo) giữ EntityManager mở tới khi response được render.',
    '- Ưu: không gặp LazyInitializationException ở controller/serialization.',
    '- Nhược: lazy loading xảy ra ngoài transaction (auto-commit), che giấu N+1, **giữ connection DB suốt request** → cạn pool khi có thao tác chậm (gọi API ngoài, render lớn).',
    '- Khuyến nghị cho REST API: tắt OSIV, service tải đủ dữ liệu và trả DTO.',
  ]);

  L('Các lỗi thường gặp khi làm việc với Hibernate', [
    { table: [['Lỗi', 'Nguyên nhân / cách xử lý'], ['LazyInitializationException', 'Truy cập lazy ngoài transaction → fetch trong service, trả DTO'], ['N+1', 'Lazy trong vòng lặp → fetch join, EntityGraph, batch fetch'], ['MultipleBagFetchException', 'Fetch join nhiều List → fetch riêng / Set'], ['Phân trang trong bộ nhớ', 'Fetch join collection + Pageable → hai bước'], ['TransientPropertyValueException', 'Tham chiếu entity chưa lưu → lưu trước / cascade'], ['StackOverflowError', 'toString/equals/Jackson trên quan hệ hai chiều'], ['Dữ liệu enum sai', '@Enumerated ORDINAL → STRING'], ['Batch insert không hoạt động', 'IDENTITY → SEQUENCE'], ['Lost update', 'Thiếu @Version / khóa']] },
    '- Bật log SQL ở dev: `spring.jpa.show-sql` (đơn giản) hoặc `logging.level.org.hibernate.SQL=DEBUG` + bind parameter.',
  ]);
})();
