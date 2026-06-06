const createAuditMiddleware = ({ supabaseAdmin, logger }) => {
  return (resourceType) => {
    return (req, res, next) => {
      // Only audit mutating operations
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const originalJson = res.json.bind(res);

      res.json = function (body) {
        // Log audit entry after response is sent
        const auditEntry = {
          user_id: req.user?.id || null,
          action: `${resourceType}.${req.method.toLowerCase()}`,
          resource_type: resourceType,
          resource_id: req.params.id || body?.data?.id || null,
          old_data: req._auditOldData || null,
          new_data: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : null,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || null,
        };

        supabaseAdmin
          .from('audit_logs')
          .insert(auditEntry)
          .then(() => {
            logger.debug('Audit log created', { action: auditEntry.action, resourceId: auditEntry.resource_id });
          })
          .catch((err) => {
            logger.error('Failed to create audit log', { error: err.message });
          });

        return originalJson(body);
      };

      next();
    };
  };
};

module.exports = createAuditMiddleware;
