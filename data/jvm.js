/* Module 4: JVM và Memory Management */
QB.module({
  id: 'jvm', order: 4, title: 'JVM và Memory Management',
  description: 'JVM/JDK, Class Loading, Heap/Stack, Metaspace, Garbage Collection, References, Memory Leak, OOM, JIT và Java Memory Model.',
  topics: ['JVM, JRE và JDK', 'Class Loading', 'Class Loader', 'Heap và Stack', 'Metaspace', 'Garbage Collection',
    'Strong, Weak, Soft và Phantom References', 'Memory Leak', 'StackOverflowError', 'OutOfMemoryError', 'JVM Tuning cơ bản',
    'JIT Compiler', 'Java Memory Model'],
}, [
  {
    id: 'JVM-001', topic: 'JVM, JRE và JDK', d: 'b', cat: 'theory',
    q: 'Phát biểu nào đúng về JDK, JRE và JVM?',
    opts: [
      'JVM bao gồm JDK và JRE',
      'JDK = JRE + công cụ phát triển (javac, jar, jcmd, jstack…); JRE = JVM + thư viện chuẩn để chạy ứng dụng',
      'JRE chứa javac để biên dịch code',
      'JVM chỉ có thể chạy code viết bằng Java',
    ], ans: 'B',
    exp: 'JVM thực thi bytecode; JRE cung cấp JVM + class library; JDK thêm bộ công cụ phát triển và chẩn đoán. Từ Java 11, Oracle không phát hành JRE riêng — có thể dùng `jlink` tạo runtime tối giản. JVM chạy được bytecode từ nhiều ngôn ngữ (Kotlin, Scala, Groovy).',
    tags: ['jdk', 'jre', 'jvm'], sec: 25,
  },
  {
    id: 'JVM-002', topic: 'Heap và Stack', d: 'b', cat: 'theory',
    q: 'Trong method `void process() { int count = 5; Order o = new Order(); }`, dữ liệu được lưu ở đâu (mô hình khái niệm của JVM)?',
    opts: [
      'count và object Order đều trên Stack',
      'count và biến tham chiếu o nằm trong stack frame của thread; object Order nằm trên Heap',
      'Mọi thứ nằm trên Heap',
      'count trên Heap, o trên Metaspace',
    ], ans: 'B',
    exp: 'Mỗi thread có stack riêng gồm các frame chứa biến cục bộ (primitive và tham chiếu). Object được cấp phát trên Heap dùng chung giữa các thread và do GC quản lý. (JIT có thể tối ưu bằng escape analysis/scalar replacement để không cấp phát object không thoát khỏi method, nhưng đó là tối ưu, không thay đổi mô hình ngữ nghĩa.)',
    tags: ['heap', 'stack'], sec: 30,
  },
  {
    id: 'JVM-003', topic: 'StackOverflowError', d: 'i', cat: 'scenario',
    q: 'Service duyệt cây danh mục sản phẩm bằng đệ quy. Một khách hàng import dữ liệu lỗi tạo chuỗi cha-con sâu 200.000 cấp (hoặc vòng lặp cha-con). Lỗi nào xảy ra và cách khắc phục bền vững?',
    opts: [
      'OutOfMemoryError: Java heap space; tăng -Xmx',
      'StackOverflowError do quá nhiều stack frame; nên chuyển sang duyệt lặp với Deque tự quản lý, phát hiện chu trình (visited set) và giới hạn độ sâu hợp lệ',
      'ConcurrentModificationException; dùng CopyOnWriteArrayList',
      'StackOverflowError; chỉ cần tăng -Xss lên 1GB',
    ], ans: 'B',
    exp: 'Mỗi lời gọi đệ quy thêm một frame vào stack của thread (kích thước giới hạn bởi -Xss, thường 512KB–1MB). Độ sâu lớn hoặc chu trình gây StackOverflowError. Tăng -Xss chỉ là chữa cháy (áp dụng cho mọi thread, tốn bộ nhớ) và không giải quyết chu trình. Duyệt lặp bằng stack tự quản lý nằm trên heap, kết hợp kiểm tra visited và validate dữ liệu đầu vào.',
    tags: ['stackoverflowerror', 'recursion'], sec: 50,
  },
  {
    id: 'JVM-004', topic: 'Metaspace', d: 'i', cat: 'debug',
    q: 'Một ứng dụng chạy trên Tomcat được redeploy nóng (hot redeploy) nhiều lần mà không restart JVM. Sau vài lần, xuất hiện `java.lang.OutOfMemoryError: Metaspace`. Nguyên nhân khả dĩ nhất?',
    opts: [
      'Có quá nhiều object String trong heap',
      'ClassLoader của phiên bản cũ không được giải phóng (bị giữ bởi ThreadLocal, thread chưa dừng, driver JDBC đăng ký static…) nên metadata của các class cũ tích tụ trong Metaspace',
      'Stack của thread quá nhỏ',
      'Do G1 GC không hỗ trợ Metaspace',
    ], ans: 'B',
    exp: 'Từ Java 8, PermGen được thay bằng Metaspace (native memory) lưu metadata class. Metadata chỉ được thu hồi khi **ClassLoader** định nghĩa class đó không còn reachable. Chỉ cần một tham chiếu từ bên ngoài (thread nền, ThreadLocal, DriverManager) là toàn bộ class của webapp cũ bị giữ → classloader leak. Nguồn khác: tạo class động không giới hạn (proxy, Groovy script). Giới hạn bằng `-XX:MaxMetaspaceSize` để lỗi lộ sớm thay vì ăn hết RAM.',
    tags: ['metaspace', 'classloader-leak', 'oom'], sec: 60, ver: 'Java 8+',
  },
  {
    id: 'JVM-005', topic: 'Class Loader', d: 'i', cat: 'theory',
    q: 'Mô hình **parent delegation** của ClassLoader hoạt động thế nào?',
    opts: [
      'Mỗi ClassLoader tự nạp class trước, chỉ hỏi cha khi thất bại',
      'ClassLoader ủy quyền cho cha nạp trước (Application → Platform → Bootstrap); chỉ khi cha không tìm thấy mới tự nạp. Nhờ đó class lõi như java.lang.String không bị thay thế',
      'Tất cả class được nạp bởi Bootstrap ClassLoader',
      'ClassLoader nạp ngẫu nhiên tùy thứ tự trong classpath',
    ], ans: 'B',
    exp: 'Hệ thống phân cấp (Java 9+): Bootstrap (java.base…) → Platform (trước đây là Extension) → Application/System (classpath). Delegation đảm bảo tính nhất quán và an toàn. Một class được định danh bởi (tên đầy đủ + ClassLoader) — cùng tên nhưng khác loader là hai kiểu khác nhau, nguồn gốc của lỗi `ClassCastException: X cannot be cast to X` trong một số app server/DevTools.',
    tags: ['classloader', 'delegation'], sec: 45,
  },
  {
    id: 'JVM-006', topic: 'Class Loading', d: 'a', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
class Config {
    static final int MAX = 10;
    static { System.out.println("init Config"); }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(Config.MAX);
    }
}`,
    opts: ['init Config rồi 10', '10', 'init Config', '0'], ans: 'B',
    exp: '`static final int MAX = 10` là **compile-time constant**: compiler chèn trực tiếp giá trị 10 vào bytecode của Main, nên truy cập nó không kích hoạt khởi tạo class Config và static block không chạy. Nếu MAX là `static final Integer` hoặc được gán bằng lời gọi method, Config sẽ được khởi tạo (in "init Config" trước). Hệ quả thực tế: đổi giá trị hằng trong thư viện mà không biên dịch lại code phụ thuộc thì code cũ vẫn dùng giá trị cũ.',
    tags: ['class-initialization', 'constant-inlining'], sec: 60,
  },
  {
    id: 'JVM-007', topic: 'Class Loader', d: 'a', cat: 'debug',
    q: 'Sau khi thêm một thư viện mới, ứng dụng biên dịch thành công nhưng runtime ném `java.lang.NoSuchMethodError: com.fasterxml.jackson.databind.ObjectMapper.xyz(...)`. Nguyên nhân khả dĩ nhất và bước kiểm tra phù hợp?',
    opts: [
      'Code có lỗi cú pháp; build lại',
      'Xung đột phiên bản dependency: classpath runtime có phiên bản Jackson khác phiên bản lúc compile (do transitive dependency). Kiểm tra `mvn dependency:tree` / `gradle dependencies` và ép phiên bản thống nhất (dependencyManagement/BOM)',
      'Thiếu bộ nhớ heap',
      'Do JIT tối ưu hóa xóa method',
    ], ans: 'B',
    exp: 'NoSuchMethodError/NoClassDefFoundError/AbstractMethodError lúc runtime thường là dấu hiệu "dependency hell": biên dịch với một version nhưng runtime nạp version khác (Maven chọn version "nearest wins"). Dùng dependency tree để xem ai kéo version nào, sau đó quản lý version tập trung (Spring Boot BOM, dependencyManagement) hoặc exclusions.',
    tags: ['nosuchmethoderror', 'dependency-conflict', 'maven'], sec: 60,
  },
  {
    id: 'JVM-008', topic: 'Garbage Collection', d: 'i', cat: 'theory',
    q: 'Giả thuyết thế hệ (generational hypothesis) mà nhiều GC của HotSpot dựa vào là gì?',
    opts: [
      'Hầu hết object sống rất lâu nên nên dọn Old Generation thường xuyên',
      'Hầu hết object chết trẻ; nên chia Young Gen (Eden + Survivor) dọn thường xuyên với chi phí thấp, object sống sót qua nhiều lần minor GC được promote sang Old Gen',
      'Object lớn luôn được cấp phát trên stack',
      'GC chỉ chạy khi gọi System.gc()',
    ], ans: 'B',
    exp: 'Phần lớn object (DTO của request, String tạm…) chỉ sống trong thời gian ngắn. Minor GC chỉ quét vùng young (copy object còn sống), nhanh vì số object sống ít. Object "già" được promote sang Old Gen, dọn ít thường xuyên hơn bằng major/mixed GC. Gọi `System.gc()` chỉ là gợi ý và thường nên tránh.',
    tags: ['gc', 'generational'], sec: 40,
  },
  {
    id: 'JVM-009', topic: 'Garbage Collection', d: 'i', cat: 'theory',
    q: 'Trên server nhiều CPU và nhiều RAM, GC mặc định của HotSpot từ Java 9 (bao gồm Java 17, 21) là gì, và GC nào hướng tới pause rất thấp (dưới mili giây) cho heap lớn?',
    opts: [
      'Mặc định Parallel GC; low-latency là Serial GC',
      'Mặc định G1 GC; low-latency là ZGC (production từ Java 15, Generational ZGC từ Java 21)',
      'Mặc định CMS; low-latency là G1',
      'Mặc định ZGC; low-latency là Parallel GC',
    ], ans: 'B',
    exp: 'G1 trở thành mặc định từ Java 9, cân bằng throughput và pause (mục tiêu `-XX:MaxGCPauseMillis`, mặc định 200ms). CMS bị deprecated ở Java 9 và xóa ở Java 14. ZGC (và Shenandoah) thực hiện hầu hết công việc đồng thời với ứng dụng, pause rất ngắn và gần như không phụ thuộc kích thước heap. Parallel GC tối ưu throughput cho batch job. Lưu ý: với container ít CPU/RAM, JVM có thể chọn Serial GC.',
    tags: ['g1', 'zgc', 'gc'], sec: 45, ver: 'Java 9+',
  },
  {
    id: 'JVM-010', topic: 'Garbage Collection', d: 'b', cat: 'theory',
    q: 'Hai object A và B tham chiếu lẫn nhau (A.b = B, B.a = A), nhưng không còn biến nào từ ứng dụng trỏ tới A hoặc B. Chúng có được GC thu hồi không?',
    opts: [
      'Không, vì reference count của mỗi object vẫn bằng 1',
      'Có, vì GC của JVM dựa trên khả năng tiếp cận (reachability) từ GC roots, chu trình không reachable vẫn bị thu hồi',
      'Chỉ khi gọi System.gc()',
      'Chỉ khi một trong hai override finalize()',
    ], ans: 'B',
    exp: 'HotSpot GC dùng thuật toán tracing: bắt đầu từ GC roots (biến cục bộ trên stack của thread đang chạy, static field của class đã nạp, JNI references…), đánh dấu mọi object reachable. Object không reachable là rác, kể cả khi tham chiếu vòng tròn. Reference counting (không xử lý được chu trình) không được dùng.',
    tags: ['gc-roots', 'reachability'], sec: 35,
  },
  {
    id: 'JVM-011', topic: 'Strong, Weak, Soft và Phantom References', d: 'a', cat: 'theory', type: 'multiple',
    q: 'Chọn **2** phát biểu đúng về các loại reference.',
    opts: [
      'SoftReference được GC giữ lại càng lâu càng tốt, chỉ bị dọn khi thiếu bộ nhớ (đảm bảo được dọn trước khi ném OutOfMemoryError)',
      'WeakReference giữ object sống cho tới khi JVM tắt',
      'Entry trong WeakHashMap có thể tự biến mất khi key không còn tham chiếu mạnh nào khác',
      'PhantomReference.get() trả về object để có thể "hồi sinh" nó',
    ], ans: ['A', 'C'],
    exp: 'Strong: không bao giờ bị dọn khi còn reachable. Soft: dọn khi áp lực bộ nhớ — từng dùng cho cache nhưng khó kiểm soát, nên ưu tiên cache có giới hạn kích thước. Weak: bị dọn ở lần GC kế tiếp khi chỉ còn tham chiếu yếu (WeakHashMap, canonicalizing map). Phantom: `get()` luôn trả về null, chỉ dùng để nhận thông báo sau khi object bị thu hồi và dọn tài nguyên (nền tảng của `java.lang.ref.Cleaner`).',
    tags: ['references', 'weakhashmap', 'softreference'], sec: 60,
  },
  {
    id: 'JVM-012', topic: 'Memory Leak', d: 'a', cat: 'bug',
    q: 'Filter lưu thông tin user vào ThreadLocal để dùng ở các tầng dưới. Sau một thời gian, heap tăng dần và đôi khi request của user này thấy dữ liệu của user khác. Vấn đề là gì?',
    code: `
public class UserContextFilter implements Filter {
    static final ThreadLocal<UserContext> CTX = new ThreadLocal<>();

    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        CTX.set(loadUser(req));
        chain.doFilter(req, res);
    }
}`,
    opts: [
      'ThreadLocal không thread-safe',
      'Không gọi `CTX.remove()` trong finally. Thread của Tomcat được tái sử dụng (thread pool) nên giá trị cũ còn tồn tại: rò rỉ bộ nhớ và rò rỉ dữ liệu sang request sau',
      'Phải khai báo ThreadLocal là non-static',
      'Filter phải là @Component mới hoạt động',
    ], ans: 'B',
    exp: 'Giá trị ThreadLocal gắn với thread, không gắn với request. Trong thread pool, thread sống rất lâu nên object không được giải phóng; nếu request sau không set lại (ví dụ đường đi bị lỗi trước khi set), nó đọc dữ liệu của user trước — lỗi bảo mật nghiêm trọng. Luôn dùng `try { CTX.set(...); chain.doFilter(...); } finally { CTX.remove(); }`. Lưu ý tương tự với MDC của logging.',
    tags: ['threadlocal', 'memory-leak', 'thread-pool'], sec: 60,
  },
  {
    id: 'JVM-013', topic: 'OutOfMemoryError', d: 'i', cat: 'debug',
    q: 'Log production báo `java.lang.OutOfMemoryError: unable to create native thread` trong khi heap chỉ dùng 40%. Hướng điều tra đúng?',
    opts: [
      'Tăng -Xmx gấp đôi',
      'Lỗi không liên quan heap: tiến trình đã tạo quá nhiều thread (hoặc chạm giới hạn OS/container như ulimit -u, pids.max, bộ nhớ native cho stack). Lấy thread dump để xem thread nào tăng không kiểm soát (ví dụ tạo `new Thread`/Executor mới cho mỗi request)',
      'Chuyển sang ZGC',
      'Tăng -XX:MaxMetaspaceSize',
    ], ans: 'B',
    exp: 'Mỗi platform thread cần stack native ngoài heap và chịu giới hạn số process/thread của OS. Nguyên nhân phổ biến: tạo ExecutorService trong mỗi request mà không shutdown, thread pool không giới hạn (`newCachedThreadPool` khi tải cao). Dùng `jstack`/`jcmd <pid> Thread.print` đếm thread theo tên pool. Tăng heap còn làm giảm bộ nhớ dành cho native, khiến lỗi nặng hơn.',
    tags: ['oom', 'native-thread', 'thread-dump'], sec: 55,
  },
  {
    id: 'JVM-014', topic: 'OutOfMemoryError', d: 'a', cat: 'scenario',
    q: 'Service gặp `OutOfMemoryError: Java heap space` ngẫu nhiên vài ngày một lần, restart thì hết. Bước điều tra nào hiệu quả và đúng thứ tự nhất?',
    opts: [
      'Tăng -Xmx và chờ xem còn xảy ra không',
      'Bật -XX:+HeapDumpOnOutOfMemoryError (và -XX:HeapDumpPath), theo dõi heap/GC qua metrics; khi có dump, phân tích bằng Eclipse MAT (Dominator Tree, Leak Suspects) để tìm object giữ nhiều bộ nhớ và chuỗi tham chiếu tới GC root',
      'Thêm System.gc() định kỳ bằng scheduler',
      'Chuyển toàn bộ sang kiểu primitive',
    ], ans: 'B',
    exp: 'OOM ngẫu nhiên sau vài ngày gợi ý memory leak (heap sau mỗi Full GC tăng dần) hoặc spike dữ liệu (một query tải quá nhiều bản ghi). Heap dump tại thời điểm lỗi là bằng chứng quan trọng nhất; MAT cho biết object nào chiếm retained heap lớn và ai đang giữ nó. Kết hợp GC log (`-Xlog:gc*`) và metrics heap after GC để phân biệt leak và spike. Tăng heap chỉ trì hoãn vấn đề.',
    tags: ['oom', 'heap-dump', 'mat'], sec: 60,
  },
  {
    id: 'JVM-015', topic: 'JVM Tuning cơ bản', d: 's', cat: 'debug',
    q: 'Ứng dụng Spring Boot (Java 17) chạy trong container giới hạn 1GiB, cấu hình `-Xmx1g`. Pod bị Kubernetes kill với lý do `OOMKilled` (exit code 137) dù log không có OutOfMemoryError. Giải thích đúng nhất?',
    opts: [
      'JVM không nhận biết container nên dùng toàn bộ RAM của node',
      'Tổng bộ nhớ tiến trình = heap + metaspace + thread stacks + code cache + direct buffer + GC structures… Với heap đã bằng giới hạn container, phần non-heap đẩy tiến trình vượt 1GiB và kernel kill nó. Nên để heap khoảng 60–75% giới hạn (ví dụ -XX:MaxRAMPercentage=70)',
      'Do GC quá chậm',
      'Do Spring Boot rò rỉ bộ nhớ',
    ], ans: 'B',
    exp: 'OOMKilled là do cgroup/kernel giết process khi vượt memory limit — JVM không kịp ném OutOfMemoryError. JVM hiện đại (Java 10+, 8u191+) nhận biết container, nhưng -Xmx chỉ giới hạn heap. Cần chừa chỗ cho bộ nhớ native; dùng `-XX:MaxRAMPercentage` để heap tự co giãn theo limit, và Native Memory Tracking (`-XX:NativeMemoryTracking=summary`, `jcmd VM.native_memory`) để đo.',
    tags: ['container', 'oomkilled', 'kubernetes', 'tuning'], sec: 75, ver: 'Java 10+',
  },
  {
    id: 'JVM-016', topic: 'JVM Tuning cơ bản', d: 'i', cat: 'tradeoff',
    q: 'Vì sao nhiều hệ thống backend đặt `-Xms` bằng `-Xmx` (ví dụ cả hai là 4g)?',
    opts: [
      'Để GC không bao giờ chạy',
      'Tránh chi phí mở rộng/thu hẹp heap lúc chạy và hành vi khó dự đoán khi tải tăng; đổi lại JVM chiếm toàn bộ bộ nhớ đó ngay từ đầu',
      'Vì JVM yêu cầu bắt buộc',
      'Để tăng kích thước Metaspace',
    ], ans: 'B',
    exp: 'Khi heap ban đầu nhỏ, JVM phải mở rộng dần (kèm các lần GC), gây độ trễ khó lường lúc vừa khởi động hoặc khi tải tăng đột ngột. Đặt Xms = Xmx (thường kèm `-XX:+AlwaysPreTouch`) giúp hành vi ổn định — đánh đổi là bộ nhớ không trả lại cho OS. Trong container, MaxRAMPercentage/InitialRAMPercentage là lựa chọn tương đương.',
    tags: ['xms', 'xmx', 'tuning'], sec: 40,
  },
  {
    id: 'JVM-017', topic: 'JIT Compiler', d: 'i', cat: 'scenario',
    q: 'Sau mỗi lần deploy, vài trăm request đầu tiên có latency cao gấp 5–10 lần, sau đó ổn định. Không có lỗi trong log. Nguyên nhân chính thường gặp?',
    opts: [
      'Do database bị khóa',
      'JVM warm-up: code ban đầu chạy interpreter, JIT (tiered C1 → C2) chỉ biên dịch các method "nóng" sau khi đủ số lần gọi; cộng thêm lazy init (class loading, connection pool, cache rỗng)',
      'Do GC Full xảy ra liên tục',
      'Do JIT bị tắt mặc định trong production',
    ], ans: 'B',
    exp: 'HotSpot dùng tiered compilation: thông dịch → C1 (biên dịch nhanh, có profiling) → C2 (tối ưu mạnh) dựa trên số lần gọi và vòng lặp. Thêm vào đó là class loading, khởi tạo Hibernate, pool kết nối. Giảm tác động: warm-up bằng request giả trước khi nhận traffic (readiness probe), khởi tạo pool sẵn (`minimumIdle`), Class Data Sharing (AppCDS), hoặc CRaC/GraalVM native image.',
    tags: ['jit', 'warm-up', 'tiered-compilation'], sec: 45,
  },
  {
    id: 'JVM-018', topic: 'Java Memory Model', d: 'a', cat: 'bug',
    q: 'Thread worker đôi khi **không bao giờ dừng** dù main thread đã gọi `stop()`. Vì sao?',
    code: `
class Worker implements Runnable {
    private boolean running = true;

    public void stop() { running = false; }

    public void run() {
        while (running) {
            // xử lý, không có synchronized hay volatile
        }
    }
}`,
    opts: [
      'Do vòng while thiếu Thread.sleep()',
      'Thiếu `volatile`: không có quan hệ happens-before giữa lần ghi và lần đọc `running`, JIT có thể hoist việc đọc ra ngoài vòng lặp nên thread worker không bao giờ thấy giá trị mới',
      'Do running là private',
      'Do Runnable không thể bị dừng',
    ], ans: 'B',
    exp: 'Java Memory Model chỉ đảm bảo **visibility** giữa các thread khi có happens-before (volatile, synchronized, lock, Thread.start/join…). Không có chúng, JIT được phép tối ưu `while (running)` thành `if (running) while (true)`. Khai báo `private volatile boolean running` để mọi lần đọc thấy lần ghi gần nhất. Với logic phức tạp hơn, dùng `Thread.interrupt()`/`ExecutorService.shutdownNow()`.',
    tags: ['jmm', 'volatile', 'visibility'], sec: 60,
  },
  {
    id: 'JVM-019', topic: 'Java Memory Model', d: 's', cat: 'theory', type: 'multiple',
    q: 'Chọn **2** cặp hành động tạo ra quan hệ **happens-before** theo Java Memory Model.',
    opts: [
      'Ghi một biến volatile → lần đọc sau đó của cùng biến volatile đó ở thread khác',
      'Ghi một biến thường trong thread A → đọc biến đó trong thread B sau 100ms (Thread.sleep)',
      'Mọi hành động trong thread T → lời gọi T.join() trả về thành công ở thread khác',
      'Ghi biến trong khối synchronized(lockA) → đọc biến đó trong khối synchronized(lockB)',
    ], ans: ['A', 'C'],
    exp: 'Các quy tắc happens-before: volatile write → subsequent volatile read của cùng biến; unlock monitor → lock **cùng** monitor sau đó; `Thread.start()` → mọi hành động của thread mới; mọi hành động của thread → join() trả về; ghi field final trong constructor → đọc qua tham chiếu publish sau đó. Sleep không tạo đồng bộ hóa; hai lock khác nhau cũng không.',
    tags: ['jmm', 'happens-before'], sec: 70,
  },
  {
    id: 'JVM-020', topic: 'Garbage Collection', d: 'a', cat: 'debug',
    q: 'Metrics cho thấy p99 latency của API tăng vọt lên 3–4 giây khoảng 20 phút một lần, trùng thời điểm GC log ghi `Pause Full (G1 Compaction Pause)` và heap old gen sau GC vẫn ở mức 90%. Kết luận và hành động hợp lý?',
    opts: [
      'G1 bị lỗi, chuyển ngay sang Serial GC',
      'Old gen gần đầy và ngày càng ít được giải phóng: có thể là memory leak hoặc heap quá nhỏ so với live data set. Cần phân tích heap dump/histogram (jcmd GC.class_histogram) để tìm object chiếm bộ nhớ trước khi quyết định tăng heap hay sửa leak',
      'Tắt GC log để giảm overhead',
      'Thêm System.gc() mỗi 10 phút để dọn trước',
    ], ans: 'B',
    exp: 'Full GC là stop-the-world, xảy ra khi G1 không kịp dọn (to-space exhausted, humongous allocation…). Old gen sau GC vẫn cao chứng tỏ phần lớn object vẫn còn được tham chiếu (live). Cần xác định là leak (live set tăng dần theo thời gian) hay live set thực sự lớn (cần heap lớn hơn/giảm dữ liệu giữ trong bộ nhớ). Gọi System.gc() thường kích hoạt Full GC — làm tệ hơn.',
    tags: ['full-gc', 'latency', 'g1'], sec: 70,
  },
  {
    id: 'JVM-021', topic: 'JIT Compiler', d: 's', cat: 'theory',
    q: 'Escape analysis của JIT C2 cho phép tối ưu nào?',
    opts: [
      'Loại bỏ hoàn toàn GC',
      'Nếu object không thoát khỏi phạm vi method/thread, JIT có thể scalar-replace (không cấp phát object trên heap) và loại bỏ lock không cần thiết (lock elision)',
      'Chuyển mọi object sang Metaspace',
      'Biên dịch code thành native trước khi chạy (AOT)',
    ], ans: 'B',
    exp: 'Khi chứng minh được object chỉ dùng cục bộ, C2 có thể tách object thành các biến trong register/stack (scalar replacement) — giảm áp lực GC — và bỏ synchronized trên object đó. Đây là lý do micro-benchmark viết tay thường sai lệch; nên dùng JMH để đo hiệu năng.',
    tags: ['escape-analysis', 'jit', 'c2'], sec: 50,
  },
  {
    id: 'JVM-022', topic: 'Memory Leak', d: 'i', cat: 'bug',
    q: 'Class sau dùng làm cache tỷ giá theo ngày, sống suốt vòng đời ứng dụng. Rủi ro chính là gì?',
    code: `
@Component
public class RateCache {
    private static final Map<String, BigDecimal> CACHE = new ConcurrentHashMap<>();

    public BigDecimal get(String currency, LocalDate date) {
        return CACHE.computeIfAbsent(currency + ":" + date,
                k -> rateClient.fetch(currency, date));
    }
}`,
    opts: [
      'ConcurrentHashMap không thread-safe',
      'Cache không có giới hạn kích thước hay thời gian hết hạn: số key tăng theo (currency × ngày) và theo mọi input bất thường từ client, map phình to mãi — memory leak "logic"',
      'BigDecimal không dùng được làm value',
      'Static field bị GC thu hồi bất ngờ',
    ], ans: 'B',
    exp: 'Object trong static map luôn reachable nên GC không thể thu hồi. Nếu key phụ thuộc input người dùng (date bất kỳ), kẻ tấn công còn có thể chủ động làm đầy bộ nhớ. Cache cần chính sách eviction: giới hạn số phần tử, TTL (Caffeine `maximumSize`, `expireAfterWrite`), hoặc Spring Cache với provider phù hợp; đồng thời validate input. Ngoài ra, gọi remote trong computeIfAbsent có thể chặn các cập nhật khác của map.',
    tags: ['memory-leak', 'cache', 'static'], sec: 50,
  },
  {
    id: 'JVM-023', topic: 'Heap và Stack', d: 'i', cat: 'theory',
    q: 'Từ Java 7 trở đi, String Pool (các String literal và chuỗi đã intern) được lưu ở đâu?',
    opts: ['PermGen', 'Trong Heap (và được GC dọn khi không còn tham chiếu)', 'Trong stack của thread main', 'Trong Metaspace'], ans: 'B',
    exp: 'Trước Java 7, String Pool nằm trong PermGen có kích thước cố định nên intern() quá nhiều gây `OutOfMemoryError: PermGen space`. Java 7 chuyển pool vào heap; Java 8 thay PermGen bằng Metaspace (chứa metadata class, không chứa String Pool). Kích thước bảng băm của pool chỉnh bằng `-XX:StringTableSize`.',
    tags: ['string-pool', 'heap', 'permgen'], sec: 35, ver: 'Java 7+',
  },
  {
    id: 'JVM-024', topic: 'Class Loading', d: 'a', cat: 'theory',
    q: 'Thứ tự các giai đoạn class loading của JVM và thời điểm biến `static int count = 5;` nhận giá trị 5?',
    opts: [
      'Initialization → Loading → Linking; count = 5 ngay khi Loading',
      'Loading → Linking (Verification → Preparation → Resolution) → Initialization. Ở Preparation, count được cấp phát và gán giá trị mặc định 0; giá trị 5 chỉ được gán ở Initialization (khi chạy `<clinit>`)',
      'Linking → Loading → Initialization; count = 5 ở Linking',
      'Chỉ có một bước Loading, count = 5 ngay lập tức',
    ], ans: 'B',
    exp: 'Initialization diễn ra lazy khi class được "active use" lần đầu (tạo instance, gọi static method, đọc/ghi static field không phải hằng compile-time...). Exception trong static initializer gây `ExceptionInInitializerError` lần đầu và `NoClassDefFoundError` ở các lần dùng sau — một nguyên nhân khó hiểu thường gặp khi debug.',
    tags: ['class-loading', 'initialization', 'clinit'], sec: 50,
  },
  {
    id: 'JVM-025', topic: 'Strong, Weak, Soft và Phantom References', d: 's', cat: 'bug',
    q: 'Lập trình viên dùng `WeakHashMap` để cache cấu hình, kỳ vọng entry tự bị xóa khi không còn dùng. Vì sao entry dưới đây gần như không bao giờ bị xóa?',
    code: `
Map<String, Config> cache = new WeakHashMap<>();
cache.put("payment", loadConfig("payment"));`,
    opts: [
      'Do WeakHashMap không hoạt động với String',
      'Key là String literal: literal được tham chiếu mạnh từ constant pool của class đang được nạp, nên key luôn strongly reachable và entry không bao giờ được giải phóng. WeakHashMap phù hợp khi key là object có vòng đời riêng (ví dụ object bị bỏ khi phiên kết thúc), không phải để làm cache có giới hạn',
      'Do phải gọi System.gc() mỗi phút',
      'Do value Config giữ tham chiếu yếu',
    ], ans: 'B',
    exp: 'WeakHashMap giữ key bằng WeakReference và value bằng tham chiếu mạnh. Nếu value tham chiếu ngược lại key, entry cũng không bao giờ bị xóa. Để làm cache theo kích thước/thời gian, dùng thư viện cache (Caffeine) thay vì dựa vào hành vi GC.',
    tags: ['weakhashmap', 'weak-reference', 'cache'], sec: 60,
  },
]);
