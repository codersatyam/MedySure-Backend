// TODO: Implement Patient service methods
class PatientService {
  constructor({ patientRepository, logger }) {
    this.patientRepo = patientRepository;
    this.logger = logger;
  }
}

module.exports = PatientService;
