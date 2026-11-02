/* Bài học — Module 8: Database và SQL */
(() => {
  const L = (topic, blocks) => LS.add('database-sql', topic, blocks);

  L('SQL cơ bản', [
    '- **DDL** (CREATE, ALTER, DROP), **DML** (SELECT, INSERT, UPDATE, DELETE), **DCL** (GRANT, REVOKE), **TCL** (COMMIT, ROLLBACK, SAVEPOINT).',
    '- SQL dùng **logic ba giá trị**: TRUE, FALSE, UNKNOWN. Mọi so sánh với NULL (`= NULL`, `<> 1` khi giá trị là NULL) cho UNKNOWN; WHERE chỉ giữ TRUE.',
    '- Kiểm tra NULL bằng `IS NULL / IS NOT NULL`; thay thế bằng `COALESCE(col, default)`.',
    '- `UNION` khử trùng (tốn sort/hash), `UNION ALL` giữ nguyên — dùng UNION ALL khi không cần khử trùng.',
    { lang: 'sql', code: `
SELECT name FROM employees WHERE dept_id <> 1;                  -- bỏ qua dòng dept_id NULL
SELECT name FROM employees WHERE dept_id <> 1 OR dept_id IS NULL;` },
  ]);

  L('SELECT, INSERT, UPDATE, DELETE', [
    '- Chỉ SELECT cột cần thiết; tránh `SELECT *` trong code (tốn băng thông, mất lợi ích covering index, vỡ khi schema đổi).',
    '- UPDATE/DELETE luôn có WHERE; chạy thử điều kiện bằng SELECT trước khi sửa dữ liệu production.',
    '- Batch insert nhiều dòng giảm round-trip.',
    '- Upsert idempotent: PostgreSQL `INSERT ... ON CONFLICT (key) DO NOTHING/DO UPDATE`; Oracle `MERGE`.',
    '- `DELETE` ghi log từng dòng, có thể rollback; `TRUNCATE` xóa nhanh cả bảng (Oracle: DDL, auto commit; PostgreSQL: có thể rollback trong transaction).',
    { lang: 'sql', code: `
UPDATE product SET stock = stock - :qty
WHERE id = :id AND stock >= :qty;     -- cập nhật nguyên tử có điều kiện; 0 dòng => hết hàng` },
  ]);

  L('WHERE, GROUP BY, HAVING, ORDER BY', [
    'Thứ tự xử lý **logic**: `FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT/FETCH`.',
    '- WHERE lọc dòng trước khi nhóm (không dùng aggregate); HAVING lọc nhóm.',
    '- Alias định nghĩa ở SELECT không dùng được trong WHERE, nhưng dùng được trong ORDER BY.',
    '- GROUP BY coi các NULL là **một nhóm**.',
    '- ORDER BY ASC: PostgreSQL/Oracle đặt NULL cuối, MySQL/SQL Server đặt đầu; chỉ định `NULLS FIRST/LAST` khi cần.',
    '- Mọi cột trong SELECT không nằm trong aggregate phải có trong GROUP BY (chuẩn SQL).',
    { lang: 'sql', code: `
SELECT dept_id, AVG(salary) AS avg_salary
FROM employees
WHERE hired_at >= DATE '2020-01-01'
GROUP BY dept_id
HAVING AVG(salary) > 1100
ORDER BY avg_salary DESC;` },
  ]);

  L('INNER JOIN, LEFT JOIN, RIGHT JOIN', [
    { table: [['Loại', 'Kết quả'], ['INNER JOIN', 'Chỉ các cặp thỏa điều kiện'], ['LEFT JOIN', 'Mọi dòng bên trái; bên phải NULL nếu không khớp'], ['RIGHT JOIN', 'Ngược lại LEFT (ít dùng, viết lại thành LEFT)'], ['FULL OUTER JOIN', 'Mọi dòng của cả hai bên'], ['CROSS JOIN', 'Tích Descartes']] },
    '- Điều kiện trên bảng bên phải đặt ở **WHERE** sẽ loại các dòng NULL → LEFT JOIN thành INNER JOIN. Đặt vào **ON** để giữ dòng bên trái.',
    '- Đếm số con trong LEFT JOIN: `COUNT(child.id)` chứ không `COUNT(*)` (COUNT(*) đếm cả dòng NULL → ra 1).',
    '- JOIN quan hệ 1–n làm nhân bản dòng cha → cẩn thận khi SUM cột của bảng cha.',
    { lang: 'sql', code: `
SELECT d.name, COUNT(e.id) AS total
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id AND e.salary > 1100
GROUP BY d.name;` },
  ]);

  L('Subquery', [
    '- **Scalar subquery**: trả một giá trị. **IN/EXISTS subquery**: kiểm tra tồn tại. **Correlated subquery**: tham chiếu bảng ngoài, đánh giá theo từng dòng.',
    '- `NOT IN` với subquery có NULL → không trả dòng nào (vì `x <> NULL` là UNKNOWN). Dùng `NOT EXISTS` (an toàn với NULL, thường thành anti-join).',
    { lang: 'sql', code: `
SELECT d.name FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.id);

SELECT e.name FROM employees e
WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.dept_id = e.dept_id);` },
    '- Optimizer hiện đại thường chuyển subquery thành join; vẫn nên kiểm tra execution plan.',
  ]);

  L('CTE', [
    '`WITH` (Common Table Expression) đặt tên cho truy vấn con, giúp truy vấn phức tạp dễ đọc và tái sử dụng trong cùng câu lệnh.',
    { lang: 'sql', code: `
WITH paid AS (
    SELECT customer_id, SUM(total) AS revenue
    FROM orders WHERE status = 'PAID' GROUP BY customer_id
)
SELECT c.name, p.revenue FROM paid p JOIN customers c ON c.id = p.customer_id
ORDER BY p.revenue DESC FETCH FIRST 10 ROWS ONLY;

WITH RECURSIVE tree AS (                         -- cây danh mục nhiều cấp
    SELECT id, parent_id, name, 1 AS lvl FROM categories WHERE id = :root
    UNION ALL
    SELECT c.id, c.parent_id, c.name, t.lvl + 1 FROM categories c JOIN tree t ON c.parent_id = t.id
)
SELECT * FROM tree;` },
    '- PostgreSQL 12+ inline CTE vào truy vấn chính (trừ khi `MATERIALIZED`); trước đó CTE luôn được tính riêng (optimization fence).',
    '- Oracle có thêm `CONNECT BY PRIOR` cho truy vấn phân cấp.',
  ]);

  L('Window Functions', [
    'Window function tính toán trên một "cửa sổ" các dòng liên quan **mà không gộp dòng** như GROUP BY: `func() OVER (PARTITION BY ... ORDER BY ... ROWS ...)`.',
    { table: [['Hàm', 'Ví dụ giá trị 100, 90, 90, 80'], ['ROW_NUMBER', '1, 2, 3, 4'], ['RANK', '1, 2, 2, 4'], ['DENSE_RANK', '1, 2, 2, 3']] },
    '- `LAG/LEAD` lấy giá trị dòng trước/sau; `SUM() OVER (ORDER BY ...)` tính lũy kế; `AVG() OVER (PARTITION BY dept)` so sánh với trung bình nhóm.',
    '- Không lọc window function trực tiếp trong WHERE (tính sau WHERE) → bọc subquery/CTE.',
    { lang: 'sql', code: `
SELECT * FROM (
  SELECT e.*, ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
  FROM employees e
) t WHERE rn = 1;                                -- người lương cao nhất mỗi phòng` },
  ]);

  L('Aggregate Functions', [
    '- `COUNT(*)` đếm dòng; `COUNT(col)` đếm giá trị khác NULL; `COUNT(DISTINCT col)`.',
    '- `SUM`, `AVG`, `MIN`, `MAX` **bỏ qua NULL**: AVG(100, NULL, 200) = 150.',
    '- Trên tập rỗng: COUNT = 0, SUM/AVG/MIN/MAX = NULL → `COALESCE(SUM(x), 0)`.',
    '- Aggregate có điều kiện: `SUM(CASE WHEN status = \'PAID\' THEN total ELSE 0 END)` hoặc `COUNT(*) FILTER (WHERE ...)` (PostgreSQL).',
    '- `STRING_AGG` (PostgreSQL) / `LISTAGG` (Oracle) nối chuỗi.',
  ]);

  L('Index', [
    'Index (thường là **B-tree**) giúp tìm dòng mà không quét toàn bảng; đổi lại tốn dung lượng và làm chậm INSERT/UPDATE/DELETE.',
    '## Khi index không được dùng',
    '- Bọc cột trong hàm/phép tính: `WHERE DATE(created_at) = ...`, `UPPER(email) = ...` → viết thành khoảng hoặc dùng expression/function-based index.',
    '- Ép kiểu ngầm (so sánh VARCHAR với số).',
    '- `LIKE \'%abc\'` (ký tự đại diện ở đầu).',
    '- Cột có độ chọn lọc thấp (boolean, giới tính) hoặc truy vấn trả về phần lớn bảng — seq scan rẻ hơn.',
    '## Các loại khác',
    '- Unique index (đảm bảo không trùng), partial index (PostgreSQL, `WHERE status = \'NEW\'`), covering index (`INCLUDE`), GIN cho jsonb/full-text, hash, bitmap (Oracle).',
    '! Index FK để JOIN nhanh và tránh khóa/deadlock khi xóa bảng cha (đặc biệt Oracle).',
  ]);

  L('Composite Index', [
    'Composite index `(a, b, c)` được sắp theo a, rồi b, rồi c — giống danh bạ sắp theo họ rồi tên.',
    '- Dùng tốt khi điều kiện là **tiền tố bên trái**: `a`, `a,b`, `a,b,c`. Điều kiện chỉ trên `b` thường không seek được (trừ index skip scan của Oracle).',
    '- Thứ tự cột: cột lọc bằng (`=`) trước, cột range/ORDER BY sau. Ví dụ `WHERE status = ? ORDER BY created_at` → `(status, created_at)`.',
    '- Index `(a)` thừa nếu đã có `(a, b)`.',
    '- Index có thể phục vụ cả lọc và sắp xếp, tránh bước Sort.',
  ]);

  L('Execution Plan', [
    '- PostgreSQL: `EXPLAIN (ANALYZE, BUFFERS)` — chạy thật và so sánh ước lượng với thực tế. Oracle: `EXPLAIN PLAN` + `DBMS_XPLAN.DISPLAY_CURSOR`, SQL Monitor.',
    { table: [['Node', 'Ý nghĩa'], ['Seq Scan / TABLE ACCESS FULL', 'Quét toàn bảng'], ['Index Scan', 'Seek index rồi đọc bảng'], ['Index Only Scan', 'Đủ dữ liệu từ index (covering)'], ['Bitmap Heap Scan', 'Gom vị trí từ index rồi đọc bảng theo khối'], ['Nested Loop / Hash Join / Merge Join', 'Các thuật toán join'], ['Sort / HashAggregate', 'Sắp xếp / gom nhóm']] },
    '## Đọc plan',
    '- Tìm node tốn thời gian nhất; "Rows Removed by Filter" lớn → thiếu index phù hợp.',
    '- Ước lượng `rows` lệch xa `actual rows` → thống kê lỗi thời (chạy `ANALYZE` / gather stats).',
    '- Plan khác nhau giữa môi trường do dữ liệu, thống kê, giá trị tham số.',
    '! `EXPLAIN ANALYZE` thực thi câu lệnh thật — với UPDATE/DELETE hãy bọc trong transaction rồi rollback.',
  ]);

  L('Query Optimization', [
    '- Đo trước: `pg_stat_statements`, slow query log, AWR, APM để tìm truy vấn tốn nhiều tổng thời gian nhất.',
    '- Viết điều kiện sargable; chọn index theo truy vấn thực tế; covering index cho truy vấn nóng.',
    '- Giảm dữ liệu trả về: chọn cột, phân trang keyset, projection.',
    '- Tránh N+1: JOIN, IN theo lô.',
    '- Tránh transaction dài và khóa không cần thiết.',
    '- Xem xét partitioning cho bảng rất lớn theo thời gian; materialized view/denormalize cho báo cáo.',
    '! Tối ưu dựa trên plan và số đo, không đoán. Mỗi index mới đều có chi phí ghi.',
  ]);

  L('Transactions', [
    'Transaction là đơn vị công việc nguyên tử: `BEGIN → ... → COMMIT/ROLLBACK`. JDBC mặc định auto-commit (mỗi câu một transaction).',
    '- Spring quản lý bằng `@Transactional` ở tầng service.',
    '- Giữ transaction **ngắn**: không chờ người dùng, không gọi HTTP/hệ thống ngoài bên trong.',
    '- Savepoint cho rollback một phần.',
    '- Transaction dài trên PostgreSQL cản VACUUM (bloat); trên Oracle tăng undo, có thể gây ORA-01555.',
    '! Lost update: đọc → tính trong Java → ghi đè. Dùng cập nhật nguyên tử, `SELECT FOR UPDATE` hoặc optimistic locking.',
  ]);

  L('ACID', [
    '- **Atomicity**: tất cả hoặc không gì cả — crash giữa chừng thì rollback toàn bộ.',
    '- **Consistency**: chuyển từ trạng thái hợp lệ sang hợp lệ (constraint, FK, check).',
    '- **Isolation**: transaction đồng thời không thấy trạng thái dở dang của nhau theo mức isolation.',
    '- **Durability**: đã commit thì không mất (WAL/redo log được flush trước khi báo commit).',
    '? Liên hệ thực tế: chuyển tiền phải nằm trong một transaction; với microservices không có ACID xuyên service → Saga + eventual consistency.',
  ]);

  L('Isolation Levels', [
    { table: [['Mức', 'Dirty read', 'Non-repeatable read', 'Phantom read'], ['READ UNCOMMITTED', 'Có thể', 'Có thể', 'Có thể'], ['READ COMMITTED', 'Không', 'Có thể', 'Có thể'], ['REPEATABLE READ', 'Không', 'Không', 'Có thể (chuẩn SQL)'], ['SERIALIZABLE', 'Không', 'Không', 'Không']] },
    '- Mặc định: **Oracle, PostgreSQL: READ COMMITTED**; MySQL InnoDB: REPEATABLE READ.',
    '- PostgreSQL REPEATABLE READ (snapshot isolation) ngăn cả phantom; khi xung đột ghi ném lỗi serialization → ứng dụng phải retry. SERIALIZABLE (SSI) có thể hủy transaction.',
    '- Oracle chỉ có READ COMMITTED và SERIALIZABLE (+ READ ONLY).',
    '- Isolation cao hơn không tự giải quyết lost update ở READ COMMITTED — cần locking/cập nhật nguyên tử.',
  ]);

  L('Dirty Read, Non-repeatable Read và Phantom Read', [
    '- **Dirty read**: đọc dữ liệu chưa commit của transaction khác (có thể bị rollback).',
    '- **Non-repeatable read**: đọc cùng một dòng hai lần thấy giá trị khác (bị UPDATE và commit giữa hai lần đọc).',
    '- **Phantom read**: chạy lại cùng điều kiện thấy **tập dòng** khác (có INSERT/DELETE).',
    '- **Lost update**: hai transaction đọc cùng giá trị rồi ghi đè nhau.',
    '- **Write skew**: hai transaction đọc tập dữ liệu chung, ghi vào dòng khác nhau, cùng vi phạm ràng buộc (ví dụ cả hai bác sĩ cùng xin nghỉ) — chỉ SERIALIZABLE hoặc khóa tường minh ngăn được.',
  ]);

  L('Deadlock', [
    'Deadlock DB: T1 giữ khóa dòng A chờ B, T2 giữ B chờ A. DB phát hiện chu trình và hủy một transaction (PostgreSQL "deadlock detected", Oracle ORA-00060).',
    '## Phòng tránh',
    '- Cập nhật nhiều dòng theo **thứ tự nhất quán** (sort theo id).',
    '- Giữ transaction ngắn, chia batch nhỏ.',
    '- Index cho FK và cột trong WHERE của UPDATE (tránh khóa nhiều dòng/bảng).',
    '- Ứng dụng phải **retry** transaction bị hủy (Spring: `CannotAcquireLockException`/`DeadlockLoserDataAccessException`).',
  ]);

  L('Optimistic Locking', [
    'Không khóa khi đọc; khi ghi kiểm tra phiên bản chưa đổi: `UPDATE ... SET ..., version = version + 1 WHERE id = ? AND version = ?`. 0 dòng bị ảnh hưởng → xung đột.',
    '- Phù hợp xung đột **hiếm**: form chỉnh sửa, cấu hình, hồ sơ.',
    '- Xử lý xung đột: báo người dùng tải lại (HTTP 409/412 với ETag) hoặc retry có giới hạn với thao tác tự động.',
    '- JPA: `@Version` — Hibernate tự sinh điều kiện và ném `OptimisticLockException`.',
    '! Tranh chấp cao → retry liên tục tốn kém; chuyển sang cập nhật nguyên tử hoặc pessimistic lock.',
  ]);

  L('Pessimistic Locking', [
    'Khóa dòng ngay khi đọc để transaction khác phải chờ: `SELECT ... FOR UPDATE`.',
    '- `NOWAIT`: lỗi ngay nếu dòng đang bị khóa. `SKIP LOCKED`: bỏ qua dòng bị khóa (hàng đợi job nhiều worker). `FOR SHARE`: khóa chia sẻ.',
    '- JPA: `@Lock(LockModeType.PESSIMISTIC_WRITE)` + hint timeout.',
    { lang: 'sql', code: `
SELECT id FROM jobs WHERE status = 'PENDING'
ORDER BY id LIMIT 10
FOR UPDATE SKIP LOCKED;          -- mỗi worker nhận một lô khác nhau` },
    '! Chỉ khóa trong transaction ngắn; khóa nhiều dòng theo thứ tự nhất quán để tránh deadlock.',
  ]);

  L('Pagination', [
    '- **OFFSET/LIMIT**: đơn giản, nhảy trang được, nhưng OFFSET lớn phải đọc rồi bỏ N dòng (chậm dần), dữ liệu chèn mới làm trùng/sót.',
    '- **Keyset (seek)**: `WHERE (created_at, id) < (:lastCreated, :lastId) ORDER BY created_at DESC, id DESC LIMIT 20` — nhanh ổn định, phù hợp infinite scroll; không nhảy trang tùy ý.',
    '- Luôn có ORDER BY xác định (thêm id làm tie-breaker); giới hạn page size tối đa.',
    '- Spring Data: `Page` chạy thêm COUNT; `Slice` không đếm tổng.',
    '- Oracle 12c+/PostgreSQL: `OFFSET n ROWS FETCH NEXT m ROWS ONLY`. Oracle cũ: ROWNUM phải lọc **sau** ORDER BY trong subquery.',
  ]);

  L('N+1 Query', [
    'N+1: 1 truy vấn lấy danh sách + N truy vấn lấy dữ liệu liên quan cho từng phần tử. Mỗi câu nhanh nhưng tổng thời gian lớn do round-trip.',
    '- Phát hiện: log SQL, Hibernate statistics, APM (nhiều span JDBC giống nhau).',
    '- Khắc phục: JOIN trong một truy vấn, truy vấn theo lô `WHERE id IN (...)` (giới hạn 1.000 phần tử với Oracle), batch fetching của ORM.',
    '- Xem thêm module Hibernate/JPA cho các kỹ thuật cụ thể (fetch join, EntityGraph, @BatchSize).',
  ]);

  L('Database Normalization', [
    '- **1NF**: giá trị nguyên tố, không nhóm lặp (không lưu "12,45,78" trong một cột).',
    '- **2NF**: 1NF + mọi cột không khóa phụ thuộc **toàn bộ** khóa chính (khóa phức hợp).',
    '- **3NF**: 2NF + không phụ thuộc bắc cầu (cột không khóa phụ thuộc cột không khóa khác).',
    '- Lợi ích: giảm dư thừa, tránh bất thường khi cập nhật/xóa.',
    '- **Denormalize có chủ đích** cho hiệu năng đọc/báo cáo (ví dụ lưu giá tại thời điểm mua trong order_items là đúng nghiệp vụ, không phải dư thừa).',
  ]);

  L('Primary Key và Foreign Key', [
    '- **Primary key**: duy nhất, không NULL, định danh dòng. Surrogate key (id sequence/UUID) vs natural key (mã số thuế).',
    '- UUID v4 ngẫu nhiên làm phân mảnh B-tree khi insert; cân nhắc UUID v7/ULID (có thứ tự thời gian) hoặc sequence.',
    '- **Foreign key**: đảm bảo toàn vẹn tham chiếu; mặc định chặn xóa cha khi còn con; `ON DELETE CASCADE/SET NULL` khi khai báo.',
    '- Nên index cột FK.',
    '- Ràng buộc khác: UNIQUE, CHECK, NOT NULL — DB là chốt chặn cuối cho tính đúng đắn dữ liệu.',
  ]);

  L('Oracle và PostgreSQL', [
    { table: [['Chủ đề', 'Oracle', 'PostgreSQL'], ['Chuỗi rỗng', '`\'\'` là NULL', 'Khác NULL'], ['Giới hạn dòng', 'ROWNUM, FETCH FIRST (12c+)', 'LIMIT/OFFSET, FETCH FIRST'], ['Tự tăng', 'SEQUENCE, IDENTITY (12c+)', 'SEQUENCE, IDENTITY/SERIAL'], ['Kiểu chuỗi', 'VARCHAR2', 'VARCHAR/TEXT'], ['Upsert', 'MERGE', 'ON CONFLICT, MERGE (15+)'], ['Truy vấn phân cấp', 'CONNECT BY, recursive WITH', 'WITH RECURSIVE'], ['Isolation', 'READ COMMITTED, SERIALIZABLE', 'Đủ 4 mức (RU = RC)'], ['MVCC', 'Undo segment', 'Nhiều phiên bản tuple + VACUUM']] },
    '- Cả hai đều dùng MVCC: reader không chặn writer và ngược lại.',
    '- PostgreSQL cần theo dõi VACUUM/bloat; transaction "idle in transaction" lâu là nguyên nhân phổ biến.',
    '! Migrate Oracle → PostgreSQL: chuỗi rỗng, DATE của Oracle có cả giờ, so sánh phân biệt hoa thường, hàm NVL/DECODE, sequence trong trigger.',
  ]);

  L('Connection Pool', [
    'Tạo connection DB rất tốn kém (TCP, TLS, xác thực, process server) → dùng pool (HikariCP mặc định trong Spring Boot).',
    '- Cấu hình quan trọng: `maximum-pool-size`, `minimum-idle`, `connection-timeout` (chờ lấy connection, mặc định 30s), `max-lifetime` (nhỏ hơn timeout của DB/firewall), `leak-detection-threshold`.',
    '- Kích thước pool **nhỏ hơn trực giác**: khởi điểm ≈ số core × 2; tổng pool của mọi instance ≤ max_connections của DB.',
    '- "Connection is not available, request timed out" → transaction dài, gọi API ngoài trong transaction, leak, OSIV, pool nhỏ. Xem metrics active/pending và thread dump.',
    '- PgBouncer gom nhiều client connection vào ít server connection.',
  ]);

  L('Database Migration', [
    'Quản lý thay đổi schema như code bằng **Flyway** (`V1__init.sql`) hoặc **Liquibase** (changeSet).',
    '- Migration đã áp dụng là **bất biến** — sửa nội dung gây lỗi checksum; mọi thay đổi là version mới.',
    '- Chạy migration trong CI với DB thật (Testcontainers).',
    '## Zero-downtime (expand–contract)',
    '- Thêm cột mới (nullable/default) → ứng dụng ghi cả hai → backfill → chuyển đọc sang cột mới → bản deploy sau mới xóa cột cũ.',
    '- Rename/drop trực tiếp phá vỡ phiên bản cũ đang chạy song song khi rolling deploy.',
    '- Kiểm tra loại lock của ALTER trên bảng lớn (tạo index: `CREATE INDEX CONCURRENTLY` trên PostgreSQL, `ONLINE` trên Oracle).',
    '! Liquibase kẹt "Waiting for changelog lock" khi pod bị kill giữa chừng → kiểm tra rồi giải phóng `DATABASECHANGELOGLOCK`.',
  ]);
})();
