/* Bài học — Module 15: Git, Linux, Docker và CI/CD */
(() => {
  const L = (topic, blocks) => LS.add('devops-git-linux', topic, blocks);

  L('Git Workflow', [
    '- **GitHub Flow / trunk-based**: branch ngắn hạn từ main, Pull Request + review + CI, merge thường xuyên; feature flag cho tính năng chưa hoàn thiện.',
    '- **GitFlow**: develop, feature, release, hotfix — phù hợp sản phẩm phát hành theo phiên bản.',
    '- Bảo vệ main: bắt buộc review, CI xanh, không push trực tiếp.',
    '- Commit nhỏ, thông điệp rõ (Conventional Commits: `feat:`, `fix:`).',
  ]);

  L('Git Merge và Rebase', [
    '- **Merge**: giữ nguyên lịch sử, tạo merge commit.',
    '- **Rebase**: áp lại commit lên base mới → lịch sử tuyến tính, **commit hash mới**.',
    '- **Squash merge**: gộp toàn bộ branch thành một commit trên main.',
    '! Không rebase branch đã chia sẻ cho người khác (phải force push, làm hỏng repo của họ). `git push --force-with-lease` an toàn hơn `--force`.',
    { lang: 'bash', code: `
git fetch origin
git rebase origin/main          # cập nhật branch cá nhân
git rebase -i HEAD~3            # gộp/sửa commit trước khi mở PR` },
  ]);

  L('Conflict Resolution', [
    '- Conflict khi hai bên sửa cùng vùng code. Mở file, chọn/ghép nội dung giữa `<<<<<<<`, `=======`, `>>>>>>>`.',
    '- Merge: `git add` → `git commit`. Rebase: `git add` → `git rebase --continue` (hoặc `--abort`).',
    '- Sau khi giải quyết: **build và chạy test** — đúng văn bản chưa chắc đúng logic.',
    '- Giảm conflict: branch ngắn, cập nhật thường xuyên, tránh format lại cả file trong PR chức năng.',
  ]);

  L('Git Revert và Reset', [
    { table: [['Lệnh', 'Tác dụng', 'Dùng khi'], ['`git revert <c>`', 'Tạo commit đảo ngược, giữ lịch sử', 'Gỡ thay đổi trên nhánh chung'], ['`git reset --soft <c>`', 'Di chuyển HEAD, giữ staging và working tree', 'Gộp commit cục bộ'], ['`git reset --mixed <c>`', 'Bỏ staging, giữ working tree', 'Bỏ add'], ['`git reset --hard <c>`', 'Xóa thay đổi staging và working tree', 'Bỏ hẳn thay đổi cục bộ (nguy hiểm)']] },
    '- Revert merge commit: `git revert -m 1 <merge>`.',
    '- Lỡ reset mất commit: `git reflog` để tìm lại.',
  ]);

  L('Linux Commands cơ bản', [
    { table: [['Mục đích', 'Lệnh'], ['Tìm file / nội dung', '`find / -name "*.log"`, `grep -rn "ERROR" .`'], ['Dung lượng đĩa', '`df -h`, `du -sh *`, `df -i` (inode)'], ['Bộ nhớ / CPU', '`free -m`, `top`, `htop`, `vmstat`'], ['Quyền', '`chmod`, `chown`, `ls -l`'], ['Mạng', '`curl -v`, `nc -zv host port`, `dig`, `ss -ltnp`'], ['Xử lý văn bản', '`awk`, `sed`, `sort | uniq -c`, `wc -l`']] },
    '- File log bị xóa nhưng tiến trình còn mở → dung lượng không giải phóng (`lsof +L1`); dùng `truncate -s 0` thay vì `rm` khi cần làm trống log đang ghi.',
  ]);

  L('Process và Port', [
    '- Xem tiến trình: `ps -ef | grep java`, `pgrep -f app.jar`, `top -H -p <pid>` (thread).',
    '- Cổng đang lắng nghe: `ss -ltnp | grep 8080`, `lsof -i :8080`.',
    '- Tín hiệu: `kill <pid>` (SIGTERM — graceful), `kill -9` (SIGKILL — không dọn dẹp, dùng khi bất đắc dĩ).',
    '- Mã thoát > 128 = bị tín hiệu: 137 (SIGKILL, thường OOM), 143 (SIGTERM).',
    '- Công cụ JVM: `jcmd <pid> Thread.print`, `GC.heap_info`, `GC.class_histogram`, `VM.native_memory`.',
  ]);

  L('Logs', [
    { lang: 'bash', code: `
tail -F /var/log/app/app.log | grep --line-buffered ERROR
grep -n "OrderService" app.log | tail -50
grep -A 20 "Exception" app.log            # kèm stack trace
journalctl -u app -f --since "10 min ago"
kubectl logs -f deploy/order-service --since=15m
docker logs --tail 200 -f <container>` },
    '- Log rotation (Logback `SizeAndTimeBasedRollingPolicy`, logrotate) tránh đầy đĩa.',
    '- Môi trường container: ghi ra stdout, thu thập tập trung (ELK/Loki).',
    '- Tìm theo traceId để gom log của một request.',
  ]);

  L('Environment Variables', [
    '- Cấu hình theo môi trường và secret được truyền qua biến môi trường (12-Factor).',
    '- Spring relaxed binding: `spring.datasource.url` ↔ `SPRING_DATASOURCE_URL`; `app.feature-flags.new-ui` ↔ `APP_FEATUREFLAGS_NEWUI`.',
    '- Biến môi trường ưu tiên cao hơn application.yml trong jar.',
    '- Kubernetes: `env`, `envFrom` ConfigMap/Secret; hoặc mount file và dùng `spring.config.import=configtree:`.',
    '! Biến môi trường có thể lộ qua `/actuator/env`, `ps e`, log khởi động — bảo vệ endpoint và không in ra.',
  ]);

  L('Docker', [
    '- **Image**: template chỉ đọc gồm các layer. **Container**: instance đang chạy của image, có lớp ghi riêng (mất khi xóa container).',
    '- Dữ liệu bền vững: volume hoặc dịch vụ ngoài.',
    '- Lệnh thường dùng: `docker build -t app:1.0 .`, `docker run -p 8080:8080 -e SPRING_PROFILES_ACTIVE=dev app:1.0`, `docker ps -a`, `docker logs`, `docker exec -it <c> sh`, `docker inspect`, `docker stats`.',
    '- Tag image theo commit SHA/phiên bản, không chỉ `latest`.',
    '- Exit 137 + `State.OOMKilled=true` → vượt giới hạn bộ nhớ.',
  ]);

  L('Dockerfile', [
    { lang: 'dockerfile', code: `
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN ./mvnw -q dependency:go-offline          # layer chỉ đổi khi pom đổi
COPY src src
RUN ./mvnw -q package -DskipTests

FROM eclipse-temurin:21-jre
RUN useradd -r app
USER app
WORKDIR /app
COPY --from=build /src/target/app.jar app.jar
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-jar", "app.jar"]` },
    '- **Multi-stage build**: image runtime nhỏ, không chứa JDK/Maven/mã nguồn.',
    '- Thứ tự layer từ ít thay đổi đến hay thay đổi để tận dụng cache; `.dockerignore` loại `target/`, `.git`.',
    '- Chạy user không phải root; không đưa secret vào image.',
    '- Dạng exec `ENTRYPOINT ["java", ...]` để Java là PID 1 và nhận SIGTERM.',
    '- Spring Boot: layered jar hoặc `mvn spring-boot:build-image` (Buildpacks).',
  ]);

  L('Docker Compose', [
    { lang: 'yaml', code: `
services:
  db:
    image: postgres:16
    environment: { POSTGRES_PASSWORD: secret, POSTGRES_DB: shop }
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
  app:
    image: shop-app:latest
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/shop
    depends_on:
      db: { condition: service_healthy }
    ports: ["8080:8080"]` },
    '- `depends_on` dạng ngắn chỉ đảm bảo thứ tự khởi động, không chờ sẵn sàng → dùng healthcheck + `service_healthy`.',
    '- Phù hợp môi trường dev/test cục bộ; Spring Boot 3.1+ tự khởi động compose.yaml khi chạy ứng dụng (spring-boot-docker-compose).',
  ]);

  L('Container Networking', [
    '- Mỗi container có network namespace riêng: `localhost` trong container là **chính container đó**.',
    '- Các service cùng Compose project/network giao tiếp bằng **tên service** và **cổng container** (`db:5432`).',
    '- `ports` chỉ cần để truy cập từ máy host; truy cập host từ container: `host.docker.internal` (Docker Desktop).',
    '- Kubernetes: Pod có IP riêng; Service cung cấp DNS và cân bằng tải; NetworkPolicy giới hạn ai được gọi ai.',
  ]);

  L('CI/CD Pipeline', [
    '- Thứ tự: checkout → build + unit test → static analysis/security scan (Sonar, OWASP, secret scan) → build & push image (tag SHA) → integration test (Testcontainers) → deploy staging + smoke test → phê duyệt → deploy production → giám sát/rollback.',
    '- **Fail fast**: bước nhanh, rẻ chạy trước.',
    '- **Build once, deploy many**: cùng một artifact promote qua các môi trường.',
    '- Cache dependency để build nhanh; pipeline as code (GitHub Actions, GitLab CI, Jenkinsfile).',
  ]);

  L('Deployment', [
    { table: [['Chiến lược', 'Đặc điểm'], ['Recreate', 'Dừng bản cũ rồi chạy bản mới — có downtime'], ['Rolling', 'Thay dần instance (mặc định Kubernetes)'], ['Blue-green', 'Hai môi trường song song, chuyển traffic một lần, rollback nhanh, tốn tài nguyên'], ['Canary', 'Chuyển một phần nhỏ traffic, theo dõi rồi tăng dần'], ['Feature flag', 'Tách triển khai code khỏi bật tính năng']] },
    '- Yêu cầu chung: graceful shutdown, readiness probe đúng, migration DB tương thích ngược (expand–contract).',
    '- Có kế hoạch rollback và tiêu chí tự động rollback dựa trên metrics.',
  ]);

  L('Environment Configuration', [
    '- 12-Factor: cấu hình tách khỏi code, cung cấp lúc runtime; cùng artifact cho mọi môi trường.',
    '- Nguồn cấu hình: biến môi trường, ConfigMap/Secret, Spring Cloud Config, Vault/AWS Secrets Manager.',
    '- Secret không commit vào Git; xoay vòng định kỳ.',
    '- Ứng dụng fail-fast khi thiếu cấu hình bắt buộc (`@Validated @ConfigurationProperties`).',
    '- Ghi log profile và cấu hình quan trọng (đã che secret) khi khởi động.',
  ]);

  L('Troubleshooting Production', [
    '- **CPU cao**: `top -H -p <pid>` → thread nóng → đổi TID sang hex → tìm `nid=0x…` trong thread dump; hoặc async-profiler/JFR. Nếu thread GC nóng → điều tra bộ nhớ.',
    '- **Treo**: 2–3 thread dump cách nhau vài giây; tìm thread BLOCKED/WAITING cùng chỗ (pool connection, lock, HTTP không timeout).',
    '- **Bộ nhớ**: GC log, heap sau GC, heap dump + MAT; trong container kiểm tra OOMKilled và Native Memory Tracking.',
    '- **Mạng/DB**: `nc -zv host port`, DNS (`dig`), thông điệp lỗi (timeout vs refused vs auth failed).',
    '- **Đĩa**: `df -h`, `du -sh`, file bị xóa vẫn mở (`lsof +L1`).',
    { lang: 'bash', code: `
top -H -p 12345                     # TID nóng: 12399
printf '%x\\n' 12399                  # 306f
jcmd 12345 Thread.print | grep -A 25 'nid=0x306f'` },
  ]);
})();
