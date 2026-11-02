/* Bài học — Module 4: JVM và Memory Management */
(() => {
  const L = (topic, blocks) => LS.add('jvm', topic, blocks);

  L('JVM, JRE và JDK', [
    '- **JVM**: máy ảo thực thi bytecode, quản lý bộ nhớ (GC), JIT, thread. HotSpot là cài đặt phổ biến nhất (OpenJDK, Temurin, Corretto...).',
    '- **JRE**: JVM + thư viện chuẩn để chạy ứng dụng.',
    '- **JDK**: JRE + công cụ phát triển/chẩn đoán: `javac`, `jar`, `jlink`, `jcmd`, `jstack`, `jmap`, `jfr`.',
    '- Từ Java 11 không còn bản JRE riêng chính thức; dùng `jlink` tạo runtime tối giản cho container.',
    '? "Write once, run anywhere": bytecode độc lập nền tảng, JVM phụ thuộc nền tảng.',
  ]);

  L('Class Loading', [
    'Ba giai đoạn: **Loading** (đọc bytecode, tạo `Class`) → **Linking** (Verification, Preparation: cấp phát static field với giá trị mặc định, Resolution) → **Initialization** (chạy `<clinit>`: gán giá trị static và static block).',
    '- Initialization diễn ra lazy khi class được dùng chủ động lần đầu: `new`, gọi static method, đọc/ghi static field (trừ hằng compile-time), reflection, khởi tạo lớp con.',
    '- Truy cập `static final int X = 10` không kích hoạt khởi tạo class (giá trị đã được inline lúc compile).',
    '- Exception trong static initializer → `ExceptionInInitializerError` lần đầu, `NoClassDefFoundError` các lần sau.',
    '! Đổi giá trị hằng `public static final` trong thư viện mà không build lại code phụ thuộc → code cũ vẫn dùng giá trị cũ.',
  ]);

  L('Class Loader', [
    'Phân cấp (Java 9+): **Bootstrap** (java.base…) → **Platform** → **Application** (classpath). Mô hình **parent delegation**: hỏi cha trước, cha không tìm thấy mới tự nạp — đảm bảo class lõi không bị thay thế.',
    '- Một class được định danh bởi (tên đầy đủ + ClassLoader): cùng tên khác loader là hai kiểu khác nhau → `ClassCastException: X cannot be cast to X` (hay gặp với DevTools restart, app server).',
    '- Lỗi runtime do xung đột phiên bản thư viện: `NoSuchMethodError`, `NoClassDefFoundError`, `AbstractMethodError` → kiểm tra `mvn dependency:tree`, thống nhất version bằng BOM.',
    '- `ClassNotFoundException`: nạp động (`Class.forName`) không tìm thấy; `NoClassDefFoundError`: class có lúc compile nhưng thiếu/lỗi lúc runtime.',
  ]);

  L('Heap và Stack', [
    { table: [['', 'Stack', 'Heap'], ['Phạm vi', 'Riêng mỗi thread', 'Dùng chung mọi thread'], ['Chứa', 'Frame của method: biến local, tham số, tham chiếu', 'Object, mảng, String Pool (Java 7+)'], ['Quản lý', 'Tự giải phóng khi method kết thúc', 'Garbage Collector'], ['Lỗi', 'StackOverflowError', 'OutOfMemoryError: Java heap space'], ['Cấu hình', '`-Xss`', '`-Xms`, `-Xmx`, `-XX:MaxRAMPercentage`']] },
    '- Bộ nhớ tiến trình JVM còn gồm: Metaspace, code cache, thread stack, direct buffer, GC structures — không thuộc heap.',
    '- JIT có thể tránh cấp phát object trên heap nhờ escape analysis (scalar replacement).',
  ]);

  L('Metaspace', [
    'Từ Java 8, **Metaspace** (bộ nhớ native) thay PermGen để lưu metadata của class (cấu trúc class, method, constant pool runtime).',
    '- Mặc định không giới hạn (tăng tới hết RAM) → nên đặt `-XX:MaxMetaspaceSize` để lỗi lộ sớm.',
    '- `OutOfMemoryError: Metaspace` thường do **classloader leak** (redeploy nóng trên app server mà ThreadLocal/thread/driver giữ class cũ) hoặc sinh class động không giới hạn (proxy, script engine).',
    '- Metadata chỉ được thu hồi khi ClassLoader định nghĩa nó không còn reachable.',
  ]);

  L('Garbage Collection', [
    'GC tìm object không còn **reachable** từ GC roots (biến local trên stack, static field, JNI ref…) và thu hồi bộ nhớ. Tham chiếu vòng tròn không reachable vẫn được dọn.',
    '## Generational',
    '- Young gen (Eden + 2 Survivor): minor GC thường xuyên, nhanh; object sống sót nhiều lần được promote sang Old gen.',
    '- Old gen: dọn ít hơn (major/mixed/full GC).',
    { table: [['GC', 'Đặc điểm', 'Dùng khi'], ['Serial', 'Một luồng', 'Container rất nhỏ'], ['Parallel', 'Tối ưu throughput', 'Batch job'], ['G1 (mặc định từ 9)', 'Chia region, mục tiêu pause (200ms mặc định)', 'Đa số ứng dụng server'], ['ZGC / Shenandoah', 'Pause dưới mili giây, hầu hết đồng thời', 'Heap lớn, yêu cầu latency thấp']] },
    '- Stop-the-world pause làm tăng latency; Full GC liên tục + old gen sau GC vẫn cao → leak hoặc heap quá nhỏ.',
    '- Bật GC log: `-Xlog:gc*:file=gc.log`. Không gọi `System.gc()` trong code.',
  ]);

  L('Strong, Weak, Soft và Phantom References', [
    { table: [['Loại', 'Khi nào bị GC thu hồi', 'Dùng cho'], ['Strong', 'Không bao giờ khi còn reachable', 'Tham chiếu thông thường'], ['Soft', 'Khi thiếu bộ nhớ (trước khi ném OOM)', 'Cache nhạy bộ nhớ (ít dùng nay)'], ['Weak', 'Ở lần GC kế tiếp nếu chỉ còn tham chiếu yếu', '`WeakHashMap`, canonical map, listener'], ['Phantom', 'Sau khi object đã được finalize; `get()` luôn null', 'Dọn tài nguyên (`Cleaner`)']] },
    '- `WeakHashMap` giữ key yếu, value mạnh; key là String literal không bao giờ bị thu hồi.',
    '- `ThreadLocalMap` giữ key ThreadLocal bằng weak reference nhưng value mạnh → vẫn rò rỉ nếu không `remove()`.',
    '! Không dùng SoftReference làm cache chính — khó kiểm soát; dùng cache có giới hạn kích thước/TTL (Caffeine).',
  ]);

  L('Memory Leak', [
    'Trong Java, memory leak là object **không còn cần nhưng vẫn reachable** nên GC không thu hồi.',
    '## Nguồn phổ biến',
    '- Collection static/singleton tăng mãi (cache không eviction, map theo input người dùng).',
    '- `ThreadLocal` không `remove()` trong thread pool (còn gây rò rỉ dữ liệu giữa request).',
    '- Listener/callback đăng ký mà không hủy; inner class không static giữ tham chiếu outer.',
    '- Resource không đóng (stream, connection), classloader leak.',
    '## Cách điều tra',
    '- Theo dõi **heap sau mỗi GC** tăng dần theo thời gian.',
    '- `jcmd <pid> GC.class_histogram`, heap dump (`-XX:+HeapDumpOnOutOfMemoryError`), phân tích bằng Eclipse MAT: Dominator Tree, Leak Suspects, đường dẫn tới GC root.',
    { lang: 'java', code: `
try {
    CTX.set(user);
    chain.doFilter(req, res);
} finally {
    CTX.remove();   // bắt buộc trong thread pool
}` },
  ]);

  L('StackOverflowError', [
    'Xảy ra khi stack của thread hết chỗ, thường do **đệ quy quá sâu hoặc vô hạn**.',
    '- Nguyên nhân thường gặp: đệ quy không có điều kiện dừng, dữ liệu có chu trình (cây cha–con lỗi), `toString/equals/hashCode` gọi vòng qua quan hệ hai chiều (Lombok `@Data` trên entity), Jackson serialize quan hệ hai chiều.',
    '- Khắc phục: chuyển sang vòng lặp với `Deque` tự quản lý, kiểm tra visited, giới hạn độ sâu; `-Xss` chỉ là giải pháp tạm.',
    '- Là `Error`, không nên catch để tiếp tục xử lý.',
  ]);

  L('OutOfMemoryError', [
    { table: [['Thông điệp', 'Ý nghĩa', 'Hướng xử lý'], ['Java heap space', 'Heap không đủ cho object sống', 'Heap dump, tìm leak hoặc request tải quá nhiều dữ liệu'], ['GC overhead limit exceeded', 'GC chiếm >98% thời gian mà thu hồi rất ít', 'Như trên'], ['Metaspace', 'Metadata class', 'Classloader leak, sinh class động'], ['unable to create native thread', 'Hết thread/bộ nhớ native/giới hạn OS', 'Thread dump, giới hạn thread pool'], ['Direct buffer memory', 'Bộ nhớ off-heap NIO/Netty', '`-XX:MaxDirectMemorySize`, kiểm tra giải phóng buffer']] },
    '- Luôn bật `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=...` ở production.',
    '- Phân biệt leak (tăng dần) và spike (một request đọc cả bảng vào List).',
    '! Trong container, bị kill `OOMKilled` (exit 137) **không** phải OutOfMemoryError của JVM — mà do tổng bộ nhớ tiến trình vượt giới hạn cgroup.',
  ]);

  L('JVM Tuning cơ bản', [
    '- Heap: `-Xms`/`-Xmx`; trong container ưu tiên `-XX:MaxRAMPercentage=70` (chừa chỗ cho non-heap).',
    '- `-Xms = -Xmx` giúp tránh resize heap, hành vi ổn định hơn.',
    '- Chọn GC phù hợp: G1 mặc định; ZGC (`-XX:+UseZGC`) cho latency thấp với heap lớn.',
    '- Quan sát trước khi chỉnh: GC log, metrics (Micrometer `jvm.gc.pause`, `jvm.memory.used`), JFR.',
    { lang: 'bash', code: `
java -XX:MaxRAMPercentage=70 -XX:+UseG1GC \\
     -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps \\
     -Xlog:gc*:file=/logs/gc.log:time,uptime -jar app.jar` },
    '! Đừng sao chép hàng loạt cờ JVM từ Internet; nhiều cờ đã lỗi thời. Tuning dựa trên số đo thực tế.',
  ]);

  L('JIT Compiler', [
    'HotSpot ban đầu **thông dịch** bytecode, đếm số lần gọi/vòng lặp; method "nóng" được biên dịch sang mã máy bởi **C1** (nhanh, có profiling) rồi **C2** (tối ưu mạnh) — tiered compilation.',
    '- Tối ưu điển hình: inlining, escape analysis (scalar replacement, lock elision), loop unrolling, loại bỏ kiểm tra thừa.',
    '- Deoptimization: khi giả định của JIT sai (ví dụ class mới được nạp), quay lại thông dịch.',
    '- Hệ quả: **warm-up** — request đầu sau deploy chậm. Giảm bằng warm-up request, AppCDS, CRaC, GraalVM native image.',
    '- Benchmark bằng JMH, không đo thủ công bằng `System.nanoTime` trong vòng lặp.',
  ]);

  L('Java Memory Model', [
    'JMM định nghĩa khi nào một lần ghi của thread này **chắc chắn được nhìn thấy** bởi thread khác, thông qua quan hệ **happens-before**. Không có happens-before, compiler/CPU được phép reorder và cache giá trị.',
    '## Quy tắc happens-before chính',
    '- Trong cùng thread: theo thứ tự chương trình.',
    '- Unlock monitor → lock **cùng** monitor sau đó.',
    '- Ghi volatile → đọc volatile cùng biến sau đó.',
    '- `Thread.start()` → mọi hành động trong thread đó; mọi hành động của thread → `join()` trả về.',
    '- Ghi field `final` trong constructor → thread khác đọc qua tham chiếu được publish (nếu `this` không thoát trong constructor).',
    '- Submit task vào Executor → task chạy; task xong → `Future.get()` trả về.',
    '! Vòng `while (!stopped)` với biến không volatile có thể không bao giờ dừng vì JIT hoist việc đọc ra ngoài vòng lặp.',
  ]);
})();
