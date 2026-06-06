// TODO: Implement Staff service methods
class StaffService {
  constructor({ staffRepository, logger }) {
    this.staffRepo = staffRepository;
    this.logger = logger;
  }
}

module.exports = StaffService;
