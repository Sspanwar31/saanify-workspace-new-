export default function SettingsPage() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">System Settings</h1>
      <div className="bg-[#1e2337] rounded-3xl p-8 border border-white/5">
        <p className="text-gray-400">System settings panel ready. Features will include:</p>
        <ul className="mt-4 space-y-2 text-gray-300">
          <li>• User role and permission management</li>
          <li>• System configuration options</li>
          <li>• Security and authentication settings</li>
          <li>• Backup and recovery tools</li>
        </ul>
      </div>
    </div>
  );
}