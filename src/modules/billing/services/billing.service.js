// TODO: Implement Billing service methods
class BillingService {
  constructor({ billingRepository, logger }) {
    this.billingRepo = billingRepository;
    this.logger = logger;
  }
}

module.exports = BillingService;
