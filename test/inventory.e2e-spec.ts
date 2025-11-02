import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('Inventory E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let inventoryId: string;
  let itemId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);

    // Clean database
    await prisma.discussionPost.deleteMany();
    await prisma.like.deleteMany();
    await prisma.itemFieldValue.deleteMany();
    await prisma.item.deleteMany();
    await prisma.fieldDefinition.deleteMany();
    await prisma.customIdSequence.deleteMany();
    await prisma.inventoryTag.deleteMany();
    await prisma.inventoryAccess.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Admin Test',
        roles: [UserRole.ADMIN, UserRole.USER],
      },
    });

    const user = await prisma.user.create({
      data: {
        email: 'user@test.com',
        name: 'User Test',
        roles: [UserRole.USER],
      },
    });

    // Generate tokens (simplified - in real app use auth service)
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET);
    userToken = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Inventory Management', () => {
    it('should create an inventory', async () => {
      const response = await request(app.getHttpServer())
        .post('/inventories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Inventory',
          description: 'Test Description',
          category: 'Test',
          isPublic: true,
          tags: ['test', 'demo'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Inventory');
      inventoryId = response.body.id;
    });

    it('should get inventory by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/inventories/${inventoryId}`)
        .expect(200);

      expect(response.body.id).toBe(inventoryId);
      expect(response.body.title).toBe('Test Inventory');
    });

    it('should list inventories', async () => {
      const response = await request(app.getHttpServer())
        .get('/inventories')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should update inventory with version check', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/inventories/${inventoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Inventory',
          version: 1,
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Inventory');
      expect(response.body.version).toBe(2);
    });

    it('should fail update with wrong version', async () => {
      await request(app.getHttpServer())
        .patch(`/inventories/${inventoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Should Fail',
          version: 1,
        })
        .expect(409);
    });
  });

  describe('Field Management', () => {
    it('should add field to inventory', async () => {
      const response = await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'SINGLELINE',
          title: 'Product Name',
          description: 'Name of the product',
          showInTable: true,
        })
        .expect(201);

      expect(response.body.title).toBe('Product Name');
      expect(response.body.type).toBe('SINGLELINE');
    });

    it('should enforce field type limits', async () => {
      // Add 3 SINGLELINE fields
      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer())
          .post(`/inventories/${inventoryId}/fields`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            type: 'SINGLELINE',
            title: `Field ${i}`,
            showInTable: true,
          })
          .expect(201);
      }

      // 4th should fail
      await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'SINGLELINE',
          title: 'Should Fail',
          showInTable: true,
        })
        .expect(400);
    });
  });

  describe('Item Management', () => {
    it('should create item with generated custom ID', async () => {
      const response = await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fieldValues: [
            {
              valueText: 'Test Product',
            },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('customId');
      expect(response.body.customId).toBeTruthy();
      itemId = response.body.id;
    });

    it('should fail to create item with duplicate custom ID', async () => {
      const firstItem = await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customId: 'UNIQUE-001',
          fieldValues: [],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customId: 'UNIQUE-001',
          fieldValues: [],
        })
        .expect(409);
    });

    it('should list items', async () => {
      const response = await request(app.getHttpServer())
        .get(`/inventories/${inventoryId}/items`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should toggle like on item', async () => {
      const response1 = await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items/${itemId}/like`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(response1.body.liked).toBe(true);

      const response2 = await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/items/${itemId}/like`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(response2.body.liked).toBe(false);
    });
  });

  describe('Discussion', () => {
    it('should create discussion post', async () => {
      const response = await request(app.getHttpServer())
        .post(`/inventories/${inventoryId}/discussion`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          markdownText: '# Test Post\n\nThis is a test discussion post.',
        })
        .expect(201);

      expect(response.body.markdownText).toContain('Test Post');
      expect(response.body).toHaveProperty('author');
    });

    it('should list discussion posts', async () => {
      const response = await request(app.getHttpServer())
        .get(`/inventories/${inventoryId}/discussion`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    it('should get inventory statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/inventories/${inventoryId}/stats`)
        .expect(200);

      expect(response.body).toHaveProperty('itemCount');
      expect(typeof response.body.itemCount).toBe('number');
    });
  });

  describe('Search', () => {
    it('should search inventories and items', async () => {
      const response = await request(app.getHttpServer())
        .get('/search?q=test')
        .expect(200);

      expect(response.body).toHaveProperty('inventories');
      expect(response.body).toHaveProperty('items');
    });

    it('should autocomplete tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/tags?prefix=te')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Admin Operations', () => {
    it('should list users (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should deny user access to admin endpoint', async () => {
      await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
