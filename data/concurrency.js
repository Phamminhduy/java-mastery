/* Module 5: Multithreading và Concurrency */
QB.module({
  id: 'concurrency', order: 5, title: 'Multithreading và Concurrency',
  description: 'Thread, synchronized, volatile, Atomic, Lock, Deadlock, ExecutorService, CompletableFuture, Virtual Threads và các tình huống đồng thời trong backend.',
  topics: ['Thread và Runnable', 'Callable và Future', 'synchronized', 'volatile', 'Atomic Classes', 'Lock và ReentrantLock', 'Deadlock',
    'Race Condition', 'Thread Safety', 'ExecutorService', 'ThreadPool', 'CompletableFuture', 'Concurrent Collections', 'Happens-before',
    'ForkJoinPool', 'Virtual Threads', 'Các tình huống xử lý đồng thời trong Backend'],
}, [
  {
    id: 'CON-001', topic: 'Thread và Runnable', d: 'b', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
Thread t = new Thread(() ->
    System.out.println(Thread.currentThread().getName()), "worker-1");
t.run();`,
    opts: ['worker-1', 'main', 'Thread-0', 'Ném IllegalThreadStateException'], ans: 'B',
    exp: 'Gọi `run()` trực tiếp chỉ là lời gọi method thông thường, chạy trên **thread hiện tại** (main); không có thread mới được tạo. Phải gọi `t.start()` để JVM tạo thread mới và thực thi run() trên đó (in "worker-1"). Gọi `start()` hai lần trên cùng Thread ném IllegalThreadStateException.',
    tags: ['thread', 'start-vs-run'], sec: 35,
  },
  {
    id: 'CON-002', topic: 'Race Condition', d: 'i', cat: 'output',
    q: 'Hai thread cùng chạy đoạn code sau trên cùng một object `Counter`, mỗi thread gọi `increment()` 10.000 lần. Sau khi join cả hai, giá trị `count` là bao nhiêu?',
    code: `
class Counter {
    private int count = 0;
    void increment() { count++; }
}`,
    opts: ['Luôn là 20.000', 'Không xác định, thường nhỏ hơn 20.000', 'Luôn là 10.000', 'Ném ConcurrentModificationException'], ans: 'B',
    exp: '`count++` gồm 3 bước: đọc, cộng, ghi — không nguyên tử. Hai thread có thể cùng đọc một giá trị rồi cùng ghi giá trị +1, làm mất một lần tăng (lost update). Kết quả thay đổi giữa các lần chạy. Sửa: `synchronized`, `AtomicInteger.incrementAndGet()` hoặc `LongAdder`.',
    tags: ['race-condition', 'atomicity'], sec: 45,
  },
  {
    id: 'CON-003', topic: 'volatile', d: 'i', cat: 'theory',
    q: 'Khai báo `private volatile int count;` rồi nhiều thread cùng gọi `count++`. Nhận định nào đúng?',
    opts: [
      'volatile làm count++ trở thành nguyên tử, kết quả luôn đúng',
      'volatile chỉ đảm bảo visibility và thứ tự (ordering), không đảm bảo atomicity cho thao tác đọc-sửa-ghi; vẫn có lost update',
      'volatile khóa biến giống synchronized',
      'volatile chỉ dùng được cho kiểu boolean',
    ], ans: 'B',
    exp: 'volatile đảm bảo mỗi lần đọc thấy lần ghi gần nhất và ngăn reorder qua nó, nhưng `count++` vẫn là 3 thao tác tách rời. volatile phù hợp cho cờ trạng thái (một thread ghi, nhiều thread đọc) hoặc safe publication. Thao tác phức hợp cần lock hoặc CAS (Atomic*).',
    tags: ['volatile', 'atomicity', 'visibility'], sec: 40,
  },
  {
    id: 'CON-004', topic: 'Atomic Classes', d: 'i', cat: 'theory',
    q: 'AtomicInteger.incrementAndGet() đảm bảo tính nguyên tử bằng cơ chế nào?',
    opts: [
      'Dùng synchronized ngầm trên object AtomicInteger',
      'Compare-And-Swap (CAS) — lệnh nguyên tử của CPU, thử lại trong vòng lặp nếu giá trị đã bị thread khác thay đổi (lock-free)',
      'Tạo bản sao riêng cho mỗi thread',
      'Dừng tất cả thread khác trong lúc cập nhật',
    ], ans: 'B',
    exp: 'Atomic classes dùng CAS: chỉ ghi giá trị mới nếu giá trị hiện tại vẫn bằng giá trị đã đọc, nếu không thì đọc lại và thử lại. Không chặn thread (non-blocking), nhanh khi tranh chấp thấp. Khi rất nhiều thread cùng cập nhật một counter, CAS retry nhiều — `LongAdder` phân tán thành nhiều cell và hiệu quả hơn cho thống kê.',
    tags: ['atomic', 'cas', 'longadder'], sec: 40,
  },
  {
    id: 'CON-005', topic: 'synchronized', d: 'a', cat: 'bug',
    q: 'Mỗi request tạo một `IdGenerator` mới và gọi `next()`. Thỉnh thoảng hai đơn hàng nhận cùng một ID. Vì sao `synchronized` không bảo vệ được?',
    code: `
class IdGenerator {
    private static long last = 0;

    synchronized long next() {
        return ++last;
    }
}

// trong mỗi request:
long id = new IdGenerator().next();`,
    opts: [
      'Do long không nguyên tử trên JVM 64-bit',
      'synchronized trên instance method khóa `this`; mỗi request dùng một object khác nhau nên không loại trừ lẫn nhau khi cùng sửa biến static `last`',
      'Do thiếu volatile cho last',
      'synchronized không hoạt động với biến static',
    ], ans: 'B',
    exp: 'Monitor được khóa phải là **cùng một object** giữa các thread. Instance method synchronized khóa `this`; static synchronized method khóa `IdGenerator.class`. Trạng thái static cần được bảo vệ bởi lock dùng chung (static synchronized hoặc `synchronized (IdGenerator.class)`) — hoặc tốt hơn là `AtomicLong`. Trong hệ thống nhiều instance, ID nên sinh bởi DB sequence/UUID/Snowflake thay vì biến trong bộ nhớ.',
    tags: ['synchronized', 'monitor', 'static'], sec: 55,
  },
  {
    id: 'CON-006', topic: 'synchronized', d: 'i', cat: 'theory',
    q: 'Class có `synchronized void a()` (instance) và `static synchronized void b()`. Thread 1 đang chạy `obj.a()`, thread 2 gọi `X.b()` cùng lúc. Thread 2 có bị chặn không?',
    opts: ['Có, vì cả hai đều synchronized', 'Không, vì a() khóa monitor của obj còn b() khóa monitor của X.class — hai lock khác nhau', 'Có, vì static method luôn khóa mọi instance', 'Tùy JVM'], ans: 'B',
    exp: 'Instance synchronized method dùng monitor của object; static synchronized method dùng monitor của đối tượng `Class`. Hai lock độc lập nên hai method có thể chạy song song. Nếu chúng cùng sửa một trạng thái chung thì sẽ có race condition.',
    tags: ['synchronized', 'class-lock'], sec: 35,
  },
  {
    id: 'CON-007', topic: 'Deadlock', d: 'a', cat: 'design',
    q: 'Hàm chuyển tiền khóa tài khoản nguồn rồi đến tài khoản đích. Khi A chuyển cho B và B chuyển cho A cùng lúc, hệ thống treo. Cách sửa tốt nhất trong phạm vi một JVM?',
    code: `
void transfer(Account from, Account to, BigDecimal amount) {
    synchronized (from) {
        synchronized (to) {
            from.debit(amount);
            to.credit(amount);
        }
    }
}`,
    opts: [
      'Thêm Thread.sleep giữa hai synchronized',
      'Luôn khóa theo một thứ tự toàn cục nhất quán, ví dụ theo account id nhỏ hơn trước, bất kể chiều chuyển tiền',
      'Bỏ synchronized bên trong',
      'Đổi thứ tự thành khóa `to` trước rồi `from`',
    ], ans: 'B',
    exp: 'Deadlock cần 4 điều kiện, trong đó có **circular wait**. Thread 1 giữ A chờ B, thread 2 giữ B chờ A. Sắp xếp thứ tự lấy lock theo một khóa toàn cục (id) phá vỡ vòng chờ. Cách khác: `tryLock(timeout)` rồi thử lại. Trong hệ thống thực, số dư nằm ở DB nên tương tự cần khóa bản ghi theo thứ tự id (`SELECT ... FOR UPDATE ORDER BY id`) để tránh deadlock ở tầng database.',
    tags: ['deadlock', 'lock-ordering'], sec: 60,
  },
  {
    id: 'CON-008', topic: 'Deadlock', d: 'i', cat: 'debug',
    q: 'Một service Java bị treo: CPU gần 0%, request timeout hàng loạt. Công cụ/bước nào giúp xác nhận nhanh có deadlock ở mức JVM?',
    opts: [
      'Xem heap dump bằng MAT',
      'Lấy thread dump (`jstack <pid>` hoặc `jcmd <pid> Thread.print`), tìm mục "Found one Java-level deadlock" và các thread BLOCKED đang chờ monitor mà thread khác giữ',
      'Tăng -Xmx và restart',
      'Bật debug log cho Spring',
    ], ans: 'B',
    exp: 'Thread dump liệt kê trạng thái từng thread (RUNNABLE, BLOCKED, WAITING) cùng stack trace và lock đang giữ/chờ; HotSpot tự phát hiện deadlock giữa monitor và ReentrantLock. Nên lấy 2–3 dump cách nhau vài giây để phân biệt treo cố định với chậm. CPU thấp + timeout cũng có thể do chờ tài nguyên ngoài (DB pool cạn, HTTP call không timeout) — thread dump cũng chỉ ra điều này.',
    tags: ['deadlock', 'thread-dump', 'jstack'], sec: 45,
  },
  {
    id: 'CON-009', topic: 'Lock và ReentrantLock', d: 'i', cat: 'theory', type: 'multiple',
    q: 'Chọn **2** khả năng mà `ReentrantLock` cung cấp còn `synchronized` thì không.',
    opts: [
      'tryLock(timeout) — thử lấy lock trong khoảng thời gian giới hạn',
      'Tự động nhả lock khi ra khỏi khối code, kể cả khi có exception',
      'lockInterruptibly() — chờ lock nhưng có thể bị interrupt',
      'Tính reentrant: thread đang giữ lock có thể lấy lại lock đó',
    ], ans: ['A', 'C'],
    exp: 'ReentrantLock bổ sung: tryLock (có/không timeout), lockInterruptibly, fairness policy, nhiều Condition. Cả hai đều reentrant. Chính synchronized mới tự nhả lock khi rời khối; với ReentrantLock **bắt buộc** gọi `unlock()` trong finally.',
    tags: ['reentrantlock', 'synchronized'], sec: 45,
  },
  {
    id: 'CON-010', topic: 'Lock và ReentrantLock', d: 'i', cat: 'bug',
    q: 'Sau một lần `validate()` ném exception, mọi request sau đó gọi `update()` đều bị treo. Vì sao?',
    code: `
private final ReentrantLock lock = new ReentrantLock();

void update(Order o) {
    lock.lock();
    validate(o);      // có thể ném exception
    save(o);
    lock.unlock();
}`,
    opts: [
      'Do ReentrantLock không reentrant',
      'unlock() không nằm trong finally: exception khiến lock không bao giờ được nhả, các thread khác chờ mãi',
      'Do thiếu volatile cho lock',
      'Do validate() chạy trên thread khác',
    ], ans: 'B',
    exp: 'Mẫu chuẩn: `lock.lock(); try { ... } finally { lock.unlock(); }` (gọi lock() **trước** try để nếu lock() lỗi thì không unlock một lock chưa giữ). Đây là lý do synchronized an toàn hơn cho trường hợp đơn giản.',
    tags: ['reentrantlock', 'finally'], sec: 40,
  },
  {
    id: 'CON-011', topic: 'ThreadPool', d: 's', cat: 'debug',
    q: 'Service dùng `Executors.newFixedThreadPool(10)` để gửi webhook. Khi đối tác phản hồi chậm, heap tăng liên tục tới OutOfMemoryError. Nguyên nhân?',
    opts: [
      'Fixed pool tạo thread mới không giới hạn',
      'newFixedThreadPool dùng LinkedBlockingQueue không giới hạn: khi tốc độ submit > tốc độ xử lý, task tích tụ trong queue (mỗi task giữ payload) đến hết heap',
      'Do webhook dùng HTTP/2',
      'Do thread pool không shutdown',
    ], ans: 'B',
    exp: 'Các factory `Executors.newFixedThreadPool`/`newSingleThreadExecutor` dùng queue không giới hạn; `newCachedThreadPool` thì có thể tạo thread không giới hạn. Production nên tạo `ThreadPoolExecutor` với **bounded queue**, rejection policy rõ ràng (CallerRunsPolicy để tạo backpressure, hoặc từ chối và lưu lại để retry), timeout cho HTTP call, và metrics về queue size.',
    tags: ['threadpool', 'unbounded-queue', 'backpressure'], sec: 60,
  },
  {
    id: 'CON-012', topic: 'ThreadPool', d: 'a', cat: 'output',
    q: 'Submit nhanh 20 task chạy lâu (mỗi task vài phút) vào executor sau. Ngay sau đó có bao nhiêu task đang chạy, bao nhiêu trong queue, và điều gì xảy ra với số còn lại?',
    code: `
ThreadPoolExecutor ex = new ThreadPoolExecutor(
    2,                       // corePoolSize
    4,                       // maximumPoolSize
    60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(10));   // mặc định AbortPolicy`,
    opts: [
      '4 chạy, 16 trong queue',
      '2 chạy, 10 trong queue, 8 bị từ chối',
      '4 chạy, 10 trong queue, 6 bị từ chối với RejectedExecutionException',
      '20 chạy đồng thời',
    ], ans: 'C',
    exp: 'Thứ tự của ThreadPoolExecutor: (1) nếu số thread < core → tạo thread mới (task 1–2); (2) nếu không → đưa vào queue (task 3–12); (3) queue đầy → tạo thêm thread tới maximum (task 13–14 chạy ngay trên 2 thread mới); (4) vẫn không được → rejection policy, mặc định AbortPolicy ném RejectedExecutionException (task 15–20). Lưu ý: thread vượt core chỉ được tạo khi queue **đầy**, nên với queue không giới hạn, maximumPoolSize vô tác dụng.',
    tags: ['threadpoolexecutor', 'rejection-policy'], sec: 75,
  },
  {
    id: 'CON-013', topic: 'Callable và Future', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
ExecutorService ex = Executors.newSingleThreadExecutor();
Future<Integer> f = ex.submit(() -> 10 / 0);
try {
    System.out.println(f.get());
} catch (ExecutionException e) {
    System.out.println("caught " + e.getCause().getClass().getSimpleName());
} finally {
    ex.shutdown();
}`,
    opts: ['caught ArithmeticException', 'caught ExecutionException', '0', 'Chương trình ném ArithmeticException ở thread main ngay khi submit'], ans: 'A',
    exp: 'Lambda `() -> 10 / 0` được suy luận là Callable<Integer>. Exception trong task không lan ra lúc submit mà được lưu trong Future; `get()` ném `ExecutionException` bọc exception gốc, lấy bằng `getCause()`. (Biểu thức `10 / 0` với literal vẫn biên dịch được, chỉ lỗi lúc runtime.)',
    tags: ['future', 'callable', 'executionexception'], sec: 45,
  },
  {
    id: 'CON-014', topic: 'ExecutorService', d: 'a', cat: 'debug',
    q: 'Job gửi email chạy bằng `executor.submit(() -> sendEmail(user))` cho từng user và không gọi `get()`. Nhiều email không được gửi nhưng log hoàn toàn không có lỗi. Nguyên nhân khả dĩ?',
    opts: [
      'Do executor chạy task trên thread daemon',
      'Exception trong task được `submit()` lưu vào Future; không gọi get() thì exception bị "nuốt" im lặng. Cần try/catch + log trong task, hoặc dùng execute() (exception tới UncaughtExceptionHandler), hoặc xử lý qua CompletableFuture.whenComplete',
      'SMTP server chặn',
      'Do thiếu synchronized',
    ], ans: 'B',
    exp: '`submit()` bọc task vào FutureTask, mọi exception được lưu làm kết quả. `execute()` để exception lan ra thread và được UncaughtExceptionHandler xử lý (mặc định in stack trace). Bài học: task chạy nền phải tự log lỗi đầy đủ và có cơ chế retry/ghi nhận thất bại.',
    tags: ['executorservice', 'submit', 'swallowed-exception'], sec: 55,
  },
  {
    id: 'CON-015', topic: 'CompletableFuture', d: 'i', cat: 'theory',
    q: '`findUser(id)` trả về `CompletableFuture<User>` và `findOrders(user)` trả về `CompletableFuture<List<Order>>`. Để nối hai bước bất đồng bộ và nhận `CompletableFuture<List<Order>>` (không lồng nhau), dùng method nào?',
    opts: ['thenApply', 'thenCompose', 'thenAccept', 'thenRun'], ans: 'B',
    exp: '`thenCompose` tương tự flatMap: function trả về một CompletionStage và kết quả được "làm phẳng". Dùng `thenApply` sẽ tạo `CompletableFuture<CompletableFuture<List<Order>>>`. thenAccept/thenRun dùng cho side effect, không trả giá trị.',
    tags: ['completablefuture', 'thencompose'], sec: 40, ver: 'Java 8+',
  },
  {
    id: 'CON-016', topic: 'CompletableFuture', d: 'a', cat: 'design',
    q: 'API trang chi tiết sản phẩm cần gọi 3 service độc lập (giá, tồn kho, đánh giá), mỗi service ~300ms. Yêu cầu: tổng thời gian ≈ chậm nhất, tối đa 1 giây, service đánh giá lỗi thì vẫn trả trang với danh sách rỗng. Thiết kế nào phù hợp nhất?',
    opts: [
      'Gọi tuần tự 3 service trong try/catch',
      'Gọi song song bằng `supplyAsync(..., ioExecutor)` cho từng service, mỗi future có `orTimeout`/`completeOnTimeout` và `exceptionally` cho fallback phù hợp, rồi `CompletableFuture.allOf(...).join()` để ghép kết quả',
      'Dùng parallelStream trên danh sách 3 lambda',
      'Tạo 3 Thread mới bằng new Thread() cho mỗi request',
    ], ans: 'B',
    exp: 'Chạy song song trên executor riêng cho I/O (không dùng commonPool), áp dụng timeout và fallback **theo từng nhánh** để đáp ứng yêu cầu "lỗi một phần vẫn trả về". `orTimeout`/`completeOnTimeout` có từ Java 9. Tạo thread thủ công mỗi request không kiểm soát được tài nguyên. Với Java 21 có thể dùng virtual threads hoặc structured concurrency (preview).',
    tags: ['completablefuture', 'parallel-calls', 'timeout', 'fallback'], sec: 60, ver: 'Java 9+',
  },
  {
    id: 'CON-017', topic: 'CompletableFuture', d: 's', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
String r = CompletableFuture
    .supplyAsync(() -> { throw new IllegalStateException("x"); })
    .thenApply(v -> "ok")
    .exceptionally(ex -> "fallback:" + ex.getClass().getSimpleName())
    .join();
System.out.println(r);`,
    opts: ['ok', 'fallback:IllegalStateException', 'fallback:CompletionException', 'Ném IllegalStateException từ join()'], ans: 'C',
    exp: 'Exception trong `supplyAsync` được bọc vào `CompletionException` khi stage hoàn thành bất thường; stage `thenApply` phụ thuộc bị bỏ qua và lan truyền cùng exception đó. `exceptionally` nhận `CompletionException` (cause mới là IllegalStateException). Vì vậy khi xử lý lỗi nên "unwrap": `Throwable cause = ex instanceof CompletionException ? ex.getCause() : ex;`.',
    tags: ['completablefuture', 'exceptionally', 'completionexception'], sec: 70,
  },
  {
    id: 'CON-018', topic: 'Concurrent Collections', d: 'i', cat: 'theory',
    q: 'Trong mô hình producer–consumer dùng `ArrayBlockingQueue<Job>(100)`, điều gì xảy ra khi producer gọi `put(job)` lúc queue đã đầy?',
    opts: ['Ném IllegalStateException', 'put() chặn (block) producer cho tới khi có chỗ trống', 'Ghi đè phần tử cũ nhất', 'Trả về false ngay lập tức'], ans: 'B',
    exp: 'BlockingQueue có 4 nhóm thao tác: ném exception (`add`), trả giá trị đặc biệt (`offer` → false), chặn (`put`/`take`), chặn có timeout (`offer(e, timeout)`/`poll(timeout)`). Bounded queue + put tạo backpressure tự nhiên: producer chậm lại theo tốc độ consumer.',
    tags: ['blockingqueue', 'producer-consumer'], sec: 35,
  },
  {
    id: 'CON-019', topic: 'Concurrent Collections', d: 'a', cat: 'bug',
    q: 'Một thread duyệt `syncList` để tính tổng trong khi thread khác thêm phần tử. Thỉnh thoảng ném ConcurrentModificationException. Vì sao?',
    code: `
List<Integer> syncList = Collections.synchronizedList(new ArrayList<>());

// Thread A
int sum = 0;
for (Integer x : syncList) sum += x;

// Thread B
syncList.add(42);`,
    opts: [
      'synchronizedList không đồng bộ phương thức add',
      'Từng method được đồng bộ, nhưng việc duyệt (iterator) gồm nhiều lời gọi không được đồng bộ; phải tự `synchronized (syncList) { for ... }` hoặc dùng CopyOnWriteArrayList/snapshot',
      'Do Integer không thread-safe',
      'Do for-each không hỗ trợ list đồng bộ',
    ], ans: 'B',
    exp: 'Javadoc của `Collections.synchronizedList` yêu cầu người dùng tự khóa trên list khi duyệt. Các thao tác phức hợp (check-then-act, iterate) không nguyên tử dù từng method được synchronized. Lựa chọn khác: CopyOnWriteArrayList (đọc nhiều ghi ít), hoặc copy snapshot trong lock rồi xử lý bên ngoài.',
    tags: ['synchronizedlist', 'iteration', 'cme'], sec: 50,
  },
  {
    id: 'CON-020', topic: 'Happens-before', d: 'a', cat: 'theory',
    q: 'Thread main gán `config.timeout = 5000` (field thường, không volatile) rồi gọi `executor.submit(task)`. Bên trong task đọc `config.timeout`. Task có chắc chắn thấy 5000 không (giả sử không ai sửa thêm)?',
    opts: [
      'Không, vì field không volatile',
      'Có: theo đặc tả java.util.concurrent, các hành động trước khi submit task vào Executor happens-before việc task bắt đầu thực thi',
      'Chỉ khi task chạy trên cùng CPU core',
      'Chỉ khi dùng newSingleThreadExecutor',
    ], ans: 'B',
    exp: '"Memory consistency effects" của các lớp java.util.concurrent: hành động trước khi submit Runnable/Callable vào ExecutorService happens-before mọi hành động của task; hành động của task happens-before việc `Future.get()` trả về. Tương tự với put/take của BlockingQueue, ConcurrentHashMap... Tuy nhiên nếu sau khi submit, main tiếp tục sửa field thì không có đảm bảo.',
    tags: ['happens-before', 'executor'], sec: 55,
  },
  {
    id: 'CON-021', topic: 'ForkJoinPool', d: 'a', cat: 'theory',
    q: 'ForkJoinPool phù hợp nhất với loại công việc nào và cơ chế đặc trưng của nó là gì?',
    opts: [
      'Tác vụ I/O chặn lâu; dùng một queue chung FIFO',
      'Bài toán chia để trị CPU-bound (RecursiveTask/RecursiveAction); mỗi worker có deque riêng và lấy trộm việc (work-stealing) từ worker khác khi rảnh',
      'Lập lịch chạy định kỳ',
      'Đảm bảo thứ tự thực thi tuần tự',
    ], ans: 'B',
    exp: 'Task tự chia nhỏ (fork) và gộp kết quả (join). Work-stealing giúp cân bằng tải khi các nhánh có kích thước khác nhau. Common pool phục vụ parallel stream và CompletableFuture async mặc định; tránh chặn I/O trong đó (hoặc dùng `ForkJoinPool.ManagedBlocker`).',
    tags: ['forkjoinpool', 'work-stealing'], sec: 45,
  },
  {
    id: 'CON-022', topic: 'Virtual Threads', d: 'a', cat: 'theory', type: 'multiple',
    q: 'Về Virtual Threads (chính thức từ Java 21), chọn **2** phát biểu đúng.',
    opts: [
      'Phù hợp cho workload nhiều tác vụ chờ I/O (thread-per-request), vì khi chặn I/O virtual thread được tháo khỏi carrier thread',
      'Làm cho code CPU-bound chạy nhanh hơn vì có nhiều thread hơn',
      'Không nên pool virtual threads; tạo mới cho mỗi tác vụ (ví dụ Executors.newVirtualThreadPerTaskExecutor()) và giới hạn đồng thời bằng Semaphore nếu cần',
      'Hoàn toàn không bị ảnh hưởng bởi synchronized trong mọi phiên bản Java',
    ], ans: ['A', 'C'],
    exp: 'Virtual thread rẻ (hàng triệu), được JVM lập lịch trên một ít carrier thread. Lợi ích là throughput với tác vụ chặn I/O, không tăng tốc tính toán CPU. Không cần pool; giới hạn tài nguyên downstream bằng Semaphore. Ở Java 21–23, chặn I/O bên trong `synchronized` làm virtual thread bị **pin** vào carrier (giảm khả năng mở rộng) — JEP 491 (Java 24) đã khắc phục phần lớn trường hợp. Spring Boot 3.2+ bật bằng `spring.threads.virtual.enabled=true`.',
    tags: ['virtual-threads', 'loom', 'java21'], sec: 60, ver: 'Java 21+',
  },
  {
    id: 'CON-023', topic: 'Các tình huống xử lý đồng thời trong Backend', d: 's', cat: 'scenario',
    q: 'API đặt hàng flash sale chạy trên 4 instance. Code hiện tại: đọc `stock` → nếu `stock >= qty` thì `UPDATE product SET stock = :newStock`. Khi tải cao bị bán vượt tồn kho (oversell). Giải pháp nào đúng và hiệu quả nhất?',
    opts: [
      'Thêm synchronized vào method đặt hàng',
      'Dùng câu lệnh cập nhật nguyên tử có điều kiện: `UPDATE product SET stock = stock - :qty WHERE id = :id AND stock >= :qty`, kiểm tra số dòng bị ảnh hưởng (0 → hết hàng)',
      'Tăng isolation level lên READ UNCOMMITTED',
      'Đọc lại stock hai lần trước khi cập nhật',
    ], ans: 'B',
    exp: 'Đây là race condition check-then-act giữa nhiều instance; synchronized chỉ có tác dụng trong một JVM. Đẩy điều kiện vào câu UPDATE để DB thực hiện kiểm tra và cập nhật nguyên tử trên một dòng (row lock). Lựa chọn khác: optimistic locking (@Version + retry), `SELECT ... FOR UPDATE`, hoặc trừ kho trên Redis bằng lệnh nguyên tử với tải cực cao. READ UNCOMMITTED làm tệ hơn.',
    tags: ['oversell', 'atomic-update', 'distributed'], sec: 70,
  },
  {
    id: 'CON-024', topic: 'Các tình huống xử lý đồng thời trong Backend', d: 'a', cat: 'scenario',
    q: 'Job `@Scheduled(cron = "0 0 1 * * *")` tính lãi hằng ngày. Sau khi scale ứng dụng lên 3 pod, khách hàng được cộng lãi 3 lần. Cách khắc phục phù hợp?',
    opts: [
      'Thêm synchronized vào method job',
      'Dùng cơ chế khóa phân tán cho scheduler (ví dụ ShedLock dựa trên bảng DB/Redis) hoặc chạy job ở một thành phần riêng; đồng thời làm job idempotent (đánh dấu ngày đã tính)',
      'Giảm xuống 1 pod vĩnh viễn',
      'Đổi cron sang fixedDelay',
    ], ans: 'B',
    exp: 'Mỗi pod có scheduler riêng nên job chạy ở mọi instance. Cần đảm bảo "chỉ một instance thực thi" bằng distributed lock (ShedLock, Quartz cluster mode với JDBC JobStore) hoặc tách ra batch/CronJob của Kubernetes. Lock có thể hết hạn hoặc job có thể chạy lại khi lỗi, nên job phải idempotent (ví dụ unique constraint theo account + ngày).',
    tags: ['scheduled', 'distributed-lock', 'shedlock', 'idempotency'], sec: 55,
  },
  {
    id: 'CON-025', topic: 'Thread và Runnable', d: 'i', cat: 'bug',
    q: 'Đoạn code xử lý `InterruptedException` sau có vấn đề gì?',
    code: `
while (!Thread.currentThread().isInterrupted()) {
    try {
        Job job = queue.take();
        process(job);
    } catch (InterruptedException e) {
        log.warn("interrupted");
    }
}`,
    opts: [
      'Không có vấn đề',
      'Khi InterruptedException được ném, cờ interrupt đã bị xóa; nuốt exception mà không gọi `Thread.currentThread().interrupt()` (hoặc thoát vòng lặp) khiến thread không dừng khi executor shutdownNow()',
      'queue.take() không bao giờ ném InterruptedException',
      'Phải dùng catch (Exception e)',
    ], ans: 'B',
    exp: 'Các method chặn ném InterruptedException và **reset cờ interrupt**. Vòng lặp kiểm tra `isInterrupted()` sẽ thấy false và tiếp tục chạy mãi, làm ứng dụng không shutdown gọn. Cách đúng: khôi phục cờ (`Thread.currentThread().interrupt()`) rồi `break`/return, hoặc ném tiếp lên trên.',
    tags: ['interrupt', 'shutdown'], sec: 45,
  },
  {
    id: 'CON-026', topic: 'Thread Safety', d: 'i', cat: 'scenario',
    q: 'Một Spring `@Service` (singleton) có field `private static final SimpleDateFormat FMT = new SimpleDateFormat("yyyy-MM-dd");` dùng để parse ngày trong mọi request. Khi tải cao, thỉnh thoảng ngày bị parse sai hoặc ném NumberFormatException. Cách sửa?',
    opts: [
      'Thêm volatile cho FMT',
      'SimpleDateFormat không thread-safe (có trạng thái nội bộ); dùng `DateTimeFormatter` (immutable, thread-safe) của java.time',
      'Đổi service sang scope prototype',
      'Gọi FMT.clone() trước mỗi lần dùng là cách duy nhất',
    ], ans: 'B',
    exp: 'SimpleDateFormat lưu Calendar nội bộ và thay đổi trong lúc format/parse; dùng chung giữa nhiều thread gây kết quả sai hoặc exception. `DateTimeFormatter` là immutable nên có thể dùng làm hằng static. Nhắc lại: Spring bean mặc định là singleton, mọi field có trạng thái mutable đều phải thread-safe.',
    tags: ['thread-safety', 'simpledateformat', 'singleton'], sec: 45,
  },
  {
    id: 'CON-027', topic: 'Thread và Runnable', d: 'i', cat: 'runtime',
    q: 'Điều gì xảy ra khi chạy đoạn code sau?',
    code: `
Object lock = new Object();
lock.wait(1000);`,
    opts: ['Thread chờ 1 giây rồi tiếp tục', 'Ném IllegalMonitorStateException vì thread hiện tại không giữ monitor của lock', 'Lỗi compile', 'Deadlock'], ans: 'B',
    exp: '`wait()`, `notify()`, `notifyAll()` chỉ được gọi khi thread đang giữ monitor của object (trong `synchronized (lock) { ... }`), nếu không sẽ ném IllegalMonitorStateException. Ngoài ra `wait` phải được gọi trong vòng lặp kiểm tra điều kiện để xử lý spurious wakeup. Code hiện đại nên dùng BlockingQueue, CountDownLatch hoặc Condition thay vì wait/notify.',
    tags: ['wait-notify', 'monitor'], sec: 35,
  },
  {
    id: 'CON-028', topic: 'ExecutorService', d: 'b', cat: 'theory',
    q: 'Chương trình main tạo `Executors.newFixedThreadPool(4)`, submit task, in kết quả nhưng không gọi `shutdown()`. Điều gì xảy ra sau khi main kết thúc?',
    opts: [
      'JVM thoát ngay khi main kết thúc',
      'JVM không thoát vì các worker thread là non-daemon và vẫn chờ task mới',
      'Executor tự shutdown khi main kết thúc',
      'Ném IllegalStateException',
    ], ans: 'B',
    exp: 'JVM chỉ thoát khi mọi non-daemon thread kết thúc. Thread của pool mặc định là non-daemon và sống chờ task. Cần `shutdown()` rồi `awaitTermination(...)` (hoặc dùng try-with-resources với ExecutorService từ Java 19+). Trong Spring, nên dùng bean `ThreadPoolTaskExecutor` để container quản lý vòng đời.',
    tags: ['executorservice', 'shutdown', 'daemon'], sec: 35,
  },
  {
    id: 'CON-029', topic: 'volatile', d: 'a', cat: 'design',
    q: 'Một bean giữ cấu hình định giá được reload mỗi 5 phút bởi một thread nền, và được đọc bởi hàng trăm thread request. Thiết kế nào đúng và hiệu quả?',
    code: `
class PricingConfigHolder {
    private volatile PricingConfig current;   // PricingConfig là immutable (field final)

    void reload() { this.current = PricingConfig.load(); }
    PricingConfig get() { return current; }
}`,
    opts: [
      'Sai: phải synchronized cả get() và reload()',
      'Đúng: tham chiếu volatile tới object immutable — thread ghi tạo object mới hoàn chỉnh rồi gán một lần; mọi thread đọc thấy tham chiếu mới nhất và object được publish an toàn, không cần khóa',
      'Sai: volatile không dùng được với object',
      'Đúng nhưng chỉ khi PricingConfig có setter',
    ], ans: 'B',
    exp: 'Mẫu "copy-on-write qua tham chiếu volatile" rất phổ biến cho cấu hình/routing table: một người ghi, nhiều người đọc, không cần lock. Điểm then chốt là object phải immutable — nếu reload sửa trực tiếp các field của object hiện tại, thread đọc có thể thấy trạng thái nửa cũ nửa mới. Thread đọc nên lấy tham chiếu một lần vào biến cục bộ khi cần nhiều giá trị nhất quán.',
    tags: ['volatile', 'immutable', 'safe-publication'], sec: 55,
  },
  {
    id: 'CON-030', topic: 'Atomic Classes', d: 'i', cat: 'theory',
    q: 'Nhiều thread cùng ghi nhận độ trễ request và cần lưu giá trị **lớn nhất** đã thấy trong `AtomicLong maxLatency`. Cách cập nhật nào đúng?',
    opts: [
      'if (v > maxLatency.get()) maxLatency.set(v);',
      'maxLatency.accumulateAndGet(v, Math::max);  // hoặc vòng lặp compareAndSet',
      'maxLatency.addAndGet(v);',
      'synchronized (this) { maxLatency.get(); } maxLatency.set(v);',
    ], ans: 'B',
    exp: 'Cách đầu là check-then-act: giữa get() và set() thread khác có thể đã ghi giá trị lớn hơn, rồi bị ghi đè bằng giá trị nhỏ hơn. `accumulateAndGet`/`updateAndGet` (Java 8) thực hiện vòng lặp CAS bên trong cho tới khi cập nhật thành công. Hàm truyền vào phải không có side effect vì có thể bị gọi lại nhiều lần.',
    tags: ['atomic', 'cas', 'check-then-act'], sec: 45,
  },
  {
    id: 'CON-031', topic: 'Virtual Threads', d: 's', cat: 'debug',
    q: 'Ứng dụng Java 21 bật virtual threads. Dưới tải cao, throughput không tăng như kỳ vọng; JFR báo nhiều sự kiện `jdk.VirtualThreadPinned`. Code truy cập DB nằm trong khối `synchronized`. Giải thích và cách khắc phục?',
    code: `
public synchronized Order load(long id) {
    return jdbcTemplate.queryForObject(SQL, mapper, id);  // chặn I/O
}`,
    opts: [
      'Virtual threads không hỗ trợ JDBC',
      'Ở Java 21–23, virtual thread chặn I/O bên trong `synchronized` bị **pin** vào carrier thread (không unmount được), làm cạn số ít carrier thread. Thay synchronized bằng `ReentrantLock` quanh đoạn chặn (hoặc bỏ khóa nếu không cần), hoặc nâng lên Java 24+ (JEP 491)',
      'Phải tăng -Xss',
      'Phải dùng parallelStream',
    ], ans: 'B',
    exp: 'Pinning cũng xảy ra khi gọi native code. Nhiều driver/thư viện đã thay synchronized bằng ReentrantLock để thân thiện với virtual threads. Ngoài ra, connection pool vẫn là giới hạn: hàng nghìn virtual thread sẽ xếp hàng chờ connection — cần giới hạn đồng thời phù hợp.',
    tags: ['virtual-threads', 'pinning', 'java21'], sec: 65, ver: 'Java 21–23',
  },
  {
    id: 'CON-032', topic: 'Callable và Future', d: 'i', cat: 'bug',
    q: 'Code gọi song song dịch vụ tính phí và chờ kết quả. Thỉnh thoảng request bị treo vô thời hạn. Vấn đề và cách sửa?',
    code: `
Future<BigDecimal> fee = executor.submit(() -> feeClient.calculate(order));
BigDecimal value = fee.get();`,
    opts: [
      'submit phải đổi thành execute',
      '`get()` không timeout chặn mãi nếu task không bao giờ hoàn thành (ví dụ HTTP client không có timeout). Dùng `fee.get(2, TimeUnit.SECONDS)`, xử lý TimeoutException và `fee.cancel(true)`; đồng thời đặt timeout cho chính lời gọi HTTP',
      'Future không hỗ trợ BigDecimal',
      'Phải gọi fee.isDone() trong vòng while',
    ], ans: 'B',
    exp: 'Mọi thao tác chờ (Future.get, CountDownLatch.await, BlockingQueue.take, CompletableFuture.join) ở đường xử lý request nên có giới hạn thời gian. `cancel(true)` chỉ gửi interrupt — task phải phản hồi interrupt (hoặc I/O có timeout) thì mới thực sự dừng. Vòng while kiểm tra isDone gây busy-waiting tốn CPU.',
    tags: ['future', 'timeout', 'cancel'], sec: 45,
  },
  {
    id: 'CON-033', topic: 'Race Condition', d: 'i', cat: 'bug',
    q: 'Bean singleton nạp danh mục tỉnh/thành lần đầu khi có request. Khi ứng dụng vừa khởi động và nhận nhiều request cùng lúc, log cho thấy `loadFromDb()` bị gọi nhiều lần. Phân tích đúng?',
    code: `
private List<Province> cache;

public List<Province> provinces() {
    if (cache == null) {
        cache = loadFromDb();
    }
    return cache;
}`,
    opts: [
      'Không có vấn đề vì List thread-safe',
      'Race condition check-then-act: nhiều thread cùng thấy cache == null và cùng nạp. Ngoài ra không có happens-before nên thread khác có thể không thấy giá trị mới. Có thể nạp sẵn lúc khởi động (eager), dùng holder idiom/`volatile` + double-checked locking, hoặc cache có cơ chế load an toàn (Caffeine, @Cacheable với `sync = true`)',
      'Chỉ cần đổi List thành ArrayList',
      'Do GC xóa cache',
    ], ans: 'B',
    exp: 'Trường hợp này "chỉ" tốn thêm vài truy vấn, nhưng cùng mẫu lỗi có thể gây hậu quả nặng (khởi tạo kết nối nhiều lần, ghi trùng dữ liệu). Với dữ liệu tham chiếu nhỏ, nạp ở ApplicationReadyEvent hoặc constructor là cách đơn giản và an toàn nhất.',
    tags: ['race-condition', 'lazy-init', 'singleton'], sec: 50,
  },
]);
