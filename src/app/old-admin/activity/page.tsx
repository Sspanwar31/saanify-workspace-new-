export default function ActivityPage() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Activity Monitor</h1>
      <div className="bg-[#1e2337] rounded-3xl p-8 border border-white/5">
        <p className="text-gray-400">Activity monitoring system ready. Features will include:</p>
        <ul className="mt-4 space-y-2 text-gray-300">
          <li>• Real-time user activity tracking</li>
          <li>• System performance monitoring</li>
          <li>• Audit logs and history</li>
          <li>• Alert and notification system</li>
        </ul>
      </div>
    </div>
  );
}