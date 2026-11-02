/* Bài học — Module 2: Object-Oriented Programming */
(() => {
  const L = (topic, blocks) => LS.add('oop', topic, blocks);

  L('Encapsulation', [
    'Encapsulation gói dữ liệu và hành vi vào cùng một đơn vị, **che giấu trạng thái nội bộ** và chỉ cho phép thay đổi qua method kiểm soát được, để bảo vệ **invariant** (ràng buộc luôn đúng) của object.',
    '- Field để `private`; chỉ mở những gì client thật sự cần.',
    '- Method thể hiện hành vi nghiệp vụ (`order.addItem()`, `account.withdraw()`) thay vì setter cho mọi field.',
    '- Không trả về collection/object mutable nội bộ: dùng `List.copyOf`, `Collections.unmodifiableList`.',
    { lang: 'java', code: `
public class Order {
    private final List<OrderItem> items = new ArrayList<>();
    private BigDecimal total = BigDecimal.ZERO;

    public void addItem(OrderItem item) {
        if (status != Status.DRAFT) throw new IllegalStateException("Order locked");
        items.add(item);
        total = total.add(item.price());
    }
    public List<OrderItem> items() { return List.copyOf(items); }
}` },
    '! Sinh getter/setter cho mọi field (anemic model) thực chất là bỏ encapsulation — logic bị rải khắp service.',
  ]);

  L('Inheritance', [
    'Kế thừa (`extends`) cho phép lớp con dùng lại và mở rộng lớp cha theo quan hệ **is-a**. Java chỉ đơn kế thừa class, đa kế thừa qua interface.',
    '- Constructor lớp con luôn gọi constructor lớp cha trước (`super(...)` ngầm định hoặc tường minh).',
    '- Method `private`, `static`, `final` không được override. Static method chỉ bị **hide**.',
    '- Override: cùng chữ ký; kiểu trả về có thể là subtype (covariant); access không được hẹp hơn; không ném checked exception rộng hơn.',
    '- Luôn dùng `@Override` để compiler bắt lỗi chữ ký.',
    '! Không gọi method có thể override trong constructor — lớp con chưa khởi tạo field nên có thể thấy null.',
    '? Khi nào dùng kế thừa? Khi lớp con thực sự là một dạng của lớp cha và tuân thủ Liskov; còn lại ưu tiên composition.',
  ]);

  L('Polymorphism', [
    '- **Runtime polymorphism (override)**: method instance được chọn theo kiểu thực của object lúc chạy (dynamic dispatch).',
    '- **Compile-time polymorphism (overload)**: chọn method theo kiểu khai báo của đối số lúc compile.',
    '- Field và static method **không** đa hình — được quyết định theo kiểu khai báo của biến.',
    { lang: 'java', code: `
class A { String name = "A"; String get() { return name; } }
class B extends A { String name = "B"; @Override String get() { return name; } }
A x = new B();
x.name;   // "A"  (field theo kiểu khai báo)
x.get();  // "B"  (method theo kiểu runtime)` },
    '## Thứ tự chọn overload',
    '- Pha 1: khớp chính xác hoặc widening primitive (int → long). Pha 2: boxing/unboxing. Pha 3: varargs.',
    '- Với `null`, chọn overload cụ thể nhất (`m(String)` thắng `m(Object)`); nếu hai ứng viên ngang hàng → ambiguous.',
  ]);

  L('Abstraction', [
    'Abstraction là tập trung vào **cái gì** một thành phần làm, ẩn **cách** nó làm. Thể hiện qua interface, abstract class, và cả qua việc thiết kế API rõ ràng.',
    '- Abstract class: không khởi tạo trực tiếp, có thể có constructor, field, method đã cài đặt; không bắt buộc có abstract method.',
    '- Abstract method không thể `private`, `static`, `final`.',
    '- Client phụ thuộc vào abstraction (`PaymentGateway`) thay vì chi tiết (`VnPayClient`) → dễ thay thế, dễ test.',
    '! Abstraction sai (rò rỉ chi tiết, ví dụ interface repository trả về `ResultSet`) khiến việc thay đổi cài đặt ảnh hưởng mọi client.',
  ]);

  L('Interface và Abstract Class', [
    { table: [['', 'Interface', 'Abstract class'], ['Kế thừa', 'Một class implements nhiều interface', 'Chỉ extends một class'], ['Trạng thái', 'Chỉ hằng `public static final`', 'Field instance bất kỳ'], ['Method', 'abstract, default (8), static (8), private (9)', 'Mọi loại, mọi access modifier'], ['Constructor', 'Không', 'Có'], ['Dùng khi', 'Định nghĩa contract/capability', 'Chia sẻ code + trạng thái cho họ class gần nhau']] },
    '- Hai interface có cùng default method → class phải override và có thể chọn `InterfaceA.super.method()`.',
    '- Quy tắc ưu tiên: method của class > interface cụ thể hơn > bắt buộc override.',
    '? Default method được thêm vào Java 8 để mở rộng interface (như `Collection.stream()`) mà không phá vỡ các implementation cũ.',
  ]);

  L('Composition và Inheritance', [
    '"Favor composition over inheritance": thay vì kế thừa để dùng lại code, hãy **chứa** một object và chuyển tiếp (forward) lời gọi.',
    '- Kế thừa gắn chặt lớp con với chi tiết cài đặt lớp cha (**fragile base class**): lớp cha thay đổi nội bộ có thể làm hỏng lớp con.',
    '- Ví dụ kinh điển: `CountingSet extends HashSet` override cả `add` và `addAll` → đếm gấp đôi vì `addAll` nội bộ gọi `add`.',
    { lang: 'java', code: `
class CountingSet<E> {              // composition
    private final Set<E> delegate = new HashSet<>();
    private int added;
    public boolean add(E e) { added++; return delegate.add(e); }
    public boolean addAll(Collection<? extends E> c) { added += c.size(); return delegate.addAll(c); }
}` },
    '- Composition cho phép thay đổi hành vi lúc runtime (Strategy, Decorator) và test dễ hơn.',
  ]);

  L('SOLID Principles', [
    '- **S — Single Responsibility**: một module chỉ có một lý do để thay đổi (một actor). Tách validation, persistence, notification.',
    '- **O — Open/Closed**: mở để mở rộng, đóng với sửa đổi. Thêm loại mới bằng class mới (Strategy + đăng ký bean) thay vì sửa chuỗi if-else.',
    '- **L — Liskov Substitution**: lớp con thay thế được lớp cha mà không phá vỡ kỳ vọng của client (Square/Rectangle là phản ví dụ).',
    '- **I — Interface Segregation**: client không bị buộc phụ thuộc method không dùng; tách interface "béo".',
    '- **D — Dependency Inversion**: module cấp cao và cấp thấp đều phụ thuộc abstraction; nhận dependency qua constructor.',
    '! SOLID là định hướng, không phải luật máy móc. Áp dụng quá mức (interface cho mọi class, chia nhỏ quá đà) làm code khó đọc.',
    '? Khi trả lời, hãy kèm ví dụ thực tế từ dự án: "service tính phí có switch theo loại → refactor thành Strategy".',
  ]);

  L('Design Patterns', [
    { table: [['Nhóm', 'Pattern', 'Ví dụ trong Java/Spring'], ['Creational', 'Singleton, Factory Method, Builder', 'Bean singleton, `BeanFactory`, Lombok `@Builder`'], ['Structural', 'Adapter, Decorator, Proxy, Facade', '`InputStreamReader`, `BufferedReader`, Spring AOP proxy'], ['Behavioral', 'Strategy, Template Method, Observer, Chain of Responsibility', 'Bean strategy, `JdbcTemplate`, `@EventListener`, Security Filter Chain']] },
    '## Singleton an toàn',
    '- Enum singleton hoặc Holder idiom (lazy, thread-safe nhờ class initialization). Double-checked locking cần `volatile`.',
    '- Trong Spring, hầu như không tự viết Singleton — dùng bean scope singleton.',
    '## Builder',
    '- Cho object nhiều tham số tùy chọn, tạo object immutable, validate trong `build()`.',
    '## Strategy vs Template Method',
    '- Strategy: thay thuật toán qua composition, chọn lúc runtime. Template Method: khung cố định trong lớp cha, lớp con cài bước khác nhau.',
  ]);

  L('Immutable Objects', [
    'Object immutable không thay đổi trạng thái sau khi tạo: thread-safe tự nhiên, dùng làm key HashMap an toàn, dễ suy luận.',
    '## Checklist',
    '- Class `final` (hoặc constructor private + factory) để không bị lớp con phá vỡ.',
    '- Mọi field `private final`; không có setter.',
    '- **Defensive copy** field mutable khi nhận vào và khi trả ra (`List.copyOf`, `new Date(d.getTime())`).',
    '- Thay đổi = tạo object mới (`withX(...)`).',
    { lang: 'java', code: `
public final class Team {
    private final String name;
    private final List<String> members;
    public Team(String name, List<String> members) {
        this.name = name;
        this.members = List.copyOf(members);  // copy khi nhận vào
    }
    public List<String> members() { return members; }  // List.copyOf đã unmodifiable
}` },
    '- `record` là cách viết ngắn cho immutable (nhưng chỉ shallow — component là List mutable vẫn cần copy).',
  ]);

  L('Coupling và Cohesion', [
    '- **Coupling**: mức độ phụ thuộc giữa các module. Coupling thấp → thay đổi một module ít ảnh hưởng module khác.',
    '- **Cohesion**: mức độ các phần trong một module cùng phục vụ một mục đích. Cohesion cao → module dễ hiểu, dễ tái sử dụng.',
    '- Mục tiêu: **low coupling, high cohesion**.',
    '## Dấu hiệu xấu',
    '- Class `CommonUtils`/`Helper` chứa hàng chục method không liên quan (cohesion thấp).',
    '- Service gọi thẳng repository của module khác, đọc chung bảng DB (coupling cao).',
    '- Thay đổi một tính năng phải sửa nhiều package (shotgun surgery).',
    '## Cách giảm coupling',
    '- Phụ thuộc vào interface, dùng event để đảo chiều phụ thuộc, tổ chức package theo tính năng (package-by-feature) thay vì theo tầng.',
  ]);
})();
