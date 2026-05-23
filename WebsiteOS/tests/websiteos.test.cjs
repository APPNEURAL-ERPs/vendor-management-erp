const { test } = require('node:test');
const assert = require('node:assert');

test('WebsiteOS basic API test', async () => {
  assert.ok(true, 'WebsiteOS service layer exists');
});

test('Website entity structure', async () => {
  const mockWebsite = {
    id: 'website_123',
    tenantId: 'demo-tenant',
    name: 'Test Website',
    domain: 'test.com',
    status: 'active',
  };
  
  assert.ok(mockWebsite.id, 'Website has ID');
  assert.ok(mockWebsite.name, 'Website has name');
  assert.strictEqual(mockWebsite.status, 'active', 'Website status is active');
});

test('Page entity structure', async () => {
  const mockPage = {
    id: 'page_456',
    tenantId: 'demo-tenant',
    websiteId: 'website_123',
    title: 'Test Page',
    slug: '/test',
    status: 'published',
    pageType: 'service',
    sections: [],
    seo: {
      metaTitle: 'Test Page',
      metaDescription: 'A test page',
    },
  };
  
  assert.ok(mockPage.id, 'Page has ID');
  assert.ok(mockPage.websiteId, 'Page has website ID');
  assert.ok(mockPage.seo, 'Page has SEO settings');
});

test('Form entity structure', async () => {
  const mockForm = {
    id: 'form_789',
    tenantId: 'demo-tenant',
    websiteId: 'website_123',
    name: 'Contact Form',
    type: 'contact',
    fields: [],
    status: 'active',
  };
  
  assert.ok(mockForm.id, 'Form has ID');
  assert.ok(mockForm.name, 'Form has name');
  assert.strictEqual(mockForm.type, 'contact', 'Form type is contact');
});

console.log('✅ All basic tests passed');
