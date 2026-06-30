import  Sidebar  from "../components/layout/Sidebar";
import  Header  from "../components/layout/Header";
import  ChatWindow  from "../components/chat/ChatWindow";

export default function ChatPage() {
    return (
        <div className="flex h-screen w-full bg-[] overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <ChatWindow />

            </div>

        </div>
    )
}