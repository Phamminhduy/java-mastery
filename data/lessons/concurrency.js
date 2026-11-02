/* Bài học — Module 5: Multithreading và Concurrency */
(() => {
  const L = (topic, blocks) => LS.add('concurrency', topic, blocks);

  L('Thread và Runnable', [
    'Thread là đơn vị thực thi; `Runnable` mô tả công việc (không trả kết quả, không ném checked exception).',
    '- `start()` tạo thread mới và chạy `run()` trên đó; gọi `run()` trực tiếp chỉ chạy trên thread hiện tại. `start()` hai lần ném `IllegalThreadStateException`.',
    '- Trạng thái: NEW → RUNNABLE → (BLOCKED / WAITING / TIMED_WAITING) → TERMINATED.',
    '- Thread daemon không giữ JVM sống; thread pool mặc định là non-daemon.',
    '## Interrupt',
    '- `interrupt()` chỉ đặt cờ; method chặn (`sleep`, `wait`, `take`) ném `InterruptedException` và **xóa cờ**.',
    { lang: 'java', code: `
try {
    Job job = queue.take();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();   // khôi phục cờ
    return;                               // và dừng công việc
}` },
    '! Trong ứng dụng backend, gần như không tạo `new Thread()` thủ công — dùng ExecutorService/TaskExecutor được quản lý.',
  ]);

  L('Callable và Future', [
    '`Callable<V>` trả kết quả và có thể ném exception; submit vào ExecutorService nhận `Future<V>`.',
    '- `get()` chặn tới khi xong; exception của task được bọc trong `ExecutionException` (lấy bằng `getCause()`).',
    '- Luôn dùng `get(timeout, unit)` ở luồng xử lý request; khi timeout gọi `cancel(true)` (gửi interrupt).',
    '- `submit()` nuốt exception vào Future — nếu không gọi `get()`, lỗi biến mất âm thầm; `execute()` để exception tới UncaughtExceptionHandler.',
    '- Future không ghép chuỗi được → dùng `CompletableFuture` cho luồng bất đồng bộ phức tạp.',
  ]);

  L('synchronized', [
    '`synchronized` cung cấp **mutual exclusion** và **visibility** (happens-before giữa unlock và lock tiếp theo trên cùng monitor). Reentrant: thread đang giữ lock có thể vào lại.',
    '- Instance method synchronized khóa `this`; static synchronized khóa `Class` object; block `synchronized (lock)` khóa object chỉ định.',
    '- Hai thread chỉ loại trừ nhau khi khóa **cùng một object**.',
    { lang: 'java', code: `
private final Object lock = new Object();   // lock riêng, không lộ ra ngoài
void transfer(...) {
    synchronized (lock) { ... }
}` },
    '- Giữ phạm vi khóa nhỏ; không gọi I/O, HTTP, DB bên trong khối synchronized.',
    '! synchronized chỉ có tác dụng trong **một JVM** — nhiều instance ứng dụng cần khóa ở DB hoặc distributed lock.',
  ]);

  L('volatile', [
    '`volatile` đảm bảo **visibility** (đọc luôn thấy lần ghi gần nhất) và **ordering** (ngăn reorder qua nó), nhưng **không** đảm bảo atomicity cho thao tác phức hợp như `count++`.',
    '## Dùng đúng chỗ',
    '- Cờ trạng thái một người ghi, nhiều người đọc (`volatile boolean running`).',
    '- Publish tham chiếu tới object immutable (cấu hình được reload).',
    '- Double-checked locking cho singleton lazy.',
    { lang: 'java', code: `
private volatile PricingConfig current;      // object immutable
void reload() { current = PricingConfig.load(); }
PricingConfig get() { return current; }` },
    '! `volatile int count; count++` vẫn mất cập nhật khi nhiều thread ghi → dùng AtomicInteger/LongAdder.',
  ]);

  L('Atomic Classes', [
    '`AtomicInteger`, `AtomicLong`, `AtomicReference`... dùng **CAS (compare-and-swap)**: chỉ ghi nếu giá trị hiện tại bằng giá trị kỳ vọng, nếu không thì thử lại — lock-free.',
    { lang: 'java', code: `
counter.incrementAndGet();
max.accumulateAndGet(latency, Math::max);
ref.updateAndGet(list -> append(list, item));   // hàm không có side effect` },
    '- `LongAdder` phân tán thành nhiều cell, hiệu quả hơn AtomicLong khi nhiều thread cùng tăng (metrics, đếm).',
    '- Vấn đề ABA (giá trị A→B→A) — dùng `AtomicStampedReference` khi cần.',
    '- Atomic chỉ đảm bảo một biến; ràng buộc giữa nhiều biến cần lock.',
  ]);

  L('Lock và ReentrantLock', [
    '`ReentrantLock` có các khả năng mà synchronized không có: `tryLock()` (có/không timeout), `lockInterruptibly()`, fairness, nhiều `Condition`.',
    { lang: 'java', code: `
lock.lock();              // gọi trước try
try {
    // vùng găng
} finally {
    lock.unlock();        // bắt buộc trong finally
}

if (lock.tryLock(500, TimeUnit.MILLISECONDS)) { try { ... } finally { lock.unlock(); } }
else { /* xử lý khi không lấy được khóa */ }` },
    '- `ReadWriteLock`: nhiều reader đồng thời, writer độc quyền. `StampedLock`: optimistic read.',
    '- Với virtual threads (Java 21–23), ReentrantLock không gây pinning như synchronized khi chặn I/O.',
  ]);

  L('Deadlock', [
    'Deadlock xảy ra khi có đủ 4 điều kiện: mutual exclusion, hold and wait, no preemption, **circular wait**.',
    '- Ví dụ: thread 1 giữ A chờ B, thread 2 giữ B chờ A (chuyển tiền hai chiều).',
    '## Phòng tránh',
    '- Lấy khóa theo **thứ tự toàn cục** nhất quán (theo id nhỏ trước).',
    '- `tryLock` có timeout rồi retry; giữ khóa ngắn; không gọi code lạ (callback) khi đang giữ khóa.',
    '## Phát hiện',
    '- Thread dump (`jstack`, `jcmd Thread.print`) → "Found one Java-level deadlock".',
    '- Ở DB: lỗi "deadlock detected"/ORA-00060 — DB tự hủy một transaction; ứng dụng phải retry và cập nhật theo thứ tự nhất quán.',
  ]);

  L('Race Condition', [
    'Race condition: kết quả phụ thuộc thứ tự thực thi giữa các thread. Hai dạng phổ biến:',
    '- **Read-modify-write**: `count++`, `balance = balance + x`.',
    '- **Check-then-act**: `if (!map.containsKey(k)) map.put(k, v)`, `if (cache == null) cache = load()`, kiểm tra tồn kho rồi trừ.',
    '## Cách xử lý',
    '- Thao tác nguyên tử (Atomic, `ConcurrentHashMap.merge/compute`).',
    '- Khóa (synchronized/Lock) bao trùm cả kiểm tra và hành động.',
    '- Ở mức nhiều instance: đẩy điều kiện vào DB (`UPDATE ... WHERE stock >= :qty`, unique constraint, optimistic locking).',
    '! Race condition thường không tái hiện được ở local — xuất hiện ngẫu nhiên dưới tải production.',
  ]);

  L('Thread Safety', [
    'Một class thread-safe khi hoạt động đúng dù được gọi đồng thời từ nhiều thread mà không cần đồng bộ thêm từ phía người gọi.',
    '## Chiến lược (từ đơn giản đến phức tạp)',
    '- **Stateless**: không có field mutable (đa số Spring bean nên như vậy).',
    '- **Immutable**: trạng thái không đổi sau khi tạo.',
    '- **Thread confinement**: dữ liệu chỉ thuộc một thread (biến local, ThreadLocal).',
    '- **Dùng cấu trúc thread-safe**: ConcurrentHashMap, Atomic, BlockingQueue.',
    '- **Đồng bộ hóa**: synchronized/Lock.',
    '! Class không thread-safe hay gặp: `SimpleDateFormat`, `HashMap`, `ArrayList`, `StringBuilder`, Hibernate `Session`/`EntityManager` thật (Spring inject proxy an toàn).',
  ]);

  L('ExecutorService', [
    'ExecutorService tách việc **gửi task** khỏi việc **quản lý thread**: tái sử dụng thread, giới hạn đồng thời, quản lý vòng đời.',
    '- `submit(Callable/Runnable)` → Future; `invokeAll`, `invokeAny`.',
    '- Phải `shutdown()` (không nhận task mới, chạy hết task cũ) rồi `awaitTermination`; `shutdownNow()` interrupt các task đang chạy.',
    '- Java 19+: ExecutorService là AutoCloseable (dùng try-with-resources).',
    '- Trong Spring: dùng bean `ThreadPoolTaskExecutor` (container quản lý shutdown), `@Async` với executor đặt tên.',
    '! Không tạo ExecutorService mới trong mỗi request rồi quên shutdown → rò rỉ thread, "unable to create native thread".',
  ]);

  L('ThreadPool', [
    'Hoạt động của `ThreadPoolExecutor(core, max, keepAlive, queue, handler)` khi nhận task:',
    '- Số thread < core → tạo thread mới.',
    '- Ngược lại → đưa vào queue.',
    '- Queue đầy → tạo thêm thread tới max.',
    '- Vẫn không được → **rejection policy** (Abort: ném exception; CallerRuns: chạy trên thread gọi — tạo backpressure; Discard; DiscardOldest).',
    '! `Executors.newFixedThreadPool` dùng queue **không giới hạn** (tích tụ task tới OOM); `newCachedThreadPool` tạo thread không giới hạn. Production nên tự cấu hình bounded queue.',
    '## Kích thước pool',
    '- CPU-bound: ≈ số core. I/O-bound: lớn hơn, ước lượng `core × (1 + thời gian chờ / thời gian tính)`, nhưng bị giới hạn bởi tài nguyên phía sau (connection pool DB).',
    '- Tách pool theo loại công việc (bulkhead) và theo dõi metrics: active, queue size, rejected.',
  ]);

  L('CompletableFuture', [
    'CompletableFuture cho phép ghép các bước bất đồng bộ không chặn.',
    { table: [['Method', 'Ý nghĩa'], ['`supplyAsync(fn, executor)`', 'Chạy bất đồng bộ (luôn truyền executor cho I/O)'], ['`thenApply`', 'Biến đổi kết quả (map)'], ['`thenCompose`', 'Nối bước trả về CompletableFuture (flatMap)'], ['`thenCombine`', 'Kết hợp hai future độc lập'], ['`allOf` / `anyOf`', 'Chờ tất cả / bất kỳ'], ['`exceptionally` / `handle`', 'Xử lý lỗi, fallback'], ['`orTimeout` / `completeOnTimeout` (9+)', 'Giới hạn thời gian']] },
    { lang: 'java', code: `
var price = CompletableFuture.supplyAsync(() -> pricing.get(id), ioPool).orTimeout(800, MILLISECONDS);
var stock = CompletableFuture.supplyAsync(() -> inventory.get(id), ioPool).orTimeout(800, MILLISECONDS);
var reviews = CompletableFuture.supplyAsync(() -> review.top(id), ioPool)
        .completeOnTimeout(List.of(), 500, MILLISECONDS)
        .exceptionally(ex -> List.of());           // lỗi phần phụ vẫn trả trang
return price.thenCombine(stock, Detail::new).thenCombine(reviews, Detail::withReviews).join();` },
    '! Không truyền executor → dùng `ForkJoinPool.commonPool()` (ít thread, dùng chung) — không phù hợp I/O chặn. Exception trong exceptionally thường là `CompletionException` bọc lỗi gốc.',
  ]);

  L('Concurrent Collections', [
    '- `ConcurrentHashMap`: map đồng thời, thao tác atomic `compute/merge`.',
    '- `CopyOnWriteArrayList/Set`: đọc không khóa, ghi copy mảng — đọc nhiều ghi hiếm.',
    '- `BlockingQueue` (`ArrayBlockingQueue`, `LinkedBlockingQueue`): producer–consumer; `put/take` chặn, `offer/poll` có timeout.',
    '- `ConcurrentLinkedQueue`: queue lock-free không chặn. `ConcurrentSkipListMap`: map có thứ tự đồng thời.',
    '- `Collections.synchronizedList` đồng bộ từng method, nhưng **duyệt** vẫn phải tự `synchronized (list)`.',
    '- Công cụ đồng bộ: `CountDownLatch`, `Semaphore` (giới hạn đồng thời), `CyclicBarrier`, `Phaser`.',
  ]);

  L('Happens-before', [
    'Happens-before là đảm bảo của Java Memory Model: nếu hành động A happens-before B, thì kết quả của A **nhìn thấy được** bởi B.',
    '- Unlock → lock cùng monitor; ghi volatile → đọc volatile; `start()` → thread; thread → `join()`.',
    '- Các lớp `java.util.concurrent`: đưa vào BlockingQueue → lấy ra; submit vào Executor → task chạy; task xong → `Future.get()`; ghi vào ConcurrentHashMap → đọc key đó.',
    '- Tính bắc cầu: A hb B và B hb C ⇒ A hb C.',
    '! `Thread.sleep()` không tạo happens-before — "chờ một chút rồi đọc" không đảm bảo thấy dữ liệu mới.',
  ]);

  L('ForkJoinPool', [
    'ForkJoinPool tối ưu cho bài toán **chia để trị CPU-bound**: task tự chia nhỏ (`fork`) và gộp kết quả (`join`). Mỗi worker có deque riêng, worker rảnh **lấy trộm việc** (work-stealing) từ worker khác.',
    { lang: 'java', code: `
class SumTask extends RecursiveTask<Long> {
    protected Long compute() {
        if (hi - lo <= 10_000) return sequentialSum();
        SumTask left = new SumTask(arr, lo, mid), right = new SumTask(arr, mid, hi);
        left.fork();
        return right.compute() + left.join();
    }
}` },
    '- `commonPool` phục vụ parallel stream và CompletableFuture async mặc định; kích thước ≈ số CPU − 1.',
    '! Chặn I/O trong commonPool ảnh hưởng toàn bộ JVM.',
  ]);

  L('Virtual Threads', [
    'Virtual threads (chính thức Java 21) là thread nhẹ do JVM lập lịch trên một số ít **carrier thread**. Khi chặn I/O, virtual thread được tháo khỏi carrier, nên có thể có hàng triệu thread.',
    '- Phù hợp mô hình thread-per-request với tác vụ **chờ I/O**; không làm code CPU-bound nhanh hơn.',
    '- Không pool virtual thread: `Executors.newVirtualThreadPerTaskExecutor()`; giới hạn đồng thời tới tài nguyên phía sau bằng `Semaphore`.',
    '- Spring Boot 3.2+: `spring.threads.virtual.enabled=true` (Tomcat, @Async, scheduler dùng virtual threads).',
    '! **Pinning** (Java 21–23): chặn I/O bên trong `synchronized` hoặc native call giữ chặt carrier → thay bằng ReentrantLock (Java 24 với JEP 491 đã khắc phục synchronized). ThreadLocal nặng trên hàng triệu thread tốn bộ nhớ.',
  ]);

  L('Các tình huống xử lý đồng thời trong Backend', [
    { table: [['Tình huống', 'Giải pháp phù hợp'], ['Bán vượt tồn kho (nhiều instance)', '`UPDATE ... SET stock = stock - :q WHERE id = :id AND stock >= :q`, kiểm tra số dòng'], ['Hai người cùng sửa một form', 'Optimistic locking `@Version`, trả 409'], ['Cập nhật số dư tranh chấp cao', 'Cập nhật nguyên tử ở DB hoặc pessimistic lock ngắn'], ['Request tạo bị gửi lặp', 'Idempotency key + unique constraint'], ['Job định kỳ chạy trên nhiều pod', 'ShedLock/Quartz cluster + job idempotent'], ['Worker lấy job từ bảng', '`SELECT ... FOR UPDATE SKIP LOCKED`'], ['Đặt phòng chồng giờ', 'Exclusion/unique constraint ở DB']] },
    '- Nguyên tắc: khi có nhiều instance, **DB (hoặc hệ thống dùng chung) mới là nơi đảm bảo tính đúng đắn**; khóa trong JVM không đủ.',
    '? Khi trả lời, nêu rõ: phạm vi (1 JVM hay nhiều), mức tranh chấp, yêu cầu nhất quán, và cách xử lý khi xung đột (retry, báo người dùng).',
  ]);
})();
