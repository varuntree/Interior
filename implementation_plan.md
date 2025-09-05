# Implementation Plan

## [Overview]
Fix the missing database persistence issue where generated images are not being saved to the database after successful generation, preventing them from appearing in "My Renders".

The issue lies in the webhook processing workflow where images are being downloaded and stored in Supabase storage, but the corresponding database records (renders and render_variants tables) are not being created consistently. The system has all the necessary infrastructure in place, but there are critical gaps in the asset processing pipeline that need to be addressed to ensure images are properly persisted and appear in "My Renders".

## [Types]
Add comprehensive error handling and validation types for the asset processing pipeline.

```typescript
interface AssetProcessingError {
  type: 'DOWNLOAD_FAILED' | 'STORAGE_FAILED' | 'DATABASE_FAILED' | 'VALIDATION_FAILED';
  message: string;
  jobId: string;
  predictionId: string;
  retryable: boolean;
}

interface ProcessingResult {
  success: boolean;
  renderId?: string;
  variantsCreated: number;
  errors: AssetProcessingError[];
}

interface WebhookProcessingContext {
  jobId: string;
  predictionId: string;
  ownerId: string;
  outputUrls: string[];
  attempt: number;
}
```

## [Files]
Fix the asset processing pipeline and ensure database persistence works correctly.

**Existing files to be modified:**
- `libs/services/storage/assets.ts` - Fix the processGenerationAssets function to ensure proper error handling and database persistence
- `app/api/v1/webhooks/replicate/route.ts` - Improve webhook error handling and retry logic
- `libs/repositories/renders.ts` - Ensure repository functions handle edge cases properly
- `libs/repositories/generation_jobs.ts` - Add missing repository functions if needed

**New files to be created:**
- `libs/services/storage/asset-validator.ts` - Image validation and processing utilities
- `libs/services/storage/retry-handler.ts` - Robust retry mechanism for asset processing

**Configuration updates:**
- Verify environment variables for storage configuration
- Ensure proper database migration state

## [Functions]
Fix and enhance the asset processing functions to ensure database persistence.

**Modified functions:**
- `processGenerationAssets()` in `libs/services/storage/assets.ts` - Add transaction support, better error handling, and ensure all database operations complete successfully
- `downloadAndStoreAsset()` in `libs/services/storage/assets.ts` - Add validation and retry logic
- `handleSuccess()` in `app/api/v1/webhooks/replicate/route.ts` - Improve error handling and logging
- `createRender()` in `libs/repositories/renders.ts` - Ensure proper error handling and rollback capabilities
- `addVariant()` in `libs/repositories/renders.ts` - Add validation and duplicate prevention

**New functions:**
- `validateAssetUrls()` in `libs/services/storage/asset-validator.ts` - Validate image URLs before processing
- `processWithRetry()` in `libs/services/storage/retry-handler.ts` - Robust retry mechanism for failed operations
- `rollbackPartialAssets()` in `libs/services/storage/assets.ts` - Cleanup function for failed processing

## [Classes]
No new classes required for this implementation.

The existing service and repository pattern is sufficient for this fix. We will enhance the existing functions rather than introducing new class structures.

## [Dependencies]
No new external dependencies required.

All necessary dependencies are already in place:
- `@supabase/supabase-js` for database operations
- Existing storage and repository infrastructure
- Current error handling utilities in `libs/api-utils/`

## [Testing]
Comprehensive testing approach to ensure the fix works correctly.

**Test scenarios to validate:**
- Successful webhook processing creates both render and render_variants records
- Failed image downloads don't leave partial database records
- Network timeouts and retries work correctly
- Database transaction rollbacks work for partial failures
- Multiple variants are processed correctly
- Storage and database consistency is maintained

**Validation approach:**
- Test webhook with various failure scenarios
- Verify "My Renders" displays generated images correctly
- Test with different numbers of variants (1-3)
- Validate cleanup functions work for failed generations

## [Implementation Order]
Step-by-step implementation sequence to minimize risks and ensure successful integration.

1. **Fix core asset processing function** - Enhance `processGenerationAssets()` with transaction support and comprehensive error handling
2. **Add asset validation** - Create validation utilities to prevent processing invalid images
3. **Implement retry mechanism** - Add robust retry logic for network and storage failures
4. **Update webhook handler** - Improve error handling in the Replicate webhook endpoint
5. **Add cleanup functions** - Implement rollback capabilities for failed operations
6. **Enhance repository functions** - Add missing error handling and validation to database operations
7. **Add comprehensive logging** - Improve observability for debugging future issues
8. **Test end-to-end workflow** - Validate complete generation → storage → database → UI flow
9. **Verify "My Renders" functionality** - Ensure generated images appear correctly in the UI
