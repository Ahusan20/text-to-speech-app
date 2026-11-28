export default function UsageDashboard({ usage, dailyUsed, dailyLimit = 10, adminUsage, isAdmin = false }) {
  return (
    <section className="usage-dashboard" aria-label="Usage and analytics">
      <div className="usage-heading">
        <span>Usage today</span>
        <strong>{dailyUsed} / {dailyLimit}</strong>
      </div>
      <div className="usage-progress" aria-label={`${dailyUsed} of ${dailyLimit} daily generations used`}>
        <span style={{ width: `${Math.min(100, (dailyUsed / dailyLimit) * 100)}%` }} />
      </div>
      {usage && (
        <div className="usage-grid">
          <div><strong>{usage.total_requests || usage.totalRequests || 0}</strong><span>Cloud requests</span></div>
          <div><strong>{usage.successful_requests || usage.successfulRequests || 0}</strong><span>Successful</span></div>
          <div><strong>{usage.characters_generated || usage.charactersGenerated || 0}</strong><span>Characters</span></div>
        </div>
      )}
      {isAdmin && adminUsage && (
        <div className="admin-analytics">
          <strong>Admin analytics</strong>
          <span>{adminUsage.totalUsers || 0} users</span>
          <span>{adminUsage.totalRequests || 0} total requests</span>
          <span>{adminUsage.failedRequests || 0} failed</span>
        </div>
      )}
    </section>
  );
}
