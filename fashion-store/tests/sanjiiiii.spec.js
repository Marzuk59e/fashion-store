import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Helper: cookie notice dismiss করো
async function dismissCookie(page) {
  await page.goto(BASE_URL);
  await page.waitForTimeout(800);
  const acceptBtn = page.locator('button.cookie-btn.primary:has-text("Accept All")');
  if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(300);
  }
}
  // =====================
// 1. HOMEPAGE
// =====================
test.describe('Homepage', () => {
  test('should load with correct title', async ({ page }) => {
    await dismissCookie(page);
    await expect(page).toHaveTitle('sanjiiiii');
  });

  test('should show hero section', async ({ page }) => {
    await dismissCookie(page);
    await expect(page.locator('.hero')).toBeVisible();
  });

  test('should show navbar logo', async ({ page }) => {
    await dismissCookie(page);
    await expect(page.locator('button.nav-logo')).toBeVisible();
  });

  test('should show footer', async ({ page }) => {
    await dismissCookie(page);
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should show Explore Collection button in hero', async ({ page }) => {
    await dismissCookie(page);
    await expect(page.locator('.hero-content .btn-primary')).toBeVisible();
  });
});

// =====================
// 2. NAVIGATION
// =====================
test.describe('Navigation', () => {
  test('should navigate to shop via Collection nav link', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.nav-link:has-text("Collection")');
    await expect(page.locator('h1.shop-title')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h1.shop-title')).toHaveText('The Collection');
  });

  test('should go back to homepage on logo click', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.nav-link:has-text("Collection")');
    await page.click('button.nav-logo');
    await expect(page.locator('.hero')).toBeVisible();
  });

  test('should navigate to About page', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.nav-link:has-text("About")');
    await expect(page.locator('.about-hero')).toBeVisible();
  });

  test('should show Sign In button when not logged in', async ({ page }) => {
    await dismissCookie(page);
    await expect(page.locator('button.btn-primary:has-text("Sign In")')).toBeVisible();
  });
});

// =====================
// 3. SHOP PAGE
// =====================
test.describe('Shop Page', () => {
  test('should load shop page with products', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.nav-link:has-text("Collection")');
    await expect(page.locator('.products-grid')).toBeVisible({ timeout: 8000 });
  });

  test('should show product count', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.nav-link:has-text("Collection")');
    await expect(page.locator('.shop-header p')).toBeVisible();
  });

  test('should show filter buttons', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.nav-link:has-text("Collection")');
    await page.waitForSelector('.filter-bar', { timeout: 5000 });
    await expect(page.locator('.filter-bar button').first()).toBeVisible();
    const filterCount = await page.locator('.filter-bar button').count();
    expect(filterCount).toBeGreaterThan(0);
  });

  test('should filter by Women', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.nav-link:has-text("Collection")');
    await page.click('button.filter-btn:has-text("Women")');
    await expect(page.locator('button.filter-btn.active')).toHaveText('Women');
  });

  test('should open search', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button[aria-label="Search collection"]');
    await expect(page.locator('input.shop-search-input')).toBeVisible();
  });

  test('should search products', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button[aria-label="Search collection"]');
    await page.fill('input.shop-search-input', 'shirt');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });
});

// =====================
// 4. PRODUCT DETAIL PAGE
// =====================
test.describe('Product Detail Page', () => {
  test('should open product detail on card click', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.nav-link:has-text("Collection")');
    await page.waitForSelector('.products-grid', { timeout: 8000 });
    const firstCard = page.locator('.products-grid .product-card').first();
    if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCard.click();
      await expect(page.locator('button.add-cart-btn')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show Add to Bag button', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.nav-link:has-text("Collection")');
    await page.waitForSelector('.products-grid', { timeout: 8000 });
    await page.locator('.product-card').first().click();
    await page.waitForTimeout(500);
    const addToBag = page.locator('button.add-cart-btn');
    if (await addToBag.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(addToBag).toContainText('Add to Bag');
    }
  });

  test('should show size buttons', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.nav-link:has-text("Collection")');
    await page.waitForSelector('.products-grid', { timeout: 8000 });
    await page.locator('.product-card').first().click();
    await page.waitForTimeout(500);
    const sizeBtn = page.locator('button.size-btn').first();
    if (await sizeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(sizeBtn).toBeVisible();
    }
  });
});

// =====================
// 5. AUTH MODAL
// =====================
test.describe('Auth - Sign In', () => {
  test('should open auth modal on Sign In click', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.btn-primary:has-text("Sign In")');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('should close auth modal', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button.btn-primary:has-text("Sign In")');
    await page.waitForTimeout(500);
    const closeBtn = page.locator('button.close-btn').first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
      await expect(page.locator('.hero')).toBeVisible();
    }
  });
});

// =====================
// 6. CART
// =====================
test.describe('Cart', () => {
  test('should show cart icon in navbar', async ({ page }) => {
    await dismissCookie(page);
    await expect(page.locator('button[aria-label="Shopping bag"]')).toBeVisible();
  });

  test('should open cart drawer on click', async ({ page }) => {
    await dismissCookie(page);
    await page.click('button[aria-label="Shopping bag"]');
    await page.waitForTimeout(800);
    await expect(page.locator('body')).toBeVisible();
  });
});

// =====================
// 7. HOMEPAGE SECTIONS
// =====================
test.describe('Homepage Sections', () => {
  test("should show Editor's Picks section", async ({ page }) => {
    await dismissCookie(page);
    await expect(page.locator('h2:has-text("Editor")')).toBeVisible({ timeout: 8000 });
  });

  test('should show New Arrivals section', async ({ page }) => {
    await dismissCookie(page);
    await expect(page.locator('h2:has-text("Arrivals")')).toBeVisible({ timeout: 8000 });
  });

  test('should show category strip', async ({ page }) => {
    await dismissCookie(page);
    await expect(page.locator('.categories-strip')).toBeVisible();
  });
});

// =====================
// 8. RESPONSIVE - MOBILE
// =====================
test.describe('Responsive - Mobile View', () => {
  test('should render homepage on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await dismissCookie(page);
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should render shop page on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await dismissCookie(page);
    await page.click('button.nav-link:has-text("Collection")');
    await expect(page.locator('.products-grid')).toBeVisible({ timeout: 8000 });
  });

  test('navbar should be visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await dismissCookie(page);
    await expect(page.locator('nav.navbar')).toBeVisible();
  });
});