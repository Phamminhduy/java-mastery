/* Bài học — Module 1: Java Core */
(() => {
  const L = (topic, blocks) => LS.add('java-core', topic, blocks);

  L('Java Syntax', [
    'Một chương trình Java gồm các **class** đặt trong **package**. Mã nguồn `.java` được `javac` biên dịch thành **bytecode** `.class`, sau đó JVM thực thi (thông dịch + JIT).',
    '## Thứ tự khởi tạo của class',
    '- Static field và static block chạy **một lần** khi class được khởi tạo lần đầu, theo thứ tự xuất hiện trong code.',
    '- Mỗi lần `new`: gọi constructor lớp cha (`super()`), rồi instance field/instance block theo thứ tự xuất hiện, cuối cùng là thân constructor.',
    { lang: 'java', code: `
class A {
    static { System.out.print("S "); }   // 1 lần
    { System.out.print("I "); }          // mỗi object, trước thân constructor
    A() { System.out.print("C "); }
}
new A(); new A();   // S I C I C` },
    '## Quy ước cần nhớ',
    '- Một file chỉ có tối đa một `public` class trùng tên file.',
    '- Access modifier: `private` < package-private (mặc định) < `protected` < `public`.',
    '- `final` với biến: gán một lần; với method: không override được; với class: không kế thừa được.',
    '- `static` thuộc về class, không thuộc object; static method không truy cập trực tiếp instance field.',
    '? Câu hỏi hay gặp: thứ tự khởi tạo khi có kế thừa (static cha → static con → instance cha + constructor cha → instance con + constructor con).',
  ]);

  L('Primitive Types và Reference Types', [
    'Java có 8 kiểu **primitive**: `byte`(8 bit), `short`(16), `int`(32), `long`(64), `float`(32), `double`(64), `char`(16, UTF-16), `boolean`. Mọi kiểu còn lại là **reference type** — biến chỉ chứa tham chiếu tới object trên heap.',
    { table: [['', 'Primitive', 'Reference'], ['Giá trị', 'Lưu trực tiếp', 'Lưu tham chiếu (địa chỉ) tới object'], ['Mặc định (field)', '0 / false', 'null'], ['So sánh ==', 'So sánh giá trị', 'So sánh tham chiếu'], ['Dùng trong generic', 'Không', 'Có (dùng wrapper)']] },
    '## Autoboxing và wrapper',
    '- Mỗi primitive có wrapper: `Integer`, `Long`, `Double`, `Boolean`... Compiler tự chuyển đổi (autoboxing/unboxing).',
    '- `Integer.valueOf()` cache giá trị -128..127, nên `Integer a = 127, b = 127; a == b` là true nhưng với 128 là false. **Luôn dùng `equals()` cho wrapper.**',
    '- Unboxing `null` ném `NullPointerException`: `int x = map.get("k");` khi key không tồn tại.',
    '## Tràn số và độ chính xác',
    '- Phép toán int tràn số không báo lỗi: `Integer.MAX_VALUE + 1 == Integer.MIN_VALUE`. Dùng `Math.addExact` khi cần phát hiện.',
    '- `float/double` là số dấu phẩy động nhị phân: `0.1 + 0.2 != 0.3`. Tiền tệ dùng `BigDecimal` (tạo từ String).',
    '! Tránh `==` khi so sánh `Integer`, `Long` lấy từ DB/JSON — bug chỉ xuất hiện khi giá trị vượt 127.',
  ]);

  L('Variables và Data Types', [
    'Biến có ba loại: **local** (trong method, nằm trên stack frame), **instance field** (thuộc object), **static field** (thuộc class).',
    '- Biến local **không** có giá trị mặc định — compiler bắt buộc gán trước khi dùng (definite assignment).',
    '- Field có giá trị mặc định: 0, false, null.',
    '- `var` (Java 10+) suy luận kiểu cho biến local có initializer; không dùng cho field, tham số, kiểu trả về.',
    '## BigDecimal cho tiền tệ',
    { lang: 'java', code: `
new BigDecimal("1.0").equals(new BigDecimal("1.00"));     // false (khác scale)
new BigDecimal("1.0").compareTo(new BigDecimal("1.00"));  // 0
new BigDecimal(0.1);               // 0.1000000000000000055511... (sai số nhị phân)
BigDecimal.valueOf(0.1);           // 0.1
amount.setScale(2, RoundingMode.HALF_UP);  // làm tròn tường minh` },
    '! `BigDecimal.equals` so sánh cả scale — cẩn thận khi dùng làm key HashMap hoặc so sánh tiền; dùng `compareTo`.',
    '- Ép kiểu thu hẹp (`(int) 3.9 == 3`, `(byte) 200 == -56`) có thể mất dữ liệu; ép kiểu mở rộng (int → long) an toàn.',
  ]);

  L('Operators', [
    '- `i++` trả về giá trị cũ rồi mới tăng; `++i` tăng rồi trả về giá trị mới. Biểu thức được đánh giá từ trái sang phải.',
    '- `&&`, `||` là **short-circuit**: vế phải chỉ được tính khi cần. `&`, `|` với boolean luôn tính cả hai vế.',
    '- `==` với object so sánh tham chiếu; `equals()` so sánh nội dung (nếu class override).',
    '- Phép chia số nguyên cắt phần thập phân: `7 / 2 == 3`; chia cho 0 với int ném `ArithmeticException`, với double cho `Infinity`/`NaN`.',
    '- Toán tử gán kết hợp có ép kiểu ngầm: `byte b = 10; b += 5;` hợp lệ, nhưng `b = b + 5;` lỗi compile.',
    { lang: 'java', code: `
int i = 5;
int r = i++ + ++i;   // 5 + 7 = 12, i = 7
if (s != null && s.length() > 0) { }  // an toàn với null
if (s != null & s.length() > 0) { }   // NPE khi s == null` },
    '? `x = x++` không làm thay đổi x — một câu hỏi bẫy kinh điển về thứ tự đánh giá.',
  ]);

  L('Control Flow', [
    'Gồm `if/else`, `switch`, `for`, enhanced `for`, `while`, `do-while`, `break`, `continue`, `return`.',
    '## switch',
    '- Dạng cũ `case X:` có **fall-through**: không có `break` thì chạy tiếp các case sau.',
    '- Switch expression (Java 14+) dùng `->`, không fall-through, có thể trả giá trị và compiler kiểm tra đủ nhánh với enum/sealed.',
    { lang: 'java', code: `
String label = switch (status) {
    case NEW, PENDING -> "Chờ xử lý";
    case PAID -> "Đã thanh toán";
    default -> throw new IllegalStateException("Unknown " + status);
};` },
    '## Labeled break/continue',
    '- `break outer;` thoát hẳn vòng lặp có nhãn; `continue outer;` sang lần lặp tiếp theo của vòng có nhãn.',
    '- Enhanced for duyệt bằng Iterator — sửa collection trong lúc duyệt dễ gây `ConcurrentModificationException`.',
    '! Ưu tiên early return/guard clause thay vì if lồng sâu; hạn chế label vì làm luồng khó đọc.',
  ]);

  L('String, String Pool và String Immutability', [
    '`String` là **immutable**: mọi method "sửa" (`toUpperCase`, `concat`, `replace`, `substring`) trả về String mới. Lợi ích: an toàn khi chia sẻ giữa thread, dùng làm key HashMap (hashCode được cache), cho phép String Pool.',
    '## String Pool',
    '- Literal (`"Java"`) được lưu trong String Pool (nằm trên heap từ Java 7) và dùng lại.',
    '- `new String("Java")` luôn tạo object mới ngoài pool. `intern()` trả về bản trong pool.',
    '- Biểu thức hằng compile-time (`"Ja" + "va"`, hoặc nối với biến `final` hằng) được gộp thành literal lúc biên dịch.',
    { lang: 'java', code: `
String a = "Java";
String b = new String("Java");
String c = "Ja" + "va";
a == b;          // false
a == c;          // true  (hằng compile-time)
a == b.intern(); // true
a.equals(b);     // true  -> luôn dùng equals để so sánh nội dung` },
    '## Hiệu năng',
    '- Nối chuỗi trong vòng lặp bằng `+` tạo nhiều object và copy lặp lại (O(n²)). Dùng `StringBuilder` (không đồng bộ) — `StringBuffer` có synchronized nên chậm hơn và hiếm khi cần.',
    '- Java 9+ dùng `invokedynamic` để tối ưu nối chuỗi trong **một biểu thức**, không áp dụng xuyên vòng lặp.',
    '? Vì sao String immutable? → bảo mật (đường dẫn, URL không bị đổi sau khi kiểm tra), thread-safe, cache hashCode, String Pool.',
  ]);

  L('Pass-by-value', [
    'Java **chỉ** truyền tham số theo giá trị. Với object, giá trị được sao chép là **tham chiếu** — method có thể thay đổi trạng thái object, nhưng gán lại tham số không ảnh hưởng biến ở nơi gọi.',
    { lang: 'java', code: `
static void change(Box b) {
    b.v = 10;        // sửa object chung -> nơi gọi thấy
    b = new Box();   // chỉ đổi biến cục bộ b
    b.v = 20;        // không ảnh hưởng nơi gọi
}
Box x = new Box(); change(x);   // x.v == 10` },
    '- Không thể viết `swap(a, b)` hoán đổi hai biến của nơi gọi.',
    '- Truyền wrapper/String vào method rồi "sửa" cũng không có tác dụng vì chúng immutable.',
    '? Trả lời ngắn gọn khi phỏng vấn: "Java luôn pass-by-value; với object thì giá trị được copy là reference".',
  ]);

  L('equals() và hashCode()', [
    '`Object.equals` mặc định so sánh tham chiếu; `hashCode` mặc định dựa trên identity. Override khi object cần so sánh theo giá trị (value object, key của Map, phần tử Set).',
    '## Contract',
    '- Reflexive, symmetric, transitive, consistent; `x.equals(null) == false`.',
    '- Nếu `a.equals(b)` thì `a.hashCode() == b.hashCode()`. Chiều ngược lại **không** bắt buộc (collision hợp lệ).',
    '- Override equals mà không override hashCode → HashSet/HashMap hoạt động sai (`contains` trả false, chứa phần tử "trùng").',
    { lang: 'java', code: `
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Money m)) return false;
    return amount.compareTo(m.amount) == 0 && currency.equals(m.currency);
}
@Override public int hashCode() {
    return Objects.hash(amount.stripTrailingZeros(), currency);
}` },
    '! Field dùng trong hashCode không được thay đổi khi object đang nằm trong HashSet/HashMap. Với JPA entity, tránh hashCode theo id sinh tự động (thay đổi sau persist).',
    '- `record` tự sinh equals/hashCode theo các component.',
  ]);

  L('Object Class', [
    'Mọi class đều kế thừa `java.lang.Object`, gồm: `equals`, `hashCode`, `toString`, `getClass`, `clone` (protected), `finalize` (deprecated), `wait`, `notify`, `notifyAll`.',
    '- `toString()` mặc định: `TênClass@hexHashCode` — nên override cho log dễ đọc (cẩn thận không in dữ liệu nhạy cảm hay kích hoạt lazy loading).',
    '- `clone()` của Object tạo **shallow copy** và yêu cầu implements `Cloneable`. Effective Java khuyên dùng copy constructor/static factory thay thế.',
    '- `wait/notify` phải gọi trong `synchronized` trên chính object đó, nếu không ném `IllegalMonitorStateException`.',
    '- `finalize()` không đảm bảo được gọi, bị deprecated từ Java 9 — dùng try-with-resources hoặc `java.lang.ref.Cleaner`.',
    '- `getClass()` trả về class runtime; khác `instanceof` ở chỗ không chấp nhận lớp con (ảnh hưởng tính symmetric của equals khi có kế thừa).',
  ]);

  L('Exception Handling', [
    'Hệ phân cấp: `Throwable` → `Error` (lỗi nghiêm trọng của JVM: OutOfMemoryError, StackOverflowError — không nên catch) và `Exception` → `RuntimeException` (unchecked) + các checked exception.',
    '## try-catch-finally',
    '- `finally` luôn chạy (trừ khi JVM dừng). **Không return/throw trong finally** — nó nuốt exception gốc và ghi đè giá trị trả về.',
    '- Giá trị return được tính trước khi finally chạy; sửa biến primitive trong finally không đổi kết quả.',
    '## try-with-resources (Java 7+)',
    { lang: 'java', code: `
try (Connection c = ds.getConnection();
     PreparedStatement ps = c.prepareStatement(SQL)) {
    // ...
}   // đóng ps rồi c (ngược thứ tự khai báo); exception khi close được addSuppressed` },
    '## Thực hành tốt',
    '- Catch exception cụ thể, không nuốt lỗi (`catch (Exception e) {}`), log kèm stack trace một lần ở nơi xử lý.',
    '- Khi bọc exception, giữ nguyên cause: `throw new OrderException("...", e)`.',
    '- Dùng exception cho tình huống bất thường, không dùng để điều khiển luồng thông thường.',
    '! Multi-catch `catch (IOException | Exception e)` lỗi compile vì hai kiểu có quan hệ cha–con.',
  ]);

  L('Checked và Unchecked Exceptions', [
    { table: [['', 'Checked', 'Unchecked'], ['Lớp cha', 'Exception (không phải RuntimeException)', 'RuntimeException, Error'], ['Compiler', 'Bắt buộc catch hoặc khai báo throws', 'Không bắt buộc'], ['Ví dụ', 'IOException, SQLException', 'NullPointerException, IllegalArgumentException'], ['Ý nghĩa', 'Lỗi có thể dự đoán và phục hồi', 'Lỗi lập trình / vi phạm điều kiện']] },
    '- Override method không được ném checked exception rộng hơn method gốc.',
    '- Lambda trong Stream không ném được checked exception nếu functional interface không khai báo — phải bọc lại.',
    '- Spring ưu tiên unchecked (`DataAccessException`) để code không bị "throws" lan khắp nơi.',
    '! `@Transactional` mặc định chỉ rollback với unchecked exception — checked exception vẫn commit trừ khi khai báo `rollbackFor`.',
    '? Nên chọn loại nào cho exception nghiệp vụ? Phổ biến: unchecked (ví dụ `OrderNotFoundException extends RuntimeException`) + xử lý tập trung bằng `@RestControllerAdvice`.',
  ]);

  L('Generics', [
    'Generics cho phép kiểm tra kiểu lúc compile và tránh ép kiểu thủ công. Lúc runtime thông tin generic bị xóa (**type erasure**): `List<String>` và `List<Integer>` cùng là `ArrayList`.',
    '## Hệ quả của type erasure',
    '- Không thể `new T()`, `new T[]`, `instanceof List<String>`.',
    '- Không overload hai method chỉ khác tham số generic.',
    '## Invariance và wildcard',
    '- `List<String>` **không phải** `List<Object>` (generics invariant), trong khi array là covariant (`Object[] arr = new String[1]` hợp lệ nhưng có thể `ArrayStoreException`).',
    '- **PECS**: Producer Extends, Consumer Super. Đọc từ list → `? extends T`; ghi vào list → `? super T`.',
    { lang: 'java', code: `
double sum(List<? extends Number> nums) { ... }        // chỉ đọc
void fill(List<? super Integer> out) { out.add(1); }    // ghi Integer
static <T extends Comparable<? super T>> T max(List<T> xs) { ... }` },
  ]);

  L('Annotations', [
    'Annotation là metadata gắn vào class/method/field/tham số. Bản thân nó không làm gì — công cụ (compiler, framework, annotation processor) đọc và xử lý.',
    '## Meta-annotation quan trọng',
    '- `@Retention`: `SOURCE` (chỉ compiler, ví dụ `@Override`), `CLASS` (mặc định, có trong .class nhưng không đọc được bằng reflection), `RUNTIME` (đọc được lúc chạy — cần cho Spring, JPA, validation).',
    '- `@Target`: nơi được gắn (TYPE, METHOD, FIELD, PARAMETER...).',
    '- `@Inherited`: annotation trên class được lớp con kế thừa. `@Documented`, `@Repeatable`.',
    { lang: 'java', code: `
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited { String action(); }` },
    '- Spring hỗ trợ meta-annotation và composed annotation: `@RestController` = `@Controller` + `@ResponseBody`.',
    '- Annotation processor chạy lúc compile (Lombok, MapStruct) để sinh code.',
  ]);

  L('Reflection', [
    'Reflection cho phép kiểm tra và thao tác class/method/field lúc runtime: `Class.forName`, `getDeclaredMethods`, `Method.invoke`, `Field.set`. Là nền tảng của Spring DI, Jackson, Hibernate, JUnit.',
    '- `getMethods()`: method public kể cả kế thừa; `getDeclaredMethods()`: mọi method khai báo trong chính class, không gồm kế thừa.',
    '- Truy cập thành viên private cần `setAccessible(true)`.',
    '## Nhược điểm',
    '- Chậm hơn gọi trực tiếp (JIT tối ưu kém hơn), mất kiểm tra kiểu lúc compile, phá vỡ encapsulation.',
    '- Từ Java 16/17, truy cập sâu vào JDK internals bị chặn mặc định (`InaccessibleObjectException`) — cần `--add-opens` hoặc nâng cấp thư viện.',
    '- GraalVM native image cần khai báo trước các class dùng reflection.',
    '? Spring tạo bean thế nào? → đọc metadata (annotation/bean definition), dùng reflection gọi constructor, inject dependency, rồi bọc proxy nếu có AOP.',
  ]);

  L('Enum', [
    'Enum là class đặc biệt có tập instance cố định; ngầm kế thừa `java.lang.Enum` nên không extends class khác nhưng implements interface được; có field, constructor (luôn private), method, thậm chí method abstract cho từng hằng.',
    { lang: 'java', code: `
enum PaymentMethod {
    CARD(0.02), BANK_TRANSFER(0.0);
    private final double feeRate;
    PaymentMethod(double feeRate) { this.feeRate = feeRate; }
    BigDecimal fee(BigDecimal amount) { return amount.multiply(BigDecimal.valueOf(feeRate)); }
}` },
    '- So sánh bằng `==` an toàn; enum là singleton kể cả qua serialization → cách cài Singleton được khuyến nghị.',
    '- `valueOf("X")` ném `IllegalArgumentException` nếu không tồn tại — xử lý khi map từ input người dùng.',
    '- Dùng `EnumMap`/`EnumSet` cho hiệu năng tốt khi key là enum.',
    '! Với JPA, `@Enumerated` mặc định là ORDINAL — chèn hằng mới làm hỏng dữ liệu cũ; dùng `EnumType.STRING`.',
  ]);

  L('Record và các tính năng Java hiện đại', [
    '## Record (Java 16)',
    '- `record Point(int x, int y) {}` sinh field `private final`, constructor chuẩn, accessor `x()`, `equals/hashCode/toString`.',
    '- Không extends class khác, không khai báo instance field ngoài header; có thể có static field, method, compact constructor để validate.',
    '- Phù hợp DTO, value object, kết quả truy vấn projection. Không phù hợp JPA entity (cần mutable, no-arg constructor, proxy).',
    { lang: 'java', code: `
record Money(BigDecimal amount, String currency) {
    Money {   // compact constructor
        if (amount.signum() < 0) throw new IllegalArgumentException("amount < 0");
        Objects.requireNonNull(currency);
    }
}` },
    '## Tính năng khác',
    '- Pattern matching `instanceof` (16): `if (o instanceof String s && s.length() > 3)`.',
    '- Text block `"""` (15), switch expression (14), `var` (10).',
    '- Sealed class/interface (17): giới hạn lớp con được phép (`permits`), kết hợp switch kiểm tra đủ nhánh.',
    '- Pattern matching cho switch và record pattern (21), Virtual Threads (21), Sequenced Collections (21).',
  ]);

  L('Optional', [
    '`Optional<T>` biểu diễn giá trị có thể vắng mặt, chủ yếu dùng làm **kiểu trả về** để buộc nơi gọi xử lý trường hợp rỗng.',
    { lang: 'java', code: `
Optional<User> u = repo.findByEmail(email);
String name = u.map(User::getName).orElse("Khách");
User user = u.orElseThrow(() -> new UserNotFoundException(email));
u.ifPresent(this::sendWelcome);` },
    '## Lưu ý',
    '- `orElse(x)` luôn tính x (kể cả khi có giá trị); `orElseGet(supplier)` chỉ gọi khi rỗng — dùng cho giá trị mặc định tốn kém.',
    '- `Optional.of(null)` ném NPE; dùng `ofNullable`.',
    '- Không dùng Optional cho field, tham số method, hay collection (trả về collection rỗng thay vì Optional<List>).',
    '- Tránh `isPresent()` + `get()` — mất ý nghĩa; dùng `map/filter/orElseThrow`.',
  ]);

  L('Lambda Expressions', [
    'Lambda là cú pháp ngắn gọn để tạo instance của **functional interface**: `(a, b) -> a + b`.',
    '- Lambda chỉ capture biến local **final hoặc effectively final** (giá trị được copy).',
    '- `this` trong lambda là object bao quanh (khác anonymous class có `this` riêng).',
    '- Method reference: `String::length` (instance method của object tùy ý), `System.out::println` (của object cụ thể), `Integer::parseInt` (static), `ArrayList::new` (constructor).',
    { lang: 'java', code: `
List<String> names = users.stream()
    .filter(u -> u.isActive())
    .map(User::getName)
    .sorted(Comparator.naturalOrder())
    .toList();` },
    '! Lambda không ném được checked exception nếu functional interface không khai báo; tránh lambda dài nhiều dòng — tách thành method có tên.',
  ]);

  L('Functional Interfaces', [
    'Functional interface có **đúng một** abstract method (không tính method trùng public method của Object; default/static không giới hạn). `@FunctionalInterface` giúp compiler kiểm tra.',
    { table: [['Interface', 'Chữ ký', 'Dùng khi'], ['`Function<T,R>`', 'T → R', 'Biến đổi'], ['`Predicate<T>`', 'T → boolean', 'Lọc, kiểm tra'], ['`Consumer<T>`', 'T → void', 'Side effect'], ['`Supplier<T>`', '() → T', 'Tạo/lazy value'], ['`BiFunction<T,U,R>`', '(T,U) → R', 'Hai đầu vào'], ['`UnaryOperator<T>`', 'T → T', 'Biến đổi cùng kiểu']] },
    '- Có biến thể primitive (`IntPredicate`, `ToLongFunction`...) tránh boxing.',
    '- Kết hợp: `Predicate.and/or/negate`, `Function.andThen/compose`, `Comparator.comparing().thenComparing()`.',
  ]);

  L('Stream API', [
    'Stream là pipeline xử lý dữ liệu khai báo: **source** → các **intermediate operation** (lazy: filter, map, sorted, distinct...) → một **terminal operation** (collect, forEach, count, findFirst, reduce...).',
    '## Đặc điểm',
    '- **Lazy**: không có terminal operation thì không làm gì. Xử lý theo từng phần tử qua cả pipeline (vertical), có short-circuit (`findFirst`, `anyMatch`, `limit`).',
    '- Chỉ tiêu thụ được **một lần** (dùng lại ném `IllegalStateException`).',
    '- Không sửa nguồn trong lúc stream; lambda nên không có side effect.',
    { lang: 'java', code: `
Map<String, Long> countByStatus = orders.stream()
    .collect(Collectors.groupingBy(Order::status, Collectors.counting()));

Map<Long, Order> byId = orders.stream()
    .collect(Collectors.toMap(Order::id, o -> o, (a, b) -> a));  // merge khi trùng key

BigDecimal total = orders.stream().map(Order::amount).reduce(BigDecimal.ZERO, BigDecimal::add);` },
    '! `Collectors.toMap` không có merge function ném `IllegalStateException` khi trùng key. `parallelStream` dùng ForkJoinPool chung — không dùng cho I/O chặn.',
  ]);

  L('Date Time API', [
    'Gói `java.time` (Java 8) thay `Date`/`Calendar`: **immutable**, thread-safe, rõ ràng về múi giờ.',
    { table: [['Kiểu', 'Ý nghĩa', 'Dùng cho'], ['`Instant`', 'Điểm trên trục thời gian UTC', 'Timestamp sự kiện, lưu DB'], ['`LocalDate` / `LocalDateTime`', 'Ngày/giờ không có múi giờ', 'Ngày sinh, lịch trong một vùng'], ['`ZonedDateTime` / `OffsetDateTime`', 'Có múi giờ / offset', 'Hiển thị, giao tiếp API'], ['`Duration` / `Period`', 'Khoảng thời gian theo giây / theo ngày tháng', 'Timeout, kỳ hạn']] },
    '- Mọi method `plusX/withX` trả object mới. `LocalDate.of(2024,1,31).plusMonths(1)` → 2024-02-29 (điều chỉnh về ngày hợp lệ).',
    '- `DateTimeFormatter` thread-safe, thay cho `SimpleDateFormat` (không thread-safe).',
    '- Inject `Clock` để code dùng `LocalDate.now(clock)` — test được với `Clock.fixed`.',
    '! `LocalDate.now()` phụ thuộc múi giờ của JVM — container thường là UTC. Xác định ranh giới "ngày" theo múi giờ nghiệp vụ tường minh.',
  ]);

  L('I/O và NIO', [
    '- **java.io**: stream byte (`InputStream/OutputStream`) và ký tự (`Reader/Writer`), dùng Decorator (`BufferedReader(new InputStreamReader(...))`).',
    '- **java.nio**: `Path`, `Files`, `ByteBuffer`, `Channel`, non-blocking I/O với Selector (nền tảng của Netty).',
    { lang: 'java', code: `
List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);   // file nhỏ
try (Stream<String> s = Files.lines(path, StandardCharsets.UTF_8)) {      // file lớn, phải đóng
    long errors = s.filter(l -> l.contains("ERROR")).count();
}
try (BufferedWriter w = Files.newBufferedWriter(out, StandardCharsets.UTF_8)) { w.write("..."); }` },
    '! Luôn chỉ định charset (trước Java 18 mặc định theo nền tảng). Luôn đóng resource bằng try-with-resources — quên đóng gây "Too many open files".',
    '- File lớn: xử lý theo luồng, không đọc toàn bộ vào bộ nhớ.',
  ]);

  L('Serialization', [
    'Java serialization chuyển object thành byte (`ObjectOutputStream`) cho class implements `Serializable`.',
    '- `transient` field không được serialize; sau deserialize nhận giá trị mặc định (constructor không chạy).',
    '- Nên khai báo `serialVersionUID` — nếu không, thay đổi class làm dữ liệu cũ không đọc được (`InvalidClassException`).',
    '- Deserialize dữ liệu không tin cậy là lỗ hổng nghiêm trọng (gadget chain → RCE).',
    '## Trong backend hiện đại',
    '- Trao đổi dữ liệu dùng JSON (Jackson), Protobuf, Avro thay vì Java serialization.',
    '- Jackson: `@JsonIgnore`, `@JsonProperty`, `@JsonFormat`; Spring Boot tự đăng ký module java.time; cẩn thận Long lớn với JavaScript.',
  ]);

  L('Java 8+ Features', [
    { table: [['Phiên bản', 'Tính năng đáng chú ý'], ['8 (LTS)', 'Lambda, Stream, Optional, java.time, default method, CompletableFuture'], ['9', 'Module system, `List.of`/`Map.of`, private interface method'], ['10', '`var`'], ['11 (LTS)', 'HttpClient chuẩn, `String.isBlank/lines/strip`, chạy file .java trực tiếp'], ['14–16', 'Switch expression, text block, record, pattern matching instanceof'], ['17 (LTS)', 'Sealed class, strong encapsulation JDK internals'], ['21 (LTS)', 'Virtual threads, pattern matching switch, record pattern, Sequenced Collections, Generational ZGC']] },
    '- Spring Boot 3 yêu cầu Java 17+. Các bản LTS phổ biến trong enterprise: 8, 11, 17, 21.',
    '? Khi được hỏi "đã nâng cấp Java version chưa", hãy nêu được vấn đề migration: javax→jakarta, reflection bị chặn, dependency không tương thích, thay đổi GC mặc định.',
  ]);
})();
