const { success, created, noContent, paginated, error } = require('../../../../src/shared/utils/response');
const { createMockResponse } = require('../../../helpers/mocks');

describe('Response Helpers', () => {
  let res;

  beforeEach(() => {
    res = createMockResponse();
  });

  describe('success', () => {
    it('should return 200 with data', () => {
      success(res, { id: 1 }, 'OK');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'OK',
        data: { id: 1 },
      });
    });
  });

  describe('created', () => {
    it('should return 201', () => {
      created(res, { id: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('noContent', () => {
    it('should return 204', () => {
      noContent(res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('paginated', () => {
    it('should include pagination metadata', () => {
      const pagination = { page: 1, limit: 10, totalCount: 100, totalPages: 10 };
      paginated(res, [{ id: 1 }], pagination);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pagination }));
    });
  });

  describe('error', () => {
    it('should return error response', () => {
      error(res, 'Something went wrong', 500);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
});
