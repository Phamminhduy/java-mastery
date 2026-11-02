/* Module 15: Git, Linux, Docker và CI/CD */
QB.module({
  id: 'devops-git-linux', order: 15, title: 'Git, Linux, Docker và CI/CD',
  description: 'Git workflow, merge/rebase, revert/reset, lệnh Linux, process/port/log, Docker, Compose, networking, CI/CD, deployment và cấu hình môi trường.',
  topics: ['Git Workflow', 'Git Merge và Rebase', 'Conflict Resolution', 'Git Revert và Reset', 'Linux Commands cơ bản', 'Process và Port', 'Logs',
    'Environment Variables', 'Docker', 'Dockerfile', 'Docker Compose', 'Container Networking', 'CI/CD Pipeline', 'Deployment',
    'Environment Configuration', 'Troubleshooting Production'],
}, [
  {
    id: 'OPS-001', topic: 'Git Workflow', d: 'b', cat: 'theory',
    q: 'Quy trình làm việc nhóm nào được xem là thực hành tốt với Git cho dự án backend?',
    opts: [
      'Mọi người commit trực tiếp lên main',
      'Tạo branch ngắn hạn cho từng thay đổi, mở Pull/Merge Request để review, CI chạy build + test tự động, main được bảo vệ (protected) và chỉ merge khi pass',
      'Mỗi developer giữ branch riêng nhiều tháng rồi merge một lần',
      'Gửi file zip qua email để review',
    ], ans: 'B',
    exp: 'Branch sống càng lâu càng dễ conflict và tích hợp muộn. Trunk-based development (branch rất ngắn, feature flag) và GitHub Flow là các mô hình phổ biến; GitFlow phù hợp hơn với sản phẩm phát hành theo phiên bản. Điểm chung: review code và CI bắt buộc trước khi vào nhánh chính.',
    tags: ['git-workflow', 'pull-request', 'ci'], sec: 30,
  },
  {
    id: 'OPS-002', topic: 'Git Merge và Rebase', d: 'i', cat: 'tradeoff',
    q: 'Phát biểu nào đúng về `git rebase` so với `git merge`?',
    opts: [
      'Rebase giữ nguyên commit hash cũ',
      'Rebase viết lại lịch sử (tạo commit mới với hash mới) để có lịch sử tuyến tính; không nên rebase branch đã chia sẻ cho người khác. Merge giữ nguyên lịch sử và tạo merge commit',
      'Merge luôn xóa commit của branch feature',
      'Rebase chỉ dùng được trên main',
    ], ans: 'B',
    exp: 'Quy tắc vàng: chỉ rebase commit chưa push hoặc branch cá nhân. Rebase branch chung buộc người khác phải xử lý lịch sử bị viết lại (force push). Nhiều team rebase branch feature lên main mới nhất trước khi merge để lịch sử gọn, hoặc dùng squash merge.',
    tags: ['git', 'rebase', 'merge'], sec: 40,
  },
  {
    id: 'OPS-003', topic: 'Conflict Resolution', d: 'b', cat: 'theory',
    q: 'Đang `git rebase main` thì gặp conflict ở `OrderService.java`. Sau khi sửa file, bước tiếp theo đúng là gì?',
    opts: [
      'git commit -m "fix" rồi git push --force',
      '`git add OrderService.java` rồi `git rebase --continue` (hoặc `git rebase --abort` để hủy toàn bộ rebase)',
      'Xóa thư mục .git và clone lại',
      'git reset --hard',
    ], ans: 'B',
    exp: 'Trong rebase, mỗi commit được áp dụng lại lần lượt; sau khi giải quyết conflict của commit hiện tại cần đánh dấu đã giải quyết (`git add`) rồi tiếp tục. Với merge thì `git add` + `git commit`. Sau khi resolve, luôn build và chạy test — conflict được giải quyết về mặt văn bản chưa chắc đúng về logic.',
    tags: ['git', 'conflict', 'rebase'], sec: 30,
  },
  {
    id: 'OPS-004', topic: 'Git Revert và Reset', d: 'i', cat: 'scenario',
    q: 'Một commit lỗi đã được merge vào `main` (nhánh dùng chung, đã deploy). Cần gỡ bỏ thay đổi đó an toàn. Lệnh nào phù hợp?',
    opts: [
      'git reset --hard HEAD~1 rồi git push --force lên main',
      '`git revert <commit>` tạo commit mới đảo ngược thay đổi, rồi push bình thường',
      'Xóa file trong commit bằng tay mà không commit',
      'git checkout <commit>',
    ], ans: 'B',
    exp: 'Revert giữ nguyên lịch sử và an toàn trên nhánh chung. Reset + force push viết lại lịch sử, làm hỏng repository của người khác và có thể mất commit của đồng nghiệp đã push sau đó. Revert một merge commit cần chỉ định parent: `git revert -m 1 <merge-commit>`.',
    tags: ['git', 'revert', 'reset'], sec: 35,
  },
  {
    id: 'OPS-005', topic: 'Git Revert và Reset', d: 'i', cat: 'theory',
    q: 'Bạn vừa tạo 3 commit cục bộ (chưa push) và muốn gộp lại thành 1 commit, **giữ nguyên** mọi thay đổi trong staging area. Lệnh nào phù hợp?',
    opts: ['git reset --hard HEAD~3', 'git reset --soft HEAD~3 rồi git commit', 'git revert HEAD~3', 'git reset --mixed HEAD~3 rồi git push'], ans: 'B',
    exp: '`--soft`: di chuyển HEAD, giữ index (staged) và working tree. `--mixed` (mặc định): giữ working tree nhưng bỏ staging. `--hard`: xóa cả thay đổi trong index và working tree — có thể mất code (vẫn có thể cứu qua `git reflog` nếu đã từng commit). Cách khác: `git rebase -i` với squash.',
    tags: ['git', 'reset', 'squash'], sec: 35,
  },
  {
    id: 'OPS-006', topic: 'Process và Port', d: 'b', cat: 'theory',
    q: 'Ứng dụng không khởi động: "Port 8080 was already in use". Lệnh Linux nào giúp tìm tiến trình đang chiếm cổng 8080?',
    lang: 'bash', code: `
# Chọn lệnh phù hợp`,
    opts: ['ps -ef | grep 8080', 'sudo ss -ltnp | grep :8080   (hoặc sudo lsof -i :8080)', 'df -h', 'chmod 8080'], ans: 'B',
    exp: '`ss -ltnp`: liệt kê socket TCP (t) đang lắng nghe (l), dạng số (n), kèm tiến trình (p). `lsof -i :8080` cũng cho PID. `ps | grep 8080` chỉ khớp nếu "8080" có trong dòng lệnh. Sau khi có PID, xác định đó là gì trước khi dừng nó.',
    tags: ['linux', 'port', 'ss', 'lsof'], sec: 30,
  },
  {
    id: 'OPS-007', topic: 'Logs', d: 'b', cat: 'theory',
    q: 'Cần theo dõi log ứng dụng theo thời gian thực và chỉ hiện dòng chứa "ERROR". Lệnh nào phù hợp?',
    lang: 'bash', code: `
# file log: /var/log/app/app.log`,
    opts: [
      'cat /var/log/app/app.log',
      'tail -f /var/log/app/app.log | grep --line-buffered ERROR',
      'head -n 100 /var/log/app/app.log',
      'less +ERROR /var/log/app/app.log',
    ], ans: 'B',
    exp: '`tail -f` theo dõi dữ liệu mới ghi vào (dùng `tail -F` nếu file bị rotate). `grep --line-buffered` để in ngay từng dòng khi pipe. Với service systemd: `journalctl -u app -f`; container: `docker logs -f` / `kubectl logs -f`. Thêm `-B`/`-A` để xem dòng xung quanh (stack trace).',
    tags: ['linux', 'tail', 'grep', 'logs'], sec: 30,
  },
  {
    id: 'OPS-008', topic: 'Process và Port', d: 'i', cat: 'theory',
    q: 'Khác biệt giữa `kill <pid>` và `kill -9 <pid>` đối với một ứng dụng Spring Boot?',
    opts: [
      'Không khác biệt',
      '`kill` gửi SIGTERM: JVM chạy shutdown hook → Spring đóng context gọn gàng (graceful shutdown, @PreDestroy, đóng pool). `kill -9` gửi SIGKILL: tiến trình bị hủy ngay, không có cơ hội dọn dẹp — request đang xử lý, message chưa ack có thể bị bỏ dở',
      'kill -9 an toàn hơn',
      'kill chỉ dùng cho tiến trình của root',
    ], ans: 'B',
    exp: 'Luôn ưu tiên SIGTERM và chờ một khoảng thời gian; chỉ dùng SIGKILL khi tiến trình không phản hồi. Kubernetes cũng gửi SIGTERM trước, rồi SIGKILL sau terminationGracePeriodSeconds. Lưu ý: nếu Java không phải PID 1 hoặc được bọc bởi shell script không chuyển tiếp tín hiệu, SIGTERM có thể không tới JVM (dùng `exec java ...`).',
    tags: ['linux', 'signals', 'graceful-shutdown'], sec: 40,
  },
  {
    id: 'OPS-009', topic: 'Linux Commands cơ bản', d: 'a', cat: 'debug',
    q: 'Server báo đầy đĩa. Bạn xóa file log 20GB bằng `rm app.log` nhưng `df -h` vẫn báo đầy. Nguyên nhân và cách xử lý?',
    opts: [
      'df bị cache, chờ 24 giờ',
      'Tiến trình Java vẫn đang mở file đó; inode chỉ được giải phóng khi mọi file descriptor đóng. Kiểm tra bằng `lsof +L1` (hoặc `lsof | grep deleted`), restart tiến trình hoặc truncate qua `/proc/<pid>/fd/<n>`; về lâu dài cấu hình log rotation (logback rolling policy với giới hạn dung lượng)',
      'Cần chạy fsck',
      'Do ổ đĩa hỏng',
    ], ans: 'B',
    exp: 'Trên Linux, `rm` chỉ xóa liên kết tên file. Cách an toàn hơn để làm trống log đang được ghi: `truncate -s 0 app.log` hoặc `: > app.log`. Dùng `du -sh /*` và `df -i` (hết inode) khi điều tra đầy đĩa.',
    tags: ['linux', 'disk-full', 'lsof', 'log-rotation'], sec: 50,
  },
  {
    id: 'OPS-010', topic: 'Environment Variables', d: 'i', cat: 'theory',
    q: 'Muốn ghi đè `spring.datasource.url` bằng biến môi trường khi chạy container. Tên biến nào Spring Boot nhận diện theo relaxed binding?',
    opts: ['spring.datasource.url', 'SPRING_DATASOURCE_URL', 'SpringDatasourceUrl', 'DATASOURCE-URL'], ans: 'B',
    exp: 'Quy tắc: thay `.` bằng `_`, bỏ dấu `-`, viết hoa. Ví dụ `app.feature-flags.new-ui` → `APP_FEATUREFLAGS_NEWUI`; phần tử list `my.list[0]` → `MY_LIST_0`. Biến môi trường có độ ưu tiên cao hơn file application.yml trong jar.',
    tags: ['environment-variables', 'relaxed-binding'], sec: 30,
  },
  {
    id: 'OPS-011', topic: 'Docker', d: 'b', cat: 'theory',
    q: 'Phân biệt Docker image và container?',
    opts: [
      'Hai khái niệm giống nhau',
      'Image là template chỉ-đọc gồm các layer (hệ điều hành tối giản, JRE, ứng dụng); container là một instance đang chạy (hoặc đã dừng) tạo từ image, có thêm lớp ghi riêng và tiến trình riêng',
      'Container được build từ Dockerfile, image được tạo từ container',
      'Image chỉ chạy trên Windows',
    ], ans: 'B',
    exp: 'Một image có thể chạy nhiều container. Dữ liệu ghi trong lớp ghi của container mất khi container bị xóa — dữ liệu cần bền vững phải lưu ở volume hoặc dịch vụ bên ngoài. Container nên bất biến: muốn thay đổi thì build image mới.',
    tags: ['docker', 'image', 'container'], sec: 25,
  },
  {
    id: 'OPS-012', topic: 'Dockerfile', d: 'i', cat: 'perf',
    q: 'Dockerfile build ứng dụng Maven mất 6 phút mỗi lần dù chỉ sửa một dòng code, vì luôn tải lại toàn bộ dependency. Cách tổ chức nào tận dụng layer cache tốt nhất?',
    lang: 'dockerfile', code: `
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn -q package -DskipTests`,
    opts: [
      'Giữ nguyên, Docker không hỗ trợ cache',
      'COPY `pom.xml` trước, chạy `mvn dependency:go-offline` (layer này chỉ build lại khi pom thay đổi), sau đó mới COPY `src` và build',
      'Thêm `--no-cache` để build nhanh hơn',
      'Gộp mọi lệnh vào một RUN duy nhất',
    ], ans: 'B',
    exp: 'Docker cache theo từng instruction; một layer thay đổi làm vô hiệu cache các layer sau. `COPY . .` đứng trước khiến mỗi thay đổi source code phải tải lại dependency. Thứ tự nên từ ít thay đổi đến hay thay đổi. BuildKit còn hỗ trợ `RUN --mount=type=cache,target=/root/.m2`. Thêm `.dockerignore` để loại target/, .git.',
    tags: ['dockerfile', 'layer-cache', 'maven'], sec: 45,
  },
  {
    id: 'OPS-013', topic: 'Dockerfile', d: 'i', cat: 'design',
    q: 'Thực hành nào giúp image Spring Boot production **nhỏ hơn và an toàn hơn**?',
    opts: [
      'Dùng image JDK đầy đủ kèm Maven, chạy với user root',
      'Multi-stage build: stage build dùng JDK + Maven, stage runtime chỉ copy jar vào image JRE tối giản (ví dụ eclipse-temurin:21-jre hoặc distroless), chạy bằng user không phải root, không đưa secret vào image',
      'Copy cả mã nguồn và thư mục .git vào image để tiện debug',
      'Đặt mật khẩu DB trong ENV của Dockerfile',
    ], ans: 'B',
    exp: 'Image nhỏ giảm thời gian pull và bề mặt tấn công. Secret trong Dockerfile/layer có thể bị trích xuất từ image history. Spring Boot hỗ trợ layered jar (`java -Djarmode=tools extract`) để tách dependency thành layer riêng, hoặc Buildpacks (`mvn spring-boot:build-image`).',
    tags: ['dockerfile', 'multi-stage', 'security', 'non-root'], sec: 45,
  },
  {
    id: 'OPS-014', topic: 'Container Networking', d: 'i', cat: 'debug',
    q: 'Trong docker-compose có hai service `app` và `db` (PostgreSQL). App cấu hình `jdbc:postgresql://localhost:5432/shop` và báo "Connection refused". Nguyên nhân?',
    opts: [
      'PostgreSQL không hỗ trợ Docker',
      'Trong container, `localhost` là chính container `app`, không phải máy host hay container db. Dùng tên service làm hostname: `jdbc:postgresql://db:5432/shop` (Compose tạo network chung với DNS theo tên service)',
      'Do thiếu `ports` cho service app',
      'Do JDBC driver sai phiên bản',
    ], ans: 'B',
    exp: 'Mỗi container có network namespace riêng. Các service trong cùng Compose project giao tiếp qua mạng nội bộ bằng tên service và **cổng container** (không phải cổng đã publish ra host). `ports` chỉ cần khi truy cập từ máy host vào container.',
    tags: ['docker-compose', 'networking', 'localhost'], sec: 40,
  },
  {
    id: 'OPS-015', topic: 'Docker Compose', d: 'i', cat: 'debug',
    q: 'Compose khai báo `app` có `depends_on: [db]`, nhưng khi `docker compose up`, app thỉnh thoảng lỗi vì DB chưa sẵn sàng nhận kết nối. Giải pháp?',
    lang: 'yaml', code: `
services:
  db:
    image: postgres:16
  app:
    image: shop-app:latest
    depends_on:
      - db`,
    opts: [
      'depends_on đảm bảo DB đã sẵn sàng, lỗi do app',
      '`depends_on` dạng ngắn chỉ đảm bảo thứ tự **khởi động container**, không chờ DB sẵn sàng. Thêm `healthcheck` cho db (ví dụ `pg_isready`) và `depends_on: db: condition: service_healthy`; đồng thời ứng dụng nên chịu được việc DB tạm thời chưa sẵn sàng (retry kết nối)',
      'Thêm sleep 60 vào entrypoint',
      'Chạy app trước db',
    ], ans: 'B',
    exp: 'Container "started" không có nghĩa là service bên trong "ready". Trong môi trường thật (Kubernetes), không có thứ tự khởi động giữa các service nên khả năng tự phục hồi (retry, readiness) là bắt buộc.',
    tags: ['docker-compose', 'depends-on', 'healthcheck'], sec: 45,
  },
  {
    id: 'OPS-016', topic: 'CI/CD Pipeline', d: 'i', cat: 'design',
    q: 'Thứ tự các bước nào hợp lý cho pipeline CI/CD của một service Spring Boot?',
    opts: [
      'Deploy production → chạy unit test → build',
      'Build + unit test → static analysis/security scan (Sonar, dependency check) → build & push image (gắn tag theo commit) → integration test → deploy staging + smoke test → phê duyệt/tự động deploy production (rolling/canary) → giám sát và rollback nếu lỗi',
      'Build image → deploy production → nếu lỗi thì chạy test',
      'Chạy test thủ công trên máy developer rồi copy jar lên server',
    ], ans: 'B',
    exp: 'Nguyên tắc "fail fast": bước rẻ và nhanh chạy trước. Artifact được build **một lần** và promote qua các môi trường (build once, deploy many). Tag image bằng commit SHA (không chỉ `latest`) để truy vết và rollback chính xác.',
    tags: ['ci-cd', 'pipeline'], sec: 45,
  },
  {
    id: 'OPS-017', topic: 'Deployment', d: 'a', cat: 'tradeoff',
    q: 'Đội muốn phát hành phiên bản mới có rủi ro cao (thay đổi thuật toán tính giá) mà vẫn hạn chế ảnh hưởng nếu có lỗi. Chiến lược nào phù hợp nhất và vì sao?',
    opts: [
      'Recreate: dừng toàn bộ bản cũ rồi chạy bản mới',
      'Canary: chuyển một phần nhỏ traffic (ví dụ 5%) sang bản mới, theo dõi metrics lỗi/latency/kết quả nghiệp vụ, tăng dần hoặc rollback nhanh; có thể kết hợp feature flag để bật tắt thuật toán mà không cần deploy lại',
      'Deploy thẳng 100% vào giờ cao điểm để kiểm tra tải',
      'Không cần chiến lược, chỉ cần test kỹ',
    ], ans: 'B',
    exp: 'Rolling update thay dần instance (mặc định của Kubernetes) nhưng mọi người dùng sớm gặp bản mới. Blue-green chuẩn bị môi trường song song và chuyển toàn bộ traffic một lần, rollback nhanh nhưng tốn gấp đôi tài nguyên. Canary giới hạn "bán kính ảnh hưởng". Mọi chiến lược chạy song song hai phiên bản đều đòi hỏi schema DB tương thích ngược.',
    tags: ['deployment', 'canary', 'blue-green', 'feature-flag'], sec: 55,
  },
  {
    id: 'OPS-018', topic: 'Environment Configuration', d: 'i', cat: 'design',
    q: 'Team đang build một jar riêng cho từng môi trường (dev, staging, prod) với cấu hình nhúng sẵn. Đề xuất cải tiến nào đúng nguyên tắc 12-Factor?',
    opts: [
      'Giữ nguyên, mỗi môi trường một bản build là an toàn nhất',
      'Build một artifact duy nhất, cấu hình theo môi trường được cung cấp lúc runtime (biến môi trường, ConfigMap/Secret, config server); secret lấy từ secret manager. Nhờ đó thứ được test ở staging chính là thứ chạy ở production',
      'Lưu cấu hình production trong code và dùng if-else theo hostname',
      'Hỏi đội vận hành sửa file trong jar trên server',
    ], ans: 'B',
    exp: 'Factor III "Config": tách cấu hình khỏi code. Build riêng mỗi môi trường làm mất đảm bảo rằng artifact production đã được kiểm thử. Spring Boot hỗ trợ tự nhiên qua externalized configuration, profile và `spring.config.import` (ví dụ `configtree:` cho Kubernetes secret).',
    tags: ['12-factor', 'configuration', 'build-once'], sec: 45,
  },
  {
    id: 'OPS-019', topic: 'Troubleshooting Production', d: 's', cat: 'debug',
    q: 'Một tiến trình Java chiếm 100% CPU trên server Linux. Quy trình nào giúp xác định **đoạn code** gây ra?',
    lang: 'bash', code: `
top                      # tìm PID của java
top -H -p <pid>          # ?
printf '%x\\n' <tid>      # ?
jstack <pid> | grep -A 30 'nid=0x...'`,
    opts: [
      'Restart server rồi xem có lặp lại không',
      '`top -H -p <pid>` xem các thread tốn CPU nhất → đổi thread id sang hex → tìm thread có `nid=0x<hex>` trong thread dump (jstack/jcmd Thread.print) để thấy stack trace; lặp lại vài lần để xác nhận. Nếu là thread GC thì điều tra bộ nhớ; có thể dùng async-profiler/JFR để có flame graph',
      'Tăng số CPU của server',
      'Xóa log',
    ], ans: 'B',
    exp: 'Thread dump ghi `nid` (native id) dạng hex, khớp với TID mà `top -H` hiển thị dạng thập phân. Nguyên nhân thường gặp: vòng lặp vô hạn, regex backtracking thảm họa, xử lý collection lớn, serialize JSON khổng lồ, hoặc GC liên tục do thiếu bộ nhớ (thread "G1 Conc#"/"GC Thread").',
    tags: ['high-cpu', 'top', 'jstack', 'troubleshooting'], sec: 70,
  },
  {
    id: 'OPS-020', topic: 'Docker', d: 'i', cat: 'debug',
    q: 'Container ứng dụng liên tục khởi động lại. `docker ps -a` cho thấy trạng thái `Exited (137)`. Mã thoát này gợi ý điều gì và bước kiểm tra tiếp theo?',
    opts: [
      'Lỗi cú pháp trong code Java',
      '137 = 128 + 9 (SIGKILL): container bị kill, thường do vượt giới hạn bộ nhớ (OOM killer). Kiểm tra `docker inspect` (State.OOMKilled), `docker stats`, giới hạn memory và cấu hình heap (MaxRAMPercentage); xem `docker logs` của lần chạy trước',
      'Ứng dụng kết thúc thành công',
      'Thiếu quyền đọc file cấu hình',
    ], ans: 'B',
    exp: 'Mã thoát > 128 nghĩa là bị tín hiệu (128 + số tín hiệu): 137 = SIGKILL, 143 = SIGTERM. Exit code 1 thường là lỗi ứng dụng (ví dụ Spring Boot không khởi động được) — xem log. Trên Kubernetes, `kubectl describe pod` hiển thị lý do `OOMKilled`.',
    tags: ['docker', 'exit-code', 'oomkilled'], sec: 45,
  },
]);
