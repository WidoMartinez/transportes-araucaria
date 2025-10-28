// tests/playwright/round-trip-discount.spec.cjs
const { test, expect } = require('@playwright/test');

test.describe('Round-trip Discount', () => {
  test('should display the same-day round-trip discount and total savings', async ({ page }) => {
    // Navigate to the app's homepage
    await page.goto('http://localhost:5173/');

    // --- Step 1: Fill out the initial trip details within the main form ---
    const bookingForm = page.locator('section#inicio');

    // Select a destination
    await bookingForm.locator('select[name="destino"]').selectOption({ label: 'Pucón' });

    // Activate the round-trip switch
    await bookingForm.locator('label[for="idaVuelta-switch"]').click();
    await expect(bookingForm.locator('input[name="fechaRegreso"]')).toBeVisible();

    // --- Step 2: Set dates for a same-day trip ---

    // Set departure date
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    await bookingForm.locator('input[name="fecha"]').fill(todayFormatted);

    // Set return date to the same day
    await bookingForm.locator('input[name="fechaRegreso"]').fill(todayFormatted);

    // --- Step 3: Trigger price calculation ---
    await bookingForm.locator('button:has-text("Ver precios")').click();

    // --- Step 4: Verify the discount is displayed ---

    // Wait for the pricing details to be visible
    await expect(bookingForm.locator('h3:has-text("Resumen de tu viaje")')).toBeVisible({ timeout: 10000 });

    // Check if the specific same-day discount text is present
    const sameDayDiscountElement = bookingForm.locator('span:has-text("Descuento viaje mismo día (25%)")');
    await expect(sameDayDiscountElement).toBeVisible();

    // Check if the "Total Ahorrado" badge is visible
    const totalAhorradoBadge = bookingForm.locator('.bg-green-500:has-text("Ahorraste:")');
    await expect(totalAhorradoBadge).toBeVisible();

    // Take a screenshot for visual confirmation
    await page.screenshot({ path: 'tests/playwright/screenshots/total-savings.png' });
  });
});
