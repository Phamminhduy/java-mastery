/* Bài học — Module 3: Collections Framework */
(() => {
  const L = (topic, blocks) => LS.add('collections', topic, blocks);

  L('List, Set, Map và Queue', [
    { table: [['Interface', 'Đặc điểm', 'Cài đặt phổ biến'], ['`List`', 'Có thứ tự, cho phép trùng, truy cập theo index', 'ArrayList, LinkedList'], ['`Set`', 'Không trùng', 'HashSet, LinkedHashSet, TreeSet'], ['`Map`', 'Cặp key–value, key không trùng', 'HashMap, LinkedHashMap, TreeMap, ConcurrentHashMap'], ['`Queue/Deque`', 'FIFO / hai đầu', 'ArrayDeque, PriorityQueue, LinkedBlockingQueue']] },
    '## Collection bất biến',
    '- `List.of`, `Set.of`, `Map.of` (Java 9): immutable, **không chấp nhận null**.',
    '- `Arrays.asList`: kích thước cố định, `set` được nhưng `add/remove` ném `UnsupportedOperationException`, ghi xuyên xuống mảng gốc.',
    '- `Collections.unmodifiableList`: view chỉ đọc — list gốc thay đổi thì view thay đổi theo; `List.copyOf` là bản sao độc lập.',
    '## Queue',
    '- `add/remove/element` ném exception; `offer/poll/peek` trả false/null.',
    '- Dùng `ArrayDeque` thay cho `Stack` và `LinkedList` làm stack/queue.',
    '- `PriorityQueue` là min-heap: `poll()` lấy phần tử nhỏ nhất, nhưng iterator không theo thứ tự.',
  ]);

  L('ArrayList và LinkedList', [
    { table: [['Thao tác', 'ArrayList', 'LinkedList'], ['get(i)', 'O(1)', 'O(n)'], ['add cuối', 'O(1) amortized', 'O(1)'], ['add/remove giữa theo index', 'O(n) (dịch phần tử)', 'O(n) (phải duyệt tới vị trí)'], ['Bộ nhớ', 'Mảng liên tục, cache-friendly', 'Mỗi node 2 con trỏ + header']] },
    '- ArrayList tăng dung lượng ~1.5 lần khi đầy (copy mảng). Biết trước kích thước → `new ArrayList<>(n)`.',
    '- Trong thực tế ArrayList nhanh hơn trong hầu hết trường hợp; LinkedList chỉ lợi khi chèn/xóa qua iterator đã ở đúng vị trí.',
    '! `List<Integer>.remove(1)` xóa theo **index**; muốn xóa giá trị dùng `remove(Integer.valueOf(1))`.',
  ]);

  L('HashMap và cách hoạt động', [
    'HashMap lưu entry trong mảng bucket. `put(k, v)`: tính `hash(k)` (hashCode trộn bit cao/thấp) → index = `hash & (n - 1)` → nếu bucket có entry, dùng `equals` để tìm key trùng.',
    '## Chi tiết quan trọng',
    '- Capacity mặc định 16, load factor 0.75 → resize (gấp đôi, rehash) khi size > capacity × 0.75.',
    '- Java 8: bucket có ≥ 8 node và bảng ≥ 64 → chuyển thành Red-Black Tree (O(log n)); ≤ 6 → về linked list.',
    '- Cho phép một key null (bucket 0) và nhiều value null. Không thread-safe, không có thứ tự.',
    '- Biết trước số phần tử: `new HashMap<>((int)(n / 0.75f) + 1)` hoặc `HashMap.newHashMap(n)` (Java 19).',
    { lang: 'java', code: `
counts.merge(word, 1, Integer::sum);              // đếm
map.computeIfAbsent(key, k -> new ArrayList<>()).add(v);   // nhóm
map.getOrDefault(key, 0);` },
    '! Key phải immutable (hoặc field dùng trong hashCode/equals không đổi). Sửa key sau khi put → entry "mất tích" trong map.',
    '? Đa luồng ghi HashMap có thể mất dữ liệu (Java 7 còn có thể vòng lặp vô hạn khi resize) → dùng ConcurrentHashMap.',
  ]);

  L('HashSet', [
    'HashSet được cài đặt bằng một HashMap nội bộ: phần tử là key, value là một object hằng `PRESENT`. Do đó mọi tính chất của HashMap áp dụng: dựa vào `hashCode` + `equals`, O(1) trung bình, không thứ tự.',
    '- `add` trả về false nếu phần tử đã tồn tại.',
    '- Muốn giữ thứ tự chèn: `LinkedHashSet`; muốn sắp xếp: `TreeSet`.',
    '- Khử trùng nhanh một list: `new ArrayList<>(new LinkedHashSet<>(list))` (giữ thứ tự).',
    '! Phần tử có equals nhưng thiếu hashCode → Set chứa "bản sao", `contains` trả false.',
  ]);

  L('TreeMap và TreeSet', [
    'TreeMap/TreeSet là **Red-Black Tree**: các thao tác O(log n), duyệt theo thứ tự sắp xếp, hỗ trợ truy vấn khoảng.',
    { lang: 'java', code: `
TreeMap<LocalDate, BigDecimal> rates = new TreeMap<>();
rates.floorEntry(date);          // tỷ giá gần nhất <= date
rates.headMap(date, true);       // mọi entry <= date
rates.firstKey(); rates.lastKey();` },
    '- Key phải `Comparable` hoặc truyền `Comparator`; nếu không, put đầu tiên ném `ClassCastException`.',
    '- Phần tử trùng được xác định bằng **compare == 0**, không bằng equals. `TreeSet(String.CASE_INSENSITIVE_ORDER)` coi "Java" và "JAVA" là một.',
    '- Không cho key null (với natural ordering).',
  ]);

  L('Comparable và Comparator', [
    '- `Comparable<T>`: thứ tự tự nhiên của class (`compareTo`), cài trong chính class (String, Integer, LocalDate).',
    '- `Comparator<T>`: thứ tự bên ngoài, có thể có nhiều cách sắp xếp.',
    { lang: 'java', code: `
employees.sort(Comparator
    .comparing(Employee::dept)                                  // tăng dần
    .thenComparing(Employee::salary, Comparator.reverseOrder()) // giảm dần
    .thenComparing(Employee::id));
Comparator.comparing(User::lastLogin, Comparator.nullsLast(Comparator.naturalOrder()));` },
    '! Không viết comparator bằng phép trừ `a - b` (tràn số); dùng `Integer.compare` / `comparingInt`.',
    '- `.reversed()` đặt cuối chuỗi đảo **toàn bộ** comparator.',
    '- Nên nhất quán với equals (compare == 0 ⇔ equals) khi dùng trong TreeSet/TreeMap.',
  ]);

  L('Hash Collision', [
    'Collision xảy ra khi hai key khác nhau rơi vào cùng bucket (cùng hash hoặc cùng index sau khi lấy phần dư). HashMap xử lý bằng chaining (list → tree).',
    '- hashCode kém (ví dụ trả về hằng số) không làm sai kết quả nhưng biến O(1) thành O(n) (hoặc O(log n) sau treeify nếu key Comparable).',
    '- Kẻ tấn công có thể cố ý gửi nhiều key cùng hash (HashDoS) — treeification của Java 8 giảm thiểu rủi ro này.',
    '- hashCode tốt: kết hợp các field quan trọng với hệ số nguyên tố (`Objects.hash`, hoặc `31 * h + field.hashCode()`).',
  ]);

  L('equals() và hashCode()', [
    'Trong ngữ cảnh collection, equals/hashCode quyết định cách HashMap/HashSet tìm phần tử:',
    '- `hashCode` chọn bucket → `equals` xác định phần tử trùng trong bucket.',
    '- Hai object equals nhau mà hashCode khác → nằm ở bucket khác → không bao giờ được coi là trùng.',
    '## Bẫy với JPA entity',
    '- equals/hashCode theo id sinh tự động: id = null khi thêm vào Set, có giá trị sau persist → hashCode đổi → không tìm/xóa được.',
    '- Giải pháp: business key bất biến, hoặc equals theo id (khi khác null) + hashCode hằng theo class.',
    '! Không dùng Lombok `@Data`/`@EqualsAndHashCode` mặc định cho entity có quan hệ (vòng lặp, lazy loading).',
  ]);

  L('Fail-fast và Fail-safe', [
    '- **Fail-fast** (ArrayList, HashMap...): iterator lưu `modCount`; nếu collection bị sửa cấu trúc ngoài iterator → ném `ConcurrentModificationException` ở lần `next()`. Chỉ là best-effort, không đảm bảo.',
    '- **Fail-safe / weakly consistent** (CopyOnWriteArrayList, ConcurrentHashMap): duyệt trên snapshot hoặc chấp nhận thay đổi đồng thời, không ném CME.',
    { lang: 'java', code: `
for (String s : list) if (s.isBlank()) list.remove(s);   // CME (thường gặp)
list.removeIf(String::isBlank);                           // đúng
Iterator<String> it = list.iterator();
while (it.hasNext()) if (it.next().isBlank()) it.remove(); // đúng` },
    '- CopyOnWriteArrayList copy toàn bộ mảng mỗi lần ghi → chỉ phù hợp đọc nhiều, ghi rất ít (danh sách listener).',
    '! CME có thể xảy ra trong **một thread** — không liên quan đa luồng.',
  ]);

  L('Iterator', [
    '`Iterator` cung cấp `hasNext()`, `next()`, `remove()` (tùy chọn). Enhanced for (`for (x : coll)`) dùng Iterator ngầm định.',
    '- `ListIterator` duyệt hai chiều, `set`, `add` tại vị trí hiện tại.',
    '- `Iterator.remove()` chỉ gọi được một lần sau mỗi `next()`.',
    '- Map: duyệt `entrySet()` hiệu quả hơn `keySet()` + `get()`; `entry.setValue()` cập nhật value an toàn.',
    '- `Spliterator` hỗ trợ chia nhỏ cho parallel stream.',
  ]);

  L('ConcurrentHashMap', [
    'Map thread-safe hiệu năng cao: đọc gần như không khóa; ghi khóa ở mức bucket (Java 8 dùng CAS + synchronized trên node đầu bucket), không khóa toàn map như `Hashtable`/`synchronizedMap`.',
    '- **Không cho key/value null** (tránh mơ hồ giữa "không có" và "giá trị null").',
    '- Từng thao tác là atomic, nhưng chuỗi `get` → tính → `put` thì **không**. Dùng `merge`, `compute`, `computeIfAbsent`, `putIfAbsent`.',
    { lang: 'java', code: `
ConcurrentHashMap<String, LongAdder> hits = new ConcurrentHashMap<>();
hits.computeIfAbsent(clientId, k -> new LongAdder()).increment();` },
    '- Iterator weakly consistent: không ném CME, có thể thấy hoặc không thấy cập nhật đồng thời.',
    '- `size()` chỉ là ước lượng khi có ghi đồng thời; `mappingCount()` cho long.',
    '! Function trong `computeIfAbsent` phải ngắn, không gọi I/O chậm và không sửa map khác key (giữ lock của bin, Java 9+ có thể ném "Recursive update").',
  ]);

  L('Time Complexity của các cấu trúc dữ liệu', [
    { table: [['Cấu trúc', 'Truy cập/Tìm', 'Thêm', 'Xóa', 'Ghi chú'], ['ArrayList', 'get O(1), contains O(n)', 'O(1)* cuối', 'O(n)', '*amortized'], ['LinkedList', 'O(n)', 'O(1) đầu/cuối', 'O(1) qua iterator', ''], ['HashMap/HashSet', 'O(1) TB', 'O(1) TB', 'O(1) TB', 'Xấu nhất O(log n) sau treeify'], ['TreeMap/TreeSet', 'O(log n)', 'O(log n)', 'O(log n)', 'Có thứ tự'], ['PriorityQueue', 'peek O(1)', 'O(log n)', 'poll O(log n)', 'contains O(n)'], ['ArrayDeque', 'đầu/cuối O(1)', 'O(1)', 'O(1)', '']] },
    '## Chọn cấu trúc theo use case',
    '- Tra cứu theo khóa: HashMap. Cần thứ tự sắp xếp/khoảng: TreeMap. Giữ thứ tự chèn: LinkedHashMap.',
    '- LRU cache: `LinkedHashMap(cap, 0.75f, true)` + override `removeEldestEntry` (đơn luồng) hoặc Caffeine.',
    '- Top-K: PriorityQueue kích thước K.',
  ]);
})();
