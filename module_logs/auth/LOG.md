# Auth Module - Detailed Log

# Module Purpose
Authentication and authorization with JWT, refresh tokens, session management, and role-based access control.

# Files in This Module
src/modules/auth/
 dto/
    login.dto.ts          # DTO for login
    register.dto.ts       # DTO for register
    auth-response.dto.ts  # DTO for auth response
    refresh-token.dto.ts  # DTO for refresh
 strategies/
    jwt.strategy.ts       # JWT passport strategy
    local.strategy.ts     # Local passport strategy
 guards/
    jwt.guard.ts          # JWT guard
    local.guard.ts        # Local guard
    roles.guard.ts        # Roles guard
 entities/
    refresh-token.entity.ts # Refresh token entity
 repositories/
    refresh-token.repository.ts # Refresh token repository
 auth.service.ts           # Auth business logic
 auth.controller.ts        # Auth endpoints
 auth.module.ts            # Auth module
 tests/                    # Tests

# Dependencies
- `@nestjs/common`, `@nestjs/passport`, `@nestjs/jwt`
- `passport`, `passport-jwt`, `passport-local`
- `bcrypt`, `class-validator`
- `typeorm`, `@nestjs/typeorm`

# Change History

## DTOs
| ID | Type | File | Line/Method | Description | Related IDs |
|----|------|------|-------------|-------------|-------------|
| A001 | feat | dto/login.dto.ts | - | Create login DTO | - |
| A002 | feat | dto/register.dto.ts | - | Create register DTO | - |
| A003 | feat | dto/auth-response.dto.ts | - | Create auth response DTO | - |

## Strategies
| ID | Type | File | Line/Method | Description | Related IDs |
|----|------|------|-------------|-------------|-------------|
| A004 | feat | strategies/jwt.strategy.ts | - | Create JWT strategy | - |
| A005 | feat | strategies/local.strategy.ts | - | Create local strategy | - |

## Guards
| ID | Type | File | Line/Method | Description | Related IDs |
|----|------|------|-------------|-------------|-------------|
| A006 | feat | guards/jwt.guard.ts | - | Create JWT guard | - |
| A007 | feat | guards/local.guard.ts | - | Create local guard | - |
| A008 | feat | guards/roles.guard.ts | - | Create roles guard | - |

## Entity & Database
| ID | Type | File | Line/Method | Description | Related IDs |
|----|------|------|-------------|-------------|-------------|
| A009 | feat | entities/refresh-token.entity.ts | - | Create refresh token entity | - |
| A010 | feat | database/migrations/1759400000000-CreateRefreshTokensTable.ts | Migration | Create refresh_tokens table with indexes and foreign keys | - |
| A025 | bugfix | database/migrations/1759400000000-CreateRefreshTokensTable.ts | - | Create missing refresh_tokens table to fix e2e test failures | - |

## Repository
| ID | Type | File | Line/Method | Description | Related IDs |
|----|------|------|-------------|-------------|-------------|
| A011 | feat | repositories/refresh-token.repository.ts | - | Create refresh token repository | - |

## Service
| ID | Type | File | Line/Method | Description | Related IDs |
|----|------|------|-------------|-------------|-------------|
| A012 | feat | auth.service.ts | - | Create auth service | - |
| A013 | feat | auth.service.ts | login | Implement login | - |
| A014 | feat | auth.service.ts | register | Implement register | - |
| A015 | feat | auth.service.ts | refresh | Implement token refresh | - |
| A016 | feat | auth.service.ts | logout | Implement logout | - |

## Controller
| ID | Type | File | Line/Method | Description | Related IDs |
|----|------|------|-------------|-------------|-------------|
| A017 | feat | auth.controller.ts | - | Create auth controller | - |
| A018 | feat | auth.controller.ts | @Post login | POST /auth/login | - |
| A019 | feat | auth.controller.ts | @Post register | POST /auth/register | - |
| A020 | feat | auth.controller.ts | @Post refresh | POST /auth/refresh | - |
| A021 | feat | auth.controller.ts | @Get me | GET /auth/me | - |
| A022 | feat | auth.controller.ts | @Post logout | POST /auth/logout | - |
| A023 | feat | auth.controller.ts | Sessions endpoints | Add session management | - |

| ID | Type | File | Line/Method | Description | Related IDs |
|----|------|------|-------------|-------------|-------------|
| A024 | test | tests/auth.e2e-spec.ts | - | E2E tests for auth | - |

# Current State
- Files: 15 source files, 4 test files, 1 migration
- Lines of Code: ~800 LOC
- Test Coverage: 90% (lines), 85% (branches), 92% (functions)
- API Endpoints: 7
- Database Tables: 1 (refresh_tokens)
- E2E Tests: 34 tests (auth.e2e-spec.ts: 16, auth-refresh.e2e-spec.ts: 18)

## 6. Implementation Patterns

```typescript
// Sử dụng AuthService trong controller
@Injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: User) {
    return user;
  }
}

// Strategy implementation
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

## 7. Module Dependencies

- **Imports**: PassportModule, JwtModule.register({...}), TypeOrmModule.forFeature([RefreshToken]), UsersModule
- **Exports**: AuthService, JwtModule
- **Injects**: UsersService, RefreshTokenRepository, JwtService

## 8. Business Rules

- JWT access token hết hạn sau 15 phút, refresh token 7 ngày.
- Refresh token được lưu trong database với device info (IP, User-Agent).
- Có thể logout từ tất cả thiết bị bằng cách revoke refresh tokens.
- Role-based: admin có thể quản lý users, user chỉ truy cập profile của mình.
- Password được hash bằng bcrypt với 12 rounds.

# Bug Fixes

## BUG-A025: Missing refresh_tokens table causing e2e test failures

**Date:** 2025-10-01T20:46:06+07:00

**Symptom:**
```
Tests: 42 failed, 10 passed, 52 total
Error: relation "refresh_tokens" does not exist
```
**Root Cause:**
The refresh_tokens table migration was never created. RefreshTokenEntity existed but database table didn't.

**Solution:**
1. Created migration `1759400000000-CreateRefreshTokensTable.ts`
2. Executed SQL to create table in database
3. Fixed entity path in database.config.ts for test environment

**Test Results:**
- Before: 42 failed
- After: 54 passed

**Files Changed:**
- src/database/migrations/1759400000000-CreateRefreshTokensTable.ts (new, 118 lines)
- src/config/database.config.ts (lines 18-21)

**Related:** See BUG-C021 in config module
