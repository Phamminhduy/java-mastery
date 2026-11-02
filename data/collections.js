/* Module 3: Collections Framework */
QB.module({
  id: 'collections', order: 3, title: 'Collections Framework',
  description: 'List, Set, Map, Queue, HashMap internals, Comparator, fail-fast/fail-safe, ConcurrentHashMap và độ phức tạp.',
  topics: ['List, Set, Map và Queue', 'ArrayList và LinkedList', 'HashMap và cách hoạt động', 'HashSet', 'TreeMap và TreeSet',
    'Comparable và Comparator', 'Hash Collision', 'equals() và hashCode()', 'Fail-fast và Fail-safe', 'Iterator', 'ConcurrentHashMap',
    'Time Complexity của các cấu trúc dữ liệu'],
}, [
  {
    id: 'COL-001', topic: 'Fail-fast và Fail-safe', d: 'i', cat: 'runtime',
    q: 'Điều gì xảy ra khi chạy đoạn code sau?',
    code: `
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
for (String s : list) {
    if (s.equals("a")) {
        list.remove(s);
    }
}
System.out.println(list);`,
    opts: ['In [b, c]', 'Ném ConcurrentModificationException', 'In [a, b, c]', 'Ném UnsupportedOperationException'], ans: 'B',
    exp: 'Vòng for-each dùng Iterator của ArrayList, vốn là **fail-fast**: nó ghi nhớ `modCount` lúc tạo. `list.remove(s)` sửa list trực tiếp làm modCount thay đổi; ở lần gọi `next()` tiếp theo, iterator phát hiện và ném `ConcurrentModificationException`. Cách đúng: `list.removeIf(s -> s.equals("a"))` hoặc dùng `iterator.remove()`.',
    tags: ['cme', 'iterator', 'fail-fast'], sec: 45,
  },
  {
    id: 'COL-002', topic: 'Fail-fast và Fail-safe', d: 'a', cat: 'output',
    q: 'Cùng ý tưởng nhưng xóa phần tử "b" (áp chót). Kết quả là gì?',
    code: `
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
for (String s : list) {
    if (s.equals("b")) {
        list.remove(s);
    }
}
System.out.println(list);`,
    opts: ['Ném ConcurrentModificationException', 'In [a, c]', 'In [a, b, c]', 'In [a]'], ans: 'B',
    exp: 'Một trường hợp đặc biệt: sau khi xóa "b", size = 2 và con trỏ (cursor) của iterator cũng bằng 2. `hasNext()` chỉ kiểm tra `cursor != size` → false, vòng lặp kết thúc **trước khi** `next()` kiểm tra modCount. Vì vậy không có exception và phần tử "c" không được duyệt. Fail-fast chỉ là cơ chế "best-effort", không phải đảm bảo — không được dựa vào nó để đúng logic.',
    tags: ['cme', 'iterator', 'fail-fast'], sec: 75,
  },
  {
    id: 'COL-003', topic: 'Iterator', d: 'b', cat: 'theory',
    q: 'Cách nào xóa an toàn các đơn hàng đã hủy khỏi một `ArrayList<Order>` trong khi duyệt?',
    opts: [
      'Dùng for-each và gọi list.remove(order)',
      '`orders.removeIf(Order::isCancelled)` hoặc dùng Iterator và gọi `it.remove()`',
      'Dùng for (int i = 0; i < size; i++) với size lưu trước vòng lặp và remove(i)',
      'Bọc list bằng Collections.synchronizedList rồi xóa trong for-each',
    ], ans: 'B',
    exp: '`Iterator.remove()` xóa phần tử vừa trả về bởi `next()` và cập nhật trạng thái iterator đồng bộ với list. `removeIf` (Java 8) làm điều này gọn và hiệu quả hơn. Vòng for theo index với size cố định sẽ bỏ sót phần tử hoặc ném IndexOutOfBoundsException; synchronizedList không liên quan đến CME trong cùng thread.',
    tags: ['iterator', 'removeif'], sec: 35,
  },
  {
    id: 'COL-004', topic: 'List, Set, Map và Queue', d: 'b', cat: 'runtime',
    q: 'Kết quả của đoạn code sau?',
    code: `
List<String> list = Arrays.asList("x", "y");
list.set(0, "z");
list.add("w");
System.out.println(list);`,
    opts: ['[z, y, w]', 'Ném UnsupportedOperationException ở dòng add', 'Ném UnsupportedOperationException ở dòng set', '[x, y, w]'], ans: 'B',
    exp: '`Arrays.asList` trả về list **kích thước cố định** được hỗ trợ bởi mảng gốc: `set()` được phép (ghi xuống mảng), nhưng `add/remove` ném `UnsupportedOperationException`. Khác với `List.of(...)` (Java 9) là hoàn toàn immutable (cả set cũng lỗi) và không chấp nhận null.',
    tags: ['arrays-aslist', 'immutable'], sec: 35,
  },
  {
    id: 'COL-005', topic: 'List, Set, Map và Queue', d: 'i', cat: 'runtime',
    q: 'Dòng nào ném exception?',
    code: `
List<String> a = new ArrayList<>(); a.add(null);          // (1)
List<String> b = List.of("x", null);                       // (2)
Map<String, String> c = new HashMap<>(); c.put(null, "v"); // (3)
Set<String> d = new HashSet<>(); d.add(null);              // (4)`,
    opts: ['(1)', '(2)', '(3)', '(4)'], ans: 'B', fixed: true,
    exp: 'Các factory `List.of`, `Set.of`, `Map.of` (Java 9+) **không chấp nhận null** và ném NullPointerException. ArrayList cho phép null; HashMap cho phép một key null và nhiều value null; HashSet cho phép một phần tử null.',
    tags: ['list-of', 'null'], sec: 40, ver: 'Java 9+',
  },
  {
    id: 'COL-006', topic: 'HashMap và cách hoạt động', d: 'a', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
Map<List<String>, String> m = new HashMap<>();
List<String> key = new ArrayList<>(List.of("a"));
m.put(key, "value");
key.add("b");
System.out.println(m.get(key) + " " + m.size());`,
    opts: ['value 1', 'null 1', 'null 0', 'value 2'], ans: 'B',
    exp: 'Entry được đặt vào bucket theo hashCode của key **tại thời điểm put**. Sau khi sửa key, hashCode thay đổi nên `get(key)` tìm ở bucket khác → null (thường gặp), nhưng entry vẫn còn trong map (size 1) và gần như không thể truy cập. Quy tắc: key của HashMap/phần tử HashSet phải immutable, hoặc ít nhất các field dùng trong hashCode/equals không được thay đổi.',
    tags: ['hashmap', 'mutable-key'], sec: 60,
  },
  {
    id: 'COL-007', topic: 'HashMap và cách hoạt động', d: 'a', cat: 'theory',
    q: 'Phát biểu nào đúng về HashMap trong Java 8+?',
    opts: [
      'Mỗi bucket luôn là LinkedList, nên trường hợp xấu nhất luôn là O(n)',
      'Khi một bucket có từ 8 node trở lên và capacity bảng ≥ 64, bucket được chuyển thành Red-Black Tree, giảm trường hợp xấu xuống O(log n)',
      'HashMap tự động sắp xếp key theo thứ tự tăng dần',
      'HashMap dùng mutex cho mỗi bucket nên thread-safe',
    ], ans: 'B',
    exp: 'Java 8 thêm treeification: `TREEIFY_THRESHOLD = 8`, `MIN_TREEIFY_CAPACITY = 64` (nếu bảng nhỏ hơn 64 thì resize thay vì treeify), và chuyển ngược về list khi còn ≤ 6 node. Điều này hạn chế tấn công hash collision (HashDoS). HashMap không có thứ tự và không thread-safe.',
    tags: ['hashmap', 'treeify', 'internals'], sec: 50, ver: 'Java 8+',
  },
  {
    id: 'COL-008', topic: 'HashMap và cách hoạt động', d: 'i', cat: 'perf',
    q: 'Bạn biết trước sẽ nạp đúng 13.000 entry vào một HashMap (load factor mặc định 0.75). Cách khởi tạo nào đảm bảo **không** phải resize lần nào?',
    opts: [
      'new HashMap<>() — capacity mặc định tự đủ',
      'new HashMap<>(13_000) — capacity đã lớn hơn số entry nên không resize',
      'new HashMap<>((int) (13_000 / 0.75f) + 1), hoặc HashMap.newHashMap(13_000) từ Java 19',
      'Chỉ có thể tránh resize bằng new HashMap<>(13_000, 1.0f)',
    ], ans: 'C',
    exp: 'HashMap resize khi size vượt `threshold = capacity × loadFactor`. Capacity luôn được làm tròn lên lũy thừa của 2.\n• `new HashMap<>(13_000)` → capacity 16.384, threshold 12.288 < 13.000 → vẫn resize một lần (rehash toàn bộ).\n• `13_000 / 0.75 + 1 = 17.334` → capacity 32.768, threshold 24.576 → không resize. Java 19 thêm `HashMap.newHashMap(n)` tính sẵn công thức này.\n• Mặc định (16) phải resize khoảng 11 lần.\nLoad factor 1.0 cũng tránh được resize trong trường hợp này nhưng không phải cách duy nhất, và làm tăng collision.',
    why: { B: 'Threshold = 16.384 × 0.75 = 12.288, nhỏ hơn 13.000 nên vẫn resize.', D: 'Không phải cách duy nhất; công thức expected/0.75 cũng tránh được resize mà giữ load factor chuẩn.' },
    tags: ['hashmap', 'capacity', 'load-factor'], sec: 60,
  },
  {
    id: 'COL-009', topic: 'ConcurrentHashMap', d: 'i', cat: 'runtime',
    q: 'Đoạn code chuyển từ HashMap sang ConcurrentHashMap để chạy đa luồng. Điều gì xảy ra khi `config.get("timeout")` trả về null?',
    code: `
Map<String, String> cache = new ConcurrentHashMap<>();
cache.put("timeout", config.get("timeout"));`,
    opts: ['Lưu entry với value null', 'Ném NullPointerException', 'Bỏ qua lệnh put', 'Xóa key "timeout" nếu đã tồn tại'], ans: 'B',
    exp: 'ConcurrentHashMap (và Hashtable) **không cho phép key hoặc value null**. Lý do: trong môi trường đồng thời, `get()` trả về null không phân biệt được "không có key" hay "value là null" mà không có khóa toàn cục. Khi migrate từ HashMap cần kiểm tra null hoặc dùng Optional/giá trị sentinel.',
    tags: ['concurrenthashmap', 'null'], sec: 35,
  },
  {
    id: 'COL-010', topic: 'ArrayList và LinkedList', d: 'i', cat: 'tradeoff',
    q: 'Một API đọc danh sách 50.000 bản ghi, sau đó truy cập ngẫu nhiên theo index và thỉnh thoảng append vào cuối. Đồng nghiệp đề xuất LinkedList "vì thêm/xóa nhanh hơn". Đánh giá nào chính xác?',
    opts: [
      'LinkedList tốt hơn trong mọi trường hợp có thêm phần tử',
      'ArrayList phù hợp hơn: get(i) O(1) và append amortized O(1); LinkedList get(i) O(n), tốn bộ nhớ cho node và kém thân thiện với CPU cache',
      'Hai loại tương đương về hiệu năng',
      'Nên dùng Vector vì thread-safe',
    ], ans: 'B',
    exp: 'LinkedList chỉ thêm/xóa O(1) **khi đã có vị trí node** (qua iterator hoặc ở đầu/cuối); thêm vào giữa theo index vẫn cần duyệt O(n). Mỗi node chứa 2 con trỏ và header object nên tốn bộ nhớ gấp nhiều lần, dữ liệu rải rác gây cache miss. Thực tế ArrayList (hoặc ArrayDeque cho hàng đợi) nhanh hơn trong hầu hết trường hợp.',
    tags: ['arraylist', 'linkedlist', 'complexity'], sec: 50,
  },
  {
    id: 'COL-011', topic: 'ArrayList và LinkedList', d: 'b', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
List<Integer> ids = new ArrayList<>(List.of(10, 20, 30));
ids.remove(1);
System.out.println(ids);`,
    opts: ['[20, 30]', '[10, 30]', '[10, 20, 30]', 'Ném IndexOutOfBoundsException'], ans: 'B',
    exp: '`List<Integer>` có hai overload: `remove(int index)` và `remove(Object o)`. Đối số `1` là int nên khớp `remove(int index)` (không cần boxing) → xóa phần tử ở index 1 (giá trị 20). Muốn xóa giá trị 1 phải viết `ids.remove(Integer.valueOf(1))`.',
    tags: ['arraylist', 'overloading', 'remove'], sec: 35,
  },
  {
    id: 'COL-012', topic: 'TreeMap và TreeSet', d: 'a', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
Set<String> s = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
s.add("Java");
s.add("JAVA");
s.add("java");
System.out.println(s.size() + " " + s);`,
    opts: ['3 [JAVA, Java, java]', '1 [Java]', '1 [java]', '3 [Java, JAVA, java]'], ans: 'B',
    exp: 'TreeSet/TreeMap xác định phần tử trùng bằng **comparator** (compare == 0), không dùng equals. Với CASE_INSENSITIVE_ORDER, "JAVA" và "java" được coi là trùng với "Java" đã có nên `add` trả về false và giữ phần tử đầu tiên. Khi comparator không nhất quán với equals, Set có thể hành xử khác với hợp đồng của interface Set.',
    tags: ['treeset', 'comparator', 'consistent-with-equals'], sec: 50,
  },
  {
    id: 'COL-013', topic: 'TreeMap và TreeSet', d: 'i', cat: 'runtime',
    q: '`Employee` không implements `Comparable`. Điều gì xảy ra?',
    code: `
Map<Employee, Integer> bonus = new TreeMap<>();
bonus.put(new Employee("An"), 100);`,
    opts: ['Thêm thành công, sắp xếp theo hashCode', 'Ném ClassCastException ngay từ lần put đầu tiên', 'Lỗi compile', 'Thêm thành công, lỗi chỉ xảy ra ở lần put thứ hai'], ans: 'B',
    exp: 'TreeMap không có Comparator sẽ ép key về `Comparable`. Từ Java 7, ngay lần put đầu tiên TreeMap gọi `compare(key, key)` để kiểm tra kiểu (và null), nên ném `ClassCastException` ngay. Compiler không phát hiện vì generic của TreeMap không ràng buộc `K extends Comparable`. Cần truyền Comparator hoặc implements Comparable.',
    tags: ['treemap', 'comparable'], sec: 40,
  },
  {
    id: 'COL-014', topic: 'Comparable và Comparator', d: 'i', cat: 'theory',
    q: 'Cần sắp xếp nhân viên theo phòng ban **tăng dần**, cùng phòng thì lương **giảm dần**. Comparator nào đúng?',
    opts: [
      'Comparator.comparing(Employee::dept).thenComparing(Employee::salary).reversed()',
      'Comparator.comparing(Employee::dept).thenComparing(Employee::salary, Comparator.reverseOrder())',
      'Comparator.comparing(Employee::salary).reversed().thenComparing(Employee::dept)',
      'Comparator.comparing(Employee::dept).reversed().thenComparing(Employee::salary)',
    ], ans: 'B',
    exp: '`thenComparing(keyExtractor, Comparator.reverseOrder())` chỉ đảo thứ tự của tiêu chí thứ hai. `.reversed()` đặt ở cuối sẽ đảo **toàn bộ** comparator đã xây dựng (phòng ban cũng giảm dần). Phương án đặt salary trước sai thứ tự ưu tiên tiêu chí.',
    tags: ['comparator', 'sorting'], sec: 50, ver: 'Java 8+',
  },
  {
    id: 'COL-015', topic: 'Comparable và Comparator', d: 'a', cat: 'bug',
    q: 'Comparator sau dùng để sắp xếp theo điểm uy tín (có thể âm hoặc rất lớn). Bug tiềm ẩn là gì?',
    code: `
Comparator<Account> byScore = (a, b) -> a.getScore() - b.getScore();`,
    opts: [
      'Không có bug',
      'Phép trừ int có thể tràn số (ví dụ Integer.MAX_VALUE - (-1)), cho dấu sai và thứ tự sắp xếp sai; nên dùng Integer.compare hoặc Comparator.comparingInt',
      'Lambda không thể dùng làm Comparator',
      'Comparator phải trả về -1, 0, 1',
    ], ans: 'B',
    exp: 'Khi chênh lệch vượt phạm vi int, kết quả trừ bị tràn và đổi dấu, vi phạm contract của Comparator (có thể làm TimSort ném "Comparison method violates its general contract!"). `Integer.compare(a, b)` hoặc `Comparator.comparingInt(Account::getScore)` an toàn. Comparator chỉ cần trả về số âm/0/dương, không bắt buộc -1/0/1.',
    tags: ['comparator', 'overflow'], sec: 45,
  },
  {
    id: 'COL-016', topic: 'Hash Collision', d: 'i', cat: 'perf',
    q: 'Một class key có `hashCode()` luôn `return 1;` (equals cài đặt đúng). 100.000 entry được đưa vào HashMap. Hệ quả là gì?',
    opts: [
      'Map hoạt động sai: get trả về sai giá trị',
      'Kết quả vẫn đúng nhưng mọi entry rơi vào một bucket; hiệu năng get/put suy giảm từ O(1) xuống O(n), hoặc O(log n) nếu key implements Comparable (sau khi treeify)',
      'Ném IllegalStateException khi quá nhiều collision',
      'Không ảnh hưởng vì HashMap dùng equals để phân bucket',
    ], ans: 'B',
    exp: 'hashCode hằng số vẫn tuân thủ contract (equals ⇒ cùng hash) nên kết quả **đúng**, nhưng phá hỏng phân tán bucket. Java 8 treeify bucket lớn; nếu key là Comparable thì tree sắp xếp theo compareTo cho O(log n), nếu không phải so sánh theo tie-break kém hiệu quả hơn. hashCode tốt cần phân tán đều, ví dụ `Objects.hash(field1, field2)`.',
    tags: ['hash-collision', 'hashcode', 'performance'], sec: 50,
  },
  {
    id: 'COL-017', topic: 'HashSet', d: 'b', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
Set<String> s = new HashSet<>();
System.out.println(s.add("x") + " " + s.add("x") + " " + s.size());`,
    opts: ['true true 2', 'true false 1', 'false false 1', 'true false 2'], ans: 'B',
    exp: 'HashSet được cài đặt bằng HashMap bên trong (phần tử là key, value là một object dùng chung). `add` trả về true nếu phần tử chưa có, false nếu đã tồn tại (theo hashCode + equals). Set không chứa phần tử trùng nên size = 1.',
    tags: ['hashset'], sec: 30,
  },
  {
    id: 'COL-018', topic: 'Fail-fast và Fail-safe', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
List<String> l = new CopyOnWriteArrayList<>(List.of("a", "b"));
for (String s : l) {
    l.add("x");
}
System.out.println(l.size());`,
    opts: ['2', '4', 'Ném ConcurrentModificationException', 'Vòng lặp vô hạn'], ans: 'B',
    exp: 'Iterator của CopyOnWriteArrayList duyệt trên **snapshot** mảng tại thời điểm tạo (fail-safe/weakly consistent), không thấy các phần tử thêm sau và không ném CME. Vòng lặp chạy 2 lần, mỗi lần thêm một "x" → size 4. Mỗi lần ghi copy toàn bộ mảng nên chỉ phù hợp khi đọc nhiều, ghi rất ít (ví dụ danh sách listener).',
    tags: ['copyonwritearraylist', 'fail-safe'], sec: 45,
  },
  {
    id: 'COL-019', topic: 'ConcurrentHashMap', d: 'i', cat: 'bug',
    q: 'Code đếm số lần gọi API theo clientId, chạy trên nhiều thread. Kết quả đếm thường thấp hơn thực tế. Cách sửa đúng?',
    code: `
private final Map<String, Integer> counts = new ConcurrentHashMap<>();

void hit(String clientId) {
    Integer c = counts.get(clientId);
    counts.put(clientId, c == null ? 1 : c + 1);
}`,
    opts: [
      'Đổi sang HashMap và thêm volatile',
      'Dùng thao tác nguyên tử: `counts.merge(clientId, 1, Integer::sum)` (hoặc ConcurrentHashMap<String, LongAdder> với computeIfAbsent(...).increment())',
      'Không cần sửa vì ConcurrentHashMap đã thread-safe',
      'Bọc get và put bằng hai khối synchronized riêng',
    ], ans: 'B',
    exp: 'ConcurrentHashMap chỉ đảm bảo **từng thao tác** đơn lẻ an toàn. Chuỗi get → tính → put là check-then-act, hai thread có thể cùng đọc giá trị cũ và ghi đè nhau (lost update). `merge`/`compute` thực hiện nguyên tử trên entry. Với lưu lượng rất cao, `LongAdder` giảm tranh chấp. Hai khối synchronized riêng vẫn không nguyên tử.',
    tags: ['concurrenthashmap', 'atomicity', 'race-condition'], sec: 55,
  },
  {
    id: 'COL-020', topic: 'ConcurrentHashMap', d: 's', cat: 'design',
    q: 'Bạn dùng `cache.computeIfAbsent(key, k -> remoteClient.load(k))` với ConcurrentHashMap làm cache, remote call mất 2–3 giây. Khi tải cao, nhiều request khác key cũng bị chậm theo. Giải thích và hướng xử lý tốt nhất?',
    opts: [
      'ConcurrentHashMap khóa toàn bộ map khi compute; đổi sang Hashtable',
      'Mapping function chạy trong khi giữ lock của bin/node; các key khác cùng bin (và các thao tác cập nhật bin đó) bị chặn. Function phải ngắn; nên dùng cache có async loading (ví dụ Caffeine) hoặc lưu CompletableFuture làm value',
      'Do JIT chưa warm-up',
      'Do computeIfAbsent gọi remote nhiều lần cho cùng một key',
    ], ans: 'B',
    exp: 'Javadoc của ConcurrentHashMap.computeIfAbsent: một số cập nhật khác trên map có thể bị chặn trong lúc tính toán, nên function phải ngắn, đơn giản và không được sửa các mapping khác (Java 9+ có thể ném IllegalStateException "Recursive update"). Gọi I/O chậm bên trong làm giữ lock lâu. Giải pháp: `computeIfAbsent(key, k -> CompletableFuture.supplyAsync(...))` (lock chỉ giữ khi tạo future) hoặc thư viện cache chuyên dụng như Caffeine có TTL, giới hạn kích thước và loading bất đồng bộ.',
    tags: ['concurrenthashmap', 'computeifabsent', 'cache'], sec: 75,
  },
  {
    id: 'COL-021', topic: 'List, Set, Map và Queue', d: 'b', cat: 'theory',
    q: 'Với `Queue<String> q = new ArrayDeque<>();` đang rỗng, hai lời gọi `q.poll()` và `q.remove()` cho kết quả gì?',
    opts: [
      'Cả hai trả về null',
      'poll() trả về null; remove() ném NoSuchElementException',
      'poll() ném NoSuchElementException; remove() trả về null',
      'Cả hai ném exception',
    ], ans: 'B',
    exp: 'Interface Queue có hai nhóm method: nhóm ném exception (`add`, `remove`, `element`) và nhóm trả giá trị đặc biệt (`offer` trả false, `poll`/`peek` trả null). Nên dùng ArrayDeque thay cho `Stack`/`LinkedList` khi cần stack hoặc queue trong một thread (ArrayDeque không chấp nhận null).',
    tags: ['queue', 'arraydeque'], sec: 30,
  },
  {
    id: 'COL-022', topic: 'List, Set, Map và Queue', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
PriorityQueue<Integer> pq = new PriorityQueue<>(List.of(5, 1, 4, 2));
System.out.println(pq.poll() + " " + pq.poll() + " " + pq.peek());`,
    opts: ['5 1 4', '1 2 4', '1 2 2', '5 4 2'], ans: 'B',
    exp: 'PriorityQueue là min-heap mặc định: `poll()` lấy phần tử nhỏ nhất → 1, rồi 2; `peek()` xem phần tử nhỏ nhất còn lại mà không lấy ra → 4. Lưu ý: duyệt PriorityQueue bằng iterator/toString **không** theo thứ tự sắp xếp, chỉ thứ tự lấy ra bằng poll mới được đảm bảo.',
    tags: ['priorityqueue', 'heap'], sec: 40,
  },
  {
    id: 'COL-023', topic: 'Time Complexity của các cấu trúc dữ liệu', d: 'i', cat: 'theory', type: 'multiple',
    q: 'Chọn **2** phát biểu đúng về độ phức tạp thời gian (trường hợp trung bình).',
    opts: [
      'TreeMap.get(key) là O(log n)',
      'LinkedList.get(index) là O(1)',
      'HashMap.get(key) là O(1) trung bình',
      'ArrayList.contains(obj) là O(log n)',
    ], ans: ['A', 'C'],
    exp: 'TreeMap là Red-Black Tree → get/put/remove O(log n). HashMap O(1) trung bình (phụ thuộc chất lượng hashCode). LinkedList.get(index) phải duyệt từ đầu hoặc cuối → O(n). ArrayList.contains duyệt tuyến tính bằng equals → O(n); chỉ binarySearch trên list **đã sắp xếp** mới là O(log n).',
    tags: ['complexity', 'big-o'], sec: 45,
  },
  {
    id: 'COL-024', topic: 'Time Complexity của các cấu trúc dữ liệu', d: 'a', cat: 'design',
    q: 'Cần một cache LRU trong bộ nhớ, tối đa 1.000 phần tử, get/put O(1), dùng trong một thread (hoặc có đồng bộ bên ngoài). Cách cài đặt gọn nhất với JDK?',
    opts: [
      'TreeMap sắp xếp theo thời gian truy cập',
      'LinkedHashMap với accessOrder = true và override removeEldestEntry trả về size() > 1000',
      'ArrayList và xóa phần tử đầu khi đầy',
      'HashMap kèm một PriorityQueue theo timestamp',
    ], ans: 'B',
    exp: '`new LinkedHashMap<>(16, 0.75f, true)` duy trì danh sách liên kết theo **thứ tự truy cập**; mỗi `get` đưa entry về cuối. Override `removeEldestEntry` để tự loại phần tử ít dùng nhất sau mỗi put. Mọi thao tác O(1). LinkedHashMap không thread-safe; ở môi trường đa luồng/production nên dùng Caffeine.',
    tags: ['linkedhashmap', 'lru', 'cache'], sec: 50,
  },
  {
    id: 'COL-025', topic: 'List, Set, Map và Queue', d: 'i', cat: 'output',
    q: 'Kết quả in ra là gì?',
    code: `
List<String> src = new ArrayList<>(List.of("a"));
List<String> view = Collections.unmodifiableList(src);
List<String> copy = List.copyOf(src);
src.add("b");
System.out.println(view.size() + " " + copy.size());`,
    opts: ['1 1', '2 1', '2 2', 'Ném UnsupportedOperationException'], ans: 'B',
    exp: '`Collections.unmodifiableList` là **view** chỉ-đọc trên list gốc: không sửa được qua view, nhưng thay đổi ở list gốc vẫn hiển thị → size 2. `List.copyOf` tạo bản sao immutable độc lập → vẫn size 1. Dùng copyOf khi cần snapshot an toàn (ví dụ trong constructor của object immutable).',
    tags: ['unmodifiable', 'copyof', 'immutable'], sec: 40, ver: 'Java 10+',
  },
  {
    id: 'COL-026', topic: 'equals() và hashCode()', d: 's', cat: 'debug',
    q: 'JPA entity `Tag` dùng Lombok `@EqualsAndHashCode` trên field `id` (sinh bởi DB, IDENTITY). Code tạo `Tag` mới (id = null), thêm vào `Set<Tag> tags` (HashSet) của `Post`, rồi `save(post)`. Sau đó `post.getTags().contains(tag)` trả về false và `remove(tag)` không xóa được. Nguyên nhân?',
    opts: [
      'Hibernate tạo proxy khác class',
      'hashCode được tính khi id = null lúc add vào HashSet; sau persist id được gán nên hashCode thay đổi, phần tử nằm sai bucket',
      'HashSet không hỗ trợ entity JPA',
      'Do transaction chưa commit',
    ], ans: 'B',
    exp: 'Đây là trường hợp "mutable key" trong thực tế. Cách phổ biến: dùng business key bất biến (ví dụ `slug`, `code`) cho equals/hashCode; hoặc equals theo id (chỉ khi id khác null) và hashCode trả về hằng theo class (`getClass().hashCode()`) để không đổi suốt vòng đời. Tránh Lombok `@Data`/`@EqualsAndHashCode` mặc định trên entity (còn gây vòng lặp vô hạn với quan hệ hai chiều và kích hoạt lazy loading).',
    tags: ['jpa', 'hashcode', 'hashset', 'lombok'], sec: 75,
  },
]);
