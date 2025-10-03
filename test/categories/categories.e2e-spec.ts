import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let adminUserId: string;
  let userToken: string;
  let userId: string;

  // Test data IDs
  let rootCategoryId: string;
  let childCategoryId: string;
  let grandchildCategoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash('AdminPassword123', 12);
    const adminUser = await dataSource.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), 'admin-cat@example.com', $1, 'Admin', 'Cat', 'admin', true, NOW(), NOW())
       RETURNING id`,
      [hashedAdminPassword],
    );
    adminUserId = adminUser[0].id;

    // Login as admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin-cat@example.com',
        password: 'AdminPassword123',
      })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken;

    // Create regular user
    const hashedUserPassword = await bcrypt.hash('UserPassword123', 12);
    const regularUser = await dataSource.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), 'user-cat@example.com', $1, 'User', 'Cat', 'user', true, NOW(), NOW())
       RETURNING id`,
      [hashedUserPassword],
    );
    userId = regularUser[0].id;

    // Login as user
    const userLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user-cat@example.com',
        password: 'UserPassword123',
      })
      .expect(200);
    userToken = userLogin.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup test data
    if (dataSource) {
      await dataSource.query('DELETE FROM categories WHERE slug LIKE $1', [
        'e2e-test-%',
      ]);
      await dataSource.query('DELETE FROM users WHERE id = ANY($1)', [
        [adminUserId, userId],
      ]);
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /categories', () => {
    it('admin should create a root category', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: {
            en: 'E2E Test Electronics',
            vi: 'Điện tử E2E',
          },
          description: {
            en: 'Electronic devices for testing',
            vi: 'Thiết bị điện tử để test',
          },
          slug: 'e2e-test-electronics',
          isActive: true,
          displayOrder: 1,
        })
        .expect(201)
        .then((response) => {
          expect(response.body.data).toHaveProperty('id');
          expect(response.body.data.name.en).toBe('E2E Test Electronics');
          expect(response.body.data.slug).toBe('e2e-test-electronics');
          expect(response.body.data.isActive).toBe(true);
          expect(response.body.data.parent).toBeNull();

          rootCategoryId = response.body.data.id;
        });
    });

    it('admin should create a child category', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: {
            en: 'E2E Test Laptops',
            vi: 'Laptop E2E',
          },
          slug: 'e2e-test-laptops',
          parentId: rootCategoryId,
          isActive: true,
          displayOrder: 1,
        })
        .expect(201)
        .then((response) => {
          expect(response.body.data).toHaveProperty('id');
          expect(response.body.data.parent).toHaveProperty(
            'id',
            rootCategoryId,
          );

          childCategoryId = response.body.data.id;
        });
    });

    it('should fail with duplicate slug', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: {
            en: 'Duplicate',
            vi: 'Trùng lặp',
          },
          slug: 'e2e-test-electronics',
        })
        .expect(409)
        .then((response) => {
          const message = Array.isArray(response.body.message)
            ? response.body.message.join(' ')
            : response.body.message;
          expect(message).toContain('Slug đã tồn tại');
        });
    });

    it('should fail with invalid slug format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: {
            en: 'Invalid Slug',
            vi: 'Slug không hợp lệ',
          },
          slug: 'Invalid Slug!',
        })
        .expect(400);
    });

    it('should fail with non-existent parent', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: {
            en: 'Orphan',
            vi: 'Mồ côi',
          },
          slug: 'e2e-test-orphan',
          parentId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toContain(
            'Parent category không tồn tại',
          );
        });
    });

    it('regular user should not create category', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: {
            en: 'Forbidden',
            vi: 'Bị cấm',
          },
          slug: 'e2e-test-forbidden',
        })
        .expect(403);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({
          name: {
            en: 'Unauthorized',
            vi: 'Không xác thực',
          },
          slug: 'e2e-test-unauthorized',
        })
        .expect(401);
    });
  });

  describe('GET /categories', () => {
    it('should return paginated categories (public)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .then((response) => {
          expect(response.body.data).toHaveProperty('data');
          expect(response.body.data).toHaveProperty('total');
          expect(Array.isArray(response.body.data.data)).toBe(true);
        });
    });

    it('should filter by active status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories')
        .query({ onlyActive: true })
        .expect(200)
        .then((response) => {
          const categories = response.body.data.data;
          categories.forEach((cat: { isActive: boolean }) => {
            expect(cat.isActive).toBe(true);
          });
        });
    });

    it('should search by keyword', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories')
        .query({ search: 'E2E Test' })
        .expect(200)
        .then((response) => {
          expect(response.body.data.data.length).toBeGreaterThan(0);
        });
    });

    it('should be accessible without authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/categories').expect(200);
    });
  });

  describe('GET /categories/tree', () => {
    it('should return category tree structure (public)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/tree')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body.data)).toBe(true);
          if (response.body.data.length > 0) {
            expect(response.body.data[0]).toHaveProperty('id');
            expect(response.body.data[0]).toHaveProperty('name');
            expect(response.body.data[0]).toHaveProperty('children');
          }
        });
    });

    it('should filter tree by active status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/tree')
        .query({ onlyActive: true })
        .expect(200);
    });
  });

  describe('GET /categories/roots', () => {
    it('should return root categories only (public)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/roots')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body.data)).toBe(true);
          response.body.data.forEach((cat: { parent: null }) => {
            expect(cat.parent).toBeNull();
          });
        });
    });
  });

  describe('GET /categories/:id', () => {
    it('should return category by id (public)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/categories/${rootCategoryId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.data.id).toBe(rootCategoryId);
          expect(response.body.data).toHaveProperty('name');
          expect(response.body.data).toHaveProperty('slug');
        });
    });

    it('should return 404 for non-existent category', () => {
      return request(app.getHttpServer())
        .get('/categories/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /categories/slug/:slug', () => {
    it('should return category by slug (public)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/slug/e2e-test-electronics')
        .expect(200)
        .then((response) => {
          expect(response.body.data.slug).toBe('e2e-test-electronics');
        });
    });

    it('should return 404 for non-existent slug', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/slug/non-existent-slug')
        .expect(404);
    });
  });

  describe('GET /categories/:id/children', () => {
    it('should return direct children (public)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/categories/${rootCategoryId}/children`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body.data)).toBe(true);
          const laptopChild = response.body.data.find(
            (c: { id: string }) => c.id === childCategoryId,
          );
          expect(laptopChild).toBeDefined();
        });
    });
  });

  describe('GET /categories/:id/ancestors', () => {
    it('should return ancestors (breadcrumb) (public)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/categories/${childCategoryId}/ancestors`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /categories/:id/descendants', () => {
    beforeAll(async () => {
      // Create grandchild for testing descendants
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: {
            en: 'E2E Test Gaming Laptops',
            vi: 'Laptop Gaming E2E',
          },
          slug: 'e2e-test-gaming-laptops',
          parentId: childCategoryId,
          isActive: true,
        });

      grandchildCategoryId = response.body.data.id;
    });

    it('should return descendants tree (public)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/categories/${rootCategoryId}/descendants`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('PATCH /categories/:id', () => {
    it('admin should update category', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${rootCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: {
            en: 'E2E Test Electronics Updated',
            vi: 'Điện tử E2E Cập nhật',
          },
        })
        .expect(200)
        .then((response) => {
          expect(response.body.data.name.en).toBe(
            'E2E Test Electronics Updated',
          );
        });
    });

    it('should fail with duplicate slug on update', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${childCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'e2e-test-electronics',
        })
        .expect(409);
    });

    it('regular user should not update category', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${rootCategoryId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: {
            en: 'Forbidden Update',
            vi: 'Cập nhật bị cấm',
          },
        })
        .expect(403);
    });

    it('should return 404 for non-existent category', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: {
            en: 'Not Found',
            vi: 'Không tìm thấy',
          },
        })
        .expect(404);
    });
  });

  describe('PATCH /categories/:id/move', () => {
    it('admin should move category to different parent', async () => {
      // Create a new root category to move child to
      const newRoot = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: {
            en: 'E2E Test Computers',
            vi: 'Máy tính E2E',
          },
          slug: 'e2e-test-computers',
          isActive: true,
        });

      const newRootId = newRoot.body.data.id;

      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${childCategoryId}/move`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentId: newRootId,
          displayOrder: 1,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.data.parent.id).toBe(newRootId);
        });
    });

    it('should fail to create circular reference', async () => {
      // Create a fresh hierarchy for circular reference test
      // Parent -> Child -> Grandchild
      const parent = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: { en: 'E2E Circular Parent', vi: 'Parent Circular' },
          slug: 'e2e-test-circular-parent',
        });
      const parentId = parent.body.data.id;

      const child = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: { en: 'E2E Circular Child', vi: 'Child Circular' },
          slug: 'e2e-test-circular-child',
          parentId: parentId,
        });
      const childId = child.body.data.id;

      // Try to move parent under its own child (circular reference)
      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${parentId}/move`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentId: childId,
        })
        .expect(400)
        .then((response) => {
          const message = Array.isArray(response.body.message)
            ? response.body.message.join(' ')
            : response.body.message;
          expect(message).toContain('circular reference');
        });
    });

    it('regular user should not move category', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${childCategoryId}/move`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          parentId: rootCategoryId,
        })
        .expect(403);
    });
  });

  describe('PATCH /categories/bulk/display-order', () => {
    it('admin should bulk update display order', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/categories/bulk/display-order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          { id: rootCategoryId, displayOrder: 10 },
          { id: childCategoryId, displayOrder: 20 },
        ])
        .expect(200);
    });

    it('regular user should not bulk update', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/categories/bulk/display-order')
        .set('Authorization', `Bearer ${userToken}`)
        .send([{ id: rootCategoryId, displayOrder: 5 }])
        .expect(403);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should fail to delete category with children', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${childCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)
        .then((response) => {
          const message = Array.isArray(response.body.message)
            ? response.body.message.join(' ')
            : response.body.message;
          expect(message).toContain('category con');
        });
    });

    it('admin should delete leaf category', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${grandchildCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('regular user should not delete category', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${childCategoryId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent category', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Response format validation', () => {
    it('all category endpoints should follow standard response format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
