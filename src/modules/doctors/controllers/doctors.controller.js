const { sendSuccess, sendCreated } = require('../../../shared/utils/response');
const { ValidationError } = require('../../../shared/errors');

class DoctorsController {
  constructor({ doctorsService }) {
    this.doctorsService = doctorsService;
  }

  create = async (req, res, next) => {
    try {
      const result = await this.doctorsService.addDoctor(req.user.orgId, req.body);
      return sendCreated(res, result);
    } catch (err) {
      return next(err);
    }
  };

  list = async (req, res, next) => {
    try {
      const result = await this.doctorsService.listDoctors(req.user.orgId);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const result = await this.doctorsService.updateDoctor(req.user.orgId, req.params.id, req.body);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  };

  uploadPhoto = async (req, res, next) => {
    try {
      if (!req.file) {
        throw new ValidationError('photo file is required');
      }
      const result = await this.doctorsService.uploadDoctorPhoto(
        req.user.orgId,
        req.params.id,
        req.file
      );
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = DoctorsController;
