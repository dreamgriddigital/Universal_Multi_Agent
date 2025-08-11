export default function Sidebar() {
  return (
    <div className="w-64 h-full bg-gray-900 text-white p-4">
      <h2 className="text-lg font-bold mb-4">Agents</h2>
      <ul className="space-y-2">
        <li className="cursor-pointer hover:text-blue-400">Multi Agent 1</li>
        <li className="cursor-pointer hover:text-blue-400">Multi Agent 2</li>
      </ul>
    </div>
  );
}