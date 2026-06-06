const { parsePaginationParams, buildPaginationMeta } = require('../../../../src/shared/utils/pagination');

describe('Pagination Utilities', () => {
  describe('parsePaginationParams', () => {
    it('should return defaults for empty query', () => {
      const result = parsePaginationParams({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should calculate correct offset', () => {
      const result = parsePaginationParams({ page: '3', limit: '10' });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
    });

    it('should cap limit at MAX_LIMIT', () => {
      const result = parsePaginationParams({ limit: '500' });
      expect(result.limit).toBe(100);
    });

    it('should handle negative values', () => {
      const result = parsePaginationParams({ page: '-1', limit: '-5' });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('buildPaginationMeta', () => {
    it('should build correct metadata', () => {
      const meta = buildPaginationMeta(2, 10, 55);
      expect(meta.page).toBe(2);
      expect(meta.totalPages).toBe(6);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(true);
    });

    it('should indicate no next page on last page', () => {
      const meta = buildPaginationMeta(3, 10, 30);
      expect(meta.hasNextPage).toBe(false);
    });
  });
});
