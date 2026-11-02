/* Module 8: Database và SQL
 * Các câu dự đoán kết quả dùng chung bộ dữ liệu mẫu dưới đây (khai báo cục bộ trong IIFE để tránh biến toàn cục).
 */
(() => {
  const DEPARTMENTS = { name: 'departments', columns: ['id', 'name'], rows: [[1, 'IT'], [2, 'HR'], [3, 'Sales']] };
  const EMPLOYEES = {
    name: 'employees', columns: ['id', 'name', 'dept_id', 'salary'],
    rows: [[1, 'An', 1, 1500], [2, 'Binh', 1, 1200], [3, 'Chi', 2, 1000], [4, 'Dung', null, 900]],
  };

  QB.module({
    id: 'database-sql', order: 8, title: 'Database và SQL',
    description: 'SQL, JOIN, GROUP BY, Window Functions, Index, Execution Plan, Transaction, Isolation, Locking, Pagination, Oracle/PostgreSQL, Connection Pool, Migration.',
    topics: ['SQL cơ bản', 'SELECT, INSERT, UPDATE, DELETE', 'WHERE, GROUP BY, HAVING, ORDER BY', 'INNER JOIN, LEFT JOIN, RIGHT JOIN', 'Subquery', 'CTE',
      'Window Functions', 'Aggregate Functions', 'Index', 'Composite Index', 'Execution Plan', 'Query Optimization', 'Transactions', 'ACID',
      'Isolation Levels', 'Dirty Read, Non-repeatable Read và Phantom Read', 'Deadlock', 'Optimistic Locking', 'Pessimistic Locking', 'Pagination',
      'N+1 Query', 'Database Normalization', 'Primary Key và Foreign Key', 'Oracle và PostgreSQL', 'Connection Pool', 'Database Migration'],
  }, [
    {
      id: 'SQL-001', topic: 'INNER JOIN, LEFT JOIN, RIGHT JOIN', d: 'i', cat: 'sql', tables: [DEPARTMENTS, EMPLOYEES],
      q: 'Với dữ liệu mẫu, truy vấn sau trả về kết quả nào?',
      lang: 'sql', code: `
SELECT d.name, COUNT(e.id) AS total
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
GROUP BY d.name
ORDER BY d.name;`,
      opts: ['HR 1, IT 2', 'HR 1, IT 2, Sales 0', 'HR 1, IT 2, Sales 1', 'HR 1, IT 2, Sales 0, NULL 1'], ans: 'B',
      exp: 'LEFT JOIN giữ mọi dòng của bảng bên trái (departments). Sales không có nhân viên nên ghép với NULL. `COUNT(e.id)` chỉ đếm giá trị khác NULL → Sales = 0. Dung (dept_id NULL) không khớp phòng nào nên không xuất hiện vì bảng bên trái là departments.',
      tags: ['left-join', 'count', 'group-by'], sec: 75,
    },
    {
      id: 'SQL-002', topic: 'Aggregate Functions', d: 'i', cat: 'sql', tables: [DEPARTMENTS, EMPLOYEES],
      q: 'Nếu đổi `COUNT(e.id)` trong câu truy vấn LEFT JOIN trên thành `COUNT(*)`, giá trị total của phòng Sales là bao nhiêu?',
      lang: 'sql', code: `
SELECT d.name, COUNT(*) AS total
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
GROUP BY d.name;`,
      opts: ['0', '1', 'NULL', 'Lỗi cú pháp'], ans: 'B',
      exp: '`COUNT(*)` đếm số **dòng** trong nhóm, kể cả dòng mà các cột của employees đều NULL. Sales có đúng một dòng (Sales, NULL...) sau LEFT JOIN nên COUNT(*) = 1 — kết quả sai về nghiệp vụ. Khi đếm phía bảng được LEFT JOIN, hãy đếm một cột không-null của bảng đó (thường là khóa chính).',
      tags: ['count', 'left-join', 'null'], sec: 50,
    },
    {
      id: 'SQL-003', topic: 'INNER JOIN, LEFT JOIN, RIGHT JOIN', d: 'b', cat: 'sql', tables: [DEPARTMENTS, EMPLOYEES],
      q: 'Truy vấn sau trả về bao nhiêu dòng?',
      lang: 'sql', code: `
SELECT e.name, d.name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id;`,
      opts: ['2', '3', '4', '5'], ans: 'B',
      exp: 'INNER JOIN chỉ giữ các cặp thỏa điều kiện ON: An–IT, Binh–IT, Chi–HR. Dung có dept_id NULL (NULL = bất kỳ giá trị nào đều là UNKNOWN) nên bị loại; Sales không có nhân viên cũng không xuất hiện.',
      tags: ['inner-join'], sec: 40,
    },
    {
      id: 'SQL-004', topic: 'INNER JOIN, LEFT JOIN, RIGHT JOIN', d: 'a', cat: 'sql', tables: [DEPARTMENTS, EMPLOYEES],
      q: 'Mục tiêu: liệt kê **mọi** phòng ban, kèm nhân viên có lương > 1100 (nếu có). Truy vấn sau trả về bao nhiêu dòng và có đạt mục tiêu không?',
      lang: 'sql', code: `
SELECT d.name, e.name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
WHERE e.salary > 1100;`,
      opts: [
        '4 dòng, đạt mục tiêu',
        '2 dòng (IT–An, IT–Binh), không đạt: điều kiện ở WHERE loại bỏ các dòng NULL của LEFT JOIN, biến nó thành INNER JOIN; cần chuyển điều kiện vào ON',
        '3 dòng, đạt mục tiêu',
        'Lỗi cú pháp vì WHERE không dùng được với LEFT JOIN',
      ], ans: 'B',
      exp: 'Sau LEFT JOIN: IT–An(1500), IT–Binh(1200), HR–Chi(1000), Sales–NULL. WHERE chạy sau JOIN: `NULL > 1100` là UNKNOWN nên Sales bị loại, HR–Chi bị loại do 1000. Đặt điều kiện vào ON: `LEFT JOIN employees e ON e.dept_id = d.id AND e.salary > 1100` → 4 dòng: IT–An, IT–Binh, HR–NULL, Sales–NULL.',
      tags: ['left-join', 'where-vs-on'], sec: 80,
    },
    {
      id: 'SQL-005', topic: 'SQL cơ bản', d: 'i', cat: 'sql', tables: [EMPLOYEES],
      q: 'Truy vấn sau trả về những ai?',
      lang: 'sql', code: `
SELECT name FROM employees WHERE dept_id <> 1;`,
      opts: ['Chi', 'Chi, Dung', 'An, Binh', 'Không có dòng nào'], ans: 'A',
      exp: 'So sánh với NULL (`NULL <> 1`) cho kết quả UNKNOWN, và WHERE chỉ giữ dòng TRUE, nên Dung bị loại. Muốn lấy cả người chưa có phòng: `WHERE dept_id <> 1 OR dept_id IS NULL` (PostgreSQL còn có `IS DISTINCT FROM`). Logic ba giá trị (TRUE/FALSE/UNKNOWN) là nguồn gốc của nhiều bug báo cáo.',
      tags: ['null', 'three-valued-logic'], sec: 45,
    },
    {
      id: 'SQL-006', topic: 'Subquery', d: 's', cat: 'sql', tables: [DEPARTMENTS, EMPLOYEES],
      q: 'Mục tiêu: tìm phòng ban **không có** nhân viên (kỳ vọng: Sales). Truy vấn sau trả về gì?',
      lang: 'sql', code: `
SELECT name
FROM departments
WHERE id NOT IN (SELECT dept_id FROM employees);`,
      opts: ['Sales', 'Không có dòng nào', 'Sales và NULL', 'Lỗi vì subquery trả về nhiều dòng'], ans: 'B',
      exp: 'Subquery trả về {1, 1, 2, NULL}. `3 NOT IN (1, 2, NULL)` tương đương `3 <> 1 AND 3 <> 2 AND 3 <> NULL` → TRUE AND TRUE AND UNKNOWN = UNKNOWN, nên không dòng nào được trả về. Dùng `NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.id)` (an toàn với NULL và thường được tối ưu thành anti-join), hoặc lọc `WHERE dept_id IS NOT NULL` trong subquery.',
      tags: ['not-in', 'null', 'not-exists'], sec: 75,
    },
    {
      id: 'SQL-007', topic: 'WHERE, GROUP BY, HAVING, ORDER BY', d: 'b', cat: 'sql', tables: [EMPLOYEES],
      q: 'Truy vấn nào trả về đúng các phòng có lương trung bình lớn hơn 1100?',
      lang: 'sql', code: `
-- (1)
SELECT dept_id, AVG(salary) FROM employees WHERE AVG(salary) > 1100 GROUP BY dept_id;
-- (2)
SELECT dept_id, AVG(salary) FROM employees GROUP BY dept_id HAVING AVG(salary) > 1100;`,
      opts: ['(1)', '(2)', 'Cả hai', 'Không câu nào'], ans: 'B', fixed: true,
      exp: 'WHERE lọc **từng dòng trước** khi nhóm nên không được dùng hàm aggregate (câu (1) lỗi cú pháp). HAVING lọc **nhóm** sau GROUP BY. Kết quả của (2): dept_id 1 (AVG = 1350). Lưu ý nhóm dept_id NULL (Dung, 900) cũng là một nhóm nhưng không thỏa điều kiện.',
      tags: ['having', 'group-by', 'aggregate'], sec: 45,
    },
    {
      id: 'SQL-008', topic: 'WHERE, GROUP BY, HAVING, ORDER BY', d: 'i', cat: 'theory',
      q: 'Trong PostgreSQL/Oracle, `SELECT salary * 12 AS annual FROM employees WHERE annual > 15000` báo lỗi "column annual does not exist", nhưng `ORDER BY annual` lại chạy được. Vì sao?',
      opts: [
        'Do bug của database',
        'Theo thứ tự xử lý logic: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT; alias được định nghĩa ở SELECT nên chưa tồn tại khi WHERE được đánh giá, nhưng đã có khi ORDER BY',
        'Alias chỉ dùng được với hàm aggregate',
        'Do thiếu dấu ngoặc kép quanh alias',
      ], ans: 'B',
      exp: 'Thứ tự logic giải thích nhiều quy tắc: không dùng aggregate trong WHERE, alias không dùng được trong WHERE/GROUP BY (một số DB như MySQL/PostgreSQL cho phép alias trong GROUP BY như mở rộng). Cách viết: lặp lại biểu thức `WHERE salary * 12 > 15000` hoặc bọc bằng subquery/CTE.',
      tags: ['logical-order', 'alias'], sec: 45,
    },
    {
      id: 'SQL-009', topic: 'Aggregate Functions', d: 'i', cat: 'sql',
      tables: [{ name: 'bonuses', columns: ['emp_id', 'amount'], rows: [[1, 100], [2, null], [3, 200]] }],
      q: 'Kết quả của truy vấn sau?',
      lang: 'sql', code: `
SELECT COUNT(*), COUNT(amount), SUM(amount), AVG(amount)
FROM bonuses;`,
      opts: ['3, 3, 300, 100', '3, 2, 300, 150', '3, 2, 300, 100', '2, 2, 300, 150'], ans: 'B',
      exp: 'Hàm aggregate (trừ COUNT(*)) **bỏ qua NULL**: COUNT(amount) = 2, SUM = 300, AVG = 300 / 2 = 150 (không phải 300 / 3). Nếu nghiệp vụ coi NULL là 0, dùng `AVG(COALESCE(amount, 0))` = 100. Trên tập rỗng, SUM trả về NULL chứ không phải 0.',
      tags: ['aggregate', 'null', 'avg'], sec: 50,
    },
    {
      id: 'SQL-010', topic: 'Window Functions', d: 'a', cat: 'sql',
      tables: [{ name: 'scores', columns: ['player', 'points'], rows: [['A', 1500], ['B', 1200], ['C', 1200], ['D', 1000]] }],
      q: 'Với truy vấn sau, giá trị (rn, rk, drk) của người chơi D là gì?',
      lang: 'sql', code: `
SELECT player,
       ROW_NUMBER() OVER (ORDER BY points DESC) AS rn,
       RANK()       OVER (ORDER BY points DESC) AS rk,
       DENSE_RANK() OVER (ORDER BY points DESC) AS drk
FROM scores;`,
      opts: ['(4, 4, 4)', '(4, 4, 3)', '(4, 3, 3)', '(3, 3, 3)'], ans: 'B',
      exp: 'ROW_NUMBER đánh số liên tục 1,2,3,4 (B và C nhận 2/3 theo thứ tự không xác định). RANK cho các giá trị bằng nhau cùng hạng và **bỏ qua** hạng kế tiếp: 1,2,2,4. DENSE_RANK không bỏ hạng: 1,2,2,3. Vậy D = (4, 4, 3).',
      tags: ['window-function', 'rank', 'dense-rank', 'row-number'], sec: 60,
    },
    {
      id: 'SQL-011', topic: 'Window Functions', d: 'a', cat: 'sql', tables: [EMPLOYEES],
      q: 'Cần lấy nhân viên có lương cao nhất **mỗi phòng ban** (mỗi phòng một người). Truy vấn nào đúng?',
      lang: 'sql', code: `
-- (1)
SELECT name, dept_id, salary,
       ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
FROM employees
WHERE rn = 1;

-- (2)
SELECT name, dept_id, salary
FROM (
  SELECT name, dept_id, salary,
         ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
  FROM employees
) t
WHERE rn = 1;`,
      opts: ['(1)', '(2)', 'Cả hai', 'Không câu nào'], ans: 'B', fixed: true,
      exp: 'Window function được tính ở bước SELECT, **sau** WHERE, nên không thể lọc trực tiếp bằng WHERE ở cùng cấp (câu (1) lỗi). Bọc trong subquery/CTE rồi lọc ở ngoài. `PARTITION BY` chia nhóm mà không gộp dòng như GROUP BY. Muốn lấy tất cả người đồng hạng nhất, dùng RANK thay vì ROW_NUMBER.',
      tags: ['window-function', 'top-n-per-group', 'partition-by'], sec: 60,
    },
    {
      id: 'SQL-012', topic: 'CTE', d: 'i', cat: 'theory',
      q: 'Bảng `categories(id, name, parent_id)` lưu cây danh mục nhiều cấp. Cách nào lấy toàn bộ danh mục con (mọi cấp) của một danh mục trong một câu SQL?',
      opts: [
        'Self JOIN nhiều lần với số lần cố định',
        'Recursive CTE: `WITH RECURSIVE tree AS (SELECT ... WHERE id = :root UNION ALL SELECT c.* FROM categories c JOIN tree t ON c.parent_id = t.id) SELECT * FROM tree` (Oracle còn có CONNECT BY)',
        'GROUP BY parent_id',
        'Dùng window function LAG',
      ], ans: 'B',
      exp: 'Recursive CTE gồm phần anchor (điểm bắt đầu) và phần đệ quy tham chiếu lại chính CTE, lặp đến khi không sinh thêm dòng. PostgreSQL yêu cầu từ khóa `RECURSIVE`; Oracle 11gR2+ hỗ trợ recursive subquery factoring (không dùng từ RECURSIVE) và cú pháp riêng `CONNECT BY PRIOR`. Cần đề phòng chu trình dữ liệu (PostgreSQL 14+ có mệnh đề CYCLE).',
      tags: ['cte', 'recursive', 'hierarchy'], sec: 45,
    },
    {
      id: 'SQL-013', topic: 'Subquery', d: 'i', cat: 'sql', tables: [EMPLOYEES],
      q: 'Truy vấn sau (correlated subquery) trả về những ai?',
      lang: 'sql', code: `
SELECT e.name
FROM employees e
WHERE e.salary > (SELECT AVG(x.salary)
                  FROM employees x
                  WHERE x.dept_id = e.dept_id);`,
      opts: ['An', 'An, Binh', 'An, Chi', 'An, Dung'], ans: 'A',
      exp: 'Subquery tương quan được đánh giá cho từng dòng ngoài:\n• An (IT): AVG IT = 1350 → 1500 > 1350 ✓\n• Binh (IT): 1200 > 1350 ✗\n• Chi (HR): AVG HR = 1000 → 1000 > 1000 ✗\n• Dung (NULL): `x.dept_id = NULL` không khớp dòng nào → AVG = NULL → so sánh UNKNOWN ✗.\nCó thể viết lại bằng window function `AVG(salary) OVER (PARTITION BY dept_id)` để chỉ quét bảng một lần.',
      tags: ['correlated-subquery', 'avg'], sec: 70,
    },
    {
      id: 'SQL-014', topic: 'Composite Index', d: 'i', cat: 'perf',
      q: 'Bảng `orders` có B-tree index `idx_orders (customer_id, status, created_at)`. Truy vấn nào **không** tận dụng được index này một cách hiệu quả (với PostgreSQL)?',
      lang: 'sql', code: `
-- (1) WHERE customer_id = 10
-- (2) WHERE customer_id = 10 AND status = 'PAID'
-- (3) WHERE status = 'PAID' AND created_at > now() - interval '1 day'
-- (4) WHERE customer_id = 10 AND status = 'PAID' ORDER BY created_at DESC`,
      opts: ['(1)', '(2)', '(3)', '(4)'], ans: 'C', fixed: true,
      exp: 'Composite index được sắp xếp theo thứ tự cột (customer_id, rồi status, rồi created_at) nên phát huy tốt nhất khi điều kiện dùng **tiền tố bên trái** (leftmost prefix). (3) bỏ qua cột đầu customer_id nên không thể seek vào khoảng liên tục của index. (4) dùng được cả lọc và sắp xếp từ index (tránh sort). Một số DB như Oracle có "index skip scan" nhưng chỉ hiệu quả khi cột đầu có ít giá trị phân biệt.',
      tags: ['composite-index', 'leftmost-prefix'], sec: 60,
    },
    {
      id: 'SQL-015', topic: 'Query Optimization', d: 'i', cat: 'perf',
      q: 'Cột `created_at` (timestamp) có index. Truy vấn `SELECT * FROM orders WHERE DATE(created_at) = \'2024-05-01\'` (MySQL; tương tự `TRUNC(created_at)` trên Oracle) chạy full scan. Cách viết lại nào giúp dùng được index?',
      lang: 'sql', code: `
SELECT * FROM orders
WHERE DATE(created_at) = '2024-05-01';`,
      opts: [
        'WHERE created_at LIKE \'2024-05-01%\'',
        'WHERE created_at >= \'2024-05-01\' AND created_at < \'2024-05-02\'',
        'WHERE CAST(created_at AS DATE) = \'2024-05-01\'',
        'Thêm ORDER BY created_at',
      ], ans: 'B',
      exp: 'Bọc cột trong hàm (DATE, TRUNC, UPPER, phép tính) khiến B-tree index thông thường không dùng được vì index lưu giá trị gốc, không lưu kết quả hàm (predicate không "sargable"). Viết thành khoảng nửa mở [ngày, ngày+1) giữ nguyên cột. Lựa chọn khác: function-based index (Oracle) / expression index (PostgreSQL). Tương tự, so sánh cột VARCHAR với số gây implicit conversion và mất index.',
      tags: ['sargable', 'index', 'function'], sec: 50,
    },
    {
      id: 'SQL-016', topic: 'Index', d: 'b', cat: 'perf',
      q: 'Tìm kiếm khách hàng bằng `WHERE email LIKE \'%@gmail.com\'` chạy chậm dù cột email có B-tree index. Vì sao?',
      opts: [
        'B-tree index không hỗ trợ kiểu VARCHAR',
        'Mẫu bắt đầu bằng ký tự đại diện `%` nên không xác định được tiền tố để seek trên B-tree; database phải quét toàn bộ. LIKE \'abc%\' thì có thể dùng index',
        'Do index bị hỏng, cần rebuild',
        'Do LIKE phân biệt hoa thường',
      ], ans: 'B',
      exp: 'B-tree sắp xếp theo giá trị từ ký tự đầu. Giải pháp cho tìm kiếm hậu tố/chứa: lưu thêm cột domain riêng và index nó, reverse index, trigram index (`pg_trgm` GIN trên PostgreSQL), Oracle Text, hoặc search engine (Elasticsearch/OpenSearch).',
      tags: ['like', 'index', 'b-tree'], sec: 35,
    },
    {
      id: 'SQL-017', topic: 'Execution Plan', d: 'a', cat: 'perf',
      q: 'Đọc execution plan sau (PostgreSQL) của API lấy đơn hàng theo khách hàng. Kết luận và hành động hợp lý nhất?',
      lang: 'text', code: `
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 4821 ORDER BY created_at DESC LIMIT 20;

Limit  (cost=185432.10..185432.15 rows=20) (actual time=1650.2..1650.3 rows=20 loops=1)
  ->  Sort  (cost=185432.10..185440.80 rows=3480) (actual time=1650.2..1650.2 rows=20 loops=1)
        Sort Key: created_at DESC
        ->  Seq Scan on orders  (cost=0.00..185340.00 rows=3480 width=96)
                                (actual time=0.03..1648.9 rows=3512 loops=1)
              Filter: (customer_id = 4821)
              Rows Removed by Filter: 7996488
Planning Time: 0.2 ms
Execution Time: 1650.4 ms`,
      opts: [
        'Tăng work_mem để sort nhanh hơn',
        'Quét tuần tự 8 triệu dòng để lấy ~3.500 dòng; tạo index `(customer_id, created_at DESC)` để lọc và lấy sẵn theo thứ tự, loại bỏ Seq Scan và Sort',
        'Bỏ LIMIT 20',
        'Chạy VACUUM FULL',
      ], ans: 'B',
      exp: '"Rows Removed by Filter: 7.996.488" và gần như toàn bộ thời gian nằm ở Seq Scan cho thấy thiếu index phù hợp. Index composite (customer_id, created_at) cho phép Index Scan lấy ngay 20 dòng mới nhất (thường < 1ms). Sort chỉ mất ~0.3ms nên tăng work_mem không giải quyết vấn đề. Luôn so sánh `rows` ước lượng với `actual rows` để phát hiện thống kê sai lệch (cần ANALYZE).',
      tags: ['explain-analyze', 'seq-scan', 'index'], sec: 90,
    },
    {
      id: 'SQL-018', topic: 'Composite Index', d: 'a', cat: 'design',
      q: 'Màn hình xử lý đơn thường xuyên chạy `SELECT ... FROM orders WHERE status = \'NEW\' ORDER BY created_at LIMIT 50`. Bảng có 20 triệu dòng, đơn NEW chiếm ~0,5%. Index nào phù hợp nhất?',
      opts: [
        'Index riêng trên created_at',
        'Composite index (status, created_at) — hoặc partial index `(created_at) WHERE status = \'NEW\'` trên PostgreSQL',
        'Index (created_at, status)',
        'Không cần index vì có LIMIT',
      ], ans: 'B',
      exp: 'Cột lọc bằng (equality) đặt trước, cột sắp xếp/range đặt sau: index (status, created_at) cho phép nhảy thẳng tới vùng status = NEW đã được sắp theo created_at và đọc 50 dòng đầu. Partial index chỉ chứa 0,5% dòng → nhỏ và nhanh hơn. Index (created_at, status) phải duyệt nhiều dòng không phải NEW. LIMIT không thay thế được index khi phải lọc/sắp xếp.',
      tags: ['composite-index', 'partial-index', 'order-by'], sec: 60,
    },
    {
      id: 'SQL-019', topic: 'Index', d: 'i', cat: 'tradeoff',
      q: 'Một bảng log ghi 5.000 dòng/giây có 9 index (nhiều index được thêm "cho chắc"). Hệ quả chính và cách tiếp cận đúng?',
      opts: [
        'Index chỉ ảnh hưởng truy vấn đọc, không ảnh hưởng ghi',
        'Mỗi INSERT/UPDATE phải cập nhật mọi index liên quan (tốn I/O, lock, WAL/redo, bộ nhớ); nên chỉ giữ index phục vụ truy vấn thực tế (dựa trên thống kê sử dụng), gộp các index trùng tiền tố',
        'Nhiều index luôn giúp database chọn plan tốt hơn',
        'Index làm giảm dung lượng lưu trữ',
      ], ans: 'B',
      exp: 'Index là trade-off giữa tốc độ đọc và chi phí ghi/lưu trữ. Index trên cột có độ chọn lọc thấp (ví dụ boolean, giới tính) thường không được dùng. Dùng `pg_stat_user_indexes` (PostgreSQL) hoặc index monitoring (Oracle) để tìm index không dùng; index (a) là thừa nếu đã có (a, b).',
      tags: ['index', 'write-amplification'], sec: 45,
    },
    {
      id: 'SQL-020', topic: 'ACID', d: 'b', cat: 'theory',
      q: 'Thuộc tính nào của ACID đảm bảo rằng một giao dịch đã commit sẽ không bị mất kể cả khi server mất điện ngay sau đó?',
      opts: ['Atomicity', 'Consistency', 'Isolation', 'Durability'], ans: 'D',
      exp: 'Durability: dữ liệu đã commit được ghi bền vững (thường qua write-ahead log/redo log được flush xuống đĩa trước khi báo commit). Atomicity: tất cả hoặc không gì cả. Consistency: chuyển từ trạng thái hợp lệ sang trạng thái hợp lệ (ràng buộc). Isolation: các transaction đồng thời không thấy trạng thái dở dang của nhau theo mức cô lập.',
      tags: ['acid', 'durability'], sec: 25,
    },
    {
      id: 'SQL-021', topic: 'Isolation Levels', d: 'i', cat: 'theory',
      q: 'Ở mức `READ COMMITTED`, hiện tượng nào **vẫn có thể** xảy ra?',
      opts: ['Dirty read', 'Non-repeatable read: đọc cùng một dòng hai lần trong một transaction có thể thấy giá trị khác nhau', 'Không hiện tượng nào xảy ra', 'Chỉ dirty write'], ans: 'B',
      exp: 'Theo chuẩn SQL: READ UNCOMMITTED cho phép dirty read; READ COMMITTED ngăn dirty read nhưng cho phép non-repeatable read và phantom; REPEATABLE READ ngăn non-repeatable read (chuẩn vẫn cho phép phantom, nhưng PostgreSQL và InnoDB hầu như ngăn được); SERIALIZABLE ngăn tất cả. Ở READ COMMITTED, mỗi câu lệnh thấy snapshot dữ liệu đã commit tại thời điểm câu lệnh bắt đầu.',
      tags: ['isolation', 'read-committed'], sec: 40,
    },
    {
      id: 'SQL-022', topic: 'Isolation Levels', d: 'i', cat: 'theory',
      q: 'Mức isolation **mặc định** của các database phổ biến là gì?',
      opts: [
        'Oracle: SERIALIZABLE; PostgreSQL: REPEATABLE READ; MySQL InnoDB: READ COMMITTED',
        'Oracle: READ COMMITTED; PostgreSQL: READ COMMITTED; MySQL InnoDB: REPEATABLE READ',
        'Tất cả đều SERIALIZABLE',
        'Tất cả đều READ UNCOMMITTED',
      ], ans: 'B',
      exp: 'Biết mặc định quan trọng khi chuyển hệ thống giữa các DB. Oracle không hỗ trợ READ UNCOMMITTED và REPEATABLE READ (chỉ READ COMMITTED, SERIALIZABLE, và READ ONLY). PostgreSQL chấp nhận cú pháp READ UNCOMMITTED nhưng thực thi như READ COMMITTED. Spring `@Transactional(isolation = DEFAULT)` dùng mặc định của DB.',
      tags: ['isolation', 'oracle', 'postgresql', 'mysql'], sec: 40,
    },
    {
      id: 'SQL-023', topic: 'Transactions', d: 'a', cat: 'scenario',
      q: 'Hai request đồng thời nạp tiền vào cùng ví (số dư 100). Mỗi request: (1) `SELECT balance` → 100, (2) tính trong Java 100 + 50, (3) `UPDATE wallet SET balance = 150`. Ở READ COMMITTED, số dư cuối là 150 thay vì 200. Giải pháp nào **không** ngăn được lỗi này?',
      opts: [
        'Dùng câu lệnh nguyên tử `UPDATE wallet SET balance = balance + 50 WHERE id = ?`',
        'Khóa dòng khi đọc: `SELECT balance FROM wallet WHERE id = ? FOR UPDATE`',
        'Optimistic locking với cột version: `UPDATE ... SET balance = ?, version = version + 1 WHERE id = ? AND version = ?` và retry khi 0 dòng bị ảnh hưởng',
        'Bọc 3 bước trong @Transactional với isolation READ COMMITTED mặc định và không thay đổi câu lệnh',
      ], ans: 'D',
      exp: 'Đây là **lost update**. Chỉ có transaction ở READ COMMITTED không ngăn được vì cả hai cùng đọc 100 trước khi ai ghi. Ba cách còn lại đều đúng: cập nhật nguyên tử để DB tự cộng; khóa bi quan tuần tự hóa hai giao dịch; khóa lạc quan phát hiện xung đột. (REPEATABLE READ trên PostgreSQL sẽ làm transaction thứ hai lỗi serialization và cần retry.)',
      tags: ['lost-update', 'locking', 'transaction'], sec: 70,
    },
    {
      id: 'SQL-024', topic: 'Dirty Read, Non-repeatable Read và Phantom Read', d: 'i', cat: 'theory',
      q: 'Transaction T1 chạy `SELECT COUNT(*) FROM orders WHERE status = \'NEW\'` hai lần. Giữa hai lần, T2 **insert** một đơn NEW mới và commit. Lần đọc thứ hai của T1 ra số lớn hơn. Đây là hiện tượng gì?',
      opts: ['Dirty read', 'Non-repeatable read', 'Phantom read', 'Lost update'], ans: 'C',
      exp: 'Phantom read: tập dòng thỏa một điều kiện thay đổi do dòng mới được thêm/xóa. Non-repeatable read: giá trị của **cùng một dòng** đã đọc bị thay đổi. Dirty read: đọc dữ liệu chưa commit của transaction khác.',
      tags: ['phantom-read', 'anomalies'], sec: 35,
    },
    {
      id: 'SQL-025', topic: 'Deadlock', d: 'a', cat: 'debug',
      q: 'Log PostgreSQL báo `ERROR: deadlock detected` (Oracle: ORA-00060) khi hai batch job cùng cập nhật bảng `accounts`. Job A cập nhật theo thứ tự id tăng dần, job B lấy danh sách theo thứ tự ngẫu nhiên từ file. Database xử lý thế nào và cách khắc phục?',
      opts: [
        'Database đợi vô hạn; cần restart DB',
        'Database phát hiện chu trình chờ và hủy (rollback) một transaction để transaction còn lại tiếp tục. Khắc phục: cập nhật theo thứ tự nhất quán (ví dụ sort theo id), giữ transaction ngắn/chia batch nhỏ, và retry transaction bị hủy',
        'Tăng isolation level lên SERIALIZABLE',
        'Tắt cơ chế lock của database',
      ], ans: 'B',
      exp: 'Deadlock xảy ra khi T1 giữ khóa dòng X chờ Y, T2 giữ Y chờ X. DB tự phát hiện (PostgreSQL sau `deadlock_timeout`) và chọn một nạn nhân. Ứng dụng phải sẵn sàng retry. Thứ tự khóa nhất quán phá vỡ chu trình. Trên Oracle, FK không có index cũng là nguyên nhân deadlock thường gặp.',
      tags: ['deadlock', 'lock-ordering', 'retry'], sec: 60,
    },
    {
      id: 'SQL-026', topic: 'Optimistic Locking', d: 'i', cat: 'sql',
      tables: [{ name: 'products', columns: ['id', 'price', 'version'], rows: [[7, 100, 3]] }],
      q: 'User A và B cùng mở sản phẩm 7 (version = 3). A lưu trước với câu lệnh dưới đây, sau đó B lưu với cùng câu lệnh (vẫn gửi version = 3). Kết quả của B?',
      lang: 'sql', code: `
UPDATE products
SET price = :newPrice, version = version + 1
WHERE id = 7 AND version = :expectedVersion;   -- expectedVersion = 3`,
      opts: [
        'Cập nhật thành công, ghi đè giá của A',
        'Không dòng nào bị cập nhật (0 rows affected) vì version đã là 4; ứng dụng phát hiện xung đột và báo người dùng tải lại hoặc thử lại',
        'Database ném deadlock',
        'B bị chặn cho tới khi A commit rồi cập nhật thành công',
      ], ans: 'B',
      exp: 'Optimistic locking không khóa khi đọc mà kiểm tra version lúc ghi. Sau update của A, version = 4 nên điều kiện `version = 3` của B không khớp. JPA `@Version` tự sinh câu lệnh này và ném `OptimisticLockException` khi 0 dòng bị ảnh hưởng. Phù hợp khi xung đột hiếm; khi tranh chấp cao, retry liên tục sẽ tốn kém → cân nhắc pessimistic lock.',
      tags: ['optimistic-locking', 'version'], sec: 50,
    },
    {
      id: 'SQL-027', topic: 'Pessimistic Locking', d: 's', cat: 'design',
      q: 'Bảng `jobs` dùng làm hàng đợi, 5 worker (5 instance) cùng lấy job PENDING để xử lý. Yêu cầu: không hai worker lấy trùng job, và các worker không phải chờ nhau. Câu lệnh nào phù hợp nhất (PostgreSQL / Oracle)?',
      opts: [
        'SELECT * FROM jobs WHERE status = \'PENDING\' LIMIT 10',
        'SELECT * FROM jobs WHERE status = \'PENDING\' ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED (trong transaction, rồi cập nhật status = \'PROCESSING\')',
        'SELECT * FROM jobs WHERE status = \'PENDING\' FOR UPDATE NOWAIT',
        'LOCK TABLE jobs IN EXCLUSIVE MODE trước mỗi lần lấy',
      ], ans: 'B',
      exp: '`FOR UPDATE` khóa các dòng được chọn; `SKIP LOCKED` bỏ qua dòng đang bị worker khác khóa thay vì chờ — mỗi worker nhận một lô khác nhau, không tranh chấp. NOWAIT ném lỗi ngay khi gặp khóa; LOCK TABLE tuần tự hóa toàn bộ. Cần giữ transaction ngắn và có cơ chế thu hồi job bị kẹt (timeout) nếu worker chết sau khi đã chuyển PROCESSING.',
      tags: ['for-update', 'skip-locked', 'job-queue'], sec: 60,
    },
    {
      id: 'SQL-028', topic: 'Pagination', d: 'a', cat: 'perf',
      q: 'API danh sách giao dịch dùng `ORDER BY id DESC LIMIT 20 OFFSET :offset`. Trang đầu nhanh, nhưng trang 50.000 mất vài giây. Giải pháp phù hợp cho cuộn vô hạn (infinite scroll)?',
      opts: [
        'Tăng LIMIT lên 1000',
        'Keyset (seek/cursor) pagination: `WHERE id < :lastSeenId ORDER BY id DESC LIMIT 20`, client gửi lại id cuối cùng của trang trước',
        'Cache toàn bộ bảng trong bộ nhớ',
        'Dùng SELECT COUNT(*) trước mỗi trang',
      ], ans: 'B',
      exp: 'OFFSET N buộc database đọc và bỏ qua N dòng, chi phí tăng tuyến tính theo số trang; dữ liệu mới chèn còn làm trùng/sót dòng giữa các trang. Keyset pagination dùng index để seek trực tiếp, chi phí gần như không đổi. Đánh đổi: không nhảy tới trang bất kỳ; khi sắp xếp theo cột không duy nhất cần thêm cột phụ (created_at, id) làm tie-breaker.',
      tags: ['pagination', 'keyset', 'offset'], sec: 50,
    },
    {
      id: 'SQL-029', topic: 'Oracle và PostgreSQL', d: 'a', cat: 'bug',
      q: 'Truy vấn Oracle sau dùng để lấy 3 nhân viên lương cao nhất nhưng trả về kết quả sai. Vì sao và cách viết đúng (Oracle 12c+)?',
      lang: 'sql', code: `
SELECT name, salary
FROM employees
WHERE ROWNUM <= 3
ORDER BY salary DESC;`,
      opts: [
        'ROWNUM chỉ hoạt động với số chẵn',
        'ROWNUM được gán khi dòng được lấy ra, **trước** ORDER BY: câu lệnh lấy 3 dòng bất kỳ rồi mới sắp xếp. Dùng `ORDER BY salary DESC FETCH FIRST 3 ROWS ONLY`, hoặc bọc subquery đã ORDER BY rồi lọc ROWNUM ở ngoài',
        'Phải dùng LIMIT 3 như PostgreSQL',
        'Do thiếu GROUP BY',
      ], ans: 'B',
      exp: 'Đây là lỗi kinh điển khi viết phân trang trên Oracle. Từ 12c có cú pháp chuẩn `OFFSET n ROWS FETCH NEXT m ROWS ONLY` (PostgreSQL cũng hỗ trợ, bên cạnh LIMIT/OFFSET). Với bản cũ: `SELECT * FROM (SELECT ... ORDER BY salary DESC) WHERE ROWNUM <= 3`.',
      tags: ['oracle', 'rownum', 'fetch-first'], sec: 55, ver: 'Oracle 12c+',
    },
    {
      id: 'SQL-030', topic: 'Oracle và PostgreSQL', d: 'a', cat: 'sql',
      q: 'Cùng chạy câu lệnh sau trên Oracle và PostgreSQL (PostgreSQL bỏ `FROM dual`). Kết quả lần lượt là gì?',
      lang: 'sql', code: `
SELECT CASE WHEN '' IS NULL THEN 'is null' ELSE 'not null' END AS r
FROM dual;`,
      opts: ['Oracle: not null; PostgreSQL: not null', 'Oracle: is null; PostgreSQL: not null', 'Oracle: is null; PostgreSQL: is null', 'Oracle: not null; PostgreSQL: is null'], ans: 'B',
      exp: 'Oracle coi chuỗi rỗng `\'\'` trong VARCHAR2 là NULL; PostgreSQL (và chuẩn SQL) phân biệt chuỗi rỗng và NULL. Khi migrate Oracle → PostgreSQL, các điều kiện như `WHERE col IS NULL` hoặc ràng buộc NOT NULL có thể hành xử khác; code Java ghi chuỗi rỗng cũng cần rà soát.',
      tags: ['oracle', 'postgresql', 'empty-string', 'migration'], sec: 45,
    },
    {
      id: 'SQL-031', topic: 'Oracle và PostgreSQL', d: 's', cat: 'debug',
      q: 'Trên PostgreSQL, một bảng cập nhật thường xuyên phình từ 2GB lên 40GB dù số dòng không đổi; truy vấn chậm dần. Monitoring cho thấy có một transaction ở trạng thái "idle in transaction" từ 3 ngày trước. Mối liên hệ là gì?',
      opts: [
        'Không liên quan; cần thêm ổ đĩa',
        'Với MVCC, UPDATE tạo phiên bản dòng mới; VACUUM chỉ dọn phiên bản cũ khi không transaction nào còn có thể cần thấy chúng. Transaction treo lâu giữ "xmin horizon" cũ khiến autovacuum không dọn được → table bloat. Cần kết thúc transaction đó, sửa code quên commit/đóng connection, đặt idle_in_transaction_session_timeout',
        'Do index bị trùng',
        'Do thiếu khóa ngoại',
      ], ans: 'B',
      exp: 'PostgreSQL MVCC lưu nhiều phiên bản tuple; dead tuple chỉ được thu hồi bởi VACUUM khi vượt qua horizon của transaction cũ nhất đang mở. Ứng dụng Java mở transaction rồi chờ I/O bên ngoài hoặc quên commit (connection trả về pool ở trạng thái mở) là nguyên nhân thường gặp. Theo dõi `pg_stat_activity` và tỷ lệ dead tuple trong `pg_stat_user_tables`.',
      tags: ['postgresql', 'mvcc', 'vacuum', 'bloat'], sec: 75,
    },
    {
      id: 'SQL-032', topic: 'Connection Pool', d: 'a', cat: 'debug',
      q: 'Khi tải tăng, log ứng dụng báo `HikariPool-1 - Connection is not available, request timed out after 30000ms`. CPU database chỉ 15%. Nguyên nhân khả dĩ cần kiểm tra trước tiên?',
      opts: [
        'Database quá tải CPU',
        'Connection bị giữ quá lâu hoặc không trả về pool: transaction bao trùm lời gọi HTTP chậm, connection leak (không đóng khi tự dùng JDBC), Open Session in View giữ connection suốt request, hoặc pool quá nhỏ so với số luồng đồng thời. Bật leakDetectionThreshold và xem metrics active/pending',
        'Do JDBC driver quá cũ',
        'Do thiếu index',
      ], ans: 'B',
      exp: 'DB rảnh nhưng ứng dụng chờ connection → "nút thắt" nằm ở việc chiếm giữ connection. Hikari metrics (`hikaricp.connections.active/pending`) và thread dump cho biết thread nào giữ connection ở đâu. Đừng đặt lời gọi ra hệ thống ngoài bên trong @Transactional. Tăng pool size chỉ là giải pháp cuối và bị giới hạn bởi max_connections của DB.',
      tags: ['hikaricp', 'connection-pool', 'leak'], sec: 60,
    },
    {
      id: 'SQL-033', topic: 'Connection Pool', d: 's', cat: 'tradeoff',
      q: 'Hệ thống có 12 instance ứng dụng, mỗi instance Hikari `maximumPoolSize=100`. PostgreSQL có `max_connections=300` và 8 vCPU. Đề xuất "tăng pool lên 200 để chịu tải cao hơn" có hợp lý không?',
      opts: [
        'Hợp lý, càng nhiều connection càng nhanh',
        'Không hợp lý: tổng có thể lên 1.200 connection vượt max_connections; database với 8 vCPU chỉ thực thi hiệu quả một số lượng nhỏ truy vấn đồng thời, nhiều connection hơn gây context switching và tranh chấp lock. Nên giảm pool mỗi instance (vài chục), tối ưu truy vấn/thời gian giữ connection, và cân nhắc PgBouncer',
        'Hợp lý nếu dùng SSD',
        'Chỉ cần tăng max_connections lên 5.000',
      ], ans: 'B',
      exp: 'Kích thước pool hợp lý thường nhỏ hơn nhiều so với trực giác (khuyến nghị khởi điểm của HikariCP: connections ≈ (số core × 2) + số đĩa, rồi đo đạc). Phải tính tổng pool của **mọi instance** so với giới hạn DB. Mỗi connection PostgreSQL là một process tốn bộ nhớ. Pooler như PgBouncer giúp ghép nhiều client connection vào ít server connection.',
      tags: ['connection-pool', 'pool-sizing', 'pgbouncer'], sec: 70,
    },
    {
      id: 'SQL-034', topic: 'Database Migration', d: 'i', cat: 'debug',
      q: 'Developer sửa nội dung file `V5__add_index.sql` (đã chạy trên staging) để thêm một cột. Lần deploy tiếp theo, Flyway báo "Validate failed: Migration checksum mismatch for migration version 5". Cách xử lý đúng?',
      opts: [
        'Xóa bảng flyway_schema_history',
        'Hoàn tác thay đổi trên V5 và tạo migration mới `V6__add_column.sql`; migration đã áp dụng là bất biến. Chỉ dùng `flyway repair` khi hiểu rõ và chắc chắn trạng thái schema',
        'Tắt validateOnMigrate vĩnh viễn',
        'Sửa trực tiếp checksum trong DB production',
      ], ans: 'B',
      exp: 'Flyway lưu checksum của mỗi migration đã chạy để phát hiện thay đổi ngoài ý muốn; môi trường đã chạy V5 bản cũ sẽ không bao giờ nhận thay đổi mới nếu chỉ sửa file. Nguyên tắc: append-only, mỗi thay đổi schema là một version mới, được review như code. Liquibase có khái niệm tương tự với changeSet.',
      tags: ['flyway', 'migration', 'checksum'], sec: 45,
    },
    {
      id: 'SQL-035', topic: 'Database Migration', d: 's', cat: 'design',
      q: 'Cần đổi tên cột `customers.phone` thành `mobile_phone` trên hệ thống deploy rolling (phiên bản cũ và mới chạy song song vài phút), không được downtime. Cách tiếp cận đúng?',
      opts: [
        'Một migration `ALTER TABLE ... RENAME COLUMN` chạy cùng lúc deploy',
        'Expand–contract: (1) thêm cột mới, ứng dụng ghi cả hai cột và backfill dữ liệu; (2) chuyển ứng dụng sang đọc cột mới; (3) khi không còn phiên bản cũ, ngừng ghi và xóa cột cũ ở lần deploy sau',
        'Tắt hệ thống vào ban đêm là cách duy nhất',
        'Tạo view tên phone',
      ], ans: 'B',
      exp: 'Trong rolling deploy, schema phải tương thích với **cả hai** phiên bản ứng dụng. Rename trực tiếp làm phiên bản cũ lỗi ngay lập tức. Expand–contract (parallel change) chia thay đổi phá vỡ thành các bước tương thích ngược. Lưu ý thêm: ALTER trên bảng lớn có thể khóa bảng — cần kiểm tra loại lock (ví dụ thêm cột có DEFAULT trên PostgreSQL 11+ không rewrite bảng).',
      tags: ['migration', 'zero-downtime', 'expand-contract'], sec: 70,
    },
    {
      id: 'SQL-036', topic: 'Database Normalization', d: 'b', cat: 'design',
      q: 'Bảng `orders` có cột `product_ids VARCHAR` lưu chuỗi "12,45,78". Vấn đề thiết kế chính là gì?',
      opts: [
        'Không có vấn đề, tiết kiệm bảng',
        'Vi phạm 1NF (giá trị không nguyên tố): không thể dùng khóa ngoại, index, JOIN hay ràng buộc số lượng; truy vấn "đơn nào chứa sản phẩm 45" phải dùng LIKE dễ sai. Nên tách bảng `order_items(order_id, product_id, quantity, price)`',
        'VARCHAR quá ngắn',
        'Nên dùng kiểu NUMBER',
      ], ans: 'B',
      exp: 'Chuẩn hóa giảm dư thừa và bất thường khi cập nhật: 1NF (giá trị nguyên tố), 2NF (không phụ thuộc một phần vào khóa), 3NF (không phụ thuộc bắc cầu). Bảng trung gian order_items cũng là nơi tự nhiên để lưu giá tại thời điểm mua. Denormalize có chủ đích (ví dụ cho báo cáo) là chấp nhận được khi có lý do hiệu năng rõ ràng.',
      tags: ['normalization', '1nf'], sec: 40,
    },
    {
      id: 'SQL-037', topic: 'Primary Key và Foreign Key', d: 'i', cat: 'theory',
      q: 'Bảng `order_items` có khóa ngoại `order_id` tham chiếu `orders(id)` (không khai báo ON DELETE). Điều gì xảy ra khi `DELETE FROM orders WHERE id = 10` mà vẫn còn order_items của đơn 10?',
      opts: [
        'Xóa đơn hàng và tự động xóa order_items',
        'Câu lệnh bị từ chối do vi phạm ràng buộc khóa ngoại (mặc định NO ACTION/RESTRICT)',
        'Xóa đơn hàng, order_items giữ order_id = 10 mồ côi',
        'order_id của order_items được đặt NULL',
      ], ans: 'B',
      exp: 'Khóa ngoại đảm bảo toàn vẹn tham chiếu. Hành vi cascade phải khai báo rõ (`ON DELETE CASCADE` / `SET NULL`). Nên tạo index cho cột khóa ngoại: tăng tốc JOIN và kiểm tra ràng buộc khi xóa/cập nhật bảng cha (trên Oracle, thiếu index FK còn gây khóa toàn bảng con và deadlock).',
      tags: ['foreign-key', 'referential-integrity'], sec: 40,
    },
    {
      id: 'SQL-038', topic: 'N+1 Query', d: 'i', cat: 'perf',
      q: 'Báo cáo hiển thị 500 đơn hàng kèm tên khách hàng. Code lấy danh sách đơn bằng 1 query, sau đó trong vòng lặp gọi `SELECT name FROM customers WHERE id = ?` cho từng đơn. Vấn đề và cách tối ưu?',
      opts: [
        'Không vấn đề vì mỗi query đều dùng primary key',
        'N+1 query: 501 round-trip tới DB, độ trễ mạng nhân lên. Dùng JOIN trong một query, hoặc gom id và truy vấn một lần `WHERE id IN (...)` (theo lô) rồi ghép trong bộ nhớ',
        'Thêm index cho customers.name',
        'Tăng connection pool',
      ], ans: 'B',
      exp: 'Mỗi query dù chỉ 1ms nhưng 500 lần cộng thêm network latency, chuyển ngữ cảnh, parse... làm tổng thời gian tăng mạnh. Với JPA, N+1 thường ẩn trong lazy loading — xem module Hibernate/JPA. Lưu ý giới hạn số phần tử trong IN (Oracle: 1.000) khi gom lô.',
      tags: ['n+1', 'round-trip', 'batch'], sec: 40,
    },
    {
      id: 'SQL-039', topic: 'SELECT, INSERT, UPDATE, DELETE', d: 'i', cat: 'design',
      q: 'Consumer xử lý sự kiện thanh toán có thể nhận trùng message. Bảng `payments` có UNIQUE constraint trên `transaction_ref`. Cách ghi idempotent gọn nhất trên PostgreSQL?',
      lang: 'sql', code: `
INSERT INTO payments (transaction_ref, amount, status)
VALUES (:ref, :amount, 'RECEIVED')
ON CONFLICT (transaction_ref) DO NOTHING;`,
      opts: [
        'Câu lệnh trên: nếu ref đã tồn tại thì bỏ qua, không lỗi; kiểm tra số dòng bị ảnh hưởng để biết là bản ghi mới hay trùng',
        'SELECT trước, nếu chưa có thì INSERT — luôn an toàn khi chạy song song',
        'Xóa UNIQUE constraint để tránh lỗi',
        'Dùng INSERT thường và bỏ qua mọi SQLException',
      ], ans: 'A',
      exp: 'Unique constraint là chốt chặn cuối cùng đảm bảo không trùng ngay cả khi nhiều consumer chạy song song; check-then-insert có race condition. `ON CONFLICT DO NOTHING/DO UPDATE` (PostgreSQL 9.5+) thực hiện nguyên tử. Oracle dùng `MERGE` hoặc bắt lỗi ORA-00001 (DuplicateKeyException trong Spring). Bỏ qua mọi exception sẽ che giấu lỗi thật.',
      tags: ['idempotency', 'upsert', 'on-conflict'], sec: 50, ver: 'PostgreSQL 9.5+',
    },
    {
      id: 'SQL-040', topic: 'SQL cơ bản', d: 'b', cat: 'theory',
      q: 'Khác biệt giữa `UNION` và `UNION ALL`?',
      opts: [
        'Không khác biệt',
        'UNION loại bỏ dòng trùng (cần sort/hash, tốn chi phí); UNION ALL giữ nguyên mọi dòng và nhanh hơn',
        'UNION ALL loại bỏ dòng trùng',
        'UNION chỉ dùng được với hai bảng có cùng tên cột',
      ], ans: 'B',
      exp: 'Khi biết chắc hai tập không giao nhau hoặc chấp nhận trùng, dùng UNION ALL để tránh chi phí khử trùng. Các truy vấn trong UNION cần cùng số cột và kiểu tương thích (tên cột lấy theo truy vấn đầu tiên).',
      tags: ['union', 'union-all'], sec: 25,
    },
    {
      id: 'SQL-041', topic: 'Transactions', d: 'a', cat: 'scenario',
      q: 'Một API mở transaction, cập nhật trạng thái đơn hàng, sau đó gọi API vận chuyển bên ngoài (đôi khi 20 giây), rồi mới commit. Khi tải cao, nhiều request khác cập nhật cùng đơn bị treo và pool cạn. Cải tiến đúng hướng?',
      opts: [
        'Tăng timeout của transaction lên 60 giây',
        'Không giữ transaction/khóa dòng khi gọi hệ thống ngoài: commit thay đổi cục bộ trước (ví dụ trạng thái PENDING_SHIPMENT), gọi API vận chuyển ngoài transaction (hoặc bất đồng bộ qua outbox/queue), rồi cập nhật kết quả trong transaction ngắn khác',
        'Dùng isolation SERIALIZABLE',
        'Đặt lời gọi API ngoài vào finally',
      ], ans: 'B',
      exp: 'Transaction dài giữ connection và row lock trong suốt thời gian chờ mạng, gây chặn dây chuyền và cạn pool. Thiết kế lại theo trạng thái trung gian + xử lý bù khi lỗi (hoặc Saga) giúp transaction DB ngắn và có thể retry phần gọi ngoài một cách idempotent.',
      tags: ['long-transaction', 'external-call', 'locking'], sec: 60,
    },
    {
      id: 'SQL-042', topic: 'WHERE, GROUP BY, HAVING, ORDER BY', d: 'i', cat: 'sql', tables: [EMPLOYEES],
      q: 'Kết quả của truy vấn sau trên PostgreSQL (hoặc Oracle)?',
      lang: 'sql', code: `
SELECT dept_id, COUNT(*) AS total
FROM employees
GROUP BY dept_id
ORDER BY dept_id;`,
      opts: [
        '(1, 2), (2, 1)',
        '(1, 2), (2, 1), (NULL, 1)',
        '(NULL, 1), (1, 2), (2, 1)',
        '(1, 2), (2, 1), (NULL, 0)',
      ], ans: 'B',
      exp: 'GROUP BY coi mọi giá trị NULL là **một nhóm** (khác với so sánh `=`), nên Dung tạo nhóm dept_id NULL với COUNT(*) = 1. Với ORDER BY ASC, PostgreSQL và Oracle mặc định đặt NULL **cuối** (NULLS LAST); MySQL và SQL Server đặt NULL đầu. Có thể chỉ định rõ `NULLS FIRST/LAST` (PostgreSQL, Oracle).',
      tags: ['group-by', 'null', 'order-by'], sec: 50,
    },
    {
      id: 'SQL-043', topic: 'Execution Plan', d: 'a', cat: 'perf',
      q: 'Truy vấn `SELECT status, created_at FROM orders WHERE customer_id = ?` chạy rất thường xuyên. Plan hiện tại là `Index Scan using idx_customer` rồi đọc bảng (heap) cho mỗi dòng. Index nào có thể cho phép **Index Only Scan** (PostgreSQL) để không phải đọc bảng?',
      opts: [
        'Index riêng trên status',
        'Covering index chứa đủ các cột truy vấn cần: `(customer_id) INCLUDE (status, created_at)` (PostgreSQL 11+) hoặc `(customer_id, status, created_at)`',
        'Index trên created_at',
        'Không thể tránh đọc bảng',
      ], ans: 'B',
      exp: 'Khi index chứa mọi cột cần thiết, DB trả kết quả từ index mà không truy cập bảng. Trên PostgreSQL, index-only scan còn phụ thuộc visibility map (bảng cần được VACUUM thường xuyên). Đánh đổi: index lớn hơn và chi phí ghi tăng. Không nên SELECT * nếu muốn tận dụng covering index.',
      tags: ['covering-index', 'index-only-scan', 'execution-plan'], sec: 55, ver: 'PostgreSQL 11+ (INCLUDE)',
    },
    {
      id: 'SQL-044', topic: 'ACID', d: 'b', cat: 'scenario',
      q: 'Chuyển tiền gồm hai câu lệnh: trừ tài khoản A và cộng tài khoản B. Server crash ngay sau khi trừ A, trước khi cộng B. Thuộc tính nào của transaction đảm bảo A không bị mất tiền?',
      opts: ['Durability', 'Atomicity: transaction chưa commit sẽ bị rollback toàn bộ khi phục hồi, nên việc trừ A cũng bị hủy', 'Isolation', 'Consistency của ứng dụng'], ans: 'B',
      exp: 'Atomicity: "tất cả hoặc không gì cả". Điều kiện là hai câu lệnh phải nằm trong **cùng một transaction** — nếu chạy ở chế độ auto-commit (mỗi câu một transaction), thao tác trừ A đã commit và tiền bị mất. Đây là lý do cần ranh giới transaction đúng ở tầng service.',
      tags: ['acid', 'atomicity', 'transaction'], sec: 30,
    },
    {
      id: 'SQL-045', topic: 'Pessimistic Locking', d: 'i', cat: 'theory',
      q: 'Khác biệt giữa `SELECT ... FOR UPDATE`, `FOR UPDATE NOWAIT` và `FOR UPDATE SKIP LOCKED` khi dòng đang bị transaction khác khóa?',
      opts: [
        'Cả ba đều chờ cho tới khi khóa được giải phóng',
        'FOR UPDATE: chờ (có thể tới timeout/deadlock detection); NOWAIT: báo lỗi ngay; SKIP LOCKED: bỏ qua các dòng đang bị khóa và chỉ trả về dòng khóa được',
        'NOWAIT đọc dữ liệu chưa commit',
        'SKIP LOCKED xóa khóa của transaction khác',
      ], ans: 'B',
      exp: 'Chọn theo nghiệp vụ: chờ khi bắt buộc xử lý đúng dòng đó (trừ số dư); NOWAIT khi muốn báo ngay "bản ghi đang được người khác xử lý"; SKIP LOCKED cho hàng đợi công việc nhiều worker. Trong JPA: `@Lock(PESSIMISTIC_WRITE)` + hint `jakarta.persistence.lock.timeout` (0 tương ứng NOWAIT, -2 là SKIP LOCKED với Hibernate).',
      tags: ['for-update', 'nowait', 'skip-locked'], sec: 45,
    },
    {
      id: 'SQL-046', topic: 'Pagination', d: 'i', cat: 'perf',
      q: 'API danh sách dùng Spring Data `Page<Order> findByStatus(..., Pageable)` trên bảng 50 triệu dòng; log cho thấy mỗi trang chạy thêm một câu `SELECT COUNT(*)` mất 4 giây. Giao diện chỉ có nút "Xem thêm". Tối ưu phù hợp?',
      opts: [
        'Thêm index cho cột id',
        'Đổi kiểu trả về sang `Slice<Order>` (chỉ lấy size + 1 dòng để biết còn trang sau, không đếm tổng) hoặc keyset pagination; nếu cần tổng thì dùng số ước lượng hoặc cache',
        'Tăng timeout của truy vấn',
        'Bỏ phân trang',
      ], ans: 'B',
      exp: '`Page` luôn cần COUNT để tính tổng số trang; COUNT trên tập lớn với điều kiện lọc có thể rất tốn kém. Khi UI không cần tổng chính xác, `Slice` loại bỏ hoàn toàn truy vấn đếm.',
      tags: ['pagination', 'slice', 'count'], sec: 45,
    },
  ]);
})();
