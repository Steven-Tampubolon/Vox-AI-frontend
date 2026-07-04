import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import { fadeVariants } from "../lib/motion";
import { motion } from "framer-motion";

export default function ChatPage() {
  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex h-screen w-full bg-[#2D2D30] overflow-hidden"
    >
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <ChatWindow />
        <ChatInput />
      </div>
    </motion.div>
  );
}