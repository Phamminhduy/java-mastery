/* Bài học — Module 11: Spring Security */
(() => {
  const L = (topic, blocks) => LS.add('security', topic, blocks);

  L('Authentication và Authorization', [
    'Trong Spring Security: `Authentication` (principal, credentials, authorities) được lưu trong `SecurityContext`, truy cập qua `SecurityContextHolder` (mặc định ThreadLocal).',
    '- `AuthenticationManager` → `ProviderManager` → các `AuthenticationProvider` (DaoAuthenticationProvider dùng `UserDetailsService` + `PasswordEncoder`).',
    '- Authorization: `AuthorizationFilter` cho request (`authorizeHttpRequests`), method security cho service.',
    '- Lỗi xác thực → `AuthenticationEntryPoint` (401); thiếu quyền → `AccessDeniedHandler` (403).',
    '! SecurityContext không tự sang thread `@Async` — truyền context bằng `DelegatingSecurityContextAsyncTaskExecutor` hoặc truyền userId tường minh.',
  ]);

  L('Security Filter Chain', [
    'Request → `DelegatingFilterProxy` → `FilterChainProxy` → `SecurityFilterChain` khớp đầu tiên → chuỗi filter (CORS, CSRF, authentication, ExceptionTranslation, Authorization) → DispatcherServlet.',
    { lang: 'java', code: `
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .securityMatcher("/api/**")
        .csrf(csrf -> csrf.disable())                         // API stateless dùng Bearer
        .cors(Customizer.withDefaults())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/public/**").permitAll()   // cụ thể trước
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated())                   // tổng quát sau
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
}` },
    '- Spring Security 6: không còn `WebSecurityConfigurerAdapter`; dùng `authorizeHttpRequests`, `requestMatchers`, lambda DSL.',
    '- Rule xét theo thứ tự, rule khớp đầu tiên được áp dụng.',
    '- Debug: `logging.level.org.springframework.security=TRACE`.',
  ]);

  L('JWT Authentication', [
    '- Cách khuyến nghị: Spring Security **Resource Server** (`oauth2ResourceServer().jwt()`) — xử lý chữ ký, JWKS, validator, lỗi chuẩn.',
    '- Cấu hình `spring.security.oauth2.resourceserver.jwt.issuer-uri` (tự lấy JWKS) hoặc `jwk-set-uri`/public key.',
    '- Map claim tùy chỉnh sang authority bằng `JwtAuthenticationConverter`.',
    '- Nếu tự viết filter (`OncePerRequestFilter`): xác thực token khi có, đặt Authentication vào SecurityContext; không có token thì cho đi tiếp để rule quyết định.',
    '! Không tin `alg` trong header token; whitelist thuật toán; kiểm tra `exp`, `iss`, `aud`.',
  ]);

  L('Password Hashing', [
    '- Dùng hàm băm **chậm, có salt, có tham số chi phí**: BCrypt, Argon2id, scrypt, PBKDF2.',
    '- `PasswordEncoderFactories.createDelegatingPasswordEncoder()` lưu tiền tố `{bcrypt}` → nâng cấp thuật toán dần.',
    '- So khớp bằng `encoder.matches(raw, hash)` — không `encode(raw).equals(hash)` (salt ngẫu nhiên).',
    '- Không bao giờ mã hóa hai chiều mật khẩu; không dùng MD5/SHA không salt.',
    '- Chống brute force: rate limit, khóa tạm thời, MFA.',
  ]);

  L('Role-based Access Control', [
    '- `hasRole("ADMIN")` kiểm tra authority `ROLE_ADMIN` (tự thêm tiền tố); `hasAuthority("order:read")` so khớp chính xác.',
    '- Thiết kế: role là nhóm quyền, authority/permission chi tiết (`order:approve`) để linh hoạt.',
    '- `RoleHierarchy` ("ROLE_ADMIN > ROLE_MANAGER > ROLE_STAFF") để role cao bao hàm role thấp.',
    '- RBAC không đủ cho quyền theo dữ liệu (chủ sở hữu, đơn vị) → kết hợp kiểm tra đối tượng ở service (ABAC/ACL).',
  ]);

  L('Method Security', [
    '- Bật `@EnableMethodSecurity` (Spring Security 6, thay `@EnableGlobalMethodSecurity`).',
    { lang: 'java', code: `
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
public Profile getProfile(Long userId) { ... }

@PostAuthorize("returnObject.ownerId == authentication.name")
public Document load(Long id) { ... }` },
    '- Dựa trên AOP proxy: không áp dụng cho self-invocation, method private.',
    '- Đặt kiểm tra ở service bảo vệ mọi đường vào (REST, message consumer, scheduler).',
    '- Có thể tham chiếu bean: `@PreAuthorize("@orderSecurity.canView(#id, authentication)")`.',
  ]);

  L('CORS và CSRF', [
    '- **CORS**: cho phép origin khác gọi API từ trình duyệt; cấu hình qua `CorsConfigurationSource` + `http.cors()`.',
    '- **CSRF**: trang độc hại lợi dụng việc trình duyệt **tự gửi cookie**. Cần bảo vệ khi xác thực bằng cookie (session hoặc JWT trong cookie).',
    '- API stateless dùng header `Authorization: Bearer` → có thể tắt CSRF.',
    '- SPA dùng cookie: `CookieCsrfTokenRepository.withHttpOnlyFalse()` → client đọc cookie `XSRF-TOKEN` gửi lại header `X-XSRF-TOKEN`; thêm `SameSite`.',
    '! CORS không thay thế CSRF protection; HTTPS cũng không.',
  ]);

  L('Session-based Authentication', [
    '- Sau đăng nhập, server tạo session (lưu SecurityContext), trình duyệt giữ cookie `JSESSIONID`.',
    '- Ưu: thu hồi dễ (xóa session), không lộ thông tin trong token. Nhược: cần lưu trạng thái — nhiều instance phải dùng Spring Session (Redis/JDBC) hoặc sticky session.',
    '- Cookie: `HttpOnly`, `Secure`, `SameSite`; chống session fixation (Spring đổi session id sau đăng nhập); giới hạn số phiên đồng thời.',
    '- Phù hợp ứng dụng web server-side render hoặc SPA cùng domain (BFF).',
  ]);

  L('Stateless Authentication', [
    '- `SessionCreationPolicy.STATELESS`: không tạo/dùng HttpSession; mỗi request mang token.',
    '- Ưu: scale ngang dễ, không cần session store. Nhược: thu hồi token khó, token lớn hơn cookie session.',
    '- Lưu token phía SPA: localStorage (rủi ro XSS đánh cắp) vs cookie HttpOnly (cần chống CSRF); BFF giữ token phía server.',
    '- Access token ngắn hạn + refresh token rotation.',
  ]);

  L('OAuth2 và OpenID Connect', [
    '- **OAuth 2.0**: ủy quyền — client nhận access token để gọi resource server thay mặt user.',
    '- **OIDC**: lớp xác thực trên OAuth2 — ID Token (JWT danh tính), UserInfo, discovery (`/.well-known/openid-configuration`).',
    { table: [['Grant', 'Dùng cho'], ['Authorization Code + PKCE', 'Web app, SPA, mobile (người dùng đăng nhập)'], ['Client Credentials', 'Service-to-service, không có người dùng'], ['Refresh Token', 'Lấy access token mới'], ['Implicit, Password', 'Đã lỗi thời — không dùng']] },
    '- Spring: `oauth2Login()` cho client (đăng nhập qua Keycloak/Google), `oauth2ResourceServer()` cho API, `oauth2Client` để gọi API khác.',
    '- Resource server nên kiểm tra `aud` để token cấp cho service khác không dùng được.',
  ]);

  L('Các lỗi bảo mật thường gặp trong REST API', [
    { table: [['Lỗi', 'Phòng tránh'], ['IDOR/BOLA', 'Kiểm tra quyền sở hữu ở service/truy vấn'], ['Mass assignment', 'DTO input chỉ chứa field được phép'], ['SQL injection', 'Parameter binding, whitelist cột sort'], ['Lộ dữ liệu nhạy cảm', 'DTO output, không serialize entity'], ['User enumeration', 'Thông báo đăng nhập chung, thời gian phản hồi tương đương'], ['Actuator/Swagger công khai', 'Giới hạn endpoint, cổng quản trị nội bộ'], ['Secret trong Git', 'Secret manager, secret scanning; lộ thì rotate ngay'], ['JWT cấu hình sai', 'Thuật toán cố định, kiểm tra exp/iss/aud'], ['Thiếu rate limit', 'Rate limit đăng nhập, API tốn kém'], ['Log chứa token/PII', 'Che dữ liệu khi log']] },
    '- Cập nhật dependency (OWASP Dependency-Check, Dependabot), HTTPS mọi nơi, header bảo mật.',
  ]);
})();
