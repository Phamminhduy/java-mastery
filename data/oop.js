/* Module 2: Object-Oriented Programming */
QB.module({
  id: 'oop', order: 2, title: 'Object-Oriented Programming',
  description: 'Encapsulation, Inheritance, Polymorphism, Abstraction, SOLID, Design Patterns và Immutable Objects.',
  topics: ['Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction', 'Interface và Abstract Class', 'Composition và Inheritance',
    'SOLID Principles', 'Design Patterns', 'Immutable Objects', 'Coupling và Cohesion'],
}, [
  {
    id: 'OOP-001', topic: 'Polymorphism', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
class A {
    String name = "A";
    String get() { return name; }
}
class B extends A {
    String name = "B";
    @Override String get() { return name; }
}

A x = new B();
System.out.println(x.name + " " + x.get());`,
    opts: ['A A', 'A B', 'B B', 'B A'], ans: 'B',
    exp: 'Method instance được **dynamic dispatch** theo kiểu runtime của object (B) nên `x.get()` trả về "B". Field **không đa hình**: truy cập field được quyết định theo kiểu khai báo của biến (A) lúc compile, nên `x.name` là "A". Field cùng tên ở lớp con chỉ che (hide) field lớp cha — nên tránh.',
    tags: ['polymorphism', 'field-hiding', 'dynamic-dispatch'], sec: 50,
  },
  {
    id: 'OOP-002', topic: 'Polymorphism', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
class Parent { static String who() { return "Parent"; } }
class Child extends Parent { static String who() { return "Child"; } }

Parent p = new Child();
System.out.println(p.who());`,
    opts: ['Parent', 'Child', 'Compilation error', 'Ném NullPointerException'], ans: 'A',
    exp: 'Static method không được override mà chỉ bị **hide**. Lời gọi static được liên kết lúc compile theo kiểu khai báo của biến (`Parent`), không theo object runtime. Gọi static method qua biến instance là bad practice (IDE cảnh báo); nên viết `Parent.who()`.',
    tags: ['static', 'method-hiding'], sec: 40,
  },
  {
    id: 'OOP-003', topic: 'Polymorphism', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
static void m(Object o) { System.out.println("Object"); }
static void m(String s) { System.out.println("String"); }

m(null);`,
    opts: ['Object', 'String', 'Compilation error: ambiguous', 'Ném NullPointerException'], ans: 'B',
    exp: 'Overload được chọn lúc compile theo **method cụ thể nhất** (most specific). `null` khớp cả Object và String; vì String là subtype của Object nên `m(String)` cụ thể hơn và được chọn. Nếu thêm overload `m(Integer)` thì `m(null)` sẽ ambiguous và lỗi compile.',
    tags: ['overloading', 'null'], sec: 40,
  },
  {
    id: 'OOP-004', topic: 'Polymorphism', d: 'a', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
static void m(long x)    { System.out.println("long"); }
static void m(Integer x) { System.out.println("Integer"); }
static void m(int... x)  { System.out.println("varargs"); }

m(5);`,
    opts: ['long', 'Integer', 'varargs', 'Compilation error: ambiguous'], ans: 'A',
    exp: 'Quy tắc chọn overload có 3 pha: (1) chỉ xét primitive widening, không boxing/varargs; (2) cho phép boxing/unboxing; (3) cho phép varargs. Ở pha 1, `int → long` là widening hợp lệ nên `m(long)` được chọn ngay, không xét đến Integer hay varargs.',
    tags: ['overloading', 'widening', 'boxing'], sec: 50,
  },
  {
    id: 'OOP-005', topic: 'Inheritance', d: 'a', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
class Base {
    Base() { init(); }
    void init() { System.out.println("Base"); }
}
class Child extends Base {
    private String value = "ready";
    @Override void init() { System.out.println("Child " + value); }
}

new Child();`,
    opts: ['Base', 'Child ready', 'Child null', 'Ném NullPointerException'], ans: 'C',
    exp: 'Constructor của `Base` chạy **trước** khi các field của `Child` được khởi tạo. `init()` được dispatch động tới `Child.init()`, lúc đó `value` vẫn là giá trị mặc định null → in "Child null" (nối chuỗi với null không ném NPE). Bài học: không gọi method có thể override trong constructor.',
    tags: ['constructor', 'initialization-order', 'override'], sec: 60,
  },
  {
    id: 'OOP-006', topic: 'Encapsulation', d: 'i', cat: 'bug',
    q: 'Class `Order` dưới đây vi phạm Encapsulation ở điểm nào?',
    code: `
public class Order {
    private final List<OrderItem> items = new ArrayList<>();
    private BigDecimal total = BigDecimal.ZERO;

    public void addItem(OrderItem item) {
        items.add(item);
        total = total.add(item.price());
    }
    public List<OrderItem> getItems() { return items; }
    public BigDecimal getTotal() { return total; }
}`,
    opts: [
      'Field items nên là public để dễ truy cập',
      '`getItems()` trả về chính list nội bộ; bên ngoài có thể `getItems().add(...)` làm `total` không còn khớp với items (phá vỡ invariant)',
      'BigDecimal không nên dùng cho tiền',
      'Không nên dùng final cho collection',
    ], ans: 'B',
    exp: '`final` chỉ khóa tham chiếu, không khóa nội dung list. Trả về list nội bộ cho phép caller sửa trạng thái mà không qua `addItem`, làm hỏng invariant total = tổng giá. Sửa: trả về `Collections.unmodifiableList(items)` hoặc `List.copyOf(items)`, và mọi thay đổi phải đi qua method của aggregate.',
    tags: ['encapsulation', 'invariant', 'defensive-copy'], sec: 50,
  },
  {
    id: 'OOP-007', topic: 'Interface và Abstract Class', d: 'i', cat: 'theory',
    q: 'Từ Java 9 trở đi, phát biểu nào đúng khi so sánh interface và abstract class?',
    opts: [
      'Interface có thể có instance field không static để lưu trạng thái',
      'Interface có thể có default, static và private method; nhưng chỉ abstract class mới có constructor và trạng thái instance (field không static)',
      'Một class có thể extends nhiều abstract class',
      'Abstract class không thể có method đã cài đặt',
    ], ans: 'B',
    exp: 'Interface: method abstract, default (Java 8), static (Java 8), private (Java 9); field luôn là `public static final`. Abstract class: có constructor, field trạng thái, mọi access modifier. Một class chỉ extends một class nhưng implements nhiều interface. Chọn abstract class khi cần chia sẻ trạng thái/code giữa các lớp có quan hệ "is-a" chặt; interface khi định nghĩa capability/contract.',
    tags: ['interface', 'abstract-class'], sec: 45, ver: 'Java 9+',
  },
  {
    id: 'OOP-008', topic: 'Interface và Abstract Class', d: 'a', cat: 'compile',
    q: 'Đoạn code sau có biên dịch được không? Nếu không, sửa thế nào?',
    code: `
interface Logger  { default String name() { return "Logger"; } }
interface Auditor { default String name() { return "Auditor"; } }

class AuditLogger implements Logger, Auditor { }`,
    opts: [
      'Biên dịch được, name() trả về "Logger" vì Logger khai báo trước',
      'Lỗi compile do xung đột default method; AuditLogger phải override name(), có thể gọi `Logger.super.name()`',
      'Lỗi compile vì interface không được có default method trùng tên',
      'Biên dịch được nhưng ném exception khi gọi name()',
    ], ans: 'B',
    exp: 'Khi một class kế thừa hai default method cùng chữ ký từ hai interface không liên quan, compiler báo lỗi "inherits unrelated defaults". Class phải override và có thể chọn rõ ràng cài đặt bằng cú pháp `InterfaceName.super.method()`. Quy tắc ưu tiên: method của class > interface cụ thể hơn > bắt buộc override.',
    tags: ['default-method', 'diamond'], sec: 50, ver: 'Java 8+',
  },
  {
    id: 'OOP-009', topic: 'SOLID Principles', d: 'i', cat: 'design',
    q: '`Square extends Rectangle` và override `setWidth()` để set luôn height (giữ hình vuông). Một method nhận `Rectangle r`, gọi `r.setWidth(5); r.setHeight(4);` rồi kỳ vọng diện tích 20 nhưng nhận 16 khi truyền Square. Nguyên tắc nào bị vi phạm?',
    opts: ['Single Responsibility', 'Open/Closed', 'Liskov Substitution', 'Interface Segregation'], ans: 'C',
    exp: 'Liskov Substitution: object lớp con phải thay thế được lớp cha mà không làm sai hành vi mà client dựa vào. Square làm yếu postcondition của setWidth (width và height độc lập) nên không phải là subtype hợp lệ về mặt hành vi, dù "hình vuông là hình chữ nhật" về mặt toán học. Giải pháp: không dùng kế thừa; dùng immutable value object hoặc interface Shape chung.',
    tags: ['solid', 'lsp'], sec: 50,
  },
  {
    id: 'OOP-010', topic: 'SOLID Principles', d: 'i', cat: 'design',
    q: 'Service tính phí vận chuyển có chuỗi `if (type == STANDARD) ... else if (type == EXPRESS) ... else if (type == SAME_DAY) ...` và mỗi quý lại thêm loại mới, phải sửa và test lại class này. Thiết kế nào tuân thủ Open/Closed Principle tốt nhất?',
    opts: [
      'Thay if-else bằng switch cho dễ đọc',
      'Tạo interface `ShippingFeePolicy` với các implementation riêng (Strategy), đăng ký thành bean và chọn theo type qua Map; thêm loại mới = thêm class mới',
      'Đưa toàn bộ logic vào stored procedure',
      'Tạo một method static dùng chung cho mọi loại',
    ], ans: 'B',
    exp: 'OCP: mở để mở rộng, đóng với sửa đổi. Với Strategy + đăng ký (ví dụ Spring inject `Map<String, ShippingFeePolicy>` hoặc `List` rồi index theo `supports(type)`), thêm loại phí mới chỉ cần thêm class, không sửa code đã ổn định và test riêng từng policy. Switch chỉ thay đổi cú pháp, vẫn phải sửa class cũ.',
    tags: ['solid', 'ocp', 'strategy'], sec: 50,
  },
  {
    id: 'OOP-011', topic: 'SOLID Principles', d: 'i', cat: 'design',
    q: '`OrderService` khởi tạo trực tiếp `new MySqlOrderRepository()` và `new SmtpEmailSender()` bên trong. Việc viết unit test rất khó. Nguyên tắc nào bị vi phạm và cách sửa?',
    opts: [
      'Vi phạm SRP; gộp repository vào service',
      'Vi phạm Dependency Inversion: module cấp cao phụ thuộc vào cài đặt cụ thể. Nên phụ thuộc vào abstraction (OrderRepository, EmailSender) và nhận qua constructor injection',
      'Vi phạm ISP; tách OrderService thành nhiều interface',
      'Không vi phạm; chỉ cần dùng PowerMock để mock constructor',
    ], ans: 'B',
    exp: 'DIP: cả module cấp cao lẫn cấp thấp phụ thuộc vào abstraction. Khi nhận dependency qua constructor (`OrderService(OrderRepository repo, EmailSender sender)`), có thể thay bằng mock/fake trong test và đổi implementation (MySQL → PostgreSQL) mà không sửa service. Dùng PowerMock để mock `new` là dấu hiệu thiết kế khó test.',
    tags: ['solid', 'dip', 'testability'], sec: 45,
  },
  {
    id: 'OOP-012', topic: 'SOLID Principles', d: 'b', cat: 'design',
    q: 'Interface `ReportService` có 12 method: export PDF, export Excel, gửi email, lên lịch cron, quản lý template... Nhiều class implement phải ném `UnsupportedOperationException` cho các method không dùng. Nguyên tắc nào bị vi phạm?',
    opts: ['Interface Segregation', 'Liskov Substitution', 'Open/Closed', 'DRY'], ans: 'A',
    exp: 'Interface Segregation: client không nên bị buộc phụ thuộc vào method mà nó không dùng. Nên tách thành các interface nhỏ theo vai trò (ReportExporter, ReportScheduler, ReportMailer). Việc ném UnsupportedOperationException cũng thường đi kèm vi phạm LSP, nhưng nguyên nhân gốc là interface quá "béo".',
    tags: ['solid', 'isp'], sec: 35,
  },
  {
    id: 'OOP-013', topic: 'SOLID Principles', d: 'b', cat: 'design',
    q: 'Class `CustomerManager` vừa validate dữ liệu, vừa gọi JDBC lưu DB, vừa tạo nội dung và gửi email chào mừng, vừa ghi file audit. Mỗi thay đổi nhỏ về email template cũng phải sửa class này. Nhận định nào đúng?',
    opts: [
      'Class có tính cohesion cao vì mọi thứ liên quan đến customer',
      'Vi phạm Single Responsibility: class có nhiều lý do để thay đổi; nên tách validator, repository, notification và audit thành các thành phần riêng',
      'Đúng chuẩn Facade pattern nên không cần sửa',
      'Chỉ cần thêm comment phân vùng code là đủ',
    ], ans: 'B',
    exp: 'SRP được hiểu là "một module chỉ nên có một lý do để thay đổi" (một actor). Logic lưu trữ, thông báo và audit thay đổi vì những lý do và đội ngũ khác nhau. Tách ra giúp test độc lập, giảm xung đột khi nhiều người cùng sửa. Facade chỉ điều phối, không tự cài đặt mọi chi tiết.',
    tags: ['solid', 'srp'], sec: 40,
  },
  {
    id: 'OOP-014', topic: 'Design Patterns', d: 'a', cat: 'bug',
    q: 'Singleton dùng double-checked locking dưới đây có vấn đề gì?',
    code: `
public class ConfigHolder {
    private static ConfigHolder instance;
    private final Map<String, String> props;

    private ConfigHolder() { props = loadFromFile(); }

    public static ConfigHolder getInstance() {
        if (instance == null) {
            synchronized (ConfigHolder.class) {
                if (instance == null) {
                    instance = new ConfigHolder();
                }
            }
        }
        return instance;
    }
}`,
    opts: [
      'Không có vấn đề, synchronized đã đảm bảo an toàn',
      'Thiếu `volatile` cho instance: do reordering, thread khác có thể đọc instance khác null ở lần check đầu (ngoài synchronized) khi object chưa publish an toàn',
      'Deadlock khi hai thread gọi cùng lúc',
      'Tạo ra hai instance mỗi lần gọi',
    ], ans: 'B',
    exp: 'Lần kiểm tra đầu tiên đọc `instance` **ngoài** synchronized nên không có quan hệ happens-before với lần ghi. Thiếu `volatile`, Java Memory Model không đảm bảo thread đọc thấy object đã được khởi tạo hoàn chỉnh (đặc biệt với field không final). Sửa: khai báo `private static volatile ConfigHolder instance;`, hoặc đơn giản hơn dùng Holder idiom (lazy, thread-safe nhờ class initialization) hoặc enum singleton.',
    tags: ['singleton', 'double-checked-locking', 'volatile'], sec: 70,
  },
  {
    id: 'OOP-015', topic: 'Design Patterns', d: 'b', cat: 'design',
    q: 'Class `NotificationRequest` có 3 field bắt buộc và 9 field tùy chọn, cần là immutable. Pattern nào phù hợp nhất để tạo object?',
    opts: ['Singleton', 'Builder', 'Adapter', 'Observer'], ans: 'B',
    exp: 'Builder giải quyết vấn đề "telescoping constructor" (nhiều constructor overload khó đọc), cho phép đặt tên tham số rõ ràng, validate trong `build()` và tạo object immutable. Lombok `@Builder` hoặc record + builder thủ công là cách phổ biến.',
    tags: ['builder', 'immutable'], sec: 30,
  },
  {
    id: 'OOP-016', topic: 'Design Patterns', d: 'i', cat: 'design',
    q: 'Hệ thống thanh toán hỗ trợ VNPay, Momo, thẻ quốc tế. Mỗi cổng có thuật toán ký request và gọi API khác nhau; cổng được chọn lúc runtime theo lựa chọn của khách. Pattern nào phù hợp nhất?',
    opts: ['Strategy', 'Singleton', 'Template Method với một class cha khổng lồ chứa if-else', 'Prototype'], ans: 'A',
    exp: 'Strategy đóng gói từng thuật toán sau một interface chung (`PaymentGateway.pay(...)`), cho phép chọn implementation lúc runtime và thêm cổng mới không sửa code cũ. Template Method phù hợp khi các bước khung giống nhau và chỉ một vài bước khác nhau; có thể kết hợp nhưng lựa chọn runtime là đặc trưng của Strategy.',
    tags: ['strategy', 'payment'], sec: 40,
  },
  {
    id: 'OOP-017', topic: 'Design Patterns', d: 'i', cat: 'theory',
    q: '`new BufferedReader(new InputStreamReader(new FileInputStream("a.txt"), UTF_8))` là ví dụ kinh điển của pattern nào?',
    opts: ['Adapter thuần túy', 'Decorator', 'Composite', 'Facade'], ans: 'B',
    exp: 'Mỗi lớp bao (wrap) một đối tượng cùng kiểu trừu tượng và **bổ sung hành vi** (buffer, đọc theo dòng) mà không sửa lớp gốc — đó là Decorator. (`InputStreamReader` đóng vai trò Adapter chuyển byte stream sang character stream, nhưng chuỗi bao bọc tổng thể là Decorator.)',
    tags: ['decorator', 'java-io'], sec: 35,
  },
  {
    id: 'OOP-018', topic: 'Design Patterns', d: 'i', cat: 'theory',
    q: 'Spring `ApplicationEventPublisher` cùng `@EventListener`: một thành phần phát sự kiện `OrderCreatedEvent`, nhiều listener độc lập (gửi email, cộng điểm thưởng) phản ứng mà publisher không cần biết đến chúng. Đây là pattern nào?',
    opts: ['Observer (Publish–Subscribe)', 'Chain of Responsibility', 'Mediator', 'Command'], ans: 'A',
    exp: 'Observer: subject thông báo sự kiện tới các observer đã đăng ký, giảm coupling giữa nơi phát và nơi xử lý. Lưu ý trong Spring, listener mặc định chạy **đồng bộ trên cùng thread** với publisher (và cùng transaction); dùng `@Async` hoặc `@TransactionalEventListener` khi cần tách.',
    tags: ['observer', 'spring-events'], sec: 40,
  },
  {
    id: 'OOP-019', topic: 'Immutable Objects', d: 'i', cat: 'bug',
    q: 'Class sau được thiết kế để immutable. Lỗ hổng nằm ở đâu?',
    code: `
public final class Team {
    private final String name;
    private final List<String> members;

    public Team(String name, List<String> members) {
        this.name = name;
        this.members = members;
    }
    public String getName() { return name; }
    public List<String> getMembers() { return Collections.unmodifiableList(members); }
}`,
    opts: [
      'Thiếu setter',
      'Constructor lưu trực tiếp list do caller truyền vào; caller vẫn giữ tham chiếu và có thể sửa list sau khi tạo Team',
      'Class không nên final',
      'unmodifiableList tạo bản sao tốn bộ nhớ',
    ], ans: 'B',
    exp: '`unmodifiableList` chỉ là một **view** chỉ-đọc trên list gốc. Vì constructor không copy, caller sửa list ban đầu thì Team cũng thay đổi theo. Cần defensive copy khi nhận vào: `this.members = List.copyOf(members);` (Java 10+, đồng thời từ chối phần tử null). Checklist immutable: class final, field private final, không setter, defensive copy với field mutable cả khi nhận vào và trả ra.',
    tags: ['immutable', 'defensive-copy'], sec: 50,
  },
  {
    id: 'OOP-020', topic: 'Composition và Inheritance', d: 'a', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
class CountingSet<E> extends HashSet<E> {
    int added = 0;
    @Override public boolean add(E e) { added++; return super.add(e); }
    @Override public boolean addAll(Collection<? extends E> c) {
        added += c.size();
        return super.addAll(c);
    }
}

CountingSet<String> s = new CountingSet<>();
s.addAll(List.of("a", "b", "c"));
System.out.println(s.added);`,
    opts: ['3', '6', '0', '9'], ans: 'B',
    exp: '`HashSet.addAll` kế thừa từ `AbstractCollection.addAll`, vốn gọi `add()` cho từng phần tử. Vì `add` đã bị override, mỗi phần tử được đếm thêm lần nữa: 3 (addAll) + 3 (add) = 6. Đây là ví dụ "fragile base class" (Effective Java): kế thừa phụ thuộc vào chi tiết cài đặt của lớp cha. Giải pháp: composition — bọc một `Set` bên trong và forward lời gọi.',
    tags: ['composition', 'inheritance', 'fragile-base-class'], sec: 70,
  },
  {
    id: 'OOP-021', topic: 'Coupling và Cohesion', d: 'b', cat: 'theory',
    q: 'Một thiết kế module tốt thường hướng tới đặc điểm nào?',
    opts: ['High coupling, low cohesion', 'Low coupling, high cohesion', 'High coupling, high cohesion', 'Low coupling, low cohesion'], ans: 'B',
    exp: 'Cohesion cao: các thành phần trong module cùng phục vụ một mục đích rõ ràng. Coupling thấp: module phụ thuộc ít và qua interface ổn định vào module khác. Kết quả là thay đổi được khoanh vùng, dễ test, dễ thay thế. Ví dụ phản mẫu: class `CommonUtils` chứa 80 method static không liên quan (cohesion thấp) được import khắp nơi (coupling cao).',
    tags: ['coupling', 'cohesion'], sec: 25,
  },
  {
    id: 'OOP-022', topic: 'Abstraction', d: 'b', cat: 'theory',
    q: 'Phát biểu nào về abstract class là đúng?',
    opts: [
      'Abstract class không thể có constructor',
      'Abstract class có thể có constructor (được gọi qua super() từ lớp con) nhưng không thể khởi tạo trực tiếp bằng new',
      'Abstract class bắt buộc phải có ít nhất một abstract method',
      'Method abstract có thể là private',
    ], ans: 'B',
    exp: 'Abstract class có constructor để khởi tạo phần trạng thái chung, được gọi từ constructor lớp con. Abstract class **không bắt buộc** có abstract method (chỉ để ngăn khởi tạo trực tiếp). Abstract method không thể private/static/final vì phải được lớp con override.',
    tags: ['abstract-class'], sec: 30,
  },
  {
    id: 'OOP-023', topic: 'Inheritance', d: 'i', cat: 'compile',
    q: 'Đoạn code sau có biên dịch được không?',
    code: `
class Repo {
    void save() throws IOException { }
}
class JdbcRepo extends Repo {
    @Override
    void save() throws Exception { }
}`,
    opts: [
      'Được, override có thể khai báo bất kỳ exception nào',
      'Lỗi compile: method override không được ném checked exception rộng hơn method gốc',
      'Lỗi compile: thiếu public',
      'Được, nhưng Exception bị bỏ qua lúc runtime',
    ], ans: 'B',
    exp: 'Quy tắc override: không được ném checked exception mới hoặc rộng hơn (Exception rộng hơn IOException); có thể ném hẹp hơn, ít hơn, hoặc unchecked bất kỳ. Lý do: code gọi qua kiểu `Repo` chỉ chuẩn bị xử lý IOException (Liskov). Access modifier có thể mở rộng nhưng không thu hẹp; kiểu trả về có thể là subtype (covariant return).',
    tags: ['override', 'checked-exception'], sec: 40,
  },
  {
    id: 'OOP-024', topic: 'Design Patterns', d: 'a', cat: 'tradeoff',
    q: 'Bạn cần thêm logging, đo thời gian và retry cho các method của nhiều service mà không sửa code nghiệp vụ. Trong Spring, cách tiếp cận nào hợp lý và hạn chế quan trọng nhất của nó là gì?',
    opts: [
      'Kế thừa từng service và override method; hạn chế: không có',
      'Dùng Proxy/AOP (aspect với @Around); hạn chế: lời gọi nội bộ `this.method()` trong cùng bean không đi qua proxy nên advice không được áp dụng',
      'Dùng Singleton; hạn chế: không thread-safe',
      'Sửa bytecode thủ công; hạn chế: chậm',
    ], ans: 'B',
    exp: 'Proxy pattern (JDK dynamic proxy hoặc CGLIB) là nền tảng của Spring AOP: proxy bọc bean và chạy advice trước/sau khi chuyển lời gọi. Vì advice chỉ áp dụng cho lời gọi **đi qua proxy**, self-invocation bỏ qua aspect — cùng nguyên nhân khiến `@Transactional` gọi nội bộ không có hiệu lực. Ngoài ra Spring AOP chỉ intercept method public (mặc định) của Spring bean.',
    tags: ['proxy', 'aop', 'self-invocation'], sec: 60,
  },
  {
    id: 'OOP-025', topic: 'Encapsulation', d: 'b', cat: 'theory',
    q: 'Mục đích chính của Encapsulation là gì?',
    opts: [
      'Giúp chương trình chạy nhanh hơn',
      'Che giấu trạng thái nội bộ và chỉ cho phép thay đổi qua các method kiểm soát được, để bảo vệ invariant của object',
      'Cho phép kế thừa nhiều lớp',
      'Bắt buộc mọi field có getter và setter',
    ], ans: 'B',
    exp: 'Encapsulation gói dữ liệu và hành vi, ẩn chi tiết cài đặt. Sinh getter/setter cho mọi field (anemic model) thực chất làm lộ trạng thái; method nên thể hiện hành vi nghiệp vụ (`order.cancel()`, `account.withdraw(amount)`) và tự kiểm tra ràng buộc.',
    tags: ['encapsulation'], sec: 25,
  },
]);
