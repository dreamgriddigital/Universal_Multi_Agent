import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ChatArea from "@/components/ChatArea";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <ChatArea />
      </div>
    </div>
  );
}