const { sendCreated } = require('../../../shared/utils/response');

class DemoController {
  constructor({ demoService }) {
    this.demoService = demoService;
  }

  create = async (req, res, next) => {
    try {
      const result = await this.demoService.requestDemo(req.body);
      return sendCreated(res, result);
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = DemoController;
