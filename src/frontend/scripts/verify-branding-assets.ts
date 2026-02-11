/**
 * Pre-deployment verification script for Dini GC branding assets
 * Ensures title and icon references are correct before production deployment
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REQUIRED_TITLE = 'Dini GC';
const REQUIRED_FAVICON = '/assets/generated/dinigc-favicon.dim_64x64.png';
const REQUIRED_APPLE_ICON = '/assets/generated/dinigc-apple-touch-icon.dim_180x180.png';

function verifyBranding(): boolean {
  let allChecksPass = true;

  // Check 1: Verify index.html exists
  const indexPath = join(process.cwd(), 'frontend', 'index.html');
  if (!existsSync(indexPath)) {
    console.error('❌ frontend/index.html not found');
    return false;
  }

  // Check 2: Read and verify HTML content
  const htmlContent = readFileSync(indexPath, 'utf-8');

  // Check title
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
  if (!titleMatch || titleMatch[1] !== REQUIRED_TITLE) {
    console.error(`❌ Title mismatch. Expected: "${REQUIRED_TITLE}", Found: "${titleMatch?.[1] || 'none'}"`);
    allChecksPass = false;
  } else {
    console.log(`✓ Title correct: "${REQUIRED_TITLE}"`);
  }

  // Check favicon link
  if (!htmlContent.includes(`href='${REQUIRED_FAVICON}'`)) {
    console.error(`❌ Favicon link missing or incorrect. Expected: ${REQUIRED_FAVICON}`);
    allChecksPass = false;
  } else {
    console.log(`✓ Favicon link correct: ${REQUIRED_FAVICON}`);
  }

  // Check apple-touch-icon link
  if (!htmlContent.includes(`href='${REQUIRED_APPLE_ICON}'`)) {
    console.error(`❌ Apple touch icon link missing or incorrect. Expected: ${REQUIRED_APPLE_ICON}`);
    allChecksPass = false;
  } else {
    console.log(`✓ Apple touch icon link correct: ${REQUIRED_APPLE_ICON}`);
  }

  // Check 3: Verify asset files exist
  const faviconPath = join(process.cwd(), 'frontend', 'public', 'assets', 'generated', 'dinigc-favicon.dim_64x64.png');
  if (!existsSync(faviconPath)) {
    console.error(`❌ Favicon asset not found at: ${faviconPath}`);
    allChecksPass = false;
  } else {
    console.log(`✓ Favicon asset exists`);
  }

  const appleTouchPath = join(process.cwd(), 'frontend', 'public', 'assets', 'generated', 'dinigc-apple-touch-icon.dim_180x180.png');
  if (!existsSync(appleTouchPath)) {
    console.error(`❌ Apple touch icon asset not found at: ${appleTouchPath}`);
    allChecksPass = false;
  } else {
    console.log(`✓ Apple touch icon asset exists`);
  }

  return allChecksPass;
}

// Run verification
console.log('\n🔍 Verifying Dini GC branding assets...\n');
const success = verifyBranding();

if (success) {
  console.log('\n✅ All branding checks passed! Ready for deployment.\n');
  process.exit(0);
} else {
  console.log('\n❌ Branding verification failed. Please fix the issues above before deploying.\n');
  process.exit(1);
}
