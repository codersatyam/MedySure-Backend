class HealthController {
  constructor({ supabaseAdmin, config }) {
    this.supabaseAdmin = supabaseAdmin;
    this.config = config;
  }

  // Liveness probe — confirms the server process is up and responding.
  // No external dependencies are checked, so it stays fast and only reflects
  // whether the server itself is live.
  liveness = (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.config.env,
    });
  };

  // Readiness probe — confirms the server can serve traffic by checking its
  // critical dependencies (the database). Returns 503 if a dependency is down.
  readiness = async (_req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.config.env,
      services: {
        database: 'unknown',
      },
    };

    try {
      const { error } = await this.supabaseAdmin.from('organizations').select('id').limit(1);
      health.services.database = error ? 'error' : 'ok';
    } catch {
      health.services.database = 'error';
    }

    const isHealthy = health.services.database === 'ok';
    health.status = isHealthy ? 'ok' : 'error';
    res.status(isHealthy ? 200 : 503).json(health);
  };
}

module.exports = HealthController;
