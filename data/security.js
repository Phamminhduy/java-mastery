/* Module 11: Spring Security */
QB.module({
  id: 'security', order: 11, title: 'Spring Security',
  description: 'Security Filter Chain, JWT, Password Hashing, RBAC, Method Security, CORS/CSRF, Session vs Stateless, OAuth2/OIDC và lỗi bảo mật thường gặp.',
  topics: ['Authentication và Authorization', 'Security Filter Chain', 'JWT Authentication', 'Password Hashing', 'Role-based Access Control',
    'Method Security', 'CORS và CSRF', 'Session-based Authentication', 'Stateless Authentication', 'OAuth2 và OpenID Connect',
    'Các lỗi bảo mật thường gặp trong REST API'],
}, [
  {
    id: 'SEC-001', topic: 'Security Filter Chain', d: 'i', cat: 'compile',
    q: 'Sau khi nâng cấp lên Spring Boot 3 (Spring Security 6), class cấu hình `extends WebSecurityConfigurerAdapter` không còn biên dịch được. Cách cấu hình đúng hiện nay?',
    opts: [
      'Thêm lại dependency spring-security-config 5.x',
      'Khai báo bean `SecurityFilterChain` nhận `HttpSecurity` và cấu hình bằng lambda DSL (`http.authorizeHttpRequests(auth -> auth...)`), trả về `http.build()`',
      'Dùng @EnableWebMvcSecurity',
      'Cấu hình bảo mật trong application.yml là cách duy nhất',
    ], ans: 'B',
    exp: 'WebSecurityConfigurerAdapter bị deprecated từ Spring Security 5.7 và bị xóa ở 6.0. Cấu hình dựa trên component: `@Bean SecurityFilterChain`, `@Bean UserDetailsService`, `@Bean PasswordEncoder`... Spring Security 6 cũng đổi `authorizeRequests` → `authorizeHttpRequests`, `antMatchers` → `requestMatchers`, và bỏ dần kiểu chain `.and()`.',
    tags: ['spring-security-6', 'securityfilterchain', 'migration'], sec: 45, ver: 'Spring Security 6',
  },
  {
    id: 'SEC-002', topic: 'Security Filter Chain', d: 'a', cat: 'theory',
    q: 'Một request HTTP đi qua Spring Security như thế nào?',
    opts: [
      'Spring Security là một interceptor của DispatcherServlet, chạy sau controller',
      'Servlet container gọi `DelegatingFilterProxy` → `FilterChainProxy` (bean springSecurityFilterChain) → chọn `SecurityFilterChain` phù hợp với request → chuỗi filter bảo mật (CORS, CSRF, authentication filters, ExceptionTranslationFilter, AuthorizationFilter...) chạy **trước** DispatcherServlet',
      'Mỗi controller tự gọi Spring Security',
      'Spring Security chỉ kiểm tra khi có annotation @Secured',
    ], ans: 'B',
    exp: 'Vì là servlet filter, Spring Security bảo vệ cả request không tới controller nào. Có thể có nhiều SecurityFilterChain (ví dụ `/api/**` stateless JWT và `/admin/**` form login) — chain đầu tiên khớp được dùng. Filter JWT tùy chỉnh thường được thêm bằng `addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)`. Bật `logging.level.org.springframework.security=TRACE` để xem chuỗi filter.',
    tags: ['filter-chain', 'delegatingfilterproxy'], sec: 50,
  },
  {
    id: 'SEC-003', topic: 'Security Filter Chain', d: 'i', cat: 'bug',
    q: 'Endpoint `/api/public/health` vẫn yêu cầu đăng nhập (401) với cấu hình sau. Vì sao?',
    code: `
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/**").authenticated()
    .requestMatchers("/api/public/**").permitAll()
    .anyRequest().denyAll()
);`,
    opts: [
      'permitAll không hoạt động với GET',
      'Các rule được xét theo thứ tự khai báo, rule đầu tiên khớp được áp dụng: `/api/**` khớp trước nên yêu cầu authenticated. Phải đặt rule cụ thể (`/api/public/**`) lên trước rule tổng quát',
      'Thiếu dấu / cuối',
      'denyAll ghi đè permitAll',
    ], ans: 'B',
    exp: 'Nguyên tắc: từ cụ thể đến tổng quát, kết thúc bằng `anyRequest()`. Spring Security 6 còn ném lỗi nếu có rule đặt sau `anyRequest()`. Đặt mặc định là từ chối (deny by default) như ví dụ là thực hành tốt.',
    tags: ['authorizehttprequests', 'rule-order'], sec: 40, ver: 'Spring Security 6',
  },
  {
    id: 'SEC-004', topic: 'JWT Authentication', d: 'a', cat: 'design',
    q: 'Bạn tự viết filter xác thực JWT cho API stateless. Cách cài đặt nào đúng?',
    opts: [
      'Filter ném exception 401 cho mọi request không có header Authorization, kể cả endpoint public',
      'Kế thừa `OncePerRequestFilter`: nếu có Bearer token thì xác thực (chữ ký, exp, iss/aud), tạo Authentication và đặt vào `SecurityContextHolder`; nếu không có token thì cho request đi tiếp để rule authorization quyết định; token sai trả 401 thông qua AuthenticationEntryPoint',
      'Lưu user vào HttpSession sau khi giải mã token',
      'Giải mã payload bằng Base64 và tin tưởng claim role mà không cần kiểm tra chữ ký',
    ], ans: 'B',
    exp: 'Filter chỉ nên "thiết lập danh tính"; quyết định cho phép hay không thuộc về AuthorizationFilter dựa trên cấu hình. Không xác minh chữ ký thì ai cũng có thể tự tạo token với role ADMIN. Thay vì tự viết, có thể dùng `oauth2ResourceServer().jwt()` của Spring Security — đã xử lý chữ ký, JWKS, validator và lỗi chuẩn.',
    tags: ['jwt', 'onceperrequestfilter', 'securitycontext'], sec: 60,
  },
  {
    id: 'SEC-005', topic: 'Password Hashing', d: 'i', cat: 'design',
    q: 'Cách lưu mật khẩu người dùng nào đúng?',
    opts: [
      'Mã hóa AES với khóa lưu trong application.yml để có thể giải mã khi cần',
      'Hash bằng thuật toán chậm, có salt và tham số chi phí: BCrypt, Argon2id, scrypt hoặc PBKDF2 (ví dụ `BCryptPasswordEncoder`/`DelegatingPasswordEncoder` của Spring Security)',
      'SHA-256 không salt cho nhanh',
      'MD5 kèm salt cố định toàn hệ thống',
    ], ans: 'B',
    exp: 'Mật khẩu không bao giờ cần giải mã — chỉ cần so khớp. Hash nhanh (MD5/SHA) dễ bị brute force bằng GPU; salt ngẫu nhiên mỗi user chống rainbow table. `PasswordEncoderFactories.createDelegatingPasswordEncoder()` lưu tiền tố `{bcrypt}` giúp nâng cấp thuật toán dần dần.',
    tags: ['password-hashing', 'bcrypt', 'argon2'], sec: 40,
  },
  {
    id: 'SEC-006', topic: 'Password Hashing', d: 'i', cat: 'bug',
    q: 'Đăng nhập luôn thất bại dù người dùng nhập đúng mật khẩu. Lỗi nằm ở đâu?',
    code: `
public boolean login(String rawPassword, User user) {
    String hashed = passwordEncoder.encode(rawPassword);   // BCryptPasswordEncoder
    return hashed.equals(user.getPasswordHash());
}`,
    opts: [
      'BCrypt phân biệt hoa thường',
      'BCrypt sinh salt ngẫu nhiên mỗi lần encode nên hai lần hash cùng mật khẩu cho chuỗi khác nhau. Phải dùng `passwordEncoder.matches(rawPassword, user.getPasswordHash())`',
      'Phải dùng == thay vì equals',
      'Cần decode hash trước khi so sánh',
    ], ans: 'B',
    exp: 'Chuỗi BCrypt chứa cả version, cost và salt (`$2a$10$<salt><hash>`). `matches` đọc salt từ hash đã lưu, hash lại mật khẩu nhập và so sánh (constant-time). Trong luồng chuẩn, `DaoAuthenticationProvider` đã làm việc này.',
    tags: ['bcrypt', 'matches', 'salt'], sec: 40,
  },
  {
    id: 'SEC-007', topic: 'Role-based Access Control', d: 'i', cat: 'debug',
    q: 'UserDetails của user trả về authority `new SimpleGrantedAuthority("ADMIN")`. Endpoint cấu hình `.requestMatchers("/admin/**").hasRole("ADMIN")` nhưng user vẫn nhận 403. Vì sao?',
    opts: [
      'Do hasRole phân biệt hoa thường',
      '`hasRole("ADMIN")` kiểm tra authority `ROLE_ADMIN` (tự thêm tiền tố ROLE_). Hoặc lưu authority là "ROLE_ADMIN", hoặc dùng `hasAuthority("ADMIN")`',
      'Do thiếu @EnableWebSecurity',
      'Do user chưa đăng nhập',
    ], ans: 'B',
    exp: 'Spring Security phân biệt role (quy ước có tiền tố ROLE_) và authority/permission chung. Thiết kế phổ biến: role là nhóm quyền (ROLE_ADMIN), authority chi tiết như `order:read`, `order:approve` để phân quyền linh hoạt hơn.',
    tags: ['hasrole', 'hasauthority', 'role-prefix'], sec: 40,
  },
  {
    id: 'SEC-008', topic: 'Method Security', d: 'a', cat: 'theory',
    q: 'Muốn chỉ chủ tài khoản hoặc ADMIN mới xem được hồ sơ: `@PreAuthorize("hasRole(\'ADMIN\') or #userId == authentication.principal.id")`. Điều kiện cần để annotation có hiệu lực trong Spring Security 6?',
    opts: [
      'Không cần cấu hình gì',
      'Bật `@EnableMethodSecurity` (thay cho @EnableGlobalMethodSecurity đã deprecated), method phải được gọi qua proxy của Spring bean (không self-invocation); tham số `#userId` cần tên tham số khả dụng (biên dịch với -parameters, mặc định trong Spring Boot) hoặc dùng @P',
      'Chỉ hoạt động trên controller',
      'Cần đặt annotation trên field',
    ], ans: 'B',
    exp: 'Method security cũng dựa trên AOP proxy nên có cùng hạn chế với @Transactional. `@EnableMethodSecurity` bật mặc định pre/post annotations. Đặt kiểm tra ở tầng service bảo vệ được mọi đường gọi (REST, message consumer, scheduler).',
    tags: ['preauthorize', 'method-security', 'spel'], sec: 55, ver: 'Spring Security 6',
  },
  {
    id: 'SEC-009', topic: 'CORS và CSRF', d: 'a', cat: 'tradeoff',
    q: 'Khi nào việc tắt CSRF protection (`csrf(csrf -> csrf.disable())`) là hợp lý?',
    opts: [
      'Luôn luôn, vì CSRF chỉ ảnh hưởng ứng dụng PHP',
      'Khi API stateless và trình duyệt **không** tự động gửi credential: xác thực bằng header `Authorization: Bearer` do JavaScript gắn vào. Nếu xác thực bằng cookie (session hoặc JWT trong cookie) thì vẫn cần chống CSRF (token CSRF, SameSite cookie)',
      'Khi đã bật CORS',
      'Khi dùng HTTPS',
    ], ans: 'B',
    exp: 'CSRF lợi dụng việc trình duyệt tự đính kèm cookie khi trang độc hại gửi request tới site của bạn. Header Authorization không được gửi tự động nên không bị khai thác kiểu này. CORS không ngăn được CSRF với form submit đơn giản; HTTPS cũng không liên quan.',
    tags: ['csrf', 'stateless', 'cookie'], sec: 55,
  },
  {
    id: 'SEC-010', topic: 'Session-based Authentication', d: 'i', cat: 'tradeoff',
    q: 'Ứng dụng web dùng session (HttpSession) chạy 1 instance. Khi scale lên 4 instance sau load balancer round-robin, người dùng liên tục bị đăng xuất. Giải pháp phù hợp?',
    opts: [
      'Tăng session timeout',
      'Session lưu trong bộ nhớ từng instance nên request sang instance khác không thấy session. Dùng session store dùng chung (Spring Session + Redis/JDBC) hoặc sticky session (kém linh hoạt khi instance chết); hoặc chuyển sang token stateless',
      'Lưu session trong localStorage',
      'Tắt load balancer',
    ], ans: 'B',
    exp: 'Sticky session đơn giản nhưng mất phiên khi instance bị restart và phân tải kém. Spring Session externalize session một cách trong suốt. Với session-based, nhớ chống session fixation (Spring Security đổi session id sau đăng nhập) và cấu hình cookie `HttpOnly`, `Secure`, `SameSite`.',
    tags: ['session', 'spring-session', 'scaling'], sec: 45,
  },
  {
    id: 'SEC-011', topic: 'Stateless Authentication', d: 'i', cat: 'theory',
    q: 'Trong cấu hình API REST stateless dùng JWT, `sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))` có tác dụng gì?',
    opts: [
      'Mã hóa JWT',
      'Spring Security không tạo và không dùng HttpSession để lưu SecurityContext; mỗi request phải tự mang thông tin xác thực (token)',
      'Tắt mọi kiểm tra bảo mật',
      'Bắt buộc dùng cookie',
    ], ans: 'B',
    exp: 'Không có session → server dễ scale ngang, không cần sticky session hay session store. Đổi lại, mỗi request phải xác thực token (chi phí kiểm tra chữ ký, có thể cache JWKS) và việc thu hồi token khó hơn.',
    tags: ['stateless', 'session-creation-policy'], sec: 35,
  },
  {
    id: 'SEC-012', topic: 'OAuth2 và OpenID Connect', d: 'i', cat: 'theory',
    q: 'Khác biệt cốt lõi giữa OAuth 2.0 và OpenID Connect (OIDC)?',
    opts: [
      'Không khác biệt',
      'OAuth 2.0 là framework **ủy quyền** (cấp access token để truy cập tài nguyên thay mặt người dùng); OIDC là lớp **xác thực** xây trên OAuth 2.0, bổ sung ID Token (JWT chứa thông tin danh tính), endpoint UserInfo và discovery',
      'OIDC thay thế hoàn toàn OAuth 2.0',
      'OAuth 2.0 chỉ dùng cho mobile',
    ], ans: 'B',
    exp: 'Dùng access token của OAuth thuần để "đăng nhập" là sai mục đích (token không nói cho client biết ai đã đăng nhập theo cách chuẩn). "Login with Google/Keycloak" thực chất là OIDC. Trong Spring: `oauth2Login()` cho ứng dụng client, `oauth2ResourceServer()` cho API nhận access token.',
    tags: ['oauth2', 'oidc', 'id-token'], sec: 40,
  },
  {
    id: 'SEC-013', topic: 'OAuth2 và OpenID Connect', d: 'a', cat: 'design',
    q: 'Chọn grant type OAuth 2.0 phù hợp cho từng trường hợp: (1) SPA/mobile app đăng nhập người dùng; (2) batch service gọi API của service khác, không có người dùng.',
    opts: [
      '(1) Implicit; (2) Password grant',
      '(1) Authorization Code + PKCE; (2) Client Credentials',
      '(1) Password grant; (2) Authorization Code',
      '(1) Client Credentials; (2) Implicit',
    ], ans: 'B',
    exp: 'OAuth 2.1/Best Current Practice loại bỏ Implicit và Resource Owner Password grant vì rủi ro bảo mật. Public client (không giữ được secret) dùng Authorization Code với PKCE. Giao tiếp máy-máy dùng Client Credentials, token đại diện cho chính client với scope hạn chế.',
    tags: ['oauth2', 'pkce', 'client-credentials'], sec: 45,
  },
  {
    id: 'SEC-014', topic: 'OAuth2 và OpenID Connect', d: 'a', cat: 'theory',
    q: 'API Spring Boot là Resource Server nhận access token JWT do Keycloak phát hành, cấu hình `spring.security.oauth2.resourceserver.jwt.issuer-uri`. Spring Security xác thực token thế nào?',
    opts: [
      'Gọi Keycloak cho mỗi request để hỏi token có hợp lệ',
      'Dùng discovery từ issuer-uri để lấy JWKS (public keys), xác minh chữ ký cục bộ theo `kid`, kiểm tra `exp`/`nbf`/`iss` (và `aud` nếu cấu hình); khóa được cache và làm mới khi gặp kid mới',
      'Chỉ kiểm tra token có đúng định dạng 3 phần',
      'Giải mã bằng client secret',
    ], ans: 'B',
    exp: 'Xác minh cục bộ bằng public key giúp không phụ thuộc vào authorization server ở mỗi request (khác với opaque token phải introspection). Nên kiểm tra audience để token cấp cho service khác không dùng được ở đây. Mapping role từ claim tùy chỉnh (ví dụ `realm_access.roles`) cần `JwtAuthenticationConverter`.',
    tags: ['resource-server', 'jwks', 'keycloak'], sec: 55,
  },
  {
    id: 'SEC-015', topic: 'Các lỗi bảo mật thường gặp trong REST API', d: 'i', cat: 'theory',
    q: 'API đăng nhập trả về "Email không tồn tại" hoặc "Sai mật khẩu" tùy trường hợp. Rủi ro là gì?',
    opts: [
      'Không có rủi ro, thông báo rõ ràng giúp UX tốt',
      'User enumeration: kẻ tấn công dò được email nào đã đăng ký để tấn công credential stuffing/phishing. Nên trả thông báo chung ("Email hoặc mật khẩu không đúng"), thời gian phản hồi tương đương, kèm rate limiting/khóa tạm thời',
      'Lộ mật khẩu',
      'Gây SQL injection',
    ], ans: 'B',
    exp: 'Rò rỉ tương tự có thể xảy ra ở chức năng quên mật khẩu, đăng ký, hoặc qua độ trễ khác nhau (không hash mật khẩu khi user không tồn tại). Kết hợp giới hạn số lần thử, CAPTCHA sau nhiều lần sai, và MFA.',
    tags: ['user-enumeration', 'login'], sec: 40,
  },
  {
    id: 'SEC-016', topic: 'Các lỗi bảo mật thường gặp trong REST API', d: 'a', cat: 'scenario',
    q: 'Phát hiện file `application-prod.yml` chứa mật khẩu database và AWS secret key đã bị commit lên repository Git (private) từ 3 tháng trước. Hành động ưu tiên **đầu tiên** là gì?',
    opts: [
      'Xóa file trong commit mới',
      'Coi như secret đã bị lộ: thu hồi/xoay vòng (rotate) ngay các credential, kiểm tra log truy cập bất thường; sau đó gỡ khỏi lịch sử Git và chuyển sang secret manager/biến môi trường, thêm secret scanning vào CI',
      'Đổi repository sang private hơn',
      'Chờ xem có ai lợi dụng không',
    ], ans: 'B',
    exp: 'Xóa trong commit mới không loại bỏ khỏi lịch sử, bản clone hay cache CI. Ưu tiên là vô hiệu hóa giá trị bị lộ. Phòng ngừa: Vault/AWS Secrets Manager/Kubernetes Secrets, pre-commit hook (gitleaks), GitHub secret scanning.',
    tags: ['secrets', 'git', 'incident-response'], sec: 45,
  },
  {
    id: 'SEC-017', topic: 'Authentication và Authorization', d: 'a', cat: 'debug',
    q: 'Trong method `@Async`, code gọi `SecurityContextHolder.getContext().getAuthentication()` để ghi audit nhưng nhận null, dù request gốc đã đăng nhập. Nguyên nhân?',
    opts: [
      'Token đã hết hạn',
      'SecurityContext mặc định được lưu theo ThreadLocal (MODE_THREADLOCAL); method @Async chạy trên thread khác nên không có context. Dùng `DelegatingSecurityContextAsyncTaskExecutor`/TaskDecorator để truyền context, hoặc truyền thông tin user như tham số tường minh',
      'Do @Async không hỗ trợ Spring Security',
      'Do thiếu @PreAuthorize',
    ], ans: 'B',
    exp: 'Mọi dữ liệu theo ThreadLocal (SecurityContext, MDC, transaction) không tự sang thread khác. Truyền tham số tường minh (userId) thường rõ ràng và dễ test hơn. MODE_INHERITABLETHREADLOCAL không phù hợp với thread pool vì thread được tái sử dụng.',
    tags: ['securitycontext', 'async', 'threadlocal'], sec: 50,
  },
  {
    id: 'SEC-018', topic: 'Stateless Authentication', d: 's', cat: 'tradeoff',
    q: 'SPA lưu access token JWT. So sánh lưu trong `localStorage` với cookie `HttpOnly; Secure; SameSite`. Nhận định nào chính xác?',
    opts: [
      'localStorage an toàn tuyệt đối vì cùng origin',
      'localStorage: JavaScript đọc được nên bất kỳ lỗ hổng XSS nào cũng đánh cắp được token. Cookie HttpOnly: script không đọc được, nhưng trình duyệt tự gửi cookie nên cần chống CSRF (SameSite, CSRF token). Nhiều kiến trúc dùng BFF giữ token ở server',
      'Cookie không thể dùng cho API',
      'Hai cách hoàn toàn tương đương',
    ], ans: 'B',
    exp: 'Không có lựa chọn hoàn hảo — đây là trade-off giữa rủi ro XSS và CSRF. XSS vẫn nguy hiểm kể cả khi dùng cookie (script có thể gửi request thay người dùng), nên phòng chống XSS (CSP, encode output) luôn cần thiết. Mẫu Backend-for-Frontend giữ token phía server và chỉ cấp session cookie cho trình duyệt.',
    tags: ['jwt-storage', 'xss', 'csrf', 'bff'], sec: 60,
  },
  {
    id: 'SEC-019', topic: 'JWT Authentication', d: 's', cat: 'bug',
    q: 'Service xác thực JWT bằng thư viện tự viết: đọc `alg` từ header token rồi xác minh chữ ký với "khóa đã cấu hình" (public key RSA của Identity Provider). Kẻ tấn công đổi header thành `"alg":"HS256"` và ký token bằng HMAC với **chính public key** làm secret. Token được chấp nhận. Lỗ hổng gì và cách phòng tránh?',
    code: `
String alg = header.get("alg");              // lấy từ token
Key key = config.getVerificationKey();       // public key RSA
boolean valid = verify(alg, key, signingInput, signature);`,
    opts: [
      'Không thể xảy ra vì public key là công khai',
      'Algorithm confusion: tin vào `alg` do client gửi khiến public key (công khai) bị dùng như HMAC secret. Server phải cố định/whitelist thuật toán theo cấu hình (chỉ RS256), từ chối `none`, và dùng thư viện đã kiểm chứng (Nimbus JOSE, Spring Security Resource Server)',
      'Do token quá dài',
      'Do thiếu HTTPS',
    ], ans: 'B',
    exp: 'Mọi trường trong token đều do client kiểm soát cho tới khi chữ ký được xác minh đúng cách. Quy tắc: thuật toán và khóa xác minh do server quyết định; ngoài ra kiểm tra `exp`, `iss`, `aud`. Đây là lớp lỗi đã gây nhiều CVE trong các thư viện JWT.',
    tags: ['jwt', 'algorithm-confusion', 'security'], sec: 70,
  },
  {
    id: 'SEC-020', topic: 'CORS và CSRF', d: 'a', cat: 'design',
    q: 'SPA dùng session cookie (`JSESSIONID`, HttpOnly) để gọi API Spring Boot cùng domain. Cách bật bảo vệ CSRF phù hợp?',
    opts: [
      'Tắt CSRF vì đã có HttpOnly',
      'Giữ CSRF bật, dùng `CookieCsrfTokenRepository.withHttpOnlyFalse()` để server phát token qua cookie `XSRF-TOKEN`; SPA đọc cookie và gửi lại trong header `X-XSRF-TOKEN` (Angular/axios hỗ trợ sẵn); kết hợp cookie `SameSite=Lax/Strict`',
      'Chỉ cần bật CORS cho domain của SPA',
      'Chuyển mọi request sang GET',
    ], ans: 'B',
    exp: 'HttpOnly chống JavaScript đọc cookie (giảm rủi ro XSS đánh cắp session) nhưng không ngăn trình duyệt tự gửi cookie khi trang khác tạo request (CSRF). Kẻ tấn công không đọc được cookie XSRF-TOKEN của domain bạn nên không thể đặt header tương ứng. Spring Security 6 có thay đổi về xử lý CSRF token cho SPA (deferred token, `CsrfTokenRequestAttributeHandler`) — xem tài liệu khi migrate.',
    tags: ['csrf', 'spa', 'cookie'], sec: 55, ver: 'Spring Security 6',
  },
  {
    id: 'SEC-021', topic: 'Role-based Access Control', d: 'i', cat: 'design',
    q: 'Hệ thống có các role ADMIN ⊃ MANAGER ⊃ STAFF (cấp cao có mọi quyền của cấp thấp). Hiện mỗi endpoint phải liệt kê `hasAnyRole("ADMIN","MANAGER","STAFF")`, dễ sót. Cách cấu hình gọn và an toàn hơn trong Spring Security?',
    opts: [
      'Gán cả ba role cho mọi admin trong DB',
      'Khai báo bean `RoleHierarchy` (ví dụ "ROLE_ADMIN > ROLE_MANAGER > ROLE_STAFF") để role cao tự động bao hàm role thấp; endpoint chỉ cần `hasRole("STAFF")`. Với quyền chi tiết hơn, dùng permission/authority riêng',
      'Kiểm tra role bằng if-else trong controller',
      'Tắt phân quyền cho ADMIN',
    ], ans: 'B',
    exp: 'Role hierarchy giảm trùng lặp cấu hình. Khi nghiệp vụ phức tạp (quyền theo dự án, theo đơn vị), RBAC thuần thường không đủ — cần kết hợp kiểm tra theo đối tượng (ABAC/ACL) ở tầng service.',
    tags: ['rbac', 'role-hierarchy'], sec: 40,
  },
]);
