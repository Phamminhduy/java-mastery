/* Module 1: Java Core */
QB.module({
  id: 'java-core', order: 1, title: 'Java Core',
  description: 'Cú pháp, kiểu dữ liệu, String, Exception, Generics, Lambda, Stream và các tính năng Java hiện đại.',
  topics: ['Java Syntax', 'Primitive Types và Reference Types', 'Variables và Data Types', 'Operators', 'Control Flow',
    'String, String Pool và String Immutability', 'Pass-by-value', 'equals() và hashCode()', 'Object Class', 'Exception Handling',
    'Checked và Unchecked Exceptions', 'Generics', 'Annotations', 'Reflection', 'Enum', 'Record và các tính năng Java hiện đại',
    'Optional', 'Lambda Expressions', 'Functional Interfaces', 'Stream API', 'Date Time API', 'I/O và NIO', 'Serialization', 'Java 8+ Features'],
}, [
  {
    id: 'JC-001', topic: 'String, String Pool và String Immutability', d: 'b', cat: 'output',
    q: 'Kết quả in ra của đoạn code sau là gì?',
    code: `
String a = new String("Java");
String b = "Java";
System.out.println(a == b);
System.out.println(a.equals(b));`,
    opts: ['true / true', 'false / true', 'true / false', 'false / false'], ans: 'B',
    exp: '`==` so sánh tham chiếu. `new String("Java")` luôn tạo một object mới trên heap, còn `b` trỏ tới literal trong String Pool, nên `a == b` là false. `equals()` của String so sánh nội dung ký tự nên trả về true.',
    why: { A: '`new` luôn tạo object mới, không dùng lại object trong pool.', C: 'equals() so sánh nội dung, không so sánh tham chiếu.' },
    tags: ['string', 'string-pool', 'equals'], sec: 40, ver: 'Java 8+',
  },
  {
    id: 'JC-002', topic: 'String, String Pool và String Immutability', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
String b = "Java";
String a = "Ja" + "va";
String c = "Ja";
String d = c + "va";
System.out.println(a == b);
System.out.println(d == b);`,
    opts: ['true / true', 'false / false', 'true / false', 'false / true'], ans: 'C',
    exp: '`"Ja" + "va"` là biểu thức hằng (compile-time constant), compiler gộp thành literal `"Java"` nên `a` dùng chung object trong String Pool với `b` → true.\n`c + "va"` có biến không phải `final` nên được tính lúc runtime (StringBuilder/invokedynamic) và tạo object mới → `d == b` là false.\nNếu khai báo `final String c = "Ja";` thì `c + "va"` cũng thành hằng và kết quả là true.',
    tags: ['string-pool', 'constant-folding'], sec: 60, ver: 'Java 8+',
  },
  {
    id: 'JC-003', topic: 'String, String Pool và String Immutability', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
String s1 = new String("backend");
String s2 = s1.intern();
String s3 = "backend";
System.out.println((s1 == s3) + " " + (s2 == s3));`,
    opts: ['true true', 'false false', 'true false', 'false true'], ans: 'D',
    exp: '`intern()` trả về tham chiếu tới String tương ứng trong String Pool (literal "backend" đã có trong pool do xuất hiện trong code). Vì vậy `s2 == s3` là true, còn `s1` vẫn là object riêng tạo bởi `new` nên `s1 == s3` là false.',
    tags: ['string-pool', 'intern'], sec: 50,
  },
  {
    id: 'JC-004', topic: 'String, String Pool và String Immutability', d: 'b', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
String s = "spring";
s.toUpperCase();
s.concat(" boot");
System.out.println(s);`,
    opts: ['spring', 'SPRING', 'SPRING boot', 'spring boot'], ans: 'A',
    exp: 'String là immutable. `toUpperCase()` và `concat()` trả về một String **mới** chứ không sửa object hiện tại. Kết quả trả về bị bỏ qua nên `s` vẫn là "spring". Cần viết `s = s.toUpperCase();` nếu muốn thay đổi.',
    tags: ['immutability'], sec: 30,
  },
  {
    id: 'JC-005', topic: 'String, String Pool và String Immutability', d: 'i', cat: 'perf',
    q: 'Một job tạo file CSV bằng cách nối chuỗi `result += line;` trong vòng lặp 200.000 dòng và chạy rất chậm. Giải thích và cách sửa nào đúng nhất?',
    opts: [
      'Do String Pool bị đầy; cần tăng -XX:StringTableSize',
      'Mỗi lần `+=` tạo String mới và copy toàn bộ nội dung cũ, tổng chi phí xấp xỉ O(n²); dùng một StringBuilder (hoặc ghi thẳng ra Writer) bên ngoài vòng lặp',
      'Do String không thread-safe; cần dùng StringBuffer',
      'Do JIT không tối ưu được vòng lặp; cần bật -Xint',
    ], ans: 'B',
    exp: 'String immutable nên mỗi phép nối trong vòng lặp tạo object mới và sao chép toàn bộ ký tự đã có → chi phí tăng theo bình phương số dòng và tạo nhiều rác cho GC. Compiler chỉ tối ưu nối chuỗi trong **một biểu thức**, không gộp xuyên qua các vòng lặp. Dùng một `StringBuilder` khai báo ngoài vòng lặp, hoặc tốt hơn với dữ liệu lớn là ghi trực tiếp ra `BufferedWriter` để không giữ toàn bộ trong bộ nhớ.',
    why: { A: 'Chuỗi kết quả runtime không được đưa vào String Pool.', C: 'Biến cục bộ không chia sẻ giữa thread; StringBuffer có synchronized nên còn chậm hơn StringBuilder.', D: '-Xint tắt JIT, làm chậm hơn.' },
    tags: ['performance', 'stringbuilder'], sec: 60,
  },
  {
    id: 'JC-006', topic: 'Pass-by-value', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
class Box { int v; }

static void change(Box b) {
    b.v = 10;
    b = new Box();
    b.v = 20;
}

public static void main(String[] args) {
    Box x = new Box();
    x.v = 1;
    change(x);
    System.out.println(x.v);
}`,
    opts: ['1', '10', '20', 'Compilation error'], ans: 'B',
    exp: 'Java luôn truyền tham số theo giá trị (pass-by-value). Với object, giá trị được copy là **tham chiếu**.\n1) `b.v = 10` sửa object mà cả `x` và `b` cùng trỏ tới → x.v = 10.\n2) `b = new Box()` chỉ gán lại biến cục bộ `b`, không ảnh hưởng `x`.\n3) `b.v = 20` sửa object mới, không liên quan `x`.\nVì vậy in ra 10.',
    tags: ['pass-by-value', 'reference'], sec: 60,
  },
  {
    id: 'JC-007', topic: 'Pass-by-value', d: 'b', cat: 'theory',
    q: 'Phát biểu nào mô tả đúng cách Java truyền tham số cho method?',
    opts: [
      'Primitive truyền theo giá trị, object truyền theo tham chiếu (pass-by-reference)',
      'Mọi tham số đều truyền theo giá trị; với object, giá trị được sao chép là tham chiếu tới object',
      'Mọi tham số đều truyền theo tham chiếu',
      'Tùy JVM, HotSpot dùng pass-by-reference cho object lớn',
    ], ans: 'B',
    exp: 'Java chỉ có pass-by-value. Khi truyền object, method nhận một **bản sao của tham chiếu**: có thể thay đổi trạng thái object qua tham chiếu đó, nhưng gán lại tham số (`param = new X()`) không làm thay đổi biến của nơi gọi. Đây là lý do không thể viết hàm `swap(a, b)` hoán đổi hai biến object trong Java.',
    tags: ['pass-by-value'], sec: 30,
  },
  {
    id: 'JC-008', topic: 'Primitive Types và Reference Types', d: 'i', cat: 'output',
    q: 'Với cấu hình JVM mặc định, kết quả in ra là gì?',
    code: `
Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println(a == b);
System.out.println(c == d);`,
    opts: ['true / true', 'false / false', 'true / false', 'false / true'], ans: 'C',
    exp: 'Autoboxing dùng `Integer.valueOf()`, method này cache các giá trị từ -128 đến 127 (mặc định). `a` và `b` trỏ cùng object cache → true. 128 nằm ngoài cache nên `c` và `d` là hai object khác nhau → false.\nBài học: luôn so sánh wrapper bằng `equals()` (hoặc unbox về primitive), không dùng `==`. Giới hạn trên của cache có thể thay đổi bằng `-XX:AutoBoxCacheMax`, nên kết quả `c == d` không được đảm bảo theo đặc tả.',
    tags: ['autoboxing', 'integer-cache'], sec: 45,
  },
  {
    id: 'JC-009', topic: 'equals() và hashCode()', d: 'i', cat: 'bug',
    q: 'Class `User` dưới đây được dùng làm phần tử của `HashSet`. Vấn đề chính là gì?',
    code: `
class User {
    private final String email;
    User(String email) { this.email = email; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        return email.equals(((User) o).email);
    }
    // không override hashCode()
}

Set<User> users = new HashSet<>();
users.add(new User("a@x.com"));
boolean found = users.contains(new User("a@x.com"));`,
    opts: [
      'Không có vấn đề, HashSet chỉ dùng equals() để so sánh',
      'Compilation error vì override equals() bắt buộc phải override hashCode()',
      'Vi phạm contract equals/hashCode: hai object equals nhau nhưng hashCode (identity) khác nhau, nên `contains` gần như luôn trả về false và Set có thể chứa các phần tử "trùng"',
      'Ném ClassCastException khi gọi contains()',
    ], ans: 'C',
    exp: 'HashSet/HashMap dùng `hashCode()` để chọn bucket trước, sau đó mới dùng `equals()`. Contract yêu cầu: nếu `a.equals(b)` thì `a.hashCode() == b.hashCode()`. Không override hashCode thì mỗi object dùng identity hash, hai object "bằng nhau" thường rơi vào bucket khác nhau → `contains` trả về false, `add` thêm trùng. Sửa: override `hashCode()` dựa trên cùng các field dùng trong equals, ví dụ `Objects.hash(email)`.',
    why: { B: 'Compiler không bắt buộc; đây là lỗi logic chỉ lộ ra lúc runtime.' },
    tags: ['equals', 'hashcode', 'hashset'], sec: 75,
  },
  {
    id: 'JC-010', topic: 'equals() và hashCode()', d: 'b', cat: 'theory',
    q: 'Phát biểu nào đúng theo contract của `equals()` và `hashCode()`?',
    opts: [
      'Nếu hai object có cùng hashCode thì chúng phải equals nhau',
      'Nếu `a.equals(b)` là true thì `a.hashCode() == b.hashCode()` phải là true',
      'hashCode phải là duy nhất cho mỗi object',
      'equals() mặc định của Object so sánh nội dung các field',
    ], ans: 'B',
    exp: 'Chỉ có chiều: equals ⇒ cùng hashCode. Chiều ngược lại không bắt buộc — hai object khác nhau hoàn toàn có thể trùng hashCode (hash collision). `Object.equals()` mặc định so sánh tham chiếu (`this == obj`).',
    tags: ['equals', 'hashcode', 'contract'], sec: 30,
  },
  {
    id: 'JC-011', topic: 'Object Class', d: 'b', cat: 'theory',
    q: 'Method nào sau đây **không** được khai báo trong `java.lang.Object`?',
    opts: ['clone()', 'wait(long timeout)', 'compareTo(Object o)', 'getClass()'], ans: 'C',
    exp: '`compareTo` thuộc interface `Comparable<T>`. Các method của Object gồm: `equals`, `hashCode`, `toString`, `getClass`, `clone` (protected), `finalize` (deprecated từ Java 9), `wait`, `notify`, `notifyAll`.',
    tags: ['object'], sec: 25,
  },
  {
    id: 'JC-012', topic: 'Exception Handling', d: 'a', cat: 'output',
    q: 'Method `f()` trả về giá trị gì?',
    code: `
static int f() {
    try {
        throw new RuntimeException("boom");
    } finally {
        return 2;
    }
}`,
    opts: ['Ném RuntimeException("boom") ra ngoài', '2', 'Compilation error: unreachable code', '0'], ans: 'B',
    exp: '`return` trong `finally` ghi đè mọi kết quả của try/catch, kể cả exception đang được ném — exception "boom" bị **nuốt mất** và method trả về 2. Đây là lý do không bao giờ nên `return` (hoặc throw) trong finally: lỗi production sẽ bị che giấu hoàn toàn. Nhiều công cụ static analysis (Sonar, javac -Xlint:finally) cảnh báo trường hợp này.',
    tags: ['finally', 'exception'], sec: 50,
  },
  {
    id: 'JC-013', topic: 'Exception Handling', d: 'i', cat: 'output',
    q: 'Method `g()` trả về giá trị gì?',
    code: `
static int g() {
    int x = 1;
    try {
        return x;
    } finally {
        x = 5;
    }
}`,
    opts: ['1', '5', 'Compilation error', '0'], ans: 'A',
    exp: 'Khi gặp `return x`, giá trị 1 được tính và lưu lại trước khi `finally` chạy. Việc gán `x = 5` trong finally chỉ thay đổi biến cục bộ, không đổi giá trị đã chuẩn bị để trả về (với primitive). Nếu trả về một object mutable và finally sửa trạng thái object đó thì nơi gọi sẽ thấy thay đổi.',
    tags: ['finally', 'return'], sec: 45,
  },
  {
    id: 'JC-014', topic: 'Checked và Unchecked Exceptions', d: 'b', cat: 'theory',
    q: 'Exception nào sau đây là **checked exception**?',
    opts: ['NullPointerException', 'IllegalArgumentException', 'IOException', 'ArithmeticException'], ans: 'C',
    exp: 'Checked exception là các lớp con của `Exception` nhưng không phải `RuntimeException`; compiler bắt buộc phải catch hoặc khai báo `throws`. `IOException` là checked. Ba lựa chọn còn lại đều là lớp con của `RuntimeException` (unchecked).',
    tags: ['checked', 'unchecked'], sec: 25,
  },
  {
    id: 'JC-015', topic: 'Checked và Unchecked Exceptions', d: 'i', cat: 'compile',
    q: 'Đoạn code sau có biên dịch được không?',
    code: `
try {
    Files.readAllLines(Path.of("a.txt"));
} catch (IOException | Exception e) {
    log.error("failed", e);
}`,
    opts: [
      'Biên dịch được, bắt cả IOException và Exception',
      'Lỗi compile: các kiểu trong multi-catch không được có quan hệ cha–con',
      'Lỗi compile: Files.readAllLines không ném IOException',
      'Biên dịch được nhưng cảnh báo unchecked',
    ], ans: 'B',
    exp: 'Trong multi-catch (Java 7+), các kiểu exception không được là subclass của nhau. `IOException` là lớp con của `Exception` nên khai báo thừa → lỗi compile "Alternatives in a multi-catch statement cannot be related by subclassing". Chỉ cần `catch (Exception e)` hoặc tách thành hai catch theo thứ tự con trước cha.',
    tags: ['multi-catch', 'compile-error'], sec: 45, ver: 'Java 7+',
  },
  {
    id: 'JC-016', topic: 'Exception Handling', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
class R implements AutoCloseable {
    private final String n;
    R(String n) { this.n = n; System.out.print("open-" + n + " "); }
    public void close() { System.out.print("close-" + n + " "); }
}

try (R a = new R("A"); R b = new R("B")) {
    System.out.print("body ");
}`,
    opts: [
      'open-A open-B body close-A close-B',
      'open-A open-B body close-B close-A',
      'body open-A open-B close-B close-A',
      'open-A body close-A open-B close-B',
    ], ans: 'B',
    exp: 'try-with-resources mở resource theo thứ tự khai báo và **đóng theo thứ tự ngược lại** (B rồi A), sau khi body chạy xong — giống như stack. Thứ tự này quan trọng khi resource sau phụ thuộc resource trước (ví dụ PreparedStatement phụ thuộc Connection).',
    tags: ['try-with-resources', 'autocloseable'], sec: 50, ver: 'Java 7+',
  },
  {
    id: 'JC-017', topic: 'Exception Handling', d: 'a', cat: 'theory',
    q: 'Trong try-with-resources, nếu body ném `IllegalStateException` và sau đó `close()` của resource ném `IOException`, điều gì xảy ra?',
    opts: [
      'IOException từ close() được ném ra, IllegalStateException bị mất',
      'IllegalStateException được ném ra; IOException được gắn vào nó dưới dạng suppressed exception (lấy qua getSuppressed())',
      'Cả hai được gói vào một MultipleException',
      'JVM ghi log IOException và ném IllegalStateException, không giữ lại thông tin của IOException',
    ], ans: 'B',
    exp: 'Exception từ body là exception chính. Exception phát sinh khi đóng resource được thêm vào bằng `Throwable.addSuppressed()` và in kèm trong stack trace (phần "Suppressed:"). Đây là cải tiến so với try/finally thủ công, vốn làm mất exception gốc nếu finally cũng ném lỗi.',
    tags: ['suppressed', 'try-with-resources'], sec: 45, ver: 'Java 7+',
  },
  {
    id: 'JC-018', topic: 'Generics', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
List<String> a = new ArrayList<>();
List<Integer> b = new ArrayList<>();
System.out.println(a.getClass() == b.getClass());`,
    opts: ['true', 'false', 'Compilation error: incomparable types', 'Phụ thuộc phiên bản JVM'], ans: 'A',
    exp: 'Do **type erasure**, thông tin kiểu generic bị xóa khi biên dịch; lúc runtime cả hai đều là `java.util.ArrayList`. Hệ quả: không thể viết `new T()`, `instanceof List<String>`, hay overload hai method chỉ khác tham số generic (`m(List<String>)` và `m(List<Integer>)`).',
    tags: ['generics', 'type-erasure'], sec: 40,
  },
  {
    id: 'JC-019', topic: 'Generics', d: 'a', cat: 'theory',
    q: 'Cần viết method thêm các số `Integer` vào một list, sao cho có thể truyền vào `List<Integer>`, `List<Number>` và `List<Object>`. Khai báo nào phù hợp?',
    opts: [
      'void fill(List<Integer> list)',
      'void fill(List<? extends Number> list)',
      'void fill(List<? super Integer> list)',
      'void fill(List<?> list)',
    ], ans: 'C',
    exp: 'Nguyên tắc PECS: Producer Extends, Consumer Super. Method **ghi** Integer vào list (list là consumer) → dùng `? super Integer`, chấp nhận List<Integer>, List<Number>, List<Object>.\n`? extends Number` chỉ cho phép đọc (không thể add Integer vì list thực có thể là List<Double>). `List<?>` không cho add gì ngoài null. `List<Integer>` không nhận List<Number> do generics invariant.',
    tags: ['generics', 'wildcard', 'pecs'], sec: 60,
  },
  {
    id: 'JC-020', topic: 'Generics', d: 'i', cat: 'compile', fixed: true,
    q: 'Dòng nào gây lỗi compile?',
    code: `
List<String> strings = new ArrayList<>();      // (1)
List<? extends Object> any = strings;          // (2)
List<Object> objects = strings;                // (3)
Object[] arr = new String[1];                  // (4)`,
    opts: ['(1)', '(2)', '(3)', '(4)'], ans: 'C',
    exp: 'Generics là **invariant**: `List<String>` không phải là `List<Object>`, nên (3) lỗi compile (nếu cho phép, ta có thể add Integer vào list String). (2) hợp lệ nhờ wildcard. (4) biên dịch được vì array là **covariant**, nhưng nếu sau đó gán `arr[0] = 1` sẽ ném `ArrayStoreException` lúc runtime.',
    tags: ['generics', 'invariance', 'array'], sec: 50,
  },
  {
    id: 'JC-021', topic: 'Annotations', d: 'i', cat: 'bug',
    q: 'Bạn tạo annotation `@Audited` và viết code dùng reflection `method.isAnnotationPresent(Audited.class)` nhưng luôn nhận false dù method đã được gắn annotation. Nguyên nhân khả dĩ nhất?',
    code: `
@Target(ElementType.METHOD)
public @interface Audited {
    String action();
}`,
    opts: [
      'Thiếu @Inherited',
      'Thiếu @Retention(RetentionPolicy.RUNTIME); mặc định là CLASS nên annotation không có ở runtime',
      'Annotation phải có ít nhất một giá trị mặc định',
      'Thiếu @Documented',
    ], ans: 'B',
    exp: 'RetentionPolicy mặc định là `CLASS`: annotation được ghi vào file .class nhưng JVM không giữ lại để đọc bằng reflection. Annotation dùng cho reflection/AOP (như cách Spring đọc `@Transactional`) cần `@Retention(RetentionPolicy.RUNTIME)`. `@Inherited` chỉ áp dụng cho annotation trên class, `@Documented` liên quan Javadoc.',
    tags: ['annotation', 'retention', 'reflection'], sec: 50,
  },
  {
    id: 'JC-022', topic: 'Reflection', d: 'a', cat: 'scenario',
    q: 'Một thư viện cũ dùng reflection gọi `setAccessible(true)` lên field private của class nội bộ JDK (ví dụ `java.lang.String#value`). Khi nâng cấp lên Java 17 và chạy không kèm tùy chọn JVM đặc biệt, điều gì xảy ra?',
    opts: [
      'Chạy bình thường như Java 8',
      'Chỉ in cảnh báo "illegal reflective access" rồi tiếp tục',
      'Ném InaccessibleObjectException vì JDK internals được strong encapsulation; cần --add-opens hoặc nâng cấp thư viện',
      'JVM không khởi động được',
    ], ans: 'C',
    exp: 'Java 9 giới thiệu module system và chỉ cảnh báo illegal reflective access. Từ Java 16 (JEP 396) mặc định là deny, và Java 17 (JEP 403) loại bỏ hẳn tùy chọn `--illegal-access`. Truy cập sâu vào package không được open sẽ ném `InaccessibleObjectException`. Giải pháp: nâng cấp thư viện, hoặc tạm thời dùng `--add-opens java.base/java.lang=ALL-UNNAMED`.',
    tags: ['reflection', 'module', 'java17', 'migration'], sec: 60, ver: 'Java 17+',
  },
  {
    id: 'JC-023', topic: 'Enum', d: 'b', cat: 'runtime',
    q: 'Điều gì xảy ra khi chạy đoạn code sau với input `"PURPLE"`?',
    code: `
enum Status { NEW, PROCESSING, DONE }

Status s = Status.valueOf(input);`,
    opts: ['s = null', 'Ném IllegalArgumentException', 'Ném NoSuchElementException', 'Compilation error'], ans: 'B',
    exp: '`Enum.valueOf()` ném `IllegalArgumentException` ("No enum constant ...") khi không có hằng tương ứng (và NPE nếu input null). Khi map dữ liệu từ request/DB, cần xử lý trường hợp này để trả lỗi 400 rõ ràng thay vì 500.',
    tags: ['enum', 'valueof'], sec: 30,
  },
  {
    id: 'JC-024', topic: 'Enum', d: 'i', cat: 'theory',
    q: 'Phát biểu nào đúng về enum trong Java?',
    opts: [
      'Enum có thể extends một class khác',
      'Enum có thể implements interface, có field, constructor (ngầm định private) và method; mỗi hằng là một instance duy nhất nên so sánh bằng == là an toàn',
      'Có thể tạo instance enum bằng new ở bên ngoài',
      'Enum không thể dùng trong switch',
    ], ans: 'B',
    exp: 'Enum ngầm extends `java.lang.Enum` nên không extends class khác, nhưng có thể implements interface. Constructor luôn là private, JVM đảm bảo mỗi hằng là singleton (kể cả qua serialization), vì vậy `==` an toàn và enum còn là cách cài đặt Singleton được khuyến nghị. Nên dùng `EnumMap`/`EnumSet` khi key là enum.',
    tags: ['enum', 'singleton'], sec: 40,
  },
  {
    id: 'JC-025', topic: 'Record và các tính năng Java hiện đại', d: 'i', cat: 'theory', type: 'multiple',
    q: 'Với `record Money(BigDecimal amount, String currency) {}` (Java 16+), chọn **2** phát biểu đúng.',
    opts: [
      'Các field là private final; compiler tự sinh constructor, accessor amount()/currency(), equals(), hashCode(), toString()',
      'Record có thể extends một abstract class',
      'Có thể dùng compact constructor để validate, ví dụ kiểm tra amount không âm',
      'Record có thể khai báo thêm instance field không nằm trong header',
    ], ans: ['A', 'C'],
    exp: 'Record là "nominal tuple" bất biến (shallow immutable): field private final, tự sinh constructor chuẩn, accessor (không có tiền tố get), equals/hashCode/toString theo các component. Record ngầm extends `java.lang.Record` nên không extends class khác (nhưng implements interface được). Không được khai báo instance field ngoài header (static field thì được). Compact constructor `Money { if (amount.signum() < 0) throw ...; }` dùng để validate/chuẩn hóa.',
    tags: ['record', 'java16'], sec: 60, ver: 'Java 16+',
  },
  {
    id: 'JC-026', topic: 'Optional', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
static String load() {
    System.out.print("load ");
    return "db";
}

String v = Optional.of("cache").orElse(load());
System.out.println(v);`,
    opts: ['cache', 'load cache', 'load db', 'db'], ans: 'B',
    exp: 'Tham số của `orElse(...)` luôn được tính trước khi gọi method (Java đánh giá đối số eagerly), nên `load()` chạy và in "load " dù Optional có giá trị. Kết quả trả về vẫn là "cache". Khi giá trị mặc định tốn kém (gọi DB, API), dùng `orElseGet(() -> load())` để chỉ chạy khi Optional rỗng.',
    tags: ['optional', 'orelse', 'orelseget'], sec: 50, ver: 'Java 8+',
  },
  {
    id: 'JC-027', topic: 'Optional', d: 'i', cat: 'design',
    q: 'Cách dùng Optional nào được xem là **đúng mục đích** theo khuyến nghị của các kiến trúc sư JDK?',
    opts: [
      'Khai báo field entity: `private Optional<String> middleName;`',
      'Làm kiểu trả về của method truy vấn có thể không có kết quả: `Optional<User> findByEmail(String email)`',
      'Làm tham số method: `void update(Optional<String> name)`',
      'Gọi `optional.get()` ngay sau khi tạo để lấy giá trị',
    ], ans: 'B',
    exp: 'Optional được thiết kế chủ yếu làm **kiểu trả về** để buộc nơi gọi xử lý trường hợp "không có giá trị". Không nên dùng làm field (không Serializable, tốn bộ nhớ, gây khó với JPA/Jackson) hay tham số (đẩy gánh nặng sang caller; overload/nullable rõ ràng hơn). Gọi `get()` không kiểm tra làm mất ý nghĩa; ưu tiên `orElseThrow`, `map`, `ifPresent`.',
    tags: ['optional', 'best-practice'], sec: 45,
  },
  {
    id: 'JC-028', topic: 'Lambda Expressions', d: 'i', cat: 'compile',
    q: 'Đoạn code sau có lỗi gì?',
    code: `
List<String> names = List.of("a", "b", "c");
int count = 0;
names.forEach(n -> count++);
System.out.println(count);`,
    opts: [
      'Không lỗi, in ra 3',
      'Lỗi compile: biến cục bộ dùng trong lambda phải final hoặc effectively final',
      'Ném UnsupportedOperationException vì List.of là immutable',
      'In ra 0 do lambda chạy trên thread khác',
    ], ans: 'B',
    exp: 'Lambda chỉ được capture biến cục bộ final hoặc effectively final (giá trị được copy vào lambda). `count++` thay đổi biến nên lỗi compile. Cách đúng: dùng `names.size()`, `stream().count()`, hoặc nếu thật sự cần tích lũy thì dùng `AtomicInteger`/reduce. Lưu ý List.of chỉ cấm sửa list, forEach đọc vẫn hợp lệ.',
    tags: ['lambda', 'effectively-final'], sec: 40, ver: 'Java 8+',
  },
  {
    id: 'JC-029', topic: 'Functional Interfaces', d: 'a', cat: 'compile',
    q: 'Interface nào sau đây **vẫn hợp lệ** khi gắn `@FunctionalInterface`?',
    code: `
@FunctionalInterface
interface Validator<T> {
    boolean validate(T value);
    boolean equals(Object o);
    default Validator<T> and(Validator<T> other) {
        return v -> validate(v) && other.validate(v);
    }
    static <T> Validator<T> alwaysTrue() { return v -> true; }
}`,
    opts: [
      'Không hợp lệ vì có 2 method abstract (validate và equals)',
      'Hợp lệ: equals(Object) là public method của Object nên không tính; default và static method không ảnh hưởng',
      'Không hợp lệ vì functional interface không được có default method',
      'Không hợp lệ vì functional interface không được generic',
    ], ans: 'B',
    exp: 'Functional interface phải có đúng **một** abstract method. Các abstract method trùng chữ ký với public method của `Object` (equals, hashCode, toString) không được tính — ví dụ `Comparator` cũng khai báo `equals`. Default method và static method được phép không giới hạn.',
    tags: ['functional-interface'], sec: 60, ver: 'Java 8+',
  },
  {
    id: 'JC-030', topic: 'Stream API', d: 'a', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
Optional<Integer> r = Stream.of(1, 2, 3, 4)
    .filter(x -> { System.out.print("f" + x + " "); return x % 2 == 0; })
    .map(x -> { System.out.print("m" + x + " "); return x * 10; })
    .findFirst();
System.out.println(r.get());`,
    opts: [
      'f1 f2 f3 f4 m2 m4 20',
      'f1 f2 m2 20',
      'f1 m1 f2 m2 20',
      'f1 f2 f3 f4 m2 20',
    ], ans: 'B',
    exp: 'Stream xử lý **lazy** và theo từng phần tử (vertical), không phải hết bước filter rồi mới đến map.\n1 → filter (f1) bị loại.\n2 → filter (f2) qua → map (m2) → findFirst có kết quả và **short-circuit**, phần tử 3, 4 không được xử lý.\nKết quả "f1 f2 m2 20".',
    tags: ['stream', 'lazy', 'short-circuit'], sec: 75, ver: 'Java 8+',
  },
  {
    id: 'JC-031', topic: 'Stream API', d: 'i', cat: 'output',
    q: 'Đoạn code sau in ra gì?',
    code: `
List<Integer> list = List.of(1, 2, 3);
list.stream()
    .peek(System.out::print)
    .map(x -> x * 2);
System.out.println("|done");`,
    opts: ['123|done', '246|done', '|done', 'Compilation error'], ans: 'C',
    exp: 'Không có **terminal operation** (collect, forEach, count…), nên pipeline trung gian (peek, map) không bao giờ được thực thi. Chỉ "|done" được in. Lỗi này hay gặp khi debug bằng peek hoặc khi quên `.collect(...)` và tưởng dữ liệu đã được xử lý.',
    tags: ['stream', 'lazy', 'terminal-operation'], sec: 40, ver: 'Java 8+',
  },
  {
    id: 'JC-032', topic: 'Stream API', d: 'i', cat: 'runtime',
    q: 'Đoạn code sau cho kết quả gì?',
    code: `
Map<Integer, String> byLength = Stream.of("java", "jdbc", "spring")
    .collect(Collectors.toMap(String::length, s -> s));
System.out.println(byLength);`,
    opts: [
      '{4=jdbc, 6=spring}',
      '{4=java, 6=spring}',
      'Ném IllegalStateException: Duplicate key 4',
      '{4=[java, jdbc], 6=[spring]}',
    ], ans: 'C',
    exp: '"java" và "jdbc" cùng độ dài 4. `Collectors.toMap` hai tham số ném `IllegalStateException` khi trùng key. Cần truyền merge function, ví dụ `toMap(String::length, s -> s, (a, b) -> a)`, hoặc dùng `groupingBy(String::length)` nếu muốn gom thành list. Lỗi này thường xuất hiện ở production khi dữ liệu thực có trùng lặp mà dữ liệu test không có.',
    tags: ['stream', 'collectors', 'tomap'], sec: 50, ver: 'Java 8+',
  },
  {
    id: 'JC-033', topic: 'Stream API', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
Map<Boolean, Long> r = Stream.of(1, 2, 3, 4, 5)
    .collect(Collectors.partitioningBy(x -> x > 2, Collectors.counting()));
System.out.println(r);`,
    opts: ['{false=2, true=3}', '{true=3}', '{false=[1, 2], true=[3, 4, 5]}', '{true=3, false=2}'], ans: 'A',
    exp: '`partitioningBy` luôn tạo map có đủ 2 key false và true (kể cả khi một nhóm rỗng). Downstream collector `counting()` đếm số phần tử mỗi nhóm: 1,2 → false (2); 3,4,5 → true (3). Map trả về in key false trước true.',
    tags: ['stream', 'collectors', 'partitioningby'], sec: 50, ver: 'Java 8+',
  },
  {
    id: 'JC-034', topic: 'Stream API', d: 'b', cat: 'runtime',
    q: 'Điều gì xảy ra khi chạy đoạn code sau?',
    code: `
Stream<String> s = Stream.of("a", "b");
long n = s.count();
List<String> list = s.collect(Collectors.toList());`,
    opts: ['list = [a, b]', 'list = []', 'Ném IllegalStateException: stream has already been operated upon or closed', 'Compilation error'], ans: 'C',
    exp: 'Một Stream chỉ được tiêu thụ **một lần**. Sau terminal operation `count()`, stream đã đóng; gọi tiếp `collect` ném IllegalStateException. Nếu cần dùng lại, hãy tạo stream mới từ nguồn (ví dụ `list.stream()`) hoặc dùng `Supplier<Stream<T>>`.',
    tags: ['stream'], sec: 35, ver: 'Java 8+',
  },
  {
    id: 'JC-035', topic: 'Date Time API', d: 'i', cat: 'design',
    q: 'Hệ thống đặt lịch phục vụ người dùng ở nhiều múi giờ cần lưu **thời điểm** một giao dịch xảy ra để so sánh, sắp xếp chính xác. Kiểu dữ liệu Java nào phù hợp nhất để biểu diễn giá trị này trong domain?',
    opts: ['LocalDateTime', 'Instant (hoặc OffsetDateTime khi cần giữ offset)', 'LocalDate', 'java.util.Date kèm SimpleDateFormat dùng chung (static)'], ans: 'B',
    exp: '`Instant` biểu diễn một điểm trên trục thời gian UTC, không phụ thuộc múi giờ → phù hợp lưu thời điểm sự kiện. `LocalDateTime` không có thông tin múi giờ nên "2024-03-10 09:00" ở Hà Nội và New York là hai thời điểm khác nhau nhưng giá trị giống nhau. Chỉ chuyển sang `ZonedDateTime` khi hiển thị cho người dùng. `SimpleDateFormat` không thread-safe, dùng static chung sẽ gây lỗi khi chạy đồng thời.',
    tags: ['java-time', 'instant', 'timezone'], sec: 50, ver: 'Java 8+',
  },
  {
    id: 'JC-036', topic: 'Date Time API', d: 'b', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
LocalDate d = LocalDate.of(2024, 1, 31);
d.plusMonths(1);
System.out.println(d + " " + d.plusMonths(1));`,
    opts: ['2024-02-29 2024-03-29', '2024-01-31 2024-02-29', '2024-01-31 2024-03-02', 'Ném DateTimeException'], ans: 'B',
    exp: 'Các class java.time là immutable: `d.plusMonths(1)` trả object mới, `d` không đổi. Khi cộng tháng mà ngày không tồn tại (31/02), java.time điều chỉnh về **ngày hợp lệ cuối tháng** — 2024 là năm nhuận nên ra 2024-02-29, không ném exception.',
    tags: ['java-time', 'immutable', 'localdate'], sec: 45, ver: 'Java 8+',
  },
  {
    id: 'JC-037', topic: 'I/O và NIO', d: 'i', cat: 'bug',
    q: 'Một service đọc file bằng code sau, chạy nhiều lần mỗi phút. Sau vài giờ server báo "Too many open files". Nguyên nhân?',
    code: `
long countErrors(Path log) throws IOException {
    return Files.lines(log)
        .filter(l -> l.contains("ERROR"))
        .count();
}`,
    opts: [
      'Files.lines đọc toàn bộ file vào bộ nhớ',
      'Stream từ Files.lines giữ file handle mở; không đóng stream (try-with-resources) nên file descriptor bị rò rỉ',
      'Do filter chạy song song',
      'Do log file quá lớn',
    ], ans: 'B',
    exp: '`Files.lines` trả về Stream **lazy** được hỗ trợ bởi một file handle đang mở; terminal operation không tự đóng nó. Cần: `try (Stream<String> lines = Files.lines(log)) { return lines.filter(...).count(); }`. Ngược lại, `Files.readAllLines` đọc hết vào bộ nhớ và tự đóng file.',
    tags: ['nio', 'resource-leak', 'file-descriptor'], sec: 50, ver: 'Java 8+',
  },
  {
    id: 'JC-038', topic: 'Serialization', d: 'i', cat: 'theory',
    q: 'Một class `Serializable` không khai báo `serialVersionUID`. Sau khi thêm một field mới và deploy, ứng dụng đọc lại dữ liệu đã serialize trước đó (ví dụ trong session/cache). Điều gì có khả năng xảy ra?',
    opts: [
      'Field mới nhận giá trị mặc định, mọi thứ hoạt động bình thường',
      'Ném InvalidClassException vì serialVersionUID tự sinh thay đổi theo cấu trúc class',
      'Field mới được set null và in cảnh báo',
      'JVM tự migrate dữ liệu sang cấu trúc mới',
    ], ans: 'B',
    exp: 'Nếu không khai báo, serialVersionUID được tính từ cấu trúc class; thêm field làm giá trị thay đổi → deserialize dữ liệu cũ ném `InvalidClassException`. Khai báo `private static final long serialVersionUID = 1L;` giúp các thay đổi tương thích (như thêm field) vẫn đọc được — field mới nhận giá trị mặc định. Ngoài ra, Java serialization có rủi ro bảo mật khi deserialize dữ liệu không tin cậy; ưu tiên JSON/Protobuf cho dữ liệu trao đổi.',
    tags: ['serialization', 'serialversionuid'], sec: 50,
  },
  {
    id: 'JC-039', topic: 'Serialization', d: 'b', cat: 'theory',
    q: 'Field được đánh dấu `transient` sẽ có giá trị gì sau khi object được deserialize bằng Java serialization?',
    opts: ['Giá trị như lúc serialize', 'Giá trị mặc định của kiểu (null, 0, false)', 'Giá trị khởi tạo trong khai báo field', 'Ném NotSerializableException'], ans: 'B',
    exp: 'Field `transient` bị bỏ qua khi serialize. Khi deserialize, constructor của class Serializable **không chạy** và initializer của field cũng không chạy, nên field nhận giá trị mặc định của kiểu. Dùng transient cho dữ liệu nhạy cảm (password) hoặc dữ liệu có thể tính lại.',
    tags: ['serialization', 'transient'], sec: 35,
  },
  {
    id: 'JC-040', topic: 'Java 8+ Features', d: 'b', cat: 'compile',
    q: 'Khai báo nào sau đây **hợp lệ** (Java 11)?',
    opts: [
      'private var name = "x"; // field của class',
      'var list = new ArrayList<String>(); // biến cục bộ',
      'var x; x = 10;',
      'var f = null;',
    ], ans: 'B',
    exp: '`var` (Java 10+) chỉ dùng cho **biến cục bộ có initializer**, biến trong for và tham số lambda (Java 11+). Không dùng cho field, tham số method, kiểu trả về. `var x;` không có initializer và `var f = null;` không suy luận được kiểu nên đều lỗi compile.',
    tags: ['var', 'java10'], sec: 35, ver: 'Java 10+',
  },
  {
    id: 'JC-041', topic: 'Record và các tính năng Java hiện đại', d: 'i', cat: 'output',
    q: 'Với Java 17, kết quả in ra là gì?',
    code: `
Object o = 42;
if (o instanceof Integer i && i > 40) {
    System.out.println("big " + (i + 1));
} else {
    System.out.println("small");
}`,
    opts: ['big 43', 'big 421', 'small', 'Compilation error: không thể dùng i trong cùng điều kiện'], ans: 'A',
    exp: 'Pattern matching cho `instanceof` là tính năng chính thức từ Java 16: nếu `o` là Integer thì biến pattern `i` được gán và có thể dùng ngay ở vế phải của `&&` (flow scoping). `i + 1` là phép cộng số → "big 43". Lưu ý: dùng `||` thay cho `&&` sẽ lỗi compile vì `i` có thể chưa được gán. Pattern matching trong switch (`case Integer i ->`) chỉ chính thức từ Java 21.',
    tags: ['pattern-matching', 'instanceof', 'java16'], sec: 60, ver: 'Java 17',
  },
  {
    id: 'JC-042', topic: 'Primitive Types và Reference Types', d: 'b', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
int max = Integer.MAX_VALUE;
long a = max + 1;
long b = max + 1L;
System.out.println(a + " " + b);`,
    opts: ['2147483648 2147483648', '-2147483648 2147483648', '-2147483648 -2147483648', 'Ném ArithmeticException'], ans: 'B',
    exp: '`max + 1` tính bằng kiểu int nên tràn số (overflow) thành -2147483648 **trước khi** được gán sang long. `max + 1L` có toán hạng long nên được nâng kiểu và tính đúng. Java không ném exception khi tràn số nguyên; dùng `Math.addExact` nếu cần phát hiện tràn (ví dụ tính tiền, số lượng).',
    tags: ['overflow', 'primitive', 'widening'], sec: 45,
  },
  {
    id: 'JC-043', topic: 'Operators', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
int i = 5;
int r = i++ + ++i;
System.out.println(r + " " + i);`,
    opts: ['11 6', '12 7', '11 7', '13 7'], ans: 'B',
    exp: 'Biểu thức được tính từ trái sang phải:\n1) `i++` trả về 5, sau đó i = 6.\n2) `++i` tăng i lên 7 rồi trả về 7.\n3) r = 5 + 7 = 12, i = 7.',
    tags: ['operators', 'increment'], sec: 40,
  },
  {
    id: 'JC-044', topic: 'Operators', d: 'b', cat: 'runtime',
    q: 'Với `s = null`, đoạn code sau cho kết quả gì?',
    code: `
if (s != null & s.length() > 0) {
    System.out.println("non-empty");
} else {
    System.out.println("empty");
}`,
    opts: ['In "empty"', 'In "non-empty"', 'Ném NullPointerException', 'Compilation error'], ans: 'C',
    exp: '`&` với boolean là toán tử logic **không short-circuit**: cả hai vế đều được tính, nên `s.length()` được gọi trên null → NPE. Dùng `&&` để vế phải chỉ được tính khi vế trái true.',
    tags: ['operators', 'short-circuit', 'npe'], sec: 30,
  },
  {
    id: 'JC-045', topic: 'Variables và Data Types', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("1.00");
System.out.println(a.equals(b) + " " + (a.compareTo(b) == 0));`,
    opts: ['true true', 'false true', 'true false', 'false false'], ans: 'B',
    exp: '`BigDecimal.equals()` so sánh cả giá trị **và scale** (1.0 có scale 1, 1.00 có scale 2) → false. `compareTo()` chỉ so sánh giá trị số → 0. Vì vậy dùng compareTo khi so sánh tiền; và cẩn thận khi dùng BigDecimal làm key của HashMap/HashSet. Ngoài ra nên tạo BigDecimal từ String hoặc `BigDecimal.valueOf(double)`, tránh `new BigDecimal(0.1)` vì mang theo sai số nhị phân.',
    tags: ['bigdecimal', 'equals', 'money'], sec: 50,
  },
  {
    id: 'JC-046', topic: 'Control Flow', d: 'b', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
int x = 2;
switch (x) {
    case 1: System.out.print("A");
    case 2: System.out.print("B");
    case 3: System.out.print("C"); break;
    default: System.out.print("D");
}`,
    opts: ['B', 'BC', 'BCD', 'ABC'], ans: 'B',
    exp: 'Switch dạng `case ... :` có cơ chế **fall-through**: nhảy vào case 2, in "B", không có break nên chạy tiếp case 3 in "C", gặp break thì thoát. Switch expression dạng `case 2 -> ...` (Java 14+) không fall-through.',
    tags: ['switch', 'fall-through'], sec: 30,
  },
  {
    id: 'JC-047', topic: 'Java Syntax', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
class A {
    static { System.out.print("S "); }
    { System.out.print("I "); }
    A() { System.out.print("C "); }
}

new A();
new A();`,
    opts: ['S I C S I C', 'S I C I C', 'I C S I C', 'S C I C I'], ans: 'B',
    exp: 'Static initializer chạy **một lần** khi class được khởi tạo (initialized) lần đầu. Instance initializer chạy mỗi lần tạo object, **trước** phần thân constructor (sau lời gọi super()). Vì vậy: "S " một lần, rồi "I C " cho mỗi object.',
    tags: ['initialization-order', 'static-block'], sec: 45,
  },
  {
    id: 'JC-048', topic: 'Variables và Data Types', d: 'b', cat: 'compile',
    q: 'Đoạn code sau có biên dịch được không?',
    code: `
public void print() {
    int total;
    if (Math.random() > 0.5) {
        total = 10;
    }
    System.out.println(total);
}`,
    opts: ['Được, in 10 hoặc 0', 'Lỗi compile: variable total might not have been initialized', 'Được, in 10 hoặc null', 'Ném runtime exception khi total chưa gán'], ans: 'B',
    exp: 'Biến **cục bộ** không có giá trị mặc định; compiler kiểm tra definite assignment và báo lỗi nếu có nhánh chưa gán. Chỉ field (instance/static) mới có giá trị mặc định (0, null, false).',
    tags: ['local-variable', 'definite-assignment'], sec: 30,
  },
  {
    id: 'JC-049', topic: 'Primitive Types và Reference Types', d: 'i', cat: 'runtime',
    q: 'Method sau được gọi với productId chưa có trong map. Điều gì xảy ra?',
    code: `
private final Map<String, Integer> stock = new HashMap<>();

public int available(String productId) {
    int qty = stock.get(productId);
    return qty;
}`,
    opts: ['Trả về 0', 'Ném NullPointerException do auto-unboxing null', 'Trả về -1', 'Lỗi compile'], ans: 'B',
    exp: '`stock.get()` trả về `null` khi không có key; gán vào `int` kích hoạt auto-unboxing (`null.intValue()`) → NPE. Sửa: `stock.getOrDefault(productId, 0)` hoặc kiểm tra null. Đây là lỗi production phổ biến vì code biên dịch bình thường.',
    tags: ['autoboxing', 'npe', 'map'], sec: 40,
  },
  {
    id: 'JC-050', topic: 'Lambda Expressions', d: 'i', cat: 'theory',
    q: 'Method reference nào tương đương với lambda `(String s) -> s.toUpperCase()`?',
    opts: ['String::new', 'String::toUpperCase', 'this::toUpperCase', 'String.toUpperCase()'], ans: 'B',
    exp: '`String::toUpperCase` là method reference tới **instance method của một đối tượng tùy ý** thuộc kiểu String: tham số đầu tiên của lambda trở thành receiver. `String::new` là constructor reference; `this::toUpperCase` gọi method trên đối tượng hiện tại; `String.toUpperCase()` không phải cú pháp method reference hợp lệ.',
    tags: ['method-reference', 'lambda'], sec: 30, ver: 'Java 8+',
  },
  {
    id: 'JC-051', topic: 'Functional Interfaces', d: 'b', cat: 'theory',
    q: 'Functional interface có sẵn nào phù hợp nhất cho hàm nhận một `Order` và trả về `boolean` (ví dụ kiểm tra đơn hàng hợp lệ)?',
    opts: ['Function<Order, Void>', 'Supplier<Order>', 'Predicate<Order>', 'Consumer<Order>'], ans: 'C',
    exp: '`Predicate<T>`: T → boolean (có and/or/negate để kết hợp). `Function<T,R>`: T → R. `Consumer<T>`: T → void. `Supplier<T>`: () → T. Ngoài ra có biến thể primitive như `IntPredicate` để tránh boxing.',
    tags: ['functional-interface', 'predicate'], sec: 25, ver: 'Java 8+',
  },
  {
    id: 'JC-052', topic: 'Stream API', d: 'a', cat: 'perf',
    q: 'Một API dùng `orders.parallelStream().map(o -> restClient.fetchPrice(o)).toList()` để gọi service giá cho 500 đơn hàng, trong Spring Boot app đang phục vụ nhiều request. Vấn đề lớn nhất?',
    opts: [
      'parallelStream không giữ thứ tự kết quả',
      'parallelStream dùng chung ForkJoinPool.commonPool (số thread ≈ số CPU - 1); tác vụ blocking I/O sẽ chiếm hết pool, làm chậm mọi parallel stream/CompletableFuture mặc định khác trong JVM',
      'parallelStream không chạy được trong Spring',
      'toList() không thread-safe',
    ], ans: 'B',
    exp: 'Parallel stream phù hợp với tác vụ **CPU-bound** trên dữ liệu lớn. Với I/O blocking, các thread của common pool bị chặn chờ mạng; vì pool dùng chung cho toàn JVM, các phần khác cũng bị ảnh hưởng. Nên dùng ExecutorService riêng có kích thước phù hợp (hoặc virtual threads ở Java 21), kèm timeout và giới hạn đồng thời để không làm quá tải service giá. `toList()`/collect vẫn giữ đúng thứ tự encounter order.',
    tags: ['parallel-stream', 'forkjoinpool', 'blocking-io'], sec: 60, ver: 'Java 16+ (toList)',
  },
  {
    id: 'JC-053', topic: 'Object Class', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
class Order implements Cloneable {
    List<String> items = new ArrayList<>();

    @Override
    public Order clone() throws CloneNotSupportedException {
        return (Order) super.clone();
    }
}

Order a = new Order();
a.items.add("x");
Order b = a.clone();
b.items.add("y");
System.out.println(a.items.size() + " " + (a.items == b.items));`,
    opts: ['1 false', '2 true', '2 false', 'Ném CloneNotSupportedException'], ans: 'B',
    exp: '`Object.clone()` tạo **shallow copy**: field tham chiếu được sao chép tham chiếu, nên `a.items` và `b.items` cùng trỏ tới một ArrayList. Thêm "y" qua b làm a cũng thấy 2 phần tử. Muốn deep copy phải tự sao chép (`copy.items = new ArrayList<>(items)`). Vì contract của Cloneable rắc rối, Effective Java khuyên dùng copy constructor hoặc static factory thay cho clone().',
    tags: ['clone', 'shallow-copy', 'object'], sec: 55,
  },
  {
    id: 'JC-054', topic: 'Reflection', d: 'i', cat: 'theory',
    q: 'Khác biệt giữa `Class.getMethods()` và `Class.getDeclaredMethods()`?',
    opts: [
      'Hoàn toàn giống nhau',
      '`getMethods()` trả về các method **public** của class, kể cả method kế thừa từ lớp cha/interface; `getDeclaredMethods()` trả về mọi method **khai báo trong chính class** (mọi access modifier) nhưng không gồm method kế thừa',
      '`getDeclaredMethods()` chỉ trả về method private',
      '`getMethods()` chỉ trả về method static',
    ], ans: 'B',
    exp: 'Quy tắc tương tự cho getFields/getDeclaredFields, getConstructors/getDeclaredConstructors. Truy cập thành viên private qua reflection cần `setAccessible(true)` và có thể bị chặn bởi module system (Java 9+). Framework như Spring, Jackson, Hibernate dựa nhiều vào reflection — một lý do khiến khởi động chậm và cần cấu hình đặc biệt cho GraalVM native image.',
    tags: ['reflection'], sec: 40,
  },
  {
    id: 'JC-055', topic: 'I/O và NIO', d: 'a', cat: 'debug',
    q: 'Job đọc file CSV tiếng Việt (UTF-8) bằng `new BufferedReader(new FileReader(path))`. Chạy đúng trên Linux nhưng trên một server Windows chạy Java 17 thì chữ có dấu bị lỗi font. Nguyên nhân và cách sửa?',
    opts: [
      'BufferedReader không hỗ trợ Unicode',
      '`FileReader` (không chỉ định charset) dùng charset mặc định của nền tảng — trên Windows với Java ≤ 17 thường là windows-1252/Cp1258, không phải UTF-8. Chỉ định rõ: `Files.newBufferedReader(path, StandardCharsets.UTF_8)` hoặc `new FileReader(path, UTF_8)` (Java 11+). Từ Java 18 (JEP 400), mặc định là UTF-8',
      'Do file CSV phải có BOM',
      'Do Windows không hỗ trợ UTF-8',
    ], ans: 'B',
    exp: 'Mọi API chuyển đổi byte ↔ ký tự (FileReader/Writer, String.getBytes(), new String(bytes), InputStreamReader) nên chỉ định charset tường minh để không phụ thuộc môi trường. Lỗi kiểu này thường chỉ lộ ra khi deploy lên máy có locale khác.',
    tags: ['charset', 'utf-8', 'nio', 'jep400'], sec: 55, ver: 'Java ≤ 17 (Java 18+ mặc định UTF-8)',
  },
  {
    id: 'JC-056', topic: 'Control Flow', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (j == 1) continue outer;
        if (i == 2) break outer;
        System.out.print(i + "" + j + " ");
    }
}`,
    opts: ['00 10 ', '00 01 10 11 ', '00 10 20 ', '00 '], ans: 'A',
    exp: 'Từng bước:\n• i=0, j=0: in "00"; j=1 → `continue outer` sang i=1.\n• i=1, j=0: in "10"; j=1 → sang i=2.\n• i=2, j=0: điều kiện `j == 1` sai, `i == 2` đúng → `break outer` thoát cả hai vòng.\n`continue label` chuyển sang lần lặp tiếp theo của vòng có nhãn; `break label` thoát hẳn vòng có nhãn.',
    tags: ['labeled-break', 'continue', 'loop'], sec: 60,
  },
]);
